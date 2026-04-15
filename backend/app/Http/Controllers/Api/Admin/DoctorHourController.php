<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\DoctorHour;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DoctorHourController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index($doctorId)
    {
        $user = Auth::user();
        if (!$user->hasPermissionTo('manage-doctor-hours') || !$user->hasRole('admin')) {
            return response()->json(DoctorHour::where('doctor_id', $doctorId)->get());
        }
        $hours = DoctorHour::where('doctor_id', $doctorId)->get();
        return response()->json(['data' => $hours]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        if (!$user->hasPermissionTo('manage-doctor-hours') || !$user->hasRole('admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'doctor_id'   => 'required|exists:doctors,id',
            'day_of_week' => 'required|in:saturday,sunday,monday,tuesday,wednesday,thursday,friday',
            'start_time'  => 'required|date_format:H:i',
            'end_time'    => 'required|date_format:H:i|after:start_time',
        ]);

        // استخدام updateOrCreate يجعل الكود أكثر مرونة
        $availability = DoctorHour::updateOrCreate(
            [
                'doctor_id'   => $request->doctor_id,
                'day_of_week' => $request->day_of_week,
            ],
            [
                'start_time' => $request->start_time,
                'end_time'   => $request->end_time,
            ]
        );

        return response()->json($availability, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = Auth::user();

        if (!$user->hasPermissionTo('manage-doctor-hours') || !$user->hasRole('admin')) {
            return response()->json(['message' => 'Unauthorized: You do not have permission to create paths'], 403);
        }
        $availability = DoctorHour::findOrFail($id);

        $request->validate([
            'start_time' => 'required|date_format:H:i',
            'end_time'   => 'required|date_format:H:i|after:start_time',
        ]);

        $availability->update($request->only(['start_time', 'end_time']));

        return response()->json($availability);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = Auth::user();

        if (!$user->hasPermissionTo('manage-doctor-hours') || !$user->hasRole('admin')) {
            return response()->json(['message' => 'Unauthorized: You do not have permission to create paths'], 403);
        }
        DoctorHour::findOrFail($id)->delete();

        return response()->json(['message' => 'updated successfully',]);
    }

    // DoctorHourController.php

    public function availability(Request $request, $id)
    {
        $user = Auth::user();
        if (!$user->hasRole('admin') && !$user->hasPermissionTo('view-doctor-hours')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'date' => 'required|date',
        ]);

        $doctor = Doctor::findOrFail($id);
        $date = Carbon::parse($request->date);
        $dayName = strtolower($date->format('l'));

        $workingHours = DoctorHour::where('doctor_id', $doctor->id)
            ->where('day_of_week', $dayName)
            ->first();

        if (!$workingHours) {
            return response()->json(['message' => 'Doctor not available on this day', 'available_slots' => []], 200);
        }

        $duration = 30;
        $start = Carbon::parse($workingHours->start_time);
        $end = Carbon::parse($workingHours->end_time);
        $allSlots = [];

        while ($start->copy()->addMinutes($duration) <= $end) {
            $allSlots[] = $start->format('H:i');
            $start->addMinutes($duration);
        }

        $bookedSlots = Appointment::where('doctor_id', $doctor->id)
            ->whereDate('date', $date)
            ->get(['start_time']) // جلب الحقل
            ->map(fn($app) => Carbon::parse($app->start_time)->format('H:i'))
            ->toArray();

        $freeSlots = array_values(array_diff($allSlots, $bookedSlots));

        return response()->json([
            'doctor_name' => $doctor->name,
            'date' => $request->date,
            'day' => $dayName,
            'available_slots' => $freeSlots
        ]);
    }
}
