# TOKO SAKALA — MODE A DOCUMENT INGESTION, UNDERSTANDING & VERIFICATION REPORT

**Fase:** Mode A — Research & Design Blueprint (Read-Only Forensic Audit)  
**Tanggal Pembuatan:** 13 November 2026 *(Rekonsiliasi Keputusan Owner & Deliverable 8: 13 November 2026)*  
**Workspace Root:** `/app/applet` (non-git container copy; `.git` tidak tersedia)  
**Status Kode:** **0 file kode, SQL, CSS, test, atau config diubah.** Dokumen ini awalnya disusun pada awal Mode A sebelum pembuatan `docs/audit-mode-a/00..09`.

> [!NOTE]
> **Status Rekonsiliasi Final Mode A (Deliverable 8):**  
> Seluruh bukti forensik asli pada Deliverable 1–4 tetap dipertahankan sebagai catatan historis, sedangkan status keputusan pada Deliverable 3, 4, dan 6 telah direkonsiliasikan penuh dengan keputusan final Owner (**`DL-01..09`**, **`NOD-01..06`**, **`NOD-03B`**) pada `docs/audit-mode-a/08_DECISION_LOG.md` dan `docs/audit-mode-a/10_FINAL_MODE_A_RECONCILIATION_REPORT.md`. **Mode B tetap `NOT AUTHORIZED`.**

> [!IMPORTANT]
> **Kejujuran Path Dokumen Master:**  
> Dokumen dengan path `"docs/TOKO_SAKALA_MODE_A_AUDIT_AND_PROMPT.md"` yang disebut dalam instruksi prompt **TIDAK DITEMUKAN** di dalam folder `docs/`.  
> Dokumen instruksi Mode A aktual yang berada di repository/workspace adalah **`/TOKO_SAKALA_MODE_A_AUDIT_AND_PROMPT (1).md`** (439 baris, 33.096 byte) di root workspace. Seluruh 439 baris file tersebut telah dibaca secara utuh dari awal hingga akhir sebelum laporan ini disusun.

---

## Ringkasan Verifikasi Lingkungan (Faktual Saat Audit)

| Pemeriksaan | Command | Hasil Aktual | Status Kejujuran |
|---|---|---|---|
| Secret Scan | `npm run scan:secrets` | Exit `0`: `"Tidak ditemukan pola secret yang dikenal. Ini bukan jaminan semua secret terdeteksi."` | **PASS (Cakupan Terbatas Pola)** |
| Unit & Engine Tests | `npx vitest run` | Exit `0`: `18 passed (18)` test files, `85 passed (85)` tests (`7.59s`, `vitest v4.1.12`) | **VERIFIED PASS** |
| TypeScript Check | `npx tsc --noEmit` | Exit `0`: 0 diagnostic errors | **VERIFIED PASS** |
| Git Metadata | `ls -la .git` | Tidak ada folder `.git` di container sandbox | **BLOCKED / NOT A GIT REPO** |
| Headless Browser / Viewport QA | Playwright Chromium (`320..1440 px`) | Chromium binary tidak terpasang di container; **BELUM DIJALANKAN** | **NOT RUN (Dilarang klaim PASS)** |
| Live Cloud / Supabase RLS Check | Query live ke `dvznpniodskujfbdznnv.supabase.co` | Tidak dilakukan mutasi / uji koneksi jaringan live dalam Mode A | **NEEDS RUNTIME TEST** |

---

# DELIVERABLE 1 — DOCUMENT INGESTION REPORT

## 1. Identitas & Lokasi File yang Dibaca
- **Path yang diminta prompt:** `docs/TOKO_SAKALA_MODE_A_AUDIT_AND_PROMPT.md` → **Tidak ditemukan (missing path)**.
- **Path aktual yang berhasil dibaca secara utuh:** `/TOKO_SAKALA_MODE_A_AUDIT_AND_PROMPT (1).md` (workspace root).
- **Ukuran & Jangkauan:** 439 baris (baris 1–439 terbaca penuh 100%, 33.096 byte).

## 2. Jumlah Bagian / Heading yang Ditemukan
Total ditemukan **32 heading Markdown** berjenjang (`H1` = 2, `H2` = 21, `H3` = 9):
- Dokumen Blueprint Bagian Atas (baris 1–265): **1 H1**, **10 H2** (`§1`–`§10`), **9 H3** (`### 2.1`–`### 2.6`, `### Fondasi`, `### Komponen`, `### Interaction model`).
- Bagian Prompt Operasional (baris 266–439): **1 H1**, **11 H2** (`KONDISI KERJA MUTLAK` s.d. `OUTPUT AKHIR`).

## 3. Daftar Seluruh Bagian Sesuai Urutan Aslinya
1. `# TOKO SAKALA — MODE A: FORENSIC UI/UX AUDIT & DESIGN BLUEPRINT` (baris 1–9)
2. `## 1. Tujuan fase` (baris 10–21)
3. `## 2. Temuan forensik awal dari paket sumber` (baris 22–85)
   - `### 2.1 Sumber aktif dan struktur` (baris 24–31)
   - `### 2.2 TOKO MODE tetap menjadi identitas aktif` (baris 32–48)
   - `### 2.3 Konflik dokumentasi dengan source aktif` (baris 49–55)
   - `### 2.4 Risiko integritas data / status sistem yang harus dipisahkan dari redesign` (baris 56–67)
   - `### 2.5 Ketidakkonsistenan desain yang terlihat` (baris 68–76)
   - `### 2.6 Uji teknis awal pada salinan ZIP` (baris 77–85)
4. `## 3. Riset referensi: bagaimana sumber digunakan` (baris 86–101)
5. `## 4. Prioritas referensi yang paling relevan untuk TOKO SAKALA` (baris 102–112)
6. `## 5. Kerangka audit seluruh aplikasi` (baris 113–146)
7. `## 6. Spesifikasi desain sistem terpadu yang harus dihasilkan` (baris 147–171)
   - `### Fondasi` (baris 151–159)
   - `### Komponen` (baris 160–164)
   - `### Interaction model` (baris 165–171)
8. `## 7. Kontrak perilaku yang wajib dijaga` (baris 172–186)
9. `## 8. Deliverable Mode A yang harus dibuat agent` (baris 187–203)
10. `## 9. Urutan kerja wajib untuk agent Google AI Studio` (baris 204–243)
11. `## 10. Referensi eksternal awal` (baris 244–265)
12. `# PROMPT UNTUK GOOGLE AI STUDIO — MODE A` (baris 266–275)
13. `## KONDISI KERJA MUTLAK` (baris 276–281)
14. `## IDENTITAS PRODUK YANG HARUS DIPERTAHANKAN` (baris 282–302)
15. `## RULES BISNIS DAN DATA — NON-NEGOTIABLE` (baris 303–317)
16. `## TEMUAN AWAL YANG WAJIB ANDA VERIFIKASI ULANG` (baris 318–330)
17. `## TUGAS 1 — FORENSIC SOURCE AUDIT` (baris 331–350)
18. `## TUGAS 2 — SCREEN-BY-SCREEN VISUAL AUDIT` (baris 351–365)
19. `## TUGAS 3 — RESEARCH APPS DAN DESIGN SYSTEM` (baris 366–381)
20. `## TUGAS 4 — SATU DESIGN SYSTEM FINAL` (baris 382–398)
21. `## TUGAS 5 — MODERN INTERACTIONS DENGAN ALTERNATIF` (baris 399–415)
22. `## TUGAS 6 — DELIVERABLES` (baris 416–433)
23. `## OUTPUT AKHIR` (baris 434–439)

## 4. Ringkasan Substantif Setiap Bagian (Format Wajib 6 Field)

- **Nama bagian:** `# TOKO SAKALA — MODE A: FORENSIC UI/UX AUDIT & DESIGN BLUEPRINT` (baris 1–9)
- **Inti pembahasan:** Header dokumen yang menetapkan konteks tanggal (13 Nov 2026), sumber awal (`toko-sakala.zip`), fase kerja (Mode A — Research & Design Blueprint), dan status belum adanya perubahan kode atau persetujuan implementasi.
- **Ketentuan yang harus dipertahankan:** Status fase murni audit/blueprint tanpa persetujuan implementasi.
- **Hubungannya dengan bagian lain:** Menjadi payung konteks untuk seluruh `§1`–`§10` serta template prompt di baris 266–439.
- **Dampaknya terhadap audit TOKO SAKALA:** Mengunci posisi awal audit bahwa setiap rekomendasi bersifat usulan blueprint yang harus disetujui pemilik sebelum Mode B.
- **Status pemahaman:** Terverifikasi

- **Nama bagian:** `## 1. Tujuan fase` (baris 10–21)
- **Inti pembahasan:** Menjelaskan sasaran Mode A berupa audit forensik menyeluruh dan satu rancangan UI/UX yang konsisten, dapat diuji, serta sesuai perilaku aplikasi nyata, berlandaskan prinsip inti *"Jangan membuat pengguna memahami sistem. Buat sistem yang memahami pengguna."*
- **Ketentuan yang harus dipertahankan:** Dilarang mengubah source code, mengaktifkan fitur baru, mengubah rumus bisnis, mengubah DB, atau melakukan redesign langsung pada Mode A. Hierarki prioritas wajib: kebenaran data → kejelasan → kemudahan operasi → hierarki → keseimbangan visual → estetika → motion.
- **Hubungannya dengan bagian lain:** Mengoperasionalkan `## KONDISI KERJA MUTLAK` dan membatasi seluruh tugas pada `§5`–`§9`.
- **Dampaknya terhadap audit TOKO SAKALA:** Memastikan estetika tidak pernah mengorbankan kebenaran angka dan alur pemula.
- **Status pemahaman:** Terverifikasi

- **Nama bagian:** `## 2. Temuan forensik awal dari paket sumber` & `### 2.1 Sumber aktif dan struktur` (baris 22–31)
- **Inti pembahasan:** Memaparkan struktur source aktif yang terpusat pada `src/App.tsx` (~8.234 baris) dan `src/styles.css` (~3.718 baris), tingginya inline styling (754 `style={{...}}`), kemunculan hex literal (`149` kemunculan / `43` unik di `App.tsx`; tercatat `95` unik di `styles.css`), keterbatasan `ModalForm.tsx` (Escape & auto-focus ada, namun focus trap/restore/SR belum terbukti), serta keberadaan banyak artefak pendukung.
- **Ketentuan yang harus dipertahankan:** Source React terbaru adalah dasar audit utama; prototipe HTML lama tidak boleh dianggap implementasi aktif.
- **Hubungannya dengan bagian lain:** Menjadi hipotesis awal untuk diverifikasi dalam `## TEMUAN AWAL YANG WAJIB ANDA VERIFIKASI ULANG` dan `## TUGAS 1`.
- **Dampaknya terhadap audit TOKO SAKALA:** Mengarahkan audit agar mengukur risiko token drift dan god-component monolith pada `App.tsx`. *(Catatan verifikasi aktual: `styles.css` kini 3.719 baris dengan 194 kemunculan / 86 nilai hex unik.)*
- **Status pemahaman:** Terverifikasi

- **Nama bagian:** `### 2.2 TOKO MODE tetap menjadi identitas aktif` (baris 32–48)
- **Inti pembahasan:** Menetapkan palet token inti TOKO MODE (`#FFFDF6`, `#F4F0E7`, `#20211F`, `#686A65`, `#DEDBD2`, `#FF5A1F`, `#D7FA4A`, `#2958E8`) dan melarang kebangkitan tema lama Field Ledger / Forest Green / Brass maupun penggantian identitas demi meniru aplikasi populer.
- **Ketentuan yang harus dipertahankan:** Palet TOKO MODE tidak boleh diganti tanpa keputusan pemilik; riset luar hanya mengambil pola interaksi, hierarki, dan struktur komponen.
- **Hubungannya dengan bagian lain:** Terhubung langsung ke `## IDENTITAS PRODUK YANG HARUS DIPERTAHANKAN`, `§6`, dan `DESIGN.md`/`G4_VISUAL_SYSTEM_v2.1.md`.
- **Dampaknya terhadap audit TOKO SAKALA:** Membatasi ruang desain pada penyempurnaan sistem TOKO MODE, bukan rebranding warna.
- **Status pemahaman:** Terverifikasi

- **Nama bagian:** `### 2.3 Konflik dokumentasi dengan source aktif` (baris 49–55)
- **Inti pembahasan:** Mengungkap kontradiksi bahwa `README.md`, `package.json`, dan dokumen status v0.5.1 mengklaim aplikasi hanya pratinjau tanpa simpan transaksi, sedangkan `src/App.tsx` aktif memanggil `executeSaveTransaction()` → `localIndexedDB.saveData()` + `outbox` + sync Supabase/Drive.
- **Ketentuan yang harus dipertahankan:** Tidak menganggap klaim preview-only sebagai fakta; namun fakta persistensi lokal juga tidak boleh dipakai untuk mengklaim aplikasi sudah siap/aman produksi.
- **Hubungannya dengan bagian lain:** Menjadi masukan inti Source of Truth Matrix dan bagian Security/Data Integrity.
- **Dampaknya terhadap audit TOKO SAKALA:** Memaksa pemisahan tegas antara dokumentasi usang dan perilaku runtime nyata.
- **Status pemahaman:** Terverifikasi

- **Nama bagian:** `### 2.4 Risiko integritas data / status sistem yang harus dipisahkan dari redesign` (baris 56–67)
- **Inti pembahasan:** Merinci 7 risiko teknis serius: (1) `SyncEngine.getStatus()` hardcode `pendingCount: 0` & `supabaseConnected` hanya cek config, (2) `handleDeleteRecord()` memotong array payload alih-alih append-only/koreksi, (3) `migrations/002` memakai RLS `USING (true) WITH CHECK (true)` + `GRANT ALL` ke `anon`/`authenticated`, (4) benturan arsitektur dokumen agregat `toko_documents` vs 9 tabel domain terpisah, (5) pesan UI tidak boleh mengaku server-confirmed saat hanya IndexedDB lokal yang tersimpan, (6) purchase handler memaksa `unit: 'pcs'`/`totalPieces`, dan (7) pemisahan data contoh vs data riil.
- **Ketentuan yang harus dipertahankan:** Masalah-masalah ini tidak boleh diperbaiki secara sepihak dalam Mode A; wajib dicatat sebagai **BLOCKER / keputusan lintas produk dan engineering**.
- **Hubungannya dengan bagian lain:** Berhubungan langsung dengan `§7`, `## RULES BISNIS`, `01_PRD`, `02_TRD`, dan `DECISION_REGISTER.md`.
- **Dampaknya terhadap audit TOKO SAKALA:** Menjamin audit UI juga memeriksa kejujuran badge/toast sistem dan memblokir klaim keamanan palsu.
- **Status pemahaman:** Terverifikasi

- **Nama bagian:** `### 2.5 Ketidakkonsistenan desain yang terlihat` (baris 68–76)
- **Inti pembahasan:** Mengidentifikasi penyimpangan React aktual (`.floating-dock` gelap dengan `backdrop-filter: blur`, gradien, tombol oranye glow) terhadap aturan G4 v2.1/`DESIGN.md` (solid 5-item bar dengan active lime), ketidaksamaan screenshot lama vs React terbaru, potensi masalah ukuran teks `9–11px`/safe-area/keyboard, serta deklarasi font `Plus Jakarta Sans`/`Roboto Mono` tanpa asset font di `index.html`.
- **Ketentuan yang harus dipertahankan:** Temuan visual awal berbasis rekaman/CSS tidak boleh diklaim sebagai hasil pengujian perangkat penuh sebelum runtime diukur; font final harus diuji offline.
- **Hubungannya dengan bagian lain:** Terhubung ke `§6`, `## TUGAS 2`, `## TUGAS 4`, dan `G4_VISUAL_SYSTEM_v2.1.md`.
- **Dampaknya terhadap audit TOKO SAKALA:** Menetapkan fokus pemeriksaan inkonsistensi visual, navigasi mobile, keterbacaan sub-12px, dan font loading nyata.
- **Status pemahaman:** Terverifikasi

- **Nama bagian:** `### 2.6 Uji teknis awal pada salinan ZIP` (baris 77–85)
- **Inti pembahasan:** Melaporkan hasil awal paket ZIP sebelumnya (`scan:secrets` PASS; `vitest` tidak terpasang; `tsc/vite build` gagal karena dependency & `ignoreDeprecations`; belum ada browser/device QA). Menetapkan aturan keras: jangan menulis PASS tanpa bukti eksekusi aktual.
- **Ketentuan yang harus dipertahankan:** Kejujuran pelaporan hasil uji dan pemisahan antara static pass vs runtime pass.
- **Hubungannya dengan bagian lain:** Terkait `§8` (`07_ACCESSIBILITY_RESPONSIVE_QA.md`) dan `§9` (Tahap 0 & Tahap 2).
- **Dampaknya terhadap audit TOKO SAKALA:** Pada workspace container saat ini `node_modules` tersedia sehingga `vitest` (85 tests) dan `tsc --noEmit` berhasil diverifikasi PASS, sedangkan Playwright Chromium masih tetap `NOT RUN`.
- **Status pemahaman:** Terverifikasi

- **Nama bagian:** `## 3. Riset referensi: bagaimana sumber digunakan` (baris 86–101)
- **Inti pembahasan:** Tabel metodologi pemanfaatan 9 jenis sumber (Mobbin, Figma Community/UI Kits, GitHub Skills, Threads, Square POS/Retail, Shopify POS, Loyverse POS, majoo, Apple HIG + WCAG 2.2) beserta aturan ketat anti-fabrikasi bila sumber tertutup login/paywall.
- **Ketentuan yang harus dipertahankan:** Jika Mobbin/Figma/Threads perlu login/paywall dan tidak dapat dibuka, wajib menulis `"tidak dapat diakses"` dan dilarang mengarang observasi; GitHub Skills bukan referensi UI; Threads hanya opini kualitatif; semua sumber wajib disertai URL dan tanggal pemeriksaan.
- **Hubungannya dengan bagian lain:** Berpasangan dengan `§4`, `§10`, dan `## TUGAS 3`.
- **Dampaknya terhadap audit TOKO SAKALA:** Mengamankan integritas metodologi riset referensi pada deliverable `04_REFERENCE_RESEARCH.md`.
- **Status pemahaman:** Terverifikasi

- **Nama bagian:** `## 4. Prioritas referensi yang paling relevan untuk TOKO SAKALA` (baris 102–112)
- **Inti pembahasan:** Menetapkan komposisi wajib minimal 6 produk pembanding berbasis kecocokan tugas (2–3 POS/retail, 1–2 finansial, 1 produk Indonesia, 1 design system/UI kit) dengan kolom pencatatan baku (nama/versi, platform, URL, tanggal, screenshot/flow aktual, pola, batasan, keputusan adaptasi/tolak).
- **Ketentuan yang harus dipertahankan:** Minimal 6 pembanding relevan yang benar-benar diverifikasi, bukan daftar nama populer tanpa konteks tugas.
- **Hubungannya dengan bagian lain:** Menjadi standar struktur untuk `04_REFERENCE_RESEARCH.md` dan `## TUGAS 3`.
- **Dampaknya terhadap audit TOKO SAKALA:** Memfokuskan riset ke alur inventori multi-unit, hitung stok massal, setoran tunai, dan standar aksesibilitas.
- **Status pemahaman:** Terverifikasi

- **Nama bagian:** `## 5. Kerangka audit seluruh aplikasi` (baris 113–146)
- **Inti pembahasan:** Mendaftar minimal 14 area layar/state wajib (App shell/nav/rail, Beranda, Catat/hub, Catat belanja & keranjang, Katalog, Cek sisa stok massal/per produk, Setoran karyawan, Biaya & pemasukan lain, Laporan & periode, Riwayat & koreksi/hapus, Asisten OFF, Pengaturan/sync/backup, semua modal/sheet/edge states, desktop & breakpoint menengah) serta 10 butir anatomi audit per layar.
- **Ketentuan yang harus dipertahankan:** Dilarang mengarang ukuran piksel dari screenshot; elemen yang belum bisa diukur harus ditandai `"perlu diukur dari render"`.
- **Hubungannya dengan bagian lain:** Menentukan struktur rinci `02_SCREEN_INVENTORY.md`, `03_SCREEN_AUDIT.md`, dan `## TUGAS 2`.
- **Dampaknya terhadap audit TOKO SAKALA:** Memastikan screen sekunder (`biaya`, `laporan`, `riwayat`, `barang`, `pengaturan`, modal-modal, serta dead screen `asisten`) tidak terlewat dari audit.
- **Status pemahaman:** Terverifikasi

- **Nama bagian:** `## 6. Spesifikasi desain sistem terpadu yang harus dihasilkan` (baris 147–171)
- **Inti pembahasan:** Merinci kebutuhan satu sumber kebenaran design system yang terdiri dari tiga sub-bagian:
  - `### Fondasi` (baris 151–159): color tokens + dark-theme, typography + fallback offline, spacing scale, geometry/radius/elevation, icon family/stroke, motion + reduced-motion, 7 breakpoints (`320, 360, 390, 430, 768, 1024, 1440`).
  - `### Komponen` (baris 160–164): daftar lengkap 25+ komponen (buttons, numeric/Rupiah input, stepper, segmented control, stock count row, setoran comparison, nav, sheet, toast, report table, dll.) lengkap dengan anatomy hingga keyboard & accessibility name.
  - `### Interaction model` (baris 165–171): tap sebagai interaksi utama; gesture hanya shortcut tambahan yang wajib punya alternatif tombol terlihat, threshold jelas, bebas bentrok edge OS, dan tidak pernah memicu commit finansial tanpa review/konfirmasi.
- **Ketentuan yang harus dipertahankan:** Satu sistem tunggal lintas semua layar; zero gesture-only delete/commit; WCAG 2.2 target & dragging movement alternatives.
- **Hubungannya dengan bagian lain:** Menjadi cetak biru untuk `05_DESIGN_SYSTEM_SPEC.md`, `06_INTERACTION_STATE_MAP.md`, `## TUGAS 4`, dan `## TUGAS 5`.
- **Dampaknya terhadap audit TOKO SAKALA:** Membongkar ketidakkonsistenan 754 inline styles, 173+56 sub-12px font size, dan perbedaan gaya antar halaman di `App.tsx`.
- **Status pemahaman:** Terverifikasi

- **Nama bagian:** `## 7. Kontrak perilaku yang wajib dijaga` (baris 172–186)
- **Inti pembahasan:** Mengunci 12 aturan kontrak perilaku lintas UI, engine, dan data (Preview ≠ persisted, satu engine tunggal, pemisahan penjualan vs diterima vs kas vs setoran, modal unknown = `null`, blank ≠ `0`, isolasi unit fisik, konversi kemasan eksplisit, master produk terpisah dari pembelian, periode tertutup append-only/koreksi, sample data jelas terpisah, AI/OCR/API key/telemetry OFF, tidak mengganti arsitektur/engine/SQL sebagai redesign visual).
- **Ketentuan yang harus dipertahankan:** Semua 12 poin bersifat mutlak; pelanggaran oleh implementasi saat ini wajib dilaporkan sebagai defect kritis.
- **Hubungannya dengan bagian lain:** Dipertegas ulang pada `## RULES BISNIS DAN DATA — NON-NEGOTIABLE` dan `AGENTS.md`/`DECISION_REGISTER.md`.
- **Dampaknya terhadap audit TOKO SAKALA:** Memberi tolok ukur lulus/gagal objektif untuk mengaudit `Untung Kotor`/`Untung Bersih`, `engineBridge`, `parseRupiahInput`, dan `handleDeleteRecord`.
- **Status pemahaman:** Terverifikasi

- **Nama bagian:** `## 8. Deliverable Mode A yang harus dibuat agent` (baris 187–203)
- **Inti pembahasan:** Menetapkan 10 file deliverable di `docs/audit-mode-a/` (`00_AUDIT_EXECUTIVE_SUMMARY.md` hingga `09_MODE_B_IMPLEMENTATION_PLAN.md`) beserta standar pencantuman bukti (file + line range, command + output, screenshot + viewport, URL + tanggal).
- **Ketentuan yang harus dipertahankan:** Jangan menimpa dokumen lama; jangan menulis PASS tanpa bukti. *(Catatan: pada sesi ini user memerintahkan penulisan `/docs/audit/MODE_A_DOCUMENT_INGESTION_REPORT.md` terlebih dahulu dan berhenti sebelum membuat `docs/audit-mode-a/`.)*
- **Hubungannya dengan bagian lain:** Menghubungkan `§9` (Tahap 5) dan `## TUGAS 6`.
- **Dampaknya terhadap audit TOKO SAKALA:** Menjadi struktur resmi paket blueprint lengkap apabila owner menyetujui lanjutan Mode A penuh.
- **Status pemahaman:** Terverifikasi

- **Nama bagian:** `## 9. Urutan kerja wajib untuk agent Google AI Studio` (baris 204–243)
- **Inti pembahasan:** Menetapkan 6 tahap berurutan: `Tahap 0 — Read-only setup`, `Tahap 1 — Source map dan real behavior`, `Tahap 2 — Run existing app safely`, `Tahap 3 — Reference research`, `Tahap 4 — Audit & synthesis`, dan `Tahap 5 — Handoff` (tulis deliverable, daftar keputusan owner, laporkan kritis dahulu, **berhenti total**).
- **Ketentuan yang harus dipertahankan:** Urutan baca-dulu-baru-sintesis, larangan modifikasi kode/paket, penggunaan fixture eksplisit, dan hard-stop setelah handoff.
- **Hubungannya dengan bagian lain:** Merangkai `§1`–`§8` menjadi SOP eksekusi berurutan.
- **Dampaknya terhadap audit TOKO SAKALA:** Menjadi dasar struktur `DELIVERABLE 5 — MODE A EXECUTION PLAN`.
- **Status pemahaman:** Terverifikasi

- **Nama bagian:** `## 10. Referensi eksternal awal` (baris 244–265)
- **Inti pembahasan:** Daftar awal 15 URL sumber resmi (diperiksa 13 Nov 2026): Google AI Studio Build, Mobbin, Figma Community/UI kits, GitHub Skills, Threads Communities, Apple HIG Gestures & Accessibility, WCAG 2.2, Square POS stock & cycle counts, Shopify POS inventory counts (28 Sep 2026), Loyverse POS features & inventory history, serta majoo inventory.
- **Ketentuan yang harus dipertahankan:** URL referensi tidak otomatis dianggap terbaca penuh jika terhalang login/akses; validasi aktual tetap wajib pada tahap riset.
- **Hubungannya dengan bagian lain:** Mendukung tabel `§3`, `§4`, dan `## TUGAS 3`.
- **Dampaknya terhadap audit TOKO SAKALA:** Menyediakan titik awal riset eksternal yang valid dan bebas dari situs blog SEO generik.
- **Status pemahaman:** Terverifikasi

- **Nama bagian:** `# PROMPT UNTUK GOOGLE AI STUDIO — MODE A` (baris 266–275)
- **Inti pembahasan:** Bagian pembuka prompt operasional yang mendefinisikan persona multi-disiplin agent (Principal Product Designer, UX Researcher, Design Systems Architect, Frontend Auditor, Accessibility Specialist, QA Analyst) dalam proyek TOKO SAKALA.
- **Ketentuan yang harus dipertahankan:** Lingkup peran dan target fase tetap **MODE A: FORENSIC UI/UX AUDIT & DESIGN BLUEPRINT**.
- **Hubungannya dengan bagian lain:** Memasuki bagian instruksional operasional dari dokumen.
- **Dampaknya terhadap audit TOKO SAKALA:** Mengharuskan audit menyatukan perspektif UX, kode aktual, aksesibilitas, dan QA.
- **Status pemahaman:** Terverifikasi

- **Nama bagian:** `## KONDISI KERJA MUTLAK` (baris 276–281)
- **Inti pembahasan:** Menegaskan larangan mutlak mengedit kode, rename, delete, refactor, install package, ganti framework/DB/engine, atau commit/push. Membolehkan pembuatan dokumen audit hanya di folder audit (atau tampilkan di chat bila dibatasi), melarang redesign dari screenshot semata, serta melarang klaim inspeksi Mobbin/Figma/Threads atau browser bila tidak benar-benar diakses.
- **Ketentuan yang harus dipertahankan:** Zero code mutation + kejujuran epistemik penuh.
- **Hubungannya dengan bagian lain:** Mengunci batas kerja seluruh Mode A.
- **Dampaknya terhadap audit TOKO SAKALA:** Memastikan laporan saat ini tidak menyentuh `src/`, `migrations/`, `tests/`, atau `package.json`.
- **Status pemahaman:** Terverifikasi

- **Nama bagian:** `## IDENTITAS PRODUK YANG HARUS DIPERTAHANKAN` (baris 282–302)
- **Inti pembahasan:** Mengulang dan memadatkan identitas pemula non-akuntan, bahasa Indonesia alami tanpa bertele-tele, seluruh nilai hex palet TOKO MODE (`#FFFDF6`, `#F4F0E7`, `#20211F`, `#686A65`, `#DEDBD2`, `#FF5A1F`, `#D7FA4A`, `#2958E8`), dan penolakan tema Field Ledger maupun peniruan brand luar.
- **Ketentuan yang harus dipertahankan:** Identitas TOKO MODE tidak boleh diubah sepihak.
- **Hubungannya dengan bagian lain:** Penegasan operasional dari `§2.2`.
- **Dampaknya terhadap audit TOKO SAKALA:** Menjadi kriteria evaluasi visual pada `TUGAS 4`.
- **Status pemahaman:** Terverifikasi

- **Nama bagian:** `## RULES BISNIS DAN DATA — NON-NEGOTIABLE` (baris 303–317)
- **Inti pembahasan:** Daftar bernomor 1–12 yang mengulang kontrak perilaku `§7` dalam bentuk aturan keras (termasuk poin 12: jika ada konflik dengan aturan bisnis terkunci, dokumentasikan untuk keputusan pemilik alih-alih mengubah rumus).
- **Ketentuan yang harus dipertahankan:** Semua 12 aturan tidak boleh dilanggar.
- **Hubungannya dengan bagian lain:** Cerminan langsung `§7` dan `AGENTS.md`.
- **Dampaknya terhadap audit TOKO SAKALA:** Menjadi dasar penyusunan `CRITICAL ISSUE REGISTER` dan `OPEN QUESTIONS`.
- **Status pemahaman:** Terverifikasi

- **Nama bagian:** `## TEMUAN AWAL YANG WAJIB ANDA VERIFIKASI ULANG` (baris 318–330)
- **Inti pembahasan:** Daftar 10 hipotesis/temuan dari audit paket sebelumnya (persistensi `executeSaveTransaction` vs README, `pendingCount: 0`, `supabaseConnected`, `handleDeleteRecord`, RLS `migrations/002`, `toko_documents` vs tabel relasional, `unit: 'pcs'` pada belanja, `.floating-dock` glassmorphism vs G4, screenshot lama usang, dan ketersediaan font `Plus Jakarta Sans`/`Roboto Mono`).
- **Ketentuan yang harus dipertahankan:** Semua 10 poin tidak boleh diterima mentah-mentah — wajib diverifikasi ulang langsung ke source dan dibuktikan baris/simbolnya.
- **Hubungannya dengan bagian lain:** Memberi daftar periksa verifikasi forensik untuk `TUGAS 1` & `TUGAS 2`.
- **Dampaknya terhadap audit TOKO SAKALA:** Seluruh 10 poin tersebut berhasil diverifikasi langsung dalam sesi ini (lihat Bagian 6 & Deliverable 4).
- **Status pemahaman:** Terverifikasi

- **Nama bagian:** `## TUGAS 1 — FORENSIC SOURCE AUDIT` (baris 331–350)
- **Inti pembahasan:** Memerintahkan pembacaan menyeluruh kode & spec, pembuatan source map penuh (screen, modal, sheet, action, handler), penelusuran jalur click→state→IndexedDB/outbox→cloud, kecocokan copy toast vs hasil nyata, serta berburu dead button, link buntu, placeholder, angka palsu, fake sync, dan fake AI.
- **Ketentuan yang harus dipertahankan:** Pelacakan end-to-end handler hingga storage/network serta audit kejujuran pesan UI.
- **Hubungannya dengan bagian lain:** Penjabaran detail dari `§9 Tahap 1`.
- **Dampaknya terhadap audit TOKO SAKALA:** Berhasil menemukan antara lain dead screen `'asisten'`, fake `"Tersinkron"`/`pendingCount: 0`, Laporan yang mengabaikan picker periode, dan `Dual Supabase Client`.
- **Status pemahaman:** Terverifikasi

- **Nama bagian:** `## TUGAS 2 — SCREEN-BY-SCREEN VISUAL AUDIT` (baris 351–365)
- **Inti pembahasan:** Memerintahkan audit visual detail tiap screen (urutan konten, dimensi, token warna/radius/border/shadow, tipografi, ikon, target sentuh, whitespace, keyboard/safe-area/sticky, 7 viewport `320–1440 px`, zoom 200%, serta teks Indonesia dan nominal Rupiah panjang).
- **Ketentuan yang harus dipertahankan:** Tidak mengarang ukuran piksel bila tidak ada render browser yang bisa diukur.
- **Hubungannya dengan bagian lain:** Penjabaran `§5` dan `§9 Tahap 2`.
- **Dampaknya terhadap audit TOKO SAKALA:** Mengidentifikasi keterbatasan lingkungan sandbox (Playwright belum berjalan) sehingga ukuran render ditandai `NEEDS RUNTIME TEST`.
- **Status pemahaman:** Terverifikasi

- **Nama bagian:** `## TUGAS 3 — RESEARCH APPS DAN DESIGN SYSTEM` (baris 366–381)
- **Inti pembahasan:** Memerintahkan riset ≥6 produk pembanding berbasis kecocokan tugas dan matrix standar: `Reference → observed pattern → user problem solved → fit for TOKO SAKALA → adapt/reject → reason`.
- **Ketentuan yang harus dipertahankan:** Hanya klaim layar yang benar-benar diakses + sertakan URL & tanggal + jujur terhadap batas login/paywall.
- **Hubungannya dengan bagian lain:** Operasionalisasi `§3` dan `§4`.
- **Dampaknya terhadap audit TOKO SAKALA:** Terjadwal dalam Execution Plan sebelum tahap finalisasi komponen Mode A.
- **Status pemahaman:** Terverifikasi

- **Nama bagian:** `## TUGAS 4 — SATU DESIGN SYSTEM FINAL` (baris 382–398)
- **Inti pembahasan:** Memerintahkan penetapan satu sistem visual terpadu secara numerik (warna primitive/semantic/dark, tipografi + fallback, spacing, radius/shadow, ikon, motion/reduced-motion, 25+ komponen UI dengan contoh pemakaian per screen).
- **Ketentuan yang harus dipertahankan:** Konsistensi total lintas halaman dan memperkuat TOKO MODE.
- **Hubungannya dengan bagian lain:** Operasionalisasi `§6`.
- **Dampaknya terhadap audit TOKO SAKALA:** Menggantikan 754 inline styles & token inkonsisten saat nanti memasuki Mode B.
- **Status pemahaman:** Terverifikasi

- **Nama bagian:** `## TUGAS 5 — MODERN INTERACTIONS DENGAN ALTERNATIF` (baris 399–415)
- **Inti pembahasan:** Mengatur proposal gesture modern (swipe, long-press, drag, pull-to-refresh, sheet gesture) beserta syarat 9 parameter keamanan per gesture (objek, threshold, feedback pra-commit, batal, reversible, tombol alternatif setara, keyboard/assistive tech, bentrok navigasi OS).
- **Ketentuan yang harus dipertahankan:** Larangan mutlak swipe-only delete, drag-only reorder, atau gesture-only financial commit.
- **Hubungannya dengan bagian lain:** Operasionalisasi `§6 Interaction model` dan WCAG 2.2/Apple HIG.
- **Dampaknya terhadap audit TOKO SAKALA:** Memastikan setiap pola modern ala aplikasi mobile native tetap aman untuk pemilik toko & aksesibilitas.
- **Status pemahaman:** Terverifikasi

- **Nama bagian:** `## TUGAS 6 — DELIVERABLES` (baris 416–433)
- **Inti pembahasan:** Menetapkan daftar 10 file deliverable (`00`–`09`), skema severity (`CRITICAL/HIGH/MEDIUM/LOW`), skema status verifikasi (`VERIFIED / NEEDS RUNTIME TEST / NEEDS OWNER DECISION / BLOCKED`), serta kewajiban acceptance criteria.
- **Ketentuan yang harus dipertahankan:** Tidak mengubah source dan tidak masuk Mode B.
- **Hubungannya dengan bagian lain:** Pengulangan operasional dari `§8`.
- **Dampaknya terhadap audit TOKO SAKALA:** Menjadi standar pelabelan seluruh issue di Deliverable 4 laporan ini.
- **Status pemahaman:** Terverifikasi

- **Nama bagian:** `## OUTPUT AKHIR` (baris 434–439)
- **Inti pembahasan:** Menetapkan urutan penyajian jawaban akhir ke user (ringkasan temuan kritis lebih dulu → tautan/tampilan blueprint → daftar keputusan owner → **berhenti total** tanpa implementasi/edit/commit/push).
- **Ketentuan yang harus dipertahankan:** Mode A berakhir saat blueprint lengkap dan siap direview owner.
- **Hubungannya dengan bagian lain:** Menutup `§9 Tahap 5`.
- **Dampaknya terhadap audit TOKO SAKALA:** Menentukan struktur respons chat akhir pada sesi ini.
- **Status pemahaman:** Terverifikasi

## 5. Aturan Wajib yang Tidak Boleh Dilanggar
1. **Zero Code Mutation in Mode A:** Dilarang edit/refactor/delete source code, CSS, SQL, package, framework, atau business logic.
2. **TOKO MODE Visual Lock:** Hanya `#FFFDF6`, `#F4F0E7`, `#20211F`, `#686A65`, `#DEDBD2`, `#FF5A1F`, `#D7FA4A`, `#2958E8` + semantic tokens aktif; larangan keras menghidupkan Field Ledger / Forest Green / Brass.
3. **Strict Epistemic Honesty:** Tidak mengklaim PASS jika test/build/browser tidak berjalan; tidak mengarang ukuran piksel tanpa render nyata; tidak mengarang hasil inspeksi situs di balik login/paywall.
4. **12 Non-Negotiable Data & Business Rules:** Preview ≠ saved, 1 engine murni tunggal, 3 dunia terpisah (`BARANG`, `HASIL`, `UANG` — penjualan ≠ uang diterima ≠ kas ≠ setoran), modal unknown = `null` (bukan 0), kosong ≠ `0`, isolasi unit fisik (`pcs`/`kg`/`liter`/`porsi` dilarang dijumlah), konversi kemasan eksplisit, katalog terpisah dari pembelian, periode tertutup tidak boleh berubah diam-diam, data contoh terpisah jelas, AI/OCR/API key/telemetry tetap OFF, dan tidak mengubah rumus terkunci demi kemudahan UI.
5. **Accessibility & Safe Interactions:** Tap utama; setiap gesture harus memiliki alternatif tombol terlihat; zero financial commit otomatis lewat gesture; dukung keyboard, zoom 200%, dan `prefers-reduced-motion`.

## 6. Hasil Verifikasi Teknis atas 10 Temuan Awal (`TOKO_SAKALA_MODE_A` baris 318–330)
1. **Persistensi `executeSaveTransaction()` vs `README` (`VERIFIED`)**: Dikonfirmasi di `src/App.tsx:629–673` — 14 call site memanggil `executeSaveTransaction`, menyimpan ke IndexedDB (`localIndexedDB.saveData`), mengantrekan mutasi outbox, lalu mencoba sinkronisasi otomatis ke Supabase/Google Drive. Dokumen `README.md` & `IMPLEMENTATION_STATUS_v0.5.1.md` ketinggalan zaman/kontradiktif.
2. **`SyncEngine.getStatus()` `pendingCount: 0` (`VERIFIED`)**: Dikonfirmasi verbatim di `src/storage/syncEngine.ts:80–89` baris 84 (`pendingCount: 0` statis!). Status outbox nyata (`getPendingMutations()`) hanya dibaca saat `syncNow()` (baris 131), tidak pernah terefleksi di `getStatus()`.
3. **`supabaseConnected` hanya cek config (`VERIFIED`)**: `syncEngine.ts:87` memanggil `this.cloudAdapter.isConfigured()` yang hanya mengecek URL + anon key + client terinstansiasi, bukan autentikasi owner (`supabaseClient.ts` terpisah) ataupun koneksi network. Akibatnya `App.tsx:1943–1945` & `1986–1988` menampilkan `"Tersinkronisasi"` / `"Tersinkron"` hijau meski belum pernah auth atau push.
4. **`handleDeleteRecord()` memotong array payload (`VERIFIED`)**: Dikonfirmasi di `src/App.tsx:703–721` (`filter(r => r.id !== recordId)`) dan diekspos sebagai `deleteAction` di Detail Modal dari Beranda (`2800`) dan Riwayat (`5030, 5125`). Ini melanggar kebijakan append-only & closed-period reversal.
5. **RLS `migrations/002_create_domain_tables.sql` (`VERIFIED`)**: Baris `133–154` mengimplementasikan `FOR ALL USING (true) WITH CHECK (true)` dan `GRANT ALL ... TO anon, authenticated, service_role` pada 9 tabel domain — sama sekali **sama terbukanya** di `migrations/001_create_toko_documents.sql:50–64`. Ini adalah **CRITICAL SECURITY BLOCKER**.
6. **Skema `toko_documents` vs tabel relasional (`VERIFIED`)**: `SupabaseAdapter` hanya membaca/menulis blob JSON ke `toko_documents` dan `toko_backups` (`migrations/001`). 9 tabel di `migrations/002` tidak pernah disentuh kode app, dan lebih jauh lagi ada file `supabase/migrations/20261022000100_initial_schema.sql` (24 tabel append-only dengan trigger `ts_reject_mutation()` & RLS ketat) yang juga yatim/tidak dipakai oleh `SupabaseAdapter`.
7. **Satuan `'pcs'` hardcoded saat pembelian (`VERIFIED`)**: Dikonfirmasi di `src/App.tsx:852, 909, 1045, 1273` serta label `/pcs` di Laporan (`4453, 4793`), meskipun katalog memiliki item non-pcs (`Telur Ayam Negeri` dengan `unit: 'Kg'`).
8. **`.floating-dock` glassmorphism vs G4 (`VERIFIED`)**: `src/styles.css:3038–3160` menerapkan `background: rgba(32, 33, 31, 0.94)`, `backdrop-filter: blur(28px)`, serta tombol tengah oranye bercahaya, bertabrakan dengan `DESIGN.md` & `G4_VISUAL_SYSTEM_v2.1.md`.
9. **Screenshot lama vs React source terkini (`VERIFIED`)**: `docs/redesign/screenshots/*.png` tidak merepresentasikan `.floating-dock` atau perubahan terkini di `App.tsx`.
10. **Font `Plus Jakarta Sans` & `Roboto Mono` (`VERIFIED STATICALLY`)**: `index.html` (17 baris) tidak memuat stylesheet font eksternal dan hasil scan `src/styles.css` menghasilkan **0 aturan `@font-face`**. Belum ada bukti file font lokal di bundle; browser jatuh ke font sistem (`NEEDS RUNTIME TEST` untuk font terender aktual).

## 7. Konflik & Ambiguitas Tambahan yang Ditemukan Selama Pembacaan
- **Path dokumen Mode A:** Prompt meminta `docs/TOKO_SAKALA_MODE_A_AUDIT_AND_PROMPT.md` (tidak ada); file aktual adalah `/TOKO_SAKALA_MODE_A_AUDIT_AND_PROMPT (1).md`.
- **Metrik statis yang berevolusi sejak salinan ZIP awal:**
  - `TOKO_SAKALA_MODE_A_AUDIT_AND_PROMPT (1).md` §2.1 mencatat ~`95` hex unik di `styles.css` dan §2.6 mencatat `vitest` & `build` gagal karena `node_modules` kosong.
  - Pada workspace saat ini: `styles.css` memiliki `3.719` baris, `194` kemunculan hex (`86` unik), `11` `backdrop-filter`, `56` font-size `<12px`; `App.tsx` memiliki `8.235` baris, `754` inline `style={{...}}`, `149` hex (`43` unik), `173` inline font-size `<12px`; `vitest` & `tsc` kini terpasang dan lulus (`18 files, 85 tests`).
- **Klaim historis keliru di `HASIL AUDIT.md`:** `HASIL AUDIT.md:452` menuliskan `migrations/002` mendefinisikan `cost_per_pack NUMERIC NULL`, padahal pembacaan langsung `migrations/002_create_domain_tables.sql:14` membuktikan kolomnya adalah `cost_per_pack numeric NOT NULL DEFAULT 0`.
- **Instruksi scope sesi ini vs §8 Dokumen:** `§8`/`TUGAS 6` mencantumkan 10 dokumen di `docs/audit-mode-a/`, sedangkan instruksi user di awal fase meminta pembuatan **Master Document Ingestion, Understanding & Verification Report** ini (`/docs/audit/MODE_A_DOCUMENT_INGESTION_REPORT.md`) dan **berhenti** untuk review owner sebelum melangkah ke 10 dokumen `docs/audit-mode-a/` atau Mode B.

## 8. Hal yang Belum Dapat Diverifikasi di Sesi Ini
1. Screenshot & metrik piksel aktual pada `320, 360, 390, 430, 768, 1024, 1440` CSS px (Playwright Chromium binary absen di container).
2. Overlap virtual keyboard mobile dengan `.floating-dock`, `scroll-into-view`, `env(safe-area-inset-bottom)`, fokus trap 18 inline modal, dan zoom 200% di browser nyata.
3. Kondisi aktual database & RLS live pada instance Supabase `dvznpniodskujfbdznnv.supabase.co` serta alur OAuth Google Drive client live.
4. Sisa baris inline modal di `src/App.tsx` baris `5751–6950` (modal pengaturan/riwayat detail) belum diaudit baris demi baris di luar pemetaan `useState`/handler.
5. Layar di balik paywall/login Mobbin, Figma Community files interaktif, dan utas lengkap Threads (`NOT ACCESSED`).

## 9. Pernyataan Kejujuran Pembacaan
**Seluruh 439 baris dokumen `/TOKO_SAKALA_MODE_A_AUDIT_AND_PROMPT (1).md` telah berhasil dibaca secara utuh, berurutan, dan diverifikasi terhadap isi source code serta spesifikasi proyek tanpa ada bagian yang dilewati atau diasumsikan.**

---

# DELIVERABLE 2 — PROJECT UNDERSTANDING MAP

```
[PEMILIK TOKO (Pemula Non-Akuntan)]
        │
        ▼ (Mencatat kejadian sederhana pada UI React - src/App.tsx [8.235 baris])
┌──────────────────────────────────────────────────────────────────────────────┐
│ LAYER UI & INPUT DRAFT (10 Screen Aktif + 1 Dead Screen 'asisten' + 18 Modal) │
│ • Beranda (`beranda`), Catat Belanja (`catat`), Cek Stok (`stok`),           │
│   Setoran (`setoran`), Biaya & Pemasukan (`biaya`), Laporan (`laporan`),     │
│   Riwayat (`riwayat`), Alat Toko (`lainnya`), Katalog (`barang`),            │
│   Pengaturan (`pengaturan`) — [BUG: 'asisten' punya header, 0 body JSX]     │
└───────┬───────────────────────────────────────────────┬──────────────────────┘
        │ Preview UI (`src/engine/v1/*-preview.ts` terisolasi; │ Commit (`executeSaveTransaction`)
        │ `engineBridge.ts` + `src/domain/event.ts`)          ▼
┌───────▼───────────────────────────┐   ┌──────────────────────────────────────┐
│ LAYER KALKULASI (DUAL ENGINE!)    │   │ LAYER PERSISTENSI & SYNC (REAL DB!)  │
│ 1. `src/engine/v1/calculate.ts`   │   │ 1. `localStorage` (tema, sumber uang,│
│    (`runStoreFinancialEngine`)    │   │    device_id, Supabase runtime creds)│
│    → dipakai `storeSummary`       │   │ 2. `IndexedDBAdapter` (`toko_documents│
│ 2. `src/engine/v1/engineBridge.ts`│   │    + `outbox_queue` + SHA-256)       │
│    (`calculatePeriodSummary`)     │   │ 3. `SyncEngine` → `SupabaseAdapter`  │
│    → hitung ulang sendiri untuk   │   │    (blob JSON ke `toko_documents`)   │
│      Beranda 2×2; DIABAIKAN oleh  │   │    [TERPISAH dari `supabaseClient.ts`│
│      seluruh card `Laporan`!      │   │     yang pegang auth Magic Link OTP] │
└───────────────────────────────────┘   │ 4. `GoogleDriveAdapter` (jika auth)  │
                                        └──────────────────┬───────────────────┘
                                                           │
        ┌──────────────────────────────────────────────────┴───────────────────┐
        │ SCHEMA CLOUD YANG TERPECAH (3 Jalur SQL Tidak Selaras)               │
        │ • `migrations/001`: `toko_documents`, `toko_backups` (DIPAKAI UI,    │
        │   tapi RLS `USING (true)` + `GRANT ALL TO anon`)                     │
        │ • `migrations/002`: 9 tabel domain (TIDAK DIPAKAI, RLS terbuka,      │
        │   `cost_per_pack NOT NULL DEFAULT 0`)                                │
        │ • `supabase/migrations/20261022000100`: 24 tabel append-only +       │
        │   `ts_reject_mutation()` + owner RLS (YATIM / ORPHANED)              │
        └──────────────────────────────────────────────────────────────────────┘
```

### Pemetaan Tiga Dunia Keuangan vs Implementasi Aktual
| Dunia Konsep (Terkunci di `DECISION_REGISTER.md` & `01_PRD.md`) | Sumber Data / Event | Implementasi Aktual & Kesenjangan |
|---|---|---|
| **1. DUNIA BARANG (Fisik per Unit)** | `CatalogProduct`, `PurchaseRecord`, `StockMovement` (`CHECK_ADJUSTMENT`, `LOSS_DAMAGE`, `LOSS_UNKNOWN`) | `src/engine/v1/stock-check-preview.ts` sudah memisahkan `remainingByUnit`; **TETAPI** `src/App.tsx` (lines `852, 909, 1045, 1273`) masih menuliskan `unit: 'pcs'` dan teks `/pcs` untuk produk yang unit dasarnya bisa `'Kg'`/`'botol'`/`'porsi'`. (Selain itu per **NOD-05**, metode penilaian modal resmi adalah **Moving Average**, sedangkan kode & golden test saat ini menyimpang ke `Latest Unit Cost` dan `calculate.ts:141–143` menggabungkan unit unknown ke known.) |
| **2. DUNIA HASIL (Kinerja Usaha)** | Penjualan tersirat dari stok terjual (`sold × sellingPrice`), diskon, harga modal terjual (COGS), rugi rusak, pengeluaran, pemasukan lain | **KONFLIK KRITIS TERMINOLOGI:** `App.tsx` (`2479, 2652, 4524, 4596`) melabeli *"Untung Kotor"* sebagai `Penjualan − Diskon` (omzet bersih sebelum modal!), lalu *"Untung Bersih"* sebagai `Untung Kotor − Pengeluaran + Pemasukan Lain` (mengabaikan modal & rugi rusak!), dan meletakkan COGS terpisah di *"Laba Setelah Modal"* (`4621`). Ini membalik rumus `01_PRD.md:88` & `DR-016`. |
| **3. DUNIA UANG (Kas & Setoran)** | `DepositRecord` (`expectedAmount`, `receivedAmount`, selisih, lembaran uang, ambil pribadi `cashWithdrawals`), sumber uang belanja (`STORE_DRAWER` / `NET_PROFIT` / `PERSONAL`), biaya | `parseRupiahInput("")` menghasilkan `0` (`App.tsx:130–131`), menyebabkan menghapus input `Hitung Fisik` di layar Setoran menjadikan `receivedAmountInput = 0` dan `isCashCounted = true` alih-alih `null` (`3826–3829, 3957–3960`). Di Hero `App.tsx:214`, `receivedAmount` fallback ke `expectedAmount`. |

### Inventori Layar & Modal Aktual (`src/App.tsx`)
- **Primary Tabs (5 item di `.floating-dock` & desktop rail):** `beranda`, `catat`, `stok`, `setoran`, `lainnya`.
- **Sub-screens (`currentScreen`):** `biaya`, `laporan`, `riwayat`, `barang`, `pengaturan`, serta route yatim **`asisten`** (`type Screen` line `50`, header line `2046`, **0 render JSX body**).
- **18 State Modal / Bottom Sheet / Dialog:** ditemukan di `App.tsx` (termasuk detail timeline/riwayat, tambah/edit produk, edit biaya/setoran, konfirmasi hapus data contoh, restore backup, konfigurasi Supabase/Drive, kerusakan stok, tarik pribadi, info/tooltip formula, modal custom purchase, dll.) — sebagian besar **tidak** memakai `ModalForm.tsx`.

---

# DELIVERABLE 3 — SOURCE OF TRUTH MATRIX

## A. Klasifikasi Status Dokumen & Artefak Proyek

| Kategori Status | Dokumen / Artefak | Catatan Otoritas |
|---|---|---|
| **1. Keputusan Aktif & Terkunci (LOCKED)** | `AGENTS.md`, `DESIGN.md`, `docs/DECISION_REGISTER.md`, `docs/redesign/G3_SCREEN_BLUEPRINT_v2.1.md`, `G4_VISUAL_SYSTEM_v2.1.md`, `G5_IMPLEMENTATION_QA_v2.1.md`, `TOKO_SAKALA_MODE_A_AUDIT_AND_PROMPT (1).md` (§1, §2.2, §7, Rules 1–12) | Mengikat mutlak atas aturan produk, TOKO MODE palette, AI OFF, dan aturan 3 dunia keuangan. |
| **2. Spesifikasi Produk & Arsitektur Berlaku** | `docs/specs/01_PRD.md`, `02_TRD.md`, `03_ARCHITECTURE.md`, `05_APPFLOW.md`, `13_BACKEND_SCHEMA.md`, `17_ALUR_CEK_SISA_SEKALIGUS.md`, `18_REPORTING_EXPORT_SPEC.md`, `docs/specs/DECISION_REGISTER.md` | Menetapkan alur bisnis target (satu engine, append-only, period closing, strict DB/RLS). Sebagian belum terimplementasi di React/SQL saat ini. |
| **3. Implementasi Aktual (Ground Truth Perilaku Runtime)** | `src/App.tsx`, `src/styles.css`, `src/engine/*`, `src/domain/*`, `src/storage/*`, `src/auth/*`, `migrations/001`, `migrations/002`, `supabase/migrations/*`, `tests/*` | Sumber kebenaran mutlak atas apa yang **nyata terjadi saat ini** — termasuk bug, celah RLS, dan penyimpangan dari spec. |
| **4. Dokumen Audit/Status Historis (Usang / Sebagian Salah)** | `README.md`, `package.json` description, `HASIL AUDIT.md`, `docs/redesign/IMPLEMENTATION_STATUS_v0.5.0.md`, `v0.5.1.md`, `VERIFICATION_REPORT_v0.5.1.md`, `AI_STUDIO_QA_REPORT.md`, `STATIC_QA_REPORT_v2.0.md`, `docs/redesign/screenshots/*` | Berisi klaim kadaluwarsa ("preview-only tanpa DB", 33 tests, dan klaim faktual keliru di `HASIL AUDIT.md:452`). Tidak boleh dipercaya tanpa verifikasi kode. |
| **5. Draft / Sumber Belum Terkunci** | `docs/sources/BUSINESS_LOGIC_SOURCE_NOT_FULLY_LOCKED.txt`, `docs/sources/TRD_SOURCE_V3_NOT_FULLY_LOCKED.txt`, HTML prototype files | Hanya bahan referensi historis; tidak mengalahkan `DECISION_REGISTER.md` atau `01_PRD.md`. |

### Hierarchy of Truth yang Ditetapkan di Mode A
1. **Perilaku runtime & efek samping nyata:** `src/*`, `migrations/*`, dan output test yang dieksekusi langsung mengalahkan `README.md`, `HASIL AUDIT.md`, atau laporan status lama.
2. **Aturan bisnis & visual terkunci:** `DECISION_REGISTER.md`, `AGENTS.md`, `DESIGN.md`, `G4_VISUAL_SYSTEM_v2.1.md`, dan Rules 1–12 mengalahkan implementasi kode yang menyimpang — penyimpangan kode dicatat sebagai **BUG/BLOCKER** untuk keputusan & perbaikan Mode B.
3. **Konflik antar dokumen terkunci atau celah arsitektur besar** → masuk ke **OPEN QUESTIONS (Needs Owner Decision)**, dilarang diputuskan sepihak.

---

## B. Tabel Konflik Antar Sumber (Verified Conflict Matrix)

| ID | Sumber 1 | Sumber 2 | Konflik Spesifik | Risiko Terhadap Produk / User | Bukti Pendukung | Keputusan Owner Dibutuhkan? |
|---|---|---|---|---|---|---|
| **C-01** | `README.md`, `AGENTS.md:13`, `G3`/`G5`, `IMPLEMENTATION_STATUS_v0.5.1` (*"UI preview-only, save disabled, no DB"*) | `src/App.tsx:629–673` (`executeSaveTransaction`) & `indexeddbAdapter.ts` | Dokumen menyatakan aplikasi preview-only tanpa persistensi nyata; kode aktif menulis 14 jalur mutasi ke IndexedDB + `outbox_queue` + `localStorage` (4 key) + sync ke Supabase/Drive. | Developer/auditor mengira data tidak tersimpan atau menganggap cloud aman; `sampleData` bisa langsung tersimpan menjadi dokumen toko di IndexedDB/Supabase. | `App.tsx:629–673, 688, 863, 919, 995, 1083, 1142, 1202`; `App.tsx:81, 186, 246, 395` | **TERJAWAB (`DL-04`/`DL-08` — LOCKED):** Persistensi lokal aktif, cloud sync belum terverifikasi, `pendingCount: 0` wajib diperbaiki, dan `sampleData` wajib diisolasi. |
| **C-02** | `01_PRD.md:88`, `DECISION_REGISTER.md` (DR-016), `AGENTS.md` (*"Never equate selling-price with modal/profit"*) | `src/App.tsx:2479, 2652, 4524, 4596, 4621, 4655` | Di UI, `"Untung Kotor"` = `Penjualan − Diskon` (omzet bersih!), `"Untung Bersih"` = `Untung Kotor − Pengeluaran + Pemasukan Lain` (sebelum COGS & tanpa Rugi Rusak!). COGS ditaruh di baris terpisah `"Laba Setelah Modal"`. | **Sangat fatal:** Pemilik toko pemula melihat *"Untung Bersih"* jauh lebih besar dari laba riil karena modal kulakan & barang rusak belum dipotong. | `App.tsx:4524` vs `4596` vs `4621` vs `4655` (`"tidak mengurangi Untung Bersih"`); `sample-week.test.ts` output (`Untung Kotor: 3686600`). | **TERJAWAB (`DL-01` — LOCKED):** Opsi A dengan penyempurnaan P&L 9 langkah resmi; COGS memakai **Moving Average** (**`NOD-05`**). |
| **C-03** | `02_TRD.md:104`, `DECISION_REGISTER.md` (DR-014: *satu calculation engine murni*, Rule 13: *Moving Average*) | `src/engine/v1/calculate.ts` vs `src/engine/v1/engineBridge.ts:595–752` (`calculatePeriodSummary`) | Ada **dua engine terpisah** dan kode aktual (`calculate.ts`) memakai `Latest Unit Cost` serta menggabungkan `unknownUnits` ke `knownUnits` (`lines 141–143`). `calculatePeriodSummary` menghitung ulang stok/penjualan sendiri dan mengabaikan `LOSS_DAMAGE` cost, pool modal tak diketahui, dan riwayat harga. | Angka periode dan angka keseluruhan dapat melenceng; metode costing menyimpang dari keputusan resmi Owner. | `calculate.ts:8, 46, 139–145`, `engineBridge.ts:595–752` vs `calculate.ts` | **TERKUNCI (`DR-014` & `NOD-05: MOVING AVERAGE`):** Wajib 1 engine murni dengan Moving Average + pemisahan ketat known vs unknown-cost inventory pool di Mode B. |
| **C-04** | UI Filter Rentang Waktu di `Laporan` (`App.tsx:4292–4324`) & `Beranda` (`2461–2675`) | Isi kartu angka `Laporan` (`4327–4916`) & `Beranda` | Di `Laporan`, user bisa memilih Hari/Minggu/Bulan/Tahun, tetapi seluruh Hero & Slab **tetap membaca `storeSummary` (kumulatif semua waktu)**, mengabaikan `ringkasanData`. Di `Beranda`, KPI grid hari ini dicampur dengan Kas Toko kumulatif tanpa penanda rentang waktu yang konsisten. | User memilih *"Bulan Ini"* atau *"Hari Ini"* di Laporan dan percaya angkanya terfilter, padahal tampilannya tetap total sepanjang masa! | `App.tsx:4292–4324` (`ringkasanPeriod`) vs `4327–4916` (memakai `storeSummary`, 0 referensi ke `ringkasanData`) | **TERJAWAB (`DL-02` — LOCKED):** Laporan wajib terfilter per periode terpilih; saldo posisi diberi label kumulatif/saat ini eksplisit. |
| **C-05** | `DECISION_REGISTER.md` (DR-012: *owner-only `adizseptian@gmail.com`*), `02_TRD.md:97, 161` (*deny `anon`/`authenticated`*) | `migrations/001:50–64` & `migrations/002:133–154` | Kebijakan SQL aktif di kedua migrasi memakai `FOR ALL USING (true) WITH CHECK (true)` dan `GRANT ALL ... TO anon, authenticated`. Siapa pun yang memiliki `VITE_SUPABASE_URL` & anon key bisa membaca/menghapus seluruh data toko. | **Kebocoran & penghapusan data toko secara publik** bila URL/key tersebar dari bundle klien atau `localStorage`. | `migrations/001:50–64`, `migrations/002:133–154` vs `supabase/migrations/20261022000100_initial_schema.sql` (ketat, tidak terpakai). | **TERKUNCI & BLOCKED (`NOD-01`):** TRD v2 terbaru satu-satunya acuan arsitektur, tetapi belum ada di workspace (`LOCKED — IMPLEMENTATION BLOCKED`). |
| **C-06** | `migrations/002_create_domain_tables.sql` (9 tabel) & `supabase/migrations/20261022000100_initial_schema.sql` (24 tabel) | `src/storage/supabaseAdapter.ts` | Aplikasi hanya sinkron ke `toko_documents` & `toko_backups` (`migrations/001`). Dua skema SQL lainnya tidak dibaca atau ditulis sama sekali oleh kode aplikasi. | Beban pemeliharaan skema mati & ilusi normalisasi SQL padahal cloud masih menyimpan 1 JSON blob monolithic. | `supabaseAdapter.ts`, `migrations/001`, `migrations/002`, `supabase/migrations/*` | **TERKUNCI & BLOCKED (`NOD-01`):** Implementasi lokal maupun cloud Mode B diblokir sampai Owner menyediakan `TRD v2` & menyetujui Mode B. |
| **C-07** | `HASIL AUDIT.md:452` (*"`cost_per_pack NUMERIC NULL`"*) & Rule 4 (*unknown = `null`*) | `migrations/002_create_domain_tables.sql:14` | `migrations/002` mendefinisikan `cost_per_pack numeric NOT NULL DEFAULT 0`. Dokumen audit terdahulu keliru melaporkannya `NULL`. | Jika suatu saat tabel `migrations/002` dipakai, modal yang belum diketahui akan dipaksa menjadi `0` di database! | `migrations/002_create_domain_tables.sql:14` vs `HASIL AUDIT.md:452` | **TERKUNCI (`Rule 4` & `NOD-05`):** Modal unknown wajib `null` (dilarang `0`); keputusan penghentian/migrasi `migrations/002` menunggu `TRD v2` (**`NOD-01`**). |
| **C-08** | `DECISION_REGISTER.md` (Rule 10), `01_PRD` §9, `05_APPFLOW` §11 (*append-only, koreksi terhubung*) | `src/App.tsx:703–721` (`handleDeleteRecord`), `2800, 5030, 5125` | `handleDeleteRecord` menghapus elemen array langsung via `.filter(r => r.id !== recordId)` dan menimpa seluruh dokumen. Juga tidak ada UI/logika `closedPeriods` atau `corrections` meski field-nya ada di skema payload. | Riwayat audit hilang, periode lama bisa berubah diam-diam tanpa jejak koreksi/pembatalan. | `App.tsx:703–721`; `sampleData.ts:448–449` (`closedPeriods`, `corrections`); 0 referensi di `App.tsx`. | **TERJAWAB (`NOD-03: LOCKED`, `NOD-03B: DEFERRED`):** Append-only penuh, VOID bersyarat (alasan + origin ref, non-master/config/snapshot/system), periode tertutup beku + koreksi tertaut; *Early Close* dikecualikan dari rilis awal. |
| **C-09** | `02_TRD.md:107` & Rules (*unit fisik tidak boleh dicampur, `remainingByUnit`*) | `src/App.tsx:852, 909, 1045, 1273, 4453, 4793` | Handler pembelian, cek stok, rusak, dan ringkasan laporan memaksa `unit: 'pcs'` dan teks `/pcs`, mengabaikan unit katalog (`Kg`, `Botol`, `Dus`, `Porsi`). `src/engine/v1/stock-check-preview.ts` tidak diimpor oleh `App.tsx`. | Salah catat stok barang curah/timbangan dan tampilan satuan yang membingungkan kasir/pemilik. | `App.tsx:852, 909, 1045, 1273, 4453, 4793` vs `src/engine/v1/stock-check-preview.ts` | **TERKUNCI (Wajib diperbaiki di Mode B):** Gunakan isolasi unit fisik sesuai `stock-check-preview.ts`. |
| **C-10** | `DESIGN.md` & `G4_VISUAL_SYSTEM_v2.1.md` (*larangan glassmorphism, solid 5-tab bar dengan active lime*) | `src/styles.css:3038–3160` (`.floating-dock`) & `App.tsx:1975` (`live-pulse-beacon`) | Mobile dock memakai dark translucent blur (`backdrop-filter: blur(28px)`), tombol oranye tengah bersinar (`box-shadow` glow), dan header memakai `live-pulse-beacon` animasi denyut (melanggar larangan G4 terhadap glow/pulse/glass). | Pelanggaran identitas desain TOKO MODE yang terkunci + risiko kontras/keterbacaan & tumpang tindih keyboard. | `styles.css:3038–3160`, `App.tsx:1975` vs `G4_VISUAL_SYSTEM_v2.1.md` | **TERJAWAB (`DL-06` — `PERTAHANKAN G4`):** Kembali ke solid 5-tab dock active lime `#D7FA4A` tanpa glassmorphism, glow, atau pulse. |
| **C-11** | Aturan kejujuran sistem (`§2.4`, `§7`) | `src/storage/syncEngine.ts:80–89` & `App.tsx:1932–1990` | `getStatus()` hardcode `pendingCount: 0` dan `supabaseConnected` hanya cek keberadaan string URL+key. UI merender dot hijau `"Tersinkronisasi"` / `"Tersinkron"`. | Pemilik mengira data sudah aman di cloud saat sebenarnya offline, outbox masih antre, atau user belum login OTP sama sekali. | `syncEngine.ts:80–89`; `App.tsx:1932–1946, 1974–1990` | **TERKUNCI (`DL-04` & `NOD-04: CONDITIONAL`):** Kejujuran sync mutlak; notification bell hanya dipertahankan bila didukung sumber data & aksi bermakna, selain itu dikeluarkan dari rilis awal. |
| **C-12** | UI Shell (`App.tsx:50, 2046`: route `'asisten'` `"Asisten Pencatatan"`) | Aturan AI OFF (`AGENTS.md`, `src/ai-feature.ts`) | `'asisten'` masuk tipe `Screen` dan header title `App.tsx:2046`, tapi tanpa body JSX (hanya ruang kosong) dan `src/ai-feature.ts` tidak diimpor di mana pun. | Dead route / halaman kosong apabila state `currentScreen` pernah terarah ke `'asisten'`. | `App.tsx:50, 2046`; `src/ai-feature.ts` | **TERJAWAB (`DL-07` — `LOCKED`):** Hapus bersih `'asisten'` di Mode B; AI tetap OFF. |

---

# DELIVERABLE 4 — CRITICAL ISSUE REGISTER (9 KATEGORI WAJIB)

> **Legenda Status & Epistemologi:**  
> - Severity: `CRITICAL` | `HIGH` | `MEDIUM` | `LOW`  
> - Verifikasi: `VERIFIED` | `NEEDS RUNTIME TEST` | `NEEDS OWNER DECISION` | `BLOCKED`  
> - Epistemologi: `FACT` (diamati langsung di source) | `VERIFIED` (dibuktikan eksekusi/silang) | `INFERENCE` (dampak logis dari fakta kode) | `UNKNOWN` (belum dapat diamati)

## 1. Critical Business Logic
1. **[BL-01] Penamaan & Rumus *"Untung Kotor"* dan *"Untung Bersih"* Membalik Makna Akuntansi & PRD**  
   - **Severity:** `CRITICAL` | **Status:** `RESOLVED (LOCKED — DL-01: P&L 9 Langkah + NOD-05: Moving Average)` | **Epistemologi:** `FACT` + `VERIFIED`  
   - **Detail:** `Untung Kotor` menghitung penjualan bersih setelah diskon (`Σ sold×harga − diskon`) tanpa memotong COGS/modal. `Untung Bersih` hanya mengurangi `pengeluaran` dan menambah `pemasukan lain`, tetap mengecualikan `modal terjual` maupun `rugi barang rusak` (explicitly: `"tidak mengurangi Untung Bersih"`). COGS baru dikurangi di baris terpisah *"Laba Setelah Modal"*. Selain itu kode & golden test memakai `Latest Unit Cost` — dicatat sebagai penyimpangan implementasi terhadap **Moving Average (`NOD-05`)**.  
   - `[SOURCE: src/App.tsx | 2479, 2652, 4524, 4596, 4621, 4655]` `[SOURCE: src/engine/v1/engineBridge.ts | 732–740]` `[SOURCE: docs/specs/01_PRD.md | 88]`
2. **[BL-02] Dua Engine Perhitungan yang Terpisah (`calculate.ts` vs `calculatePeriodSummary`)**  
   - **Severity:** `CRITICAL` | **Status:** `VERIFIED` | **Epistemologi:** `FACT`  
   - **Detail:** `calculatePeriodSummary` menulis ulang logika iterasi stok/penjualan/diskon dari nol dengan perbedaan perilaku (mengabaikan modal loss kerusakan, unknown modal pools, dan histori perubahan harga).  
   - `[SOURCE: src/engine/v1/engineBridge.ts | calculatePeriodSummary | 595–752]` `[SOURCE: docs/DECISION_REGISTER.md | DR-014]`
3. **[BL-03] Layar `Laporan` Mengabaikan Filter Rentang Waktu (`ringkasanData`)**  
   - **Severity:** `CRITICAL` | **Status:** `VERIFIED` | **Epistemologi:** `FACT`  
   - **Detail:** Filter rentang waktu (`HARI/MINGGU/BULAN/TAHUN`) & navigator tanggal di-render di `Laporan`, namun seluruh angka pada kartu Hero dan Slab tetap memanggil `storeSummary` (akumulasi sepanjang masa).  
   - `[SOURCE: src/App.tsx | 4292–4324 vs 4327–4916]`
4. **[BL-04] `Beranda` Menyembunyikan Ketidakpastian (`.max`) dan Mencampur Scope Waktu**  
   - **Severity:** `HIGH` | **Status:** `VERIFIED` | **Epistemologi:** `FACT`  
   - **Detail:** Kartu Untung Kotor & Untung Bersih di Beranda hanya mencetak `.min` (`ringkasanData.untungKotor.min`, `untungBersih.min`) meskipun ada rentang `min..max` akibat diskon tidak pasti atau modal unknown, serta mencampur angka harian dengan `remainingDeposit` kumulatif tanpa penjelasan jelas.  
   - `[SOURCE: src/App.tsx | 2461–2675, 2492, 2673]`

## 2. Data Integrity
5. **[DI-01] Kosong (`""`) Dikonversi Paksa Menjadi Angka Nol (`0`) di Input Hitung Fisik Setoran & Belanja**  
   - **Severity:** `CRITICAL` | **Status:** `VERIFIED` | **Epistemologi:** `FACT`  
   - **Detail:** `parseRupiahInput("")` mengembalikan `0`. Saat kasir mengetik lalu menghapus angka pada `#dep-received-amount`, state menjadi `0` (`isCashCounted = true`), bukan `null`. Demikian pula menekan stepper lembaran `+1` lalu `-1` memanggil `setReceivedAmountInput(0)` alih-alih kembali ke `null`. Di line `214`, `receivedAmount = receivedAmountInput ?? expectedAmount`. Selain itu di `handleSavePurchase`, `customPurchaseCost === ''` bisa jatuh ke fallback/0.  
   - `[SOURCE: src/App.tsx | parseRupiahInput | 130–131, 214, 887–889, 3706, 3826–3829, 3957–3960]`
6. **[DI-02] Penghapusan Destruktif (`handleDeleteRecord`) Melanggar Append-Only & Tidak Ada Alur Tutup Periode**  
   - **Severity:** `HIGH` | **Status:** `LOCKED (NOD-03: VOID/Correction; NOD-03B: Early Close DEFERRED)` | **Epistemologi:** `FACT`  
   - **Detail:** Menghapus catatan transaksi memotong array lalu menimpa dokumen. Array `closedPeriods` dan `corrections` ada di tipe data namun memiliki **0 UI dan 0 logika** di `App.tsx`. Sesuai keputusan Owner, `VOID` berbatas pada transaksi/event finansial yang dapat dibatalkan dengan alasan & referensi event asal, periode tertutup beku + koreksi tertaut (`NOD-03`), dan *Early Close* dikecualikan dari rilis awal (`NOD-03B`).  
   - `[SOURCE: src/App.tsx | handleDeleteRecord | 703–721, 2800, 5030, 5125]` `[SOURCE: src/storage/sampleData.ts | 448–449]`
7. **[DI-03] Paksaan Unit `'pcs'` pada Produk Non-Pcs & Absennya Validasi Integer Overflow di Handler UI**  
   - **Severity:** `HIGH` | **Status:** `VERIFIED` | **Epistemologi:** `FACT`  
   - **Detail:** Handler belanja/cek stok/rusak di `App.tsx` menyimpan `unit: 'pcs'` meski produk di katalog memakai unit `Kg`/`Dus`/`porsi`, dan `App.tsx:833` menghitung `packs * unitsPerPack` tanpa `Number.isSafeInteger` (padahal `src/engine/v1/purchase-preview.ts` sudah memilikinya tetapi belum dihubungkan ke form utama).  
   - `[SOURCE: src/App.tsx | 833, 852, 909, 1045, 1273, 4453, 4793]` `[SOURCE: src/engine/v1/purchase-preview.ts]`
8. **[DI-04] Status Sinkronisasi Palsu (`pendingCount: 0` statis + Cek Config = "Tersinkron")**  
   - **Severity:** `CRITICAL` | **Status:** `VERIFIED` | **Epistemologi:** `FACT`  
   - **Detail:** `SyncEngine.getStatus()` selalu mengembalikan `pendingCount: 0` dan `supabaseConnected` hanya membaca `isConfigured()` (non-empty strings). UI menampilkan dot hijau `"Tersinkronisasi"` / `"Tersinkron"` bahkan saat offline/belum auth/outbox belum terkirim.  
   - `[SOURCE: src/storage/syncEngine.ts | getStatus | 80–89]` `[SOURCE: src/App.tsx | 1932–1946, 1974–1990]`

## 3. Security
9. **[SEC-01] RLS Terbuka Publik (`USING (true) WITH CHECK (true)`) & `GRANT ALL TO anon`**  
   - **Severity:** `CRITICAL` | **Status:** `VERIFIED` (static SQL) / `BLOCKED` (live Supabase test) | **Epistemologi:** `FACT` + `INFERENCE`  
   - **Detail:** Baik `migrations/001` (`toko_documents`, `toko_backups`) maupun `migrations/002` (9 tabel domain) memberi izin penuh `FOR ALL` kepada `anon` dan `authenticated`. Siapa saja yang mengetahui URL & anon key dapat membaca, memanipulasi, atau menghapus seluruh pembukuan toko tanpa login.  
   - `[SOURCE: migrations/001_create_toko_documents.sql | 50–64]` `[SOURCE: migrations/002_create_domain_tables.sql | 133–154]`
10. **[SEC-02] Dua Instance Supabase Client Terpisah (Auth OTP Tidak Menyertai Sync Adapter)**  
    - **Severity:** `HIGH` | **Status:** `VERIFIED` | **Epistemologi:** `FACT`  
    - **Detail:** `src/auth/supabaseClient.ts` menyimpan `cachedClient` dengan sesi Magic Link OTP (`signInOwnerWithOtp`), sementara `src/storage/supabaseAdapter.ts` memanggil `createClient()` sendiri tanpa berbagi sesi client terautentikasi.  
    - `[SOURCE: src/auth/supabaseClient.ts | 98–104]` `[SOURCE: src/storage/supabaseAdapter.ts | 86, 112]`
11. **[SEC-03] Kredensial URL/Anon Key Disimpan di `localStorage` & Artefak Personal Hardcoded**  
    - **Severity:** `MEDIUM` | **Status:** `VERIFIED` | **Epistemologi:** `FACT`  
    - **Detail:** Kredensial runtime Supabase disimpan di `localStorage`+`sessionStorage`. URL proyek pribadi `'https://dvznpniodskujfbdznnv.supabase.co'` dan email `'adizseptian@gmail.com'` tertanam di source klien & file SQL. (Catatan: anon key adalah key publik Supabase bila RLS aman, namun bersama SEC-01 risikonya menjadi kritis.)  
    - `[SOURCE: src/App.tsx | 380, 571]` `[SOURCE: src/storage/supabaseAdapter.ts | 23–24, 33, 100–107]` `[SOURCE: src/auth/supabaseClient.ts | 17–18, 113]`

## 4. Architecture
12. **[AR-01] Monolith Component (`App.tsx` 8.235 Baris) & Pecahnya Modul Domain Teruji vs UI**  
    - **Severity:** `HIGH` | **Status:** `VERIFIED` | **Epistemologi:** `FACT`  
    - **Detail:** Semua 10+ layar, 18 modal, form state, handler, dan kalkulasi inline menumpuk di `src/App.tsx`. Akibatnya modul murni yang sudah lulus Vitest (`src/engine/v1/stock-check-preview.ts`, `src/engine/v1/purchase-preview.ts`, `src/ai-feature.ts`) malah tidak dipakai di alur UI utama.  
    - `[SOURCE: src/App.tsx | 1–8235]`
13. **[AR-02] Kontradiksi 3 Skema SQL vs Penyimpanan JSON Monolithic (`NOD-01: TRD v2` Absen)**  
    - **Severity:** `CRITICAL` | **Status:** `LOCKED — IMPLEMENTATION BLOCKED (NOD-01: TRD v2 belum tersedia di workspace)` | **Epistemologi:** `FACT`  
    - **Detail:** `migrations/001` (dipakai), `migrations/002` (9 tabel relasional tidak dipakai + kolom `cost_per_pack NOT NULL DEFAULT 0`), dan `supabase/migrations/20261022000100_initial_schema.sql` (24 tabel append-only tidak dipakai) hidup berdampingan di repo tanpa konsistensi. Target arsitektur tunggal yang disahkan adalah `TRD v2` (`NOD-01`), sehingga implementasi lokal maupun cloud Mode B diblokir sampai `TRD v2` diserahkan.  
    - `[SOURCE: migrations/001_create_toko_documents.sql]` `[SOURCE: migrations/002_create_domain_tables.sql]` `[SOURCE: supabase/migrations/20261022000100_initial_schema.sql]`
14. **[AR-03] Konflik Dokumentasi Preview-Only vs Implementasi Persistensi Nyata**  
    - **Severity:** `HIGH` | **Status:** `VERIFIED` | **Epistemologi:** `FACT`  
    - **Detail:** `README.md`, `package.json`, dan `IMPLEMENTATION_STATUS_v0.5.1.md` mengklaim aplikasi adalah preview-only tanpa DB write; realitasnya `App.tsx` menjalankan offline-first IndexedDB + outbox + Supabase/Drive sync, dan `HASIL AUDIT.md` mencatat klaim SQL keliru (`cost_per_pack NUMERIC NULL`).  
    - `[SOURCE: README.md]` `[SOURCE: docs/redesign/IMPLEMENTATION_STATUS_v0.5.1.md]` `[SOURCE: HASIL AUDIT.md | 452]` `[SOURCE: src/App.tsx | 629–673]`

## 5. Functional UX
15. **[UX-01] Dead Route `'asisten'` Tanpa Body Render**  
    - **Severity:** `HIGH` | **Status:** `VERIFIED` | **Epistemologi:** `FACT`  
    - **Detail:** `currentScreen === 'asisten'` terdaftar di type `Screen` (`line 50`) dan dirender di judul top bar (`line 2046`), namun tidak ada blok JSX kontennya di `<main>` sehingga hanya menghasilkan layar kosong.  
    - `[SOURCE: src/App.tsx | 50, 2046]`
16. **[UX-02] Tombol Notifikasi Header Dummy (`NOD-04: CONDITIONAL`)**  
    - **Severity:** `LOW` | **Status:** `LOCKED CONDITIONAL (NOD-04)` | **Epistemologi:** `FACT`  
    - **Detail:** Tombol lonceng (`aria-label="Notifikasi"`) hanya memicu toast statis `"Tidak ada notifikasi baru hari ini."` tanpa panel/logika notifikasi. Per **`NOD-04`**, tombol lonceng hanya boleh dipertahankan jika memiliki sumber data nyata dan tindakan bermakna (antrean sync lokal tertunda, kegagalan sync terkonfirmasi, atau peringatan stok aktual); jika tidak, dikeluarkan dari rilis awal.  
    - `[SOURCE: src/App.tsx | 1993–2000]`
17. **[UX-03] Data Contoh (`sampleData`) Menyimpan Langsung ke Penyimpanan Permanen & Memicu Sync Cloud**  
    - **Severity:** `HIGH` | **Status:** `VERIFIED` | **Epistemologi:** `FACT`  
    - **Detail:** `handleLoadSampleData` memanggil `executeSaveTransaction` sama seperti transaksi riil, sehingga 25 data contoh ikut tersimpan ke IndexedDB dan terdorong ke cloud bila dikonfigurasi.  
    - `[SOURCE: src/App.tsx | handleLoadSampleData | 686–692]`

## 6. Visual Consistency
18. **[VIS-01] Penyimpangan `.floating-dock` & Pulse Beacon Terhadap TOKO MODE (`G4 v2.1`)**  
    - **Severity:** `HIGH` | **Status:** `RESOLVED (LOCKED — DL-06: PERTAHANKAN G4 Solid Dock)` | **Epistemologi:** `FACT`  
    - **Detail:** `.floating-dock` memakai kaca transparan gelap (`rgba(32, 33, 31, 0.94)`, `backdrop-filter: blur(28px)`), shadow glow oranye, serta `.live-pulse-beacon` animasi denyut, berlawanan dengan aturan tegas `G4_VISUAL_SYSTEM_v2.1.md` & `DESIGN.md` (no glassmorphism, no glow/pulse, solid bar dengan active lime).  
    - `[SOURCE: src/styles.css | 3038–3160]` `[SOURCE: src/App.tsx | 1974–1990]` `[SOURCE: docs/redesign/G4_VISUAL_SYSTEM_v2.1.md]`
19. **[VIS-02] Token Drift Tinggi: 754 Inline Styles & 86+43 Hex Tak Terkelola**  
    - **Severity:** `HIGH` | **Status:** `VERIFIED` | **Epistemologi:** `FACT`  
    - **Detail:** Audit statis menemukan `754` objek `style={{...}}`, `149` kemunculan hex (`43` unik) di `App.tsx`, serta `194` kemunculan hex (`86` unik) di `styles.css`. Ini mencegah pemeliharaan dark theme dan konsistensi komponen lintas layar.  
    - `[SOURCE: src/App.tsx]` `[SOURCE: src/styles.css]`
20. **[VIS-03] Deklarasi Font Tidak Tersedia Offline (`Plus Jakarta Sans` & `Roboto Mono`)**  
    - **Severity:** `MEDIUM` | **Status:** `NEEDS RUNTIME TEST` | **Epistemologi:** `FACT`  
    - **Detail:** `styles.css` menyebut kedua font tersebut tetapi `index.html` (17 baris) tidak memuat font external maupun `@font-face` lokal (0 di CSS). Font aktual di browser fallback ke system sans/monospace.  
    - `[SOURCE: index.html | 1–17]` `[SOURCE: src/styles.css]`

## 7. Accessibility
21. **[A11Y-01] Elemen `<div role="button" tabIndex={0}>` Tanpa Handler `onKeyDown`**  
    - **Severity:** `HIGH` | **Status:** `VERIFIED` | **Epistemologi:** `FACT`  
    - **Detail:** Beberapa card/row interaktif memakai `<div role="button" tabIndex={0} onClick={...}>` tanpa handler `Enter`/`Space` di `onKeyDown`, sehingga pengguna keyboard tidak dapat mengaktivasinya.  
    - `[SOURCE: src/App.tsx | 2189, 2349, 2730, 2794, 2958, 4331, 4379, 5033, 8140]`
22. **[A11Y-02] Font Ukuran Mikro `<12px` Masif (`173` inline + `56` CSS = `229` kemunculan)**  
    - **Severity:** `HIGH` | **Status:** `VERIFIED` (static count) / `NEEDS RUNTIME TEST` (actual visual impact) | **Epistemologi:** `FACT`  
    - **Detail:** Teks label penting, subtitle KPI (`9px–11px`), status header (`9px`), dan tabel laporan memakai ukuran sub-12px hingga `8px`, berisiko gagal terbaca pada layar HP kecil & zoom 200%.  
    - `[SOURCE: src/App.tsx | e.g. 1970, 2473]` `[SOURCE: src/styles.css]`
23. **[A11Y-03] Kontras Teks Putih di Atas `--orange` (`#FF5A1F`)**  
    - **Severity:** `MEDIUM` | **Status:** `VERIFIED` | **Epistemologi:** `FACT`  
    - **Detail:** Kontras `#FFFFFF` di atas `#FF5A1F` (~3.12:1 per `G4`/`VERIFICATION_REPORT_v0.5.1`) di bawah WCAG 2.2 AA 4.5:1 untuk teks ukuran normal; tetap dipakai di CTA seperti tombol keranjang (`App.tsx:8168`).  
    - `[SOURCE: src/App.tsx | 8168]` `[SOURCE: docs/redesign/G4_VISUAL_SYSTEM_v2.1.md]`
24. **[A11Y-04] 18 Modal Inline Tidak Konsisten Memakai `ModalForm.tsx`**  
    - **Severity:** `MEDIUM` | **Status:** `NEEDS RUNTIME TEST` | **Epistemologi:** `FACT` + `INFERENCE`  
    - **Detail:** `ModalForm.tsx` hanya mencakup Escape & initial auto-focus (belum ada full focus trap / return-to-trigger); selain itu banyak modal lain dirender inline di `App.tsx` tanpa standardisasi `aria-modal` / `Escape`.  
    - `[SOURCE: src/components/ModalForm.tsx]` `[SOURCE: src/App.tsx]`

## 8. Performance
25. **[PERF-01] Re-Render Monolith 8.235 Baris & Kalkulasi Full-History di Setiap Input Keystroke**  
    - **Severity:** `MEDIUM` | **Status:** `NEEDS RUNTIME TEST` | **Epistemologi:** `INFERENCE`  
    - **Detail:** State mengetik (search, filter, nominals, cart) tinggal di root component `App.tsx` yang sama dengan seluruh layar, sementara `backdrop-filter: blur(28px)` (11 aturan di CSS) berpotensi membebani GPU perangkat Android murah.  
    - `[SOURCE: src/App.tsx | 1–8235]` `[SOURCE: src/styles.css | 3038–3160]`

## 9. Responsive Behavior
26. **[RES-01] Risiko Overlap `.floating-dock` & Sticky Cart Bar pada Viewport `320–430 px` dan Virtual Keyboard**  
    - **Severity:** `HIGH` | **Status:** `NEEDS RUNTIME TEST` | **Epistemologi:** `INFERENCE` (`Playwright NOT RUN`)  
    - **Detail:** Kombinasi sticky/fixed `.floating-dock`, cart summary floating bar (`8090–8175`), FAB (`stock-fab-container`), dan keyboard virtual Android Chrome saat mengisi input nominal/catatan Setoran atau Catat Belanja wajib diukur langsung di `320, 360, 390, 430, 768, 1024, 1440` CSS px (termasuk string Rupiah miliaran dan nama produk panjang).  
    - `[SOURCE: src/App.tsx | 8090–8235]` `[SOURCE: src/styles.css | 2940–3160]`

---

# DELIVERABLE 5 — MODE A EXECUTION PLAN (Menuju 10 File `docs/audit-mode-a/`)

Setelah Owner mereview laporan ingesti ini dan menjawab pertanyaan terbuka pada Deliverable 6, tahap lanjutan Mode A disusun ke dalam 5 langkah terstruktur **tetap read-only** sebelum menyentuh satu baris kode pun di Mode B:

| Tahap | Ruang Lingkup Kerja | Output Dokumen Target (`docs/audit-mode-a/`) | Syarat Keberhasilan & Kejujuran |
|---|---|---|---|
| **Tahap 1 — Finalisasi Source Map & Handler Audit** | Membedah tuntas baris `5751–6950` `App.tsx` (seluruh 18 modal, `Pengaturan`, `DetailModal`, `Timeline`) + memetakan setiap klik/handler → state → IndexedDB/outbox/Supabase/Drive. | `00_AUDIT_EXECUTIVE_SUMMARY.md`, `01_SOURCE_OF_TRUTH_MATRIX.md`, `02_SCREEN_INVENTORY.md` | 100% modal, toast, dan dead route dipetakan dengan exact line range. |
| **Tahap 2 — Safe Runtime Browser & 7-Breakpoint Audit** | Menjalankan app dengan `sampleData` terisolasi (tanpa data toko asli) setelah Chromium terpasang; menangkap screenshot & bounding-box metrics di `320, 360, 390, 430, 768, 1024, 1440 px` + test keyboard/zoom 200%/dark theme/`prefers-reduced-motion`/teks panjang. | `03_SCREEN_AUDIT.md`, `07_ACCESSIBILITY_RESPONSIVE_QA.md` | Tidak mengarang piksel; elemen tak terukur tetap ditandai eksplisit. |
| **Tahap 3 — Reference Research (≥6 Produk)** | Riset mendalam berbasis dokumentasi & flow nyata: Square POS, Shopify POS, Loyverse POS, majoo, Apple HIG + WCAG 2.2, serta Figma/Mobbin/Threads **hanya sejauh dapat diakses publik** (tandai `"tidak dapat diakses"` bila terhalang login/paywall). | `04_REFERENCE_RESEARCH.md` | Setiap baris matrix memiliki URL, tanggal, temuan aktual, dan alasan adaptasi/tolak bagi TOKO SAKALA. |
| **Tahap 4 — Unified Design System & Interaction Spec** | Menyusun satu spec numerik tunggal (tokens, typography + font offline lokal, spacing ≥12px readable floor, button/Rupiah/stepper/setoran comparison, card/sheet) dan 9-atribut interaction/gesture matrix (swipe/long-press/sheet dengan tombol alternatif & keyboard). | `05_DESIGN_SYSTEM_SPEC.md`, `06_INTERACTION_STATE_MAP.md` | Zero kontradiksi dengan `G4 v2.1` & keputusan owner pada Deliverable 6. |
| **Tahap 5 — Decision Lock & Mode B Roadmap** | Mengonsolidasi seluruh status `LOCKED / RECOMMENDED / NEEDS OWNER DECISION / BLOCKER` dan menyusun urutan kerja Mode B (perbaikan security/logic blocker mendahului atau berdampingan dengan pemecahan UI/CSS, unit tests + Playwright regression + rollback plan). | `08_DECISION_LOG.md`, `09_MODE_B_IMPLEMENTATION_PLAN.md` | Review final & persetujuan tertulis Owner sebelum masuk Mode B. |

---

# DELIVERABLE 6 — OPEN QUESTIONS (Hanya Keputusan Owner / Arsitektur yang Belum Terkunci)

> Pertanyaan di bawah **tidak** menanyakan ulang aturan yang sudah terkunci (palet TOKO MODE, bahasa Indonesia pemula, AI tetap OFF, blank ≠ 0, unknown ≠ 0, unit fisik tidak boleh dicampur, dan pemisahan 3 dunia keuangan). Pertanyaan berikut khusus menyangkut **konflik nyata** antara implementasi kode dan spesifikasi:
>
> **Pembaruan Status (Owner Review & Deliverable 8 Reconciliation — 13 Nov 2026):** Seluruh 8 butir di bawah dan keputusan lanjutan (**`NOD-01` s.d. `NOD-06`**, serta **`NOD-03B`**) telah disahkan Owner dan direkonsiliasikan lintas dokumen. Lihat registrasi lengkap & konsistensi final pada `docs/audit-mode-a/08_DECISION_LOG.md` dan `docs/audit-mode-a/10_FINAL_MODE_A_RECONCILIATION_REPORT.md`.

1. **Definisi & Label Laba pada UI vs Rumus PRD (`C-02` / `BL-01`):** — **STATUS: `RESOLVED` (`LOCKED` — `DL-01` Opsi A + 9 Langkah; `NOD-05` Moving Average)**  
   Saat ini UI menulis *"Untung Kotor"* untuk `Penjualan − Diskon` dan *"Untung Bersih"* tanpa memotong modal barang terjual (`COGS`) maupun rugi rusak. **Apakah pada Mode B nanti:**
   - **(A - Sesuai PRD/DR-016):** Ganti *"Untung Kotor"* → *"Penjualan Bersih"*, hitung *"Untung Bersih"* setelah dikurangi modal terjual & rugi rusak (`01_PRD.md:88`), dan pisahkan arus kas ke metrik tersendiri (mis. *"Sisa Arus Kas / Laci"*)?  
   - **(B):** Tetap mempertahankan angka kas toko tetapi mengubah label agar tidak memakai kata *"Untung Kotor/Bersih"* sebelum dikurangi modal?  
   > **Keputusan Owner:** Menyetujui **A dengan Penyempurnaan** mengikuti struktur 9 langkah: (1) Penjualan Kotor, (2) Diskon, (3) Penjualan Bersih = Penjualan Kotor − Diskon, (4) Modal Barang Terjual, (5) Untung Kotor = Penjualan Bersih − Modal Barang Terjual, (6) Pendapatan Lain, (7) Kerugian Barang Rusak, Barang Dipakai, dan Selisih Barang, (8) Biaya Operasional, (9) Untung Bersih Toko. Arus kas/setoran tetap terpisah; dilarang menyebut penjualan pasca-diskon sebelum modal sebagai "Untung Kotor". Per **`NOD-05`**, penilaian modal barang wajib memakai **Moving Average** (bukan `Latest Unit Cost`).

2. **Perilaku Filter Periode di Layar `Laporan` & `Beranda` (`C-04` / `BL-03`):** — **STATUS: `LOCKED` (`DL-02` — DISETUJUI)**  
   Saat user memilih *"Hari Ini / Minggu Ini / Bulan Ini"* di `Laporan`, apakah semua kartu aliran (`Penjualan`, `Pengeluaran`, `Pemasukan Lain`, `Setoran`, `Laba`) harus terfilter mengikuti periode tersebut, sedangkan metrik saldo posisi (mis. *"Kas Laci Saat Ini"*, *"Sisa Stok"*) diberi label eksplisit sebagai posisi kumulatif terkini?  
   > **Keputusan Owner:** **DISETUJUI.** Semua metrik aliran pada `Laporan` wajib mengikuti periode terpilih; saldo posisi terkini diberi label eksplisit sebagai posisi saat ini dan dipisah dari aliran periode; `Beranda` wajib membedakan angka hari ini, periode terpilih, dan saldo kumulatif secara jelas.

3. **Arsitektur Database & Keamanan RLS Supabase (`C-05` / `C-06` / `SEC-01`):** — **STATUS: `LOCKED — IMPLEMENTATION BLOCKED` (`NOD-01`: Dokumen `TRD v2` Belum Tersedia di Workspace)**  
   Saat ini `migrations/001` & `002` memakai RLS terbuka `USING (true)` ke role `anon` dan hanya menyimpan 1 JSON blob di `toko_documents`, sedangkan `supabase/migrations/20261022000100_initial_schema.sql` sudah mendefinisikan 24 tabel append-only dengan RLS ketat namun belum tersambung ke UI. **Manakah target arsitektur yang disetujui Owner:**
   - **(A - Cepat & Aman):** Pertahankan `toko_documents` JSON blob offline-first untuk saat ini, **tetapi segera kunci RLS** ke `auth.email() = owner` (cabut akses `anon`) dan satukan client Auth OTP dengan `SupabaseAdapter`?  
   - **(B - Penuh sesuai TRD/24 Tabel):** Migrasi penuh ke skema relasional append-only `20261022000100_initial_schema.sql` beserta sinkronisasi per-event?  
   > **Keputusan Owner (`NOD-01`):** Tidak memilih Opsi A atau B pada pertanyaan awal. **TRD v2 terbaru** adalah satu-satunya acuan arsitektur yang disahkan Owner. Karena dokumen tersebut belum tersedia di workspace, implementasi Mode B baik lokal maupun cloud **DIBLOKIR TOTAL (`LOCKED — IMPLEMENTATION BLOCKED`)** sampai `TRD v2` disediakan dan persetujuan Mode B eksplisit diberikan Owner.

4. **Status Mode Persistensi Saat Ini vs `README` / `IMPLEMENTATION_STATUS` (`C-01` / `AR-03`):** — **STATUS: `LOCKED` (`DL-04`/`DL-08` — DISETUJUI DENGAN KOREKSI)**  
   Apakah aplikasi kini resmi berstatus **Offline-First Local + Cloud Sync Aktif** (sehingga `README` & `v0.5.1` dimutakhirkan dan `sampleData` diberi mode sandbox/konfirmasi terpisah agar tidak tercampur ke cloud toko asli)?  
   > **Keputusan Owner:** **DISETUJUI DENGAN KOREKSI.** Persistensi lokal IndexedDB sudah berjalan dan jalur outbox/sync ada di kode, tetapi sinkronisasi cloud end-to-end berstatus **belum terverifikasi** (`syncEngine.ts:84` juga masih mengembalikan `pendingCount: 0` hardcoded). UI dilarang menampilkan status "Tersinkron" tanpa konfirmasi server untuk `dataVersion` yang tepat, dan `sampleData` wajib diisolasi agar tidak otomatis tersinkron ke cloud toko nyata. *(Lihat juga **`NOD-04` (`CONDITIONAL`)** terkait Header Notification Bell.)*

5. **Kebijakan Hapus Catatan (`handleDeleteRecord`) & Tutup Periode (`C-08` / `DI-02`):** — **STATUS: `LOCKED` (`NOD-03: VOID/Correction` & `NOD-03B: Early Close DEFERRED`)**  
   Apakah tombol hapus di `DetailModal` / `Riwayat` untuk transaksi periode berjalan boleh ada hanya sebagai *"Batalkan / Void dengan riwayat tercatat"* (bukan hilang senyap) serta memblokir edit/hapus pada periode tertutup (`closedPeriods`), sesuai `01_PRD` §9 & `DECISION_REGISTER` Rule 10?  
   > **Keputusan Owner (`NOD-03` & `NOD-03B`):** **DISETUJUI.** Prinsip strict append-only: dilarang hapus permanen; `VOID` hanya untuk transaksi/event finansial yang secara semantik dapat dibatalkan dengan alasan pembatalan & referensi event asal (event asli tetap tersimpan; master data, konfigurasi, snapshot, dan event sistem tidak otomatis dapat di-VOID); periode tertutup & snapshot historis beku (koreksi lewat event baru yang tertaut). ***Early Close (`NOD-03B`) berstatus `DEFERRED — EXCLUDED FROM INITIAL RELEASE`***: rilis awal hanya memakai penutupan periode normal tanpa kontrol/UI/pengaturan *Early Close*.

6. **Arah Desain Bottom Navigation Mobile: `.floating-dock` Blur vs G4 Solid Bar (`C-10` / `VIS-01`):** — **STATUS: `LOCKED` (`DL-06` — PERTAHANKAN G4; `NOD-02` — Contrast Verification)**  
   `G4_VISUAL_SYSTEM_v2.1.md` & `DESIGN.md` melarang glassmorphism & glow serta mewajibkan solid bottom bar 5-tab dengan active state lime (`#D7FA4A`). Apakah Mode B **wajib mengembalikan dock ke solid bar sesuai G4**, atau Owner ingin merevisi `DESIGN.md`/`G4` agar mengadopsi dock gelap modern **tanpa** efek blur/glow berlebih?  
   > **Keputusan Owner:** **PERTAHANKAN G4.** Tidak mengubah `DESIGN.md` maupun `G4_VISUAL_SYSTEM_v2.1.md`. Wajib memakai solid bottom bar 5-tab dengan active state lime (`#D7FA4A`), tanpa glassmorphism, tanpa glow, dan tanpa pulse dekoratif. Terkait warna (`NOD-02`): token `--orange` (`#FF5A1F`) dipertahankan dengan foreground `#20211F` bila uji aktual membuktikan rasio `>=4.5:1`, serta penggunaan `--blue` pada dark mode dievaluasi berbasis inventaris penggunaan dan ambang WCAG yang sesuai.

7. **Nasib Route Mati `'asisten'` (`C-12` / `UX-01`):** — **STATUS: `LOCKED` (DISETUJUI UNTUK DIHAPUS)**  
   Karena AI wajib tetap **OFF** dan belum ada endpoint/fitur asisten, apakah tipe `'asisten'` dan judul header `App.tsx:2046` dihapus bersih di Mode B sampai nanti ada persetujuan fitur AI tersendiri?  
   > **Keputusan Owner:** **DISETUJUI.** Route mati `'asisten'`, judul header terkait, dan referensi navigasi tak terpakai dihapus pada Mode B; AI tetap OFF.

8. **Strategi Tipografi Offline (`VIS-03`):** — **STATUS: `LOCKED` (TANPA BUNDLING WAJIB)**  
   Apakah Owner menyetujui bundling aset font lokal (self-hosted `.woff2` `Plus Jakarta Sans` + `Roboto Mono` atau font berlisensi terbuka setara dengan dukungan `tabular-nums`) ke dalam `public/`/`src/assets/` agar tampilan offline di HP Android identik 100% dengan spec?  
   > **Keputusan Owner:** **TANPA BUNDLING WAJIB.** Mengikuti `DESIGN.md` & G4 (`Inter`, `"Plus Jakarta Sans"`, fallback sistem; `tabular-nums` wajib untuk angka uang). Tidak menambah pemuatan font remote wajib dan tidak membundel aset font sebelum kebutuhan serta lisensinya terverifikasi.

9. **Keputusan Tambahan Terkunci (`NOD-05` & `NOD-06`):** — **STATUS: `LOCKED`**  
   - **`NOD-05` (Inventory Costing Method):** **`MOVING AVERAGE — LOCKED`**. `Latest Unit Cost` pada `src/engine/v1/calculate.ts`, `engineBridge.ts`, `contract.ts`, `App.tsx`, dan `tests/engine/golden-rumus-pemilik.test.ts` dicatat sebagai penyimpangan implementasi. Keenam aturan integritas modal known vs unknown wajib dipenuhi pada Mode B.
   - **`NOD-06` (Git History & Baseline):** **`PRESERVE GIT HISTORY — LOCKED`**. Dilarang reset, rewrite, force-push, hapus commit historis, atau revert otomatis atas `918d36560660cd183f603f6ea72238a96f031796`. Klasifikasi selektif dan usulan baseline/branch Mode B disusun di `docs/audit-mode-a/09_MODE_B_IMPLEMENTATION_PLAN.md` dan `10_FINAL_MODE_A_RECONCILIATION_REPORT.md` tanpa mutasi Git pada Mode A.

