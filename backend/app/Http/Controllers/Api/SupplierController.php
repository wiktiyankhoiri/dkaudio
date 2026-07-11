<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use App\Exports\SupplierExport;
use App\Exports\SupplierTemplateExport;
use App\Imports\SupplierImport;
use Maatwebsite\Excel\Facades\Excel;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(Supplier::latest()->paginate($request->per_page ?? 25));
    }

    public function store(Request $request)
    {
        $request->validate([
            'kode_supplier' => 'required|max:50|unique:supplier',
            'nama_supplier' => 'required|string|max:255',
        ]);

        $s = Supplier::create($request->only(['kode_supplier', 'nama_supplier', 'alamat', 'telepon']));

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'create',
            'table_name' => 'supplier',
            'reference_id' => $s->id,
            'description' => 'Supplier ' . $s->nama_supplier . ' dibuat',
        ]);

        return response()->json($s, 201);
    }

    public function show(Supplier $supplier)
    {
        return response()->json($supplier);
    }

    public function update(Request $request, Supplier $supplier)
    {
        $request->validate([
            'kode_supplier' => 'required|max:50|unique:supplier,kode_supplier,' . $supplier->id,
            'nama_supplier' => 'required|string|max:255',
        ]);

        $supplier->update($request->only(['kode_supplier', 'nama_supplier', 'alamat', 'telepon']));

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'update',
            'table_name' => 'supplier',
            'reference_id' => $supplier->id,
            'description' => 'Supplier ' . $supplier->nama_supplier . ' diperbarui',
        ]);

        return response()->json($supplier);
    }

    public function exportExcel()
    {
        return Excel::download(new SupplierExport, 'supplier-' . now()->format('Ymd') . '.xlsx');
    }

    public function exportTemplate()
    {
        return Excel::download(new SupplierTemplateExport, 'template-supplier.xlsx');
    }

    public function importExcel(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:xlsx,xls,csv|max:10240']);

        Excel::import(new SupplierImport, $request->file('file'));

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'import',
            'table_name' => 'supplier',
            'description' => 'Supplier diimport dari Excel',
        ]);

        return response()->json(['message' => 'Supplier berhasil diimport']);
    }

    public function destroy(Supplier $supplier)
    {
        if ($supplier->pembelian()->count() > 0) {
            return response()->json(['message' => 'Supplier memiliki transaksi terkait'], 409);
        }

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'delete',
            'table_name' => 'supplier',
            'reference_id' => $supplier->id,
            'description' => 'Supplier ' . $supplier->nama_supplier . ' dihapus',
        ]);

        $supplier->delete();

        return response()->json(['message' => 'Dihapus']);
    }
}
