<?php

use App\Http\Controllers\Api\Admin\AdminInvoiceController;
use App\Http\Controllers\Api\Admin\AppointmentController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\DoctorHourController;
use App\Http\Controllers\Api\Admin\ReportController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\DoctorController;
use App\Http\Controllers\Api\doctor\DoctorController as DoctorDoctorController;
use App\Http\Controllers\Api\patient\PatientPortalController;
use App\Http\Controllers\Api\MedicalRecordController;
use App\Http\Controllers\Api\MedicineController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\PrescriptionController;
use App\Http\Controllers\Api\ServiceController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware(['auth:api', 'role:admin,api']);

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout']);

Route::middleware(['auth:api'])->group(function () {
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::post('/profile', [AuthController::class, 'updateProfile']);
    Route::post('/changePassword', [AuthController::class, 'changePassword']);
    Route::delete('/deleteAccount', [AuthController::class, 'deleteAccount']);

    Route::apiResource('departments', DepartmentController::class);
    Route::apiResource('services', ServiceController::class);

    Route::middleware(['role:admin|doctor,api'])->group(function () {
        Route::get('medicines', [MedicineController::class, 'index']);
        Route::apiResource('prescriptions', PrescriptionController::class);
    });

    Route::middleware(['role:admin|doctor,api'])->group(function () {
        Route::get('reports/monthly', [ReportController::class, 'monthly']);
        Route::get('dashboard', [DashboardController::class, 'index']);

        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);

        Route::apiResource('invoices', AdminInvoiceController::class);
        Route::apiResource('doctors', DoctorController::class);
        Route::apiResource('patients', PatientController::class);
        Route::apiResource('medical-records', MedicalRecordController::class);

        Route::get('/all-appointments', [AppointmentController::class, 'index']);
        Route::post('/store-appointments', [AppointmentController::class, 'store']);
        Route::put('/update-appointments/{id}', [AppointmentController::class, 'update']);
        Route::delete('/delete-appointments/{id}', [AppointmentController::class, 'destroy']);

        Route::get('/all-doctor-hours/{doctorId}', [DoctorHourController::class, 'index']);
        Route::post('/store-doctor-hour', [DoctorHourController::class, 'store']);
        Route::put('/update-doctor-hour/{id}', [DoctorHourController::class, 'update']);
        Route::delete('/delete-doctor-hour/{id}', [DoctorHourController::class, 'destroy']);

        Route::get('doctors/{id}/availability', [DoctorHourController::class, 'availability']);
    });
});

Route::middleware(['auth:api', 'role:doctor,api'])->prefix('doctor')->group(function () {
    Route::get('/dashboard', [DoctorDoctorController::class, 'dashboard']);

    Route::get('/appointments/today', [DoctorDoctorController::class, 'todayAppointments']);
    Route::get('/appointments/upcoming', [DoctorDoctorController::class, 'upcomingAppointments']);
    Route::put('/appointments/{id}', [DoctorDoctorController::class, 'updateAppointment']);

    Route::get('/patients', [DoctorDoctorController::class, 'myPatients']);
    Route::get('/medical-records', [DoctorDoctorController::class, 'medicalRecords']);

    Route::put('/reschedule/{id}', [DoctorDoctorController::class, 'reschedule']);
    Route::put('/complete/{id}', [DoctorDoctorController::class, 'complete']);
});

Route::middleware(['auth:api', 'role:patient,api'])->prefix('patient')->group(function () {
    Route::get('/dashboard', [PatientPortalController::class, 'dashboard']);

    Route::get('/appointments', [PatientPortalController::class, 'appointments']);
    Route::post('/appointments', [PatientPortalController::class, 'bookAppointment']);
    Route::put('/appointments/{id}/cancel', [PatientPortalController::class, 'cancelAppointment']);

    Route::get('/medical-records', [PatientPortalController::class, 'medicalRecords']);
    Route::get('/prescriptions', [PatientPortalController::class, 'prescriptions']);

    Route::get('/doctors', [PatientPortalController::class, 'doctors']);
    Route::get('/doctors/{doctorId}/availability', [PatientPortalController::class, 'availability']);
});
