<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pembelian;
use App\Models\PembelianDetail;
use App\Models\AuditLog;
use App\Services\StokService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PembelianController extends Controller
{
    protected $stokService;

    public function __construct(StokService $stokService)
    {
        $this->stokService = $stokService;
    }

    public function index(Request $request)
    {
        return response()->json(Pembelian::with(['supplier', 'details.barang'])->latest()->paginate($request->per_page ?? 25));
    }

    public function store(Request $request)
    {
        $request->validate([
            'no_surat' => 'required|unique:pembelian',
            'tanggal' => 'required|date',
            'supplier_id' => 'nullable|exists:supplier,id',
            'jatuh_tempo' => 'nullable|date',
            'keterangan' => 'nullable',
            'status' => 'nullable|in:hutang,lunas',
            'details' => 'required|array|min:1',
            'details.*.barang_id' => 'required|exists:barang,id',
            'details.*.qty' => 'required|integer|min:1',
            'details.*.harga_beli' => 'nullable|numeric',
        ]);

        return DB::transaction(function () use ($request) {
            $total = collect($request->details)->sum(function ($d) {
                return $d['qty'] * ($d['harga_beli'] ?? 0);
            });

            $pembelian = Pembelian::create([
                'no_surat' => $request->no_surat,
                'tanggal' => $request->tanggal,
                'supplier_id' => $request->supplier_id,
                'jatuh_tempo' => $request->jatuh_tempo,
                'keterangan' => $request->keterangan,
                'status' => $request->status ?? 'hutang',
                'total' => $total,
            ]);

            foreach ($request->details as $detail) {
                PembelianDetail::create([
                    'pembelian_id' => $pembelian->id,
                    'barang_id' => $detail['barang_id'],
                    'qty' => $detail['qty'],
                    'harga_beli' => $detail['harga_beli'] ?? 0,
                ]);

                $barang = \App\Models\Barang::findOrFail($detail['barang_id']);
                $this->stokService->tambahStok($barang, $detail['qty']);
            }

            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'create',
                'table_name' => 'pembelian',
                'reference_id' => $pembelian->id,
                'description' => 'Pembelian ' . $pembelian->no_surat . ' dibuat',
            ]);

            return response()->json($pembelian->load(['supplier', 'details.barang']), 201);
        });
    }

    public function show(Pembelian $pembelian)
    {
        return response()->json($pembelian->load(['supplier', 'details.barang']));
    }

    public function update(Request $request, Pembelian $pembelian)
    {
        $request->validate([
            'no_surat' => 'required|unique:pembelian,no_surat,' . $pembelian->id,
            'tanggal' => 'required|date',
            'supplier_id' => 'nullable|exists:supplier,id',
            'jatuh_tempo' => 'nullable|date',
            'keterangan' => 'nullable',
            'details' => 'required|array|min:1',
            'details.*.barang_id' => 'required|exists:barang,id',
            'details.*.qty' => 'required|integer|min:1',
            'details.*.harga_beli' => 'nullable|numeric',
        ]);

        return DB::transaction(function () use ($request, $pembelian) {
            foreach ($pembelian->details as $detail) {
                $this->stokService->kurangiStok($detail->barang, $detail->qty);
            }

            $pembelian->details()->delete();

            $total = collect($request->details)->sum(fn($d) => $d['qty'] * ($d['harga_beli'] ?? 0));

            $pembelian->update([
                'no_surat' => $request->no_surat,
                'tanggal' => $request->tanggal,
                'supplier_id' => $request->supplier_id,
                'jatuh_tempo' => $request->jatuh_tempo,
                'keterangan' => $request->keterangan,
                'total' => $total,
            ]);

            foreach ($request->details as $detail) {
                PembelianDetail::create([
                    'pembelian_id' => $pembelian->id,
                    'barang_id' => $detail['barang_id'],
                    'qty' => $detail['qty'],
                    'harga_beli' => $detail['harga_beli'] ?? 0,
                ]);

                $barang = \App\Models\Barang::findOrFail($detail['barang_id']);
                $this->stokService->tambahStok($barang, $detail['qty']);
            }

            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'update',
                'table_name' => 'pembelian',
                'reference_id' => $pembelian->id,
                'description' => 'Pembelian ' . $pembelian->no_surat . ' diperbarui',
            ]);

            return response()->json($pembelian->load(['supplier', 'details.barang']));
        });
    }

    public function nextNumber()
    {
        $prefix = 'PB' . now()->format('Ymd');
        $last = Pembelian::selectRaw('CAST(SUBSTRING(no_surat, 11) AS INTEGER) as num')
            ->orderBy('num', 'desc')
            ->value('num');
        $next = ($last ?? 0) + 1;
        $no = $prefix . str_pad($next, 3, '0', STR_PAD_LEFT);

        return response()->json(['no_surat' => $no]);
    }

    public function bayar(Pembelian $pembelian)
    {
        if ($pembelian->status === 'lunas') {
            return response()->json(['message' => 'Sudah lunas'], 400);
        }

        $pembelian->update(['status' => 'lunas']);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'update',
            'table_name' => 'pembelian',
            'reference_id' => $pembelian->id,
            'description' => 'Pembelian ' . $pembelian->no_surat . ' ditandai lunas',
        ]);

        return response()->json($pembelian);
    }

    public function destroy(Pembelian $pembelian)
    {
        return DB::transaction(function () use ($pembelian) {
            foreach ($pembelian->details as $detail) {
                $this->stokService->kurangiStok($detail->barang, $detail->qty);
            }

            $pembelian->details()->delete();
            $pembelian->delete();

            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'delete',
                'table_name' => 'pembelian',
                'reference_id' => $pembelian->id,
                'description' => 'Pembelian ' . $pembelian->no_surat . ' dihapus',
            ]);

            return response()->json(['message' => 'Dihapus']);
        });
    }
}
