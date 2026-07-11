<?php

namespace App\Exports;

use App\Models\Barang;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class BarangExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        return Barang::with(['kategori', 'stok'])->latest()->get();
    }

    public function headings(): array
    {
        return ['Kode Barang', 'Nama Barang', 'Kategori', 'Satuan', 'Harga Beli', 'Harga Jual', 'Stok'];
    }

    public function map($barang): array
    {
        return [
            $barang->kode_barang,
            $barang->nama_barang,
            $barang->kategori?->nama_kategori ?? '',
            $barang->satuan,
            $barang->harga_beli,
            $barang->harga_jual,
            $barang->stok_qty,
        ];
    }
}
