# 00 — AUDIT EXECUTIVE SUMMARY (MODE A — TOKO SAKALA)

**Tanggal Pemutakhiran & Penutupan Mode A:** 14 November 2026 *(audit awal 13 November 2026)*  
**Mode Kerja:** MODE A — DOCUMENTATION RECONCILIATION ONLY (**nol** perubahan ke `src/*`, SQL, CSS, test, config, Git history, maupun dokumen sumber lama)  
**Status Fase:** **`MODE A CLOSED — OWNER SIGNED OFF`** *(14 November 2026)* | **Mode B:** **`NOT AUTHORIZED`**  
**Basis Keputusan Owner:** Keputusan **Deliverable 6** (8 butir), **Deliverable 7 Forensic Audit**, **Final Decision `NOD-01..04`**, **Deliverable 8 (`NOD-05`, `NOD-06`, `NOD-03B`)**, serta **Persetujuan Penutupan Mode A oleh Owner (14 November 2026)** *(penutupan dokumentasi Mode A tidak berarti otorisasi implementasi Mode B, persetujuan baseline teknis Mode B, atau pernyataan aplikasi siap produksi)*.

---

## 1. Status Kesiapan Produk Saat Ini (Jujur & Terverifikasi)

| Dimensi | Status | Ringkasan Fakta Terverifikasi |
|---|---|---|
| **Static Build & Unit Test Lokal** | `VERIFIED PASS` *(snapshot pra-koreksi)* | `npm run scan:secrets` PASS; `npx vitest run` PASS (`18 files, 85 tests`); `npx tsc --noEmit` PASS pada verifikasi 13 Nov 2026 *(catatan: golden tests masih menguji rumus Laba & Latest Unit Cost yang menyimpang dari aturan bisnis terkunci)* — **tidak dijalankan ulang sebagai klaim perbaikan di Deliverable 8**. |
| **Browser Runtime Visual & Viewport Sweep** | `NOT RUN` | Biner `chromium` / `google-chrome` tidak tersedia di kontainer eksekusi. Pengukuran bounding-box 7 viewport (`320–1440 px`), kontras render aktual `#20211F` on `#FF5A1F` dan `--blue` dark mode, tumpang-tindih virtual keyboard, focus trap, zoom 200%, reduced motion, dan screenshot live **belum dijalankan**. |
| **Keamanan Cloud Supabase & Produksi Data Nyata** | `BLOCKED (CRITICAL)` | `migrations/001` & `002` membuka RLS `FOR ALL USING (true)` ke role `anon`; dua client Supabase terpisah (`supabaseClient.ts` vs `supabaseAdapter.ts`); dokumen **`TRD v2`** & **Edge Function / RPC** tidak ada di workspace (`NOD-01: LOCKED — IMPLEMENTATION BLOCKED`). **Dilarang dinyatakan aman atau siap produksi cloud.** |
| **Integritas Hitungan Laba, Modal & Laporan** | `BLOCKED (CRITICAL)` | `engineBridge.ts` melabeli `Penjualan − Diskon` sebagai *"Untung Kotor"* dan menghitung *"Untung Bersih"* tanpa `COGS` maupun rugi rusak/dipakai; `LOSS_USED` tidak dipetakan ke `calculate.ts`; `Laporan` mengabaikan `ringkasanPeriod`; **`NOD-05` (`LOCKED — MOVING AVERAGE`)** mengonfirmasi `calculate.ts`, `contract.ts`, `engineBridge.ts`, `App.tsx`, & `golden-rumus-pemilik.test.ts` menyimpang memakai `Latest Unit Cost` serta melebur `unknownUnits` ke `knownUnits` (`calculate.ts:141–143`). |
| **Konsistensi UI dengan TOKO MODE (`G4 v2.1`)** | `HIGH DRIFT` | `.floating-dock` memakai glassmorphism blur + glow, `.live-pulse-beacon` beranimasi pulse, `App.tsx` berisi `754` inline `style={{...}}`, `229` deklarasi font `<12px`, `10` elemen `<div role="button">` tanpa `onKeyDown`, dan route mati `'asisten'`. |
| **Tata Kelola Git & Baseline Mode B (`NOD-06`)** | `LOCKED — PRESERVE HISTORY` | `Verified HEAD immediately before the Mode A closure documentation commit: 4700ea53a53d1c8711d7a99b0a9805456e2ec3d1`. Objek audit historis `918d36560660cd183f603f6ea72238a96f031796` (`918d365`, `"feat(engine): add discount support and sample data management"`) dibanding baseline `9e64039be553d0abecd56c07f7f9def57d596c1e` (`9e64039`) mencakup **25 file berubah** di GitHub Compare: `12` dokumentasi audit, `12` file source/CSS/test/konfigurasi, dan `1` `.gitignore` (tanpa otorisasi Mode B; tidak ada video MP4 dalam compare tersebut). Riwayat Git wajib dijaga utuh; klasifikasi forensik selektif & proposal baseline didokumentasikan di `10_FINAL_MODE_A_RECONCILIATION_REPORT.md` §9. *(Snapshot kontainer `/app/applet` sendiri tidak menyertakan direktori `.git`).* |

---

## 2. Daftar Blocker Prioritas (Harus Diselesaikan Saat Mode B Diotorisasi)

### A. Critical Security, Architecture & Governance Blockers

1. **[SEC-01 / BLOCKER] RLS Terbuka Publik (`anon`) pada `migrations/001` & `002`**  
   `migrations/001_create_toko_documents.sql:50–64` dan `migrations/002_create_domain_tables.sql:133–154` memberi hak `FOR ALL USING (true) WITH CHECK (true)` kepada `anon` dan `authenticated`. Siapa saja yang memperoleh URL + anon key publik dapat membaca, menimpa, atau menghapus seluruh dokumen toko.  
   *[SOURCE: migrations/001_create_toko_documents.sql | 50–64]* *[SOURCE: migrations/002_create_domain_tables.sql | 133–154]*

2. **[SEC-02 / BLOCKER] Dua Instance Supabase Client Terpisah & Tidak Ada Server Validation Gate**  
   `src/auth/supabaseClient.ts:98–104` mengelola sesi Magic Link OTP (`signInOwnerWithOtp`), sedangkan `src/storage/supabaseAdapter.ts:86, 112` membuat `createClient()` terpisah tanpa mewarisi sesi terautentikasi dan menulis langsung via PostgREST (`toko_documents`), bukan melalui Edge Function + RPC sebagaimana dipersyaratkan `TRD v2`.  
   *[SOURCE: src/auth/supabaseClient.ts | 98–104]* *[SOURCE: src/storage/supabaseAdapter.ts | 86, 112]*

3. **[AR-04 / NOD-01 / BLOCKER] Dokumen Acuan `TRD v2` Belum Tersedia (`LOCKED — IMPLEMENTATION BLOCKED`)**  
   Owner menetapkan **`TRD v2`** (batas biaya Rp0, Cloudflare Workers Static Assets, Supabase Free, autentikasi satu pemilik, RLS, penulisan lewat Edge Function + RPC) sebagai satu-satunya acuan arsitektur yang sah. Penelusuran penuh workspace mengonfirmasi file `TRD v2`, `wrangler.toml`, `supabase/functions/`, serta SQL `rpc_commit_command`/`rpc_close_period` **tidak ada di repository** (draft `supabase/migrations/20261022000100_initial_schema.sql:239–241` mencatat RPC belum dibuat). Sesuai **`NOD-01`**, **dilarang membuat arsitektur pengganti dan dilarang memulai implementasi Fase 1 lokal maupun cloud** sebelum `TRD v2` tersedia, terverifikasi, dan Owner mengotorisasi Mode B secara eksplisit.

4. **[SYNC-01 / DI-04 / HIGH] Status Sync Menyesatkan (`pendingCount: 0` Statis & Isolasi `sampleData`)**  
   `src/storage/syncEngine.ts:84` mengembalikan `pendingCount: 0` secara statis (tidak membaca panjang `getPendingMutations()`), sehingga header (`App.tsx:1974–1990`) dan Pengaturan (`5390`) menampilkan `"Tersinkron"` / `"Tersinkronisasi"` sebelum konfirmasi server atas versi data yang benar. Selain itu `handleLoadSampleData` (`App.tsx:686–692`) menulis langsung via `executeSaveTransaction` sehingga data contoh ikut masuk ke antrean sinkronisasi cloud.

5. **[BL-04 / NOD-06 / GOVERNANCE] Pelestarian Riwayat Git & Triage Commit `918d3656`**  
   Sesuai **`NOD-06` (`LOCKED — PRESERVE HISTORY`)**, commit `918d36560660cd183f603f6ea72238a96f031796` tidak boleh di-reset, di-rewrite, atau di-revert otomatis, namun perubahannya tidak dianggap otomatis disetujui. Klasifikasi forensik selektif (audit docs vs sample baseline vs perubahan kode/CSS/test/config tidak sah) serta usulan baseline Mode B dirinci pada `10_FINAL_MODE_A_RECONCILIATION_REPORT.md` §9.

---

### B. Critical Business Logic & Data Integrity Blockers

1. **[BL-01] Ketidakcocokan Rumus & Istilah Laba (`calculate.ts` vs `engineBridge.ts` vs PRD/DR-016)**  
   Pemetaan 9 langkah wajib Owner Review (`DL-01`) vs implementasi saat ini:

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

2. **[BL-02 / NOD-05] Deviasi Metode Modal: `Moving Average` (`LOCKED`) vs `Latest Unit Cost` & Peleburan `unknownUnits`**  
   Sesuai **`NOD-05` (`LOCKED — MOVING AVERAGE`)**, `01_PRD.md:87`, `DECISION_REGISTER.md` Rule 13 (`line 23`), & `DR-014` (`line 109`), **Moving Average** adalah satu-satunya metode modal yang sah (`Latest Unit Cost` bukan alternatif sah). Implementasi aktual di `src/engine/v1/calculate.ts:8, 46, 56–72, 139–145, 166, 306`, `src/engine/contract.ts:24`, `src/engine/v1/engineBridge.ts:109, 492, 508`, `src/App.tsx:1056–1061`, serta `tests/engine/golden-rumus-pemilik.test.ts:14–66, 298–340` menyimpang sebagai **implementation & test deviation**. Selain itu, `calculate.ts:141–143` melebur `pool.unknownUnits` ke `pool.knownUnits` saat pembelian baru sehingga diam-diam memberi modal pada stok tak diketahui — melanggar 6 syarat integritas data `NOD-05` & Rule 14.

3. **[BL-03] Layar `Laporan` Mengabaikan Filter Periode (`ringkasanPeriod` & `ringkasanAnchorDate`)**  
   Pemilihan `Hari / Minggu / Bulan / Tahun` (`App.tsx:4309–4322`) dan `formattedAnchorDate` (`4297–4306`) memperbarui state serta `ringkasanData` (`useMemo`), tetapi seluruh Hero Deck (`4327–4415`) dan seluruh baris Slab 1–4 (`4426–4950`) tetap membaca `storeSummary` kumulatif. `Beranda` juga belum membedakan angka hari ini, periode terpilih, dan saldo kumulatif.  
   *[SOURCE: src/App.tsx | 4288–4955]*

4. **[DI-02 / NOD-03 / NOD-03B] Hapus Permanen (`handleDeleteRecord`) Melanggar Append-Only & *Early Close* Ditunda**  
   `App.tsx:703–721` melakukan `Array.filter(r => r.id !== recordId)` tanpa event `VOID` dan tanpa proteksi periode tertutup (`period_close`). Sesuai **`NOD-03` (`LOCKED`)**, `VOID` dibatasi hanya untuk event finansial yang semantik dapat dibatalkan dengan alasan + referensi asal, tanpa menghapus event asli, sedangkan master/konfigurasi/snapshot/sistem tidak otomatis bisa di-`VOID`, dan periode tertutup/snapshot tetap immutable dengan koreksi tertaut. Sesuai **`NOD-03B` (`DEFERRED — EXCLUDED FROM INITIAL RELEASE`)**, *Early Close* dikeluarkan dari cakupan rilis awal (penutupan periode normal saja, tanpa kontrol/UI/notifikasi *Early Close*).

5. **[DI-03] Kontrak Unit & Modul Preview Teruji Tidak Tersambung**  
   Modal barang rusak (`App.tsx:7451, 1273`) menaruh `unit: 'pcs'` secara statis tanpa menghormati `prod.unit` (mis. `kg`, `liter`, `porsi`). Sementara modul domain/engine murni yang sudah lulus uji (**`src/engine/v1/stock-check-preview.ts`** dan **`src/engine/v1/purchase-preview.ts`**, serta `src/ai-feature.ts`) tidak terhubung ke UI `App.tsx`.

---

## 3. Ringkasan Status Desain, Kontras (`NOD-02`) & Notifikasi (`NOD-04`)

- **`NOD-02` — Kontras Oranye & Biru Dark Mode (`LOCKED WITH USAGE-BASED VERIFICATION`):**
  - Token `--orange: #FF5A1F` **dipertahankan**. Teks putih `#FFFFFF` di atas `#FF5A1F` hanya `3.12:1` (gagal WCAG AA teks normal; `#2.84:1` pada `#FF6B34` dark mode). Teks `#20211F` (`--ink`) di atas `--orange` (`#FF5A1F`) memiliki rasio matematis **`5.19:1`** (`5.70:1` pada `#FF6B34`), dan ditetapkan sebagai foreground pada elemen/tombol berlatar oranye **selama verifikasi render aktual mengonfirmasi rasio WCAG (`>= 4.5:1`)** — uji browser masih **`NOT RUN`**.
  - Untuk `--blue` pada dark mode (`#4872F0`): dilarang mengganti seluruh token secara otomatis tanpa bukti. Diperlukan inventarisasi per pemakaian yang memisahkan teks normal (`4.5:1`), UI/ikon/focus ring (`3.0:1`), serta pengukuran pasangan FG/BG aktual di browser (`NOT RUN`) — lihat rincian lengkap di `05_DESIGN_SYSTEM_SPEC.md` & `07_ACCESSIBILITY_RESPONSIVE_QA.md`.
- **`NOD-04` — Header Notification Bell (`CONDITIONAL`):** Tombol lonceng saat ini hanya memicu toast statis (`App.tsx:1993–2000`). Status tetap **bersyarat**: hanya boleh dipertahankan jika didukung sumber data nyata (antrean sync lokal tertunda, gagal sync terkonfirmasi, atau peringatan stok berbasis data aktual) + aksi bermakna tanpa angka/status palsu; jika tidak terbukti, keluarkan dari rilis awal.
- **Keyboard, Semantic & Sentuh:** `10` elemen `<div role="button" tabIndex={0}>` tanpa `onKeyDown` (`App.tsx:2190–8140`); `18` modal inline tidak memakai `ModalForm.tsx` (`App.tsx:11`); stepper pecahan Setoran hanya `32×34 px` (`3955, 3972`); dan `229` deklarasi font `<12px`.

---

## 4. Peta Deliverable Mode A (`/docs/audit-mode-a/` & `/docs/audit/`)

1. `00_AUDIT_EXECUTIVE_SUMMARY.md` — Ringkasan eksekutif, blocker prioritas, pemetaan P&L & status `NOD-01..06`.
2. `01_SOURCE_OF_TRUTH_MATRIX.md` — Matriks sumber kebenaran, tabel konflik `C-01..C-15`, klasifikasi SQL, dan **Architecture Crosswalk 5 sumber**.
3. `02_SCREEN_INVENTORY.md` — Inventori lengkap shell, 10 layar aktif + 1 dead route `'asisten'`, dan 19 modal/sheet/toast.
4. `03_SCREEN_AUDIT.md` — Audit layar demi layar (jujur menandai `"perlu diukur dari render"` untuk metrik viewport).
5. `04_REFERENCE_RESEARCH.md` — Riset komparatif terverifikasi (Square, Shopify, Loyverse, majoo, BukuWarung/Kasir Pintar, Figma Tokens, Apple HIG/WCAG 2.2) + catatan akses situs tertutup.
6. `05_DESIGN_SYSTEM_SPEC.md` — Spesifikasi tunggal **TOKO MODE** selaras `DESIGN.md`, `G4 v2.1`, & `NOD-02`/`NOD-04`.
7. `06_INTERACTION_STATE_MAP.md` — Peta interaksi tap-first, matriks gestur 9 atribut, dan diagram transisi state form/sync/`VOID` (`NOD-03`/`NOD-03B`).
8. `07_ACCESSIBILITY_RESPONSIVE_QA.md` — Register QA WCAG 2.2 AA (termasuk protokol `NOD-02`) & 7 breakpoint (`320–1440 px`) beserta protokol uji browser Mode B (`NOT RUN`).
9. `08_DECISION_LOG.md` — Keputusan final `LOCKED` (`DL-01..13`), `CONDITIONAL`/`DEFERRED` (`CD-01..02`), `RECOMMENDED`, `NEEDS OWNER DECISION` (`NOD-01`), dan `BLOCKER`.
10. `09_MODE_B_IMPLEMENTATION_PLAN.md` — Proposal rencana bertahap dengan gerbang wajib **`MODE B NOT AUTHORIZED`**.
11. **`10_FINAL_MODE_A_RECONCILIATION_REPORT.md`** — Laporan rekonsiliasi final Mode A, matriks konsistensi lintas dokumen, klasifikasi forensik `918d3656` (`NOD-06`), dan catatan penutupan Owner (`MODE A CLOSED — OWNER SIGNED OFF` pada 14 November 2026 — `MODE B: NOT AUTHORIZED`).

