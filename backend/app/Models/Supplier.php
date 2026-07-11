<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $table = 'supplier';

    protected $fillable = ['kode_supplier', 'nama_supplier', 'alamat', 'telepon'];

    public function pembelian()
    {
        return $this->hasMany(Pembelian::class);
    }
}
