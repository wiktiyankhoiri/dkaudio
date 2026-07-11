<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barang;
use App\Models\Kategori;
use App\Models\Supplier;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function index(Request $request)
    {
        $request->validate(['q' => 'required|string|min:1']);

        $q = $request->q;

        $barang = Barang::with(['kategori', 'stok'])
            ->where('nama_barang', 'like', "%{$q}%")
            ->orWhere('kode_barang', 'like', "%{$q}%")
            ->take(10)
            ->get();

        $kategori = Kategori::where('nama_kategori', 'like', "%{$q}%")
            ->take(5)
            ->get();

        $supplier = Supplier::where('nama_supplier', 'like', "%{$q}%")
            ->orWhere('kode_supplier', 'like', "%{$q}%")
            ->take(5)
            ->get();

        return response()->json([
            'barang' => $barang,
            'kategori' => $kategori,
            'supplier' => $supplier,
        ]);
    }
}
