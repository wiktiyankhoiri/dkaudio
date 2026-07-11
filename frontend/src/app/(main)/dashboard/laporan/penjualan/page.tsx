'use client';
import { useState } from 'react';
import { formatRp } from '@/lib/format';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function LaporanPenjualanPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);
      const res = await api.getLaporanPenjualan(params.toString());
      setData(res);
    } catch { toast.error('Gagal memuat laporan'); }
    finally { setLoading(false); }
  };

  const handleExport = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    api.download('/api/penjualan?per_page=9999', 'laporan-penjualan-' + date + '.json');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Laporan Penjualan</h1>
          <p className="text-sm text-muted-foreground">Laporan transaksi Penjualan</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}><Download className="size-4" />Export Excel</Button>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Filter</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Dari Tanggal</label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Sampai Tanggal</label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <Button onClick={handleSearch} disabled={loading}><Search className="size-4" />Tampilkan</Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Data Penjualan</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>No. Invoice</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Konsumen</TableHead>
                <TableHead>Barang</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Harga</TableHead>
                <TableHead className="text-right">Total</TableHead>
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
                  <TableCell>{item.no_invoice}</TableCell>
                  <TableCell>{new Date(item.tanggal).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell>{item.konsumen ?? '-'}</TableCell>
                  <TableCell>{item.nama_barang}</TableCell>
                  <TableCell className="text-right">{item.qty}</TableCell>
                  <TableCell className="text-right">{formatRp(item.harga_jual ?? 0)}</TableCell>
                  <TableCell className="text-right font-medium">{formatRp((item.qty ?? 0) * (item.harga_jual ?? 0))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
