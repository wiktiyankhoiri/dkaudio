'use client';
import { useEffect, useRef, useState } from 'react';
import { formatRp } from '@/lib/format';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { useAuth } from '@/providers/auth-provider';
import type { Barang } from '@/types';
import { DataTable } from '@/components/tabel/data-table';
import { PaginationNav } from '@/components/pagination-nav';
import { Button } from '@/components/ui/button';
import { Download, Plus, Pencil, Trash2, Upload, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export default function BarangPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [data, setData] = useState<Barang[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [deleting, setDeleting] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleExport = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    api.download('/api/barang/export', 'barang-' + date + '.xlsx');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.upload('/api/barang/import', formData);
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
    api.getBarang('page=' + p + '&per_page=25')
      .then(res => { setData(res.data); setPage(res.current_page); setLastPage(res.last_page); })
      .catch(() => toast.error('Gagal memuat data'))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus barang ini?')) return;
    setDeleting(id);
    try { await api.deleteBarang(id); toast.success('Barang dihapus'); load(page); }
    catch { toast.error('Gagal menghapus'); }
    finally { setDeleting(null); }
  };

  const columns = [
    { key: 'kode_barang', label: 'Kode', sortable: true },
    { key: 'nama_barang', label: 'Nama Barang', sortable: true },
    { key: 'kategori', label: 'Kategori', render: (item: Barang) => item.kategori?.nama_kategori ?? '-' },
    { key: 'satuan', label: 'Satuan', sortable: true, className: 'text-center', render: (item: Barang) => <div className="flex justify-center">{item.satuan}</div> },
    { key: 'stok_qty', label: 'Stok', sortable: true, className: 'text-center', render: (item: Barang) => <div className="flex justify-center">{(item.stok_qty ?? 0).toLocaleString('id-ID')}</div> },
    ...(isAdmin ? [{ key: 'harga_beli', label: 'Harga Beli', className: 'text-center', render: (item: Barang) => <div className="flex justify-center">{formatRp(item.harga_beli)}</div> }] : []),
    { key: 'harga_jual', label: 'Harga Jual', className: 'text-center', render: (item: Barang) => <div className="flex justify-center">{formatRp(item.harga_jual)}</div> },
    ...(isAdmin ? [{
      key: 'aksi', label: 'Aksi', className: 'text-center',
      render: (item: Barang) => (
        <div className="flex justify-center gap-1">
          <Button variant="outline" size="icon-xs" onClick={() => router.push('/dashboard/barang/' + item.id + '/edit')}><Pencil className="size-3" /></Button>
          <Button variant="destructive" size="icon-xs" onClick={() => handleDelete(item.id)} disabled={deleting === item.id}><Trash2 className="size-3" /></Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Barang</h1>
          <p className="text-sm text-muted-foreground">{isAdmin ? 'Kelola data barang' : 'Cek harga jual barang'}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <input type="file" accept=".xlsx,.xls,.csv" hidden ref={fileInputRef} onChange={handleImport} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline"><Download className="size-4" />Export/Import<ChevronDown className="size-3" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => api.download('/api/barang/template', 'template-barang.xlsx')}><Download className="size-4" />Template</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport}><Download className="size-4" />Export Excel</DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()} disabled={importing}><Upload className="size-4" />{importing ? 'Importing...' : 'Import Excel'}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => router.push('/dashboard/barang/create')}><Plus className="size-4" />Tambah Barang</Button>
          </div>
        )}
      </div>
      <DataTable data={data} columns={columns} loading={loading} searchKey="nama_barang" emptyMessage="Belum ada barang" />
      <PaginationNav currentPage={page} lastPage={lastPage} onPageChange={p => load(p)} />
    </div>
  );
}