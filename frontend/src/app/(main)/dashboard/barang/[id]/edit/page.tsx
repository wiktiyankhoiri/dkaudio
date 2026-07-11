'use client';
'use no memo';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/services/api';
import type { Barang, Kategori } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({
  kode_barang: z.string().min(1, 'Wajib diisi'),
  nama_barang: z.string().min(1, 'Wajib diisi'),
  kategori_id: z.coerce.number({ message: 'Pilih kategori' }),
  satuan: z.enum(['PCS', 'SET']),
  harga_beli: z.coerce.number({ message: 'Minimal 0' }),
  harga_jual: z.coerce.number({ message: 'Minimal 0' }),
});

export default function EditBarangPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [kategori, setKategori] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKategori, setSelectedKategori] = useState<number>(0);
  const [selectedSatuan, setSelectedSatuan] = useState<'PCS' | 'SET'>('PCS');

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    Promise.all([api.getBarang('per_page=9999'), api.getKategori('per_page=9999')]).then(([bRes, kRes]) => {
      const barang = bRes.data;
      const kat = kRes.data;
      setKategori(kat);
      const item = barang.find((b: Barang) => b.id === id);
      if (item) {
        setSelectedKategori(item.kategori_id ?? 0);
        setSelectedSatuan(item.satuan as 'PCS' | 'SET');
        reset({
          kode_barang: item.kode_barang,
          nama_barang: item.nama_barang,
          kategori_id: item.kategori_id,
          satuan: item.satuan,
          harga_beli: item.harga_beli,
          harga_jual: item.harga_jual,
        });
      } else toast.error('Barang tidak ditemukan');
    }).catch(() => toast.error('Gagal memuat data')).finally(() => setLoading(false));
  }, [id, reset]);

  const onSubmit = async (d: z.infer<typeof schema>) => {
    try {
      await api.updateBarang(id, d);
      toast.success('Barang diupdate');
      router.push('/dashboard/barang');
    } catch { toast.error('Gagal mengupdate'); }
  };

  if (loading) return <div className="flex items-center justify-center h-48"><Loader2 className="size-6 animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Barang</h1>
        <p className="text-sm text-muted-foreground">Ubah data barang</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Form Edit Barang</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Kode Barang</label>
                <Input {...register('kode_barang')} />
                {errors.kode_barang && <p className="text-xs text-destructive">{errors.kode_barang.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Nama Barang</label>
                <Input {...register('nama_barang')} />
                {errors.nama_barang && <p className="text-xs text-destructive">{errors.nama_barang.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Kategori</label>
                <Select value={String(selectedKategori || '')} onValueChange={v => { setSelectedKategori(Number(v)); setValue('kategori_id', Number(v)); }}>
                  <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent>
                    {kategori.map(k => <SelectItem key={k.id} value={String(k.id)}>{k.nama_kategori}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.kategori_id && <p className="text-xs text-destructive">{errors.kategori_id.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Satuan</label>
                <Select value={selectedSatuan} onValueChange={v => { setSelectedSatuan(v as 'PCS' | 'SET'); setValue('satuan', v as 'PCS' | 'SET'); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PCS">PCS</SelectItem>
                    <SelectItem value="SET">SET</SelectItem>
                  </SelectContent>
                </Select>
                {errors.satuan && <p className="text-xs text-destructive">{errors.satuan.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Harga Beli</label>
                <Input type="number" step="1" {...register('harga_beli')} />
                {errors.harga_beli && <p className="text-xs text-destructive">{errors.harga_beli.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Harga Jual</label>
                <Input type="number" step="1" {...register('harga_jual')} />
                {errors.harga_jual && <p className="text-xs text-destructive">{errors.harga_jual.message}</p>}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isSubmitting}><Save className="size-4" />{isSubmitting ? 'Menyimpan...' : 'Simpan'}</Button>
              <Button type="button" variant="default" onClick={() => router.back()}>Batal</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
