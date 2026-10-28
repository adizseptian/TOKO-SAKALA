# TOKO SAKALA — G5 Implementation & QA v1.0

**Base:** starter source v0.3.0, upgraded UI source to v0.4.0 candidate.  
**Scope delivered:** frontend navigation, FIELD LEDGER light/dark themes, screen hubs, home simplification, expense preview form, mobile stacked stock rows, component styles, blueprint and visual-system docs.  
**Scope intentionally not activated:** business-event persistence, database commit, real stock/catalog data, employee deposits, report export, AI/OCR integration, backup/restore, production security.

## 1. Implementation changes

- Replaced nine first-level destinations with five primary destinations: Beranda, Catat, Stok, Setoran, Lainnya.
- Kept detailed screens reachable through hubs so the reduced navigation does not discard features.
- Reworked Beranda around current status, unknown-data semantics and four everyday tasks. Removed decorative hero/orb/large metrics that occupied the first screen without advancing a task.
- Added Catat and Lainnya hubs; added a Stok hub linking to physical count and catalog.
- Added an expense form with description, amount, event date and explicit source-of-money radio choices. No source is silently defaulted.
- Set FIELD LEDGER light tokens (warm ivory, charcoal, forest green, restrained brass) plus a distinct deep-forest dark token set and a Settings theme selector. Theme selection in the React build persists only as a browser preference; the standalone prototype keeps it in memory.
- Removed remote Google Fonts import to avoid an unnecessary runtime network dependency.
- Raised common control heights and field text sizes; mobile forms collapse into one column.
- On narrow mobile, converted stock-check rows into stacked cards with visible field captions instead of forcing a wide table and horizontal scroll.
- Kept preview/save safety copy and disabled transaction-save controls; data is still not persisted.
- Changed purchase entry to start blank; sample values require explicit user action.
- Added explicit stock counting/selling unit per row; totals no longer add quantities across incompatible units (e.g. pcs + porsi).
- Disabled not-yet-implemented `Pendapatan lain` and `Barang rusak/dipakai` entry actions rather than routing them to unrelated screens.
- Removed a misleading Setoran→Biaya shortcut and clarified setoran entry is not active.

## 2. Files added/changed

- `src/App.tsx` — shell, primary navigation, home, hubs, blank-first purchase flow, unit-aware stock preview and expense preview.
- `src/styles.css` — FIELD LEDGER light/dark tokens, theme-state overrides, color/typography/layout and mobile card styles.
- `package.json` — candidate version 0.4.0.
- `CHANGELOG.md` — release notes.
- `docs/gates/G3_SCREEN_BLUEPRINT_v1.0.md` — G3 screen blueprint.
- `docs/gates/G4_VISUAL_SYSTEM_v1.0.md` — G4 token and reference synthesis.
- `docs/gates/G5_IMPLEMENTATION_QA_v1.0.md` — implementation boundaries and QA status.
- `docs/GATE_STATUS_G3_G5.md` — gate summary / remaining blockers.
- `TOKO_SAKALA_FIELD_LEDGER_PROTOTYPE.html` — dependency-free clickable prototype for review without running the React build.

## 3. Verification status — truthful result

| Check | Status | Evidence / limitation |
|---|---|---|
| Source review | Done | Read v0.3.0 README, build status, verification notes, decision register, screen specs, UX brief, component inventory, APPFLOW excerpts, stock workflow and export spec |
| User-provided reference pack review | Done | Reviewed `REFERENCE_LIBRARY.md`, mobile optimization master v2.0 and implementation prompt; used the latest FIELD LEDGER + G0–G2 lock as the precedence layer for this pass |
| Palette contrast calculation | Done for listed pairs | Exact sRGB ratio table is in G4; not a browser-rendered contrast audit |
| TypeScript/JSX syntax transpilation | Passed | Global TypeScript transpile check reported zero syntax diagnostics for App.tsx and main.tsx; this is not a type-check |
| Manual engine golden-case check | Passed (targeted) | Purchase example and stock sample calculated to expected values; not the full Vitest suite |
| Standalone prototype structure/JS syntax | Passed | 13 screen states, light/dark theme selector, balanced CSS braces, no persistence/network calls, and `node --check` passed |
| Browser-rendered responsive screenshot sweep | **Not verified** | Chromium headless launch timed out in this environment; open the HTML in a regular browser for visual review |
| `npm run test` | **Blocked** | `vitest` is not installed in this environment (`sh: vitest: not found`); dependency install timed out |
| `npm run build` | **Not verified** | Package dependencies absent; do not infer success from edits |
| Full TypeScript strict check | **Not verified** | Global `tsc` exists, project-specific React/Vite/Lucide/Zod type declarations are not installed |
| Mobile layout screenshot tests | **Not run** | No browser/E2E dependency was available for an actual rendered viewport sweep in this workspace |
| Screen-reader / keyboard audit | **Not run** | Semantic labels/focus patterns were added/retained, but no assistive-technology run was performed |
| Database, RLS, atomic commit, restore drill | **Not implemented/verified** | Intentionally outside the frontend-only stage and required before genuine store data |

## 4. Business-rule guardrails that remain blockers

- Reconcile the previously observed conflicting expected-cash figures before enabling Setoran in production. Use the same deterministic engine output for expected cash, variance, explanation and export; no component-local arithmetic.
- Resolve decision-register pending items before transaction persistence: default money source; early close and calendar-week boundary; first period/overlap rules; date-only time; future-event tolerance; audit actor without login; undo/correction cutoffs; export first-release scope; outlier thresholds; initial unknown-modal transition; close-time deposit semantics.
- Do not change a locked business rule to fit the visual design.
- Retest original golden cases and add cases for empty vs zero, source-of-money, physical stock greater than available, mid-period restock, non-sale stock changes, unknown modal, deposit not being income, and closed-period correction.

## 5. QA test plan before a production claim

### Screen/viewport matrix
- Screens: all 13 states listed in G3, especially Beranda, Catat Belanja, Cek Sisa, Biaya Toko, Setoran, Laporan, Riwayat and Pengaturan.
- Viewport widths: 320, 360, 390, 430, 768, 1024, 1280, 1440 CSS px.
- Check touch target sizes, safe-area padding, title overflow, input zoom, long currency/product name, horizontal overflow, keyboard overlay and print layout.
- Verify standard keyboard traversal and visible focus; test `prefers-reduced-motion`.
- Test color contrast for every foreground/background pair actually rendered; the G4 ratio list is an initial subset only.

### Required functional scenarios
1. Start with no data; confirm no fake transactions or fabricated Rp0.
2. Enter a purchase of 2 packages × 24 units at Rp96.000/package; preview must show 48 units and Rp192.000 total cost (existing engine golden test is expected to govern).
3. For retail Rp7.000/unit, label any all-units-sale value `Keuntungan Jual` with explanation that it is sales value before modal, not profit.
4. Enter physical remaining quantity 10 from known available 48; only when all stock movements are known may it derive 38 sold.
5. Distinguish damaged/used/unknown stock from sold quantity.
6. Source `Uang pribadi` must not reduce the cash held by employee; actual impact must be defined by the locked engine contract.
7. Setoran received by owner is not new sales/profit.
8. Unknown modal never becomes zero or definite profit.
9. Remaining greater than available never creates negative sales.
10. A retry after uncertain commit uses the same command ID; never create a duplicate event.
11. Closed-period correction preserves old snapshot and creates linked correction events.
12. Failed network write says not saved/uncertain, preserves draft and never shows a success receipt.

## 6. Release decision

The UI redesign (including light/dark theme selection) can be reviewed as a prototype candidate. **It is not production-ready for real shop accounting** until dependency install, build, tests, viewport/accessibility checks, business decision locks, backend authorization, atomic commit, append-only audit, and backup/restore have evidence of passing. This document intentionally does not label G5 production-complete.
