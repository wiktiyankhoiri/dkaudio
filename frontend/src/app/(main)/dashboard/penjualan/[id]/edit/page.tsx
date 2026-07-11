'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { formatRp } from '@/lib/format';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import type { Barang } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { BarangSelect } from '@/components/barang-select';
import { Save, Plus, Trash2, CalendarIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EditPenjualanPage() {
  const params = useParams();
  const id = Number(params.id);
  const router = useRouter();
  const [barang, setBarang] = useState<Barang[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [noInvoice, setNoInvoice] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [konsumen, setKonsumen] = useState('');
  const [telepon, setTelepon] = useState('');
  const [alamat, setAlamat] = useState('');

  const [diskon, setDiskon] = useState(0);
  const [ppn, setPpn] = useState(0);
  const [keterangan, setKeterangan] = useState('');
  const [details, setDetails] = useState<{ barang_id: number; qty: number; harga_jual: number }[]>([]);

  useEffect(() => {
    Promise.all([api.getBarang('per_page=9999'), api.getPenjualanDetail(id)])
      .then(([bRes, data]) => {
        setBarang(bRes.data);
        setNoInvoice(data.no_invoice);
        setTanggal(data.tanggal?.slice(0, 10) ?? '');
        setKonsumen(data.konsumen ?? '');
        setTelepon(data.telepon ?? '');
        setAlamat(data.alamat ?? '');
        setDiskon(data.diskon);
        setPpn(data.ppn);
        setKeterangan(data.keterangan ?? '');
        setDetails(data.details?.map(d => ({ barang_id: d.barang_id, qty: d.qty, harga_jual: d.harga_jual })) ?? []);
      })
      .catch(() => toast.error('Gagal memuat data'))
      .finally(() => setLoading(false));
  }, [id]);

  const addRow = () => setDetails(prev => [...prev, { barang_id: 0, qty: 1, harga_jual: 0 }]);
  const removeRow = (idx: number) => setDetails(prev => prev.filter((_, i) => i !== idx));
  const updateDetail = (idx: number, field: 'barang_id' | 'qty' | 'harga_jual', value: number) => {
    setDetails(prev => prev.map((d, i) => {
      if (i !== idx) return d;
      const updated = { ...d, [field]: value };
      if (field === 'barang_id') {
        const b = barang.find(x => x.id === value);
        if (b) updated.harga_jual = b.harga_jual;
      }
      return updated;
    }));
  };

  const subtotal = details.reduce((sum, d) => sum + d.qty * d.harga_jual, 0);
  const setelahDiskon = subtotal - diskon;
  const ppnAmount = setelahDiskon * (ppn / 100);
  const total = setelahDiskon + ppnAmount;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggal) { toast.error('Tanggal wajib diisi'); return; }
    if (details.some(d => !d.barang_id || d.qty < 1)) { toast.error('Semua detail barang harus diisi dengan benar'); return; }
    setSaving(true);
    try {
      await api.updatePenjualan(id, {
        tanggal, konsumen: konsumen || undefined, telepon: telepon || undefined,
        alamat: alamat || undefined, diskon, ppn,
        keterangan: keterangan || undefined,
        details: details.map(d => ({ barang_id: d.barang_id, qty: d.qty, harga_jual: d.harga_jual })),
      });
      toast.success('Penjualan diupdate');
      router.push('/dashboard/penjualan/' + id);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Gagal mengupdate Penjualan';
      toast.error(msg);
    }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-48"><Loader2 className="size-6 animate-spin" /></div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Penjualan</h1>
          <p className="text-sm text-muted-foreground">{noInvoice}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={onSubmit} disabled={saving}>
            <Save className="size-4" />{saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
          <Button type="button" variant="default" onClick={() => router.back()}>Batal</Button>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
            <div className="flex flex-col gap-3">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">No. Invoice</label>
                  <div className="flex items-center rounded-lg border border-input bg-muted">
                    <input
                      className="h-8 flex-1 rounded-none border-0 bg-transparent px-2.5 py-1 text-sm outline-none text-muted-foreground"
                      value={noInvoice} readOnly
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Tanggal</label>
                  <div className="flex items-center rounded-lg border border-input bg-transparent has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/50">
                    <input type="date" className="h-8 flex-1 rounded-none border-0 bg-transparent px-2.5 py-1 text-sm outline-none" value={tanggal} onChange={e => setTanggal(e.target.value)} />
                    <div className="flex items-center justify-center pr-2 text-muted-foreground"><CalendarIcon className="size-4" /></div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-medium tracking-tight">Pelanggan</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Konsumen</label>
                  <Input value={konsumen} onChange={e => setKonsumen(e.target.value)} placeholder="Nama konsumen" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">No. Telepon</label>
                  <Input value={telepon} onChange={e => setTelepon(e.target.value)} placeholder="085xxx" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Alamat</label>
                <Input value={alamat} onChange={e => setAlamat(e.target.value)} placeholder="Jl. ..." />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Keterangan</label>
                <Input value={keterangan} onChange={e => setKeterangan(e.target.value)} placeholder="Opsional" />
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-medium tracking-tight">Item Barang</h2>
                <Button type="button" variant="ghost" size="sm" onClick={addRow}>
                  <Plus className="size-4" />Tambah Barang
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                <div className="hidden items-center gap-2 px-1 text-xs font-medium text-muted-foreground md:grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 56px 96px 80px 24px' }}>
                  <span>Barang</span>
                  <span className="text-center">Jml</span>
                  <span className="text-center">Harga Jual</span>
                  <span className="text-center">Subtotal</span>
                  <span />
                </div>
                {details.map((d, i) => (
                  <div key={i} className="grid min-w-0 items-center gap-2 rounded-lg border p-2 text-sm md:border-0 md:p-0" style={{ gridTemplateColumns: 'minmax(0,1fr) 56px 96px 80px 24px' }}>
                    <BarangSelect barang={barang} value={d.barang_id} onSelect={v => updateDetail(i, 'barang_id', v)} />
                    <Input type="number" min={1} className="h-8 text-center text-sm" value={d.qty} onChange={e => updateDetail(i, 'qty', Number(e.target.value))} />
                    <Input type="number" step="1" className="h-8 text-center text-sm" value={d.harga_jual || ''} onChange={e => updateDetail(i, 'harga_jual', Number(e.target.value))} />
                    <div className="text-sm font-medium text-center">{formatRp(d.qty * d.harga_jual)}</div>
                    {details.length > 1 && (
                      <Button type="button" variant="ghost" size="icon-sm" className="size-6" onClick={() => removeRow(i)}>
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
              <h2 className="text-sm font-medium tracking-tight">Penyesuaian</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Diskon</label>
                  <Input type="number" step="1" value={diskon || ''} onChange={e => setDiskon(Number(e.target.value))} className="h-10" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">PPN (%)</label>
                  <Input type="number" step="1" value={ppn || ''} onChange={e => setPpn(Number(e.target.value))} className="h-10" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col rounded-xl border bg-card">
            <div className="flex items-center justify-between px-4 py-4">
              <h2 className="text-lg font-medium">Pratinjau</h2>
              <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>Cetak</Button>
            </div>
            <div className="flex-1 rounded-b-xl bg-stone-100 p-6 dark:bg-stone-800">
              <div className="mx-auto max-w-md rounded-sm bg-white p-6 shadow-sm dark:bg-neutral-50">
                <div className="flex flex-col gap-6 font-mono text-sm text-neutral-900">
                  <div className="grid grid-cols-2 items-start gap-4">
                    <Image src="/logo-dkaudio.png" alt="DK Audio" width={120} height={40} className="h-10 w-auto" />
                    <h3 className="text-2xl uppercase tracking-widest text-right">Invoice</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-0.5">
                      <p>Referensi: {noInvoice || '—'}</p>
                      <p>Tanggal: {tanggal}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs leading-relaxed">
                    <div>
                      <p className="mb-2 font-semibold uppercase">Dari</p>
                      <p>DK Audio</p>
                      <p>Jl. Jolotundo 1 RT 03 RW 02</p>
                      <p>Semarang</p>
                      <p>(Depan Masjid Agung Jawa Tengah)</p>
                      <p>0821 3483 9888</p>
                    </div>
                    {konsumen && (
                      <div>
                        <p className="mb-2 font-semibold uppercase">Kepada</p>
                        <p>{konsumen}</p>
                        {telepon && <p>{telepon}</p>}
                        {alamat && <p>{alamat}</p>}
                      </div>
                    )}
                  </div>
                  <div className="text-xs">
                    <div className="grid grid-cols-4 gap-2 bg-stone-100 px-2 py-1.5 font-semibold uppercase">
                      <span className="col-span-2">Barang</span>
                      <span className="text-right">Jml</span>
                      <span className="text-right">Harga</span>
                    </div>
                    {details.filter(d => d.barang_id).map((d, i) => {
                      const b = barang.find(x => x.id === d.barang_id);
                      return (
                        <div key={i} className="grid grid-cols-4 gap-2 border-b px-2 py-2">
                          <span className="col-span-2">{b?.nama_barang || '—'}</span>
                          <span className="text-right">{d.qty}</span>
                          <span className="text-right">{formatRp(d.harga_jual)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatRp(subtotal)}</span>
                    </div>
                    {diskon > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Diskon</span>
                        <span>-{formatRp(diskon)}</span>
                      </div>
                    )}
                    {ppn > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>PPN ({ppn}%)</span>
                        <span>+{formatRp(ppnAmount)}</span>
                      </div>
                    )}
                    <div className="!mt-2 border-t border-dashed border-neutral-300 pt-2 flex justify-between font-semibold text-sm">
                      <span>Total</span>
                      <span>{formatRp(total)}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-neutral-500"><p>Siap diproses.</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
