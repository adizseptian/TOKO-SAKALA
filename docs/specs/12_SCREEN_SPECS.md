# 12 — Screen Specifications

## 1. Global shell

**Tujuan:** navigasi yang jelas dan status koneksi yang jujur.  
**Elemen:** brand TOKO SAKALA, sidebar desktop, topbar, current period/context, global `+ Tambah`, connection status.  
**States:** loading; offline; normal; stale data with timestamp; configuration/security guard failure.  
**Rules:** no dummy values; disabled writes if DB disconnected.

## 2. Setup

**Fields:** nama toko; data produk dasar; satuan pembelian; isi kemasan; harga jual; harga modal bila diketahui; sisa fisik.  
**Optional:** modal stok awal dapat belum diketahui.  
**Validation:** nama wajib; jumlah unit integer non-negative; isi kemasan positive integer; monetary amount integer rupiah non-negative unless event contract explicitly allows correction signs; don't convert blank modal to zero.  
**Success:** “Toko siap dicatat. Modal untuk beberapa barang masih belum diketahui” if applicable.

## 3. Beranda

**Primary card:** one action based on relevant context, e.g. “Cek sisa barang” or “Periksa setoran”.  
**Maximum key content:** 1) kondisi toko; 2) uang seharusnya; 3) setoran/status; 4) untung; 5) perlu diperiksa.  
**Other content:** collapsible or deeper view.  
**No:** charts without decision purpose, technical accounting language, invented values.  
**Clickthrough:** every figure leads to explanation/detail.

## 4. Barang

**List fields:** nama; satuan jual; stok terakhir/availability; harga jual aktif; status modal/certainty.  
**Actions:** tambah/edit non-event product metadata, archive product (not delete history), view price/package history, cek sisa.  
**Validation:** no negative units; package contents > 0; product IDs immutable in historic events. Product archive can't erase event history.

## 5. Belanja

**Fields:** barang; jumlah kemasan; isi per kemasan; harga/total purchase; tanggal kejadian; sumber uang (toko/pribadi).  
**Context:** fill package size from history, show prompt if it changed.  
**Preview:** pcs masuk, total modal, derived modal/unit, existing and resulting availability, cash impact according to source.  
**Validation:** count/price valid; item totals consistent; source explicit; reused command ID rules.  
**Success:** concise summary, Undo if policy permits.

## 6. Cek Sisa

**Fields:** current physical remainder per selected product; optional “tidak ada penjualan sejak cek terakhir” declaration for products where this is specifically asserted.  
**Context:** show available count and last checked date, not presumed zero.  
**Live result:** quantity sold if possible, sales, cost, product profit, expected money/deposit impact, certainty.  
**Abnormal:** remaining > available blocks auto-sale and asks one question; normal large drop may soft-prompt if history adequate; unknown cause becomes stock discrepancy.  
**Save:** preview → confirm → server recalculate → authoritative confirmation.

## 7. Barang Rusak / Dipakai

**Fields:** product, quantity, date, optional note/reason.  
**Preview:** stock decreases; product result/profit decreases by cost when known; cash unchanged.  
**Rules:** no duplicate stock loss; amount cannot exceed available without exception/correction handling. Historical data retained.

## 8. Pengeluaran

**Fields:** description, amount, event date, source (store/private), category if useful.  
**Rules:** distinguish item purchase from operational expense; if ambiguous ask one simple question. Store-source expense decreases cash; private-source expense does not lower store cash but remains an expense/result according to final business interpretation. This source/result behavior must be explicit in engine tests.

## 9. Pendapatan lain

**Fields:** short description, amount, date.  
**Examples:** jasa seduh mi Rp2.000.  
**Preview:** additional income and cash-in; not counted as product sales.  
**Status:** if receiving channel unknown, don't infer non-cash; MVP scope assumes cash sales/receipts only unless product owner changes scope.

## 10. Setoran

**Fields:** actual amount, event date, period if not inferable.  
**Display:** amount entered, period total deposits, expected cash, signed difference, certainty, status, neutral possible checks.  
**Rules:** deposit does not create income/profit; multiple deposit entries sum. Unresolved differences carry forward according to closed-period policy.

## 11. Close Period

**Review:** period name/boundary, total income/outflow, deposit summary, items not checked, uncertainty status, prospective snapshot.  
**Choice:** full/partial close; carry unresolved discrepancy or record cash difference only if that behavior is approved.  
**Save:** atomic database operation; reject stale sequence; immutable snapshot.  
**Pending:** early-close and segment boundaries are not locked yet.

## 12. Reports

**Filters:** period/date range, product or all products.  
**Sections:** stock changes, product sales/profit, additional income, operating expense, cash expected, deposit total, difference, incomplete/uncertain items.  
**Exports:** PDF/Excel were requested; TRD additionally specifies JSON/CSV for data portability. Exact first-release export format and client-side library choice should be finalized from available free tools. Never export a result without its certainty/period context.

## 13. History / correction

**List:** event date, recorded time, event type, concise description, source manual/AI/OCR if applicable, version/void/correction state.  
**Detail:** before/after summary, linked event, reason if given.  
**Actions:** edit-as-new-version or void when open; correction with link when closed. No physical delete.

## 14. Settings

**Scope:** store profile, defaults for money source (editable per event), period preferences, backup/export status, data information.  
**Security:** do not display secrets. No user accounts/login in MVP.

## 15. Shared states

- **Empty:** explain the next useful step.
- **Loading:** skeleton/spinner with stable layout.
- **Error:** user-safe detail + retry if safe.
- **Disconnected:** clear status, no writing.
- **Stale:** show exact last-loaded time and disable write.
- **Uncertain:** show which numbers are affected and why.
- **Success:** explain what changed in one or two sentences.
- **Conflict/stale:** reload/review; never silently override newer data.
