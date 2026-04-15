<?php

namespace App\Http\Controllers\Api\doctor;

use App\Http\Controllers\Controller;
use App\Http\Requests\PrescriptionStoreRequest;
use App\Models\Prescription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PrecriptionController extends Controller
{
    public function store(PrescriptionStoreRequest $request)
    {
        $user = Auth::user();
        if (!$user->hasRole('admin') && !$user->hasRole('doctor') && !$user->hasPermissionTo('create-prescriptions')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $validated = $request->validated();
        return \DB::transaction(function () use ($validated) {
            $prescription = Prescription::create([
                'appointment_id' => $validated['appointment_id'],
                'notes'          => $validated['notes'],
                'prescribed_date' => $validated['prescribed_date'],
            ]);
            $medicines = [];
            foreach ($validated['medicines'] as $item) {
                $medicines[$item['medicine_id']] = [
                    'dosage'      => $item['dosage'],
                    'duration'    => $item['duration']
                ];
            }
            $prescription->medicines()->syncWithoutDetaching($medicines);
            return response()->json(['message' => 'Prescription created successfully'], 201);
        });
    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();
        if (!$user->hasRole('admin') && !$user->hasRole('doctor') && !$user->hasPermissionTo('update-own-appointments')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $prescription = Prescription::with('appointment')->findOrFail($id);
        $this->authorize('update', $prescription);
        $prescription->update($request->only('notes'));

        $medicines = [];
        foreach ($request->medicines as $item) {
            $medicines[$item['medicine_id']] = [
                'dosage'   => $item['dosage'],
                'duration' => $item['duration']
            ];
        }
        $prescription->medicines()->sync($medicines);

        return response()->json(['message' => 'Prescription updated successfully']);
    }

    public function show($appointmentId)
    {
        $user = Auth::user();
        if (!$user->hasRole('admin') && !$user->hasRole('doctor') && !$user->hasPermissionTo('read-own-appointments')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $prescription = Prescription::with('medicines')
            ->where('appointment_id', $appointmentId)
            ->firstOrFail();

        return response()->json($prescription);
    }
    public function destroy($id)
    {
        $user = Auth::user();
        if (!$user->hasRole('admin') && !$user->hasRole('doctor') && !$user->hasPermissionTo('delete-own-appointments')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $prescription = Prescription::with('appointment')->findOrFail($id);
        $this->authorize('delete', $prescription);
        $prescription->medicines()->detach();
        $prescription->delete();

        return response()->json(['message' => 'Prescription deleted']);
    }
}
