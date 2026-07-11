<?php

namespace App\Imports;

use App\Models\Supplier;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

class SupplierImport implements ToModel, WithHeadingRow, WithValidation
{
    public function model(array $row)
    {
        return Supplier::updateOrCreate(
            ['kode_supplier' => $row['kode_supplier']],
            [
                'nama_supplier' => $row['nama_supplier'],
                'alamat' => $row['alamat'] ?? null,
                'telepon' => $row['telepon'] ?? null,
            ]
        );
    }

    public function rules(): array
    {
        return [
            'kode_supplier' => 'required|string|max:50',
            'nama_supplier' => 'required|string|max:255',
            'alamat' => 'nullable|string|max:500',
            'telepon' => 'nullable|string|max:20',
        ];
    }

    public function customValidationMessages()
    {
        return [
            'kode_supplier.required' => 'Kode supplier wajib diisi',
            'nama_supplier.required' => 'Nama supplier wajib diisi',
        ];
    }
}
