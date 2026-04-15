<?php

namespace App\Policies;

use App\Models\Appointment;
use App\Models\User;

class AppointmentPolicy
{
    public function viewAny(User $user): bool
    {
        if ($user->hasRole('admin') || $user->role === 'admin') {
            return true;
        }

        return $user->hasRole('doctor') || $user->role === 'doctor';
    }

    public function view(User $user, Appointment $appointment): bool
    {
        if ($user->hasRole('admin') || $user->role === 'admin') {
            return true;
        }

        return $user->doctor?->id === $appointment->doctor_id;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('admin') || $user->role === 'admin';
    }

    public function update(User $user, Appointment $appointment): bool
    {
        if ($user->hasRole('admin') || $user->role === 'admin') {
            return true;
        }

        return $user->doctor?->id === $appointment->doctor_id;
    }

    public function delete(User $user, Appointment $appointment): bool
    {
        return $user->hasRole('admin') || $user->role === 'admin';
    }

    public function restore(User $user, Appointment $appointment): bool
    {
        return $user->hasRole('admin') || $user->role === 'admin';
    }

    public function forceDelete(User $user, Appointment $appointment): bool
    {
        return $user->hasRole('admin') || $user->role === 'admin';
    }
}
