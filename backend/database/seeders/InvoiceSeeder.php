<?php

namespace Database\Seeders;

use App\Models\Appointment;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InvoiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $invoices = [
            [
                'appointment' => [
                    'patient_email' => 'sarah.ali@hospital.com',
                    'doctor_email' => 'ahmed.hassan@hospital.com',
                    'date' => '2026-01-15 09:00:00',
                    'start_time' => '09:00:00',
                ],
                'invoice_date' => '2026-01-15',
                'total_amount' => 320.00,
                'status' => 'paid',
            ],
            [
                'appointment' => [
                    'patient_email' => 'omar.nabil@hospital.com',
                    'doctor_email' => 'fatima.mohammad@hospital.com',
                    'date' => '2026-02-10 11:00:00',
                    'start_time' => '11:00:00',
                ],
                'invoice_date' => '2026-02-10',
                'total_amount' => 520.00,
                'status' => 'unpaid',
            ],
        ];

        foreach ($invoices as $invoiceData) {
            $appointment = Appointment::where('date', $invoiceData['appointment']['date'])
                ->where('start_time', $invoiceData['appointment']['start_time'])
                ->whereHas('patient.user', function ($query) use ($invoiceData) {
                    $query->where('email', $invoiceData['appointment']['patient_email']);
                })
                ->whereHas('doctor.user', function ($query) use ($invoiceData) {
                    $query->where('email', $invoiceData['appointment']['doctor_email']);
                })
                ->first();

            if (!$appointment) {
                continue;
            }

            $exists = DB::table('invoices')
                ->where('appointment_id', $appointment->id)
                ->exists();

            if ($exists) {
                continue;
            }

            DB::table('invoices')->insert([
                'appointment_id' => $appointment->id,
                'patient_id' => $appointment->patient_id,
                'invoice_date' => $invoiceData['invoice_date'],
                'total_amount' => $invoiceData['total_amount'],
                'status' => $invoiceData['status'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
