# 15 — Testing Strategy & Acceptance

**Status:** test matrix and some source artifacts have been discussed. Any prior tests must be attributed exactly to their reported environment; local DB tests do not prove actual Supabase or UI behavior.

## 1. Test layers

1. **Golden business tests:** hand-calculated inputs and expected results.
2. **Unit/invariant tests:** pure calculation engine, rounding, modal pools, certainty propagation.
3. **Database contract tests:** constraints, permissions, idempotency, append-only, RPC atomicity.
4. **Concurrency tests:** simultaneous commands/period closing.
5. **Server Action tests:** input validation, stale-data rejection, DB failure, preview/save parity.
6. **E2E UI tests:** user can run real path end-to-end.
7. **Accessibility tests:** keyboard, focus, contrast, axe checks and labels.
8. **Security tests:** Host guard, localhost binding, secret scan, database role denial.
9. **Backup/restore drill:** full dump → encrypt → restore to empty DB → checksum.
10. **Regression test:** historic snapshots/replay after engine change.

## 2. Golden calculation cases

### GT1 — Package conversion
3 dus × 24 pcs/dus at Rp96.000/dus → 72 pcs, total modal Rp288.000, modal/pcs display Rp4.000.

### GT2 — Stock check sale
Available 72, physical remainder 25 → 47 sold, price Rp7.000 → sales Rp329.000; cost Rp188.000; product profit Rp141.000.

### GT3 — Cash source affects cash, not stock/profit
Same buy/sale as above. If stock-funded purchase: expected cash from events = Rp329.000 − Rp288.000 = Rp41.000 before deposits, excluding any other prior balance/events. If personally funded: expected shop cash from those events = Rp329.000 before deposits. The result must say which source was used.

### GT4 — Unsold stock modal stays in inventory
25 pcs remaining at Rp4.000/pcs represent Rp100.000 remaining modal value; do not subtract all purchased modal from profit.

### GT5 — Moving-average restock
Monday 20 pcs @ Rp4.000; Thursday 20 pcs @ Rp4.200; Sunday remainder 5. Quantity sold 35. Known modal total Rp164.000; moving average Rp4.100; sold cost Rp143.500; ending inventory value Rp20.500.

### GT6 — Unknown initial modal
Stock quantity may be tracked but modal/profit for unknown-cost part stays Belum Diketahui or estimate/Perlu Diperiksa according to approved transition rule. Never label exact certainty without confirmation.

### GT7 — Price change during interval
If price changes while an open interval can include sales, offer a new stock checkpoint. If deferred, sales/cash uses a low/high range and status Perlu Diperiksa. Never invent how many units sold at each price.

### GT8 — Used/damaged/unknown stock
Each physical unit leaves only one bucket: sold, damaged, used, or unexplained discrepancy. Damage/used reduce stock and result, not cash. Unknown loss is not sale; known modal affects result with uncertainty.

### GT9 — Deposit status
- Exact amount + all certainty complete → COCOK.
- Difference with unresolved source/uncertainty → PERLU DIPERIKSA.
- Nonzero definite difference with all relevant components certain → BELUM COCOK.
- No deposit recorded → MENUNGGU SETORAN.

### GT10 — rounding/no value leakage
Unit display may be fractional, but source total and quantity determine values. Exit rounding remainder stays in known modal value; total pool value is conserved.

## 3. Database tests

- Same command ID + same payload: replay previous result; no duplicate rows.
- Same command ID + different payload: reject.
- Stale expected sequence: reject and require reload/review.
- Multi-event command: all events commit or none.
- Append-only UPDATE/DELETE/TRUNCATE denied for protected history.
- `anon` and `authenticated` have no database access under local-only model.
- `app_server` cannot mutate events directly; only permitted reads and RPC.
- Cross-store FK rejected.
- Closed period event requires correction relation.
- Snapshot and period close are atomic.
- Concurrent close/commit cannot create gap/overlap or inconsistent snapshot under approved policy.
- All RLS/GRANT policies have positive and negative tests.

## 4. Server/E2E tests

- Missing/invalid input fails before write.
- Preview output equals server save output for identical state.
- DB unavailable during load does not show fabricated data.
- DB disconnect after load disables save and leaves draft in UI.
- Connection loss at commit retries with same ID and does not duplicate.
- Save success is shown only after authoritative server response.
- Stock count anomaly shows one useful question.
- Confirmation cancel produces no event.
- Undo/void creates traceable event.
- Closed-period correction produces current-period event while old snapshot remains unchanged.
- Every view has loading, empty, error, success, disconnected and uncertainty state.

## 5. Security tests / Data Real Gate

- App listens only on `127.0.0.1`; request from another device in LAN fails.
- Host header not in localhost allowlist returns 403; test `Host: evil.example`.
- No tunnel/port forwarding/remote dev runtime; Ports list checked.
- Secret scan finds no credential in repo, public bundles, Git history as configured, logs or prompts.
- `.env.local` ignored and never bundled.
- Cloud database has no test/demo rows.
- Supabase role tests run against actual project; local PostgreSQL tests do not substitute.
- First backup restored into an empty database and verified.
- Terms/limits/pricing checked; no payment card/add-on accepted.

## 6. UX gate

- Primary UI has no HPP/COGS/debit/credit/journal/reconciliation/batch jargon.
- Status always includes words/icons, not color alone.
- Inputs labelled; keyboard use and visible focus work.
- Contrast target ≥4.5:1 and touch target ≥44px.
- Mobile width 360px: no broken form or hidden action.
- Dashboard has five key answers max.
- Stock count is focused and preview never mistaken for saved data.
- “Belum diketahui” and “Perlu diperiksa” show affected figures.
- User can find “Kenapa?” explanation from core numbers.

## 7. Regression and snapshot testing

After any engine change:
1. bump/version the engine if output semantics change;
2. replay all approved fixtures;
3. compare snapshot output for existing saved closes using the snapshot's engine version;
4. test deltas do not mutate old snapshot;
5. record exact changed values and reason in release notes;
6. do not update goldens solely to conceal a failing behavior.

## 8. Evidence reporting

Every test summary says: environment (local Postgres vs Supabase), command/fixture, count of passed/failed, skipped/uncovered areas, timestamp/build commit. Do not claim “70 assertions pass” as proof of formula, Supabase integration, browser behavior, or restore to Supabase unless those exact tests ran there.
