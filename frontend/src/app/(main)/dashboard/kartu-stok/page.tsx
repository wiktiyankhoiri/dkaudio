'use client';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { Barang } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

export default function KartuStokPage() {
  const [barang, setBarang] = useState<Barang[]>([]);
  const [barangId, setBarangId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    api.getBarang('per_page=9999').then(r => setBarang(r.data)).catch(() => toast.error('Gagal memuat barang'));
  }, []);

  const handleSearch = async () => {
    if (!barangId) { toast.error('Pilih barang terlebih dahulu'); return; }
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      params.set('barang_id', String(barangId));
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);
      const res = await api.getKartuStok(params.toString());
      setData(res.transaksi ?? []);
    } catch { toast.error('Gagal memuat kartu stok'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Kartu Stok</h1>
        <p className="text-sm text-muted-foreground">Riwayat pergerakan stok barang</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Filter</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1 min-w-[200px]">
              <label className="text-sm font-medium">Barang</label>
              <Select onValueChange={v => setBarangId(Number(v))}>
                <SelectTrigger><SelectValue placeholder="Pilih barang" /></SelectTrigger>
                <SelectContent>
                  {barang.map(b => <SelectItem key={b.id} value={String(b.id)}>{b.nama_barang}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Dari Tanggal</label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Sampai Tanggal</label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <Button onClick={handleSearch} disabled={loading}><Search className="size-4" />Cari</Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Riwayat</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Ref</TableHead>
                <TableHead className="text-right">Masuk</TableHead>
                <TableHead className="text-right">Keluar</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-5 w-full" /></TableCell></TableRow>
              )) : !searched ? (
                <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Pilih barang dan klik Cari</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Tidak ada data</TableCell></TableRow>
              ) : data.map((item: any, i: number) => (
                <TableRow key={i}>
                  <TableCell>{new Date(item.tanggal).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell className="capitalize">{item.tipe}</TableCell>
                  <TableCell>{item.ref ?? '-'}</TableCell>
                  <TableCell className="text-right text-green-600">{item.masuk ?? '-'}</TableCell>
                  <TableCell className="text-right text-red-600">{item.keluar ?? '-'}</TableCell>
                  <TableCell className="text-right font-medium">{item.saldo}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
