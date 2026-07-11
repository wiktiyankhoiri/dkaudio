<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class SupplierTemplateExport implements FromCollection, WithHeadings
{
    public function collection()
    {
        return collect([
            ['SUP001', 'Contoh Supplier', 'Jl. Contoh No. 1', '08123456789'],
        ]);
    }

    public function headings(): array
    {
        return ['Kode Supplier', 'Nama Supplier', 'Alamat', 'Telepon'];
    }
}
