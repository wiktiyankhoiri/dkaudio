'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import type { Penjualan } from '@/types';
import { formatRp } from '@/lib/format';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PrintPenjualanPage() {
  const params = useParams();
  const id = Number(params.id);
  const router = useRouter();
  const [data, setData] = useState<Penjualan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPenjualanDetail(id)
      .then(setData)
      .catch(() => toast.error('Gagal memuat data'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!data) return;
    const imgs = document.querySelectorAll('img');
    let loaded = 0;
    const check = () => { loaded++; if (loaded >= imgs.length) print(); };
    const print = () => setTimeout(() => window.print(), 800);
    if (imgs.length === 0) print();
    else imgs.forEach(img => { if (img.complete) check(); else img.onload = check; });
  }, [data]);

  useEffect(() => {
    const cb = () => router.back();
    window.addEventListener('afterprint', cb);
    return () => window.removeEventListener('afterprint', cb);
  }, [router]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="size-6 animate-spin" /></div>;
  if (!data) return <div className="text-center text-muted-foreground py-12">Data tidak ditemukan</div>;

  const ppnAmount = data.ppn > 0 ? (data.subtotal - data.diskon) * (data.ppn / 100) : 0;
  const sisa = data.total - data.dibayar;

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #fff !important; }
        @media print {
          @page { margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        .print-overlay { position: fixed; inset: 0; z-index: 99999; background: #fff; display: flex; justify-content: center; padding: 20px; overflow: auto; }
        .print-content { font-family: monospace; font-size: 13px; color: #111; max-width: 400px; width: 100%; }
      `}</style>
      <div className="print-overlay">
      <div className="print-content">
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-dkaudio.png" alt="DK Audio" className="h-10 w-auto" />
            <h3 className="text-2xl uppercase tracking-widest text-right">Invoice</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-0.5">
              <p>Referensi: {data.no_invoice}</p>
              <p>Tanggal: {new Date(data.tanggal).toLocaleDateString('id-ID')}</p>
            </div>
            <div className="text-right space-y-0.5">
              <p>Jatuh tempo: {data.jatuh_tempo ? new Date(data.jatuh_tempo).toLocaleDateString('id-ID') : '—'}</p>
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
            {data.konsumen && (
              <div>
                <p className="mb-2 font-semibold uppercase">Kepada</p>
                <p>{data.konsumen}</p>
                {data.telepon && <p>{data.telepon}</p>}
                {data.alamat && <p>{data.alamat}</p>}
              </div>
            )}
          </div>

          <div className="text-xs">
            <div className="grid grid-cols-4 gap-2 bg-stone-100 px-2 py-1.5 font-semibold uppercase">
              <span className="col-span-2">Barang</span>
              <span className="text-right">Jml</span>
              <span className="text-right">Harga</span>
            </div>
            {data.details?.map((d) => (
              <div key={d.id} className="grid grid-cols-4 gap-2 border-b px-2 py-2">
                <span className="col-span-2">{d.barang?.nama_barang || '—'}</span>
                <span className="text-right">{d.qty}</span>
                <span className="text-right">{formatRp(d.harga_jual)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatRp(data.subtotal)}</span>
            </div>
            {data.diskon > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Diskon</span>
                <span>-{formatRp(data.diskon)}</span>
              </div>
            )}
            {data.ppn > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>PPN ({data.ppn}%)</span>
                <span>+{formatRp(ppnAmount)}</span>
              </div>
            )}
            <div className="!mt-2 border-t border-dashed border-neutral-300 pt-2 flex justify-between font-semibold text-sm">
              <span>Total</span>
              <span>{formatRp(data.total)}</span>
            </div>
            <div className="flex justify-between pt-1 text-muted-foreground">
              <span>Dibayar</span>
              <span>{formatRp(data.dibayar)}</span>
            </div>
            <div className="flex justify-between font-medium text-sm">
              <span>Sisa</span>
              <span className={sisa > 0 ? 'text-destructive' : 'text-green-600'}>{formatRp(sisa)}</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}
