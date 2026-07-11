<?php

namespace App\Imports;

use App\Models\Kategori;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

class KategoriImport implements ToModel, WithHeadingRow, WithValidation
{
    public function model(array $row)
    {
        return Kategori::firstOrCreate(['nama_kategori' => $row['nama_kategori']]);
    }

    public function rules(): array
    {
        return ['nama_kategori' => 'required|string|max:255'];
    }

    public function customValidationMessages()
    {
        return ['nama_kategori.required' => 'Nama kategori wajib diisi'];
    }
}
