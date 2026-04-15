<?php

namespace App\Policies;

use App\Models\Prescription;
use App\Models\User;

class PrescriptionPolicy
{
    public function viewAny(User $user): bool
    {
        if ($user->hasRole('admin') || $user->role === 'admin') {
            return true;
        }

        return $user->hasRole('doctor') || $user->role === 'doctor';
    }

    public function view(User $user, Prescription $prescription): bool
    {
        if ($user->hasRole('admin') || $user->role === 'admin') {
            return true;
        }

        return $user->doctor?->id === $prescription->appointment?->doctor_id;
    }

    public function create(User $user): bool
    {
        if ($user->hasRole('admin') || $user->role === 'admin') {
            return true;
        }

        return $user->hasRole('doctor') || $user->role === 'doctor';
    }

    public function update(User $user, Prescription $prescription): bool
    {
        if ($user->hasRole('admin') || $user->role === 'admin') {
            return true;
        }

        $doctorId = $user->doctor?->id;
        return $doctorId === $prescription->appointment?->doctor_id;
    }

    public function delete(User $user, Prescription $prescription): bool
    {
        if ($user->hasRole('admin') || $user->role === 'admin') {
            return true;
        }

        return $user->doctor?->id === $prescription->appointment?->doctor_id;
    }

    public function restore(User $user, Prescription $prescription): bool
    {
        return $user->hasRole('admin') || $user->role === 'admin';
    }

    public function forceDelete(User $user, Prescription $prescription): bool
    {
        return $user->hasRole('admin') || $user->role === 'admin';
    }
}
