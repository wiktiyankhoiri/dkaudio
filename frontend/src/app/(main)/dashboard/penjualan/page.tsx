'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, API_URL } from '@/services/api';
import type { Penjualan } from '@/types';
import { DataTable } from '@/components/tabel/data-table';
import { PaginationNav } from '@/components/pagination-nav';
import { Button } from '@/components/ui/button';
import { formatRp } from '@/lib/format';
import { Plus, Eye, Trash2, Pencil, Printer, FileText, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useAuth } from '@/providers/auth-provider';

export default function PenjualanPage() {
  const router = useRouter();
  const { isKasir } = useAuth();
  const [data, setData] = useState<Penjualan[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = (p = page) => {
    setLoading(true);
    api.getPenjualan('page=' + p + '&per_page=25')
      .then(res => { setData(res.data); setPage(res.current_page); setLastPage(res.last_page); })
      .catch(() => toast.error('Gagal memuat data'))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus Penjualan ini?')) return;
    setDeleting(id);
    try { await api.deletePenjualan(id); toast.success('Penjualan dihapus'); load(page); }
    catch { toast.error('Gagal menghapus'); }
    finally { setDeleting(null); }
  };

  const columns = [
    { key: 'no_invoice', label: 'No. Invoice', sortable: true },
    { key: 'tanggal', label: 'Tanggal', sortable: true, render: (item: Penjualan) => new Date(item.tanggal).toLocaleDateString('id-ID') },
    { key: 'konsumen', label: 'Konsumen', render: (item: Penjualan) => item.konsumen ?? '-' },
    { key: 'total', label: 'Total', render: (item: Penjualan) => formatRp(item.total) },
    {
      key: 'aksi', label: 'Aksi', className: 'text-center',
      render: (item: Penjualan) => (
        <div className="flex justify-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon-xs"><ChevronDown className="size-3" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => {
                const win = window.open('', '_blank');
                if (!win) return;
                win.document.write('<!DOCTYPE html><html><head><title>Loading...</title><style>body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;color:#999}</style></head><body>Memuat data...</body></html>');
                win.document.close();
                api.getPenjualanDetail(item.id).then(d => {
                  const ppnAmt = d.ppn > 0 ? (d.subtotal - d.diskon) * (d.ppn / 100) : 0;
                  const sisa = d.total - d.dibayar;
                  const fmtNumber = (v: number) => Math.round(v).toLocaleString('id-ID');
                  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice - ${d.no_invoice}</title><style>
                    body{font-family:'Courier New',monospace;font-size:12px;color:#1a1a1a;margin:0;padding:20px}
                    .inv{max-width:600px;margin:0 auto}
                    .hd{display:flex;justify-content:space-between;align-items:start;margin-bottom:20px}
                    .hd h1{font-size:24px;text-transform:uppercase;letter-spacing:3px;margin:0}
                    .ref{font-size:11px;margin-bottom:15px}
                    .ref>div{display:inline-block;width:48%;vertical-align:top}
                    .ref .r{text-align:right}
                    .pt{font-size:11px;margin-bottom:15px}
                    .pt>div{display:inline-block;width:48%;vertical-align:top}
                    .pt .r{text-align:right}
                    .pt .b{font-weight:700;text-transform:uppercase;margin-bottom:5px;font-size:10px}
                    table{width:100%;border-collapse:collapse;font-size:11px;margin-bottom:15px}
                    table th{background:#f5f5f5;padding:5px 8px;text-align:left;text-transform:uppercase;font-size:10px}
                    table th.r,td.r{text-align:right}
                    table td{padding:6px 8px;border-bottom:1px solid #e5e5e5}
                    .sm{font-size:11px}
                    .sm>div{display:flex;justify-content:space-between;padding:2px 0}
                    .sm .tot{border-top:1px dashed #999;padding-top:6px;font-weight:700;font-size:13px;margin-top:4px}
                    .ft{font-size:10px;color:#888;margin-top:20px}
                  </style></head><body><div class="inv">
                    <div class="hd"><img src="/logo-dkaudio.png" style="height:40px;width:auto" alt="DK Audio" /><h1>Invoice</h1></div>
                    <div class="ref"><div><p>Referensi: ${d.no_invoice}</p><p>Tanggal: ${new Date(d.tanggal).toLocaleDateString('id-ID')}</p></div><div class="r"><p>Jatuh tempo: ${d.jatuh_tempo ? new Date(d.jatuh_tempo).toLocaleDateString('id-ID') : '—'}</p></div></div>
                    <div class="pt"><div><p class="b">Dari</p><p>DK Audio</p><p>Jl. Jolotundo 1 RT 03 RW 02, Semarang</p><p>(Depan Masjid Agung Jawa Tengah)</p><p>0821 3483 9888</p></div>${d.konsumen ? `<div class="r"><p class="b">Kepada</p><p>${d.konsumen}</p>${d.telepon ? `<p>${d.telepon}</p>` : ''}${d.alamat ? `<p>${d.alamat}</p>` : ''}</div>` : ''}</div>
                    <table><tr><th colspan="2">Barang</th><th class="r">Jml</th><th class="r">Harga</th></tr>
                    ${d.details?.map((det: any) => `<tr><td colspan="2">${det.barang?.nama_barang || '—'}</td><td class="r">${det.qty}</td><td class="r">${fmtNumber(det.harga_jual)}</td></tr>`).join('')}
                    </table>
                    <div class="sm"><div><span>Subtotal</span><span>${fmtNumber(d.subtotal)}</span></div>${d.diskon > 0 ? `<div><span>Diskon</span><span>-${fmtNumber(d.diskon)}</span></div>` : ''}${d.ppn > 0 ? `<div><span>PPN (${d.ppn}%)</span><span>+${fmtNumber(ppnAmt)}</span></div>` : ''}
                    <div class="tot"><span>Total</span><span>${fmtNumber(d.total)}</span></div><div><span>Dibayar</span><span>${fmtNumber(d.dibayar)}</span></div><div style="font-weight:600"><span>Sisa</span><span style="${sisa > 0 ? 'color:#dc2626' : 'color:#16a34a'}">${fmtNumber(sisa)}</span></div></div>
                    <div class="ft"><p>Siap diproses.</p></div></div></body></html>`;
                  win.document.write(html);
                  win.document.close();
                  setTimeout(() => win.print(), 500);
                }).catch(() => { win.document.write('<p>Gagal memuat data</p>'); win.document.close(); });
              }}>
                <Printer className="size-4" /> Cetak
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(API_URL + '/api/penjualan/' + item.id + '/pdf?token=' + api.getToken(), '_blank')}>
                <FileText className="size-4" /> Download PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="icon-xs" onClick={() => router.push('/dashboard/penjualan/' + item.id)}><Eye className="size-3" /></Button>
          {!isKasir && <Button variant="outline" size="icon-xs" onClick={() => router.push('/dashboard/penjualan/' + item.id + '/edit')}><Pencil className="size-3" /></Button>}
          {!isKasir && <Button variant="destructive" size="icon-xs" onClick={() => handleDelete(item.id)} disabled={deleting === item.id}><Trash2 className="size-3" /></Button>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Penjualan</h1>
          <p className="text-sm text-muted-foreground">Kelola data Penjualan</p>
        </div>
        <Button onClick={() => router.push('/dashboard/penjualan/create')}><Plus className="size-4" />Tambah Penjualan</Button>
      </div>
      <DataTable data={data} columns={columns} loading={loading} searchKey="no_invoice" emptyMessage="Belum ada Penjualan" />
      <PaginationNav currentPage={page} lastPage={lastPage} onPageChange={p => load(p)} />
    </div>
  );
}
