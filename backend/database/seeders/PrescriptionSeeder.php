<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Medicine;
use App\Models\Prescription;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PrescriptionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $prescriptions = [
            [
                'appointment' => [
                    'patient_email' => 'sarah.ali@hospital.com',
                    'doctor_email' => 'ahmed.hassan@hospital.com',
                    'date' => '2026-01-15 09:00:00',
                    'start_time' => '09:00:00',
                ],
                'notes' => 'Start with low-dose cardiovascular support medication.',
                'prescribed_date' => '2026-01-15',
                'medicines' => [
                    ['name' => 'Aspirin 100mg', 'dosage' => '1 tablet daily', 'duration' => '30 days'],
                    ['name' => 'Atorvastatin 20mg', 'dosage' => '1 tablet nightly', 'duration' => '30 days'],
                ],
            ],
            [
                'appointment' => [
                    'patient_email' => 'omar.nabil@hospital.com',
                    'doctor_email' => 'fatima.mohammad@hospital.com',
                    'date' => '2026-02-10 11:00:00',
                    'start_time' => '11:00:00',
                ],
                'notes' => 'Acute migraine treatment plan.',
                'prescribed_date' => '2026-02-10',
                'medicines' => [
                    ['name' => 'Sumatriptan 50mg', 'dosage' => '1 tablet as needed', 'duration' => '10 days'],
                    ['name' => 'Ibuprofen 400mg', 'dosage' => '1 tablet after meals', 'duration' => '7 days'],
                ],
            ],
        ];

        foreach ($prescriptions as $prescriptionData) {
            $appointment = Appointment::where('date', $prescriptionData['appointment']['date'])
                ->where('start_time', $prescriptionData['appointment']['start_time'])
                ->whereHas('patient.user', function ($query) use ($prescriptionData) {
                    $query->where('email', $prescriptionData['appointment']['patient_email']);
                })
                ->whereHas('doctor.user', function ($query) use ($prescriptionData) {
                    $query->where('email', $prescriptionData['appointment']['doctor_email']);
                })
                ->first();

            if (!$appointment) {
                continue;
            }

            $prescription = Prescription::firstOrCreate(
                ['appointment_id' => $appointment->id],
                [
                    'notes' => $prescriptionData['notes'],
                    'prescribed_date' => $prescriptionData['prescribed_date'],
                ]
            );

            foreach ($prescriptionData['medicines'] as $medicineData) {
                $medicine = Medicine::where('name', $medicineData['name'])->first();

                if (!$medicine) {
                    continue;
                }

                $exists = DB::table('prescription_medicines')
                    ->where('prescription_id', $prescription->id)
                    ->where('medicine_id', $medicine->id)
                    ->exists();

                if ($exists) {
                    continue;
                }

                DB::table('prescription_medicines')->insert([
                    'prescription_id' => $prescription->id,
                    'medicine_id' => $medicine->id,
                    'dosage' => $medicineData['dosage'],
                    'duration' => $medicineData['duration'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
