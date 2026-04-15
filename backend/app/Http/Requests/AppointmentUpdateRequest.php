<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AppointmentUpdateRequest extends FormRequest
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
             'doctor_id' => 'sometimes|exists:doctors,id',
            'patient_id'=>'sometimes|exists:patients,id',
            'date' => 'sometimes|date',
            'start_time' => 'sometimes|date_format:H:i',
            //'end_time' => 'sometimes|date_format:H:i|after:start_time',
            'status' => 'sometimes|in:scheduled,completed,cancelled,canceled',
            'notes'=>'nullable|string|max:255'
        ];
    }
     public function messages(): array
    {
        return [
            'doctor_id.required' => 'Doctor is required',
            'patient_id.required' => 'Patient is required',
            'date.after_or_equal' => 'Appointment date must be today or later',
            'start_time.required'=>'Start time is required',
            //'end_time.required'=>'Start time is required',
            //'end_time.after' => 'End time must be after start time',
        ];
    }
}
