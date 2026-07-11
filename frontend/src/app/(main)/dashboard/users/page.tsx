'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';
import type { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/auth-provider';

const roleColor: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  owner: 'destructive', admin: 'outline', kasir: 'secondary',
};

export default function UsersPage() {
  const router = useRouter();
  const { isOwner } = useAuth();
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('Semua');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    api.getUsers('page=1&per_page=9999')
      .then(res => setData(res.data))
      .catch(() => toast.error('Gagal memuat data'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let items = [...data];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(u => u.nama.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (roleFilter !== 'Semua') items = items.filter(u => u.role === roleFilter);
    return items;
  }, [data, search, roleFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const pageItems = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus pengguna ini?')) return;
    setDeleting(id);
    try { await api.deleteUser(id); toast.success('Pengguna dihapus'); setData(prev => prev.filter(u => u.id !== id)); }
    catch { toast.error('Gagal menghapus'); }
    finally { setDeleting(null); }
  };

  if (loading) return <div className="flex items-center justify-center h-48"><div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl tracking-tight">Pengguna</h1>
          <p className="text-muted-foreground text-sm">Kelola pengguna sistem dan perannya.</p>
        </div>
        {isOwner && (
          <Button size="sm" onClick={() => router.push('/dashboard/users/create')}>
            <Plus data-icon="inline-start" />
            Tambah Pengguna
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-background">
        <div className="flex flex-col items-stretch gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <InputGroup className="h-7 w-full rounded-md sm:w-82">
            <InputGroupAddon><Search /></InputGroupAddon>
            <InputGroupInput className="h-7" placeholder="Cari pengguna..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
          </InputGroup>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={roleFilter} onValueChange={v => { setRoleFilter(v); setPage(0); }}>
              <SelectTrigger size="sm">
                <span className="text-muted-foreground">Peran:</span>
                <SelectValue placeholder="Semua" />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectGroup>
                  <SelectItem value="Semua">Semua</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="kasir">Kasir</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[760px] table-fixed border-collapse md:w-full">
            <TableHeader>
              <TableRow className="border-y hover:bg-transparent [&>:not(:last-child)]:border-r">
                <TableHead className="h-10 w-[190px] px-4 font-medium text-foreground text-sm">Nama</TableHead>
                <TableHead className="h-10 w-[150px] px-4 text-center font-medium text-foreground text-sm">Username</TableHead>
                <TableHead className="h-10 w-[240px] px-4 text-center font-medium text-foreground text-sm">Email</TableHead>
                <TableHead className="h-10 w-[100px] px-4 text-center font-medium text-foreground text-sm">Peran</TableHead>
                <TableHead className="h-10 w-[80px] px-4 text-center font-medium text-foreground text-sm">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Tidak ada pengguna.</TableCell>
                </TableRow>
              ) : pageItems.map((item) => (
                <TableRow key={item.id} className="h-12 hover:bg-muted/20">
                  <TableCell className="border-r px-4 align-middle">
                    <span className="font-medium text-sm">{item.nama}</span>
                  </TableCell>
                  <TableCell className="border-r px-4 text-center align-middle text-sm">{item.username}</TableCell>
                  <TableCell className="border-r px-4 text-center align-middle text-sm">{item.email ?? '-'}</TableCell>
                  <TableCell className="border-r px-4 text-center align-middle">
                    <Badge variant={roleColor[item.role] ?? 'default'} className="rounded-sm capitalize">{item.role}</Badge>
                  </TableCell>
                  <TableCell className="px-4 text-center align-middle">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="outline" size="icon-xs" onClick={() => router.push('/dashboard/users/' + item.id + '/edit')} disabled={!isOwner}><Pencil className="size-3" /></Button>
                      <Button variant="destructive" size="icon-xs" onClick={() => handleDelete(item.id)} disabled={deleting === item.id || !isOwner}><Trash2 className="size-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-4 border-t border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="hidden text-muted-foreground text-sm lg:block lg:min-w-0 lg:flex-1">
            Menampilkan {filtered.length === 0 ? 0 : page * pageSize + 1} - {Math.min((page + 1) * pageSize, filtered.length)} dari {filtered.length} pengguna
          </div>

          <div className="flex justify-center sm:mx-auto">
            <Pagination className="mx-0 w-auto justify-center">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious size="sm" href="#" text="" className={page === 0 ? 'pointer-events-none opacity-50' : ''} onClick={e => { e.preventDefault(); setPage(p => Math.max(0, p - 1)); }} />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink size="sm" href="#" isActive onClick={e => e.preventDefault()}>{page + 1}</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext size="sm" href="#" text="" className={page >= totalPages - 1 ? 'pointer-events-none opacity-50' : ''} onClick={e => { e.preventDefault(); setPage(p => Math.min(totalPages - 1, p + 1)); }} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>

          <div className="hidden items-center justify-between gap-2 sm:flex sm:justify-end lg:flex-1">
            <span className="text-muted-foreground text-sm">Baris per halaman</span>
            <Select value={`${pageSize}`} onValueChange={v => { setPageSize(Number(v)); setPage(0); }}>
              <SelectTrigger size="sm" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end" side="top">
                <SelectGroup>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="24">24</SelectItem>
                  <SelectItem value="48">48</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
