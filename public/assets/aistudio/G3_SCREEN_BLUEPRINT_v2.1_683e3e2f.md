# G3 — Screen Blueprint v2.1 · TOKO MODE

Status: **candidate for design review**. Mobile is authoritative; desktop is a spatial enhancement. This document does not imply production functionality.

## Direction change: what is different from v1

| Previous concept (Quiet Commerce / Field Ledger) | TOKO MODE v2 |
|---|---|
| Forest green, ivory, brass, quiet premium cards | Orange + near-black + lime + blue + paper |
| Quiet, restrained, editorial luxury | Retail-native, high-energy, direct, bold but controlled |
| Soft low-contrast surfaces and spacious cards | Ink-outline surfaces, compressed task hierarchy, hard 2px control shadows |
| Card-based dashboard impression | Action hub + one priority issue + quick jobs + activity feed |
| Similar visual grammar across metrics and actions | Distinct action tiles, status treatments, numeric summaries, and tactile controls |
| Visual polish centered on color and radius | Visual identity built from color, typographic weight, contrast, icon+label, and task rhythm |

The change is primarily in the design language, information rhythm, action hierarchy, interaction controls, and responsive structure—not a palette swap. No exact percentage of difference is claimed as a measurable result.

## Reference-driven decisions

- **Mobbin / Appllama / Appshots / Screens Design:** study real mobile screens and task flows; use as pattern-finding sources for search, lists, stepper controls, details and one-task-at-a-time forms. Do not copy exact pixels or brands.
- **Refero:** use page types, flows, UI elements, search/filter patterns, money-transfer patterns, activity feed and mobile navigation as the screen research taxonomy.
- **60fps / Motion Primitives / Transitions:** interaction is brief, state-driven, keyboard-reduced and functional. No flourish that delays data entry.
- **Godly / Behance / Navbar / CTA / SupaHero / Footer / BentoGrids / 404s:** visual exploration is secondary. The app isn't a marketing site; hero-section, giant footer, web gallery cards and bento layouts are not copied into transactional workflows.
- **Uiverse / UI Layouts / Beautiful UI:** use component ideas only when they strengthen touch targets, focus, loading or disclosure; don't use ornamental codepen components.
- **NEAT / Feral UI gradients / PatternCraft:** not used for transaction backgrounds; too much motion/decoration harms reading and trust.
- **Design.md generators:** treat output as a starting schema; this project specifies its own named tokens and usage rules to avoid generator defaults.
- **Anti-slop:** use `DESIGN.md` as direction plus the anti-slop repository as a review filter when installed. Anti-slop explicitly does not choose a visual style for the product.

## Five layers of UX — pass criteria

### 1. Strategy — Why does this screen exist?
- User job is stated in one sentence.
- Main data and risk are grounded in shop-owner tasks.
- Success means accurate entry, clear next action, reduced ambiguity, not time-on-screen or visual novelty.
- Financial states remain honest: estimate ≠ received cash ≠ ready-to-handover cash.

### 2. Scope — What is in / out?
- Each screen documents inputs, output, edge cases, and actions that do not exist yet.
- Blank, zero, unknown, incomplete, and confirmed are separate states.
- Production writes require authenticated owner, validated payload, transactional server calculation, audit entry and verified response.
- Prototype UI must clearly declare its non-persistence; its buttons cannot claim to save.

### 3. Structure — Where does it fit?
- Five global mobile destinations only: Beranda / Catat / Stok / Setoran / Lainnya.
- Supporting tasks live one level deeper in Lainnya or the relevant flow.
- Back/close preserves entered values where safe; navigation doesn't silently discard a draft.
- No dead-end screen, duplicate primary navigation, or hidden status.

### 4. Skeleton — Can the user operate it?
- 320px minimum; one-column layout and no horizontal body overflow.
- Field labels visible, focus order logical, virtual keyboard matches numeric/text input.
- Touch targets ≥44px, safe-area padding, CTA does not cover form fields.
- At a glance, users can distinguish money due, money received and difference.
- Stock input shows its unit next to quantity and identifies unfilled entries.

### 5. Surface — Does it look and feel intentional?
- Token-only color/type/radius; strong ink edges, orange action anchor, lime selection, blue secondary action.
- Motion respects reduced-motion settings and is never needed to understand the content.
- Status uses word + icon/shape, not color only.
- Product visuals must come from approved assets; otherwise use clear, neutral placeholders.

## Global mobile IA

Bottom navigation order (locked):
1. **Beranda** — what needs attention today and the fastest next action.
2. **Catat** — record the event; choose purchase, expense, stock note or other supported event in the production design.
3. **Stok** — check remaining quantity, per product and actual unit.
4. **Setoran** — compare expected handover, money received and difference.
5. **Lainnya** — reports, history, product master, assistant, settings.

Desktop: replace bottom navigation with one left rail; don't render both simultaneously.

## Screen specifications

### G3-01 · Beranda
**Job:** see the one thing needing attention and get to the next task quickly.
- First fold: date + greeting; priority handover status with estimate; one “Periksa” CTA; four quick actions; then figures and latest activity.
- Key values: keep semantics in labels and detail screens. Tile labels: Penjualan terhitung, Modal barang terjual, Biaya toko, Laba bersih estimasi.
- Never show a single ambiguous “saldo”.
- Empty day: “Belum ada catatan hari ini” and a create-first action, not zeros masquerading as activity.
- Error: stale/incomplete data gets a visible “Data belum lengkap” state and route to the record.

### G3-02 · Catat hub / quick record
**Job:** select the event in one tap and start a form with correct units.
- Production screen offers only supported event types. No AI suggestion as a requirement.
- Draft states survive safe navigation; warn before discarding unsaved input.
- Prototype shortcut leads to purchase entry; an absent event type gets an explicit notice rather than a fake flow.

### G3-03 · Catat belanja barang
**Job:** record a supplier purchase clearly.
- Order: product → package count + package unit → inner units per pack + unit → purchase price per pack → selling price per unit optional → source of money.
- One column on phone; quantity and package can share row only when it fits. Each input uses a permanent label.
- Preview: total spend; total units; average modal per unit; optional selling price; source of money and effect on shop cash.
- Calculation: `total units = packages × units per package`; `total purchase = packages × purchase price per package`; rounded average modal uses defined business rule, and high-precision total remains traceable. Check multiplication overflow.
- Empty sale price means unknown, not 0. Sale-vs-modal difference isn't labeled profit.
- Error states: missing product, empty integer field, fractional quantity, negative value, overflow, unknown package conversion.
- CTA labels “Periksa catatan” / “Tinjau catatan” before a production commit; never imply persisted state during preview.

### G3-04 · Biaya toko
**Job:** capture one expense and correctly attribute the money source.
- Fields: description, amount, source (Uang toko / Uang pribadi / Belum tahu), date if required by production flow.
- Preview explicitly labels effect on shop cash. Personal money must not be deducted from shop cash without an accounting rule.
- Unknown source remains unknown and raises an unresolved-state explanation.

### G3-05 · Cek sisa stok
**Job:** enter real remaining stock without mixing units or mistaking blanks for zero.
- Search and category pills at top; each item row shows product name/category, unit, quantity, filled status and +/- controls.
- Direct number entry and stepper are both available. Blank uses `—` and “Belum diisi”. Explicit value `0` means the user checked and there is none.
- Summary shows `n of N checked`, number unchecked, and retail value only if the necessary values are known. It never sums pcs + kg + liters into one physical-total figure.
- Search no-results and category no-results have clear recovery.
- Per-item validation rejects negative, fractional (where unit requires integer) and unsafe numeric values.

### G3-06 · Setoran karyawan
**Job:** compare expected cash handover against the amount actually received and identify differences.
- Three separate values: uang perlu diserahkan (estimate), uang diterima, selisih.
- Formula and sign need to be defined by the business contract; sample design displays absolute difference but must also explain who owes whom in production.
- Do not autosettle or infer theft from a mismatch. Use neutral “Perlu diperiksa”.
- Confirm requires review of associated sales, non-cash payments, expenses and unknown entries.
- Keep “setoran” language defined as employee→shop-owner handover, not bank deposit.

### G3-07 · Lainnya
**Job:** access less-frequent tools without crowding the home screen.
- Actions: Biaya toko, Laporan, Riwayat, Daftar barang, Asisten, Pengaturan.
- Each list row includes icon, title and short description; whole row clickable; meaningful destination.
- No generic settings gear grid with no description.

### G3-08 · Laporan
**Job:** understand a selected period and export a traceable report.
- Period selector precedes summary. KPI labels define Sales, cost of sold goods, gross profit, other income, expenses, net profit estimate.
- Use stacked compact rows, not desktop table columns squeezed into phone.
- Export PDF and Excel are separate named actions, each with loading/success/failure and file naming. Prototype shows that export is not wired.
- Reports use the same deterministic calculation engine as preview, save, dashboard and export.

### G3-09 · Riwayat
**Job:** inspect and reconcile historical events.
- Filter by event type/date; rows state kind, date/time, amount, status.
- Correcting a closed period creates a linked correction; never silently rewrites a closed snapshot.
- No destructive single-tap trash icon. Any irreversible admin action must be staged and scoped.

### G3-10 · Daftar barang
**Job:** maintain product name, packaging conversion, selling price and known/unknown modal.
- Unit and conversion are explicit. Unknown modal remains “Belum diketahui”, never coerced to Rp0.
- Warn about same item entered in mixed units or duplicates.

### G3-11 · Asisten pencatatan
**Job:** help translate natural-language notes into a draft for review, not save on the user's behalf.
- Show original text and proposed structured fields side by side where width permits, stacked on mobile.
- Unknown dates/products/units are highlighted; do not guess silently.
- No AI service or network call in this HTML prototype. Any future parser must be optional and a deterministic manual path remains.

### G3-12 · Pengaturan
**Job:** configure store identity, display and safe data behavior.
- High-risk data operations are separated from ordinary preferences.
- Backup, access and destructive changes require clear result and staged confirmation.
- Do not present a “reset everything” button as an everyday control.

### G3-13 · Error / loading / empty / offline states
- Empty: explain why there's no data and provide the primary create action.
- Loading: preserve layout; no false data numbers.
- Error: say what failed, whether it was saved, and a retry path.
- Offline: distinguish local draft from server-committed record.
- Success: only after server confirms transaction commit.

## Prototype coverage

| Feature | Status |
|---|---|
| Five primary destinations and supporting pages | Working locally |
| Purchase math preview and source-of-money labels | Working locally, not server-authoritative |
| Stock search/category/quantity controls | Working locally, ephemeral state |
| Setoran difference preview | Working locally, sample data |
| Expense preview, history filter, catalog search | Working locally, sample data |
| Report selector/export toast, assistant draft, reset demo | Limited simulation only |
| Backend persistence/auth/audit/export/backup | Not implemented |
