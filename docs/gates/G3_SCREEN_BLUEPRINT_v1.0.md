# TOKO SAKALA — G3 Screen Blueprint v1.0

**Status:** blueprint approved for prototype implementation; transaction persistence remains gated.  
**Product direction:** FIELD LEDGER — Quiet Precision for Everyday Business.  
**Supersedes for new UI work:** prior navigation lists that exposed every feature as a top-level item. Business-logic decisions remain unchanged.

## 1. Product rules that every screen must respect

1. The user reports an event; the system computes its implications.
2. Sales, `Keuntungan Jual` (potential sales value before modal), gross/net profit, store cash, cash to hand over, money actually handed to owner, and difference are distinct concepts.
3. `Setoran` means an employee handing cash to the owner—not a bank deposit, new sales, or new profit.
4. A blank value is not zero. Zero is a valid known value. `Belum Diketahui` is not an estimated number.
5. Missing or uncertain modal values must remain visible as uncertainty. Do not invent modal or profit.
6. Remaining stock is a physical input. Sold quantity is a derived result only when inventory availability and non-sale movements are sufficiently known. Unknown shrinkage is not sales.
7. Purchase/package/selling prices and package sizes have history. A later edit must not rewrite historical calculations silently.
8. One deterministic calculation contract must power preview, commit, dashboard, report, explanation and export. Components do not own money formulas.
9. Event history is append-only in principle. Revisions, voids and closed-period corrections remain auditable; never physically erase a committed financial event.
10. The prototype contains no production persistence. All save buttons remain disabled until server validation, atomic commit, access boundary and recovery tests pass.

## 2. Global shell

### Desktop
- Sidebar: brand mark/name; exactly five primary areas; compact preview/safety footer.
- Header: current page title, one state pill (`Pratinjau · belum tersimpan`) and a single `Catat` shortcut.
- Main content max width 1420px; reading width controlled per page; 24/32px internal spacing.
- Keep breadcrumb visually secondary; hide it on mobile rather than truncate the page title.

### Mobile (320–760 CSS px)
- Five-item bottom nav: Beranda, Catat, Stok, Setoran, Lainnya.
- Minimum practical primary target height 44–48 CSS px; safe-area padding at bottom.
- Hide breadcrumb and preview badge in the narrow header; retain page title + one action.
- Leave room for bottom nav: content padding includes nav + device safe area. Never let navigation cover a form field or action.
- `Catat`, `Stok`, and `Lainnya` are hubs, not duplicate feature screens. Secondary pages remain reachable from their hub and may have their own back/parent affordance in a future routing pass.

### Navigation mapping
| Primary area | Direct screen | Secondary screens |
|---|---|---|
| Beranda | `beranda` | Per-item explanation and relevant next action |
| Catat | `catat` | Belanja, Biaya toko; future: Pendapatan lain, Barang rusak/dipakai |
| Stok | `stok` | Cek sisa fisik, Daftar barang, price/package history when implemented |
| Setoran | `setoran` | Setoran details, explanations, period state when implemented |
| Lainnya | `lainnya` | Laporan, Riwayat, Asisten, Pengaturan |

## 3. Screen-by-screen blueprint

### 3.1 Beranda
**Job:** understand current store state and know the next useful action without scanning a dense dashboard.

**Information order:**
1. Page title and one-sentence description.
2. One honest store-status area: whether data is present, and what this means.
3. Up to three summary concepts: Untung; Uang yang perlu diserahkan; Setoran karyawan. Each value has a certainty state and explanation path. No dummy zeros.
4. Four daily action rows: Catat belanja, Cek sisa barang, Catat biaya toko, Periksa setoran.
5. One compact app-safety note while persistence is unavailable.

**Primary action:** `Mulai mencatat` → Catat.  
**Empty:** “Toko belum memiliki catatan aktif.” Show next task, not graphs. `Belum diketahui` rather than `Rp0` when there is no authoritative data.  
**Uncertain:** list the specific affected concept + `Kenapa?`; do not imply the entire store is fine if one component is unknown.  
**Acceptance:** no more than five primary concepts visible without expansion; all numbers trace to engine output; no decorative chart; action links work.

### 3.2 Catat (hub)
**Job:** choose the event that actually happened.

**Order:** page title; five event choices grouped by everyday language; one concise warning during prototype stage. The initial available routes are Belanja and Biaya; Cek Sisa and Setoran are linked because users may start a record from either place. Other Income and damage/use are named as intended tasks but must remain visibly unavailable until the corresponding validated form exists.

**Primary action:** depends on event selected; do not show multiple visually equal CTAs inside a single event form.  
**Acceptance:** user recognizes a task by ordinary words, without accounting terms; selection leads to the correct screen; no action claims it has been saved.

### 3.3 Catat belanja
**Job:** record purchased stock and purchase cost with minimal re-entry. The live form starts blank; the example is loaded only on explicit request.

**Information order:** item name; packages × units/package; price/package (or total price, as established by locked business rules); selling price if the relevant flow requires it; money source; preview. Use one column on mobile. Two fields may share a row only when semantically coupled and legible.

**Preview:** quantity entering stock, total purchase cost, cost/unit if safely derived, and money impact only when money source is known. Label every value `Pratinjau · belum disimpan`.

**Validation:** positive package contents; safe integer quantities/currency; no negative quantity. Empty modal is unknown, not zero. If historical package contents changed, make that conflict explicit before calculating.

**States:** blank form with examples in hint text; valid live preview; invalid field with specific correction; calculation overflow; source unknown; offline/not connected; success only after authoritative server response (currently unavailable).  
**Acceptance:** no duplicated calculation formula in UI; save disabled in the current starter; sample calculations remain governed by engine tests.

### 3.4 Biaya toko
**Job:** record a real operating expense without confusing cost classification with source of cash.

**Fields:** description; amount; event date; source selection (`Uang toko`, `Uang pribadi`, `Belum tahu`). No source defaults to a value because that product decision is pending. Numeric keypad for currency.

**Preview:** entered description/amount/date/source. Do not calculate a final effect on store cash until source and business contract are explicit. Business result impact must follow the same validated engine.

**Validation:** amount is a non-negative whole rupiah amount; preserve typed values on validation errors.  
**Acceptance:** source is explicit, `Belum tahu` remains a valid uncertain state, save disabled until backend + business-rule gate passes.

### 3.5 Stok (hub)
**Job:** choose between a physical count and product catalog.

**Actions:** `Cek sisa fisik`; `Daftar barang`. Supporting text explains that unchecked stock is not zero.

**Acceptance:** no product table crammed into the hub; mobile action areas stack vertically; no fabricated master data.

### 3.6 Cek sisa barang
**Job:** enter physical remainder for multiple products in one pass.

**Information order:** page title; concise `belum disimpan` state; product rows/cards; one input `Sisa sekarang` per item; optional category; selling-price field only while the catalog is not available; running totals clearly titled `Nilai sisa menurut harga jual` (not modal or profit); review panel; save disabled.

**Mobile:** every row becomes a vertically stacked card with visible field labels. No horizontal table scrolling and no multi-column desktop table squeezed into 360px. Numeric keypad. Zero is explicitly valid. Blank remains blank. Incomplete rows do not enter the total.

**Review:** complete item count, remaining quantity shown per product with its selected unit, retail value of remaining stock, and separate entered expenses. Never infer profit from stock retail value or sum unlike units into one total.  
**Abnormal:** future integration must block or review `sisa > stok tersedia`; do not create negative sales. Distinguish `Rusak`, `Dipakai`, `Terjual`, `Salah hitung`, and `Tidak tahu` when an explanation is required.

**Acceptance:** preview calculation uses `calculateStockCheckPreview`; the explicit sample contains 15 complete rows and Rp524.000 total retail value, with incomplete ChocoPie excluded. Quantities are shown per product's selected unit; do not aggregate 318 across unlike units such as pcs and porsi. Clear form only clears an in-memory draft and must state that no saved event was deleted.

### 3.7 Setoran karyawan
**Job:** compare what should be handed over with what the owner actually received, without implying misconduct.

**Vocabulary:** `Uang yang perlu diserahkan`; `Uang diterima owner`; `Selisih setoran`; status `Cocok`, `Perlu diperiksa`, `Belum lengkap`, or `Menunggu setoran`. The period/checkpoint must be visible. The app must not label the event a bank deposit.

**Order:** period/context; amount expected (from engine only); actual amount entered (future form); difference/status; `Kenapa?` explanation; trace to purchase/expense/stock events. Neutral possible causes are suggestions, not facts.

**Critical business guard:** do not locally derive or reinterpret a signed difference in the component. Prior audit observed conflicting expected-cash figures in a recording. Before transaction use, reconcile the source calculation contract and validate all values from the same engine. Negative expected cash must never be made to look like a straightforward shortfall.

**Acceptance:** actual setoran does not create sales/profit; multiple setoran are handled according to the engine; unknown components are visible; save stays disabled.

### 3.8 Lainnya
**Job:** keep secondary views accessible without crowding the daily-work navigation.

**Items:** Laporan; Riwayat; Asisten pencatatan; Pengaturan. One short description per item. No secondary item opens a fictitious dataset.

### 3.9 Laporan
**Job:** answer what happened during a selected period and make the math explainable.

**Planned structure:** period picker; summary of sales and profit (separately); stock movement/product sales; other income; expense; expected cash; actual handover; difference; unresolved uncertainty; `Kenapa?` and `Lihat perhitungan`. One `Ekspor laporan` menu is the future pattern, but only formats actually implemented may be enabled. JSON backup must be labelled as backup, not a report.

**Current state:** empty and export unavailable; do not display inactive PDF/Excel/CSV buttons. Historical snapshots must not change because current prices change.

### 3.10 Riwayat
**Job:** explain who/what/when changed the books and allow traceable correction.

**Planned row:** event date; event type; concise summary; source (manual/AI/OCR); status (current/revised/void/correction); period link. Detail reveals before/after and linked correction. Never use a permanent-delete affordance for a committed financial event.

**Current state:** honest empty state. If later correction is allowed in an open period, it must be a new version/void event; after period close use linked reversal + new event according to final policy.

### 3.11 Asisten pencatatan
**Job:** later make natural-language entry faster, never the calculation authority.

**Current state:** AI OFF by default. Toggle ON changes only a disclosed UI preference; no model is connected and no text is transmitted. Do not show an active composer or say `AI aktif`.

**Future flow:** proposal → item-level confirmation → shared engine preview → user confirm → server validates/commits. Risky actions require explicit confirmation. AI never deletes or modifies history silently.

### 3.12 Pengaturan
**Groups:** Tampilan; Cara pencatatan; Data & backup; Tentang aplikasi. For this starter, show actual preferences and implementation status only. No fake backup success, no unimplemented clear-data button, no secret display.

**Critical action policy:** destructive reset would require a clear summary, export/backup guidance, typed confirmation or two-step confirmation, and post-action receipt. It is intentionally not part of the current prototype.

## 4. Shared component and state contracts

- `StatusPill`: visible text + restrained semantic color; never color alone.
- `MoneyValue`: tabular numerals, explicit certainty, single source from engine.
- `PageTitle`: title not truncated; one-line description, one primary action max.
- `PreviewPanel`: always says `Belum disimpan` until real server confirms commit.
- `Field`: visible label above input; hints are short and connected semantically; error text says what happened and how to correct it.
- `EmptyState`: describes why it is empty and gives one useful next step; no fake demo transactions.
- `ErrorState`: preserve existing input and provide retry only when safe.
- `UncertaintyNotice`: names the affected number and why it is uncertain.
- `Explanation`: overview → reason → calculation → audit/history, with progressive disclosure.

## 5. Cross-screen acceptance matrix

| Scenario | Required behavior |
|---|---|
| No saved events | Values say `Belum diketahui` / `Belum ada catatan`, not fabricated Rp0 |
| Known zero | Display `0` because a verified zero was supplied/calculated |
| Unknown modal | No definite profit; show `Modal belum diketahui` |
| Remaining blank | Excluded from count; not treated as 0 |
| Remaining = 0 | Valid known stock-out value |
| Remaining exceeds available | Future server flow blocks auto-sale and asks one useful question |
| Restock midweek | Same selected period; historical purchase price retained |
| Employee hands money to owner | Deposit receipt is not new revenue or profit |
| Data has unresolved causes | Status becomes `Perlu diperiksa`; no fabricated cause |
| Network failure during write | Future UI says status uncertain, keeps draft, retries same command ID |
| Closed period correction | Old snapshot remains unchanged; correction is linked and visible |
| AI enabled visually | Clearly say no model is connected in this build |
