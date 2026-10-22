> **Catatan adaptasi v0.2.0:** tahapan dimulai dari audit/build UI React + Vite di Google AI Studio. Backend, database, dan penyimpanan transaksi tetap mengikuti prinsip integritas dalam dokumen ini, tetapi belum diimplementasikan pada starter. Jangan mengaktifkan tombol simpan transaksi sebelum tahap backend/keamanan lulus. Lihat `../GOOGLE_AI_STUDIO_ADAPTER.md`.

# 14 — Implementation Plan TOKO SAKALA

**Principle:** implement the smallest reliable vertical slice, verify it, then proceed. Do not build all UI/screens before the calculation rules are proven.

## Stage 0 — Document and decision baseline

- [ ] Store this pack under `docs/`.
- [ ] Record decision status in `DECISION_REGISTER.md`.
- [ ] Resolve business questions blocking calculations and period closure.
- [ ] Mark PRD v1.0 baseline and identify revisions that supersede it.
- [ ] Make no claims that draft decisions are locked.

**Exit:** developer can identify what is locked, pending, deferred, and unverified.

## Stage 1 — Repo and local development

- [ ] Create/verify repository; use existing resources when appropriate.
- [ ] Initialize Next.js App Router + TS strict + Tailwind + Radix-based shadcn.
- [ ] Configure pnpm, ESLint, Prettier, TypeScript check, Vitest.
- [ ] Create `.env.example`, `.gitignore`, `README.md`; scan for secrets.
- [ ] Run local PostgreSQL/Supabase CLI for all fixtures and tests.
- [ ] Implement basic health screen and error boundary.

**Exit:** fresh checkout setup succeeds using documented commands; no cloud data touched.

## Stage 2 — Domain and deterministic engine

- [ ] Write event/type unions and Zod schemas.
- [ ] Implement integer money/unit helpers and deterministic rounding.
- [ ] Implement known/unknown modal pools, moving average, and stock conservation.
- [ ] Implement purchase and stock-check interval logic.
- [ ] Implement damage, used stock, unknown stock loss, price/package history.
- [ ] Implement product profit and uncertainty propagation.
- [ ] Implement cash, money-source behavior, deposits, and statuses.
- [ ] Implement price change inside an open interval.
- [ ] Implement period window, closure snapshot, carry-forward differences once period rule approved.
- [ ] Add golden fixtures and hand-calculated expectations.

**Exit:** all approved golden cases pass; deterministic replay; preview/server parity tests set up.

## Stage 3 — Database migrations and atomic commit

- [ ] Implement relational schema/migrations locally.
- [ ] Add FKs, CHECKs, unique/idempotency constraints, append-only rules, RLS and role grants.
- [ ] Implement commit RPC and close-period RPC.
- [ ] Test duplicate command, altered payload, stale sequence, concurrency, closed period, correction chain.
- [ ] Do NOT seed cloud real-data project.

**Exit:** DB tests pass on local Postgres; role/constraint tests document evidence.

## Stage 4 — Server application layer

- [ ] Server-only database connection/repository.
- [ ] Server Actions with Zod and authoritative engine recompute.
- [ ] Standard action result/error union.
- [ ] Stable command ID for idempotent writes.
- [ ] Connection timeouts and DB_UNAVAILABLE behavior.
- [ ] Host guard and localhost binding tests.

**Exit:** one full command commits atomically; retry cannot duplicate; no secret reaches browser.

## Stage 5 — UI vertical slice

Build in this order:
1. App shell and connection status.
2. Setup/product list.
3. Purchase form + preview + save.
4. Stock count + anomaly prompt + preview + save.
5. Damage/used event.
6. Expense and other income.
7. Deposit and status explanation.
8. Close period and read-only snapshot.
9. Report/export and history/correction.

**Exit:** at least one full user path works from UI to real local Postgres and has E2E coverage.

## Stage 6 — UI polish, a11y, UX gate

- [ ] Implement deep teal + warm ivory direction, status semantics, responsive layouts.
- [ ] Check 360px mobile, tablet, desktop.
- [ ] Keyboard and screen-reader review, focus management, reduced motion.
- [ ] Test empty/loading/error/uncertain/offline states.
- [ ] Confirm prohibited technical terms do not leak into primary UI.
- [ ] Verify numbers/formatting against engine output.

**Exit:** UX gate in `15_TESTING.md` passes.

## Stage 7 — Backup, restore, and data-real gate

- [ ] Implement export JSON/CSV and requested PDF/Excel report path as scope permits.
- [ ] Full encrypted DB backup, key private to owner.
- [ ] Restore full backup to empty DB; verify checksums and relations.
- [ ] Validate Supabase limits/pricing directly, no payment method/add-on required.
- [ ] Apply reviewed migrations to a clean Supabase project only at this stage.
- [ ] Test anon/authenticated denial and `app_server` grant boundary in cloud.
- [ ] Verify no test rows in real-data DB.
- [ ] Run localhost binding, Host guard, network reachability, secret scan.

**Exit:** every checkbox of Data Real Gate passes with recorded evidence.

## Stage 8 — Real-data pilot

- [ ] Enter minimal real products only after backup accepted.
- [ ] Reconcile beginning stock manually.
- [ ] Compare first purchase/stock check/deposit against paper/manual calculations.
- [ ] Export data and verify the report.
- [ ] Do not add AI until core behavior is stable and owner approves.

## Stage 9 — Future additions

Only after core sign-off: rule-based text parser, then local/browser OCR, smart restock insights. AI/OCR outputs proposed fields only; all writes use standard preview/confirm/save.

## Reporting cadence for each stage

Developer reports: stage/name; code/resources actually changed; commands/tests and results; open decision; risks; next stage only if exit criteria pass. Never claim tests/security/deploy succeeded without evidence.
