# Decision Register — TOKO SAKALA

Labels:
- **LOCKED**: explicitly locked in product principles or reiterated as a hard rule.
- **AGREED DIRECTION**: chosen direction, while implementation details may still be open.
- **PENDING / NOT FINAL**: must not be implemented as a settled fact until the source documents are reconciled and approved.
- **NOT TESTED**: code/docs alone do not prove this behavior works.

## LOCKED product rules

1. Product principle: “Jangan membuat pengguna memahami sistem. Buat sistem yang memahami pengguna.”
2. Users record real-world events; the system calculates and explains.
3. Stock balance is the user input; sold units are derived only when justified.
4. Restock does not automatically create a new reporting period.
5. Historical purchase prices, package content, and selling prices are preserved.
6. A stock discrepancy is not silently treated as a sale.
7. Profit, store cash, and deposits are separate concepts.
8. Important numbers must be explainable.
9. AI/OCR may propose data but may not commit silently or become the source of truth.
10. Important changes must be auditable; closed history cannot be silently rewritten.
11. No event means no forced user task.
12. UI language is Indonesian and everyday; accounting terminology is hidden from the primary interface.
13. Average moving cost is preferred over FIFO due to checkpoint-based sales estimation.
14. Units with unknown modal stay separate and cannot be assigned invented modal.
15. A purchase is inventory, not automatically an operating expense.
16. Product damage, goods used by the shop, and unknown stock loss are separate events.
17. Event chronology and accounting periods are separate: store cash is cumulative, report periods are windows.
18. One pure calculation engine must power preview, save validation, dashboard and reports.

## AGREED DIRECTION

- Product UI approach B: simple but modern.
- First-stage priority: balance ease of use and accuracy.
- Design: dark-first, Deep Teal + Warm Ivory; avoid violet.
- App sections: Beranda, Barang, Belanja, Cek Sisa, Uang & Setoran, Laporan; Asisten and advanced features later.
- A single quick-add area is preferred.
- Starter stack: Next.js App Router, TypeScript strict, Tailwind CSS v4, PostgreSQL, Zod, server-only database operations.
- Personal/local-first app with no login is current intended usage; do not expose publicly.
- No non-cash sales handling in current MVP. If shop actually uses QRIS/transfer/receivables, current cash model will not represent them; do not insert them unrecorded and treat reports as complete.
- Use integer rupiah and integer pcs.
- Initial form data may be incomplete; unknown modal/source must be labelled, not invented.

## PENDING / NOT FINAL — reconcile before full implementation

1. PRD v1.1, APPFLOW revision 3, TRD v3 and BUILD_ORDER must become a single approved source of truth.
2. Exact §22 policy decisions (date-only normalization, period boundary, miscount correction, localhost host guard, future date tolerance, cancellation semantics, UX gating, cloud disconnection behaviors) need explicit approval as specified by the latest APPFLOW revision.
3. Early period close vs calendar Monday–Sunday boundaries must have a single rule. TRD draft says early close creates contiguous next segment; other product wording uses calendar weeks.
4. The exact behavior of “no sales” statements and stale/late stock checks across period boundaries needs complete golden fixtures.
5. Amount/range calculation when price changes inside a stock-check interval needs full implementation and approved examples.
6. Source of money default behavior must be consistent: asked on first purchase/expense, stored as changeable default, and snapshot at each event; no silent assumption before the first answer.
7. Noncash, account receivables, purchase credit, dual selling units, consignment, vendor gifts and discounts are out of MVP; confirm any change only if needed.
8. Database schema/RPC/RLS is not final. No writes until the transaction, idempotency, permissions, correction, snapshot and recovery tests exist.

## NOT TESTED

- Package installation with the user's runtime and exact lockfile.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` in the user's environment.
- SQL migration on local Postgres/Supabase and Supabase cloud.
- Host/DNS-rebinding defense on Windows.
- Backup/restore against cloud database.
- Google AI Studio import and sync on the user's account.

## Change policy

Any change to a locked business rule must:
1. identify the source rule being changed;
2. explain the impact on inventory, profit, cash, deposit and history;
3. update PRD/APPFLOW/TRD/engine fixtures consistently;
4. include tests for the new and old edge cases;
5. be approved before merging.
