<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Invoice;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminInvoiceController extends Controller
{
    private function invoiceRelations(): array
    {
        return [
            'patient.user',
            'appointment.doctor.user',
            'appointment.patient.user',
            'invoiceDetails.service',
        ];
    }

    private function calculateInvoiceTotal(array $items): float
    {
        if (empty($items)) {
            return 0.0;
        }

        $serviceIds = collect($items)
            ->pluck('service_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        $services = Service::query()
            ->whereIn('id', $serviceIds)
            ->get(['id', 'price'])
            ->keyBy('id');

        $total = 0.0;
        foreach ($items as $item) {
            $serviceId = (int) $item['service_id'];
            $quantity = (float) $item['quantity'];
            $service = $services->get($serviceId);

            if (! $service) {
                continue;
            }

            $total += ((float) $service->price) * $quantity;
        }

        return round($total, 2);
    }

    public function index()
    {
        return Invoice::with($this->invoiceRelations())
            ->latest()
            ->get();
    }

    public function show($id)
    {
        return Invoice::with($this->invoiceRelations())->findOrFail($id);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'appointment_id' => 'nullable|exists:appointments,id',
            'invoice_date' => 'required|date',
            'status' => 'nullable|in:paid,unpaid,pending',
            'items' => 'nullable|array',
            'items.*.service_id' => 'required_with:items|exists:services,id',
            'items.*.quantity' => 'required_with:items|numeric|gt:0',
        ]);

        $appointmentId = $validated['appointment_id'] ?? Appointment::query()
            ->where('patient_id', (int) $validated['patient_id'])
            ->latest('date')
            ->value('id');

        if (! $appointmentId) {
            return response()->json([
                'message' => 'No appointment found for this patient. Please create/select an appointment first.',
            ], 422);
        }

        $appointment = Appointment::find($appointmentId);
        if (! $appointment || (int) $appointment->patient_id !== (int) $validated['patient_id']) {
            return response()->json([
                'message' => 'Selected appointment does not belong to the provided patient.',
            ], 422);
        }

        $invoice = DB::transaction(function () use ($validated, $appointmentId) {
            $items = $validated['items'] ?? [];

            $invoice = Invoice::create([
                'patient_id' => $validated['patient_id'],
                'appointment_id' => $appointmentId,
                'invoice_date' => $validated['invoice_date'],
                'status' => $validated['status'] ?? 'unpaid',
                'total_amount' => 0,
            ]);

            if (! empty($items)) {
                foreach ($items as $item) {
                    $invoice->invoiceDetails()->create([
                        'service_id' => $item['service_id'],
                        'quantity' => $item['quantity'],
                    ]);
                }
            }

            $total = $this->calculateInvoiceTotal($items);
            $invoice->update(['total_amount' => $total]);

            return $invoice->load($this->invoiceRelations());
        });

        return response()->json([
            'message' => 'Invoice created successfully',
            'invoice' => $invoice,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'patient_id' => 'sometimes|exists:patients,id',
            'appointment_id' => 'sometimes|exists:appointments,id',
            'invoice_date' => 'sometimes|date',
            'status' => 'sometimes|in:paid,unpaid,pending',
            'items' => 'sometimes|array',
            'items.*.service_id' => 'required_with:items|exists:services,id',
            'items.*.quantity' => 'required_with:items|numeric|gt:0',
        ]);

        $invoice = DB::transaction(function () use ($validated, $id) {
            $invoice = Invoice::with('appointment')->findOrFail($id);

            $invoice->update([
                'patient_id' => $validated['patient_id'] ?? $invoice->patient_id,
                'appointment_id' => array_key_exists('appointment_id', $validated)
                    ? $validated['appointment_id']
                    : $invoice->appointment_id,
                'invoice_date' => $validated['invoice_date'] ?? $invoice->invoice_date,
                'status' => $validated['status'] ?? $invoice->status,
            ]);

            if (array_key_exists('items', $validated)) {
                $invoice->invoiceDetails()->delete();

                foreach ($validated['items'] as $item) {
                    $invoice->invoiceDetails()->create([
                        'service_id' => $item['service_id'],
                        'quantity' => $item['quantity'],
                    ]);
                }

                $total = $this->calculateInvoiceTotal($validated['items']);
                $invoice->update(['total_amount' => $total]);
            }

            if (
                ($validated['status'] ?? $invoice->status) === 'paid' &&
                $invoice->appointment
            ) {
                $invoice->appointment->update([
                    'status' => 'completed',
                ]);
            }

            return $invoice->load($this->invoiceRelations());
        });

        return response()->json([
            'message' => 'Invoice updated successfully',
            'invoice' => $invoice,
        ]);
    }

    public function destroy($id)
    {
        $invoice = Invoice::findOrFail($id);
        $invoice->delete();

        return response()->json([
            'message' => 'Invoice deleted successfully',
        ]);
    }
}
