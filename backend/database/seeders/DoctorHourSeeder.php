<?php

namespace Database\Seeders;

use App\Models\Doctor;
use Illuminate\Database\Seeder;

class DoctorHourSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $workingHours = [
            [
                'doctor_email' => 'ahmed.hassan@hospital.com',
                'hours' => [
                    ['day_of_week' => 'sunday', 'start_time' => '09:00', 'end_time' => '13:00'],
                    ['day_of_week' => 'tuesday', 'start_time' => '09:00', 'end_time' => '13:00'],
                    ['day_of_week' => 'thursday', 'start_time' => '09:00', 'end_time' => '13:00'],
                ],
            ],
            [
                'doctor_email' => 'fatima.mohammad@hospital.com',
                'hours' => [
                    ['day_of_week' => 'monday', 'start_time' => '10:00', 'end_time' => '14:00'],
                    ['day_of_week' => 'wednesday', 'start_time' => '10:00', 'end_time' => '14:00'],
                ],
            ],
            [
                'doctor_email' => 'ali.ibrahim@hospital.com',
                'hours' => [
                    ['day_of_week' => 'sunday', 'start_time' => '12:00', 'end_time' => '16:00'],
                    ['day_of_week' => 'tuesday', 'start_time' => '12:00', 'end_time' => '16:00'],
                    ['day_of_week' => 'thursday', 'start_time' => '12:00', 'end_time' => '16:00'],
                ],
            ],
        ];

        foreach ($workingHours as $doctorData) {
            $doctor = Doctor::whereHas('user', function ($query) use ($doctorData) {
                $query->where('email', $doctorData['doctor_email']);
            })->first();

            if (!$doctor) {
                continue;
            }

            foreach ($doctorData['hours'] as $hour) {
                $doctor->workingHours()->firstOrCreate(
                    [
                        'day_of_week' => $hour['day_of_week'],
                    ],
                    [
                        'start_time' => $hour['start_time'],
                        'end_time' => $hour['end_time'],
                    ]
                );
            }
        }
    }
}
