'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import type { Pembelian } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/auth-provider';

export default function PembelianDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const router = useRouter();
  const [data, setData] = useState<Pembelian | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPembelianDetail(id)
      .then(setData)
      .catch(() => toast.error('Gagal memuat detail'))
      .finally(() => setLoading(false));
  }, [id]);

  const { isKasir } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-48"><Loader2 className="size-6 animate-spin" /></div>;
  if (!data) return <div className="text-center text-muted-foreground py-12">Data tidak ditemukan</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold tracking-tight">Detail Pembelian</h1>
            <p className="text-sm text-muted-foreground">{data.no_surat}</p>
          </div>
        {!isKasir && (
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/pembelian/' + id + '/edit')}>
            <Pencil className="size-4" />Edit
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">No. Surat</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-semibold">{data.no_surat}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Tanggal</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-semibold">{new Date(data.tanggal).toLocaleDateString('id-ID')}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Supplier</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-semibold">{data.supplier?.nama_supplier ?? '-'}</p></CardContent>
        </Card>
      </div>
      {data.keterangan && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Keterangan</CardTitle></CardHeader>
          <CardContent><p>{data.keterangan}</p></CardContent>
        </Card>
      )}
      <Card>
        <CardHeader><CardTitle className="text-base">Detail Barang</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Barang</TableHead>
                <TableHead className="text-right">Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.details?.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">Tidak ada detail</TableCell></TableRow>
              ) : data.details?.map((d, i) => (
                <TableRow key={d.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{d.barang?.nama_barang ?? '-'}</TableCell>
                  <TableCell className="text-right">{d.qty}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
