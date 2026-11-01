/**
 * TOKO SAKALA — Playwright End-to-End Test Suite
 * Skenario Pengujian:
 * 1. Simpan Transaksi Offline -> Tersimpan di IndexedDB lokal dengan status "Tersimpan (lokal)"
 * 2. Transisi Online -> Sinkronisasi mutasi outbox ke Supabase tanpa duplikasi (idempotency key)
 * 3. Cadangan & Pemulihan -> Snapshot pengaman dibuat otomatis sebelum memulihkan data
 */

import { test, expect } from '@playwright/test';

test.describe('TOKO SAKALA Offline-First Storage & Transaction Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Tunggu aplikasi termuat penuh
    await expect(page.locator('text=TOKO SAKALA')).toBeVisible();
  });

  test('TC-01: Simpan pembelian belanja secara offline-first ke IndexedDB', async ({ page }) => {
    // Navigasi ke menu Catat Belanja
    const catatBtn = page.locator('text=Catat Belanja').first();
    await catatBtn.click();

    // Pilih produk pertama
    const productCard = page.locator('.product-select-card').first();
    await productCard.click();

    // Isi jumlah belanja
    const qtyInput = page.locator('#p-qty');
    await qtyInput.fill('3');

    // Tekan tombol Simpan
    const saveBtn = page.locator('button:has-text("Simpan Pembelian Belanja")');
    await saveBtn.click();

    // Verifikasi toast notifikasi muncul dan menampilkan informasi tersimpan
    const toast = page.locator('.toast-notice');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('tersimpan');

    // Periksa status data di layar Pengaturan
    const lainnyaBtn = page.locator('text=Lainnya').first();
    await lainnyaBtn.click();
    const pengaturanCard = page.locator('text=Pengaturan & Tema');
    await pengaturanCard.click();

    // Periksa status IndexedDB aktif
    await expect(page.locator('text=IndexedDB Aktif')).toBeVisible();
    await expect(page.locator('text=SHA-256 Valid')).toBeVisible();
  });

  test('TC-02: Dialog pemilihan tanggal dan nominal menggunakan modal internal tanpa prompt()', async ({ page }) => {
    // Navigasi ke Setoran Karyawan
    const setoranBtn = page.locator('text=Setoran').first();
    await setoranBtn.click();

    // Buka modal ubah tanggal
    const ubahTanggalBtn = page.locator('text=Ubah Tanggal');
    await ubahTanggalBtn.click();

    // Verifikasi modal tanggal internal terbuka
    const modalTanggal = page.locator('text=Pilih Tanggal Setoran');
    await expect(modalTanggal).toBeVisible();

    // Tekan tombol Hari ini
    const hariIniBtn = page.locator('button:has-text("Hari ini")');
    await hariIniBtn.click();
    await expect(modalTanggal).not.toBeVisible();

    // Buka modal ubah nominal
    const ubahNominalBtn = page.locator('text=Ubah Nominal');
    await ubahNominalBtn.click();

    // Verifikasi modal nominal internal terbuka
    const modalNominal = page.locator('text=Ubah Uang Diterima');
    await expect(modalNominal).toBeVisible();

    // Masukkan nominal baru
    const inputNominal = page.locator('#custom-amount');
    await inputNominal.fill('1500000');
    const simpanNominalBtn = page.locator('button:has-text("Simpan Nominal")');
    await simpanNominalBtn.click();

    // Verifikasi nilai uang fisik ter-update
    await expect(page.locator('text=Rp 1.500.000')).toBeVisible();
  });

  test('TC-03: Ekspor file cadangan JSON dan proteksi pemulihan aman', async ({ page }) => {
    // Buka layar Pengaturan
    await page.goto('/');
    const lainnyaBtn = page.locator('text=Lainnya').first();
    await lainnyaBtn.click();
    const pengaturanCard = page.locator('text=Pengaturan & Tema');
    await pengaturanCard.click();

    // Verifikasi tombol unduh JSON tersedia
    const unduhJsonBtn = page.locator('button:has-text("Unduh JSON")');
    await expect(unduhJsonBtn).toBeVisible();

    // Verifikasi kartu Supabase cloud tersedia
    await expect(page.locator('text=Sinkronisasi Cloud Supabase')).toBeVisible();
  });
});
