<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stok', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barang_id')->unique()->constrained('barang');
            $table->integer('qty')->default(0);
            $table->timestamps();
        });

        DB::statement('ALTER TABLE stok ADD CONSTRAINT stok_qty_non_negative CHECK (qty >= 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('stok');
    }
};
