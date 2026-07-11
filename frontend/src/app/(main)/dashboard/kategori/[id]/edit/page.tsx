'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/services/api';
import type { Kategori } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({ nama_kategori: z.string().min(1, 'Wajib diisi') });
type FormData = z.infer<typeof schema>;

export default function EditKategoriPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const id = Number(params.id);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    api.getKategori('per_page=9999').then(res => {
      const item = res.data.find((k: Kategori) => k.id === id);
      if (item) reset({ nama_kategori: item.nama_kategori });
      else toast.error('Kategori tidak ditemukan');
    }).catch(() => toast.error('Gagal memuat data')).finally(() => setLoading(false));
  }, [id, reset]);

  const onSubmit = async (d: FormData) => {
    try {
      await api.updateKategori(id, d);
      toast.success('Kategori diupdate');
      router.push('/dashboard/kategori');
    } catch { toast.error('Gagal mengupdate'); }
  };

  if (loading) return <div className="flex items-center justify-center h-48"><Loader2 className="size-6 animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-lg">
      <div><h1 className="text-2xl font-semibold tracking-tight">Edit Kategori</h1>
          <p className="text-sm text-muted-foreground">Ubah nama kategori</p>
        </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Form Edit Kategori</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nama Kategori</label>
              <Input {...register('nama_kategori')} placeholder="Masukkan nama kategori" />
              {errors.nama_kategori && <p className="text-xs text-destructive">{errors.nama_kategori.message}</p>}
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}><Save className="size-4" />{isSubmitting ? 'Menyimpan...' : 'Simpan'}</Button>
              <Button type="button" variant="default" onClick={() => router.back()}>Batal</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
