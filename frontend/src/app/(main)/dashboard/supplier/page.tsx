'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import type { Supplier } from '@/types';
import { DataTable } from '@/components/tabel/data-table';
import { PaginationNav } from '@/components/pagination-nav';
import { Button } from '@/components/ui/button';
import { Download, Plus, Pencil, Trash2, Upload, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export default function SupplierPage() {
  const router = useRouter();
  const [data, setData] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [deleting, setDeleting] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleExport = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    api.download('/api/supplier/export', 'supplier-' + date + '.xlsx');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.upload('/api/supplier/import', formData);
      toast.success('Data berhasil diimport');
      load(page);
    } catch {
      toast.error('Gagal import');
    } finally {
      setImporting(false);
      if (e.target) e.target.value = '';
    }
  };

  const load = (p = page) => {
    setLoading(true);
    api.getSupplier('page=' + p + '&per_page=25')
      .then(res => { setData(res.data); setPage(res.current_page); setLastPage(res.last_page); })
      .catch(() => toast.error('Gagal memuat data'))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus supplier ini?')) return;
    setDeleting(id);
    try { await api.deleteSupplier(id); toast.success('Supplier dihapus'); load(page); }
    catch { toast.error('Gagal menghapus'); }
    finally { setDeleting(null); }
  };

  const columns = [
    { key: 'kode_supplier', label: 'Kode', sortable: true },
    { key: 'nama_supplier', label: 'Nama Supplier', sortable: true },
    { key: 'alamat', label: 'Alamat', render: (item: Supplier) => item.alamat ?? '-' },
    { key: 'telepon', label: 'Telepon', className: 'text-center', render: (item: Supplier) => <div className="flex justify-center">{item.telepon ?? '-'}</div> },
    {
      key: 'aksi', label: 'Aksi', className: 'text-center',
      render: (item: Supplier) => (
        <div className="flex justify-center gap-1">
          <Button variant="outline" size="icon-xs" onClick={() => router.push('/dashboard/supplier/' + item.id + '/edit')}><Pencil className="size-3" /></Button>
          <Button variant="destructive" size="icon-xs" onClick={() => handleDelete(item.id)} disabled={deleting === item.id}><Trash2 className="size-3" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Supplier</h1>
          <p className="text-sm text-muted-foreground">Kelola data supplier</p>
        </div>
        <div className="flex gap-2">
          <input type="file" accept=".xlsx,.xls,.csv" hidden ref={fileInputRef} onChange={handleImport} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline"><Download className="size-4" />Export/Import<ChevronDown className="size-3" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => api.download('/api/supplier/template', 'template-supplier.xlsx')}><Download className="size-4" />Template</DropdownMenuItem>
              <DropdownMenuItem onClick={handleExport}><Download className="size-4" />Export Excel</DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} disabled={importing}><Upload className="size-4" />{importing ? 'Importing...' : 'Import Excel'}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => router.push('/dashboard/supplier/create')}><Plus className="size-4" />Tambah Supplier</Button>
        </div>
      </div>
      <DataTable data={data} columns={columns} loading={loading} searchKey="nama_supplier" emptyMessage="Belum ada supplier" />
      <PaginationNav currentPage={page} lastPage={lastPage} onPageChange={p => load(p)} />
    </div>
  );
}
