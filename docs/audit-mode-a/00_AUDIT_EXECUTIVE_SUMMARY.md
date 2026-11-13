# 00 — AUDIT EXECUTIVE SUMMARY (MODE A — TOKO SAKALA)

**Tanggal Audit:** 13 November 2026  
**Mode Kerja:** MODE A — READ-ONLY (Audit Menyeluruh, Blueprint & Spesifikasi; **nol** perubahan ke `src/*`, SQL, CSS, test, maupun dokumen sumber lama)  
**Basis Keputusan Owner:** Seluruh keputusan **Owner Review Deliverable 6** (8 butir) telah diintegrasikan.

---

## 1. Status Kesiapan Produk Saat Ini (Jujur & Terverifikasi)

| Dimensi | Status | Ringkasan Fakta Terverifikasi |
|---|---|---|
| **Static Build & Unit Test Lokal** | `VERIFIED PASS` | `npm run scan:secrets` PASS; `npx vitest run` PASS (`18 files, 85 tests`); `npx tsc --noEmit` PASS. *[SOURCE: verification run 13 Nov 2026]* |
| **Browser Runtime Visual & Viewport Sweep** | `NOT RUN` | Biner `chromium` / `google-chrome` tidak tersedia di kontainer eksekusi. Pengukuran bounding-box 7 viewport (`320–1440 px`), tumpang-tindih virtual keyboard, focus trap, dan screenshot live **belum dijalankan**. |
| **Keamanan Cloud Supabase & Produksi Data Nyata** | `BLOCKED (CRITICAL)` | `migrations/001` & `002` membuka RLS `FOR ALL USING (true)` ke role `anon`; dua client Supabase terpisah (`supabaseClient.ts` vs `supabaseAdapter.ts`); dokumen **TRD v2 / v2.1** & **Edge Function / RPC** tidak ada di workspace. **Dilarang dinyatakan aman atau siap produksi cloud.** |
| **Integritas Hitungan Laba & Laporan** | `BLOCKED (CRITICAL)` | `engineBridge.ts` melabeli `Penjualan − Diskon` sebagai *"Untung Kotor"* dan menghitung *"Untung Bersih"* tanpa `COGS` maupun rugi rusak/dipakai; `LOSS_USED` tidak dipetakan ke `calculate.ts`; layar `Laporan` memakai `storeSummary` kumulatif dan mengabaikan `ringkasanPeriod` (`HARI/MINGGU/BULAN/TAHUN`). |
| **Konsistensi UI dengan TOKO MODE (`G4 v2.1`)** | `HIGH DRIFT` | `.floating-dock` memakai glassmorphism blur + glow, `.live-pulse-beacon` beranimasi pulse, `App.tsx` berisi `754` inline `style={{...}}`, `229` deklarasi font `<12px`, `10` elemen `<div role="button">` tanpa `onKeyDown`, dan route mati `'asisten'`. |

---

## 2. Daftar Blocker Prioritas (Harus Diselesaikan Sebelum / Di Awal Mode B)

### A. Critical Security & Architecture Blockers

1. **[SEC-01 / BLOCKER] RLS Terbuka Publik (`anon`) pada `migrations/001` & `002`**  
   `migrations/001_create_toko_documents.sql:50–64` dan `migrations/002_create_domain_tables.sql:133–154` memberi hak `FOR ALL USING (true) WITH CHECK (true)` kepada `anon` dan `authenticated`. Siapa saja yang memperoleh URL + anon key publik dapat membaca, menimpa, atau menghapus seluruh dokumen toko.  
   *[SOURCE: migrations/001_create_toko_documents.sql | 50–64]* *[SOURCE: migrations/002_create_domain_tables.sql | 133–154]*

2. **[SEC-02 / BLOCKER] Dua Instance Supabase Client Terpisah & Tidak Ada Server Validation Gate**  
   `src/auth/supabaseClient.ts:98–104` mengelola sesi Magic Link OTP (`signInOwnerWithOtp`), sedangkan `src/storage/supabaseAdapter.ts:86, 112` membuat `createClient()` terpisah tanpa mewarisi sesi terautentikasi dan menulis langsung via PostgREST (`toko_documents`), bukan melalui Edge Function + RPC sebagaimana dipersyaratkan TRD v2.  
   *[SOURCE: src/auth/supabaseClient.ts | 98–104]* *[SOURCE: src/storage/supabaseAdapter.ts | 86, 112]*

3. **[AR-04 / BLOCKER] Dokumen Acuan `TRD v2` / `TRD v2.1` Tidak Tersedia di Workspace**  
   Owner menetapkan **TRD v2 terbaru** (Cloudflare Workers Static Assets, Supabase Free, autentikasi satu pemilik, RLS, penulisan lewat Edge Function + RPC) sebagai acuan arsitektur, menggantikan pertanyaan Opsi A/B awal. Namun penelusuran penuh workspace mengonfirmasi: file `TRD v2`, `wrangler.toml`, folder `supabase/functions/`, serta SQL `rpc_commit_command`/`rpc_close_period` **tidak ada di repository**. Yang tersedia hanya catatan selisih historis di `docs/sources/TRD_SOURCE_V3_NOT_LOCKED.txt:4, 21, 87–88, 378–381` dan draft awal 24 tabel di `supabase/migrations/20261022000100_initial_schema.sql` (`line 239–241` eksplisit mencatat RPC belum dibuat). Mode A tidak membuat arsitektur pengganti dari asumsi dan mencatat ini sebagai **kebutuhan keputusan / unggah dokumen Owner**.

4. **[SYNC-01 / HIGH] Status Sync Menyesatkan (`pendingCount` Hardcoded `0` & Isolasi `sampleData`)**  
   `src/storage/syncEngine.ts:84` mengembalikan `pendingCount: 0` secara statis (tidak membaca panjang `getPendingMutations()`), sehingga header (`App.tsx:1974–1990`) dan Pengaturan (`5390`) terus menampilkan `"Tersinkron"` / `"Tersinkronisasi"` begitu Supabase terkonfigurasi dan `lastError === null`, meskipun mutasi lokal belum terkonfirmasi oleh server untuk `dataVersion` tersebut. Selain itu `handleLoadSampleData` (`App.tsx:686–692`) menulis langsung via `executeSaveTransaction` sehingga data contoh ikut masuk ke antrean sinkronisasi cloud.

---

### B. Critical Business Logic & Data Integrity Blockers

1. **[BL-01] Ketidakcocokan Rumus & Istilah Laba (`calculate.ts` vs `engineBridge.ts` vs PRD/DR-016)**  
   Ringkasan pemetaan 9 langkah wajib Owner Review vs implementasi saat ini:

   | # | Struktur Laba Wajib Owner Review (PRD & DR-016) | Implementasi Saat Ini (`calculate.ts` & `engineBridge.ts`) | Status |
   |---|---|---|---|
   | 1 | **Penjualan Kotor** | `grossSales` = `engineOutput.totals.salesRevenue` (`engineBridge.ts:314–318`) | Ada (sebelum diskon) |
   | 2 | **Diskon** | `discountTotal` dihitung terpisah di `engineBridge.ts:320–349`; `calculate.ts` **tidak** mengenal diskon | Terpisah dari engine utama |
   | 3 | **Penjualan Bersih** = `Penjualan Kotor − Diskon` | **SALAH LABEL:** `engineBridge.ts:351–354` menamai ini `untungKotor` dan UI menampilkannya sebagai `"Untung Kotor"` (`App.tsx:4523`) | **BL-01 (Kritis)** |
   | 4 | **Modal Barang Terjual** (`COGS`) | `cogsKnown` = `engineOutput.totals.costOfGoodsSoldKnown` (`engineBridge.ts:365`); `calculatePeriodSummary` (`668`) tidak memakainya | Ada di `calculate.ts`, terabaikan di `untungBersih` & ringkasan periode |
   | 5 | **Untung Kotor** = `Penjualan Bersih − Modal Barang Terjual` | `engineBridge.ts:367–373` menghitung `grossProfit = grossSales − cogsKnown` **tanpa memotong `discountTotal`** | **SALAH RUMUS** |
   | 6 | **Pendapatan Lain** | `otherIncomeTotal` (`engineBridge.ts:380–383`, termasuk dalam `calculate.ts:314`) | Ada |
   | 7 | **Kerugian Barang Rusak, Dipakai, Selisih Barang** | `calculate.ts:315` memotong `damageLossKnown + usedLossKnown + unknownLossKnown`, tetapi `engineBridge.ts:198–218` **tidak memetakan `LOSS_USED`**, dan `untungBersih` (`386–389`) sama sekali **tidak memotong rugi apa pun** | **SALAH PEMETAAN & RUMUS** |
   | 8 | **Biaya Operasional** | `expensesTotal` (`engineBridge.ts:375–379`, termasuk biaya sumber `STORE` + `PERSONAL`) | Ada (perlu verifikasi kejelasan label sumber uang) |
   | 9 | **Untung Bersih Toko** | **SALAH RUMUS:** `engineBridge.ts:386–389` hanya menghitung `untungKotor (Penjualan Bersih) − expensesTotal + otherIncomeTotal` (melewatkan COGS & seluruh kerugian stok!); `calculate.ts:314–316` menghitung `salesRevenue + otherIncome - COGS - kerugian - expenses` tetapi melewatkan diskon! | **BL-01 (Kritis)** |

2. **[BL-03] Layar `Laporan` Mengabaikan Filter Periode (`ringkasanPeriod` & `ringkasanAnchorDate`)**  
   Pemilihan `Hari / Minggu / Bulan / Tahun` (`App.tsx:4309–4322`) dan `formattedAnchorDate` (`4297–4306`) memperbarui state serta `ringkasanData` (`useMemo`), tetapi seluruh Hero Deck (`4327–4415`) dan seluruh baris Slab 1–4 (`4426–4950`) tetap membaca `storeSummary` kumulatif. Akibatnya angka laporan tidak berubah saat periode diganti.  
   *[SOURCE: src/App.tsx | 4288–4955]*

3. **[DI-02] Hapus Permanen (`handleDeleteRecord`) Melanggar Append-Only & Tutup Periode**  
   `App.tsx:703–721` melakukan `Array.filter(r => r.id !== recordId)` yang menghapus langsung histori pembelian, stok, biaya, pemasukan, dan setoran tanpa event pembatalan (`VOID`) serta tanpa pemeriksaan periode tertutup (`period_close`).

4. **[DI-03] Kontrak Unit & Data Domain Diabaikan di UI**  
   Modal barang rusak (`App.tsx:7451, 1273`) menaruh `unit: 'pcs'` secara statis tanpa menghormati `prod.unit` (mis. `kg`, `liter`, `porsi`). Sementara modul domain murni yang sudah lulus uji (`src/domain/stock-check-preview.ts`, `src/domain/purchase-preview.ts`, `src/ai-feature.ts`) tidak terhubung ke UI `App.tsx`.

---

## 3. Ringkasan Kontras & Aksesibilitas Kritis (Terukur Otomatis)

- **WCAG 2.2 AA Contrast Fail:** Teks putih `#FFFFFF` di atas tombol/badge `--orange` (`#FF5A1F`) menghasilkan rasio **`3.12:1`** pada mode terang dan **`2.84:1`** (`#FF6B34`) pada mode gelap (`< 4.5:1` teks normal). Pada mode gelap (`[data-theme="dark"]`), `--blue` (`#4872F0`) terhadap `--blue-pale` (`#1C2642`) hanya **`3.52:1`**, dan teks putih di atas `#4872F0` hanya **`4.25:1`**. Sebaliknya `#20211F` (ink) di atas `#FF5A1F` memenuhi AA (**`5.19:1`**). *(Perlu keputusan Owner pada `08_DECISION_LOG.md` sebelum Mode B mengubah warna teks/shade CTA primer).*
- **Keyboard & Semantic:** `10` elemen interaktif memakai `<div role="button" tabIndex={0} onClick={...}>` tanpa `onKeyDown` (`App.tsx:2190–8140`); `18` modal/bottom sheet inline tidak memakai focus trap / return-to-trigger meski `ModalForm.tsx` sudah diimpor (`App.tsx:11`) namun tidak terpakai.
- **Ukuran Sentuh & Teks:** Stepper pecahan uang Setoran memakai `32×34 px` (`App.tsx:3955, 3972`) dan chip/label bertebaran dengan `229` deklarasi font `<12px`.

---

## 4. Peta Deliverable Mode A (`/docs/audit-mode-a/`)

1. `00_AUDIT_EXECUTIVE_SUMMARY.md` — Ringkasan eksekutif, blocker prioritas, pemetaan awal P&L.
2. `01_SOURCE_OF_TRUTH_MATRIX.md` — Matriks sumber kebenaran, tabel konflik, dan **Architecture Crosswalk 5 sumber** (termasuk status absennya `TRD v2`).
3. `02_SCREEN_INVENTORY.md` — Inventori lengkap shell, 10 layar aktif + 1 dead route `'asisten'`, dan 18+ modal/sheet/toast.
4. `03_SCREEN_AUDIT.md` — Audit 14 aspek layar demi layar (jujur menandai `"perlu diukur dari render"` untuk metrik viewport).
5. `04_REFERENCE_RESEARCH.md` — Riset komparatif terverifikasi (Square, Shopify, Loyverse, majoo, BukuWarung/Kasir Pintar, Figma Tokens, Apple HIG/WCAG 2.2) + catatan akses situs tertutup.
6. `05_DESIGN_SYSTEM_SPEC.md` — Spesifikasi tunggal **TOKO MODE** selaras `DESIGN.md` & `G4 v2.1` + perbaikan token aksesibilitas.
7. `06_INTERACTION_STATE_MAP.md` — Peta interaksi tap-first, matriks gestur 9 atribut, dan diagram transisi state transaksi/sync/void.
8. `07_ACCESSIBILITY_RESPONSIVE_QA.md` — Register QA WCAG 2.2 AA & 7 breakpoint (`320–1440 px`) beserta protokol uji browser Mode B.
9. `08_DECISION_LOG.md` — Keputusan `LOCKED`, `RECOMMENDED`, `NEEDS OWNER DECISION`, dan `BLOCKER`.
10. `09_MODE_B_IMPLEMENTATION_PLAN.md` — Rencana implementasi bertahap, urutan pengamanan sebelum UI refactor, gerbang verifikasi, dan rollback plan.
