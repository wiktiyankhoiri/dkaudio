'use client';
import { useState, useEffect } from 'react';
import { formatRp } from '@/lib/format';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import type { Penjualan } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Loader2, User, Calendar, FileText, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

export default function PenjualanDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const router = useRouter();
  const [data, setData] = useState<Penjualan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getPenjualanDetail(id)
      .then(setData)
      .catch(() => toast.error('Gagal memuat detail'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-48"><Loader2 className="size-6 animate-spin" /></div>;
  if (!data) return <div className="text-center text-muted-foreground py-12">Data tidak ditemukan</div>;

  const ppnAmount = data.ppn > 0 ? (data.subtotal - data.diskon) * (data.ppn / 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <ShoppingBag className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Detail Penjualan</h1>
            <p className="text-sm text-muted-foreground">{data.no_invoice}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" onClick={() => router.back()}>Kembali</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card size="sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid size-9 place-items-center rounded-lg bg-muted">
              <FileText className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">No. Invoice</p>
              <p className="truncate font-medium">{data.no_invoice}</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid size-9 place-items-center rounded-lg bg-muted">
              <Calendar className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Tanggal</p>
              <p className="truncate font-medium">{new Date(data.tanggal).toLocaleDateString('id-ID')}</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid size-9 place-items-center rounded-lg bg-muted">
              <User className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Konsumen</p>
              <p className="truncate font-medium">{data.konsumen ?? '-'}</p>
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid size-9 place-items-center rounded-lg bg-muted">
              <ShoppingBag className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="truncate font-semibold">{formatRp(data.total)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {data.telepon || data.alamat || data.konsumen ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal flex items-center gap-2">
              <User className="size-3.5" />
              Pelanggan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-1">
              <p className="font-medium">{data.konsumen ?? 'Walk-in Customer'}</p>
              {data.telepon && <p className="text-sm text-muted-foreground">Telp: {data.telepon}</p>}
              {data.alamat && <p className="text-sm text-muted-foreground">{data.alamat}</p>}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {data.keterangan && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-normal text-muted-foreground">Keterangan</CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-sm">{data.keterangan}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Detail Barang</CardTitle>
            <CardDescription>{data.details?.length ?? 0} item</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Barang</TableHead>
                  <TableHead className="text-center w-16">Qty</TableHead>
                  <TableHead className="text-right w-28">Harga</TableHead>
                  <TableHead className="text-right w-28">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.details?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Tidak ada detail</TableCell></TableRow>
                ) : data.details?.map((d, i) => (
                  <TableRow key={d.id}>
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell className="font-medium">{d.barang?.nama_barang ?? '-'}</TableCell>
                    <TableCell className="text-center">{d.qty}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatRp(d.harga_jual)}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{formatRp(d.subtotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ringkasan</CardTitle>
            <CardDescription>Rincian pembayaran</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatRp(data.subtotal)}</span>
            </div>
            {data.diskon > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Diskon</span>
                <span className="tabular-nums">-{formatRp(data.diskon)}</span>
              </div>
            )}
            {data.ppn > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>PPN ({data.ppn}%)</span>
                <span className="tabular-nums">+{formatRp(ppnAmount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold text-base">
              <span>Total</span>
              <span className="tabular-nums">{formatRp(data.total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
