<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $fillable = [
        'name',
        'code',
        'description',
        'department_id',
        'price',
        'duration',
        'status',
    ];
    
    public function invoiceDetails(){
        return $this->hasMany(InvoiceDetail::class);
    }

    public function department()
{
    return $this->belongsTo(Department::class);
}
}
