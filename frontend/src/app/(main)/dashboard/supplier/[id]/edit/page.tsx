'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EditSupplierPage() {
  const params = useParams();
  const id = Number(params.id);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ kode_supplier: '', nama_supplier: '', alamat: '', telepon: '' });

  useEffect(() => {
    api.getSupplier('per_page=9999').then(res => {
      const item = res.data.find(s => s.id === id);
      if (item) setForm({ kode_supplier: item.kode_supplier, nama_supplier: item.nama_supplier, alamat: item.alamat ?? '', telepon: item.telepon ?? '' });
      else toast.error('Supplier tidak ditemukan');
    }).catch(() => toast.error('Gagal memuat data')).finally(() => setLoading(false));
  }, [id]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.kode_supplier || !form.nama_supplier) { toast.error('Kode dan nama wajib diisi'); return; }
    setSaving(true);
    try {
      await api.updateSupplier(id, form);
      toast.success('Supplier diupdate');
      router.push('/dashboard/supplier');
    } catch { toast.error('Gagal mengupdate'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-48"><Loader2 className="size-6 animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div><h1 className="text-2xl font-semibold tracking-tight">Edit Supplier</h1>
          <p className="text-sm text-muted-foreground">Ubah data supplier</p>
        </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Form Edit Supplier</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Kode Supplier</label>
                <Input value={form.kode_supplier} onChange={e => setForm({ ...form, kode_supplier: e.target.value })} placeholder="Contoh: SUP-001" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Nama Supplier</label>
                <Input value={form.nama_supplier} onChange={e => setForm({ ...form, nama_supplier: e.target.value })} placeholder="Masukkan nama supplier" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Alamat</label>
                <Input value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })} placeholder="Alamat supplier (opsional)" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Telepon</label>
                <Input value={form.telepon} onChange={e => setForm({ ...form, telepon: e.target.value })} placeholder="Nomor telepon (opsional)" />
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
