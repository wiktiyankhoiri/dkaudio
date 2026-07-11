<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class KategoriTemplateExport implements FromCollection, WithHeadings
{
    public function collection()
    {
        return collect([
            ['Contoh Kategori'],
        ]);
    }

    public function headings(): array
    {
        return ['Nama Kategori'];
    }
}
