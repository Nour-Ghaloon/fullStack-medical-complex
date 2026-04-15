<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Doctor;
use App\Models\Appointment;
use App\Models\Invoice;
use App\Models\Department;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
   public function index()
    {
        return response()->json([
            'doctors' => Doctor::count(),
            'patients' => User::where('role', 'patient')->count(),
            'today_appointments' =>
                Appointment::whereDate('date', today())->count(),
            'monthly_income' =>
                Invoice::whereMonth('created_at', now()->month)
                       ->whereYear('created_at', now()->year)
                       ->sum('total'),
            'top_department' =>
                Department::withCount('appointments')
                    ->orderByDesc('appointments_count')
                    ->first()?->name
        ]);
    }
}
