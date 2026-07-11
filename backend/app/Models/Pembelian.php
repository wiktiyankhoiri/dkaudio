<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pembelian extends Model
{
    protected $table = 'pembelian';

    protected $fillable = ['no_surat', 'tanggal', 'supplier_id', 'jatuh_tempo', 'keterangan', 'status', 'total'];

    protected $casts = ['tanggal' => 'date', 'jatuh_tempo' => 'date'];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function details()
    {
        return $this->hasMany(PembelianDetail::class, 'pembelian_id');
    }
}
