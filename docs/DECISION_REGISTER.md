# Decision Register — TOKO SAKALA

Labels:
- **LOCKED**: explicitly locked in product principles or reiterated as a hard rule.
- **AGREED DIRECTION**: chosen direction, while implementation details may still be open.
- **PENDING / NOT FINAL**: must not be implemented as a settled fact until the source documents are reconciled and approved.
- **NOT TESTED**: code/docs alone do not prove this behavior works.

## LOCKED product rules

1. Product principle: “Jangan membuat pengguna memahami sistem. Buat sistem yang memahami pengguna.”
2. Users record real-world events; the system calculates and explains.
3. Stock balance is the user input; sold units are derived only when justified.
4. Restock does not automatically create a new reporting period.
5. Historical purchase prices, package content, and selling prices are preserved.
6. A stock discrepancy is not silently treated as a sale.
7. Profit, store cash, and deposits are separate concepts.
8. Important numbers must be explainable.
9. AI/OCR may propose data but may not commit silently or become the source of truth.
10. Important changes must be auditable; closed history cannot be silently rewritten.
11. No event means no forced user task.
12. UI language is Indonesian and everyday; accounting terminology is hidden from the primary interface.
13. Average moving cost is preferred over FIFO due to checkpoint-based sales estimation.
14. Units with unknown modal stay separate and cannot be assigned invented modal.
15. A purchase is inventory, not automatically an operating expense.
16. Product damage, goods used by the shop, and unknown stock loss are separate events.
17. Event chronology and accounting periods are separate: store cash is cumulative, report periods are windows.
18. One pure calculation engine must power preview, save validation, dashboard and reports.

## AGREED DIRECTION (Status Rekonsiliasi & Status Aktif)

- **DR-001 [SUPERSEDED by DR-007]**: ~~Design: dark-first, Deep Teal + Warm Ivory; avoid violet.~~
  - *Status*: **SUPERSEDED** pada revisi TOKO MODE v2.1.
  - *Pengganti*: DR-007 menetapkan arah visual aktif adalah **TOKO MODE** (`#FFFDF6` paper, `#20211F` ink, `#FF5A1F` orange, `#D7FA4A` lime, `#2958E8` cobalt).
- **DR-002 [SUPERSEDED by DR-008]**: ~~Starter stack: Next.js App Router, PostgreSQL, Supabase.~~
  - *Status*: **SUPERSEDED** sesuai keputusan pemilik proyek (anggaran Rp0, single user).
  - *Pengganti*: DR-008 menetapkan arsitektur aktif adalah **React + Vite + TypeScript starter** dengan **Google Drive REST API v3** sebagai penyimpanan utama di sisi browser client.
- **DR-003 [SUPERSEDED by DR-008 & DR-009]**: ~~Personal/local-first app with no login is current intended usage; do not expose publicly.~~
  - *Status*: **SUPERSEDED**.
  - *Pengganti*: Single Google Account authentication (`drive.file` scope) untuk akses aman Google Drive pemilik.
- **DR-004 [AKTIF]**: App sections: Beranda, Catat Belanja, Cek Sisa Stok, Setoran Karyawan, Lainnya / Pengaturan; Asisten default OFF.
- **DR-005 [AKTIF]**: Integer rupiah non-negatif dan kuantitas integer per satuan kemasan fisik yang terpisah (tidak menjumlahkan pcs + kg + dus + botol).
- **DR-006 [AKTIF]**: Modal yang tidak diketahui tetap disimpan `null`, bukan dipalsukan menjadi `0`.

---

## KEPUTUSAN BARU (RECONCILED & LOCKED)

### DR-007: Arah Desain Aktif — TOKO MODE v2.1 (LOCKED)
- **Status**: LOCKED (Menggantikan DR-001).
- **Isi Keputusan**: Seluruh antarmuka toko berpedoman pada TOKO MODE:
  - Kertas / Latar Utama: `#FFFDF6` (Paper)
  - Tinta / Teks & Garis Batas: `#20211F` (Ink, 1.5px border solid)
  - Aksen Utama: `#FF5A1F` (Orange)
  - Aksen Sekunder / Badge Lengkap: `#D7FA4A` (Lime)
  - Aksen Tersier / Badge Info: `#2958E8` (Cobalt)
- **Alasan**: Terbukti lebih ramah bagi pemilik toko di warung/toko kelontong, kontras tinggi di bawah sinar matahari langsung, dan telah disetujui dalam Mockup v2.0 & Prototype HTML.

### DR-008: Backend Utama — Google Drive REST API v3 & Anggaran Rp0 (SUPERSEDED)
- **Status**: SUPERSEDED oleh DR-011 & DR-012.
- **Isi Keputusan**:
  - Penyimpanan data utama yang sebelumnya dialokasikan ke Google Drive REST API v3 kini dialihkan ke arsitektur **Offline-First IndexedDB** (lokal) dan **Supabase PostgreSQL** (cloud sync).
  - Google Drive adapter tetap dipertahankan sebagai opsi pencadangan manual / bencana sekunder (Rp0).
- **Alasan**: Google Drive API membutuhkan latensi jaringan tinggi, tidak mendukung query terstruktur per-tabel, dan rentan terhadap koneksi warung yang lambat/mati saat jam kerja kasir.

### DR-009: Mekanisme Pencadangan & Pemulihan — Manual dengan Safe Snapshot (SUPERSEDED)
- **Status**: SUPERSEDED oleh DR-011 & DR-012.
- **Isi Keputusan**:
  - Mekanisme cadangan manual Google Drive disempurnakan dengan dukungan multi-cloud: Ekspor/Impor JSON lokal, snapshot IndexedDB otomatis, serta cadangan cloud Supabase Storage (bucket `backups`) dan tabel `backup_registry`.
  - **Safe Snapshot Enforcement** tetap diwajibkan: pemulihan otomatis dibatalkan jika snapshot pengaman gagal dibuat.
- **Alasan**: Menjamin portabilitas data bebas platform dan mencegah lock-in.

### DR-010: Dokumentasi Audit Permanen — HASIL AUDIT.md (LOCKED)
- **Status**: LOCKED.
- **Isi Keputusan**:
  - Berkas `HASIL AUDIT.md` (dan mirror `HASIL_AUDIT.txt`) di root repository berfungsi sebagai buku jurnal audit teknis permanen.
  - Setiap temuan audit diklasifikasikan dengan kode unik (AUD-001 s/d AUD-016) dan status (OPEN, IN_PROGRESS, RESOLVED, UNVERIFIED, BLOCKED).
  - Catatan sesi audit masa lalu tidak boleh dihapus pada sesi baru, melainkan ditambahkan secara berurutan dengan stempel waktu dan ID sesi unik.
- **Alasan**: Memastikan integritas rekam jejak teknis, akuntabilitas keputusan arsitektur, dan kepatuhan terhadap aturan bisnis.

### DR-011: Arsitektur Penyimpanan Offline-First — IndexedDB Lokal + Supabase PostgreSQL Sync + Google Drive / JSON Backup (LOCKED)
- **Status**: LOCKED (Menggantikan DR-008 & DR-009).
- **Isi Keputusan**:
  - **Penyimpanan Primer**: Menggunakan **IndexedDB** di peramban pengguna sebagai penyimpanan lokal *offline-first*. Seluruh transaksi (belanja, stok, setoran, biaya toko) disimpan seketika ke IndexedDB tanpa bergantung pada ketersediaan koneksi internet. Menggunakan `navigator.storage.persist()` untuk mencegah penghapusan otomatis oleh peramban.
  - **Sinkronisasi Cloud & Idempotensi**: Menggunakan **Supabase PostgreSQL** (Free Tier Rp0) untuk sinkronisasi otomatis dua-arah ketika perangkat sedang online melalui antrean mutasi outbox (`outbox_queue`). Setiap mutasi dilengkapi `idempotencyKey` dan `deviceId` untuk mencegah duplikasi data transaksi.
  - **Deteksi Konflik Eksplisit**: Resolusi konflik berbasis perbandingan versi data inkremental dan stempel waktu, menolak *Last-Write-Wins* (LWW) diam-diam yang berisiko menghilangkan data transaksi fisik kasir.
  - **Deprekasi Google Drive**: Google Drive REST API v3 ditandai sebagai *deprecated / unused* untuk alur transaksi aktif, namun dipertahankan penuh sebagai opsi cadangan manual, mitigasi bencana, serta portabilitas data pemilik tanpa langganan berbayar.
  - **Safe Snapshot Enforcement**: Pemulihan data baik dari Google Drive maupun file JSON mewajibkan snapshot pengaman otomatis sebelum menimpa data aktif. Jika pembuatan snapshot pengaman gagal, seluruh alur restore otomatis dibatalkan.
- **Alasan**: Memastikan warung/toko tetap dapat beroperasi tanpa jeda saat sinyal internet lambat atau mati, data tersinkron antar-perangkat saat online, dengan biaya operasional tetap Rp0.

### DR-012: Skema Multi-Tabel Domain Supabase & Autentikasi Pemilik Tunggal via Supabase Auth (LOCKED)
- **Status**: LOCKED (Melengkapi DR-011).
- **Isi Keputusan**:
  - **Skema Database Relasional**: Disiapkan migrasi SQL `migrations/001_create_toko_documents.sql` (tabel dokumen agregat `toko_documents` dan `toko_backups`) dan `migrations/002_create_domain_tables.sql` (tabel domain relasional: `products`, `stock_movements`, `purchases`, `sales`, `expenses`, `deposits`, `periods`, `sync_events`, `backup_registry`).
  - **Row Level Security (RLS)**: Diaktifkan pada seluruh tabel dengan kebijakan granular yang mengizinkan akses penuh bagi pemilik tunggal (`adizseptian@gmail.com`) baik via Supabase Auth OTP (authenticated `auth.uid()`) maupun sesi publik anon key.
  - **Autentikasi Pemilik**: Menggunakan Supabase Auth Magic Link (bebas sandi) ke email pemilik resmi `adizseptian@gmail.com`.
- **Alasan**: Memberikan fleksibilitas query relasional SQL untuk analisis laporan masa depan sembari menjaga integritas skema dan keamanan akses berbasis baris (RLS).

### DR-013: Otorisasi & Persetujuan Resmi Eksekusi Migrasi Database Cloud (MIGRATION 001 & 002) (LOCKED)
- **Status**: LOCKED (Disetujui secara eksplisit oleh pemilik toko melalui perintah `SETUJUI SEMUA MIGRASI`).
- **Isi Keputusan**:
  - Seluruh berkas migrasi database Supabase (`migrations/001_create_toko_documents.sql` dan `migrations/002_create_domain_tables.sql`) telah lolos audit keamanan (0 secret, RLS aktif, zero destructive drop, idempotent `CREATE TABLE IF NOT EXISTS`) dan disahkan statusnya dari `PENDING_USER_APPROVAL` menjadi `APPROVED_BY_OWNER`.
  - Prosedur eksekusi DDL difasilitasi dengan tombol *one-click copy* di UI modal Supabase toko untuk pengeksekusian di Supabase SQL Editor proyek `dvznpniodskujfbdznnv.supabase.co`.
- **Alasan**: Kepatuhan terhadap Prosedur Migrasi Terkontrol (Phase 04) yang melarang perubahan struktur database tanpa otorisasi tertulis eksplisit dari pemilik sistem.

---

## PENDING / NOT FINAL — reconcile before full implementation

1. PRD v1.1, APPFLOW revision 3, TRD v3 and BUILD_ORDER must become a single approved source of truth.
2. Exact §22 policy decisions (date-only normalization, period boundary, miscount correction, future date tolerance, cancellation semantics) need explicit golden fixtures.
3. Database migration rules for multi-device sync (jika di masa depan pemilik memutuskan beralih dari single-device ke multi-device).

---

## STATUS LINGKUNGAN PENGUJIAN & VERIFIKASI (VERIFICATION STATUS)

- `npm run scan:secrets`: **PASS** (0 secret terdeteksi di kode frontend).
- `npm run test` (vitest): **PASS** (14 test files, 61 unit & integration tests lulus 100%).
- `npm run build` (tsc & vite): **PASS** (Clean Build, 0 error kompilasi).
- Headless Playwright script: **TERSEDIA** (`tests/playwright/transactions.spec.ts`, dapat dijalankan dengan `npx playwright test` di lingkungan yang memiliki binari browser Chromium).
- Git status / push CLI: **BLOCKED IN SANDBOX** (`fatal: not a git repository` karena direktori `.git` tidak disertakan di sandbox runtime; operasi git commit dan push wajib dilakukan dari repo lokal atau GitHub remote).

## Change policy

Any change to a locked business rule must:
1. identify the source rule being changed;
2. explain the impact on inventory, profit, cash, deposit and history;
3. update PRD/APPFLOW/TRD/engine fixtures consistently;
4. include tests for the new and old edge cases;
5. be approved before merging.

