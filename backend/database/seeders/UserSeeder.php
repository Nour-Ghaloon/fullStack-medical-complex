<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $adminRole = Role::where('name', 'admin')->where('guard_name', 'api')->first();
        $doctorRole = Role::where('name', 'doctor')->where('guard_name', 'api')->first();
        $patientRole = Role::where('name', 'patient')->where('guard_name', 'api')->first();
        $admin = User::firstOrCreate([
            'email' => 'admin@example.com',
        ], [
            'name' => 'Admin User',
            'password' => Hash::make('123456'),
            'role' => 'admin',
        ]);
        if ($adminRole) {
            $admin->assignRole($adminRole);
        }

        $doctor = User::firstOrCreate([
            'email' => 'doctor@example.com',
        ], [
            'name' => 'Dr. Smith',
            'password' => Hash::make('123456'),
            'role' => 'doctor',
        ]);
        if ($doctorRole) {
            $doctor->assignRole($doctorRole);
        }

        $patient = User::firstOrCreate([
            'email' => 'patient@example.com',
        ], [
            'name' => 'Patient User',
            'password' => Hash::make('123456'),
            'role' => 'patient',
        ]);
        if ($patientRole) {
            $patient->assignRole($patientRole);
        }
    }
}
