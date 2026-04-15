<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Doctor extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'department_id',
        'specialization',
        'hire_date',
        'bio',
        'status',
        'phone',
        'address',
    ];

    // relations
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }
    public function workingHours()
    {
        return $this->hasMany(DoctorHour::class);
    }
    public function appointments() {
    return $this->hasMany(Appointment::class);
}
}
