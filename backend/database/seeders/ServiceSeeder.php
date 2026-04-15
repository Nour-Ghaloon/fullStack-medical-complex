<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $services = [
            [
                'department_code' => 'CARD',
                'data' => [
                    'name' => 'Cardiology Consultation',
                    'code' => 'CARD-CONS',
                    'description' => 'Initial and follow-up cardiology consultation.',
                    'price' => 200.00,
                    'duration' => 20,
                    'status' => 'active',
                ],
            ],
            [
                'department_code' => 'CARD',
                'data' => [
                    'name' => 'ECG',
                    'code' => 'CARD-ECG',
                    'description' => 'Electrocardiogram test.',
                    'price' => 120.00,
                    'duration' => 30,
                    'status' => 'active',
                ],
            ],
            [
                'department_code' => 'NEURO',
                'data' => [
                    'name' => 'Neurology Consultation',
                    'code' => 'NEURO-CONS',
                    'description' => 'Neurology specialist consultation.',
                    'price' => 220.00,
                    'duration' => 25,
                    'status' => 'active',
                ],
            ],
            [
                'department_code' => 'NEURO',
                'data' => [
                    'name' => 'EEG',
                    'code' => 'NEURO-EEG',
                    'description' => 'Electroencephalogram test.',
                    'price' => 300.00,
                    'duration' => 45,
                    'status' => 'active',
                ],
            ],
            [
                'department_code' => 'ORTHO',
                'data' => [
                    'name' => 'Orthopedic Consultation',
                    'code' => 'ORTHO-CONS',
                    'description' => 'Orthopedic specialist consultation.',
                    'price' => 180.00,
                    'duration' => 25,
                    'status' => 'active',
                ],
            ],
            [
                'department_code' => 'ORTHO',
                'data' => [
                    'name' => 'X-Ray',
                    'code' => 'ORTHO-XRAY',
                    'description' => 'Basic X-ray service.',
                    'price' => 150.00,
                    'duration' => 20,
                    'status' => 'active',
                ],
            ],
        ];

        foreach ($services as $service) {
            $department = Department::where('code', $service['department_code'])->first();

            if (!$department) {
                continue;
            }

            Service::firstOrCreate(
                ['code' => $service['data']['code']],
                array_merge(
                    ['department_id' => $department->id],
                    $service['data']
                )
            );
        }
    }
}
