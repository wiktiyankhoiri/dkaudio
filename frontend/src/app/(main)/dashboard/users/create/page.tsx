'use client';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

const schema = z.object({
  nama: z.string().min(1, 'Wajib diisi'),
  username: z.string().min(1, 'Wajib diisi'),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  password: z.string().min(6, 'Minimal 6 karakter'),
  role: z.enum(['owner', 'admin', 'kasir']),
});
type FormData = z.infer<typeof schema>;

export default function CreateUserPage() {
  const router = useRouter();
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'kasir' },
  });

  const onSubmit = async (d: FormData) => {
    try {
      await api.createUser(d);
      toast.success('Pengguna dibuat');
      router.push('/dashboard/users');
    } catch { toast.error('Gagal membuat pengguna'); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div><h1 className="text-2xl font-semibold tracking-tight">Tambah Pengguna</h1>
          <p className="text-sm text-muted-foreground">Buat pengguna baru</p>
        </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Form Pengguna</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Nama</label>
                <Input {...register('nama')} placeholder="Nama lengkap" />
                {errors.nama && <p className="text-xs text-destructive">{errors.nama.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Username</label>
                <Input {...register('username')} placeholder="Username" />
                {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" {...register('email')} placeholder="Email (opsional)" />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Password</label>
                <Input type="password" {...register('password')} placeholder="Min. 6 karakter" />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Peran</label>
                <Select onValueChange={v => setValue('role', v as FormData['role'])} defaultValue="kasir">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="kasir">Kasir</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
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
