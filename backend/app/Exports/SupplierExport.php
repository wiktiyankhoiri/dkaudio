<?php

namespace App\Exports;

use App\Models\Supplier;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class SupplierExport implements FromCollection, WithHeadings
{
    public function collection()
    {
        return Supplier::latest()->get();
    }

    public function headings(): array
    {
        return ['Kode Supplier', 'Nama Supplier', 'Alamat', 'Telepon'];
    }
}
