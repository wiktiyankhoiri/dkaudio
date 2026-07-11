<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\KategoriController;
use App\Http\Controllers\Api\BarangController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\PembelianController;
use App\Http\Controllers\Api\PenjualanController;
use App\Http\Controllers\Api\PenyesuaianStokController;
use App\Http\Controllers\Api\StokOpnameController;
use App\Http\Controllers\Api\KartuStokController;
use App\Http\Controllers\Api\LaporanController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\SearchController;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

// Download routes — use query-token auth (supports <a> tag downloads)
Route::middleware('auth.token')->group(function () {
    Route::get('/kategori/template', [KategoriController::class, 'exportTemplate']);
    Route::get('/kategori/export', [KategoriController::class, 'exportExcel']);
    Route::get('/barang/template', [BarangController::class, 'exportTemplate']);
    Route::get('/barang/export', [BarangController::class, 'exportExcel']);
    Route::get('/supplier/template', [SupplierController::class, 'exportTemplate']);
    Route::get('/supplier/export', [SupplierController::class, 'exportExcel']);
    Route::get('/stok-opname/template', [StokOpnameController::class, 'exportTemplate']);
    Route::get('/penjualan/{penjualan}/pdf', [PenjualanController::class, 'pdf']);
});

// API routes — use Bearer Sanctum auth
Route::middleware(['auth:sanctum', 'throttle:300,1'])->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Master data — read: semua role, write: owner,admin
    Route::get('/kategori', [KategoriController::class, 'index']);
    Route::get('/kategori/{kategori}', [KategoriController::class, 'show']);
    Route::middleware('role:owner,admin')->group(function () {
        Route::post('/kategori/import', [KategoriController::class, 'importExcel']);
        Route::post('/kategori', [KategoriController::class, 'store']);
        Route::put('/kategori/{kategori}', [KategoriController::class, 'update']);
        Route::patch('/kategori/{kategori}', [KategoriController::class, 'update']);
        Route::delete('/kategori/{kategori}', [KategoriController::class, 'destroy']);
    });

    Route::get('/barang', [BarangController::class, 'index']);
    Route::get('/barang/{barang}', [BarangController::class, 'show']);
    Route::middleware('role:owner,admin')->group(function () {
        Route::post('/barang/import', [BarangController::class, 'importExcel']);
        Route::post('/barang', [BarangController::class, 'store']);
        Route::put('/barang/{barang}', [BarangController::class, 'update']);
        Route::patch('/barang/{barang}', [BarangController::class, 'update']);
        Route::delete('/barang/{barang}', [BarangController::class, 'destroy']);
    });

    Route::get('/supplier', [SupplierController::class, 'index']);
    Route::get('/supplier/{supplier}', [SupplierController::class, 'show']);
    Route::middleware('role:owner,admin')->group(function () {
        Route::post('/supplier/import', [SupplierController::class, 'importExcel']);
        Route::post('/supplier', [SupplierController::class, 'store']);
        Route::put('/supplier/{supplier}', [SupplierController::class, 'update']);
        Route::patch('/supplier/{supplier}', [SupplierController::class, 'update']);
        Route::delete('/supplier/{supplier}', [SupplierController::class, 'destroy']);
    });

    // Pembelian — hanya owner,admin (kasir tidak mengurus pembelian)
    Route::middleware('role:owner,admin')->group(function () {
        Route::get('/pembelian', [PembelianController::class, 'index']);
        Route::get('/pembelian/next-number', [PembelianController::class, 'nextNumber']);
        Route::post('/pembelian', [PembelianController::class, 'store']);
        Route::get('/pembelian/{pembelian}', [PembelianController::class, 'show']);
        Route::put('/pembelian/{pembelian}', [PembelianController::class, 'update']);
        Route::post('/pembelian/{pembelian}/bayar', [PembelianController::class, 'bayar']);
        Route::delete('/pembelian/{pembelian}', [PembelianController::class, 'destroy']);
    });

    // Penjualan — kasir boleh buat & lihat; ubah/hapus/bayar cicilan hanya owner,admin
    Route::get('/penjualan', [PenjualanController::class, 'index']);
    Route::get('/penjualan/next-number', [PenjualanController::class, 'nextNumber']);
    Route::post('/penjualan', [PenjualanController::class, 'store']);
    Route::get('/penjualan/{penjualan}', [PenjualanController::class, 'show']);
    Route::put('/penjualan/{penjualan}', [PenjualanController::class, 'update'])->middleware('role:owner,admin');
    Route::delete('/penjualan/{penjualan}', [PenjualanController::class, 'destroy'])->middleware('role:owner,admin');
    // Kasir boleh menerima pembayaran/pelunasan (tugas inti kasir POS)
    Route::post('/penjualan/{penjualan}/bayar', [PenjualanController::class, 'bayar']);

    // Penyesuaian stok — hanya owner,admin
    Route::middleware('role:owner,admin')->group(function () {
        Route::get('/penyesuaian-stok', [PenyesuaianStokController::class, 'index']);
        Route::post('/penyesuaian-stok', [PenyesuaianStokController::class, 'store']);
        Route::get('/penyesuaian-stok/{penyesuaian_stok}', [PenyesuaianStokController::class, 'show']);
    });

    Route::post('/stok-opname/import', [StokOpnameController::class, 'importExcel'])->middleware('role:owner,admin');
    Route::get('/stok-opname', [StokOpnameController::class, 'index'])->middleware('role:owner,admin');
    Route::get('/stok-opname/next-number', [StokOpnameController::class, 'nextNumber'])->middleware('role:owner,admin');
    Route::post('/stok-opname', [StokOpnameController::class, 'store'])->middleware('role:owner,admin');
    Route::get('/stok-opname/{stok_opname}', [StokOpnameController::class, 'show'])->middleware('role:owner,admin');
    Route::put('/stok-opname/{stok_opname}', [StokOpnameController::class, 'update'])->middleware('role:owner,admin');
    Route::post('/stok-opname/{stok_opname}/selesaikan', [StokOpnameController::class, 'selesaikan'])->middleware('role:owner,admin');
    Route::post('/stok-opname/{stok_opname}/terapkan', [StokOpnameController::class, 'terapkan'])->middleware('role:owner,admin');
    Route::post('/stok-opname/{stok_opname}/batalkan', [StokOpnameController::class, 'batalkan'])->middleware('role:owner,admin');

    Route::get('/kartu-stok', [KartuStokController::class, 'index'])->middleware('role:owner,admin');

    Route::get('/laporan/barang', [LaporanController::class, 'stok'])->middleware('role:owner,admin');
    Route::get('/laporan/pembelian', [LaporanController::class, 'barangMasuk'])->middleware('role:owner,admin');
    Route::get('/laporan/penjualan', [LaporanController::class, 'barangKeluar'])->middleware('role:owner,admin');

    Route::apiResource('users', UserController::class)->middleware('role:owner');
    Route::get('/audit-log', [AuditLogController::class, 'index'])->middleware('role:owner,admin');
    Route::get('/audit-log/{audit_log}', [AuditLogController::class, 'show'])->middleware('role:owner,admin');

    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/list', [NotificationController::class, 'list']);
    Route::post('/notifications/read-all', [NotificationController::class, 'readAll']);
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'read']);

    Route::get('/search', [SearchController::class, 'index']);
});
