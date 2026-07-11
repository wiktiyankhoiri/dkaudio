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

const schema = z.object({
  kode_supplier: z.string().min(1, 'Wajib diisi'),
  nama_supplier: z.string().min(1, 'Wajib diisi'),
  alamat: z.string().optional(),
  telepon: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function CreateSupplierPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (d: FormData) => {
    try {
      await api.createSupplier(d);
      toast.success('Supplier dibuat');
      router.push('/dashboard/supplier');
    } catch { toast.error('Gagal membuat supplier'); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div><h1 className="text-2xl font-semibold tracking-tight">Tambah Supplier</h1>
          <p className="text-sm text-muted-foreground">Buat data supplier baru</p>
        </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Form Supplier</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Kode Supplier</label>
                <Input {...register('kode_supplier')} placeholder="Contoh: SUP-001" />
                {errors.kode_supplier && <p className="text-xs text-destructive">{errors.kode_supplier.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Nama Supplier</label>
                <Input {...register('nama_supplier')} placeholder="Masukkan nama supplier" />
                {errors.nama_supplier && <p className="text-xs text-destructive">{errors.nama_supplier.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Alamat</label>
                <Input {...register('alamat')} placeholder="Alamat supplier (opsional)" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Telepon</label>
                <Input {...register('telepon')} placeholder="Nomor telepon (opsional)" />
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
