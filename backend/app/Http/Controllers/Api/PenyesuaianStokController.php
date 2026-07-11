<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PenyesuaianStok;
use App\Models\AuditLog;
use App\Services\StokService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PenyesuaianStokController extends Controller
{
    protected $stokService;

    public function __construct(StokService $stokService)
    {
        $this->stokService = $stokService;
    }

    public function index(Request $request)
    {
        return response()->json(PenyesuaianStok::with(['barang', 'user'])->latest()->paginate($request->per_page ?? 25));
    }

    public function store(Request $request)
    {
        $request->validate([
            'tanggal' => 'required|date',
            'barang_id' => 'required|exists:barang,id',
            'qty_sesudah' => 'required|integer|min:0',
            'alasan' => 'nullable',
        ]);

        return DB::transaction(function () use ($request) {
            $barang = \App\Models\Barang::findOrFail($request->barang_id);
            $qtySebelum = $this->stokService->getStok($barang);
            $selisih = $request->qty_sesudah - $qtySebelum;

            $penyesuaian = PenyesuaianStok::create([
                'tanggal' => $request->tanggal,
                'barang_id' => $request->barang_id,
                'qty_sebelum' => $qtySebelum,
                'qty_sesudah' => $request->qty_sesudah,
                'selisih' => $selisih,
                'alasan' => $request->alasan,
                'user_id' => auth()->id(),
            ]);

            $this->stokService->sesuaikanStok($barang, $request->qty_sesudah);

            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'create',
                'table_name' => 'penyesuaian_stok',
                'reference_id' => $penyesuaian->id,
                'description' => 'Penyesuaian stok ' . $barang->nama_barang . ': ' . $qtySebelum . ' -> ' . $request->qty_sesudah,
            ]);

            return response()->json($penyesuaian->load(['barang', 'user']), 201);
        });
    }

    public function show(PenyesuaianStok $penyesuaianStok)
    {
        return response()->json($penyesuaianStok->load(['barang', 'user']));
    }
}
