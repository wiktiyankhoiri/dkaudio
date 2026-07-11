<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class BarangTemplateExport implements FromCollection, WithHeadings
{
    public function collection()
    {
        return collect([
            ['BRG001', 'Contoh Barang', 'Speaker', 'PCS', '100000', '150000'],
        ]);
    }

    public function headings(): array
    {
        return ['Kode Barang', 'Nama Barang', 'Kategori', 'Satuan', 'Harga Beli', 'Harga Jual'];
    }
}
