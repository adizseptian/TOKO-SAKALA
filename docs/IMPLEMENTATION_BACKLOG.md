# Implementation Backlog — Recommended next work for the coding agent

Only move to the next item after tests pass and the change is reviewed.

## Phase 0 — Confirm the repository baseline

- [ ] Install dependencies and generate/commit `pnpm-lock.yaml` using the supported runtime.
- [ ] Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
- [ ] Fix starter-only errors. Do not change business rules to make tests pass.
- [ ] Confirm preview mode has no `DATABASE_URL`, secrets, or real store data.

## Phase 1 — Formalize the engine contract

- [ ] Convert every approved business rule into a golden fixture.
- [ ] Build deterministic sort by `(occurred_at UTC, server seq)`.
- [ ] Implement known/unknown modal pools and deterministic proportional exits.
- [ ] Implement the three separate outputs: stock, profit/results, money/deposits.
- [ ] Implement data certainty propagation and explanation tree.
- [ ] Implement price/package history and price-change interval ranges.
- [ ] Test restock, damage, goods used, unknown stock loss, opening stock without modal, and no-sales statement.
- [ ] Implement period window, partial close, immutable snapshot, carryover, and correction deltas.

## Phase 2 — Database security and atomic writes

- [ ] Review SQL schema against `docs/specs/13_BACKEND_SCHEMA.md` and TRD source.
- [ ] Add per-store constraints and closed-period constraints.
- [ ] Implement `rpc_commit_command`: validation, idempotency, optimistic sequence check, typed event detail insert, append-only behavior.
- [ ] Implement `rpc_close_period`: input sequence check, period gap/overlap checks, snapshot freeze and optional cash adjustment atomically.
- [ ] Configure/verify RLS, `app_server` least-privilege grants and default-deny public roles.
- [ ] Add PostgreSQL integration tests for idempotency, stale command, concurrency, cross-store FK, closed-period corrections, TRUNCATE denial and atomic close.
- [ ] Test on local PostgreSQL/Supabase before any cloud connection.

## Phase 3 — Read/write server actions

- [ ] Zod validate all action inputs.
- [ ] Server computes the authoritative preview and recomputes before commit.
- [ ] Use one stable command ID per user attempt; retries reuse that ID.
- [ ] Add explicit error codes/messages and no stale-data behavior after DB disconnect.
- [ ] Add actions for product, purchase, stock check, loss, expense, other income, deposit and period close.
- [ ] Do not make UI's disabled buttons active before their action and tests are implemented.

## Phase 4 — UI to domain

- [ ] Load only real repository data; no sample transactions in an empty store.
- [ ] Use the same engine for preview, server validation, dashboard, report and export.
- [ ] Add product creation and history views.
- [ ] Add stock check focus mode and anomaly clarification.
- [ ] Add expense and other-income forms separate from inventory purchases.
- [ ] Add deposit check with status rules and explanations.
- [ ] Add a closed-period correction flow.
- [ ] Pass `docs/UX_GATE.md` and responsive/a11y tests.

## Phase 5 — Reports and operational safety

- [ ] JSON/CSV export/import recovery specification (PDF/XLSX only after correct report data).
- [ ] Backup script, encryption instructions, backup age indicator, restore drill.
- [ ] Test Cloud database roles, connectivity loss, retry idempotency and restore on a clean database.
- [ ] Complete the personal/local-only data gate before real store data.

## Phase 6 — Later features

- [ ] Rules-first natural-language parser.
- [ ] Local OCR with arithmetic checks and blank uncertain fields.
- [ ] Optional insights only after the core data is stable.

**Never start with AI/OCR. Never activate actual saving before Phase 2 and 3 are complete.**
