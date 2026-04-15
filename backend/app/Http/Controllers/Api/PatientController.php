<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    public function index()
    {
        return Patient::with('user')->latest()->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id|unique:patients,user_id',
            'date_of_birth' => 'required|date',
            'gender' => 'required|in:male,female',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'blood_type' => 'nullable|string',
            'allergies' => 'nullable|string',
            'chronic_diseases' => 'nullable|string',
            'medical_history' => 'nullable|string',
            'status' => 'in:active,inactive'
        ]);

        $user = User::findOrFail($request->user_id);
        if (!$user->hasRole('patient')) {
            return response()->json([
                'message' => 'The selected user must have a patient role.'
            ], 422);
        }
        $patient = Patient::create($validated);

        return response()->json($patient->load('user'), 201);
    }

    public function show($id)
    {
        return Patient::with('user')->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $patient = Patient::findOrFail($id);

        $validated = $request->validate([
            'date_of_birth' => 'date',
            'gender' => 'in:male,female',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'blood_type' => 'nullable|string',
            'allergies' => 'nullable|string',
            'chronic_diseases' => 'nullable|string',
            'medical_history' => 'nullable|string',
            'status' => 'in:active,inactive'
        ]);

        $patient->update($validated);

        return response()->json($patient->load('user'));
    }

    public function destroy($id)
    {
        $patient = Patient::findOrFail($id);
        $patient->delete();

        return response()->json(['message' => 'Patient deleted successfully']);
    }
}
