<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDoctorRequest;
use App\Http\Requests\UpdateDoctorRequest;
use App\Models\Doctor;
use Illuminate\Http\Request;

class DoctorController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->query('per_page', 50);
        $perPage = $perPage > 0 ? min($perPage, 200) : 50;

        return response()->json([
            'data' => Doctor::with(['department', 'user'])
                ->latest()
                ->paginate($perPage)
        ]);
    }

    public function store(StoreDoctorRequest $request)
    {
        $doctor = Doctor::create($request->validated());

        return response()->json([
            'data' => $doctor->load(['department', 'user'])
        ], 201);
    }

    public function show(Doctor $doctor)
    {
        return response()->json([
            'data' => $doctor->load(['department', 'user'])
        ]);
    }

    public function update(UpdateDoctorRequest $request, Doctor $doctor)
    {
        $doctor->update($request->validated());

        return response()->json([
            'data' => $doctor->load(['department', 'user'])
        ]);
    }

    public function destroy(Doctor $doctor)
    {
        $doctor->delete();

        return response()->noContent();
    }
}
