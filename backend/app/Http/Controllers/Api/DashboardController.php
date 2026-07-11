<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barang;
use App\Models\Pembelian;
use App\Models\Penjualan;
use App\Models\Kategori;
use App\Models\Supplier;
use App\Models\User;
use App\Models\StokOpname;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // Data operasional (boleh dilihat semua role, termasuk kasir)
        $totalBarang = Barang::count();

        $penjualanHariIni = Penjualan::whereDate('tanggal', today())->count();
        $penjualanKemarin = Penjualan::whereDate('tanggal', today()->subDay())->count();

        $stokMenipis = Barang::with('stok')
            ->whereHas('stok', function ($q) {
                $q->where('qty', '<=', 10);
            })
            ->get()
            ->map(function ($b) {
                return [
                    'id' => $b->id,
                    'nama' => $b->nama_barang,
                    'kode' => $b->kode_barang,
                    'stok' => $b->stok?->qty ?? 0,
                ];
            });

        $stokTotal = Barang::with('stok')->get()->sum(fn($b) => $b->stok?->qty ?? 0);
        $stokRendah = Barang::whereHas('stok', fn($q) => $q->where('qty', '<=', 10))->count();
        $stokHabis = Barang::whereHas('stok', fn($q) => $q->where('qty', '=', 0))->count();

        $penjualanTerbaru = Penjualan::with(['details.barang'])
            ->latest()->take(10)->get();

        // Kasir: hanya data operasional, tanpa data keuangan/omzet/modal/laba
        if ($request->user()?->role === 'kasir') {
            return response()->json([
                'total_barang' => $totalBarang,
                'total_kategori' => 0,
                'total_supplier' => 0,
                'total_user' => 0,
                'pembelian_hari_ini' => 0,
                'pembelian_kemarin' => 0,
                'penjualan_hari_ini' => $penjualanHariIni,
                'penjualan_kemarin' => $penjualanKemarin,
                'total_nilai_stok' => 0,
                'total_nilai_jual' => 0,
                'stok_menipis' => $stokMenipis,
                'opname_aktif' => 0,
                'stok_total' => $stokTotal,
                'stok_rendah' => $stokRendah,
                'stok_habis' => $stokHabis,
                'total_penjualan_bulan_ini' => 0,
                'total_penjualan_bulan_lalu' => 0,
                'total_penjualan_semua' => 0,
                'top_products' => [],
                'pembelian_terbaru' => [],
                'penjualan_terbaru' => $penjualanTerbaru,
                'is_kasir' => true,
            ]);
        }

        // Owner/Admin: data lengkap
        $totalKategori = Kategori::count();
        $totalSupplier = Supplier::count();
        $totalUser = User::count();

        $pembelianHariIni = Pembelian::whereDate('tanggal', today())->count();
        $pembelianKemarin = Pembelian::whereDate('tanggal', today()->subDay())->count();

        $totalNilaiStok = Barang::with('stok')->get()->sum(function ($b) {
            return ($b->stok?->qty ?? 0) * $b->harga_beli;
        });

        $totalNilaiJual = Barang::with('stok')->get()->sum(function ($b) {
            return ($b->stok?->qty ?? 0) * $b->harga_jual;
        });

        $opnameAktif = StokOpname::whereIn('status', ['draft', 'selesai'])->count();

        $totalPenjualanBulanIni = (float) Penjualan::whereMonth('tanggal', now()->month)
            ->whereYear('tanggal', now()->year)
            ->sum('total');

        $totalPenjualanBulanLalu = (float) Penjualan::whereMonth('tanggal', now()->subMonth()->month)
            ->whereYear('tanggal', now()->subMonth()->year)
            ->sum('total');

        $topProducts = Penjualan::with(['details.barang'])
            ->latest()->get()
            ->flatMap(fn($p) => $p->details)
            ->groupBy('barang_id')
            ->map(function ($details, $barangId) {
                $first = $details->first();
                $barang = $first?->barang;
                $qty = $details->sum('qty');
                $total = $details->sum(fn($d) => $d->qty * $d->harga_jual);
                return [
                    'nama' => $barang?->nama_barang ?? 'Unknown',
                    'qty' => $qty,
                    'total' => $total,
                ];
            })->sortByDesc('total')->take(5)->values();

        $totalPenjualanSemua = (float) Penjualan::sum('total');

        return response()->json([
            'total_barang' => $totalBarang,
            'total_kategori' => $totalKategori,
            'total_supplier' => $totalSupplier,
            'total_user' => $totalUser,
            'pembelian_hari_ini' => $pembelianHariIni,
            'pembelian_kemarin' => $pembelianKemarin,
            'penjualan_hari_ini' => $penjualanHariIni,
            'penjualan_kemarin' => $penjualanKemarin,
            'total_nilai_stok' => $totalNilaiStok,
            'total_nilai_jual' => $totalNilaiJual,
            'stok_menipis' => $stokMenipis,
            'opname_aktif' => $opnameAktif,
            'stok_total' => $stokTotal,
            'stok_rendah' => $stokRendah,
            'stok_habis' => $stokHabis,
            'total_penjualan_bulan_ini' => $totalPenjualanBulanIni,
            'total_penjualan_bulan_lalu' => $totalPenjualanBulanLalu,
            'total_penjualan_semua' => $totalPenjualanSemua,
            'top_products' => $topProducts,
            'pembelian_terbaru' => [],
            'penjualan_terbaru' => $penjualanTerbaru,
            'is_kasir' => false,
        ]);
    }
}
