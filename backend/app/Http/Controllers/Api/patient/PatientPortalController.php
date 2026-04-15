<?php

namespace App\Http\Controllers\Api\patient;

use App\Http\Controllers\Controller;
use App\Http\Requests\PatientBookAppointmentRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\DoctorHour;
use App\Models\MedicalRecord;
use App\Models\Patient;
use App\Models\Prescription;
use Carbon\Carbon;
use Illuminate\Http\Request;

class PatientPortalController extends Controller
{
    private function resolvePatient()
    {
        $user = auth()->user();
        if (! $user) {
            return null;
        }

        $patient = $user->patient;
        if ($patient) {
            return $patient;
        }

        return Patient::firstOrCreate(
            ['user_id' => $user->id],
            [
                'date_of_birth' => Carbon::today()->subYears(18)->toDateString(),
                'gender' => 'male',
                'status' => 'active',
            ]
        );
    }

    private function appointmentWithRelations(Appointment $appointment)
    {
        return $appointment->load(['doctor.user', 'patient.user']);
    }

    private function toMinutes(string $time): int
    {
        [$hours, $minutes] = explode(':', Carbon::parse($time)->format('H:i'));
        return ((int) $hours * 60) + (int) $minutes;
    }

    private function isCanceledStatus(string $status): bool
    {
        return $status === 'canceled' || $status === 'cancelled';
    }

    private function hasDoctorSchedulingConflict(int $doctorId, string $date, string $startTime, string $endTime)
    {
        return Appointment::query()
            ->forDoctor($doctorId)
            ->whereDate('date', $date)
            ->where('status', '!=', 'canceled')
            ->where('start_time', '<', $endTime)
            ->where('end_time', '>', $startTime)
            ->exists();
    }

    private function hasPatientSchedulingConflict(int $patientId, string $date, string $startTime, string $endTime)
    {
        return Appointment::query()
            ->forPatient($patientId)
            ->whereDate('date', $date)
            ->where('status', '!=', 'canceled')
            ->where('start_time', '<', $endTime)
            ->where('end_time', '>', $startTime)
            ->exists();
    }

    private function isWithinWorkingHours(Doctor $doctor, string $date, string $startTime, string $endTime)
    {
        $dayOfWeek = strtolower(Carbon::parse($date)->format('l'));
        $workingHours = DoctorHour::query()
            ->where('doctor_id', $doctor->id)
            ->where('day_of_week', $dayOfWeek)
            ->first();

        if (! $workingHours) {
            return true;
        }

        $start = $this->toMinutes($startTime);
        $end = $this->toMinutes($endTime);
        $workStart = $this->toMinutes($workingHours->start_time);
        $workEnd = $this->toMinutes($workingHours->end_time);

        return $start >= $workStart && $end <= $workEnd;
    }

    public function dashboard()
    {
        $patient = $this->resolvePatient();

        if (! $patient) {
            return response()->json([
                'upcoming_appointments' => 0,
                'completed_appointments' => 0,
                'canceled_appointments' => 0,
                'medical_records' => 0,
                'active_prescriptions' => 0,
                'needs_profile_setup' => true,
            ]);
        }

        $today = Carbon::today();

        $baseAppointmentQuery = Appointment::query()->forPatient($patient->id);

        return response()->json([
            'upcoming_appointments' => (clone $baseAppointmentQuery)
                ->where('status', 'scheduled')
                ->whereDate('date', '>=', $today)
                ->count(),
            'completed_appointments' => (clone $baseAppointmentQuery)
                ->where('status', 'completed')
                ->count(),
            'canceled_appointments' => (clone $baseAppointmentQuery)
                ->where('status', 'canceled')
                ->count(),
            'medical_records' => MedicalRecord::query()
                ->where('patient_id', $patient->id)
                ->count(),
            'active_prescriptions' => Prescription::query()
                ->whereHas('appointment', function ($query) use ($patient) {
                    $query->forPatient($patient->id)->where('status', 'scheduled');
                })
                ->count(),
        ]);
    }

    public function appointments()
    {
        $patient = $this->resolvePatient();

        if (! $patient) {
            return AppointmentResource::collection(collect());
        }

        $appointments = Appointment::query()
            ->forPatient($patient->id)
            ->with(['doctor.user', 'patient.user'])
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();

        return AppointmentResource::collection($appointments);
    }

    public function bookAppointment(PatientBookAppointmentRequest $request)
    {
        $patient = $this->resolvePatient();
        if (! $patient) {
            return response()->json(['message' => 'Patient profile not found'], 403);
        }

        $doctor = Doctor::findOrFail((int) $request->doctor_id);

        $date = $request->string('date')->toString();
        $startTime = $request->string('start_time')->toString();
        $endTime = $request->string('end_time')->toString();

        if (! $this->isWithinWorkingHours($doctor, $date, $startTime, $endTime)) {
            return response()->json([
                'message' => 'The selected time is outside the doctor working hours.',
            ], 422);
        }

        if ($this->hasDoctorSchedulingConflict($doctor->id, $date, $startTime, $endTime)) {
            return response()->json([
                'message' => 'Doctor is not available during the selected time.',
            ], 422);
        }

        if ($this->hasPatientSchedulingConflict($patient->id, $date, $startTime, $endTime)) {
            return response()->json([
                'message' => 'You already have another appointment in the selected time range.',
            ], 422);
        }

        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'date' => $date,
            'start_time' => $startTime,
            'end_time' => $endTime,
            'status' => 'scheduled',
            'notes' => $request->filled('notes') ? $request->notes : null,
        ]);

        return response()->json([
            'message' => 'Appointment booked successfully.',
            'data' => new AppointmentResource($this->appointmentWithRelations($appointment)),
        ], 201);
    }

    public function cancelAppointment(string $id)
    {
        $patient = $this->resolvePatient();
        if (! $patient) {
            return response()->json(['message' => 'Patient profile not found'], 403);
        }

        $appointment = Appointment::query()
            ->forPatient($patient->id)
            ->findOrFail($id);

        if ($appointment->status === 'completed') {
            return response()->json([
                'message' => 'Completed appointments cannot be canceled.',
            ], 422);
        }

        if ($this->isCanceledStatus($appointment->status)) {
            return response()->json([
                'message' => 'Appointment is already canceled.',
            ], 422);
        }

        $appointment->update([
            'status' => 'canceled',
        ]);

        return response()->json([
            'message' => 'Appointment canceled successfully.',
            'data' => new AppointmentResource($this->appointmentWithRelations($appointment)),
        ]);
    }

    public function medicalRecords()
    {
        $patient = $this->resolvePatient();
        if (! $patient) {
            return response()->json([]);
        }

        $records = MedicalRecord::query()
            ->with(['patient.user', 'doctor.user'])
            ->where('patient_id', $patient->id)
            ->latest('visit_date')
            ->get();

        return response()->json($records);
    }

    public function prescriptions()
    {
        $patient = $this->resolvePatient();
        if (! $patient) {
            return response()->json([]);
        }

        $prescriptions = Prescription::query()
            ->with(['appointment.patient.user', 'appointment.doctor.user', 'medicines'])
            ->whereHas('appointment', fn($query) => $query->forPatient($patient->id))
            ->latest('prescribed_date')
            ->get();

        return response()->json($prescriptions);
    }

    public function doctors()
    {
        $doctors = Doctor::query()
            ->with(['user:id,name', 'department:id,name'])
            ->where('status', 'active')
            ->orderBy('id')
            ->get()
            ->map(function (Doctor $doctor) {
                return [
                    'id' => $doctor->id,
                    'name' => $doctor->user?->name,
                    'specialization' => $doctor->specialization,
                    'department' => $doctor->department?->name,
                ];
            });

        return response()->json($doctors);
    }

    public function availability(Request $request, string $doctorId)
    {
        $request->validate([
            'date' => 'required|date',
            'duration' => 'nullable|integer|min:10|max:120',
        ]);

        $doctor = Doctor::findOrFail($doctorId);

        $date = Carbon::parse($request->date);
        $dayName = strtolower($date->format('l'));
        $duration = (int) $request->input('duration', 30);

        $workingHours = DoctorHour::query()
            ->where('doctor_id', $doctor->id)
            ->where('day_of_week', $dayName)
            ->first();

        if (! $workingHours) {
            return response()->json([
                'date' => $date->toDateString(),
                'day' => $dayName,
                'session_duration' => $duration,
                'available_slots' => [],
            ]);
        }

        $start = Carbon::parse($workingHours->start_time);
        $end = Carbon::parse($workingHours->end_time);

        $availableSlots = [];
        while ($start->copy()->addMinutes($duration) <= $end) {
            $availableSlots[] = $start->format('H:i');
            $start->addMinutes($duration);
        }

        $bookedSlots = Appointment::query()
            ->forDoctor($doctor->id)
            ->whereDate('date', $date->toDateString())
            ->where('status', '!=', 'canceled')
            ->pluck('start_time')
            ->map(fn($time) => Carbon::parse($time)->format('H:i'))
            ->toArray();

        $freeSlots = array_values(array_diff($availableSlots, $bookedSlots));

        return response()->json([
            'date' => $date->toDateString(),
            'day' => $dayName,
            'session_duration' => $duration,
            'available_slots' => $freeSlots,
        ]);
    }
}
