'use client';
import { useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function ProfilePage() {
  const { user } = useAuth();
  const [nama, setNama] = useState(user?.nama || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateProfile({ nama, username, email });
      toast.success('Profil diperbarui');
    } catch (err: any) { toast.error(err.message || 'Gagal'); }
    finally { setLoading(false); }
  };

  const initial = user?.nama?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Profil</h1></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="flex flex-col items-center py-6">
            <Avatar className="size-20 mb-4"><AvatarFallback className="text-2xl bg-primary text-primary-foreground">{initial}</AvatarFallback></Avatar>
            <h2 className="text-lg font-semibold">{user?.nama}</h2>
            <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
            <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
          </CardContent>
        </Card>
        <div className="md:col-span-2">
          <Card>
            <CardHeader><CardTitle>Edit Profil</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Nama</label>
                  <Input value={nama} onChange={e => setNama(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Username</label>
                  <Input value={username} onChange={e => setUsername(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
