<?php

namespace App\Exports;

use App\Models\Barang;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class StokOpnameTemplateExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        return Barang::with('stok')->orderBy('kode_barang')->get();
    }

    public function headings(): array
    {
        return ['Kode Barang', 'Nama Barang', 'Stok Sistem', 'Stok Fisik'];
    }

    public function map($barang): array
    {
        return [
            $barang->kode_barang,
            $barang->nama_barang,
            $barang->stok_qty,
            '',
        ];
    }
}
