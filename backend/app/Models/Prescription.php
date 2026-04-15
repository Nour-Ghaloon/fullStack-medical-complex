<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Prescription extends Model
{
    protected $fillable = ['appointment_id', 'notes', 'prescribed_date'];
    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }
    public function medicines(){
        return $this->belongsToMany(Medicine::class,'prescription_medicines')->withPivot('dosage','duration');
    }
}
