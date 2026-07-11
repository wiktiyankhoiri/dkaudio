<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Penjualan extends Model
{
    protected $table = 'penjualan';

    protected $fillable = ['no_invoice', 'tanggal', 'konsumen', 'telepon', 'alamat', 'jatuh_tempo', 'diskon', 'ppn', 'subtotal', 'dibayar', 'total', 'status', 'keterangan'];

    protected $casts = ['tanggal' => 'date', 'jatuh_tempo' => 'date', 'diskon' => 'integer', 'dibayar' => 'integer'];

    public function details()
    {
        return $this->hasMany(PenjualanDetail::class, 'penjualan_id');
    }
}
