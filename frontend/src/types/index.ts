export interface User {
  id: number; nama: string; username: string; email: string; role: 'owner' | 'admin' | 'kasir';
  created_at: string; updated_at: string;
}

export interface Kategori { id: number; nama_kategori: string; barang_count?: number; created_at?: string; }

export interface Barang { id: number; kode_barang: string; nama_barang: string; kategori_id: number; kategori?: Kategori; satuan: 'PCS' | 'SET'; harga_beli: number; harga_jual: number; stok?: Stok; stok_qty?: number; created_at?: string; }

export interface Stok { id: number; barang_id: number; qty: number; }

export interface Supplier { id: number; kode_supplier: string; nama_supplier: string; alamat?: string; telepon?: string; created_at?: string; }

export interface Pembelian { id: number; no_surat: string; tanggal: string; supplier_id?: number; supplier?: Supplier; jatuh_tempo?: string; keterangan?: string; status?: 'hutang' | 'lunas'; total?: number; details?: PembelianDetail[]; created_at?: string; }

export interface PembelianDetail { id: number; pembelian_id: number; barang_id: number; barang?: Barang; qty: number; harga_beli?: number; }

export interface Penjualan { id: number; no_invoice: string; tanggal: string; konsumen?: string; telepon?: string; alamat?: string; jatuh_tempo?: string; diskon: number; ppn: number; subtotal: number; dibayar: number; total: number; status: 'dp' | 'lunas'; keterangan?: string; details?: PenjualanDetail[]; created_at?: string; }

export interface PenjualanDetail { id: number; penjualan_id: number; barang_id: number; barang?: Barang; qty: number; harga_jual: number; subtotal: number; }

export interface PenyesuaianStok { id: number; tanggal: string; barang_id: number; barang?: Barang; qty_sebelum: number; qty_sesudah: number; selisih: number; alasan?: string; user_id: number; user?: User; }

export interface StokOpname { id: number; no_opname: string; tanggal_opname: string; status: 'draft' | 'selesai' | 'diterapkan' | 'dibatalkan'; catatan?: string; user_id: number; user?: User; details?: StokOpnameDetail[]; }

export interface StokOpnameDetail { id: number; stok_opname_id: number; barang_id: number; barang?: Barang; stok_sistem: number; stok_fisik: number; selisih: number; keterangan?: string; }

export interface AuditLog { id: number; user_id?: number; user?: User; action: string; table_name?: string; reference_id?: string; description?: string; data?: any; created_at: string; }

export interface Notification { id: number; user_id: number; title: string; message: string; type?: string; ref_id?: string; is_read: boolean; created_at: string; }

export interface DashboardData {
  total_barang: number; total_kategori: number; total_supplier: number; total_user: number;
  pembelian_hari_ini: number; pembelian_kemarin: number;
  penjualan_hari_ini: number; penjualan_kemarin: number;
  total_nilai_stok: number; total_nilai_jual: number;
  stok_menipis: { id: number; nama: string; kode: string; stok: number }[];
  opname_aktif: number;
  stok_total: number; stok_rendah: number; stok_habis: number;
  total_penjualan_bulan_ini: number; total_penjualan_bulan_lalu: number; total_penjualan_semua: number;
  top_products: { nama: string; qty: number; total: number }[];
  pembelian_terbaru?: Pembelian[];
  penjualan_terbaru?: Penjualan[];
}

export interface ApiError { message: string; errors?: Record<string, string[]>; }

export interface PaginatedResponse<T> { data: T[]; current_page: number; last_page: number; per_page: number; total: number; }
