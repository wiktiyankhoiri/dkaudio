'use client';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({ nama_kategori: z.string().min(1, 'Wajib diisi') });
type FormData = z.infer<typeof schema>;

export default function CreateKategoriPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (d: FormData) => {
    try {
      await api.createKategori(d);
      toast.success('Kategori dibuat');
      router.push('/dashboard/kategori');
    } catch { toast.error('Gagal membuat kategori'); }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div><h1 className="text-2xl font-semibold tracking-tight">Tambah Kategori</h1>
          <p className="text-sm text-muted-foreground">Buat kategori barang baru</p>
        </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Form Kategori</CardTitle></CardHeader>
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
