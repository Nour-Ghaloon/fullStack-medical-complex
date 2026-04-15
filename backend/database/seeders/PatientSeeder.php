<?php

namespace Database\Seeders;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class PatientSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $patientRole = Role::where('name', 'patient')->where('guard_name', 'api')->first();

        $patients = [
            [
                'user' => [
                    'name' => 'Sarah Ali',
                    'email' => 'sarah.ali@hospital.com',
                    'password' => Hash::make('123456789'),
                    'role' => 'patient',
                ],
                'profile' => [
                    'date_of_birth' => '1995-04-12',
                    'gender' => 'female',
                    'phone' => '+20-1001112223',
                    'address' => 'Cairo, Egypt',
                    'blood_type' => 'A+',
                    'allergies' => 'Penicillin',
                    'chronic_diseases' => 'Mild hypertension',
                    'medical_history' => 'Regular follow-up since 2024.',
                    'status' => 'active',
                ],
            ],
            [
                'user' => [
                    'name' => 'Omar Nabil',
                    'email' => 'omar.nabil@hospital.com',
                    'password' => Hash::make('123456789'),
                    'role' => 'patient',
                ],
                'profile' => [
                    'date_of_birth' => '1988-11-03',
                    'gender' => 'male',
                    'phone' => '+20-1004445556',
                    'address' => 'Giza, Egypt',
                    'blood_type' => 'B+',
                    'allergies' => null,
                    'chronic_diseases' => 'Migraine',
                    'medical_history' => 'Intermittent headaches for 2 years.',
                    'status' => 'active',
                ],
            ],
            [
                'user' => [
                    'name' => 'Mariam Farouk',
                    'email' => 'mariam.farouk@hospital.com',
                    'password' => Hash::make('123456789'),
                    'role' => 'patient',
                ],
                'profile' => [
                    'date_of_birth' => '2000-07-21',
                    'gender' => 'female',
                    'phone' => '+20-1007778889',
                    'address' => 'Alexandria, Egypt',
                    'blood_type' => 'O+',
                    'allergies' => 'Dust',
                    'chronic_diseases' => null,
                    'medical_history' => 'No previous surgeries.',
                    'status' => 'active',
                ],
            ],
        ];

        foreach ($patients as $patientData) {
            $user = User::firstOrCreate(
                ['email' => $patientData['user']['email']],
                $patientData['user']
            );

            if ($patientRole) {
                $user->assignRole($patientRole);
            }

            Patient::firstOrCreate(
                ['user_id' => $user->id],
                $patientData['profile']
            );
        }
    }
}
