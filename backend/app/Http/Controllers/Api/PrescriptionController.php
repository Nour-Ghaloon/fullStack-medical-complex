<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Prescription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PrescriptionController extends Controller
{
    private function prescriptionRelations(): array
    {
        return [
            'appointment.patient.user',
            'appointment.doctor.user',
            'medicines',
        ];
    }

    private function normalizeAppointmentStatus(?string $status): ?string
    {
        if (! $status) {
            return null;
        }

        if ($status === 'active') {
            return 'scheduled';
        }

        if ($status === 'completed') {
            return 'completed';
        }

        if ($status === 'cancelled') {
            return 'canceled';
        }

        return null;
    }

    private function userDoctorId(): ?int
    {
        return Auth::user()?->doctor?->id;
    }

    private function isAdmin(): bool
    {
        $user = Auth::user();
        return (bool) $user && ($user->hasRole('admin') || $user->role === 'admin');
    }

    private function ensureDoctorOwnsAppointment(Appointment $appointment): void
    {
        if ($this->isAdmin()) {
            return;
        }

        $doctorId = $this->userDoctorId();
        if (! $doctorId || $appointment->doctor_id !== $doctorId) {
            abort(403, 'Forbidden');
        }
    }

    public function index()
    {
        $this->authorize('viewAny', Prescription::class);

        $query = Prescription::query()
            ->with($this->prescriptionRelations())
            ->latest();

        if (! $this->isAdmin()) {
            $doctorId = $this->userDoctorId();
            $query->whereHas('appointment', fn ($appointments) => $appointments->where('doctor_id', $doctorId));
        }

        return $query->get();
    }

    public function show($id)
    {
        $prescription = Prescription::with($this->prescriptionRelations())->findOrFail($id);
        $this->authorize('view', $prescription);

        return $prescription;
    }

    public function store(Request $request)
    {
        $this->authorize('create', Prescription::class);

        $validated = $request->validate([
            'appointment_id' => 'required|exists:appointments,id|unique:prescriptions,appointment_id',
            'prescribed_date' => 'required|date',
            'notes' => 'nullable|string|max:1000',
            'status' => 'nullable|in:active,completed,cancelled',
            'medicines' => 'required|array|min:1',
            'medicines.*.medicine_id' => 'required|exists:medicines,id',
            'medicines.*.dosage' => 'required|string|max:255',
            'medicines.*.duration' => 'required|string|max:255',
        ]);

        $appointment = Appointment::findOrFail($validated['appointment_id']);
        $this->ensureDoctorOwnsAppointment($appointment);

        $prescription = DB::transaction(function () use ($validated, $appointment) {
            $prescription = Prescription::create([
                'appointment_id' => $appointment->id,
                'notes' => $validated['notes'] ?? null,
                'prescribed_date' => $validated['prescribed_date'],
            ]);

            $medicines = [];
            foreach ($validated['medicines'] as $item) {
                $medicines[$item['medicine_id']] = [
                    'dosage' => $item['dosage'],
                    'duration' => $item['duration'],
                ];
            }
            $prescription->medicines()->sync($medicines);

            $appointmentStatus = $this->normalizeAppointmentStatus($validated['status'] ?? null);
            if ($appointmentStatus) {
                $prescription->appointment()->update([
                    'status' => $appointmentStatus,
                ]);
            }

            return $prescription->load($this->prescriptionRelations());
        });

        return response()->json($prescription, 201);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'appointment_id' => 'sometimes|exists:appointments,id|unique:prescriptions,appointment_id,' . $id,
            'prescribed_date' => 'sometimes|date',
            'notes' => 'nullable|string|max:1000',
            'status' => 'sometimes|in:active,completed,cancelled',
            'medicines' => 'sometimes|array|min:1',
            'medicines.*.medicine_id' => 'required_with:medicines|exists:medicines,id',
            'medicines.*.dosage' => 'required_with:medicines|string|max:255',
            'medicines.*.duration' => 'required_with:medicines|string|max:255',
        ]);

        $prescription = DB::transaction(function () use ($validated, $id) {
            $prescription = Prescription::with('appointment')->findOrFail($id);
            $this->authorize('update', $prescription);

            if (array_key_exists('appointment_id', $validated)) {
                $newAppointment = Appointment::findOrFail($validated['appointment_id']);
                $this->ensureDoctorOwnsAppointment($newAppointment);
            } else {
                $this->ensureDoctorOwnsAppointment($prescription->appointment);
            }

            $prescription->update([
                'appointment_id' => $validated['appointment_id'] ?? $prescription->appointment_id,
                'prescribed_date' => $validated['prescribed_date'] ?? $prescription->prescribed_date,
                'notes' => array_key_exists('notes', $validated) ? $validated['notes'] : $prescription->notes,
            ]);

            if (array_key_exists('medicines', $validated)) {
                $medicines = [];
                foreach ($validated['medicines'] as $item) {
                    $medicines[$item['medicine_id']] = [
                        'dosage' => $item['dosage'],
                        'duration' => $item['duration'],
                    ];
                }
                $prescription->medicines()->sync($medicines);
            }

            if (array_key_exists('status', $validated)) {
                $appointmentStatus = $this->normalizeAppointmentStatus($validated['status']);
                if ($appointmentStatus) {
                    $prescription->appointment()->update([
                        'status' => $appointmentStatus,
                    ]);
                }
            }

            return $prescription->load($this->prescriptionRelations());
        });

        return response()->json($prescription);
    }

    public function destroy($id)
    {
        $prescription = Prescription::with('appointment')->findOrFail($id);
        $this->authorize('delete', $prescription);
        $this->ensureDoctorOwnsAppointment($prescription->appointment);

        $prescription->medicines()->detach();
        $prescription->delete();

        return response()->json([
            'message' => 'Prescription deleted successfully',
        ]);
    }
}
