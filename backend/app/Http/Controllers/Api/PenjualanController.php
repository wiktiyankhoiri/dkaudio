<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Penjualan;
use App\Models\PenjualanDetail;
use App\Models\AuditLog;
use App\Services\StokService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\QueryException;
use Barryvdh\DomPDF\Facade\Pdf;

class PenjualanController extends Controller
{
    protected $stokService;

    public function __construct(StokService $stokService)
    {
        $this->stokService = $stokService;
    }

    public function index(Request $request)
    {
        return response()->json(Penjualan::with(['details.barang'])->latest()->paginate($request->per_page ?? 25));
    }

    public function store(Request $request)
    {
        $request->validate([
            'no_invoice' => 'nullable|unique:penjualan',
            'tanggal' => 'required|date',
            'konsumen' => 'nullable',
            'telepon' => 'nullable',
            'alamat' => 'nullable',
            'jatuh_tempo' => 'nullable|date',
            'diskon' => 'nullable|numeric|min:0',
            'ppn' => 'nullable|numeric|min:0',
            'dibayar' => 'nullable|numeric|min:0',
            'keterangan' => 'nullable',
            'details' => 'required|array|min:1',
            'details.*.barang_id' => 'required|exists:barang,id',
            'details.*.qty' => 'required|integer|min:1',
            'details.*.harga_jual' => 'nullable|numeric',
        ]);

        $subtotal = collect($request->details)->sum(fn($d) => $d['qty'] * ($d['harga_jual'] ?? 0));
        $diskon = (float) ($request->diskon ?? 0);
        if ($diskon > $subtotal) {
            throw ValidationException::withMessages(['diskon' => 'Diskon tidak boleh melebihi subtotal']);
        }

        $attempts = 0;
        while (true) {
            $attempts++;
            try {
                return $this->createPenjualan($request, $subtotal, $diskon);
            } catch (QueryException $e) {
                // 23505 = unique_violation (tabrakan no_invoice auto-generate)
                if (!$request->filled('no_invoice') && $e->getCode() === '23505' && $attempts < 5) {
                    continue;
                }
                throw $e;
            }
        }
    }

    protected function generateNoInvoice(): string
    {
        $prefix = 'DK' . now()->format('Ymd');
        $last = Penjualan::selectRaw('CAST(SUBSTRING(no_invoice, 11) AS INTEGER) as num')
            ->orderBy('num', 'desc')
            ->value('num');
        $next = ($last ?? 0) + 1;
        return $prefix . str_pad($next, 3, '0', STR_PAD_LEFT);
    }

    protected function createPenjualan(Request $request, float $subtotal, float $diskon)
    {
        return DB::transaction(function () use ($request, $subtotal, $diskon) {
            $noInvoice = $request->filled('no_invoice') ? $request->no_invoice : $this->generateNoInvoice();

            $ppnPersen = (float) ($request->ppn ?? 0);
            $setelahDiskon = $subtotal - $diskon;
            $ppnAmount = $setelahDiskon * ($ppnPersen / 100);
            $total = $setelahDiskon + $ppnAmount;
            $total = (float) round($total);
            $dibayar = $total;
            $status = 'lunas';

            $penjualan = Penjualan::create([
                'no_invoice' => $noInvoice,
                'tanggal' => $request->tanggal,
                'konsumen' => $request->konsumen,
                'telepon' => $request->telepon,
                'alamat' => $request->alamat,
                'jatuh_tempo' => $request->jatuh_tempo,
                'diskon' => $diskon,
                'ppn' => $ppnPersen,
                'subtotal' => $subtotal,
                'dibayar' => $dibayar,
                'total' => $total,
                'status' => $status,
                'keterangan' => $request->keterangan,
            ]);

            foreach ($request->details as $detail) {
                $barang = \App\Models\Barang::findOrFail($detail['barang_id']);
                $hargaJual = (float) ($detail['harga_jual'] ?? $barang->harga_jual);
                $detailSubtotal = $detail['qty'] * $hargaJual;

                $this->stokService->kurangiStok($barang, $detail['qty']);

                PenjualanDetail::create([
                    'penjualan_id' => $penjualan->id,
                    'barang_id' => $detail['barang_id'],
                    'qty' => $detail['qty'],
                    'harga_jual' => $hargaJual,
                    'subtotal' => $detailSubtotal,
                ]);
            }

            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'create',
                'table_name' => 'penjualan',
                'reference_id' => $penjualan->id,
                'description' => 'Penjualan ' . $penjualan->no_invoice . ' dibuat',
            ]);

            return response()->json($penjualan->load(['details.barang']), 201);
        });
    }

    public function show(Penjualan $penjualan)
    {
        return response()->json($penjualan->load(['details.barang']));
    }

    public function update(Request $request, Penjualan $penjualan)
    {
        $request->validate([
            'tanggal' => 'required|date',
            'konsumen' => 'nullable',
            'telepon' => 'nullable',
            'alamat' => 'nullable',
            'jatuh_tempo' => 'nullable|date',
            'diskon' => 'nullable|numeric|min:0',
            'ppn' => 'nullable|numeric|min:0',
            'dibayar' => 'nullable|numeric|min:0',
            'keterangan' => 'nullable',
            'details' => 'required|array|min:1',
            'details.*.barang_id' => 'required|exists:barang,id',
            'details.*.qty' => 'required|integer|min:1',
            'details.*.harga_jual' => 'nullable|numeric',
        ]);

        $subtotal = collect($request->details)->sum(fn($d) => $d['qty'] * ($d['harga_jual'] ?? 0));
        $diskon = (float) ($request->diskon ?? 0);
        if ($diskon > $subtotal) {
            throw ValidationException::withMessages(['diskon' => 'Diskon tidak boleh melebihi subtotal']);
        }

        return DB::transaction(function () use ($request, $penjualan, $subtotal, $diskon) {
            foreach ($penjualan->details as $detail) {
                $this->stokService->tambahStok($detail->barang, $detail->qty);
            }

            $penjualan->details()->delete();

            $ppnPersen = (float) ($request->ppn ?? 0);
            $setelahDiskon = $subtotal - $diskon;
            $ppnAmount = $setelahDiskon * ($ppnPersen / 100);
            $total = $setelahDiskon + $ppnAmount;
            $total = (float) round($total);
            $dibayar = $total;
            $status = 'lunas';

            $penjualan->update([
                'tanggal' => $request->tanggal,
                'konsumen' => $request->konsumen,
                'telepon' => $request->telepon,
                'alamat' => $request->alamat,
                'jatuh_tempo' => $request->jatuh_tempo,
                'diskon' => $diskon,
                'ppn' => $ppnPersen,
                'subtotal' => $subtotal,
                'dibayar' => $dibayar,
                'total' => $total,
                'status' => $status,
                'keterangan' => $request->keterangan,
            ]);

            foreach ($request->details as $detail) {
                $barang = \App\Models\Barang::findOrFail($detail['barang_id']);
                $hargaJual = (float) ($detail['harga_jual'] ?? $barang->harga_jual);
                $detailSubtotal = $detail['qty'] * $hargaJual;

                $this->stokService->kurangiStok($barang, $detail['qty']);

                PenjualanDetail::create([
                    'penjualan_id' => $penjualan->id,
                    'barang_id' => $detail['barang_id'],
                    'qty' => $detail['qty'],
                    'harga_jual' => $hargaJual,
                    'subtotal' => $detailSubtotal,
                ]);
            }

            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'update',
                'table_name' => 'penjualan',
                'reference_id' => $penjualan->id,
                'description' => 'Penjualan ' . $penjualan->no_invoice . ' diperbarui',
            ]);

            return response()->json($penjualan->load(['details.barang']));
        });
    }

    public function bayar(Penjualan $penjualan)
    {
        if ($penjualan->status === 'lunas') {
            return response()->json(['message' => 'Penjualan sudah lunas'], 400);
        }

        $penjualan->update(['dibayar' => $penjualan->total, 'status' => 'lunas']);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'update',
            'table_name' => 'penjualan',
            'reference_id' => $penjualan->id,
            'description' => 'Penjualan ' . $penjualan->no_invoice . ' lunas',
        ]);

        return response()->json($penjualan);
    }

    public function pdf(Penjualan $penjualan)
    {
        $penjualan->load(['details.barang']);
        $pdf = Pdf::loadView('pdf.invoice', ['p' => $penjualan]);
        return $pdf->download('invoice-' . $penjualan->no_invoice . '.pdf');
    }

    public function nextNumber()
    {
        $prefix = 'DK' . now()->format('Ymd');
        $last = Penjualan::selectRaw('CAST(SUBSTRING(no_invoice, 11) AS INTEGER) as num')
            ->orderBy('num', 'desc')
            ->value('num');
        $next = ($last ?? 0) + 1;
        $no = $prefix . str_pad($next, 3, '0', STR_PAD_LEFT);

        return response()->json(['no_invoice' => $no]);
    }

    public function destroy(Penjualan $penjualan)
    {
        return DB::transaction(function () use ($penjualan) {
            foreach ($penjualan->details as $detail) {
                $this->stokService->tambahStok($detail->barang, $detail->qty);
            }

            $penjualan->details()->delete();
            $penjualan->delete();

            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'delete',
                'table_name' => 'penjualan',
                'reference_id' => $penjualan->id,
                'description' => 'Penjualan ' . $penjualan->no_invoice . ' dihapus',
            ]);

            return response()->json(['message' => 'Dihapus']);
        });
    }
}
