# G5 — Implementation & QA Gate v2.1

Status: **design / standalone prototype review; not production-ready**.

## Release policy

No screen counts as ready because it looks complete. It must pass the relevant behavior, responsive, accessibility, data-integrity, and anti-slop checks with evidence. A failed or unrun check must be reported as FAIL or NOT RUN—not silently downgraded.

## Gate A — Strategy / Scope

- [ ] Every visible screen has one primary job and an explicit user outcome.
- [ ] Screen inventory and actions match the product's current approved scope.
- [ ] No fake numbers, fake ratings, fake sync status, fake AI call, or fabricated security state.
- [ ] Unknown modal / source-of-money / unit conversion remains unknown; no silent zero.
- [ ] No UI-only change modifies calculation contract.

## Gate B — Data and calculation integrity

- [ ] Browser preview and server transaction calculation use the same deterministic engine/version.
- [ ] `packages × units per pack` is validated against safe integer overflow.
- [ ] `packages × purchase price per pack` is validated and formatted in Rupiah.
- [ ] Rounding of average cost is explicit; original total cost remains the source of truth.
- [ ] Profit is not equal to retail price minus modal except for a correctly scoped unit-level difference; period profit uses sold units and other income/cost rules.
- [ ] Mixed units never yield a misleading combined physical quantity.
- [ ] Stock incomplete state propagates into summaries and reports.
- [ ] Setoran values have explicit definitions: expected handover / actual received / difference; sign and who-owes-whom semantics reviewed by product owner.
- [ ] Empty source of money does not silently subtract from shop cash.
- [ ] Closed snapshots remain immutable; corrections are append-only and linked.
- [ ] Idempotency, concurrent commits and transaction atomicity verified server-side.

## Gate C — Mobile usability

Test at widths **320, 360, 390, 430, 768, 1024, and 1440 CSS px**; actual Android Chrome is required before release.

- [ ] No horizontal body overflow at all widths.
- [ ] Bottom nav remains visible and does not cover controls or result messages.
- [ ] Safe area and device browser chrome don't cover critical actions.
- [ ] Numeric virtual keyboard appears for numeric inputs.
- [ ] Focus moves logically; Enter/Space works on controls; Escape closes overlays.
- [ ] Buttons have 44×44 CSS px target minimum; dense steppers tested with one thumb.
- [ ] At 200% zoom and with long Indonesian names/Rp amounts, layout remains usable.
- [ ] Form validation preserves valid inputs and tells the user exactly what to fix.
- [ ] Empty, loading, offline, unknown, zero, error, success and disabled states are inspectable.

## Gate D — Visual and accessibility

- [ ] Colors measured with a contrast checker; text meets WCAG AA for all shipped pairs.
- [ ] Focus ring visible on every interactive element.
- [ ] Status not conveyed by color alone.
- [ ] Reading order follows visual order, including desktop layout.
- [ ] Screen-reader name, role and state verified; icons decorative unless they have accessible names.
- [ ] `prefers-reduced-motion` disables non-essential motion.
- [ ] System-font fallback works offline and at 200% zoom.
- [ ] Product artwork is approved, licensed or shown as neutral placeholder.
- [ ] The new interface is recognizably not the previous Field Ledger design; no unmotivated visual regression.

## Gate E — Function and backend

- [ ] No dead buttons. If the feature isn't implemented, it is visibly unavailable and explains why.
- [ ] No success copy before a server-confirmed commit.
- [ ] All form writes validate server-side and return explicit errors.
- [ ] Auth/RLS/owner access checked; sensitive secrets never shipped to the browser.
- [ ] Audit, backup, restore and correction flow verified.
- [ ] PDF/Excel export tested for chosen date range and reconciliation to displayed figures.
- [ ] Preview, commit, dashboard, report and export match the same calculation result.
- [ ] No financial data is sent to external AI or analytics without an approved privacy design.

## Gate F — Anti-slop delivery report

Before a PR/deployment, report:
1. **Hard checks:** PASS/FAIL with evidence.
2. **Purpose checks:** technique used and why.
3. **Liveliness:** ENERGY/RHYTHM/MOTION settings and whether motion improves feedback.
4. **Craftsmanship/quality:** responsiveness, accessibility, content accuracy, consistency, failures and known gaps.

If the repository includes `ANTISLOP.md`, run it for UI changes. This package only points to the repository; it does not claim to bundle or run antislop.

## Current prototype evidence

| Check | Result | Evidence / limitation |
|---|---|---|
| Single-file HTML / CSS / JS | PASS after static check | No external runtime dependency intended |
| Responsive rules | Present | Includes mobile shell + desktop rail breakpoints; browser viewport sweep still required |
| Reduced motion | Present | CSS media query included |
| Purchase preview | Implemented locally | No persistence or authoritative server calculation |
| Stock search/category/quantity | Implemented locally | State resets on refresh; sample data only |
| Setoran difference preview | Implemented locally | Sample data; production sign semantics require product-owner review |
| Expense source preview | Implemented locally | No saved transaction |
| Report/export | PARTIAL | Selector and explanatory notice only; no real file generated |
| Auth/RLS/server atomic transaction | NOT IMPLEMENTED | Must be tested in production code |
| Automated browser screenshot sweep | NOT RUN | No verifiable run in this environment |
| Accessibility tree / screen reader | NOT RUN | Requires browser/device audit |
| WCAG contrast audit | NOT RUN | Colors documented but no linter result claimed |
| Production readiness | FAIL / NOT READY | Prototype is not the book of record |

## Explicit handoff

This design package is a review and implementation guide. It does not overwrite the live website, connect to a database, create real financial events or guarantee that a generated image represents the pixel-exact HTML prototype.
