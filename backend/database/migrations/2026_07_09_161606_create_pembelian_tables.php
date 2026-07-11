<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pembelian', function (Blueprint $table) {
            $table->id();
            $table->string('no_surat')->unique();
            $table->date('tanggal');
            $table->foreignId('supplier_id')->nullable()->constrained('supplier');
            $table->date('jatuh_tempo')->nullable();
            $table->text('keterangan')->nullable();
            $table->string('status')->default('hutang');
            $table->decimal('total', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('pembelian_detail', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pembelian_id')->constrained('pembelian')->cascadeOnDelete();
            $table->foreignId('barang_id')->constrained('barang');
            $table->integer('qty');
            $table->decimal('harga_beli', 15, 2)->default(0);
            $table->timestamps();
        });

        DB::statement('ALTER TABLE users DROP CONSTRAINT users_role_check');
        DB::update("UPDATE users SET role='kasir' WHERE role='karyawan'");
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('owner', 'admin', 'kasir'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('pembelian_detail');
        Schema::dropIfExists('pembelian');

        DB::statement('ALTER TABLE users DROP CONSTRAINT users_role_check');
        DB::update("UPDATE users SET role='karyawan' WHERE role='kasir'");
        DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('owner', 'admin', 'karyawan'))");
    }
};
