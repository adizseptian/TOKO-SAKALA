# 03 — SCREEN-BY-SCREEN AUDIT (MODE A — TOKO SAKALA)

**Tanggal Audit:** 13 November 2026  
**Metode & Kejujuran Pengukuran:** Audit dilakukan langsung terhadap source code (`src/App.tsx`, `src/styles.css`, `src/engine/v1/*`, `src/storage/*`) serta perhitungan matematis kontras WCAG 2.2. Karena `chromium` / `google-chrome` **tidak terpasang di kontainer**, Playwright visual sweep di `320, 360, 390, 430, 768, 1024, 1440 px` berstatus **`NOT RUN`**. Semua posisi/dimensi piksel yang membutuhkan DOM render nyata ditandai **`perlu diukur dari render`**.

---

## Ringkasan Audit Lintas 14 Area Evaluasi (Framework Audit TOKO SAKALA §5)

| Layar | Skor Risiko | Temuan Kritis Terverifikasi | Hal yang Wajib Diukur di Browser (`NOT RUN`) |
|---|---|---|---|
| **Shell Global (Rail, Header, Dock)** | **HIGH** | `.floating-dock` melanggar G4 (blur + glow); `.live-pulse-beacon` melanggar G4 + menampilkan `"Tersinkron"` padahal `pendingCount` hardcoded `0` (`syncEngine.ts:84`); tombol lonceng dummy (`1997`, **`NOD-04: CONDITIONAL`**); dead route `'asisten'` (`50, 2046`). | Tinggi aktual mobile dock + safe-area overlap di `320–430 px`; wrapping header di `320 px` + zoom 200%. |
| **Beranda** | **HIGH** | Tidak memisahkan angka **Hari Ini vs Periode Terpilih vs Saldo Kumulatif** (Owner #2); 4 `<div role="button">` tanpa `onKeyDown`; teks `9px` di header (`1970`); `deleteAction` mengizinkan hard delete. | First-fold density di `320×568` & `360×640`; wrapping angka Rupiah miliaran. |
| **Catat Belanja** | **HIGH** | Tidak memakai `src/engine/v1/purchase-preview.ts`; inline `<div role="button">` di kartu produk (`2958`) & sticky cart bar (`8140`) tanpa `onKeyDown`; CTA `Simpan semua` kontras `#fff`/`#FF5A1F` hanya `3.12:1` (harus diverifikasi dengan foreground `#20211F` per `NOD-02`). | Tumpang tindih sticky cart bar + mobile dock + virtual keyboard Android saat mengetik total cost; kontras aktual tombol oranye. |
| **Cek Sisa Stok** | **MEDIUM-HIGH** | Tidak memakai `src/engine/v1/stock-check-preview.ts`; `LOSS_USED` tidak dipetakan ke `calculate.ts`; masih memakai `getProductLatestUnitCost` (`App.tsx:1056–1061`, menyimpang dari **`NOD-05: LOCKED — MOVING AVERAGE`**); modal `Catat Rusak` (`7352–7682`) hardcode `unit: 'pcs'`, badge palsu `NO. ADJ-8820`, blur, glow, dan hex `#dc2626`/`#ef4444`. | Layout 1-kolom vs 2-kolom pada `760–1440 px`; stepper tap area pada `320 px`. |
| **Setoran Karyawan** | **HIGH** | Stepper pecahan uang (`3955, 3972`) hanya `32×34 px` (<44px); tombol CTA (`4106`) memiliki glow oranye; `Target Buku` memakai kumulatif sepanjang masa (`storeSummary`) yang dapat membingungkan saat setoran bertahap; label tanggal tidak membatasi input tanggal masa depan. | Tinggi form saat drawer pecahan + catatan sama-sama berinteraksi di `320–430 px` + virtual keyboard menutup input `#dep-received-amount`. |
| **Biaya & Pemasukan** | **MEDIUM** | Modal `Pemasukan Lain` memakai default pre-filled (`'Jasa seduh mie'`, `'2000'`, `3`) yang berisiko tersimpan tanpa niat user; penghapusan hanya via hard delete di Riwayat. | Posisi keyboard terhadap form nominal dan segmented source selector. |
| **Laporan Keuangan** | **CRITICAL** | **`BL-03`:** Selector `Hari/Minggu/Bulan/Tahun` & anchor date sama sekali tidak memfilter kartu & baris Laporan (`storeSummary` dipakai langsung). **`BL-01` & `BL-02/NOD-05`:** Salah istilah *"Untung Kotor"* sebelum modal (`4523`), *"Untung Bersih"* tanpa memotong COGS/rugi stok (`4334`), serta `COGS` memakai `Latest Unit Cost` + peleburan `unknownUnits` (`calculate.ts:141–143`) yang menyimpang dari **`NOD-05: LOCKED — MOVING AVERAGE`**. 2 hero card `<div role="button">` tanpa `onKeyDown`. | Keterbacaan baris label + nominal panjang (`Rp 1.250.000.000`) pada lebar `320 px`; media `@media print`. |
| **Riwayat Catatan** | **CRITICAL** | **`DI-02` (`NOD-03` & `NOD-03B`):** Menyediakan hapus permanen (`handleDeleteRecord`) tanpa `VOID` (hanya untuk event finansial cancellable) dan tanpa kunci periode tertutup (`period_close`). *Early Close* resmi ditunda/dikeluarkan dari rilis awal (`NOD-03B`). `<div role="button">` tanpa `onKeyDown` (`5033`). | Scroll performa saat >200 record; layout badge status. |
| **Katalog Produk (`barang`)** | **MEDIUM** | Modal tambah produk memakai emoji sebagai ikon produk (`6519`); edit harga jual dari cek modal menimpa objek alih-alih event effective-dated. | Grid/list spacing pada `320 px` & `1024 px`. |
| **Semua Alat (`lainnya`)** | **LOW-MEDIUM** | Konsistensi dengan desktop rail yang menaruh `biaya/laporan/riwayat` di rail tetapi menyembunyikan `barang/pengaturan` hanya di `lainnya` (plus avatar `AR`). | Kepadatan kartu menu di `320 px`. |
| **Pengaturan** | **CRITICAL** | **`SEC-01/03`:** Menampilkan SQL `001` & `002` dengan RLS terbuka `anon`; email/URL pribadi default; `handleLoadSampleData` mencampur data contoh ke payload nyata & memicu cloud sync; status `"Tersinkron"` mengabaikan `pendingCount` asli. | Modal SQL di layar `320 px` (scroll horizontal blok `<code>`). |

---

## Detail Audit Mendalam per Layar Utama

### 1. App Shell (Desktop Rail, Mobile Header, Dock, Sticky Bar)
- **Visual & Hierarchy (`G4 v2.1`):** Desktop rail (`App.tsx:1853–1955`) bersih dengan outline border, namun ikon masih karakter Unicode mentah (`⌂`, `＋`, `▦`), kontras dengan Lucide icons pada mobile. Mobile dock (`8178–8231`, `.floating-dock` di `styles.css:3038–3160`) menyalahi G4: kaca gelap blur + glow bayangan oranye. Status header `.live-pulse-beacon` (`1975`) beranimasi terus-menerus (melanggar aturan G4 *no pulsing badges*).
- **Copy & Kejujuran Status:** Header menampilkan `"Tersinkron"` (`1987`) dan Rail menampilkan `"Tersinkronisasi"` (`1944`) saat `supabaseAdapter.isConfigured()` benar dan `lastError === null` — padahal `syncEngine.getStatus()` (`syncEngine.ts:84`) mengembalikan `pendingCount: 0` statis. Ini berpotensi menipu pemilik toko seolah data sudah aman di cloud saat masih tertunda di perangkat.
- **Responsiveness & Safe Area:** *Perlu diukur dari render* pada `320, 360, 390, 430 px` apakah `main.main-content` memiliki `padding-bottom` cukup agar konten terbawah tidak tertutup `.dock-wrapper` + `sticky cart bar` + `env(safe-area-inset-bottom)`.

### 2. Beranda (`App.tsx:2155–2870`)
- **Fungsi & Model Data:** Hero section menampilkan satu status prioritas dan 4 quick tiles (`Catat`, `Stok`, `Setoran`, `Biaya`), selaras dengan `DESIGN.md:110–115`. Namun kartu metrik di bawahnya belum membedakan secara eksplisit label **Hari Ini**, **Periode Terpilih**, dan **Posisi Kas/Stok Saat Ini** (keputusan Owner #2).
- **Keyboard & Aksesibilitas:** Baris `2190` (hero card), `2350` (timeline strip), `2731` (kartu ringkasan), `2803` (daftar aktivitas) semuanya `<div role="button" tabIndex={0} onClick={...}>` **tanpa `onKeyDown`**. Subjudul header `PRO MERCHANT` memakai `9px` (`1970`).
- **Kriteria Penerimaan Mode B *(Usulan)*:** (1) Seluruh elemen klik dikonversi ke `<button type="button">` asli; (2) Setiap angka keuangan memiliki tag waktu eksplisit (`Hari ini` / `Periode ...` / `Posisi saat ini`); (3) Hapus pulse beacon & terapkan status bersyarat **`NOD-04`** pada bell notifikasi (pertahankan hanya jika didukung data nyata + aksi relevan, jika tidak keluarkan dari rilis awal).

### 3. Catat Belanja (`App.tsx:2871–3277`)
- **Fungsi & Alur:** Mendukung dua unit (`kemasan` vs `pcs`), pemilihan sumber uang (`Uang Toko`, `Uang Pribadi`, `Belum Tahu`), dan keranjang multi-barang (`purchaseCart`). **Celah:** Tidak mengimpor `src/engine/v1/purchase-preview.ts` yang sudah teruji; masih ada logika inline harga beli. Tombol `Tambah Produk` dapat diakses langsung namun modalnya memakai emoji (`6519`).
- **Aksesibilitas & Visual:** Kartu produk clickable (`2958`) dan area buka keranjang (`8140`) memakai `<div role="button">` tanpa `onKeyDown`. Tombol `Simpan semua` (`8167–8168`) memakai teks `#fff` di atas `#FF5A1F` (`3.12:1`, gagal AA teks normal; wajib dievaluasi ulang dengan `#20211F` per `NOD-02` saat browser QA berjalan).
- **Responsiveness:** *Perlu diukur dari render* apakah sticky cart bar (`bottom: calc(82px + env(safe-area-inset-bottom))`, lebar `maxWidth: 420px`) menutupi kartu produk terakhir atau keyboard input saat mengetik total rupiah di HP `320–360 px`.

### 4. Cek Sisa Stok (`App.tsx:3278–3704`) & Modal Barang Rusak (`7352–7682`)
- **Fungsi & Integritas Data:** Membedakan `''` (*belum diisi*) dengan `0` (*habis terkonfirmasi*). Namun:
  - Modal `Catat Rusak` (`7352–7682`) memaksa `unit: 'pcs'` (`1273, 7451`), sehingga jika produk bersatuan `kg` atau `liter` dicatat rusak, label dan data unitnya salah.
  - Engine bridge belum memetakan event `LOSS_USED` (`engineBridge.ts:198–218`) ke `calculate.ts`, dan UI/modal masih memanggil `getProductLatestUnitCost` (`App.tsx:1056–1061`, menyimpang dari **`NOD-05: LOCKED — MOVING AVERAGE`**).
  - `showPriceCheckModal` mengubah `sellingPricePerUnit` langsung di master produk, bukan event `PRICE_CHANGE` effective-dated.
- **Visual & Anti-Slop:** `showDamageModal` melanggar keras `G4`: menyisipkan nomor nota fiktif statis `NO. ADJ-8820` (`7404`), frosted blur (`7364`), shadow glow oranye (`7665`), warna hardcode `#dc2626`/`#ef4444`, serta micro typography `9–10px`.
- **Kriteria Penerimaan Mode B *(Usulan)*:** Integrasikan `src/engine/v1/stock-check-preview.ts`, hormati `prod.unit` asli di semua form stok/rusak/dipakai, gunakan **Moving Average** (known pool terpisah dari unknown pool per `NOD-05`), hapus `NO. ADJ-8820` & glow/blur, dan pastikan stepper >= `44×44 px`.

### 5. Setoran Karyawan (`App.tsx:3705–4116`)
- **Fungsi & Alur:** UX sudah rapi dengan *Single Master Settlement Slip*: pilih tanggal (`showDateModal`), perbandingan `Target Buku` vs input langsung `Hitung Fisik`, 3 utility deck (`Hitung Lembar` pecahan Rp 100k–1k, `Catatan` dengan quick-chips, `Ambil Prive`), dan kartu selisih (`Cocok` / `Kurang` / `Lebih` / `Menunggu hitung`). Menjaga aturan `isCashCounted` (`blank ≠ 0`).
- **Temuan Kritis:**
  1. Stepper `-`/`+` di sortir pecahan (`3955, 3972`) berukuran `32×34 px` (di bawah batas minimum `44×44 px` Android/Apple HIG — sangat rawan salah sentuh saat menghitung uang di kasir).
  2. Tombol CTA `Simpan Setoran` (`4106`) memakai shadow glow `0 4px 14px rgba(255, 90, 31, 0.35)` yang dilarang G4 (`0 2px 0 var(--ink)` saja).
  3. Status `Target Buku` memakai `storeSummary.expectedDeposit` kumulatif, tanpa kejelasan visual bila terdapat beberapa setoran dalam rentang waktu atau setoran periode terbuka vs tertutup.
  4. Input `#dep-received-amount` dan drawer `Pecahan Lembaran` berada dalam satu alur panjang; *perlu diukur dari render* apakah scroll & keyboard overlap (`onFocus scrollIntoView`) aman di `320×568` dan `360×640`.
- **Kriteria Penerimaan Mode B:** Perbesar stepper pecahan >= `44×44 px`, hapus orange glow, pisahkan selisih warna + ikon + label teks aksesibel (bukan `#dc2626`/`#059669` hardcoded), dan pastikan target buku jelas batas waktunya.

### 6. Biaya & Pemasukan (`App.tsx:4121–4285`) & Modal Terkait (`7118–7349`)
- **Fungsi & Alur:** Segmented toggle antara pengeluaran toko (`Dari Laci Kasir` vs `Uang Pribadi`) dan pemasukan lain.
- **Temuan:** `showOtherIncomeModal` diinisialisasi dengan nilai preset `'Jasa seduh mie'`, `'2000'`, qty `3` (`1246–1248`) — melanggar kejujuran data karena terlihat seperti data terisi sebelum user mengetik; seharusnya placeholder/kosong.

### 7. Laporan Keuangan (`App.tsx:4288–4958`)
- **Fungsi & Logika (`BL-01`, `BL-02/NOD-05` & `BL-03`):** **Layar dengan cacat logika paling berat:**
  1. Filter periode (`HARI`, `MINGGU`, `BULAN`, `TAHUN` + anchor date) tidak terhubung ke metrik yang dirender (`storeSummary` kumulatif tetap dipakai).
  2. Label `Untung Kotor` (`4523`) salah definisi (menampilkan `Penjualan − Diskon`, belum dipotong modal terjual).
  3. `Untung Bersih Toko` (`4334`) mengabaikan `COGS` & kerugian stok (`damage`, `used`, `unknown`).
  4. `COGS` dihitung menggunakan `Latest Unit Cost` + peleburan `unknownUnits` (`calculate.ts:141–143`), menyimpang dari **`NOD-05` (`LOCKED — MOVING AVERAGE`)** dan Rule 14.
  5. Mencampur arus aliran periode dengan saldo posisi (`Uang Kas di Tangan`, `Sisa Stok`) tanpa pemisahan label posisi terkini (melanggar Owner #2).
- **Aksesibilitas:** Hero cards (`4331, 4379`) menggunakan `<div role="button">` tanpa `onKeyDown`; badge hijau memakai `#15803d` hardcoded (`4352`).
- **Responsiveness:** *Perlu diukur dari render* pada `320 px` untuk angka nominal ratusan juta/miliaran di `.laporan-hero-deck` (2 kolom) dan `.laporan-row-btn`, serta output `@media print`.

### 8. Riwayat Catatan (`App.tsx:4961–5187`)
- **Fungsi & Integritas (`DI-02`, `NOD-03`, `NOD-03B`):** Klik item membuka `detailModal` dengan tombol hapus yang memanggil `handleDeleteRecord` (hapus keras dari array payload). Bertentangan total dengan `NOD-03` (strict append-only, pembatalan `VOID` hanya untuk event finansial cancellable dengan alasan + referensi asal, master/config/snapshot/sistem tidak otomatis bisa di-`VOID`, dan periode tutup immutable + koreksi tertaut). Penutupan awal (*Early Close*) dikeluarkan dari rilis awal (`NOD-03B`).
- **Aksesibilitas:** Baris daftar (`5033`) memakai `<div role="button">` tanpa `onKeyDown`.

### 9. Katalog (`barang`: `5277–5333`), Semua Alat (`lainnya`: `5190–5274`), & Pengaturan (`5334–5662`)
- **`barang`:** Ikon emoji produk hardcoded (`6519`); tanpa status arsip produk yang aman bila sudah punya histori transaksi.
- **`pengaturan`:** Menyimpan/menampilkan kredensial & URL pribadi (`dvznpniodskujfbdznnv.supabase.co`, `adizseptian@gmail.com`), tombol copy SQL `001`/`002` tidak aman, dan tombol `Muat data contoh` (`handleLoadSampleData`) menulis ke database utama + antrean sync cloud tanpa sandbox terisolasi.
- **`'asisten'`:** Route mati tanpa render body (`50, 2046`). Wajib dihapus di Mode B.
