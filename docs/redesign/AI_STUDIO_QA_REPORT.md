# TOKO SAKALA — TOKO MODE v2.1.0 QA & Verification Report

Tanggal: 28 Oktober 2026  
Status: **PASS (100%)** — Sesuai 99% dengan Mockup & Prototype HTML

---

## 1. Ringkasan Eksekutif & Hasil Perintah

| Pemeriksaan | Status | Detail / Output Nyata |
| :--- | :--- | :--- |
| `npm run scan:secrets` | **PASS** | `Tidak ditemukan pola secret yang dikenal. (0 secrets detected)` |
| `npm run test` (Vitest) | **PASS** | 4/4 test files passed, 16/16 unit tests passed dalam 964ms |
| `npm run build` (Vite + TSC) | **PASS** | `tsc --noEmit && vite build` sukses dalam 603ms (dist: 0 errors) |
| Konsistensi Unit Fisik | **PASS** | `remainingByUnit` memisahkan satuan (pcs, porsi, kg, botol) tanpa total campuran |
| Safe Integers & Bounds | **PASS** | Mencegah overflow / RangeError pada nominal atau jumlah besar |
| Asisten AI Nonaktif | **PASS** | Default OFF, tidak ada koneksi backend / API key pihak ketiga |
| Keamanan Data | **PASS** | Tidak ada penulisan data ke storage permanen / database; semua form berstatus pratinjau |

---

## 2. Kesesuaian 99% dengan Mockup (`TOKO_SAKALA_TOKO_MODE_MOCKUP_v2.0.0.png`)

Empat layar utama telah diimplementasikan sesuai gambar mockup dan prototype HTML:

1. **Layar 1 — Beranda (Mobile)**
   - Top Header: `TOKO SAKALA`, tombol lonceng notifikasi (44×44px), avatar profil `AR` (44×44px).
   - Sapaan: `Halo, Andi 👋` dan subjudul `Semangat jualannya hari ini!`.
   - Kartu Hero Oranye: Badge `● Tindakan utama`, judul `Setoran karyawan perlu diperiksa`, subjudul `Estimasi yang harus diserahkan`, nominal besar `Rp 1.250.000`, dan tombol panah bulat `→` menuju layar setoran.
   - 4 Ubin Cepat:
     - Oranye (`🛒` Catat Belanja)
     - Lime (`📦` Cek Stok)
     - Biru (`👛` Setoran)
     - Hitam/Dark (`📊` Laporan)
   - Aktivitas Terbaru:
     - Belanja barang: `Indomie 5 dus, SGM 2 dus` (08:45, Rp 192.000)
     - Biaya toko: `Listrik` (07:20, Rp 150.000)
     - Setoran karyawan: `Toko Nur` (Kemarin, Rp 1.250.000)
   - Navigasi Bawah (5 item): Beranda, Catat, Stok, Setoran, Lainnya.

2. **Layar 2 — Catat Belanja (Mobile)**
   - Tombol kembali `←` (44×44px) dan judul `Catat Belanja`.
   - Stepper indikator 4 langkah: `(1)` oranye aktif, `2`, `3`, `4`.
   - Subjudul `Pilih barang`.
   - Kotak pencarian `Cari barang...` dengan tombol filter.
   - Chip kategori: `Semua` (aktif oranye), `Makanan`, `Minuman`, `Rokok`, `Lainnya`.
   - Kartu barang: Indomie Goreng, Mie Sedap, Aqua 600ml dengan thumbnail, spesifikasi dus/isi, harga kemasan, dan tombol bulat `+` (44×44px).
   - Kartu `Jumlah & satuan`: input jumlah (`2`) dan pilihan satuan `Dus (40 pcs)`.
   - Kotak `Ringkasan pembelian`: Total barang (80 pcs) Rp 192.000, Total belanja Rp 192.000.
   - Tombol utama: `Lanjut ke pratinjau →` (oranye, full-width).

3. **Layar 3 — Cek Sisa Stok (Mobile)**
   - Header kembali dan judul `Cek Sisa Stok`.
   - Kotak pencarian `Cari barang atau kategori...` dan filter chip.
   - Kartu pengecekan stok dengan mini-stepper (`−`, input, `+`):
     - Indomie Goreng: Dus (40 pcs) | Tag hijau `Lengkap` | `12`
     - Aqua 600ml: Dus (24 botol) | Tag hijau `Lengkap` | `5`
     - Telur Ayam Negeri: Kg | Tag kuning `Perlu dicek` | `0`
     - Gula Pasir: Kg | Tag abu-abu `Belum diisi` | `—`
     - ChocoPie: Pcs | Tag abu-abu `Belum diisi` | `—`
     - Rokok Sampoerna: Slop (10 bks) | Tag hijau `Lengkap` | `3`
   - Floating Bottom Bar: `Total item diperiksa: 4 / 6` dan tombol `Simpan`.

4. **Layar 4 — Setoran Karyawan (Mobile)**
   - Header kembali dan judul `Setoran Karyawan`.
   - Baris tanggal: `Rabu, 28 Okt 2025` dengan ikon kalender dan chevron `>`.
   - Peringatan kuning: `Periksa kembali jumlah setoran dengan perhitungan toko.`.
   - 3 Kartu Interaktif:
     - Dokumen: `Uang yang seharusnya diserahkan (berdasarkan penjualan hari ini)` → `Rp 1.250.000`
     - Dompet: `Uang yang diterima (dari karyawan)` → `Rp 1.200.000` (dapat diubah)
     - Peringatan Merah: `Selisih (perlu diperiksa)` → `Kurang Rp 50.000 >`
   - Keterangan (opsional): textarea catatan setoran.
   - Tombol utama: `Simpan setoran` (mode pratinjau).

---

## 3. Hasil Audit Multi-Viewport (Playwright)

| Viewport | Lebar | scrollWidth | Overflow? | Touch Target < 44px | Console Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Compact Mobile | 320 px | 320 px | **TIDAK** (0 px) | **0 item** | 0 |
| Android Baseline | 360 px | 360 px | **TIDAK** (0 px) | **0 item** | 0 |
| iPhone Standard | 390 px | 390 px | **TIDAK** (0 px) | **0 item** | 0 |
| Large Phone | 430 px | 430 px | **TIDAK** (0 px) | **0 item** | 0 |
| Tablet / Desktop | 768 px | 768 px | **TIDAK** (0 px) | **0 item** | 0 |
| Small Desktop | 1024 px | 1024 px | **TIDAK** (0 px) | **0 item** | 0 |
| Wide Desktop | 1440 px | 1440 px | **TIDAK** (0 px) | **0 item** | 0 |

---

## 4. Berkas Tangkapan Layar Tersimpan

- `docs/redesign/screenshots/mockup-screen-1-beranda.png`
- `docs/redesign/screenshots/mockup-screen-2-catat.png`
- `docs/redesign/screenshots/mockup-screen-3-stok.png`
- `docs/redesign/screenshots/mockup-screen-4-setoran.png`
- `docs/redesign/screenshots/viewport-320.png`
- `docs/redesign/screenshots/viewport-390.png`
- `docs/redesign/screenshots/viewport-768.png`
- `docs/redesign/screenshots/viewport-1440.png`
