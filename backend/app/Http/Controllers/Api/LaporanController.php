<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barang;
use App\Models\Pembelian;
use App\Models\Penjualan;
use Illuminate\Http\Request;

class LaporanController extends Controller
{
    public function stok(Request $request)
    {
        $request->validate([
            'kategori_id' => 'nullable|exists:kategori,id',
            'search' => 'nullable',
        ]);

        $query = Barang::with(['kategori', 'stok']);

        if ($request->kategori_id) {
            $query->where('kategori_id', $request->kategori_id);
        }

        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(nama_barang) LIKE ?', ['%' . mb_strtolower($search) . '%'])
                    ->orWhereRaw('LOWER(kode_barang) LIKE ?', ['%' . mb_strtolower($search) . '%']);
            });
        }

        return response()->json($query->latest()->get());
    }

    public function barangMasuk(Request $request)
    {
        $request->validate([
            'dari' => 'nullable|date',
            'sampai' => 'nullable|date',
            'supplier_id' => 'nullable|exists:supplier,id',
        ]);

        $query = Pembelian::with(['supplier', 'details.barang']);

        if ($request->dari) {
            $query->whereDate('tanggal', '>=', $request->dari);
        }

        if ($request->sampai) {
            $query->whereDate('tanggal', '<=', $request->sampai);
        }

        if ($request->supplier_id) {
            $query->where('supplier_id', $request->supplier_id);
        }

        return response()->json($query->latest()->get());
    }

    public function barangKeluar(Request $request)
    {
        $request->validate([
            'dari' => 'nullable|date',
            'sampai' => 'nullable|date',
        ]);

        $query = Penjualan::with(['details.barang']);

        if ($request->dari) {
            $query->whereDate('tanggal', '>=', $request->dari);
        }

        if ($request->sampai) {
            $query->whereDate('tanggal', '<=', $request->sampai);
        }

        return response()->json($query->latest()->get());
    }
}
