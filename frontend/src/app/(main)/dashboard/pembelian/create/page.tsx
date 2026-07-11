'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import type { Supplier, Barang } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarangSelect } from '@/components/barang-select';
import { Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CreatePembelianPage() {
  const router = useRouter();
  const [supplier, setSupplier] = useState<Supplier[]>([]);
  const [barang, setBarang] = useState<Barang[]>([]);
  const [noSurat, setNoSurat] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [supplierId, setSupplierId] = useState<number | null>(null);
  const [keterangan, setKeterangan] = useState('');
  const [details, setDetails] = useState<{ barang_id: number; qty: number; harga_beli: number }[]>([{ barang_id: 0, qty: 1, harga_beli: 0 }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.getSupplier('per_page=9999'), api.getBarang('per_page=9999')])
      .then(([s, b]) => { setSupplier(s.data); setBarang(b.data); })
      .catch(() => toast.error('Gagal memuat data'));
  }, []);

  const addRow = () => setDetails(prev => [...prev, { barang_id: 0, qty: 1, harga_beli: 0 }]);
  const removeRow = (idx: number) => setDetails(prev => prev.filter((_, i) => i !== idx));
  const updateDetail = (idx: number, field: 'barang_id' | 'qty' | 'harga_beli', value: number) =>
    setDetails(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  const handleBarangChange = (idx: number, id: number) => {
    const b = barang.find(x => x.id === id);
    setDetails(prev => prev.map((d, i) => i === idx ? { ...d, barang_id: id, harga_beli: b?.harga_beli ?? 0 } : d));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noSurat || !tanggal) { toast.error('No. surat dan tanggal wajib diisi'); return; }
    if (details.some(d => !d.barang_id || d.qty < 1 || !d.harga_beli)) { toast.error('Semua detail barang harus diisi dengan benar'); return; }
    setSaving(true);
    try {
      await api.createPembelian({ no_surat: noSurat, tanggal, supplier_id: supplierId, keterangan: keterangan || undefined, details });
      toast.success('Pembelian dibuat');
      router.push('/dashboard/pembelian');
    } catch { toast.error('Gagal membuat Pembelian'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div><h1 className="text-2xl font-semibold tracking-tight">Tambah Pembelian</h1>
          <p className="text-sm text-muted-foreground">Buat transaksi Pembelian baru</p>
        </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Informasi Pembelian</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">No. Surat</label>
                <Input value={noSurat} onChange={e => setNoSurat(e.target.value)} placeholder="Nomor dari supplier" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Tanggal</label>
                <Input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Supplier</label>
                <Select onValueChange={v => setSupplierId(Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Pilih supplier (opsional)" /></SelectTrigger>
                  <SelectContent>
                    {supplier.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.nama_supplier}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Keterangan</label>
                <Input value={keterangan} onChange={e => setKeterangan(e.target.value)} placeholder="Opsional" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Detail Barang</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addRow}><Plus className="size-4" />Tambah Barang</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {details.map((d, idx) => (
              <div key={idx} className="flex items-end gap-3 border-b pb-3 last:border-0">
                <div className="flex-[2] space-y-1">
                  <label className="text-sm font-medium">Barang</label>
                  <BarangSelect barang={barang} value={d.barang_id} onSelect={v => handleBarangChange(idx, v)} />
                </div>
                <div className="w-20 space-y-1">
                  <label className="text-sm font-medium">Qty</label>
                  <Input type="number" min={1} value={d.qty} onChange={e => updateDetail(idx, 'qty', Number(e.target.value))} />
                </div>
                <div className="w-28 space-y-1">
                  <label className="text-sm font-medium">Harga Beli</label>
                  <Input type="number" step="1" min={0} value={d.harga_beli || ''} onChange={e => updateDetail(idx, 'harga_beli', Number(e.target.value))} />
                </div>
                {details.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(idx)}><Trash2 className="size-4 text-red-500" /></Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}><Save className="size-4" />{saving ? 'Menyimpan...' : 'Simpan'}</Button>
          <Button type="button" variant="default" onClick={() => router.back()}>Batal</Button>
        </div>
      </form>
    </div>
  );
}
