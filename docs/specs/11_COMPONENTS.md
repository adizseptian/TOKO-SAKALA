# 11 — Component Inventory

**Status:** inventaris kebutuhan untuk implementasi; nama dapat menyesuaikan codebase, kontrak perilaku tidak.

## 1. Shell dan navigasi

- `AppShell`: layout global dan state koneksi.
- `SidebarNav`: navigasi desktop sederhana.
- `MobileBottomNav`: maksimum lima item.
- `Topbar`: nama layar, konteks periode/toko, aksi sekunder.
- `GlobalAddMenu`: pilihan kejadian.
- `ConnectionStatus`: online/disconnected + timestamp data.

## 2. Dashboard

- `ShopStatusSummary`: kondisi toko.
- `ExpectedCashCard`: uang seharusnya dengan certainty.
- `DepositStatusCard`: setoran, selisih dan label status.
- `ProfitSummaryCard`: untung dan caveat komponen belum diketahui.
- `NeedsAttentionCard`: satu daftar prioritas masalah.
- `OtherItemsDisclosure`: rincian “N hal lain”.

Dashboard tidak boleh memuat angka statis/dummy yang tampak nyata.

## 3. Produk dan stok

- `ProductList` / `ProductRow`.
- `ProductForm`.
- `PackageUnitFields`: jumlah isi kemasan dan satuan dasar.
- `PriceHistoryPanel`.
- `StockAvailabilityBadge`.
- `StockCountForm` dengan input sisa fisik.
- `StockReasonPrompt`: rusak/dipakai/salah hitung/tidak tahu/terjual jika perlu.
- `CertaintyBadge`.

## 4. Pencatatan keuangan

- `PurchaseForm` + `PurchaseItemRow`.
- `MoneySourcePicker` dan `MoneySourceChip`.
- `ExpenseForm`.
- `OtherIncomeForm`.
- `DepositForm`.
- `PeriodPicker` (hanya saat periode tidak dapat diinferensikan).

## 5. Preview dan hasil

- `LivePreviewPanel`: status “Belum disimpan”.
- `GoodsAndResultPreview`: barang, penjualan, modal, untung.
- `MoneyAndDepositPreview`: uang, pengeluaran, setoran, selisih.
- `ExplanationTree`: data struktur penjelasan dari engine.
- `ConfirmationDialog`: konfirmasi berdasarkan risiko.
- `SaveResultToast` / `ResultSummary`.
- `UndoAction`: membatalkan secara terlacak; tidak menghapus data.

## 6. Periode dan audit

- `PeriodSummary`.
- `PeriodCloseReview`.
- `UncertainProductsList`.
- `DepositCompletenessNotice`.
- `SnapshotBadge`.
- `CorrectionPreview`.
- `EventTimeline`.
- `AuditDetailDrawer`.

## 7. Laporan dan eksport

- `ReportPeriodFilter`.
- `ReportSummary`.
- `ProductProfitTable`.
- `CashAndDepositTable`.
- `UncertaintyNotice`.
- `ExportActions` (CSV/JSON dan PDF/Excel sesuai lingkup final yang dipilih).

## 8. State komponen standar

Komponen data harus menangani: loading, empty, data, error, disconnected, pending-save, success, uncertain, stale/conflict, permission/configuration error.

## 9. Aturan component contracts

- Props typed dari domain/view model.
- Jangan hitung laba/selisih setoran di komponent.
- Jangan menyimpan data bisnis yang sudah committed dalam cache persisten di browser.
- Komponen form menggunakan schema validasi.
- Semua tombol dapat dikendalikan keyboard dan fokus tidak hilang setelah dialog.
- Komponen preview harus menerima output engine yang sama dengan server-side calculation.
