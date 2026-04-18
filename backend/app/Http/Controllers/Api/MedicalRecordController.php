<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MedicalRecord;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MedicalRecordController extends Controller
{
    public function index()
    {
        return MedicalRecord::with(['patient.user', 'doctor.user'])
            ->latest()
            ->get();
    }

public function store(Request $request)
{
    $user = Auth::user();
    $doctorId = $user->doctor?->id;

    if (!$doctorId && !$user->hasRole('admin')) {
        return response()->json(['message' => 'Unauthorized or Doctor profile not found'], 403);
    }

    $validated = $request->validate([
        'patient_id' => 'required|exists:patients,id',
        'visit_date' => 'required|date',
        'diagnosis' => 'nullable|string',
        'notes' => 'nullable|string',
    ]);

    $validated['doctor_id'] = $doctorId;

    $record = MedicalRecord::create($validated);
    return response()->json($record->load(['patient.user', 'doctor.user']), 201);
}

    public function show($id)
    {
        return MedicalRecord::with(['patient.user', 'doctor.user'])->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'patient_id' => 'sometimes|exists:patients,id',
            'doctor_id' => 'sometimes|exists:doctors,id',
            'visit_date' => 'sometimes|date',
            'diagnosis' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $record = MedicalRecord::findOrFail($id);
        $record->update($validated);

        return response()->json($record->load(['patient.user', 'doctor.user']));
    }

    public function destroy($id)
    {
        $record = MedicalRecord::findOrFail($id);
        $record->delete();

        return response()->json([
            'message' => 'Medical record deleted successfully',
        ]);
    }
}
