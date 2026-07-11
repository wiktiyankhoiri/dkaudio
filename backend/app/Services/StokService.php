<?php

namespace App\Services;

use App\Models\Barang;
use App\Models\Stok;
use Illuminate\Support\Facades\DB;

class StokService
{
    public function getStok(Barang $barang): int
    {
        $stok = Stok::where('barang_id', $barang->id)->first();
        return $stok ? $stok->qty : 0;
    }

    public function tambahStok(Barang $barang, int $qty): Stok
    {
        return DB::transaction(function () use ($barang, $qty) {
            $stok = Stok::where('barang_id', $barang->id)->lockForUpdate()->first();

            if (!$stok) {
                $stok = Stok::create(['barang_id' => $barang->id, 'qty' => $qty]);
            } else {
                $stok->increment('qty', $qty);
            }

            return $stok->fresh();
        });
    }

    public function kurangiStok(Barang $barang, int $qty): Stok
    {
        return DB::transaction(function () use ($barang, $qty) {
            $stok = Stok::where('barang_id', $barang->id)->lockForUpdate()->first();

            if (!$stok) {
                $stok = Stok::create(['barang_id' => $barang->id, 'qty' => 0]);
            }

            if ($stok->qty < $qty) {
                throw new \Exception("Stok tidak mencukupi untuk {$barang->nama_barang}. Stok: {$stok->qty}, diminta: {$qty}");
            }

            $stok->decrement('qty', $qty);

            return $stok->fresh();
        });
    }

    public function sesuaikanStok(Barang $barang, int $qtyBaru): Stok
    {
        return DB::transaction(function () use ($barang, $qtyBaru) {
            $stok = Stok::where('barang_id', $barang->id)->lockForUpdate()->first();

            if (!$stok) {
                $stok = Stok::create(['barang_id' => $barang->id, 'qty' => $qtyBaru]);
            } else {
                $stok->update(['qty' => $qtyBaru]);
            }

            return $stok->fresh();
        });
    }
}
