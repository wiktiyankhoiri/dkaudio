<?php

namespace App\Imports;

use App\Models\Barang;
use App\Models\Kategori;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

class BarangImport implements ToModel, WithHeadingRow, WithValidation
{
    public function model(array $row)
    {
        $kategori = Kategori::where('nama_kategori', $row['kategori'])->first();

        return Barang::updateOrCreate(
            ['kode_barang' => $row['kode_barang']],
            [
                'nama_barang' => $row['nama_barang'],
                'kategori_id' => $kategori?->id ?? 1,
                'satuan' => $row['satuan'] ?? 'PCS',
                'harga_beli' => (float) ($row['harga_beli'] ?? 0),
                'harga_jual' => (float) ($row['harga_jual'] ?? 0),
            ]
        );
    }

    public function rules(): array
    {
        return [
            'kode_barang' => 'required|string|max:50',
            'nama_barang' => 'required|string|max:255',
            'satuan' => 'nullable|in:PCS,SET',
            'harga_beli' => 'nullable|numeric|min:0',
            'harga_jual' => 'nullable|numeric|min:0',
        ];
    }

    public function customValidationMessages()
    {
        return [
            'kode_barang.required' => 'Kode barang wajib diisi',
            'nama_barang.required' => 'Nama barang wajib diisi',
        ];
    }
}
