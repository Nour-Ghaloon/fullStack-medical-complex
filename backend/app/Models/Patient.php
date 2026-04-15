<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    protected $fillable = [
    'user_id',
    'date_of_birth',
    'gender',
    'phone',
    'address',
    'blood_type',
    'allergies',
    'chronic_diseases',
    'medical_history',
    'status',
];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }
}
