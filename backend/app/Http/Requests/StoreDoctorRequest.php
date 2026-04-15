<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDoctorRequest extends FormRequest
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
    public function rules()
 {
        return [
            'user_id'        => 'required|exists:users,id',
            'department_id'  => 'required|exists:departments,id',
            'specialization' => 'nullable|string|max:255',
            'hire_date'      => 'required|date',
            'bio'            => 'nullable|string',
            'status'         => 'in:active,inactive,on_leave',
            'phone'          => 'nullable|string|max:30',
            'address'        => 'nullable|string|max:255',
        ];
    }
}
