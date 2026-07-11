<?php

namespace App\Imports;

use App\Models\Barang;
use App\Models\StokOpname;
use App\Models\StokOpnameDetail;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Illuminate\Support\Str;

class StokOpnameImport implements ToModel, WithHeadingRow, WithValidation
{
    protected $stokOpname;

    public function __construct(StokOpname $stokOpname)
    {
        $this->stokOpname = $stokOpname;
    }

    public function model(array $row)
    {
        $barang = Barang::where('kode_barang', $row['kode_barang'])->first();
        if (!$barang) return null;

        $stokSistem = (int) ($row['stok_sistem'] ?? $barang->stok_qty);
        $stokFisik = $row['stok_fisik'] !== '' && $row['stok_fisik'] !== null
            ? (int) $row['stok_fisik']
            : $stokSistem;

        return StokOpnameDetail::create([
            'stok_opname_id' => $this->stokOpname->id,
            'barang_id' => $barang->id,
            'stok_sistem' => $stokSistem,
            'stok_fisik' => $stokFisik,
            'selisih' => $stokFisik - $stokSistem,
        ]);
    }

    public function rules(): array
    {
        return ['kode_barang' => 'required'];
    }

    public function customValidationMessages()
    {
        return ['kode_barang.required' => 'Kode barang wajib diisi'];
    }
}
