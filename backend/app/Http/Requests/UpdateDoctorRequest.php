<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDoctorRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'department_id'  => 'sometimes|exists:departments,id',
            'specialization' => 'nullable|string|max:255',
            'hire_date'      => 'sometimes|date',
            'bio'            => 'nullable|string',
            'status'         => 'in:active,inactive,on_leave',
            'phone'          => 'nullable|string|max:30',
            'address'        => 'nullable|string|max:255',
        ];
    }
}