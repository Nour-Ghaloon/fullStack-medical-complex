<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AppointmentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'date' => $this->date,
            'start_time' => $this->start_time,
            'end_time' => $this->end_time,
            'status' => $this->status,
            'notes' => $this->notes,

            'doctor' => [
                'id' => $this->doctor?->id,
                'name' => $this->doctor?->user?->name,
                'user' => [
                    'name' => $this->doctor?->user?->name,
                    'email' => $this->doctor?->user?->email,
                ],
            ],

            'patient' => [
                'id' => $this->patient?->id,
                'name' => $this->patient?->user?->name,
                'email' => $this->patient?->user?->email,
                'user' => [
                    'name' => $this->patient?->user?->name,
                    'email' => $this->patient?->user?->email,
                ],
            ],

            'created_at' => $this->created_at->toDateTimeString(),
        ];
    }
}
