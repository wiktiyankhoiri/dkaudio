'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import type { Pembelian } from '@/types';
import { DataTable } from '@/components/tabel/data-table';
import { PaginationNav } from '@/components/pagination-nav';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/auth-provider';

export default function PembelianPage() {
  const router = useRouter();
  const { isKasir } = useAuth();
  const [data, setData] = useState<Pembelian[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = (p = page) => {
    setLoading(true);
    api.getPembelian('page=' + p + '&per_page=25')
      .then(res => { setData(res.data); setPage(res.current_page); setLastPage(res.last_page); })
      .catch(() => toast.error('Gagal memuat data'))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus Pembelian ini?')) return;
    setDeleting(id);
    try { await api.deletePembelian(id); toast.success('Pembelian dihapus'); load(page); }
    catch { toast.error('Gagal menghapus'); }
    finally { setDeleting(null); }
  };

  const columns = [
    { key: 'no_surat', label: 'No. Surat', sortable: true },
    { key: 'tanggal', label: 'Tanggal', sortable: true, render: (item: Pembelian) => new Date(item.tanggal).toLocaleDateString('id-ID') },
    { key: 'supplier', label: 'Supplier', render: (item: Pembelian) => item.supplier?.nama_supplier ?? '-' },
    { key: 'keterangan', label: 'Keterangan', render: (item: Pembelian) => item.keterangan ?? '-' },
    {
      key: 'aksi', label: 'Aksi', className: 'text-center',
      render: (item: Pembelian) => (
        <div className="flex justify-center gap-1">
          <Button variant="outline" size="icon-xs" onClick={() => router.push('/dashboard/pembelian/' + item.id)}><Eye className="size-3" /></Button>
          {!isKasir && <Button variant="outline" size="icon-xs" onClick={() => router.push('/dashboard/pembelian/' + item.id + '/edit')}><Pencil className="size-3" /></Button>}
          {!isKasir && <Button variant="destructive" size="icon-xs" onClick={() => handleDelete(item.id)} disabled={deleting === item.id}><Trash2 className="size-3" /></Button>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pembelian</h1>
          <p className="text-sm text-muted-foreground">Kelola data Pembelian</p>
        </div>
        <Button onClick={() => router.push('/dashboard/pembelian/create')}><Plus className="size-4" />Tambah Pembelian</Button>
      </div>
      <DataTable data={data} columns={columns} loading={loading} searchKey="no_surat" emptyMessage="Belum ada Pembelian" />
      <PaginationNav currentPage={page} lastPage={lastPage} onPageChange={p => load(p)} />
    </div>
  );
}
