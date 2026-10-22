# TOKO SAKALA — Consolidated Specification Pack v1.0

Dokumen ini mengumpulkan diskusi dan spesifikasi yang relevan ke dalam 16 bagian yang diminta. Gunakan ini sebagai peta kerja, **bukan menganggap seluruh isi baru sudah locked**.

## Isi paket

1. [PRD](01_PRD.md)
2. [TRD](02_TRD.md)
3. [Architecture](03_ARCHITECTURE.md)
4. [Code Style](04_CODE_STYLE.md)
5. [APPFLOW](05_APPFLOW.md)
6. [UI/UX](06_UI_UX.md)
7. [UI Design Brief](07_UI_DESIGN_BRIEF.md)
8. [UX Design Brief](08_UX_DESIGN_BRIEF.md)
9. [Userflow](09_USERFLOW.md)
10. [Design System](10_DESIGN_SYSTEM.md)
11. [Components](11_COMPONENTS.md)
12. [Screen Specs](12_SCREEN_SPECS.md)
13. [Backend Schema](13_BACKEND_SCHEMA.md)
14. [Implementation Plan](14_IMPLEMENTATION_PLAN.md)
15. [Testing](15_TESTING.md)
16. [Error Fix / Problem Solving](16_ERROR_FIX_PLAYBOOK.md)

Tambahan: [Decision Register](DECISION_REGISTER.md).

## Status yang digunakan

- **LOCKED:** dinyatakan locked/approved pada diskusi/dokumen sumber.
- **APPROVED DIRECTION:** arah produk disetujui, detail token/implementasi masih perlu validasi.
- **PENDING LOCK:** muncul di draft/revisi atau masih punya pertanyaan yang belum disahkan.
- **NOT VERIFIED:** rancangan/test plan ada, tetapi belum ada bukti implementasi/test spesifik.
- **DEFERRED:** sengaja tidak termasuk MVP.

## Source-of-truth precedence

1. Aturan bisnis/integritas data dan keputusan eksplisit pemilik.
2. Business Logic Lock + Product & UX Master Principles yang statusnya locked.
3. PRD baseline yang sebelumnya disetujui.
4. Revisi PRD v1.1, APPFLOW rev 3, TRD v3, build order dan test notes—hanya bagian yang secara eksplisit sudah disahkan; sisanya pending.
5. Dokumen ini untuk konsolidasi/organisasi; tidak membuat keputusan bisnis baru dengan sendirinya.

## Ringkasan yang disetujui

- Nama produk TOKO SAKALA.
- Pendekatan UI B: sederhana tetapi modern.
- Prioritas tahap pertama: kemudahan dan akurasi seimbang.
- Prinsip: “Jangan membuat pengguna memahami sistem. Buat sistem yang memahami pengguna.”
- Pengguna mencatat kejadian; sistem menghitung dan menjelaskan.
- Keuntungan, uang toko, dan setoran adalah nilai berbeda.
- Sisa stok sebagai input; terjual sebagai hasil jika matematis valid.
- Moving average, bukan FIFO, sebagai metode modal barang terjual yang dipilih di Business Logic Lock.
- Riwayat harga dan kemasan tidak ditimpa.
- Append-only; edit/version, void/cancellation, correction after close.
- Satu engine murni untuk preview, save, dashboard, reports and deposit checking.
- Core tanpa AI dahulu; AI/OCR future, hanya usulan dan tidak menulis diam-diam.
- No non-cash channels, receivables, multi-user, public hosting, offline queue, or AI in MVP.
- Data nyata hanya setelah security + backup/restore gate.

## Penting

TRD v3 di sumber masih menyatakan “revisi, belum terkunci”. APPFLOW rev 3 §22 masih memiliki butir yang menunggu persetujuan. Early-close rules perlu satu definisi konsisten. Tidak ada test diklaim lulus kecuali bukti lingkungan dan hasilnya tersedia.
