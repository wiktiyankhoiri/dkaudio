'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import type { StokOpname } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CheckCircle, XCircle, Play, Pencil } from 'lucide-react';
import { toast } from 'sonner';

const statusColor: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'default', selesai: 'outline', diterapkan: 'secondary', dibatalkan: 'destructive',
};

export default function StokOpnameDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const router = useRouter();
  const [data, setData] = useState<StokOpname | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = () => {
    setLoading(true);
    api.getStokOpnameDetail(id)
      .then(setData)
      .catch(() => toast.error('Gagal memuat detail'))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [id]);

  const handleSelesaikan = async () => {
    setActionLoading(true);
    try { await api.selesaikanOpname(id); toast.success('Opname selesai'); load(); }
    catch { toast.error('Gagal'); }
    finally { setActionLoading(false); }
  };

  const handleTerapkan = async () => {
    setActionLoading(true);
    try { await api.terapkanOpname(id); toast.success('Opname diterapkan'); load(); }
    catch { toast.error('Gagal'); }
    finally { setActionLoading(false); }
  };

  const handleBatalkan = async () => {
    setActionLoading(true);
    try { await api.batalkanOpname(id); toast.success('Opname dibatalkan'); load(); }
    catch { toast.error('Gagal'); }
    finally { setActionLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-48"><Loader2 className="size-6 animate-spin" /></div>;
  if (!data) return <div className="text-center text-muted-foreground py-12">Data tidak ditemukan</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Detail Stok Opname</h1>
          <p className="text-sm text-muted-foreground">{data.no_opname}</p>
        </div>
        <div className="flex gap-2">
          {data.status === 'draft' && (
            <>
              <Button variant="outline" onClick={() => router.push('/dashboard/stok-opname/' + id + '/edit')}><Pencil className="size-4" />Edit</Button>
              <Button variant="default" disabled={actionLoading} onClick={handleSelesaikan}><Play className="size-4" />Selesaikan</Button>
              <Button variant="destructive" disabled={actionLoading} onClick={handleBatalkan}><XCircle className="size-4" />Batalkan</Button>
            </>
          )}
          {data.status === 'selesai' && (
            <Button variant="default" disabled={actionLoading} onClick={handleTerapkan}><CheckCircle className="size-4" />Terapkan</Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">No. Opname</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-semibold">{data.no_opname}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Tanggal</CardTitle></CardHeader>
          <CardContent><p className="text-lg font-semibold">{new Date(data.tanggal_opname).toLocaleDateString('id-ID')}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Status</CardTitle></CardHeader>
          <CardContent><Badge variant={statusColor[data.status] ?? 'default'} className="text-sm">{data.status}</Badge></CardContent>
        </Card>
      </div>
      {data.catatan && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Catatan</CardTitle></CardHeader>
          <CardContent><p>{data.catatan}</p></CardContent>
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
                <TableHead className="text-right">Stok Sistem</TableHead>
                <TableHead className="text-right">Stok Fisik</TableHead>
                <TableHead className="text-right">Selisih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.details?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Tidak ada detail</TableCell></TableRow>
              ) : data.details?.map((d, i) => (
                <TableRow key={d.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{d.barang?.nama_barang ?? '-'}</TableCell>
                  <TableCell className="text-right">{d.stok_sistem}</TableCell>
                  <TableCell className="text-right">{d.stok_fisik}</TableCell>
                  <TableCell className="text-right font-medium">{d.selisih > 0 ? `+${d.selisih}` : d.selisih}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
