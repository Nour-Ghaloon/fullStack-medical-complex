<?php

namespace App\Http\Controllers\Api\doctor;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Http\Resources\UserResource;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\MedicalRecord;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
class DoctorController extends Controller
{
    private function normalizeStatus(string $status): string
    {
        return $status === 'cancelled' ? 'canceled' : $status;
    }
    private function resolveDoctor(): ?Doctor
    {
        return auth()->user()?->doctor;
    }
    public function dashboard()
    {
        $user = Auth::user()->load('doctor');
        if (!$user->doctor) {
            return response()->json(['error' => 'هذا المستخدم ليس طبيباً'], 403);
        }

        $doctorId = $user->doctor->id;

        return response()->json([
            'today_appointments' =>
            Appointment::where('doctor_id', $doctorId)
                ->where('status', '!=', 'canceled')
                ->whereDate('date', today())->count(),

            'upcoming_appointments' =>
            Appointment::where('doctor_id', $doctorId)
                ->where('status', 'scheduled')
                ->whereDate('date', '>', today())->count(),

            'total_patients' =>
            Appointment::where('doctor_id', $doctorId)
                ->distinct('patient_id')->count(),
        ]);
    }

    public function todayAppointments()
    {
        $doctor = auth()->user()->doctor;

        if (!$doctor) {
            return response()->json(['error' => 'The user is not a doctor'], 403);
        }

        $appointments = $doctor->appointments()
            // ->with('patient')
            ->with(['doctor.user', 'patient.user'])
            ->whereDate('date', today())
            ->where('status', '!=', 'canceled')
            ->orderBy('start_time')
            ->get();

        return AppointmentResource::collection($appointments);
    }

    public function upcomingAppointments()
    {
        $doctor = auth()->user()->doctor;

        if (!$doctor) {
            return response()->json(['error' => 'The user is not a doctor'], 403);
        }
        $appointments = $doctor->appointments()
            ->where('doctor_id', $doctor->id)
            ->whereDate('date', '>', today())
            ->with(['doctor.user', 'patient.user'])
            ->where('status', 'scheduled')
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();

        return AppointmentResource::collection($appointments);
    }

    public function updateAppointment(Request $request, $id)
    {
        $appointment = Appointment::findOrFail($id);

        $this->authorize('update', $appointment);

        if ($appointment->status === 'completed') {
            return response()->json([
                'message' => 'Completed appointments cannot be edited.',
            ], 422);
        }

        $status = $this->normalizeStatus($request->string('status')->toString());

        if ($status === 'completed') {
            return response()->json([
                'message' => 'Use the complete endpoint to finalize visits with diagnosis details.',
            ], 422);
        }
        $appointment->update([
            'status' => $status
        ]);

        return response()->json(['message' => 'Appointment status updated successfully.']);
    }

    public function myPatients()
    {
        $doctorId = auth()->user()->doctor->id;

        $patients = Patient::whereIn('id', function ($query) use ($doctorId) {
            $query->select('patient_id')
                ->from('appointments')
                ->where('doctor_id', $doctorId);
        })->get();

        return UserResource::collection($patients);
    }
    public function reschedule(Request $request, $id)
    {
        $doctor = auth()->user()->doctor->id;
        $appointment = Appointment::where('doctor_id', $doctor)->findOrFail($id);
        $this->authorize('update', $appointment);

        $appointment->update([
            'date' => $request->date,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time
        ]);

        return response()->json(['message' => 'Rescheduled']);
    }

    public function complete(Request $request, $id)
    {
        $doctor = auth()->user()->doctor->id;
        if (! $doctor) {
            return response()->json(['message' => 'Doctor profile not found'], 403);
        }
        $appointment = Appointment::where('doctor_id', $doctor)->findOrFail($id);

        $this->authorize('update', $appointment);

        if ($appointment->status === 'canceled') {
            return response()->json([
                'message' => 'Canceled appointments cannot be completed.',
            ], 422);
        }

        $request->validate([
            'diagnosis' => 'sometimes|string',
            'notes' => 'nullable|string'
        ]);
        $appointment->update([
            'status' => 'completed',
            'diagnosis' => $request->diagnosis,
            'notes' => $request->notes
        ]);

        return response()->json(['message' => 'Appointment completed']);
    }

    public function medicalRecords()
    {
        $doctor = $this->resolveDoctor();
        if (! $doctor) {
            return response()->json([]);
        }

        $records = MedicalRecord::query()
            ->with(['patient.user', 'doctor.user'])
            ->where('doctor_id', $doctor->id)
            ->latest('visit_date')
            ->get();

        return response()->json($records);
    }
}
