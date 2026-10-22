# Build Status — Starter v0.1.0

## Implemented in this starter

- [x] Project structure and basic Next App Router shell.
- [x] Indonesian UI skeleton, dark-first deep teal/warm ivory.
- [x] No sample store data shown as if real.
- [x] Engine starter that calculates purchases, stock checks, weighted average cost, simple expenses/income/deposits, and uncertainty flags.
- [x] Golden tests for 3 dus × 24 pcs → 72 units; remaining 25 → 47 sold.
- [x] Host guard defaulting to localhost-only mode.
- [x] Initial typed SQL schema draft with RLS enabled and append-only triggers on history tables.
- [x] Documentation pack copied under `docs/specs/`.

## Not implemented or not proven

- [ ] Secure atomic `rpc_commit_command` and `rpc_close_period`.
- [ ] Full engine: close snapshots, periods, carryover, complete uncertainty ranges, historical corrections, canonical digest, stable engine versions.
- [ ] Schema has been applied to local PostgreSQL and tested.
- [ ] Database role `app_server`, least-privilege grants, policies, all security tests.
- [ ] Server Actions for product creation, purchases, stock checks, losses, expenses, income, deposits, period closure, correction and export.
- [ ] Persistence UI and live preview parity against server calculation.
- [ ] JSON/CSV/PDF/XLSX export.
- [ ] Backup and full restore drill against a real configured database.
- [ ] Test suite/lint/typecheck/build executed successfully in this container or on the user's computer.
- [ ] Google AI Studio repository import/sync tested under user's account.
- [ ] Host guard, network isolation and `127.0.0.1` behavior tested on the user's Windows system.

## Important warning

The project is safe to share as source code because it contains no database URL, password, API key, or store data. It is **not safe to use for actual bookkeeping yet**. Keep the database connection unset and do not apply the SQL migration to the real cloud project until the missing RPC/RLS/security and backup work is complete.
