'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/services/api';
import type { Kategori } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({
  kode_barang: z.string().min(1, 'Wajib diisi'),
  nama_barang: z.string().min(1, 'Wajib diisi'),
  kategori_id: z.coerce.number({ message: 'Pilih kategori' }),
  satuan: z.enum(['PCS', 'SET']),
  harga_beli: z.coerce.number({ message: 'Minimal 0' }),
  harga_jual: z.coerce.number({ message: 'Minimal 0' }),
});

export default function CreateBarangPage() {
  const router = useRouter();
  const [kategori, setKategori] = useState<Kategori[]>([]);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { kode_barang: '', nama_barang: '', kategori_id: 0, satuan: 'PCS' as const, harga_beli: '', harga_jual: '' },
  });
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = form;

  useEffect(() => { api.getKategori('per_page=9999').then(r => setKategori(r.data)).catch(() => toast.error('Gagal memuat kategori')); }, []);

  const onSubmit = async (d: z.infer<typeof schema>) => {
    try {
      await api.createBarang(d);
      toast.success('Barang dibuat');
      router.push('/dashboard/barang');
    } catch (e: unknown) {
      const err = e as { message?: string; errors?: Record<string, string[]> };
      toast.error(err?.errors ? Object.values(err.errors).flat().join(', ') : err?.message || 'Gagal');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tambah Barang</h1>
        <p className="text-sm text-muted-foreground">Buat data barang baru</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Form Barang</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Kode Barang</label>
                <Input {...register('kode_barang')} placeholder="Contoh: BRG-001" />
                {errors.kode_barang && <p className="text-xs text-destructive">{errors.kode_barang.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Nama Barang</label>
                <Input {...register('nama_barang')} placeholder="Masukkan nama barang" />
                {errors.nama_barang && <p className="text-xs text-destructive">{errors.nama_barang.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Kategori</label>
                <Select onValueChange={v => setValue('kategori_id', Number(v))}>
                  <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent>
                    {kategori.map(k => <SelectItem key={k.id} value={String(k.id)}>{k.nama_kategori}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.kategori_id && <p className="text-xs text-destructive">{errors.kategori_id.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Satuan</label>
                <Select onValueChange={v => setValue('satuan', v as 'PCS' | 'SET')} defaultValue="PCS">
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
                <Input type="number" step="1" {...register('harga_beli')} placeholder="0" />
                {errors.harga_beli && <p className="text-xs text-destructive">{errors.harga_beli.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Harga Jual</label>
                <Input type="number" step="1" {...register('harga_jual')} placeholder="0" />
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
