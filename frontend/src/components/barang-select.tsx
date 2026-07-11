'use client';
import { useState, useMemo } from 'react';
import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty, ComboboxTrigger } from '@/components/ui/combobox';
import type { Barang } from '@/types';

interface BarangSelectProps {
  barang: Barang[];
  value: number;
  onSelect: (barangId: number) => void;
  placeholder?: string;
}

export function BarangSelect({ barang, value, onSelect, placeholder = 'Pilih barang' }: BarangSelectProps) {
  const [inputValue, setInputValue] = useState('');
  const selected = barang.find(b => b.id === value);

  const filtered = useMemo(() => {
    if (!inputValue) return barang;
    const q = inputValue.toLowerCase();
    return barang.filter(b =>
      b.nama_barang.toLowerCase().includes(q) ||
      b.kode_barang.toLowerCase().includes(q)
    );
  }, [barang, inputValue]);

  return (
    <Combobox
      key={value}
      value={String(value || '')}
      onValueChange={v => onSelect(Number(v))}
      onInputValueChange={setInputValue}
    >
      <ComboboxTrigger className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-left outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 flex items-center justify-between gap-1 data-placeholder:text-muted-foreground [&_svg:not([class*='size-'])]:size-4">
        <span className="truncate">{selected ? selected.nama_barang : <span className="text-muted-foreground">{placeholder}</span>}</span>
      </ComboboxTrigger>
      <ComboboxContent>
        <div className="p-1">
          <ComboboxInput showTrigger={false} placeholder="Cari barang..." className="w-full" />
        </div>
        <ComboboxList>
          {filtered.map(b => (
            <ComboboxItem key={b.id} value={String(b.id)} className="min-w-0">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="truncate">{b.nama_barang}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{b.kode_barang}</span>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{b.stok_qty ?? 0}</span>
            </ComboboxItem>
          ))}
          <ComboboxEmpty>Tidak ditemukan</ComboboxEmpty>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
