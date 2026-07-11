'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import type { Kategori } from '@/types';
import { DataTable } from '@/components/tabel/data-table';
import { PaginationNav } from '@/components/pagination-nav';
import { Button } from '@/components/ui/button';
import { Download, Plus, Pencil, Trash2, Upload, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export default function KategoriPage() {
  const router = useRouter();
  const [data, setData] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [deleting, setDeleting] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleExport = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    api.download('/api/kategori/export', 'kategori-' + date + '.xlsx');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.upload('/api/kategori/import', formData);
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
    api.getKategori('page=' + p + '&per_page=25')
      .then(res => { setData(res.data); setPage(res.current_page); setLastPage(res.last_page); })
      .catch(() => toast.error('Gagal memuat data'))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus kategori ini?')) return;
    setDeleting(id);
    try { await api.deleteKategori(id); toast.success('Kategori dihapus'); load(page); }
    catch { toast.error('Gagal menghapus'); }
    finally { setDeleting(null); }
  };

  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'nama_kategori', label: 'Nama Kategori', sortable: true },
    { key: 'barang_count', label: 'Jumlah Barang', sortable: true, className: 'text-center', render: (item: Kategori) => <div className="flex justify-center">{(item.barang_count ?? 0).toLocaleString('id-ID')}</div> },
    {
      key: 'aksi', label: 'Aksi', className: 'text-center',
      render: (item: Kategori) => (
        <div className="flex justify-center gap-1">
          <Button variant="outline" size="icon-xs" onClick={() => router.push('/dashboard/kategori/' + item.id + '/edit')}><Pencil className="size-3" /></Button>
          <Button variant="destructive" size="icon-xs" onClick={() => handleDelete(item.id)} disabled={deleting === item.id}><Trash2 className="size-3" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kategori</h1>
          <p className="text-sm text-muted-foreground">Kelola kategori barang</p>
        </div>
        <div className="flex gap-2">
          <input type="file" accept=".xlsx,.xls,.csv" hidden ref={fileInputRef} onChange={handleImport} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline"><Download className="size-4" />Export/Import<ChevronDown className="size-3" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => api.download('/api/kategori/template', 'template-kategori.xlsx')}><Download className="size-4" />Template</DropdownMenuItem>
              <DropdownMenuItem onClick={handleExport}><Download className="size-4" />Export Excel</DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} disabled={importing}><Upload className="size-4" />{importing ? 'Importing...' : 'Import Excel'}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => router.push('/dashboard/kategori/create')}><Plus className="size-4" />Tambah Kategori</Button>
        </div>
      </div>
      <DataTable data={data} columns={columns} loading={loading} searchKey="nama_kategori" emptyMessage="Belum ada kategori" />
      <PaginationNav currentPage={page} lastPage={lastPage} onPageChange={p => load(p)} />
    </div>
  );
}
