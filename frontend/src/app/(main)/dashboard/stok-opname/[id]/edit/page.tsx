'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import type { Barang } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EditStokOpnamePage() {
  const params = useParams();
  const id = Number(params.id);
  const router = useRouter();
  const [barang, setBarang] = useState<Barang[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [noOpname, setNoOpname] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [catatan, setCatatan] = useState('');
  const [details, setDetails] = useState<{ id?: number; barang_id: number; stok_sistem: number; stok_fisik: number }[]>([]);

  useEffect(() => {
    Promise.all([api.getBarang('per_page=9999'), api.getStokOpnameDetail(id)])
      .then(([bRes, data]) => {
        setBarang(bRes.data);
        if (data.status !== 'draft') {
          toast.error('Hanya opname draft yang bisa diedit');
          router.push('/dashboard/stok-opname/' + id);
          return;
        }
        setNoOpname(data.no_opname);
        setTanggal(data.tanggal_opname);
        setCatatan(data.catatan ?? '');
        setDetails(data.details?.map(d => ({
          id: d.id,
          barang_id: d.barang_id,
          stok_sistem: d.stok_sistem,
          stok_fisik: d.stok_fisik,
        })) ?? []);
      })
      .catch(() => toast.error('Gagal memuat data'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const updateDetail = (idx: number, value: number) =>
    setDetails(prev => prev.map((d, i) => i === idx ? { ...d, stok_fisik: value } : d));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggal) { toast.error('Tanggal wajib diisi'); return; }
    setSaving(true);
    try {
      await api.updateStokOpname(id, { catatan: catatan || undefined, details });
      toast.success('Stok opname diupdate');
      router.push('/dashboard/stok-opname/' + id);
    } catch { toast.error('Gagal mengupdate opname'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-48"><Loader2 className="size-6 animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div><h1 className="text-2xl font-semibold tracking-tight">Edit Stok Opname</h1>
          <p className="text-sm text-muted-foreground">{noOpname}</p>
        </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Informasi Opname</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">No. Opname</label>
                <Input value={noOpname} readOnly className="text-muted-foreground bg-muted" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Tanggal Opname</label>
                <Input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium">Catatan</label>
                <Input value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Opsional" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Detail Barang</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Barang</TableHead>
                  <TableHead className="text-right">Stok Sistem</TableHead>
                  <TableHead className="text-right">Stok Fisik</TableHead>
                  <TableHead className="text-right">Selisih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {details.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Tidak ada detail</TableCell></TableRow>
                ) : details.map((d, i) => (
                  <TableRow key={d.barang_id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{barang.find(b => b.id === d.barang_id)?.nama_barang ?? '-'}</TableCell>
                    <TableCell className="text-right">{d.stok_sistem}</TableCell>
                    <TableCell className="text-right">
                      <Input type="number" min={0} value={d.stok_fisik} onChange={e => updateDetail(i, Number(e.target.value))} className="w-24 ml-auto text-right" />
                    </TableCell>
                    <TableCell className="text-right font-medium">{d.stok_fisik - d.stok_sistem}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}><Save className="size-4" />{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</Button>
          <Button type="button" variant="default" onClick={() => router.back()}>Batal</Button>
        </div>
      </form>
    </div>
  );
}
