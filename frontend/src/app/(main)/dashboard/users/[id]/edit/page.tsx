'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import type { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EditUserPage() {
  const params = useParams();
  const id = Number(params.id);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nama: '', username: '', email: '', password: '', role: 'kasir' as User['role'] });

  useEffect(() => {
    api.getUsers('per_page=9999').then(res => {
      const item = res.data.find(u => u.id === id);
      if (item) setForm({ nama: item.nama, username: item.username, email: item.email ?? '', password: '', role: item.role });
      else toast.error('Pengguna tidak ditemukan');
    }).catch(() => toast.error('Gagal memuat data')).finally(() => setLoading(false));
  }, [id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama || !form.username) { toast.error('Nama dan username wajib diisi'); return; }
    setSaving(true);
    try {
      const payload: any = { nama: form.nama, username: form.username, email: form.email || undefined, role: form.role };
      if (form.password) payload.password = form.password;
      await api.updateUser(id, payload);
      toast.success('Pengguna diperbarui');
      router.push('/dashboard/users');
    } catch { toast.error('Gagal memperbarui'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-48"><Loader2 className="size-6 animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div><h1 className="text-2xl font-semibold tracking-tight">Edit Pengguna</h1>
          <p className="text-sm text-muted-foreground">Ubah data pengguna</p>
        </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Form Edit Pengguna</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Nama</label>
                <Input value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} placeholder="Nama lengkap" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Username</label>
                <Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Username" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email (opsional)" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Password</label>
                <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Kosongkan jika tidak diubah" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Peran</label>
                <Select value={form.role} onValueChange={v => setForm({ ...form, role: v as User['role'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="kasir">Kasir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={saving}><Save className="size-4" />{saving ? 'Menyimpan...' : 'Simpan'}</Button>
              <Button type="button" variant="default" onClick={() => router.back()}>Batal</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
