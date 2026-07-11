'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import type { PenyesuaianStok } from '@/types';
import { DataTable } from '@/components/tabel/data-table';
import { PaginationNav } from '@/components/pagination-nav';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/auth-provider';

export default function PenyesuaianStokPage() {
  const router = useRouter();
  const { isKasir } = useAuth();
  const [data, setData] = useState<PenyesuaianStok[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const load = (p = page) => {
    setLoading(true);
    api.getPenyesuaianStok('page=' + p + '&per_page=25')
      .then(res => { setData(res.data); setPage(res.current_page); setLastPage(res.last_page); })
      .catch(() => toast.error('Gagal memuat data'))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => { load(); }, []);

  const columns = [
    { key: 'tanggal', label: 'Tanggal', sortable: true, render: (item: PenyesuaianStok) => new Date(item.tanggal).toLocaleDateString('id-ID') },
    { key: 'barang', label: 'Barang', render: (item: PenyesuaianStok) => item.barang?.nama_barang ?? '-' },
    { key: 'qty_sebelum', label: 'Qty Sebelum', sortable: true },
    { key: 'qty_sesudah', label: 'Qty Sesudah', sortable: true },
    { key: 'selisih', label: 'Selisih', sortable: true, render: (item: PenyesuaianStok) => <span className={'font-medium ' + (item.selisih > 0 ? 'text-green-600' : item.selisih < 0 ? 'text-red-600' : '')}>{item.selisih > 0 ? '+' + item.selisih : item.selisih}</span> },
    { key: 'alasan', label: 'Alasan', render: (item: PenyesuaianStok) => item.alasan ?? '-' },
    { key: 'user', label: 'User', render: (item: PenyesuaianStok) => item.user?.nama ?? '-' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Penyesuaian Stok</h1>
          <p className="text-sm text-muted-foreground">Riwayat penyesuaian stok barang</p>
        </div>
        {!isKasir && <Button onClick={() => router.push('/dashboard/penyesuaian-stok/create')}><Plus className="size-4" />Tambah Penyesuaian</Button>}
      </div>
      <DataTable data={data} columns={columns} loading={loading} searchKey="" emptyMessage="Belum ada penyesuaian stok" />
      <PaginationNav currentPage={page} lastPage={lastPage} onPageChange={p => load(p)} />
    </div>
  );
}
