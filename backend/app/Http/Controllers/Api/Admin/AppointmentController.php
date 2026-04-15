<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AppointmentStoreRequest;
use App\Http\Requests\AppointmentUpdateRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\DoctorHour;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

class AppointmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = Auth::user();

        $query = Appointment::with(['doctor.user', 'patient.user']);

        if ($user->hasRole('doctor')) {
            $query->where('doctor_id', $user->doctor->id);
        }

        $appointments = $query->get();

        return AppointmentResource::collection($appointments);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(AppointmentStoreRequest $request)
    {
        $user = Auth::user();

        if (!$user->hasRole(['admin', 'doctor']) && !$user->hasPermissionTo('create-appointments')) {
            return response()->json(['message' => 'Unauthorized: You cannot create appointments'], 403);
        }
        $startTime = Carbon::parse($request->date . ' ' . $request->start_time);
        $endTime   = $startTime->copy()->addMinutes(30);
        $exists = Appointment::where('doctor_id', $request->doctor_id)
            ->where('date', $request->date)
            ->where(function ($query) use ($startTime, $endTime) {
                $query->whereBetween('start_time', [$startTime->format('H:i'), $endTime->subMinute()->format('H:i')])
                    ->orWhereBetween('end_time', [$startTime->addMinute()->format('H:i'), $endTime->format('H:i')]);
            })->exists();

        if ($exists) {
            return response()->json(['message' => 'Doctor is already booked in this time range'], 422);
        }
        $appointment = Appointment::create([
            'doctor_id' => $request->doctor_id,
            'patient_id' => $request->patient_id,
            'date' => $request->date,
            'start_time' => $request->start_time, // القادم من الطلب
            'end_time'   => $endTime->format('H:i'),
            'notes' => $request->notes,
        ]);

        return response()->json([
            'message' => 'Appointment created successfully',
            'data' => $appointment
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        return new AppointmentResource(
            Appointment::with(['doctor.user', 'patient.user'])->findOrFail($id)
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(AppointmentUpdateRequest $request, string $id)
    {
        $user = Auth::user();
        $appointment = Appointment::findOrFail($id);

        $isOwner = $user->hasRole('doctor') && $appointment->doctor_id == $user->doctor?->id;
        $isAdmin = $user->hasRole('admin');

        if (!$isAdmin && !$isOwner) {
            return response()->json(['message' => 'Unauthorized to update this appointment'], 403);
        }

        $validatedData = $request->validated();

        if (isset($validatedData['status']) && $validatedData['status'] === 'cancelled') {
            $validatedData['status'] = 'canceled';
        }

        $checkDate = $request->date ?? $appointment->date;
        $checkStart = $request->start_time ?? $appointment->start_time;
        $checkEnd = $request->end_time ?? $appointment->end_time;

        if ($request->hasAny(['date', 'start_time', 'end_time'])) {
            $conflict = Appointment::where('doctor_id', $appointment->doctor_id)
                ->where('date', $checkDate)
                ->where('id', '!=', $appointment->id)
                ->where('start_time', '<', $checkEnd)
                ->where('end_time', '>', $checkStart)
                ->exists();

            if ($conflict) {
                return response()->json(['message' => 'Doctor is not available at this time'], 422);
            }
        }

        $appointment->update($validatedData);

        return response()->json([
            'message' => 'Appointment updated successfully',
            'data' => $appointment
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = Auth::user();

        if (!$user->hasRole(['admin', 'doctor']) && !$user->hasPermissionTo('delete-appointments')) {
            return response()->json(['message' => 'Unauthorized: You cannot create appointments'], 403);
        }
        $appointment = Appointment::findOrFail($id);
        $appointment->delete();

        return response()->json([
            'message' => 'Appointment deleted successfully'
        ]);
    }

}
