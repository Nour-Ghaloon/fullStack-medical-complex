<?php

namespace Database\Seeders;

use App\Models\Doctor;
use App\Models\MedicalRecord;
use App\Models\Patient;
use Illuminate\Database\Seeder;

class MedicalRecordSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $records = [
            [
                'patient_email' => 'sarah.ali@hospital.com',
                'doctor_email' => 'ahmed.hassan@hospital.com',
                'visit_date' => '2026-01-15',
                'diagnosis' => 'Mild hypertension',
                'notes' => 'Continue diet control and regular activity.',
            ],
            [
                'patient_email' => 'omar.nabil@hospital.com',
                'doctor_email' => 'fatima.mohammad@hospital.com',
                'visit_date' => '2026-02-10',
                'diagnosis' => 'Migraine without aura',
                'notes' => 'Monitor triggers and hydration.',
            ],
        ];

        foreach ($records as $recordData) {
            $patient = Patient::whereHas('user', function ($query) use ($recordData) {
                $query->where('email', $recordData['patient_email']);
            })->first();

            $doctor = Doctor::whereHas('user', function ($query) use ($recordData) {
                $query->where('email', $recordData['doctor_email']);
            })->first();

            if (!$patient || !$doctor) {
                continue;
            }

            MedicalRecord::firstOrCreate(
                [
                    'patient_id' => $patient->id,
                    'doctor_id' => $doctor->id,
                    'visit_date' => $recordData['visit_date'],
                    'diagnosis' => $recordData['diagnosis'],
                ],
                [
                    'notes' => $recordData['notes'],
                ]
            );
        }
    }
}
