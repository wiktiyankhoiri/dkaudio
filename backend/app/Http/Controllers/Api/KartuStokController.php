<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barang;
use App\Models\PembelianDetail;
use App\Models\PenjualanDetail;
use App\Models\PenyesuaianStok;
use Illuminate\Http\Request;

class KartuStokController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'barang_id' => 'required|exists:barang,id',
            'dari' => 'nullable|date',
            'sampai' => 'nullable|date',
        ]);

        $barang = Barang::with('stok')->findOrFail($request->barang_id);

        $dari = $request->dari ?? now()->startOfMonth()->toDateString();
        $sampai = $request->sampai ?? now()->toDateString();

        $transaksi = collect();

        $pembelian = PembelianDetail::where('barang_id', $barang->id)
            ->whereHas('pembelian', function ($q) use ($dari, $sampai) {
                $q->whereBetween('tanggal', [$dari, $sampai]);
            })
            ->with('pembelian')
            ->get()
            ->map(function ($d) {
                return [
                    'tanggal' => $d->pembelian->tanggal,
                    'no_ref' => $d->pembelian->no_surat,
                    'tipe' => 'MASUK',
                    'masuk' => $d->qty,
                    'keluar' => 0,
                    'keterangan' => 'Pembelian',
                ];
            });

        $penjualan = PenjualanDetail::where('barang_id', $barang->id)
            ->whereHas('penjualan', function ($q) use ($dari, $sampai) {
                $q->whereBetween('tanggal', [$dari, $sampai]);
            })
            ->with('penjualan')
            ->get()
            ->map(function ($d) {
                return [
                    'tanggal' => $d->penjualan->tanggal,
                    'no_ref' => $d->penjualan->no_invoice,
                    'tipe' => 'KELUAR',
                    'masuk' => 0,
                    'keluar' => $d->qty,
                    'keterangan' => 'Penjualan',
                ];
            });

        $penyesuaian = PenyesuaianStok::where('barang_id', $barang->id)
            ->whereBetween('tanggal', [$dari, $sampai])
            ->get()
            ->map(function ($d) {
                $tipe = $d->selisih > 0 ? 'MASUK' : 'KELUAR';
                return [
                    'tanggal' => $d->tanggal,
                    'no_ref' => 'PS-' . $d->id,
                    'tipe' => $tipe,
                    'masuk' => $d->selisih > 0 ? $d->selisih : 0,
                    'keluar' => $d->selisih < 0 ? abs($d->selisih) : 0,
                    'keterangan' => 'Penyesuaian: ' . ($d->alasan ?? ''),
                ];
            });

        $transaksi = $pembelian->concat($penjualan)->concat($penyesuaian)
            ->sortBy('tanggal')
            ->values();

        $saldo = 0;
        $transaksi = $transaksi->map(function ($t) use (&$saldo) {
            $saldo += $t['masuk'] - $t['keluar'];
            $t['saldo'] = $saldo;
            return $t;
        });

        return response()->json([
            'barang' => $barang,
            'stok_saat_ini' => $barang->stok?->qty ?? 0,
            'transaksi' => $transaksi,
        ]);
    }
}
