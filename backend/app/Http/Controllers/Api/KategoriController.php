<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kategori;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use App\Exports\KategoriExport;
use App\Exports\KategoriTemplateExport;
use App\Imports\KategoriImport;
use Maatwebsite\Excel\Facades\Excel;

class KategoriController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(Kategori::withCount('barang')->latest()->paginate($request->per_page ?? 25));
    }

    public function store(Request $request)
    {
        $request->validate(['nama_kategori' => 'required|string|max:255|unique:kategori']);

        $k = Kategori::create($request->only(['nama_kategori']));

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'create',
            'table_name' => 'kategori',
            'reference_id' => $k->id,
            'description' => 'Kategori ' . $k->nama_kategori . ' dibuat',
        ]);

        return response()->json($k, 201);
    }

    public function show(Kategori $kategori)
    {
        return response()->json($kategori->loadCount('barang'));
    }

    public function update(Request $request, Kategori $kategori)
    {
        $request->validate(['nama_kategori' => 'required|string|max:255|unique:kategori,nama_kategori,' . $kategori->id]);

        $kategori->update($request->only(['nama_kategori']));

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'update',
            'table_name' => 'kategori',
            'reference_id' => $kategori->id,
            'description' => 'Kategori ' . $kategori->nama_kategori . ' diperbarui',
        ]);

        return response()->json($kategori);
    }

    public function exportExcel()
    {
        return Excel::download(new KategoriExport, 'kategori-' . now()->format('Ymd') . '.xlsx');
    }

    public function exportTemplate()
    {
        return Excel::download(new KategoriTemplateExport, 'template-kategori.xlsx');
    }

    public function importExcel(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:xlsx,xls,csv|max:10240']);

        Excel::import(new KategoriImport, $request->file('file'));

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'import',
            'table_name' => 'kategori',
            'description' => 'Kategori diimport dari Excel',
        ]);

        return response()->json(['message' => 'Kategori berhasil diimport']);
    }

    public function destroy(Kategori $kategori)
    {
        if ($kategori->barang()->count() > 0) {
            return response()->json(['message' => 'Kategori memiliki barang terkait'], 409);
        }

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'delete',
            'table_name' => 'kategori',
            'reference_id' => $kategori->id,
            'description' => 'Kategori ' . $kategori->nama_kategori . ' dihapus',
        ]);

        $kategori->delete();

        return response()->json(['message' => 'Dihapus']);
    }
}
