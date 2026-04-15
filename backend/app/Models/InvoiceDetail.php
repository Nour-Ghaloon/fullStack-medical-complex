<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InvoiceDetail extends Model
{
   protected $fillable = ['invoice_id', 'service_id', 'quantity'];
   public function invoice()
   {
       return $this->belongsTo(Invoice::class);
   }
   public function service()
   {
       return $this->belongsTo(Service::class);
   }
}
