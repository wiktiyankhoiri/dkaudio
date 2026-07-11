<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Barang extends Model
{
    protected $table = 'barang';

    protected $fillable = ['kode_barang', 'nama_barang', 'kategori_id', 'satuan', 'harga_beli', 'harga_jual'];

    protected $casts = ['harga_beli' => 'integer', 'harga_jual' => 'integer'];

    protected $appends = ['stok_qty'];

    protected static function booted(): void
    {
        static::created(function (Barang $barang) {
            Stok::firstOrCreate(['barang_id' => $barang->id], ['qty' => 0]);
        });
    }

    public function kategori()
    {
        return $this->belongsTo(Kategori::class);
    }

    public function stok()
    {
        return $this->hasOne(Stok::class);
    }

    public function getStokQtyAttribute()
    {
        return $this->stok?->qty ?? 0;
    }

    public function pembelianDetails()
    {
        return $this->hasMany(PembelianDetail::class, 'barang_id');
    }

    public function penjualanDetails()
    {
        return $this->hasMany(PenjualanDetail::class, 'barang_id');
    }
}
