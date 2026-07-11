'use client';
import { useEffect, useState } from 'react';
import { formatRp } from '@/lib/format';
import { api } from '@/services/api';
import type { Kategori } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function LaporanStokPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [kategori, setKategori] = useState<Kategori[]>([]);
  const [kategoriId, setKategoriId] = useState('');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    api.getKategori('per_page=9999').then(r => setKategori(r.data)).catch(() => {});
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (kategoriId) params.set('kategori_id', kategoriId);
      if (searchText) params.set('search', searchText);
      const res = await api.getLaporanStok(params.toString());
      setData(res);
    } catch { toast.error('Gagal memuat laporan'); }
    finally { setLoading(false); }
  };

  const handleExport = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    api.download('/api/barang/export', 'laporan-stok-' + date + '.xlsx');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Laporan Stok</h1>
          <p className="text-sm text-muted-foreground">Laporan data stok barang</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}><Download className="size-4" />Export Excel</Button>
          <Button onClick={handleSearch} disabled={loading}><Search className="size-4" />Tampilkan</Button>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Filter</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1 min-w-[180px]">
              <label className="text-sm font-medium">Kategori</label>
              <Select value={kategoriId} onValueChange={v => setKategoriId(v === 'all' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Semua kategori" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {kategori.map(k => <SelectItem key={k.id} value={String(k.id)}>{k.nama_kategori}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-[200px]">
              <label className="text-sm font-medium">Cari Barang</label>
              <Input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Nama atau kode barang" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Data Stok</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Kode</TableHead>
                <TableHead>Nama Barang</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Stok</TableHead>
                <TableHead className="text-right">Harga Beli</TableHead>
                <TableHead className="text-right">Harga Jual</TableHead>
                <TableHead className="text-right">Total Nilai</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-5 w-full" /></TableCell></TableRow>
              )) : data.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground">Klik Tampilkan untuk melihat data</TableCell></TableRow>
              ) : data.map((item: any, i: number) => (
                <TableRow key={i}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{item.kode_barang}</TableCell>
                  <TableCell className="font-medium">{item.nama_barang}</TableCell>
                  <TableCell>{item.kategori?.nama_kategori ?? '-'}</TableCell>
                  <TableCell className="text-right">{item.stok_qty ?? 0}</TableCell>
                  <TableCell className="text-right">{formatRp(item.harga_beli ?? 0)}</TableCell>
                  <TableCell className="text-right">{formatRp(item.harga_jual ?? 0)}</TableCell>
                  <TableCell className="text-right font-medium">{formatRp((item.stok_qty ?? 0) * (item.harga_beli ?? 0))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
