'use client';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { Notification } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCheck, Bell } from 'lucide-react';
import { toast } from 'sonner';


export default function NotifikasiPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getNotificationsList();
      setNotifications(res.notifications ?? []);
      setUnreadCount(res.unread_count ?? 0);
    } catch { toast.error('Gagal memuat notifikasi'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRead = async (id: number) => {
    try {
      await api.readNotification(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { toast.error('Gagal'); }
  };

  const handleReadAll = async () => {
    try {
      await api.readAllNotifications();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('Semua notifikasi telah dibaca');
    } catch { toast.error('Gagal'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifikasi</h1>
          <p className="text-sm text-muted-foreground">Daftar notifikasi dan pemberitahuan</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleReadAll}><CheckCheck className="size-4" />Tandai Semua Dibaca</Button>
        )}
      </div>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-muted-foreground">
            <Bell className="size-12 mb-3" />
            <p>Tidak ada notifikasi</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <Card key={n.id} className={n.is_read ? '' : 'border-l-4 border-l-primary'}>
              <CardContent className="flex items-start justify-between py-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{n.title}</h3>
                    {!n.is_read && <Badge variant="default" className="text-xs">Baru</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString('id-ID')}</p>
                </div>
                {!n.is_read && (
                  <Button variant="ghost" size="sm" onClick={() => handleRead(n.id)} className="shrink-0">
                    <CheckCheck className="size-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
