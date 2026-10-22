# 13 — Backend Schema & Data Model

**Status:** domain/schema proposal aligned to TRD v3. Final DDL must be implemented as SQL migrations and verified against the actual Postgres contract. Table list below is architectural, not a claim that every table has already been created.

## 1. Design rules

- Relational typed tables for core business events; JSON only for derived explanation trees/command result envelope where appropriate.
- Append-only events. Edits/voids/corrections add records/versions rather than overwrite fact history.
- Stable IDs and `toko_id` on tenant-scoped data; composite FKs prevent cross-store references even in single-store deployment.
- Rupiah integer and unit counts as integer; no floating-point money.
- Keep purchase totals and unit counts as source of truth; per-unit average is derived.
- Current product metadata can be updated through an audited path; old purchase/price records remain intact.
- Period snapshots are immutable and carry engine version, sequence/input boundary, certainty, and explanation data.

## 2. Core tables (proposed inventory)

| Table | Responsibility |
|---|---|
| `toko` | one store workspace/settings |
| `product` | product identity, name, base unit, archived state |
| `event` | append-only event header: ID, store, sequence, type, occurrence time, recorded time, precision, command ID, source, supersedes/correction links |
| `ev_stock_check` | physically observed remaining stock per product |
| `ev_purchase` | purchase header: date, source of money, total |
| `ev_purchase_item` | product, packs/units, units per package snapshot, total price, computed base units |
| `ev_damage` | damaged stock outflow |
| `ev_used` | stock used by shop/owner |
| `ev_expense` | operational store expense and money source |
| `ev_other_income` | non-product income |
| `ev_deposit` | actual cash deposited, timestamp and target period/reference |
| `ev_price_change` | effective-dated selling price change |
| `ev_no_sales_statement` | explicit claim of no sales since a check; never substitutes for a stock observation |
| `ev_cash_adjustment` | explicit cash discrepancy/reconciliation correction when approved |
| `ev_setting` | effective-dated settings/default source choices |
| `period_close` | close boundary, completeness, engine version, max input sequence, snapshot reference |
| `snapshot_line` | immutable aggregate lines per period/result category |
| `snapshot_product_state` | frozen stock/value/certainty per product |
| `snapshot_explain` | frozen explanation tree/metadata |
| `command` | idempotency key, normalized payload hash/result, sequence outcome; RPC-only access |
| `audit_log` | non-secret operational audit information/change explanation |
| `backup_log` | backup/restore timestamp and result; never stores private key |

Depending on migrations, some table names may be adjusted, but semantics and invariants cannot be removed without revising this document and tests.

## 3. Common event columns

Suggested common fields:
- `id` UUID or stable identifier;
- `toko_id`;
- `seq` server-assigned monotonic sequence within the store;
- `kind` typed event discriminator;
- `occurred_at` stored in UTC;
- `occurred_precision` (instant/date-only/known interval as supported);
- `recorded_at` server timestamp;
- `command_id` idempotency reference;
- `source` (manual; future parser/OCR only after MVP);
- `supersedes_id` for versioning;
- `correction_of_close_id`/original event reference where applicable;
- `voids_event_id` or equivalent for cancellations.

Use explicit FK, CHECK and UNIQUE constraints rather than only form validation.

## 4. Product and pack history

A purchase item stores the package-content value valid for that event. Product's current default package content may be updated but cannot alter old purchase items. Selling price changes are separate effective-dated events. Purchase-history and package-history screens may be views over event data rather than duplicative source tables.

## 5. Modal model

Per product, the engine maintains two logical pools:
- **Known modal pool:** `{quantity, total_value}`.
- **Unknown modal pool:** quantity with no proven cost.

Moving-average for known modal units uses total known value divided by known quantity, with stable deterministic rounding. Exits consume the selected/policy-defined pool without value leakage; any rounding remainder stays in pool value until later exits. Unknown modal remains unknown unless a user-confirmed, labelled estimate or an approved rule provides a value. Certainty is propagated to result amounts.

## 6. Constraints, indexes, trigger/RPC rules

- CHECK: positive package contents; non-negative quantities unless the event type is a signed correction; monetary values within safe range.
- Unique/idempotency: same store + command ID cannot create multiple effects.
- Sequence and chronology indexes, e.g. `(toko_id, seq)` and `(toko_id, occurred_at, seq)`.
- No cross-store foreign references.
- Append-only enforcement for event/snapshot/command/audit records; UPDATE/DELETE/TRUNCATE refused where policy requires.
- Version chain validation.
- Closed-period gate requires correction relationship rather than direct late mutation.
- Active period range must not overlap; gap/contiguity constraints depend on final early-close rule.
- RLS enabled; `anon` and `authenticated` have no database access in the local-only architecture; `app_server` has limited SELECT and EXECUTE on RPCs.
- Event details cannot be inserted directly from the app role; commit RPC writes header + details in one DB transaction.

## 7. Transaction functions

### `rpc_commit_command`
Responsibilities: acquire store-level concurrency lock; validate store/context; check command ID and payload hash; compare expected max sequence; validate event kinds and closed-period rules; write event headers and detail rows atomically; return IDs/sequence/replayed flag. Same ID/same payload returns existing result; same ID/different payload rejects.

### `rpc_close_period`
Responsibilities: lock closing operation; ensure input sequence current; validate period boundaries and status; create immutable snapshot with engine version and completeness; write required cash adjustment atomically if explicitly selected; mark period closed.

The exact function signature and error codes are established by migration code and integration tests, not by this proposal alone.

## 8. Error codes

Suggested stable app/database error categories: `VALIDATION`, `TS_BAD_PAYLOAD`, `TS_NO_TOKO`, `TS_COMMAND_REUSED`, `TS_STALE`, `TS_BAD_CHAIN`, `TS_CLOSED_PERIOD`, `TS_BAD_CORRECTION`, `TS_PERIOD_GAP`, `TS_APPEND_ONLY`, `TS_UNKNOWN_KIND`, `DB_UNAVAILABLE`, `PARITY_MISMATCH`, `NEED_CONFIRMATION`, `INTERNAL`.

Users see simple Indonesian messages; developer diagnostics preserve safe codes/context without secrets.

## 9. Time and periods

Store event timestamps in UTC and show WIB. Proposed rules: date-only is normalized to noon WIB; chronological ties use server sequence; future events more than five minutes ahead are rejected; weekly period uses Monday 00:00 inclusive to next Monday 00:00 exclusive. Early close and subsequent segment boundaries remain pending until policy is locked. Engine tests and DB constraints must implement exactly one policy.

## 10. Data migration/recovery

All schema changes use versioned SQL migration in Git. Local development DB contains fixtures/seeds; real-data cloud does not receive test seed. Backup/restore must use a full database dump due to cross-table and closed-period constraints. Verify row counts/checksum and constraints after restore. Do not enable live data until restore drill passes.
