<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
   public function up(): void
{
    Schema::create('patients', function (Blueprint $table) {
        $table->id();

        // relation with users table
        $table->foreignId('user_id')
              ->constrained('users')
              ->cascadeOnDelete();

        // medical / personal info
        $table->date('date_of_birth');
        $table->enum('gender', ['male', 'female']);
        $table->string('phone')->nullable();
        $table->string('address')->nullable();
        $table->string('blood_type')->nullable();

        // medical details
        $table->text('allergies')->nullable();
        $table->text('chronic_diseases')->nullable();
        $table->text('medical_history')->nullable();

        $table->enum('status', ['active', 'inactive'])->default('active');

        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
