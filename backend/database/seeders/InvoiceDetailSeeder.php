<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Service;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class InvoiceDetailSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $details = [
            [
                'appointment' => [
                    'patient_email' => 'sarah.ali@hospital.com',
                    'doctor_email' => 'ahmed.hassan@hospital.com',
                    'date' => '2026-01-15 09:00:00',
                    'start_time' => '09:00:00',
                ],
                'items' => [
                    ['service_code' => 'CARD-CONS', 'quantity' => 1],
                    ['service_code' => 'CARD-ECG', 'quantity' => 1],
                ],
            ],
            [
                'appointment' => [
                    'patient_email' => 'omar.nabil@hospital.com',
                    'doctor_email' => 'fatima.mohammad@hospital.com',
                    'date' => '2026-02-10 11:00:00',
                    'start_time' => '11:00:00',
                ],
                'items' => [
                    ['service_code' => 'NEURO-CONS', 'quantity' => 1],
                    ['service_code' => 'NEURO-EEG', 'quantity' => 1],
                ],
            ],
        ];

        foreach ($details as $detailData) {
            $appointment = Appointment::where('date', $detailData['appointment']['date'])
                ->where('start_time', $detailData['appointment']['start_time'])
                ->whereHas('patient.user', function ($query) use ($detailData) {
                    $query->where('email', $detailData['appointment']['patient_email']);
                })
                ->whereHas('doctor.user', function ($query) use ($detailData) {
                    $query->where('email', $detailData['appointment']['doctor_email']);
                })
                ->first();

            if (!$appointment) {
                continue;
            }

            $invoice = DB::table('invoices')
                ->where('appointment_id', $appointment->id)
                ->first();

            if (!$invoice) {
                continue;
            }

            foreach ($detailData['items'] as $item) {
                $service = Service::where('code', $item['service_code'])->first();

                if (!$service) {
                    continue;
                }

                $exists = DB::table('invoice_details')
                    ->where('invoice_id', $invoice->id)
                    ->where('service_id', $service->id)
                    ->exists();

                if ($exists) {
                    continue;
                }

                DB::table('invoice_details')->insert([
                    'invoice_id' => $invoice->id,
                    'service_id' => $service->id,
                    'quantity' => $item['quantity'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
