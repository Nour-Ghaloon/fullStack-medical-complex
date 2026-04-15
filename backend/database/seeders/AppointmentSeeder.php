<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use Illuminate\Database\Seeder;

class AppointmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $appointments = [
            [
                'patient_email' => 'sarah.ali@hospital.com',
                'doctor_email' => 'ahmed.hassan@hospital.com',
                'date' => '2026-01-15 09:00:00',
                'start_time' => '09:00:00',
                'end_time' => '09:30:00',
                'status' => 'completed',
                'notes' => 'Routine follow-up visit.',
            ],
            [
                'patient_email' => 'omar.nabil@hospital.com',
                'doctor_email' => 'fatima.mohammad@hospital.com',
                'date' => '2026-02-10 11:00:00',
                'start_time' => '11:00:00',
                'end_time' => '11:30:00',
                'status' => 'completed',
                'notes' => 'Migraine assessment.',
            ],
            [
                'patient_email' => 'mariam.farouk@hospital.com',
                'doctor_email' => 'ali.ibrahim@hospital.com',
                'date' => '2026-03-01 10:00:00',
                'start_time' => '10:00:00',
                'end_time' => '10:30:00',
                'status' => 'scheduled',
                'notes' => 'Knee pain evaluation.',
            ],
            [
                'patient_email' => 'sarah.ali@hospital.com',
                'doctor_email' => 'fatima.mohammad@hospital.com',
                'date' => '2026-03-03 14:00:00',
                'start_time' => '14:00:00',
                'end_time' => '14:30:00',
                'status' => 'scheduled',
                'notes' => 'Neurology follow-up.',
            ],
            [
                'patient_email' => 'omar.nabil@hospital.com',
                'doctor_email' => 'ali.ibrahim@hospital.com',
                'date' => '2026-02-14 15:00:00',
                'start_time' => '15:00:00',
                'end_time' => '15:30:00',
                'status' => 'canceled',
                'notes' => 'Canceled by patient.',
            ],
        ];

        foreach ($appointments as $appointmentData) {
            $patient = Patient::whereHas('user', function ($query) use ($appointmentData) {
                $query->where('email', $appointmentData['patient_email']);
            })->first();

            $doctor = Doctor::whereHas('user', function ($query) use ($appointmentData) {
                $query->where('email', $appointmentData['doctor_email']);
            })->first();

            if (!$patient || !$doctor) {
                continue;
            }

            Appointment::firstOrCreate(
                [
                    'patient_id' => $patient->id,
                    'doctor_id' => $doctor->id,
                    'date' => $appointmentData['date'],
                    'start_time' => $appointmentData['start_time'],
                    'end_time' => $appointmentData['end_time'],
                ],
                [
                    'status' => $appointmentData['status'],
                    'notes' => $appointmentData['notes'],
                ]
            );
        }
    }
}
