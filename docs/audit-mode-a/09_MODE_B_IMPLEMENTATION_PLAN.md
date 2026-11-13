# 09 — MODE B IMPLEMENTATION PLAN & ROLLBACK ROADMAP

**Tanggal:** 13 November 2026  
**Syarat Mulai Mode B:** Persetujuan tertulis Owner terhadap rencana ini dan penyelesaian butir pemblokir pada `08_DECISION_LOG.md` (terutama unggah **`TRD v2`** untuk jalur cloud & keputusan **`NOD-02`..`04`**).  
**Aturan Pelaksanaan:** Fitur keamanan, rumus P&L 9 langkah, filter periode, dan isolasi sample **dieksekusi sebelum atau berdampingan** dengan perombakan visual UI agar Surface yang rapi tidak pernah menutupi bug finansial atau celah keamanan.

---

## Fase 0 — Penyelarasan Kontrak & Pembukaan Blokir (Prasyarat Sebelum Coding Cloud)

| Tugas | Penanggung Jawab | Kriteria Selesai (*Exit Gate*) |
|---|---|---|
| **0.1** Terima & verifikasi dokumen **`TRD v2` / `TRD v2.1`** | Owner -> Agent | File TRD v2 tersimpan di `docs/sources/`; kontrak Edge Function, RPC, RLS, dan Cloudflare Workers Static Assets terdokumentasi tanpa asumsi. |
| **0.2** Putuskan **`NOD-02` (Kontras Oranye CTA)**, **`NOD-03` (Batas Void & Early Close)**, & **`NOD-04` (Tombol Lonceng Header)** | Owner | Status berubah dari `NEEDS OWNER DECISION` ke `LOCKED` di `08_DECISION_LOG.md`. |
| **0.3** Buat tag baseline & pastikan proyek lokal bersih | Agent | `git tag mode-a-baseline`; seluruh tes eksisting (`85 tests`) + `scan:secrets` hijau sebagai titik awal. |

---

## Fase 1 — Integritas Bisnis, Engine P&L 9 Langkah & Append-Only Core (Lokal Aman Terlebih Dahulu)

> *Catatan: Fase 1 murni beroperasi pada domain engine & persistensi lokal IndexedDB — dapat mulai dikerjakan segera setelah `NOD-03` disetujui sambil menunggu infrastruktur cloud `TRD v2` jika Owner mengizinkan.*

| Tugas | File Sasaran Perkiraan | Perubahan Inti & Verifikasi |
|---|---|---|
| **1.1 Penyatuan Engine & Rumus 9 Langkah PRD/DR-016 (`BL-01`)** | `src/engine/v1/calculate.ts`, `src/engine/v1/engineBridge.ts` | - Tambahkan dukungan `discount` dan petakan `LOSS_USED` dari payload ke `calculate.ts`.<br>- Implementasikan tepat 9 komponen berurutan: (1) `Penjualan Kotor`, (2) `Diskon`, (3) `Penjualan Bersih = Penjualan Kotor − Diskon`, (4) `Modal Barang Terjual`, (5) `Untung Kotor = Penjualan Bersih − Modal Terjual`, (6) `Pendapatan Lain`, (7) `Kerugian Rusak + Dipakai + Selisih`, (8) `Biaya Operasional`, (9) `Untung Bersih Toko`.<br>- Hapus total penamaan `"Untung Kotor"` untuk pasca-diskon pra-COGS.<br>- Hapus rumus duplikat di `calculatePeriodSummary`; gunakan satu jalur filter periode lewat `calculate()`. |
| **1.2 Filter Periode `Laporan` & Pemisahan Posisi `Beranda` (`BL-03`)** | `src/screens/LaporanScreen.tsx`, `src/screens/BerandaScreen.tsx` *(ekstraksi dari `App.tsx`)* | - Kabelkan Hero Deck & Slab 1–4 `Laporan` ke output terfilter `ringkasanPeriod` + `ringkasanAnchorDate`.<br>- Beri label eksplisit *"Posisi Saat Ini (Kumulatif)"* pada `Kas Laci Terkini` & `Sisa Stok Terkini` dan pisahkan kartu/seksinya dari metrik aliran periode.<br>- Di `Beranda`, pisahkan secara visual angka **Hari Ini**, **Periode Terpilih**, dan **Saldo Kumulatif**. |
| **1.3 Koneksi Modul Domain Teruji & Integritas Unit (`DI-03`)** | `src/domain/stock-check-preview.ts`, `src/domain/purchase-preview.ts`, modal barang rusak/dipakai | - Gunakan `stock-check-preview.ts` dan `purchase-preview.ts` secara nyata di alur `Stok` & `Catat Belanja`.<br>- Hormati `prod.unit` asli di modal rusak/dipakai/stok (tidak hardcode `'pcs'`).<br>- Hilangkan pre-fill dummy default pada modal `Pemasukan Lain` (`'Jasa seduh mie'`). |
| **1.4 Strict Append-Only `VOID`, Tutup Periode & Undo** | `src/storage/*`, handler pembatalan & `period_close` | - Hapus `handleDeleteRecord` (hard delete array `.filter`).<br>- Terapkan event `VOID` terhubung ke event asal pada periode terbuka (`reason` tercatat).<br>- Kunci event pada periode tertutup (`period_close`) dengan koreksi delta terhubung.<br>- Ubah `handleUndoSave` menjadi pembuatan `VOID` atas event baru. |
| **1.5 Isolasi Sandbox `sampleData`** | `src/storage/sampleSandbox.ts`, `src/storage/syncEngine.ts` | - Simpan data contoh di ruang terisolasi (terpisah dari data toko nyata) & kunci `SyncEngine` serta `GoogleDriveAdapter` agar tidak pernah mengirim data contoh ke cloud. |

**Uji Wajib Fase 1:** Tambah minimal **12+ unit & golden test baru** pada `tests/` untuk: seluruh 9 langkah P&L dengan diskon & `LOSS_USED`, filter `HARI/MINGGU/BULAN/TAHUN`, pemisahan unit (`pcs` vs `kg` vs `liter`), `blank ≠ 0 ≠ unknown`, append-only `VOID`, proteksi periode tertutup, dan isolasi sandbox.

---

## Fase 2 — Arsitektur Cloud, Keamanan RLS & Status Sync Jujur (Bergantung `TRD v2` dari Fase 0)

| Tugas | Sasaran | Perubahan Inti & Verifikasi |
|---|---|---|
| **2.1 Perbaikan Status Sinkronisasi Jujur (`SYNC-01`)** | `src/storage/syncEngine.ts`, header & settings status | - Hapus hardcode `pendingCount: 0` (`syncEngine.ts:84`); baca langsung jumlah `getPendingMutations()`.<br>- Simpan `serverConfirmedVersion`; hanya izinkan label `"Terkonfirmasi server vX"` bila `pendingCount === 0 && serverConfirmedVersion === dataVersion`. |
| **2.2 Implementasi Arsitektur `TRD v2` (`SEC-01`, `SEC-02`)** | `supabase/migrations/*`, `supabase/functions/*`, `src/auth/*`, `src/storage/supabaseAdapter.ts` | - Cabut seluruh policy `USING (true)` & grant `anon` di `migrations/001` serta arsipkan/deprekasi `migrations/002`.<br>- Implementasikan skema SQL + RPC (`rpc_commit_command`, `rpc_close_period`) + Supabase Edge Functions + Single-Owner Supabase Auth + RLS ketat sesuai `TRD v2`.<br>- Satukan instance `SupabaseClient` agar token autentikasi pemilik selalu menyertai setiap request.<br>- Hapus URL/email pribadi hardcoded & string SQL terbuka dari `App.tsx`. |
| **2.3 Pemutakhiran Dokumentasi Status** | `README.md`, `docs/redesign/IMPLEMENTATION_STATUS_v0.5.1.md` | Mutakhirkan status resmi menjadi *Offline-First Lokal + Cloud Sync via Edge Function/RPC* sesuai kenyataan implementasi. |

**Uji Wajib Fase 2:** Negative security test di proyek staging/CLI Supabase: request `anon` tanpa JWT dan request JWT bukan email pemilik **wajib ditolak (`401/403` / 0 baris)**; replay `command_id` idempoten mengembalikan hasil lama; mutasi `UPDATE/DELETE` langsung ke tabel event ditolak trigger DB; `npm run scan:secrets` lulus bersih.

---

## Fase 3 — Refactor UI Monolith, Design System TOKO MODE G4 & Aksesibilitas

| Tugas | Sasaran | Perubahan Inti & Verifikasi |
|---|---|---|
| **3.1 Hapus Dead Route `'asisten'` & Elemen Slop** | `src/App.tsx`, header, damage modal, katalog | - Hapus `'asisten'` dari `type Screen` & top bar (`50, 2046`).<br>- Hapus nomor nota fiktif `NO. ADJ-8820` (`7404`), grid emoji produk (`6519`, ganti Lucide icon), `.live-pulse-beacon` glow/pulse (`1975`), & shadow glow pada CTA `Setoran` (`4106`).<br>- Eksekusi pilihan Owner untuk tombol lonceng (`NOD-04`). |
| **3.2 Kembalikan Bottom Nav ke G4 Solid Bar & Konsolidasi CSS Tokens** | `src/styles.css`, `src/components/BottomNav.tsx`, `src/components/SideRail.tsx` | - Hapus `.floating-dock` blur gelap + glow; implementasikan solid 5-tab bar dengan active lime `#D7FA4A` + `#20211F` + `safe-area-inset-bottom`.<br>- Ganti ikon Unicode di `SideRail` ke Lucide.<br>- Implementasikan token aksesibel hasil `NOD-02` dan perbaiki token dark mode `--blue` (`#7CA0FF` / `#254EDB`).<br>- Hilangkan secara bertahap `754` inline `style={{...}}` & hex hardcoded ke class sistem desain. |
| **3.3 Pemecahan `App.tsx` (8.235 Baris) & Penyatuan `ModalForm`** | `src/screens/*`, `src/components/ModalForm.tsx`, `src/hooks/*` | - Ekstrak 10 layar ke folder `src/screens/`.<br>- Upgrade `ModalForm.tsx` dengan full focus trap, `Escape`, dan return-focus ke pemicu; migrasikan seluruh 18 modal/sheet agar memakainya.<br>- Konversi 10 `<div role="button">` menjadi `<button type="button">` native. |
| **3.4 Ukuran Sentuh `>=44×44 px` & Lantai Teks `>=12px`** | Stepper `Setoran`, `Stok`, chip & label | - Naikkan stepper pecahan Setoran dari `32×34 px` ke `44×44 px`, tombol periode/cart dari `32–40px` ke `>= 44px`.<br>- Naikkan seluruh label penting/subjudul dari `8–11px` ke minimal `12px`. |

---

## Fase 4 — Gerbang Verifikasi Akhir Mode B & Rencana Rollback

### Gerbang Verifikasi Wajib Lulus (`All PASS` sebelum Rilis):
1. `npm run scan:secrets` -> **0 temuan**.
2. `npm run test` (Vitest unit + golden + engine parity + append-only + sandbox) -> **100% PASS**.
3. `npm run build` & `npm run lint` -> **0 error**.
4. **Playwright Full Sweep** pada `320, 360, 390, 430, 768, 1024, 1440 px` (Light & Dark themes + Reduced Motion + Zoom 200% + Virtual Keyboard sim + String panjang/miliaran Rupiah + `@media print`) -> **0 horizontal overflow, 0 focus-obscured, 0 `axe-core` critical/serious violation**, dengan bukti screenshot tersimpan.
5. **Cloud SQL & Auth Negative Check** (setelah TRD v2 terpasang) -> terbukti hanya pemilik terautentikasi dapat baca/tulis via Edge Function & RPC.

### Rencana Rollback (Jika Terjadi Regresi di Mode B):
- **Kode UI & Engine:** Setiap fase dikerjakan dalam commit/branch terpisah bertitik awal tag `mode-a-baseline`. Bila regresi UI/perhitungan ditemukan, `git revert` per fase atau kembalikan ke snapshot IndexedDB pre-migrasi (sebelum upgrade versi payload lokal, app membuat snapshot cadangan otomatis lokal agar data lama selalu dapat dipulihkan tanpa kehilangan transaksi).
- **Database Cloud:** Migrasi SQL baru (menurut `TRD v2`) diterapkan pertama kali **hanya pada database lokal/staging**, tidak pernah ke proyek produksi toko sebelum uji restore backup (`pg_dump` / snapshot verification) dan negative RLS test dinyatakan lulus.
