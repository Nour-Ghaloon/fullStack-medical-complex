<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $roles = ['admin', 'doctor', 'patient'];
        foreach ($roles as $role) {
            Role::firstOrCreate([
                'name' => $role,
                'guard_name' => 'api'
            ]);
        }

        $permissions = [
            //admin
            'create-admins',
            'read-admins',
            'update-admins',
            'delete-admins',

            'create-users',
            'read-users',
            'update-users',
            'delete-users',

            'create-appointments',
            'read-appointments',
            'update-appointments',
            'delete-appointments',

            'manage-doctor-hours',
            'view-doctor-hours',

            //doctor
            'read-own-appointments',
            'update-own-appointments',
            'delete-own-appointments',
            'read-own-patients',
            'create-prescriptions',
            'read-doctor-hours'
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'api'
            ]);
        }

        $AdminRole = Role::where('name', 'admin')->where('guard_name', 'api')->first();
        if ($AdminRole) {
            $allPermissions = Permission::where('guard_name', 'api')->pluck('name')->toArray();
            $AdminRole->givePermissionTo($allPermissions);
        }
    }
}
