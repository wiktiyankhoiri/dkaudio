'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import type { Barang } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarangSelect } from '@/components/barang-select';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

export default function CreatePenyesuaianStokPage() {
  const router = useRouter();
  const [barang, setBarang] = useState<Barang[]>([]);
  const [barangId, setBarangId] = useState<number | null>(null);
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [qtySesudah, setQtySesudah] = useState(0);
  const [alasan, setAlasan] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedBarang, setSelectedBarang] = useState<Barang | null>(null);

  useEffect(() => {
    api.getBarang('per_page=9999').then(r => setBarang(r.data)).catch(() => toast.error('Gagal memuat data barang'));
  }, []);

  const handleBarangChange = (id: number) => {
    setBarangId(id);
    setSelectedBarang(barang.find(b => b.id === id) ?? null);
    setQtySesudah(barang.find(b => b.id === id)?.stok_qty ?? 0);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barangId || !tanggal) { toast.error('Barang dan tanggal wajib diisi'); return; }
    if (qtySesudah < 0) { toast.error('Qty tidak boleh negatif'); return; }
    setSaving(true);
    try {
      await api.createPenyesuaianStok({ barang_id: barangId, tanggal, qty_sesudah: qtySesudah, alasan: alasan || undefined });
      toast.success('Penyesuaian stok dibuat');
      router.push('/dashboard/penyesuaian-stok');
    } catch { toast.error('Gagal membuat penyesuaian'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div><h1 className="text-2xl font-semibold tracking-tight">Tambah Penyesuaian Stok</h1>
          <p className="text-sm text-muted-foreground">Sesuaikan stok barang</p>
        </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Form Penyesuaian</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Barang</label>
                  <BarangSelect barang={barang} value={barangId ?? 0} onSelect={v => handleBarangChange(v)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Tanggal</label>
                <Input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Stok Saat Ini</label>
                <Input value={selectedBarang?.stok_qty ?? 0} disabled />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Stok Baru</label>
                <Input type="number" min={0} value={qtySesudah || ''} onChange={e => setQtySesudah(Number(e.target.value))} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium">Alasan</label>
                <Input value={alasan} onChange={e => setAlasan(e.target.value)} placeholder="Alasan penyesuaian" />
              </div>
            </div>
            {selectedBarang && (
              <div className="rounded-md bg-muted p-3 text-sm">
                Selisih: <span className="font-semibold">{qtySesudah - (selectedBarang.stok_qty ?? 0)}</span>
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving}><Save className="size-4" />{saving ? 'Menyimpan...' : 'Simpan'}</Button>
              <Button type="button" variant="default" onClick={() => router.back()}>Batal</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
