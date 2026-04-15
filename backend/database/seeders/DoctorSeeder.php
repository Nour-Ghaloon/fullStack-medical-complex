<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Doctor;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class DoctorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $doctorRole = Role::where('name', 'doctor')->where('guard_name', 'api')->first();

        $doctors = [
            [
                'user' => [
                    'name' => 'Dr. Ahmed Hassan',
                    'email' => 'ahmed.hassan@hospital.com',
                    'password' => Hash::make('123456789'),
                    'role' => 'doctor',
                ],
                'department_code' => 'CARD',
                'profile' => [
                    'specialization' => 'Cardiac Specialist',
                    'hire_date' => '2020-01-15',
                    'bio' => 'Experienced cardiologist with 10 years of practice',
                    'status' => 'active',
                    'phone' => '+20-123456789',
                    'address' => 'Cairo, Egypt',
                ],
            ],
            [
                'user' => [
                    'name' => 'Dr. Fatima Mohammad',
                    'email' => 'fatima.mohammad@hospital.com',
                    'password' => Hash::make('123456789'),
                    'role' => 'doctor',
                ],
                'department_code' => 'NEURO',
                'profile' => [
                    'specialization' => 'Neurologist',
                    'hire_date' => '2021-03-20',
                    'bio' => 'Specialized in neurology and brain disorders',
                    'status' => 'active',
                    'phone' => '+20-987654321',
                    'address' => 'Cairo, Egypt',
                ],
            ],
            [
                'user' => [
                    'name' => 'Dr. Ali Ibrahim',
                    'email' => 'ali.ibrahim@hospital.com',
                    'password' => Hash::make('123456789'),
                    'role' => 'doctor',
                ],
                'department_code' => 'ORTHO',
                'profile' => [
                    'specialization' => 'Orthopedic Surgeon',
                    'hire_date' => '2019-06-10',
                    'bio' => 'Expert in orthopedic surgery and bone disorders',
                    'status' => 'active',
                    'phone' => '+20-555555555',
                    'address' => 'Cairo, Egypt',
                ],
            ],
        ];

        foreach ($doctors as $doctorData) {
            $department = Department::where('code', $doctorData['department_code'])->first();

            if (!$department) {
                continue;
            }

            $user = User::firstOrCreate(
                ['email' => $doctorData['user']['email']],
                $doctorData['user']
            );

            if ($doctorRole) {
                $user->assignRole($doctorRole);
            }

            Doctor::firstOrCreate(
                ['user_id' => $user->id],
                array_merge(
                    ['department_id' => $department->id],
                    $doctorData['profile']
                )
            );
        }
    }
}
