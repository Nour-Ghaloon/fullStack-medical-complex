<?php

namespace Database\Seeders;

use App\Models\Medicine;
use Illuminate\Database\Seeder;

class MedicineSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $medicines = [
            [
                'name' => 'Aspirin 100mg',
                'description' => 'Antiplatelet medication.',
                'price' => 25.00,
            ],
            [
                'name' => 'Atorvastatin 20mg',
                'description' => 'Lipid-lowering medication.',
                'price' => 60.00,
            ],
            [
                'name' => 'Sumatriptan 50mg',
                'description' => 'Migraine treatment.',
                'price' => 45.00,
            ],
            [
                'name' => 'Ibuprofen 400mg',
                'description' => 'Anti-inflammatory pain relief.',
                'price' => 18.00,
            ],
        ];

        foreach ($medicines as $medicine) {
            Medicine::firstOrCreate(
                ['name' => $medicine['name']],
                $medicine
            );
        }
    }
}
