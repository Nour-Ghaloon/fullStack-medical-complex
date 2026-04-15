<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $departments = [
            [
                'name' => 'Cardiology',
                'code' => 'CARD',
                'description' => 'Heart and cardiovascular system',
            ],
            [
                'name' => 'Neurology',
                'code' => 'NEURO',
                'description' => 'Brain and nervous system',
            ],
            [
                'name' => 'Orthopedics',
                'code' => 'ORTHO',
                'description' => 'Bones, joints, and musculoskeletal system',
            ],
            [
                'name' => 'Pediatrics',
                'code' => 'PEDI',
                'description' => 'Child and adolescent health',
            ],
            [
                'name' => 'General Medicine',
                'code' => 'GM',
                'description' => 'General medical care and internal medicine',
            ],
        ];

        foreach ($departments as $department) {
            Department::firstOrCreate(
                ['code' => $department['code']],
                $department
            );
        }
    }
}
