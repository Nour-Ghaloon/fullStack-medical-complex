<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Medicine extends Model
{
    protected $fillable = ['name', 'description', 'price'];
    public function prescriptions()
    {
        return $this->belongsToMany(Prescription::class, 'prescription_medicines')
            ->withPivot('dosage', 'duration')
            ->withTimestamps();
    }
}
