<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barang;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Exports\BarangExport;
use App\Exports\BarangTemplateExport;
use App\Imports\BarangImport;
use Maatwebsite\Excel\Facades\Excel;

class BarangController extends Controller
{
    public function index(Request $request)
    {
        $barang = Barang::with(['kategori', 'stok'])->latest()->paginate($request->per_page ?? 25);

        // Kasir tidak boleh melihat harga beli (modal)
        if ($request->user()?->role === 'kasir') {
            $barang->getCollection()->each->makeHidden('harga_beli');
        }

        return response()->json($barang);
    }

    public function store(Request $request)
    {
        $request->validate([
            'kode_barang' => 'required|unique:barang|max:50',
            'nama_barang' => 'required|string|max:255',
            'kategori_id' => 'required|exists:kategori,id',
            'satuan' => 'nullable|in:PCS,SET',
            'harga_beli' => 'nullable|numeric|min:0',
            'harga_jual' => 'nullable|numeric|min:0',
        ]);

        $barang = Barang::create($request->only(['kode_barang', 'nama_barang', 'kategori_id', 'satuan', 'harga_beli', 'harga_jual']));

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'create',
            'table_name' => 'barang',
            'reference_id' => $barang->id,
            'description' => 'Barang ' . $barang->nama_barang . ' dibuat',
        ]);

        return response()->json($barang->load(['kategori', 'stok']), 201);
    }

    public function show(Barang $barang)
    {
        $barang->load(['kategori', 'stok']);

        if (auth()->user()?->role === 'kasir') {
            $barang->makeHidden('harga_beli');
        }

        return response()->json($barang);
    }

    public function update(Request $request, Barang $barang)
    {
        $request->validate([
            'kode_barang' => 'required|unique:barang,kode_barang,' . $barang->id . '|max:50',
            'nama_barang' => 'required|string|max:255',
            'kategori_id' => 'required|exists:kategori,id',
            'satuan' => 'nullable|in:PCS,SET',
            'harga_beli' => 'nullable|numeric|min:0',
            'harga_jual' => 'nullable|numeric|min:0',
        ]);

        $barang->update($request->only(['kode_barang', 'nama_barang', 'kategori_id', 'satuan', 'harga_beli', 'harga_jual']));

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'update',
            'table_name' => 'barang',
            'reference_id' => $barang->id,
            'description' => 'Barang ' . $barang->nama_barang . ' diperbarui',
        ]);

        return response()->json($barang->load(['kategori', 'stok']));
    }

    public function exportExcel()
    {
        return Excel::download(new BarangExport, 'barang-' . now()->format('Ymd') . '.xlsx');
    }

    public function exportTemplate()
    {
        return Excel::download(new BarangTemplateExport, 'template-barang.xlsx');
    }

    public function importExcel(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:xlsx,xls,csv|max:10240']);

        Excel::import(new BarangImport, $request->file('file'));

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'import',
            'table_name' => 'barang',
            'description' => 'Barang diimport dari Excel',
        ]);

        return response()->json(['message' => 'Barang berhasil diimport']);
    }

    public function destroy(Barang $barang)
    {
        if ($barang->penjualanDetails()->exists() || $barang->pembelianDetails()->exists()) {
            return response()->json([
                'message' => 'Barang tidak bisa dihapus karena sudah dipakai di transaksi penjualan/pembelian',
            ], 422);
        }

        if (
            \App\Models\StokOpnameDetail::where('barang_id', $barang->id)->exists() ||
            \App\Models\PenyesuaianStok::where('barang_id', $barang->id)->exists()
        ) {
            return response()->json([
                'message' => 'Barang tidak bisa dihapus karena sudah dipakai di stok opname/penyesuaian stok',
            ], 422);
        }

        return DB::transaction(function () use ($barang) {
            $namaBarang = $barang->nama_barang;
            $barangId = $barang->id;

            $barang->stok()->delete();
            $barang->delete();

            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'delete',
                'table_name' => 'barang',
                'reference_id' => $barangId,
                'description' => 'Barang ' . $namaBarang . ' dihapus',
            ]);

            return response()->json(['message' => 'Dihapus']);
        });
    }
}
