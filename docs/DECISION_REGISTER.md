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

### DR-008: Backend Utama — Google Drive REST API v3 & Anggaran Rp0 (LOCKED)
- **Status**: LOCKED (Menggantikan DR-002).
- **Isi Keputusan**:
  - Penyimpanan data utama menggunakan **Google Drive REST API v3** melalui OAuth 2.0 client-side token flow dengan skop minimal `https://www.googleapis.com/auth/drive.file`.
  - Target akun pengguna: satu pemilik (`adizseptian@gmail.com`) pada satu perangkat utama.
  - Anggaran operasional server: **Rp0** (tanpa langganan database cloud berbayar, tanpa server backend terpusat).
  - Integritas data dijamin menggunakan **SHA-256 Checksum** deterministik pada payload dokumen `toko-sakala-data.json`.
- **Alasan**: Menghilangkan biaya server bulanan, memberi kontrol kepemilikan data 100% pada Google Drive pribadi pemilik toko, serta mematuhi batas anggaran Rp0.

### DR-009: Mekanisme Pencadangan & Pemulihan — Manual dengan Safe Snapshot (LOCKED)
- **Status**: LOCKED.
- **Isi Keputusan**:
  - Pencadangan dan pemulihan data dilakukan secara manual oleh pemilik melalui UI Pengaturan.
  - File cadangan disimpan di folder khusus `TOKO_SAKALA_BACKUPS` di Google Drive dengan format penamaan `backup-YYYY-MM-DD-HHmmss.json`.
  - **Safe Snapshot Enforcement**: Sebelum pemulihan cadangan dieksekusi menimpa data aktif, sistem wajib secara otomatis membuat cadangan pengaman (safety snapshot) dari data aktif terkini untuk mencegah kehilangan data akibat salah pilih file restore.
- **Alasan**: Mencegah overwrite data tidak sengaja dan memberikan audit trail cadangan yang aman.

### DR-010: Dokumentasi Audit Permanen — HASIL AUDIT.md (LOCKED)
- **Status**: LOCKED.
- **Isi Keputusan**:
  - Berkas `HASIL AUDIT.md` (dan mirror `HASIL_AUDIT.txt`) di root repository berfungsi sebagai buku jurnal audit teknis permanen.
  - Setiap temuan audit diklasifikasikan dengan kode unik (AUD-001 s/d AUD-006) dan status (OPEN, IN_PROGRESS, RESOLVED, UNVERIFIED, BLOCKED).
  - Catatan sesi audit masa lalu tidak boleh dihapus pada sesi baru, melainkan ditambahkan secara berurutan dengan stempel waktu dan ID sesi unik.
- **Alasan**: Memastikan integritas rekam jejak teknis, akuntabilitas keputusan arsitektur, dan kepatuhan terhadap aturan bisnis.

---

## PENDING / NOT FINAL — reconcile before full implementation

1. PRD v1.1, APPFLOW revision 3, TRD v3 and BUILD_ORDER must become a single approved source of truth.
2. Exact §22 policy decisions (date-only normalization, period boundary, miscount correction, future date tolerance, cancellation semantics) need explicit golden fixtures.
3. Database migration rules for multi-device sync (jika di masa depan pemilik memutuskan beralih dari single-device ke multi-device).

---

## STATUS LINGKUNGAN PENGUJIAN & VERIFIKASI (VERIFICATION STATUS)

- `npm run scan:secrets`: **PASS** (0 secret terdeteksi).
- `npm run test` (vitest): **PASS** (8 test files, 33 unit tests lulus).
- `npm run build` (tsc & vite): **PASS** (1.833 modules transformed, 0 error kompilasi).
- Headless Playwright script: **SKIPPED / BLOCKED** (Binari browser headless Chromium belum terpasang di runtime container sandbox, membutuhkan `npx playwright install` di mesin lokal).
- Git status / push CLI: **BLOCKED IN SANDBOX** (`fatal: not a git repository` karena direktori `.git` tidak disertakan di sandbox runtime; operasi git commit dan push wajib dilakukan dari repo lokal atau GitHub remote).

## Change policy

Any change to a locked business rule must:
1. identify the source rule being changed;
2. explain the impact on inventory, profit, cash, deposit and history;
3. update PRD/APPFLOW/TRD/engine fixtures consistently;
4. include tests for the new and old edge cases;
5. be approved before merging.
