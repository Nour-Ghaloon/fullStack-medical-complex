<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PrescriptionStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'appointment_id' => 'required|exists:appointments,id',
            'notes'          => 'nullable|string|max:1000',
            'prescribed_date' => 'required|date|before_or_equal:today',

            'medicines'              => 'required|array|min:1',
            'medicines.*.medicine_id' => 'required|exists:medicines,id',
            'medicines.*.dosage'      => 'required|string|max:255',
            'medicines.*.duration'    => 'required|string|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'medicines.*.medicine_id.exists' => 'أحد الأدوية المختارة غير موجود في النظام.',
            'appointment_id.exists'         => 'الموعد المحدد غير صحيح.',
        ];
    }
}
