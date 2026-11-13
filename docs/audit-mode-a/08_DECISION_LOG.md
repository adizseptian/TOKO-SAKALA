# 08 — DECISION LOG (MODE A — TOKO SAKALA)

**Pembaruan Terakhir:** 13 November 2026  
**Sumber Otoritatif:** `docs/DECISION_REGISTER.md` (DR-001..DR-016), `DESIGN.md`, `docs/redesign/G4_VISUAL_SYSTEM_v2.1.md`, `docs/specs/01_PRD.md`, dan **Keputusan Tertulis Owner Review Deliverable 6**.

---

## 1. LOCKED DECISIONS (Terkunci — Wajib Dipatuhi di Mode B)

| ID | Topik | Keputusan Terkunci | Referensi |
|---|---|---|---|
| **DL-01** | **Struktur Laba 9 Langkah & Istilah** | Gunakan 9 komponen berurutan: (1) Penjualan Kotor, (2) Diskon, (3) Penjualan Bersih (`Penjualan Kotor − Diskon`), (4) Modal Barang Terjual, (5) Untung Kotor (`Penjualan Bersih − Modal Terjual`), (6) Pendapatan Lain, (7) Kerugian Barang Rusak, Dipakai & Selisih Barang, (8) Biaya Operasional, (9) Untung Bersih Toko. Arus kas/setoran terpisah. Dilarang menyebut penjualan pasca-diskon sebelum modal sebagai *"Untung Kotor"*. | Owner Review #1, `01_PRD.md:88`, DR-016 |
| **DL-02** | **Bahasa & Penjelasan Bertingkat** | Bahasa antarmuka utama Indonesia sederhana untuk pemilik toko pemula. Istilah akuntansi teknis hanya muncul di modal/panel penjelasan perhitungan bertingkat. | Owner Review #1, `AGENTS.md` |
| **DL-03** | **Filter Periode `Laporan` & `Beranda`** | Seluruh metrik aliran di `Laporan` wajib mengikuti periode terpilih (`Hari/Minggu/Bulan/Tahun`). Saldo posisi saat ini (kas laci terkini, sisa stok terkini) diberi label eksplisit sebagai posisi saat ini & dipisah dari aliran periode. `Beranda` wajib membedakan hari ini, periode terpilih, dan saldo kumulatif. | Owner Review #2 |
| **DL-04** | **Status Persistensi & Isolasi Sample** | Mode resmi: Offline-First IndexedDB lokal aktif + jalur outbox/sync terpasang namun **cloud sync E2E belum terverifikasi**. Dilarang menampilkan `"Tersinkron"` tanpa konfirmasi server untuk `dataVersion` tersebut. `sampleData` wajib diisolasi total dan tidak boleh otomatis tersinkron ke cloud toko asli. | Owner Review #4 |
| **DL-05** | **Strict Append-Only & Kebijakan Hapus** | Tidak ada hapus permanen (`hard delete`). Koreksi pada periode terbuka wajib tercatat dan terhubung ke event asal (`VOID` / koreksi tertaut). Periode tertutup & snapshot bersifat immutable (koreksi lewat event baru yang tertaut). Perilaku Undo disesuaikan dengan semantik pembatalan tercatat. | Owner Review #5, DR Rule 10, `01_PRD.md` §9 |
| **DL-06** | **Bottom Navigation & Desain G4** | Pertahankan `DESIGN.md` & `G4_VISUAL_SYSTEM_v2.1.md`: Solid 5-tab bottom bar dengan active state lime (`#D7FA4A`). **Dilarang** glassmorphism (`backdrop-filter`), glow shadow dekoratif, dan animasi pulse dekoratif. | Owner Review #6 |
| **DL-07** | **Penghapusan Route `'asisten'` & AI OFF** | Hapus tipe `'asisten'`, judul header `App.tsx:2046`, serta seluruh referensi navigasi mati. AI tetap OFF default; tanpa integrasi LLM/jaringan AI. | Owner Review #7, `AGENTS.md` |
| **DL-08** | **Strategi Tipografi Tanpa Bundling Wajib** | Mengikuti `DESIGN.md` & G4 (`Inter`, `"Plus Jakarta Sans"`, fallback sistem). Tidak ada pemuatan font remote wajib dan tidak membundel font aset sebelum kebutuhan & lisensinya diverifikasi. `tabular-nums` wajib pada semua nilai uang/angka. | Owner Review #8, `G4_VISUAL_SYSTEM_v2.1.md` |
| **DL-09** | **12 Aturan Integritas Bisnis & Palet TOKO MODE** | Mobile-first `320–430 px`; palet `#FFFDF6` paper, `#20211F` ink, `#FF5A1F` orange, `#D7FA4A` lime, `#2958E8` cobalt; `blank ≠ 0 ≠ unknown ≠ preview ≠ confirmed`; unit fisik berlainan (`pcs`, `kg`, `liter`, `porsi`) tidak boleh dijumlahkan bersama; harga jual ≠ modal ≠ laba; 3 dunia keuangan (Penjualan, Uang Diterima, Kas Tersedia/Setoran) terpisah. | `AGENTS.md`, `DECISION_REGISTER.md` (DR-007..015) |

---

## 2. RECOMMENDED DECISIONS (Rekomendasi Audit Mode A untuk Disetujui Sebelum Mode B)

| ID | Topik | Rekomendasi Teknis | Dampak Jika Diterima |
|---|---|---|---|
| **REC-01** | **Konsolidasi Engine Tunggal** | Jadikan `calculate.ts` (diperluas mendukung `discountTotal` & `LOSS_USED`) sebagai sumber tunggal baik untuk ringkasan kumulatif, ringkasan periode (`calculatePeriodSummary`), `Laporan`, dan `Setoran`; hapus rumus duplikat di `engineBridge.ts`. | Menghilangkan drift 3 versi perhitungan & menyatukan angka lintas `Beranda`, `Setoran`, dan `Laporan`. |
| **REC-02** | **Pemecahan Monolith `App.tsx` (8.235 Baris)** | Ekstrak layar ke `src/screens/*`, sheet/modal ke komponen berbasis `ModalForm` (dengan focus trap + Escape + return focus), dan hook data/sync ke `src/hooks/*`. | Menghentikan kebocoran inline style (`754` objek), mempermudah uji regresi, dan mengaktifkan kembali modul teruji (`stock-check-preview.ts`, `purchase-preview.ts`). |
| **REC-03** | **Penggunaan Modul Preview Teruji** | Integrasikan `src/domain/stock-check-preview.ts` dan `src/domain/purchase-preview.ts` ke UI `Stok` & `Catat Belanja`. | Mengurangi ketergantungan state form mentah & menjamin kepastian preview sebelum simpan. |
| **REC-04** | **Pembersihan Ornamen & Copy Menipu** | Hapus nomor nota fiktif statis `NO. ADJ-8820` (`App.tsx:7404`), hapus ikon emoji pada katalog (`6519`, ganti Lucide icon), ganti teks toast tombol lonceng dummy atau jadikan tombol non-dummy (daftar status sync/peringatan stok nyata). | Menghapus elemen UI palsu / anti-slop. |
| **REC-05** | **Standar Target Sentuh & Keterbacaan** | Naikkan semua stepper pecahan & chip penting ke `>= 44×44 px` tap target, tambah `onKeyDown` pada 10 `<div role="button">` (atau konversi ke `<button>`), dan tingkatkan ukuran teks sub-12px paling kritis ke minimal `12px`. | Memenuhi standar aksesibilitas sentuh & keyboard WCAG 2.2 AA. |

---

## 3. NEEDS OWNER DECISION (Memerlukan Keputusan / Tindakan Owner Sebelum Fase Terkait di Mode B)

| ID | Pertanyaan Terbuka | Konteks & Pilihan yang Perlu Diputuskan Owner | Memblokir Fase |
|---|---|---|---|
| **NOD-01** | **Penyediaan Dokumen `TRD v2` / `TRD v2.1`** | Owner menetapkan `TRD v2` sebagai acuan arsitektur cloud (Cloudflare Workers Static Assets + Supabase Free + 1 Owner Auth + RLS + Edge Function + RPC), namun file `TRD v2` & kode `supabase/functions/` **tidak ada di workspace**. **Keputusan yang dibutuhkan:** (1) Unggah/sediakan `TRD v2` ke workspace, atau (2) konfirmasi kontrak Edge Function & skema target (`toko_documents` terkunci vs 24 tabel `20261022000100_initial_schema.sql` yang diperluas). | **Mode B Fase 0 & Integrasi Cloud** *(Catatan: Refactor UI, Engine P&L 9 langkah, Filter `Laporan`, & IndexedDB lokal tetap bisa dikerjakan paralel bila Owner mengizinkan pemisahan jadwal).* |
| **NOD-02** | **Solusi Kontras WCAG AA pada Tombol/Badge Oranye Primer (`#FF5A1F`)** | Secara matematis `#FFFFFF` di atas `#FF5A1F` hanya **`3.12:1`** (mode gelap `#FF6B34` hanya **`2.84:1`**), **gagal** syarat minimum AA `4.5:1` teks normal. Sebaliknya, teks `#20211F` (`--ink`) di atas `#FF5A1F` menghasilkan **`5.19:1` (PASS AA)**, dan teks `#FFFFFF` di atas `#B8370B` (`--orange-accessible-fill`) menghasilkan **`5.85:1` (PASS AA)** namun menggelapkan warna oranye khas tombol primer. **Pilihan untuk Owner:** **(a)** Gunakan teks gelap `#20211F` di atas `#FF5A1F` untuk tombol/badge oranye, atau **(b)** gunakan warna fill oranye lebih gelap (`#B8370B` / `#C93D0B`) khusus untuk background teks putih, atau **(c)** batasi `#FFFFFF` on `#FF5A1F` hanya untuk komponen teks besar (`>= 18.67px bold` yang syarat AA-nya `3.0:1`)? *(Catatan serupa berlaku pada dark mode cobalt `#4872F0`: usulkan penyesuaian ke `#6C8FF5` di atas dark surface / `#254EDB` untuk teks putih `6.37:1`).* | **Mode B Fase 3 (Design Tokens & Komponen Tombol)** |
| **NOD-03** | **Aturan Batas Pembatalan (`VOID`) & Tutup Periode Awal (*Early Close*)** | Untuk transaksi pada **periode terbuka**, apakah Owner mengizinkan pengembalian status/VOID pada setiap jenis event (pembelian, cek stok, biaya, pemasukan, setoran, rusak)? Dan untuk fitur **tutup periode awal (*early close*)**, apakah periode berikutnya otomatis dimulai dari timestamp penutupan tersebut (`gapless`)? | **Mode B Fase 1 (Append-Only Void & Period Close)** |
| **NOD-04** | **Keberadaan Tombol Lonceng Notifikasi di Header** | Saat ini tombol lonceng (`App.tsx:1993–2000`) hanya menampilkan toast `"Tidak ada notifikasi baru hari ini."` **Pilihan:** **(a)** Ubah menjadi panel ringkasan peringatan nyata lokal (stok perlu cek / error sync / selisih), atau **(b)** Hapus tombol lonceng agar header lebih bersih sesuai prinsip minim klik? | **Mode B Fase 3 (Header Beranda)** |

---

## 4. BLOCKER REGISTER (Penghambat Rilis / Produksi)

| Blocker ID | Kategori | Deskripsi Singkat | Kondisi Penutup (*Exit Criteria*) |
|---|---|---|---|
| **SEC-01** | Security | RLS `USING (true)` untuk `anon` pada `migrations/001` & `002` | Policy `anon` dicabut; RLS terikat ke user pemilik tunggal terautentikasi & diverifikasi dengan negative test non-owner/anon di cloud. |
| **SEC-02** | Security | Client Auth terpisah dari Storage Adapter & penulisan langsung client tanpa Edge Function/RPC | Single auth session + jalur Edge Function/RPC (sesuai TRD v2) + tanpa kredensial hardcoded pribadi di source. |
| **AR-04** | Spec Gap | Dokumen `TRD v2` tidak ditemukan di workspace | `TRD v2` diunggah / dikontrakkan tertulis oleh Owner. |
| **BL-01** | Logic | Rumus P&L 9 langkah PRD/DR-016 tidak cocok dengan `engineBridge.ts` & `calculate.ts` | 100% golden test kasus P&L 9 langkah lulus, tidak ada istilah "Untung Kotor" sebelum modal, `LOSS_USED` & `discount` terhitung utuh. |
| **BL-03** | Logic | Filter periode `Laporan` tidak memfilter data tampilan | Pemilihan `Hari/Minggu/Bulan/Tahun` & tanggal acuan mengubah seluruh metrik aliran secara akurat dan memisahkan metrik posisi. |
| **QA-01** | Verification | Chromium tidak tersedia di environment; audit viewport 7 ukuran `NOT RUN` | Playwright dijalankan pada 7 viewport + keyboard + zoom 200% + light/dark + reduced motion tanpa overflow/overlap. |
