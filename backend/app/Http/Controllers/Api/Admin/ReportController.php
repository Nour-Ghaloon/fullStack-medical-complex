<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\InvoiceDetail;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function monthly(Request $request)
    {
        $month = $request->month ?? now()->month;
        $year  = $request->year  ?? now()->year;

        $monthlyIncome = Invoice::where('status','paid')
            ->whereMonth('issued_date', $month)
            ->whereYear('issued_date', $year)
            ->sum('total_amount');

        $patientsCount = Appointment::whereMonth('appointment_date', $month)
            ->whereYear('appointment_date', $year)
            ->distinct('patient_id')
            ->count('patient_id');

        $appointmentsCount = Appointment::whereMonth('appointment_date', $month)
            ->whereYear('appointment_date', $year)
            ->count();

        $topDoctor = Doctor::withCount([
            'appointments' => function ($q) use ($month,$year) {
                $q->where('status','completed')
                  ->whereMonth('appointment_date', $month)
                  ->whereYear('appointment_date', $year);
            }
        ])->orderByDesc('appointments_count')->first();

        $topService = InvoiceDetail::selectRaw('service_name, COUNT(*) as total')
            ->groupBy('service_name')
            ->orderByDesc('total')
            ->first();

        return response()->json([
            'month' => $month,
            'year'  => $year,
            'income' => $monthlyIncome,
            'patients' => $patientsCount,
            'appointments' => $appointmentsCount,
            'top_doctor' => $topDoctor?->user?->name,
            'top_service' => $topService?->service_name
        ]);
    }
}