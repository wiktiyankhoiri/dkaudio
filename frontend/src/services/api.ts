import type { Barang, Penjualan, Pembelian, DashboardData, Kategori, Notification, PenyesuaianStok, StokOpname, Supplier, User, AuditLog, ApiError, PaginatedResponse } from '@/types';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') this.token = localStorage.getItem('dk_token');
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    return headers;
  }

  setToken(t: string | null) { this.token = t; if (t) localStorage.setItem('dk_token', t); else localStorage.removeItem('dk_token'); }
  getToken() { return this.token; }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, { ...options, headers: { ...this.getHeaders(), ...options.headers as Record<string, string> } });
    const data = await res.json();
    if (!res.ok) throw { message: data.message || 'Request failed', errors: data.errors } as ApiError;
    return data as T;
  }

  get = <T>(path: string) => this.request<T>(path);
  post = <T>(path: string, body?: any) => this.request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
  put = <T>(path: string, body?: any) => this.request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
  del = <T>(path: string) => this.request<T>(path, { method: 'DELETE' });

  async download(path: string, filename: string) {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { 'Authorization': `Bearer ${this.token}` },
    });
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  upload = <T>(path: string, formData: FormData) => {
    const headers: Record<string, string> = { 'Accept': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    return fetch(`${API_URL}${path}`, { method: 'POST', headers, body: formData }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw { message: data.message || 'Upload failed', errors: data.errors } as ApiError;
      return data as T;
    });
  };

  login = (username: string, password: string) => this.post<{ user: User; token: string }>('/api/login', { username, password });
  logout = () => this.post('/api/logout');
  getUser = () => this.get<User>('/api/user');

  getKategori = (params?: string) => this.get<PaginatedResponse<Kategori>>(`/api/kategori${params ? '?' + params : ''}`);
  createKategori = (d: Partial<Kategori>) => this.post<Kategori>('/api/kategori', d);
  updateKategori = (id: number, d: Partial<Kategori>) => this.put<Kategori>(`/api/kategori/${id}`, d);
  deleteKategori = (id: number) => this.del(`/api/kategori/${id}`);

  getBarang = (params?: string) => this.get<PaginatedResponse<Barang>>(`/api/barang${params ? '?' + params : ''}`);
  createBarang = (d: any) => this.post<Barang>('/api/barang', d);
  updateBarang = (id: number, d: any) => this.put<Barang>(`/api/barang/${id}`, d);
  deleteBarang = (id: number) => this.del(`/api/barang/${id}`);

  getSupplier = (params?: string) => this.get<PaginatedResponse<Supplier>>(`/api/supplier${params ? '?' + params : ''}`);
  createSupplier = (d: Partial<Supplier>) => this.post<Supplier>('/api/supplier', d);
  updateSupplier = (id: number, d: Partial<Supplier>) => this.put<Supplier>(`/api/supplier/${id}`, d);
  deleteSupplier = (id: number) => this.del(`/api/supplier/${id}`);

  getPembelian = (params?: string) => this.get<PaginatedResponse<Pembelian>>(`/api/pembelian${params ? '?' + params : ''}`);
  getPembelianNextNumber = () => this.get<{ no_surat: string }>('/api/pembelian/next-number');
  getPembelianDetail = (id: number) => this.get<Pembelian>(`/api/pembelian/${id}`);
  createPembelian = (d: any) => this.post<Pembelian>('/api/pembelian', d);
  updatePembelian = (id: number, d: any) => this.put<Pembelian>(`/api/pembelian/${id}`, d);
  payPembelian = (id: number): Promise<Pembelian> => this.post<Pembelian>(`/api/pembelian/${id}/bayar`);
  deletePembelian = (id: number) => this.del(`/api/pembelian/${id}`);

  getPenjualan = (params?: string) => this.get<PaginatedResponse<Penjualan>>(`/api/penjualan${params ? '?' + params : ''}`);
  getPenjualanNextNumber = () => this.get<{ no_invoice: string }>('/api/penjualan/next-number');
  getPenjualanDetail = (id: number) => this.get<Penjualan>(`/api/penjualan/${id}`);
  createPenjualan = (d: any) => this.post<Penjualan>('/api/penjualan', d);
  updatePenjualan = (id: number, d: any) => this.put<Penjualan>(`/api/penjualan/${id}`, d);
  payPenjualan = (id: number, jumlah: number): Promise<Penjualan> => this.post<Penjualan>(`/api/penjualan/${id}/bayar`, { jumlah });
  deletePenjualan = (id: number) => this.del(`/api/penjualan/${id}`);

  getPenyesuaianStok = (params?: string) => this.get<PaginatedResponse<PenyesuaianStok>>(`/api/penyesuaian-stok${params ? '?' + params : ''}`);
  createPenyesuaianStok = (d: any) => this.post<PenyesuaianStok>('/api/penyesuaian-stok', d);

  getStokOpname = (params?: string) => this.get<PaginatedResponse<StokOpname>>(`/api/stok-opname${params ? '?' + params : ''}`);
  getStokOpnameNextNumber = () => this.get<{ no_opname: string }>('/api/stok-opname/next-number');
  getStokOpnameDetail = (id: number) => this.get<StokOpname>(`/api/stok-opname/${id}`);
  createStokOpname = (d: any) => this.post<StokOpname>('/api/stok-opname', d);
  updateStokOpname = (id: number, d: any) => this.put<StokOpname>(`/api/stok-opname/${id}`, d);
  selesaikanOpname = (id: number) => this.post<StokOpname>(`/api/stok-opname/${id}/selesaikan`);
  terapkanOpname = (id: number) => this.post<StokOpname>(`/api/stok-opname/${id}/terapkan`);
  batalkanOpname = (id: number) => this.post<StokOpname>(`/api/stok-opname/${id}/batalkan`);

  getKartuStok = (params: string) => this.get<any>(`/api/kartu-stok?${params}`);
  getDashboard = () => this.get<DashboardData>('/api/dashboard');

  getLaporanStok = (params?: string) => this.get<any[]>(`/api/laporan/barang${params ? '?' + params : ''}`);
  getLaporanPembelian = (params?: string) => this.get<any[]>(`/api/laporan/pembelian${params ? '?' + params : ''}`);
  getLaporanPenjualan = (params?: string) => this.get<any[]>(`/api/laporan/penjualan${params ? '?' + params : ''}`);

  getUsers = (params?: string) => this.get<PaginatedResponse<User>>(`/api/users${params ? '?' + params : ''}`);
  createUser = (d: any) => this.post<User>('/api/users', d);
  updateUser = (id: number, d: any) => this.put<User>(`/api/users/${id}`, d);
  deleteUser = (id: number) => this.del(`/api/users/${id}`);

  getAuditLog = (params?: string) => this.get<AuditLog[]>(`/api/audit-log${params ? '?' + params : ''}`);
  getNotifications = () => this.get<Notification[]>('/api/notifications');
  getNotificationsList = () => this.get<{ notifications: Notification[]; unread_count: number }>('/api/notifications/list');
  readNotification = (id: number) => this.post(`/api/notifications/${id}/read`);
  readAllNotifications = () => this.post('/api/notifications/read-all');

  updateProfile = (d: any) => this.put<any>('/api/user/update', d);

  search = (q: string) => this.get<any[]>(`/api/search?q=${q}`);
}

export const api = new ApiClient();
