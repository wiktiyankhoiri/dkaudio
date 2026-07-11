'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import type { Barang, StokOpname } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Save, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateStokOpnamePage() {
  const router = useRouter();
  const [barang, setBarang] = useState<Barang[]>([]);
  const [noOpname, setNoOpname] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [catatan, setCatatan] = useState('');
  const [details, setDetails] = useState<{ barang_id: number; stok_sistem: number; stok_fisik: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const result = await api.upload<StokOpname>('/api/stok-opname/import', formData);
      toast.success('Import berhasil');
      router.push('/dashboard/stok-opname/' + result.id);
    } catch { toast.error('Gagal import'); }
    e.target.value = '';
  };

  useEffect(() => {
    Promise.all([api.getBarang('per_page=9999'), api.getStokOpnameNextNumber()])
      .then(([bRes, nRes]) => {
        const list = bRes.data;
        setBarang(list);
        setNoOpname(nRes.no_opname);
        setDetails(list.map(b => ({ barang_id: b.id, stok_sistem: b.stok_qty ?? 0, stok_fisik: b.stok_qty ?? 0 })));
      })
      .catch(() => toast.error('Gagal memuat data barang'));
  }, []);

  const updateDetail = (idx: number, value: number) =>
    setDetails(prev => prev.map((d, i) => i === idx ? { ...d, stok_fisik: value } : d));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggal) { toast.error('Tanggal wajib diisi'); return; }
    setSaving(true);
    try {
      await api.createStokOpname({ no_opname: noOpname || undefined, tanggal_opname: tanggal, catatan: catatan || undefined, details });
      toast.success('Stok opname dibuat');
      router.push('/dashboard/stok-opname');
    } catch { toast.error('Gagal membuat opname'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Tambah Stok Opname</h1>
          <p className="text-sm text-muted-foreground">Buat stok opname baru</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => {
            const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            api.download('/api/stok-opname/template', 'template-opname-' + today + '.xlsx');
          }}>
            <Download className="size-4" />Download Template
          </Button>
          <input type="file" accept=".xlsx,.xls" ref={fileInputRef} onChange={handleUpload} className="hidden" />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="size-4" />Upload Excel
          </Button>
        </div>
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
                {details.map((d, i) => (
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
          <Button type="submit" disabled={saving}><Save className="size-4" />{saving ? 'Menyimpan...' : 'Simpan'}</Button>
          <Button type="button" variant="default" onClick={() => router.back()}>Batal</Button>
        </div>
      </form>
    </div>
  );
}
