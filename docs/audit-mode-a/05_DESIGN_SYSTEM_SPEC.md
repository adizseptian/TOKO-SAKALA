# 05 — UNIFIED DESIGN SYSTEM SPEC · TOKO MODE (MODE A)

**Tanggal:** 13 November 2026  
**Acuan Terkunci:** `DESIGN.md` (v2.0.0) & `docs/redesign/G4_VISUAL_SYSTEM_v2.1.md` (Owner Review #6 & #8 — **tanpa mengubah palet G4, tanpa glassmorphism, tanpa glow, tanpa pulse dekoratif, tanpa bundling font wajib**).

---

## 1. Arsitektur Token 3-Lapis & Kepatuhan WCAG 2.2 AA

### A. Primitive & Semantic Color Tokens (Mode Terang & Mode Gelap)

| Token CSS | Mode Terang (`:root`) | Mode Gelap (`[data-theme="dark"]`) | Peran Semantik | Status Kontras AA |
|---|---|---|---|---|
| `--paper` | `#FFFDF6` | `#1C1D1B` | Permukaan kartu, modal & input | Base |
| `--canvas` | `#F4F0E7` | `#121311` | Latar belakang halaman | Base |
| `--ink` | `#20211F` | `#FFFDF6` | Teks utama, outline `1.5px`, shadow tegas | `15.89:1` (terang on paper), `16.63:1` (gelap on paper) — **PASS** |
| `--muted` | `#686A65` | `#9FA29C` | Teks pendukung / metadata | `5.38:1` on paper, `4.81:1` on canvas (terang); `6.55:1` (gelap) — **PASS** |
| `--line` | `#DEDBD2` | `#373A34` | Pemisah tipis (`1px`), bukan pembatas interaktif tunggal | Non-text separator |
| `--orange` | `#FF5A1F` | `#FF6B34` *(atau `#FF5A1F`)* | Aksen merek, attention banner, CTA primer | **PERHATIAN `NOD-02`:** Putih `#FFFFFF` di atas `#FF5A1F` = **`3.12:1`** (**FAIL** teks normal `<18.67px` bold). `#20211F` di atas `#FF5A1F` = **`5.19:1`** (**PASS**). |
| `--orange-accessible-fill` *(Usulan Token Komponen CTA Putih)* | `#B8370B` *(atau `#C93D0B` jika besar)* | `#B8370B` | Alternatif jika Owner tetap memilih teks putih `#FFFFFF` pada tombol oranye (`5.85:1`) | **`5.85:1` PASS AA** *(Menunggu keputusan Owner `NOD-02`)* |
| `--lime` | `#D7FA4A` | `#D7FA4A` | Active tab bottom nav, highlight prioritas (`ink` teks wajib `#20211F`) | `#20211F` on `#D7FA4A` = **`13.60:1` PASS** |
| `--blue` | `#2958E8` | **USULAN:** `#7CA0FF` *(teks di dark)* / `#254EDB` *(bg tombol teks putih)* | Aksi sekunder, link, focus ring `3px` | Terang: `#2958E8` on `#E8EDFF` = `4.92:1` **PASS**. Gelap saat ini (`#4872F0` on `#1C2642`) = **`3.52:1` FAIL** & `#FFF` on `#4872F0` = **`4.25:1` FAIL** -> Wajib disesuaikan di Mode B. |
| `--blue-pale` | `#E8EDFF` | `#1C2642` | Permukaan informasi netral | — |
| `--green` / `--green-pale` | `#177245` / `#E4F5E9` | `#4ADE80` / `#15321F` | Sukses / cocok *(selalu disertai teks & ikon)* | Terang: `5.25:1` **PASS**; Gelap: **`9.15:1` PASS** |
| `--amber` / `--amber-pale` | `#98500D` / `#FFF0DA` | `#FBB724` / `#362912` | Peringatan / perlu diperiksa *(selalu disertai teks & ikon)* | Terang: `5.37:1` **PASS**; Gelap: **`8.59:1` PASS** |
| `--red` / `--red-pale` | `#B52821` / `#FFE7E3` | `#F87171` / `#3B1717` | Error / kurang / pembatalan *(selalu disertai teks & ikon)* | Terang: `5.41:1` **PASS**; Gelap: **`5.55:1` PASS** |

**Larangan Keras Token (G4 v2.1):**
- **Nol** hex warna langsung di `.tsx` (hapus seluruh `43` hex unik inline seperti `#dc2626`, `#ef4444`, `#059669`, `#15803d`, `#2563eb`).
- **Nol** `backdrop-filter: blur(...)` (hapus 11 aturan blur CSS, termasuk `.floating-dock` & `showDamageModal`).
- **Nol** shadow glow (`0 4px 14px rgba(255, 90, 31, 0.35)` dilarang).
- **Nol** animasi dekoratif berulang (`.live-pulse-beacon` dihapus/dibuat statis).

---

## 2. Tipografi & Aturan Skala (`Owner #8` + `DESIGN.md`)

- **Font Stack:** `Inter, "Plus Jakarta Sans", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` (fallback sistem lokal; **tidak** memuat font remote wajib, **tidak** membundel file `.woff2` sebelum kebutuhan & lisensi disetujui).
- **Angka Uang & Kuantitas:** Wajib `font-variant-numeric: tabular-nums;` (`font-feature-settings: "tnum" 1;`).
- **Skala & Lantai Minimum Keterbacaan:**
  - `--type-display`: `30–36px` / `1.03` / `900` (`-0.025em` tracking) — angka/judul hero tunggal.
  - `--type-hero-value`: `32–40px` / `1.05` / `900` (`tabular-nums`).
  - `--type-title`: `18–20px` / `1.15` / `850` — judul bagian / top bar.
  - `--type-body`: `14–16px` / `1.45` / `500` — isi paragraf & daftar.
  - `--type-control`: `14–16px` / `1.3` / `700` — isi input & label tombol utama.
  - `--type-label`: `12px` / `1.3` / `800` — **lantai minimal** label penting, badge status, dan keterangan formula.
  - `--type-meta`: `11–12px` / `1.35` / `600` — hanya untuk metadata non-kritis sekunder; **hapus seluruh ukuran `8px–10px`** (total 229 deklarasi sub-12px saat ini wajib diaudit naik ke `>=12px`).

---

## 3. Geometri, Elevasi, Ikon & Gerak

- **Spasi (px):** `4, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48`. Padding luar halaman mobile `16px`; jarak antar blok `12–16px`; jarak dalam list rapat `8–10px`; desktop padding `32–40px`.
- **Radius (px):** `8` (tag/chip), `10–12` (tombol/input), `14` (kartu list/form panel), `22` (hero utama tunggal). Konsisten, jangan mencampur banyak radius acak.
- **Border & Elevation:** Border `1.5px solid var(--ink)` pada kartu interaktif utama, tombol primer/sekunder, dan modal; `1px solid var(--line)` untuk pemisah internal. Shadow taktil hanya `0 2px 0 var(--ink)` pada tombol primer & kartu ringkas kunci.
- **Ikonografi:** **100% Lucide React (`lucide-react`)** berukuran `16px–22px` (`strokeWidth: 2`–`2.25`). Ganti karakter Unicode pada desktop rail (`App.tsx:1859–1915`) dan ganti seluruh grid emoji katalog produk (`6519`) dengan ikon Lucide berlabel teks.
- **Gerak (Motion):** Durasi transisi `120–180ms cubic-bezier(0.2, 0.8, 0.2, 1)`; efek tekan tombol `translateY(2px)` menghapus offset shadow; **wajib** `@media (prefers-reduced-motion: reduce)` menonaktifkan semua transisi/animasi.

---

## 4. Breakpoint Responsif (7 Titik Uji)

| Rentang Lebar | Titik Uji Target | Tata Letak Navigasi | Struktur Konten & Form |
|---|---|---|---|
| `320–430 px` | `320, 360, 390, 430` | Solid 5-tab Bottom Bar (`fixed`, `height >= 64px + safe-area-inset-bottom`). Tidak ada horizontal scroll body. | Single column penuh. Baris Qty + Unit hanya sejajar jika masing-masing `>= 120px` (atau tumpuk vertikal di `320 px`). |
| `760–1099 px` | `768, 1024` | Left Rail persisten (`220–240px`), Bottom Bar **disembunyikan** (tidak dobel). | Form + Pratinjau boleh berdampingan 2 kolom dengan urutan field identik; kartu stok 2 kolom. |
| `>= 1100 px` | `1440` | Left Rail (`246px`) + area kerja max-width terbatasi (`max-width: 960px`) agar angka Rupiah tidak terentang terlalu jauh dari labelnya. | Laporan & Stok 2 kolom rapi; ringkasan berjajar bersih. |

---

## 5. Spesifikasi Katalog Komponen (26 Komponen Inti)

| # | Komponen | Anatomi, Varian & Token | Aturan State & Aksesibilitas | Dipakai di Layar |
|---|---|---|---|---|
| 1 | **G4 Solid Bottom Nav** | Bar solid `--paper` (atau `--ink` tegas solid tanpa transparansi/blur) border-top `1.5px solid var(--ink)`, 5 tab (`Beranda`, `Catat`, `Stok`, `Setoran`, `Lainnya`). Tab aktif memakai pill/plat `--lime` (`#D7FA4A`) dengan teks & ikon `--ink` (`#20211F`). | Minimum target `>= 48×48 px` per item; `aria-current="page"`; padding bawah `env(safe-area-inset-bottom)`. | Shell Mobile (`<760px`) |
| 2 | **Desktop Left Rail** | Lebar `220–246px`, background `--paper`, border-right `1.5px solid var(--ink)`, item ikon Lucide + teks (termasuk akses cepat ke seluruh alat), footer status sync jujur. | Item aktif `--lime` + border `1.5px solid var(--ink)`; focus-visible ring `3px --blue`. | Shell Desktop (`>=760px`) |
| 3 | **Top Header Beranda** | Logo TS + `TOKO SAKALA`, badge status sync statis (tanpa pulse), aksi Profil/Pengaturan (`>=44×44`). | Tidak ada teks `<12px`; bell dummy diputuskan di `NOD-04`. | Beranda |
| 4 | **Sub-Screen Top Bar** | `<button>` Kembali (`ArrowLeft`, `44×44`), `<h1>` 18px, dan 1 CTA opsional kanan (mis. `Catat Rusak` / `Tambah Produk`). | `aria-label` jelas; navigasi kembali ke `lainnya` untuk alat sekunder. | Semua sub-layar (kecuali `asisten` yg dihapus) |
| 5 | **Main Attention Hero Card** | Maksimal **1 blok warna jenuh (`--orange`)** per layar HP, radius `22px`, border `1.5px solid var(--ink)`, 1 status jelas, 1 angka/aksi prioritas, 1 CTA tombol. | **Bukan** `<div role="button">` -> pisah header info dengan `<button>` CTA asli. | Beranda |
| 6 | **Quick-Action Grid (2×2 / 4-col)** | 4 tile akses cepat (`Catat Belanja`, `Cek Sisa Stok`, `Setoran`, `Biaya`). Pada `320px`, gunakan `2×2` agar tiap tile `>130px` lebar; di `>=390px` boleh 4 kolom jika tiap tile `>=64px`. | `<button type="button">` utuh; label 2 baris maks tanpa memotong kata. | Beranda |
| 7 | **Money Stat Card (Hari Ini vs Periode vs Posisi)** | Kartu `--paper`, border `1.5px solid var(--ink)`, radius `14px`. Baris atas: label metrik + badge cakupan waktu (`Hari Ini` / `Periode ...` / `Posisi Saat Ini`). Angka `tabular-nums`. | Warna hijau/merah tidak pernah digunakan untuk angka kas/omzet tanpa definisi laba yang sah (`DR-016`). | Beranda, Laporan |
| 8 | **9-Step P&L Waterfall Card** | Daftar terstruktur 9 komponen PRD/DR-016: `Penjualan Kotor` -> `(-) Diskon` -> `Penjualan Bersih` -> `(-) Modal Terjual` -> `Untung Kotor` -> `(+) Pendapatan Lain` -> `(-) Rugi Rusak/Dipakai/Selisih` -> `(-) Biaya` -> `Untung Bersih Toko`. | Tiap baris adalah `<button type="button">` native membuka `ModalForm` penjelasan bertingkat & daftar item; baris posisi (`Kas Laci`, `Nilai Jual Sisa Stok`) dipisah di kartu tersendiri. | Laporan |
| 9 | **Primary & Secondary Button** | Primer: `--orange` (atau `#B8370B` per `NOD-02`), border `1.5px solid var(--ink)`, `0 2px 0 var(--ink)`, radius `12px`, `min-height: 46px`. Sekunder: `--paper`, border `1.5px solid var(--ink)`. Danger: `--red-pale` + `--red` + border `--red`. | State: hover, active (`translateY(2px)`), `:focus-visible` (`outline: 3px solid var(--blue)`), `disabled` (opacity & alasan jelas). **Tanpa glow.** | Global |
| 10 | **Numeric Currency Input (`Rp`)** | Label eksplisit di atas input, box `--paper` border `1.5px solid var(--ink)`, prefix `Rp` permanen, `inputMode="numeric"`, `min-height: 46px`. | Membedakan kosong (`""` = Belum diisi) dari `"0"`. Error inline tepat di bawah field. | Catat, Biaya, Setoran, Modal |
| 11 | **Segmented Control** | Bar `--canvas` border `1.5px solid var(--ink)`, item aktif `--lime` + teks `--ink` + border/tegas. | Mendukung opsi eksplisit `"Belum tahu"` pada Sumber Uang; min-height `44px`. | Catat, Biaya, Laporan, Stok |
| 12 | **Category Horizontal Chips** | Chip `min-height: 44px` (`padding: 0 14px`), radius `8px`, horizontal scroll kontainer mandiri (`overflow-x: auto`) tanpa memicu overflow body. | Aktif `--lime` + `--ink`; tidak aktif `--paper` + `--line`. | Catat, Stok, Riwayat |
| 13 | **Stock Item Card + Unit-Safe Stepper** | Nama produk + kategori + satuan asli (`prod.unit`), nilai saat ini (`—` untuk kosong, `0` hanya jika dikonfirmasi), tombol `-` (`44×44`), input angka (`min-width: 56px, min-height: 44px`), tombol `+` (`44×44`), tombol `0` (Habis). | `-` disabled saat `0` atau kosong; `+` pertama dari kosong menaikkan ke `1` dengan indikator status `"Pratinjau — belum disimpan"`. **Tidak pernah mencampur unit berbeda.** | Stok |
| 14 | **Banknote Counter Stepper (`Setoran`)** | Daftar pecahan Rp 100.000 s.d. Rp 1.000 dengan strip warna uang + label nominal + subtotal lembar. Tombol `-` dan `+` diperbesar menjadi **`44×44 px`** (menggantikan `32×34 px` saat ini). | Sinkron dua arah dengan input `#dep-received-amount`; tombol `Reset` dengan konfirmasi jelas. | Setoran |
| 15 | **Setoran Comparison Card** | 3 baris terpisah: (1) `Uang Perlu Diserahkan` (target periode/buku + formula info), (2) `Uang Diterima Pemilik` (input fisik), (3) `Selisih` (ikon + label `Cocok`/`Kurang`/`Lebih`/`Menunggu hitung` + nominal). | Warna + Ikon + Teks wajib hadir bersamaan (tidak color-only); selisih non-nol tetap bisa disimpan dengan catatan, tanpa menimpa data penjualan. | Setoran |
| 16 | **Purchase Preview & Cart Sticky Bar** | Panel pratinjau langsung bertuliskan badge `"Pratinjau — belum disimpan"`, menampilkan total beli & harga rata-rata per unit. Sticky bar mengambang di atas Solid Bottom Nav dengan jarak aman `calc(var(--dock-height) + 12px)`. | Kiri membuka `CartSheet` via `<button type="button">` asli (bukan `<div role="button">`); kanan CTA `Simpan semua`. | Catat Belanja |
| 17 | **Unified `ModalForm` & Bottom Sheet** | Menggunakan satu wrapper `ModalForm` yang ditingkatkan (`focus-trap`, `Escape`, return-focus ke elemen pemicu, `aria-modal="true"`, header dengan tombol tutup `44×44`). Di mobile `<=640px` dapat merender sebagai bottom sheet; di desktop sebagai modal tengah `max-width: 440px`. | Menggantikan seluruh 18 modal inline `App.tsx`; tidak ada blur backdrop. | Semua 18 Modal / Sheet |
| 18 | **Append-Only History Row & Void Badge** | Baris riwayat dengan `<button>` asli; badge status `Aktif`, `Dibatalkan (Void)`, `Koreksi`, atau `Periode Tertutup` (ikon gembok). | Menghapus tombol hard-delete; menyediakan alur `Batalkan Catatan (Void)` tercatat untuk periode terbuka & penolakan eksplisit di periode tertutup. | Riwayat, Beranda |
| 19 | **Honest Sync & Offline Banner** | Komponen tunggal membaca `getPendingMutations().length`, `isOnline`, dan konfirmasi `serverConfirmedVersion`. Status: `Tersimpan lokal (offline)`, `N menunggu sinkron`, `Gagal sinkron (+ Coba lagi)`, `Terkonfirmasi server vX`. | Dilarang menampilkan `Tersinkron` saat `pendingCount > 0` atau belum ada ACK server untuk `dataVersion` aktif. | Shell Header, Rail, Pengaturan |
| 20 | **Sample Sandbox Banner** | Strip peringatan kuning (`--amber-pale`, `--ink`) yang selalu muncul di atas shell bila mode contoh aktif, dilengkapi tombol keluar sandbox / hapus contoh tanpa menyentuh cloud produksi. | Mencegah tercampurnya data uji ke toko nyata. | Global saat `isSampleActive` |
| 21 | **Empty / Unknown / Error State Cards** | Kartu kertas border `1.5px dashed var(--line)` (atau `--red` untuk error), ikon Lucide `32px`, 1 kalimat kondisi nyata (*"Belum ada catatan..."* / *"Modal belum diketahui"*), 1 tombol langkah lanjut. | Tidak pernah mengisi angka `0` saat data kosong/unknown. | Semua Layar |
| 22 | **Inline Validation Message** | Teks `12px` `--red` + ikon `AlertCircle` tepat di bawah field terkait. | Tetap mempertahankan nilai input sah di field lain (`DESIGN.md:119`). | Semua Form |
| 23 | **Explanation Tree / Why Modal** | Panel penjelas rumus bertingkat (rumus sederhana di atas, detail teknis di expand/sub-rows) memakai `ModalForm`. | Mengikuti bahasa pemula di tingkat atas & rincian angka di bawah (`Owner #1`). | Beranda, Laporan, Setoran |
| 24 | **Period Selector & Anchor Control** | Segmented `Hari / Minggu / Bulan / Tahun` + tombol tanggal acuan `>=44px` tinggi. | Terikat penuh ke query/agregasi `Laporan` (`Owner #2`). | Laporan, Beranda |
| 25 | **Toast Notification Banner** | Muncul di atas bottom nav (tidak menutupi input/nav), menampilkan keterangan jujur (`"Tersimpan di perangkat (lokal)"` vs `"Terkirim ke server"` vs `"Gagal: ..."`). | Role `status` (`aria-live="polite"`); tombol tutup `>= 44px` atau auto-hide non-kritis. | Global |
| 26 | **Product Icon Plate (Non-Emoji)** | Plat kotak `40×40 px` sudut `10px`, border `1.5px solid var(--ink)`, latar kategori semantik netral + 1 ikon Lucide (`Package`, `Coffee`, `Droplets`, `Utensils`, dll.). | Menggantikan grid emoji `6519`. | Katalog, Catat, Stok |
