<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StokOpname;
use App\Models\StokOpnameDetail;
use App\Models\AuditLog;
use App\Models\Barang;
use App\Models\PenyesuaianStok;
use App\Services\StokService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\QueryException;
use App\Exports\StokOpnameTemplateExport;
use App\Imports\StokOpnameImport;
use Maatwebsite\Excel\Facades\Excel;

class StokOpnameController extends Controller
{
    protected $stokService;

    public function __construct(StokService $stokService)
    {
        $this->stokService = $stokService;
    }

    public function index(Request $request)
    {
        return response()->json(StokOpname::with(['user', 'details.barang'])->latest()->paginate($request->per_page ?? 25));
    }

    public function store(Request $request)
    {
        $request->validate([
            'no_opname' => 'nullable|unique:stok_opname',
            'tanggal_opname' => 'required|date',
            'catatan' => 'nullable',
            'details' => 'required|array|min:1',
            'details.*.barang_id' => 'required|exists:barang,id',
            'details.*.stok_fisik' => 'required|integer|min:0',
            'details.*.keterangan' => 'nullable',
        ]);

        $attempts = 0;
        while (true) {
            $attempts++;
            try {
                return $this->createStokOpname($request);
            } catch (QueryException $e) {
                if (!$request->filled('no_opname') && $e->getCode() === '23505' && $attempts < 5) {
                    continue;
                }
                throw $e;
            }
        }
    }

    protected function generateNoOpname(): string
    {
        $prefix = 'SO' . now()->format('Ymd');
        $last = StokOpname::selectRaw('CAST(SUBSTRING(no_opname, 11) AS INTEGER) as num')
            ->orderBy('num', 'desc')
            ->value('num');
        $next = ($last ?? 0) + 1;
        return $prefix . str_pad($next, 3, '0', STR_PAD_LEFT);
    }

    protected function createStokOpname(Request $request)
    {
        return DB::transaction(function () use ($request) {
            $noOpname = $request->filled('no_opname') ? $request->no_opname : $this->generateNoOpname();

            $stokOpname = StokOpname::create([
                'no_opname' => $noOpname,
                'tanggal_opname' => $request->tanggal_opname,
                'status' => 'draft',
                'catatan' => $request->catatan,
                'user_id' => auth()->id(),
            ]);

            foreach ($request->details as $detail) {
                $barang = Barang::findOrFail($detail['barang_id']);
                $stokSistem = $this->stokService->getStok($barang);

                StokOpnameDetail::create([
                    'stok_opname_id' => $stokOpname->id,
                    'barang_id' => $detail['barang_id'],
                    'stok_sistem' => $stokSistem,
                    'stok_fisik' => $detail['stok_fisik'],
                    'selisih' => $detail['stok_fisik'] - $stokSistem,
                    'keterangan' => $detail['keterangan'] ?? null,
                ]);
            }

            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'create',
                'table_name' => 'stok_opname',
                'reference_id' => $stokOpname->id,
                'description' => 'Stok opname ' . $stokOpname->no_opname . ' dibuat',
            ]);

            return response()->json($stokOpname->load(['user', 'details.barang']), 201);
        });
    }

    public function exportTemplate()
    {
        return Excel::download(new StokOpnameTemplateExport, 'template-opname-' . now()->format('Ymd') . '.xlsx');
    }

    public function importExcel(Request $request)
    {
        $request->validate(['file' => 'required|file|mimes:xlsx,xls,csv|max:10240']);

        $stokOpname = StokOpname::create([
            'no_opname' => $this->generateNoOpname(),
            'tanggal_opname' => now()->toDateString(),
            'status' => 'draft',
            'user_id' => auth()->id(),
        ]);

        Excel::import(new StokOpnameImport($stokOpname), $request->file('file'));

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'import',
            'table_name' => 'stok_opname',
            'reference_id' => $stokOpname->id,
            'description' => 'Stok opname ' . $stokOpname->no_opname . ' diimport dari Excel',
        ]);

        return response()->json($stokOpname->load(['user', 'details.barang']), 201);
    }

    public function nextNumber()
    {
        $prefix = 'SO' . now()->format('Ymd');
        $last = StokOpname::selectRaw('CAST(SUBSTRING(no_opname, 11) AS INTEGER) as num')
            ->orderBy('num', 'desc')
            ->value('num');
        $next = ($last ?? 0) + 1;
        $no = $prefix . str_pad($next, 3, '0', STR_PAD_LEFT);

        return response()->json(['no_opname' => $no]);
    }

    public function show(StokOpname $stokOpname)
    {
        return response()->json($stokOpname->load(['user', 'details.barang']));
    }

    public function update(Request $request, StokOpname $stokOpname)
    {
        if ($stokOpname->status !== 'draft') {
            return response()->json(['message' => 'Hanya opname draft yang bisa diubah'], 422);
        }

        $request->validate([
            'catatan' => 'nullable',
            'details' => 'required|array|min:1',
            'details.*.id' => 'nullable|exists:stok_opname_detail,id',
            'details.*.barang_id' => 'required|exists:barang,id',
            'details.*.stok_fisik' => 'required|integer|min:0',
            'details.*.keterangan' => 'nullable',
        ]);

        return DB::transaction(function () use ($request, $stokOpname) {
            $existingDetailIds = $stokOpname->details()->pluck('id')->toArray();
            $submittedDetailIds = [];

            foreach ($request->details as $detail) {
                $barang = Barang::findOrFail($detail['barang_id']);
                $stokSistem = $this->stokService->getStok($barang);

                $data = [
                    'stok_opname_id' => $stokOpname->id,
                    'barang_id' => $detail['barang_id'],
                    'stok_sistem' => $stokSistem,
                    'stok_fisik' => $detail['stok_fisik'],
                    'selisih' => $detail['stok_fisik'] - $stokSistem,
                    'keterangan' => $detail['keterangan'] ?? null,
                ];

                if (isset($detail['id']) && in_array($detail['id'], $existingDetailIds)) {
                    StokOpnameDetail::findOrFail($detail['id'])->update($data);
                    $submittedDetailIds[] = $detail['id'];
                } else {
                    $newDetail = StokOpnameDetail::create($data);
                    $submittedDetailIds[] = $newDetail->id;
                }
            }

            $toDelete = array_diff($existingDetailIds, $submittedDetailIds);
            StokOpnameDetail::whereIn('id', $toDelete)->delete();

            if ($request->has('catatan')) {
                $stokOpname->update(['catatan' => $request->catatan]);
            }

            return response()->json($stokOpname->load(['user', 'details.barang']));
        });
    }

    public function selesaikan(StokOpname $stokOpname)
    {
        if ($stokOpname->status !== 'draft') {
            return response()->json(['message' => 'Hanya opname draft yang bisa diselesaikan'], 422);
        }

        $stokOpname->update(['status' => 'selesai']);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'selesaikan',
            'table_name' => 'stok_opname',
            'reference_id' => $stokOpname->id,
            'description' => 'Stok opname ' . $stokOpname->no_opname . ' diselesaikan',
        ]);

        return response()->json($stokOpname->load(['user', 'details.barang']));
    }

    public function terapkan(StokOpname $stokOpname)
    {
        if ($stokOpname->status !== 'selesai') {
            return response()->json(['message' => 'Hanya opname selesai yang bisa diterapkan'], 422);
        }

        return DB::transaction(function () use ($stokOpname) {
            foreach ($stokOpname->details as $detail) {
                $barang = $detail->barang;
                $stokSekarang = $this->stokService->getStok($barang);

                PenyesuaianStok::create([
                    'tanggal' => now(),
                    'barang_id' => $detail->barang_id,
                    'qty_sebelum' => $stokSekarang,
                    'qty_sesudah' => $detail->stok_fisik,
                    'selisih' => $detail->selisih,
                    'alasan' => 'Opname: ' . $stokOpname->no_opname . ' - ' . ($detail->keterangan ?? ''),
                    'user_id' => auth()->id(),
                ]);

                $this->stokService->sesuaikanStok($barang, $detail->stok_fisik);
            }

            $stokOpname->update(['status' => 'diterapkan']);

            AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'terapkan',
                'table_name' => 'stok_opname',
                'reference_id' => $stokOpname->id,
                'description' => 'Stok opname ' . $stokOpname->no_opname . ' diterapkan',
            ]);

            return response()->json($stokOpname->load(['user', 'details.barang']));
        });
    }

    public function batalkan(StokOpname $stokOpname)
    {
        if (!in_array($stokOpname->status, ['draft', 'selesai'])) {
            return response()->json(['message' => 'Opname tidak bisa dibatalkan'], 422);
        }

        $stokOpname->update(['status' => 'dibatalkan']);

        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => 'batalkan',
            'table_name' => 'stok_opname',
            'reference_id' => $stokOpname->id,
            'description' => 'Stok opname ' . $stokOpname->no_opname . ' dibatalkan',
        ]);

        return response()->json($stokOpname->load(['user', 'details.barang']));
    }
}
