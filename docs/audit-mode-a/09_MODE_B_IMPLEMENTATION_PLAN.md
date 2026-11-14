# 09 — MODE B IMPLEMENTATION PLAN & ROLLBACK ROADMAP (PROPOSAL ONLY)

## 1. STATUS OTORISASI: `MODE B NOT AUTHORIZED`

> [!CAUTION]
> **`MODE B NOT AUTHORIZED` — DILARANG KERAS MEMULAI IMPLEMENTASI LOKAL MAUPUN CLOUD.**  
> Dokumen ini hanya berisi **rencana usulan (proposals only)** untuk dievaluasi oleh Owner setelah paket Mode A ditandatangani. Tidak ada satu pun fase di bawah ini yang sedang diotorisasi atau siap dieksekusi sekarang. Sesuai **`NOD-01` (`LOCKED — IMPLEMENTATION BLOCKED`)**, pekerjaan Fase 1 lokal maupun Fase 2 cloud **dilarang dimulai** sebelum seluruh 6 gerbang berikut dipenuhi.

### 6 Gerbang Wajib Sebelum Mode B Dapat Diotorisasi
1. **`TRD v2` disediakan & diverifikasi:** File spesifikasi arsitektur resmi `TRD v2` telah diunggah Owner ke workspace dan kontrak database, Edge Function, RPC, RLS, serta Cloudflare Workers Static Assets terdokumentasi tanpa asumsi.
2. **Architecture crosswalk tuntas:** Seluruh pemetaan sumber (`01_SOURCE_OF_TRUTH_MATRIX.md`) terverifikasi terhadap `TRD v2` dan rekonsiliasi atas `DR-012`/`DR-013` disetujui.
3. **Review final Mode A oleh Owner selesai:** Owner telah meninjau dan menandatangani (`Sign-Off`) paket akhir Mode A (`10_FINAL_MODE_A_RECONCILIATION_REPORT.md`).
4. **Blocker teknis & cakupan implementasi terdokumentasi utuh:** Seluruh blocker (`SEC-01`, `SEC-02`, `SYNC-01/DI-04`, `BL-01`, `BL-02/NOD-05`, `BL-03`, `DI-01..03`, `QA-01`, `BL-04/NOD-06`) serta aturan `NOD-02`, `NOD-03`, `NOD-03B`, `NOD-04`, `NOD-05` tercatat final.
5. **Proposal baseline & strategi branch (`NOD-06`) direview:** Owner meninjau klasifikasi forensik selektif commit `918d36560660cd183f603f6ea72238a96f031796` dan menetapkan titik awal branch/baseline Mode B tanpa merusak riwayat Git.
6. **Owner memberi otorisasi eksplisit Mode B:** Persetujuan tertulis terpisah dari Owner untuk membuka fase implementasi Mode B.

---

## 2. PEMISAHAN WAJIB: TEMUAN AUDIT vs PRASYARAT vs USULAN KERJA

| Kategori | Status Saat Ini | Isi & Batasan Tegas |
|---|---|---|
| **A. Audit Findings (Fakta Read-Only)** | `TERVERIFIKASI` | Celah RLS `anon` (`migrations/001` & `002`), dua Supabase client terpisah, `TRD v2` belum ada, `pendingCount: 0` hardcoded, `sampleData` belum terisolasi, rumus P&L 9 langkah terbalik & `LOSS_USED` tak dipetakan, deviasi `Latest Unit Cost` + peleburan `unknownUnits` (`calculate.ts:141–143`) terhadap `Moving Average`, `Laporan` abai filter periode, hard-delete, deviasi G4 `.floating-dock`/pulse/slop, 10 `<div role="button">` tanpa keyboard, stepper `32×34px`, & uji browser Chromium `NOT RUN`. |
| **B. Mandatory Preconditions & Owner Approval Gates** | `LOCKED / BLOCKING` | Terpenuhinya **6 Gerbang Wajib** di Bagian 1 sebelum satu baris pun dari `src/*`, `tests/*`, `supabase/*`, `src/styles.css`, atau konfigurasi boleh diubah. |
| **C. Proposed Implementation Work (`PROPOSAL ONLY`)** | **`NOT AUTHORIZED`** | Seluruh tugas Fase 1–4 di Bagian 3 di bawah ini semata-mata adalah usulan rancangan kerja masa depan. Urutannya menempatkan pengamanan data/logika/arsitektur sebelum atau berdampingan dengan refactor UI agar visual rapi tidak pernah menutupi bug finansial atau celah keamanan. |
| **D. Baseline & Rollback Proposal (`NOD-06`)** | `LOCKED — PRESERVE HISTORY` | Dilarang melakukan `git reset`, `rewrite`, `force-push`, atau `revert` otomatis atas commit `918d3656`. Detail proposal titik awal & branch dirinci pada Bagian 4 dan `10_FINAL_MODE_A_RECONCILIATION_REPORT.md` §9. |

---

## 3. PROPOSAL IMPLEMENTASI MASA DEPAN (`PROPOSALS ONLY — NOT AUTHORIZED`)

### Proposal Fase 0 — Penyelarasan Kontrak & Verifikasi Prasyarat (`LOCKED GATE`)

| Proposal Tugas | Prasyarat & Exit Gate |
|---|---|
| **0.1 Ingesti & Verifikasi `TRD v2`** | Owner mengunggah `TRD v2`; tim memverifikasi kontrak Edge Function, RPC (`rpc_commit_command`, `rpc_close_period`, dsb.), RLS satu pemilik, dan konfigurasi Cloudflare Workers Static Assets tanpa asumsi; rekonsiliasi konflik `DR-012`/`DR-013`. |
| **0.2 Finalisasi Baseline & Branch Mode B (`NOD-06`)** | Owner memilih strategi baseline setelah meninjau klasifikasi forensik commit `918d3656` (`10_FINAL_MODE_A_RECONCILIATION_REPORT.md` §9); jalankan verifikasi awal (`scan:secrets`, `vitest`, `tsc`) pada branch kerja baru **hanya setelah otorisasi Mode B**. |
| **0.3 Penguncian Batas Scope Awal** | Pastikan **Early Close (`NOD-03B`) dikecualikan** (zero UI/setting/kontrol/notifikasi Early Close) dan status **Notification Bell (`NOD-04`)** ditetapkan (implementasi berbasis sumber data nyata + aksi, atau dihapus dari rilis awal). |

---

### Proposal Fase 1 — Integritas Bisnis, Engine P&L 9 Langkah, Moving Average & Append-Only (`PROPOSAL ONLY`)

> *Pengingat `NOD-01`: Proposal Fase 1 lokal **tidak boleh dimulai** sebelum `TRD v2` tersedia, direview, dan Mode B diotorisasi eksplisit oleh Owner.*

| Proposal Tugas | Sasaran Perkiraan *(Belum Dieksekusi)* | Perubahan Usulan & Syarat Wajib |
|---|---|---|
| **1.1 Penyatuan Engine, Rumus 9 Langkah (`BL-01`) & Moving Average (`NOD-05` / `BL-02`)** | `src/engine/v1/calculate.ts`, `src/engine/contract.ts`, `src/engine/v1/engineBridge.ts`, `src/App.tsx:1056–1061`, `tests/engine/golden-rumus-pemilik.test.ts`, `tests/golden/sample-week.test.ts` | - **Koreksi `NOD-05` (`LOCKED — MOVING AVERAGE`):** Hapus logika `Latest Unit Cost` (`latestUnitCost`) dan terapkan **Moving Average (rata-rata bergerak)** pada kolam persediaan known-cost.<br>- Terapkan 6 aturan integritas `NOD-05`: pisahkan kolam `knownUnits`/`knownValue` dari `unknownUnits`; perbaiki bug `calculate.ts:141–143` agar pembelian baru **tidak** memberi modal ke stok yang sebelumnya `unknownUnits`; cegah konversi diam-diam `unknown -> 0`; catat edge case alokasi stok keluar antara kolam known/unknown sebagai spesifikasi engineering terverifikasi.<br>- Implementasikan 9 komponen P&L berurutan (`DL-01`), petakan `LOSS_USED` & `discountTotal`, hapus istilah `"Untung Kotor"` sebelum modal, dan konsolidasikan `calculatePeriodSummary` ke satu engine.<br>- Tulis ulang golden tests agar menguji rumus P&L 9 langkah + **Moving Average** sesuai aturan bisnis terkunci. |
| **1.2 Filter Periode `Laporan` & Pemisahan Posisi `Beranda` (`BL-03`)** | Layar `Laporan` & `Beranda` *(ekstraksi ke `src/screens/*`)* | - Kabelkan Hero Deck & Slab 1–4 `Laporan` ke output terfilter periode terpilih (`Hari/Minggu/Bulan/Tahun` + anchor date).<br>- Beri label eksplisit *"Posisi Saat Ini (Kumulatif)"* pada `Kas Laci Terkini` & `Sisa Stok Terkini`.<br>- Di `Beranda`, bedakan jelas **Hari Ini**, **Periode Terpilih**, dan **Saldo Kumulatif**. |
| **1.3 Koneksi Modul Preview Teruji & Integritas Unit (`DI-01`, `DI-03`)** | `src/engine/v1/stock-check-preview.ts`, `src/engine/v1/purchase-preview.ts`, modal rusak/dipakai/pemasukan | - Sambungkan `stock-check-preview.ts` & `purchase-preview.ts` ke UI `Stok` & `Catat Belanja`.<br>- Hormati `prod.unit` asli di semua form stok/rusak/dipakai (hapus hardcode `'pcs'`).<br>- Perbaiki `parseRupiahInput("")` agar kosong tetap `null` (`blank ≠ 0`).<br>- Hapus pre-fill dummy `'Jasa seduh mie'` pada modal Pemasukan Lain. |
| **1.4 Strict Append-Only `VOID` & Tutup Periode Normal (`NOD-03`, `NOD-03B`)** | `src/storage/*`, handler pembatalan & `period_close` | - Hapus `handleDeleteRecord` (`.filter` hard delete) dan overwrite `handleUndoSave`.<br>- Terapkan `VOID` **hanya** untuk transaksi/event finansial yang semantik dapat dibatalkan dengan alasan + referensi event asal (event asli tetap utuh; master/konfigurasi/snapshot/sistem tidak otomatis bisa di-`VOID`).<br>- Terapkan **penutupan periode normal** (`closedPeriods` & snapshot immutable); koreksi periode tertutup wajib lewat event koreksi baru yang tertaut.<br>- **Jangan** membuat UI, setting, kontrol, atau notifikasi untuk *Early Close* (`NOD-03B` excluded). |
| **1.5 Isolasi Sandbox `sampleData` (`DL-04`)** | Adapter penyimpanan & `SyncEngine` | - Simpan data contoh di sandbox terisolasi (`sandboxMode`) dengan pemblokiran mutlak di `SyncEngine` & `GoogleDriveAdapter`. |

---

### Proposal Fase 2 — Arsitektur Cloud `TRD v2`, RLS Ketat & Status Sync Jujur (`PROPOSAL ONLY`)

| Proposal Tugas | Sasaran | Perubahan Usulan & Uji Wajib |
|---|---|---|
| **2.1 Status Sinkronisasi Jujur (`SYNC-01`)** | `src/storage/syncEngine.ts`, Header & Pengaturan | - Ganti `pendingCount: 0` statis dengan pembacaan nyata panjang `getPendingMutations()`.<br>- Hanya tampilkan `"Terkonfirmasi server"` setelah ada konfirmasi server untuk `dataVersion` aktual. |
| **2.2 Implementasi Cloud & Keamanan `TRD v2` (`SEC-01`, `SEC-02`)** | Migrasi SQL, Edge Functions, RPC, Auth & Adapter | - Cabut `USING (true)` & `GRANT ALL TO anon` pada `migrations/001`; hentikan `migrations/002`.<br>- Implementasikan skema, RLS pemilik tunggal, Edge Functions, RPC, dan satu `SupabaseClient` terautentikasi persis sesuai **`TRD v2`** yang telah diverifikasi di Fase 0.<br>- Hapus URL/email pribadi hardcoded & blok copy SQL terbuka dari `App.tsx`. |
| **2.3 Pemutakhiran Status Dokumentasi & Negative Cloud Tests** | `README.md`, `IMPLEMENTATION_STATUS_v0.5.1.md`, staging tests | - Mutakhirkan status resmi; jalankan negative RLS test (`anon`/non-owner wajib ditolak), uji idempotensi `command_id`, dan `npm run scan:secrets`. |

---

### Proposal Fase 3 — Refactor UI, G4 TOKO MODE, Kontras `NOD-02`, Bell `NOD-04` & A11y (`PROPOSAL ONLY`)

| Proposal Tugas | Sasaran | Perubahan Usulan |
|---|---|---|
| **3.1 Pembersihan `'asisten'`, Elemen Slop & Bell `NOD-04`** | `src/App.tsx`, header, modal | - Hapus `'asisten'` (`App.tsx:50, 2046`), badge fiktif `NO. ADJ-8820` (`7404`), grid emoji (`6519`, ganti Lucide icon), `.live-pulse-beacon` (`1975`), & shadow glow (`4106`).<br>- **`NOD-04` (`CONDITIONAL`):** Hapus bell notifikasi dari rilis awal **kecuali** didukung sumber data nyata (outbox lokal tertunda, gagal sync terkonfirmasi, atau peringatan stok berbasis data aktual) + penjelasan + aksi nyata. |
| **3.2 Kembalikan G4 Solid Bottom Nav & Verifikasi Kontras `NOD-02`** | `src/styles.css`, komponen nav & modal | - Ganti `.floating-dock` blur gelap + glow dengan G4 Solid 5-tab bar (`#D7FA4A` + `#20211F` + `safe-area-inset-bottom`).<br>- **`NOD-02`:** Pertahankan `--orange: #FF5A1F`; gunakan `#20211F` foreground pada elemen/tombol berlatar oranye dan verifikasi `>= 4.5:1` di browser nyata. Lakukan inventarisasi kontekstual & pengukuran aktual seluruh pemakaian `--blue` dark mode (`#4872F0`) — **jangan** ganti token global tanpa bukti kegagalan per komponen.<br>- Bersihkan bertahap `754` inline styles & hex literal hardcoded. |
| **3.3 Pemecahan `App.tsx` (8.235 Baris), `ModalForm` & Target Sentuh A11y** | `src/screens/*`, `ModalForm.tsx`, stepper | - Ekstrak 10 layar & migrasi 18 modal ke `ModalForm` (focus trap, `Escape`, return-focus).<br>- Konversi 10 `<div role="button">` menjadi `<button type="button">` native.<br>- Naikkan stepper pecahan Setoran (`32×34 px`) & tombol kecil (`32–40 px`) ke `>= 44×44 px`, serta tingkatkan teks penting `<12px` ke minimal `12px`. |

---

### Proposal Fase 4 — Gerbang Verifikasi Akhir Mode B (`PROPOSAL ONLY`)

Saat Mode B kelak diotorisasi dan dieksekusi, rilis tetap terblokir hingga seluruh verifikasi ini lulus nyata:
1. `npm run scan:secrets` -> 0 temuan.
2. `npm run test` (termasuk golden tests baru P&L 9 langkah + **Moving Average** + pemisahan `unknownUnits` + `VOID` + sandbox) -> 100% PASS.
3. `npm run build` & `npm run lint` -> 0 error.
4. **Playwright Full Sweep** pada `320, 360, 390, 430, 768, 1024, 1440 px` (Light & Dark + kontras render aktual `NOD-02` `#20211F`/`#FF5A1F` dan `--blue` dark mode + Reduced Motion + Zoom 200% + Virtual Keyboard sim + string panjang + `@media print`) -> 0 overflow, 0 focus-obscured, 0 `axe-core` critical/serious violation.
5. **Cloud SQL & Auth Negative Check** (berdasarkan `TRD v2`) -> terbukti hanya pemilik terautentikasi dapat baca/tulis via Edge Function & RPC.

---

## 4. PROPOSAL BASELINE & STRATEGI BRANCH (`NOD-06 — LOCKED PRESERVE HISTORY`)

- **Aturan Wajib:** Tidak ada `git reset`, `git rebase`/rewrite history, `force-push`, atau penghapusan commit `918d36560660cd183f603f6ea72238a96f031796`.
- **Strategi Usulan untuk Review Owner (Belum Dieksekusi):**
  1. Pertahankan `918d3656` apa adanya di riwayat `main` sebagai jejak bukti forensik, dan dokumentasikan hasil triage per-file terhadap baseline `9e64039` (lihat rincian lengkap di `10_FINAL_MODE_A_RECONCILIATION_REPORT.md` §9).
  2. Sebelum pekerjaan Mode B pertama dimulai (setelah otorisasi eksplisit Owner + tersedianya `TRD v2`), buat branch implementasi terpisah (mis. `mode-b/phase-1-core-and-moving-average` yang bercabang dari titik akhir Mode A setelah sign-off) serta beri tag rujukan (mis. `mode-a-signed-off`) agar setiap perubahan fase Mode B dapat ditinjau terisolasi.
  3. Tangani file kode/test yang terbawa dalam `918d3656` (seperti `src/App.tsx`, `src/styles.css`, `src/engine/v1/engineBridge.ts`, `src/storage/*`, `tests/golden/sample-week.test.ts`, `tests/engine/golden-rumus-pemilik.test.ts`, `vite.config.ts`) melalui perbaikan korektif eksplisit pada branch Mode B agar sesuai aturan bisnis terkunci (`NOD-05`, `DL-01`, `DL-06`), tanpa pernah menghapus catatan sejarahnya dari Git.

