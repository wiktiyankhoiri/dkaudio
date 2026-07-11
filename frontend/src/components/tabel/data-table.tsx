'use client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: string; label: string; sortable?: boolean;
  className?: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[]; columns: Column<T>[]; loading?: boolean;
  emptyMessage?: string; searchKey?: string;
}

export function DataTable<T extends Record<string, any>>({ data, columns, loading, emptyMessage = 'Tidak ada data', searchKey }: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let items = Array.isArray(data) ? [...data] : [];
    if (search && searchKey) items = items.filter(i => String(i[searchKey]).toLowerCase().includes(search.toLowerCase()));
    if (sortKey) items.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return items;
  }, [data, search, sortKey, sortDir, searchKey]);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  return (
    <div className="space-y-3">
      {searchKey && (
        <input
          type="text"
          placeholder="Cari..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(col => (
                  <TableHead key={col.key} className={cn(col.className, col.sortable ? 'cursor-pointer select-none' : '')} onClick={() => col.sortable && toggleSort(col.key)}>
                    <div className={cn('flex items-center gap-1', col.className?.includes('text-center') && 'justify-center')}>
                      {col.label}
                      {col.sortable && sortKey === col.key ? (sortDir === 'asc' ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />) : col.sortable ? <ChevronsUpDown className="size-3 text-muted-foreground" /> : null}
                    </div>
                  </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>{columns.map(col => <TableCell key={col.key}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>
            )) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">{emptyMessage}</TableCell></TableRow>
            ) : filtered.map((item, i) => (
              <TableRow key={i}>
                {columns.map(col => <TableCell key={col.key} className={cn('text-sm', col.className)}>{col.render ? col.render(item) : String(item[col.key] ?? '')}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} dari {data.length} data</p>
    </div>
  );
}
