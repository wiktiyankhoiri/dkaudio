'use client';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { AuditLog } from '@/types';
import { DataTable } from '@/components/tabel/data-table';
import { PaginationNav } from '@/components/pagination-nav';
import { toast } from 'sonner';

export default function AuditLogPage() {
  const [data, setData] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const load = (p = page) => {
    setLoading(true);
    api.getAuditLog('page=' + p + '&per_page=25').then(res => {
      const paginated = res as any;
      setData(paginated.data ?? []);
      setPage(paginated.current_page ?? 1);
      setLastPage(paginated.last_page ?? 1);
    }).catch(() => toast.error('Gagal memuat data')).finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => { load(); }, []);

  const columns = [
    { key: 'created_at', label: 'Waktu', sortable: true, render: (item: AuditLog) => new Date(item.created_at).toLocaleDateString('id-ID') },
    { key: 'user', label: 'User', render: (item: AuditLog) => item.user?.nama ?? '-' },
    { key: 'action', label: 'Aksi', sortable: true, render: (item: AuditLog) => <span className="capitalize">{item.action}</span> },
    { key: 'table_name', label: 'Tabel', render: (item: AuditLog) => item.table_name ?? '-' },
    { key: 'description', label: 'Deskripsi', render: (item: AuditLog) => item.description ?? '-' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
        <p className="text-sm text-muted-foreground">Riwayat aktivitas pengguna</p>
      </div>
      <DataTable data={data} columns={columns} loading={loading} searchKey="" emptyMessage="Belum ada aktivitas" />
      <PaginationNav currentPage={page} lastPage={lastPage} onPageChange={p => load(p)} />
    </div>
  );
}
