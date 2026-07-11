'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import type { StokOpname } from '@/types';
import { DataTable } from '@/components/tabel/data-table';
import { PaginationNav } from '@/components/pagination-nav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye } from 'lucide-react';
import { toast } from 'sonner';

const statusColor: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'default', selesai: 'outline', diterapkan: 'secondary', dibatalkan: 'destructive',
};

const statusLabel: Record<string, string> = {
  draft: 'Draft', selesai: 'Selesai', diterapkan: 'Diterapkan', dibatalkan: 'Dibatalkan',
};

export default function StokOpnamePage() {
  const router = useRouter();
  const [data, setData] = useState<StokOpname[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const load = (p = page) => {
    setLoading(true);
    api.getStokOpname('page=' + p + '&per_page=25')
      .then(res => { setData(res.data); setPage(res.current_page); setLastPage(res.last_page); })
      .catch(() => toast.error('Gagal memuat data'))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => { load(); }, []);

  const columns = [
    { key: 'no_opname', label: 'No. Opname', sortable: true },
    { key: 'tanggal_opname', label: 'Tanggal', sortable: true, render: (item: StokOpname) => new Date(item.tanggal_opname).toLocaleDateString('id-ID') },
    { key: 'status', label: 'Status', render: (item: StokOpname) => <Badge variant={statusColor[item.status] ?? 'default'}>{statusLabel[item.status] ?? item.status}</Badge> },
    { key: 'user', label: 'User', render: (item: StokOpname) => item.user?.nama ?? '-' },
    {
      key: 'aksi', label: 'Aksi',
      render: (item: StokOpname) => (
        <div className="flex gap-1">
          <Button variant="outline" size="icon-xs" onClick={() => router.push('/dashboard/stok-opname/' + item.id)}><Eye className="size-3" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Stok Opname</h1>
          <p className="text-sm text-muted-foreground">Kelola stok opname</p>
        </div>
        <Button onClick={() => router.push('/dashboard/stok-opname/create')}><Plus className="size-4" />Tambah Opname</Button>
      </div>
      <DataTable data={data} columns={columns} loading={loading} searchKey="no_opname" emptyMessage="Belum ada opname" />
      <PaginationNav currentPage={page} lastPage={lastPage} onPageChange={p => load(p)} />
    </div>
  );
}
