<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PenyesuaianStok extends Model
{
    protected $table = 'penyesuaian_stok';

    protected $fillable = ['tanggal', 'barang_id', 'qty_sebelum', 'qty_sesudah', 'selisih', 'alasan', 'user_id'];

    protected $casts = ['tanggal' => 'date'];

    public function barang()
    {
        return $this->belongsTo(Barang::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
