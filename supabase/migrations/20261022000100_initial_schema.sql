-- TOKO SAKALA schema foundation — DRAFT ONLY.
-- Do not apply to real shop data until reviewed, RPC is implemented, and the data gate passes.
-- No demo rows are inserted by this migration.

begin;
create extension if not exists pgcrypto;

create table if not exists public.toko (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  timezone text not null default 'Asia/Jakarta' check (timezone = 'Asia/Jakarta'),
  created_at timestamptz not null default clock_timestamp()
);

create table if not exists public.product (
  id uuid primary key default gen_random_uuid(),
  toko_id uuid not null references public.toko(id),
  name text not null check (length(trim(name)) between 1 and 120),
  base_unit text not null default 'pcs' check (base_unit = 'pcs'),
  active boolean not null default true,
  created_at timestamptz not null default clock_timestamp(),
  archived_at timestamptz,
  unique (toko_id, id),
  check ((active and archived_at is null) or (not active))
);
create index if not exists product_toko_active_idx on public.product(toko_id, active, name);

create table if not exists public.command (
  id uuid primary key default gen_random_uuid(),
  toko_id uuid not null references public.toko(id),
  command_id uuid not null,
  payload_hash text not null check (length(payload_hash) between 32 and 128),
  result jsonb not null,
  created_at timestamptz not null default clock_timestamp(),
  unique (toko_id, command_id),
  unique (toko_id, id)
);

create table if not exists public.period_close (
  id uuid primary key default gen_random_uuid(),
  toko_id uuid not null references public.toko(id),
  period_start timestamptz not null,
  period_end timestamptz not null,
  completeness text not null check (completeness in ('LENGKAP', 'SEBAGIAN')),
  engine_version text not null,
  input_max_seq bigint not null check (input_max_seq >= 0),
  command_id uuid not null,
  closed_at timestamptz not null default clock_timestamp(),
  unique (toko_id, id),
  unique (toko_id, period_start, period_end),
  check (period_end > period_start),
  foreign key (toko_id, command_id) references public.command(toko_id, command_id)
);
create index if not exists period_close_toko_range_idx on public.period_close(toko_id, period_start, period_end);

create table if not exists public.event (
  id uuid primary key default gen_random_uuid(),
  toko_id uuid not null references public.toko(id),
  seq bigint generated always as identity,
  kind text not null check (kind in ('OPENING_STOCK','PURCHASE','STOCK_CHECK','DAMAGE','USED','UNKNOWN_LOSS','EXPENSE','OTHER_INCOME','DEPOSIT','PRICE_CHANGE','NO_SALES_STATEMENT','CASH_ADJUSTMENT','SETTING','VOID')),
  occurred_at timestamptz not null,
  occurred_precision text not null check (occurred_precision in ('TIMESTAMP','DATE_ONLY')),
  recorded_at timestamptz not null default clock_timestamp(),
  command_id uuid not null,
  supersedes_id uuid,
  correction_of_close_id uuid,
  source text not null default 'MANUAL' check (source in ('MANUAL','RULE_PARSER','OCR')),
  reason text,
  unique (toko_id, id),
  unique (toko_id, seq),
  foreign key (toko_id, command_id) references public.command(toko_id, command_id),
  foreign key (toko_id, supersedes_id) references public.event(toko_id, id),
  foreign key (toko_id, correction_of_close_id) references public.period_close(toko_id, id)
);
create index if not exists event_toko_seq_idx on public.event(toko_id, seq);
create index if not exists event_toko_time_seq_idx on public.event(toko_id, occurred_at, seq);

create table if not exists public.ev_purchase (
  event_id uuid primary key,
  toko_id uuid not null,
  foreign key (toko_id, event_id) references public.event(toko_id, id)
);
create table if not exists public.ev_purchase_item (
  id uuid primary key default gen_random_uuid(),
  toko_id uuid not null,
  event_id uuid not null,
  product_id uuid not null,
  pack_count bigint not null check (pack_count > 0),
  units_per_pack bigint not null check (units_per_pack > 0),
  units bigint generated always as (pack_count * units_per_pack) stored,
  total_cost_rupiah bigint not null check (total_cost_rupiah >= 0),
  money_source text not null check (money_source in ('STORE','PERSONAL')),
  foreign key (toko_id, event_id) references public.event(toko_id, id),
  foreign key (toko_id, product_id) references public.product(toko_id, id),
  check (pack_count <= 1000000000 and units_per_pack <= 1000000000)
);
create index if not exists ev_purchase_item_event_idx on public.ev_purchase_item(toko_id, event_id);

create table if not exists public.ev_opening_stock (
  event_id uuid primary key, toko_id uuid not null, product_id uuid not null,
  units bigint not null check (units >= 0), unit_cost_rupiah bigint check (unit_cost_rupiah >= 0),
  foreign key (toko_id, event_id) references public.event(toko_id, id),
  foreign key (toko_id, product_id) references public.product(toko_id, id)
);
create table if not exists public.ev_stock_check (
  event_id uuid primary key, toko_id uuid not null, product_id uuid not null,
  observed_units bigint not null check (observed_units >= 0),
  foreign key (toko_id, event_id) references public.event(toko_id, id),
  foreign key (toko_id, product_id) references public.product(toko_id, id)
);
create table if not exists public.ev_damage (
  event_id uuid primary key, toko_id uuid not null, product_id uuid not null,
  units bigint not null check (units > 0),
  foreign key (toko_id, event_id) references public.event(toko_id, id),
  foreign key (toko_id, product_id) references public.product(toko_id, id)
);
create table if not exists public.ev_used (
  event_id uuid primary key, toko_id uuid not null, product_id uuid not null,
  units bigint not null check (units > 0),
  foreign key (toko_id, event_id) references public.event(toko_id, id),
  foreign key (toko_id, product_id) references public.product(toko_id, id)
);
create table if not exists public.ev_unknown_loss (
  event_id uuid primary key, toko_id uuid not null, product_id uuid not null,
  units bigint not null check (units > 0), note text,
  foreign key (toko_id, event_id) references public.event(toko_id, id),
  foreign key (toko_id, product_id) references public.product(toko_id, id)
);
create table if not exists public.ev_expense (
  event_id uuid primary key, toko_id uuid not null, description text not null check (length(trim(description)) between 1 and 160),
  amount_rupiah bigint not null check (amount_rupiah > 0), money_source text not null check (money_source in ('STORE','PERSONAL')),
  foreign key (toko_id, event_id) references public.event(toko_id, id)
);
create table if not exists public.ev_other_income (
  event_id uuid primary key, toko_id uuid not null, description text not null check (length(trim(description)) between 1 and 160),
  amount_rupiah bigint not null check (amount_rupiah > 0),
  foreign key (toko_id, event_id) references public.event(toko_id, id)
);
create table if not exists public.ev_deposit (
  event_id uuid primary key, toko_id uuid not null, amount_rupiah bigint not null check (amount_rupiah > 0),
  foreign key (toko_id, event_id) references public.event(toko_id, id)
);
create table if not exists public.ev_price_change (
  event_id uuid primary key, toko_id uuid not null, product_id uuid not null,
  selling_price_rupiah bigint not null check (selling_price_rupiah >= 0),
  foreign key (toko_id, event_id) references public.event(toko_id, id),
  foreign key (toko_id, product_id) references public.product(toko_id, id)
);
create table if not exists public.ev_no_sales_statement (
  event_id uuid primary key, toko_id uuid not null, product_id uuid not null,
  no_sales boolean not null check (no_sales = true),
  foreign key (toko_id, event_id) references public.event(toko_id, id),
  foreign key (toko_id, product_id) references public.product(toko_id, id)
);
create table if not exists public.ev_cash_adjustment (
  event_id uuid primary key, toko_id uuid not null, amount_rupiah bigint not null check (amount_rupiah <> 0),
  reason text not null check (length(trim(reason)) between 1 and 240),
  foreign key (toko_id, event_id) references public.event(toko_id, id)
);
create table if not exists public.ev_setting (
  event_id uuid primary key, toko_id uuid not null,
  setting_key text not null check (setting_key in ('DEFAULT_PURCHASE_SOURCE','DEFAULT_EXPENSE_SOURCE','STORE_NAME')),
  text_value text, boolean_value boolean, integer_value bigint,
  foreign key (toko_id, event_id) references public.event(toko_id, id),
  check (num_nonnulls(text_value, boolean_value, integer_value) = 1)
);

create table if not exists public.snapshot_line (
  id uuid primary key default gen_random_uuid(), toko_id uuid not null, close_id uuid not null,
  line_key text not null, amount_rupiah bigint, certainty text not null check (certainty in ('PASTI','PERLU_DIPERIKSA','BELUM_DIKETAHUI')),
  unique (toko_id, close_id, line_key),
  foreign key (toko_id, close_id) references public.period_close(toko_id, id)
);
create table if not exists public.snapshot_product_state (
  id uuid primary key default gen_random_uuid(), toko_id uuid not null, close_id uuid not null, product_id uuid not null,
  known_units bigint not null check (known_units >= 0), unknown_units bigint not null check (unknown_units >= 0),
  known_value_rupiah bigint not null check (known_value_rupiah >= 0), last_check_at timestamptz,
  certainty text not null check (certainty in ('PASTI','PERLU_DIPERIKSA','BELUM_DIKETAHUI')),
  unique (toko_id, close_id, product_id),
  foreign key (toko_id, close_id) references public.period_close(toko_id, id),
  foreign key (toko_id, product_id) references public.product(toko_id, id)
);
create table if not exists public.snapshot_explain (
  id uuid primary key default gen_random_uuid(), toko_id uuid not null, close_id uuid not null,
  tree jsonb not null,
  foreign key (toko_id, close_id) references public.period_close(toko_id, id)
);
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(), toko_id uuid not null references public.toko(id),
  action text not null, object_type text not null, object_id uuid, before_value text, after_value text, reason text,
  occurred_at timestamptz not null default clock_timestamp()
);
create table if not exists public.backup_log (
  id uuid primary key default gen_random_uuid(), started_at timestamptz not null,
  finished_at timestamptz, status text not null check (status in ('STARTED','SUCCESS','FAILED')),
  artifact_label text, checksum text, notes text
);

-- No direct anonymous/authenticated access. The app stays closed by default.
do $$
declare t text;
begin
  foreach t in array array[
    'toko','product','command','period_close','event','ev_purchase','ev_purchase_item','ev_opening_stock','ev_stock_check',
    'ev_damage','ev_used','ev_unknown_loss','ev_expense','ev_other_income','ev_deposit','ev_price_change',
    'ev_no_sales_statement','ev_cash_adjustment','ev_setting','snapshot_line','snapshot_product_state',
    'snapshot_explain','audit_log','backup_log'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Append-only tables are locked at DB level. Writes must later be provided via vetted atomic RPC functions.
create or replace function public.ts_reject_mutation() returns trigger
language plpgsql as $$
begin
  raise exception using errcode = '55000', message = 'TS_APPEND_ONLY: catatan historis tidak boleh ditimpa atau dihapus';
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'command','period_close','event','ev_purchase','ev_purchase_item','ev_opening_stock','ev_stock_check',
    'ev_damage','ev_used','ev_unknown_loss','ev_expense','ev_other_income','ev_deposit','ev_price_change',
    'ev_no_sales_statement','ev_cash_adjustment','ev_setting','snapshot_line','snapshot_product_state',
    'snapshot_explain','audit_log','backup_log'
  ] loop
    execute format('drop trigger if exists %I on public.%I', 'ts_append_only_' || t, t);
    execute format('create trigger %I before update or delete on public.%I for each row execute function public.ts_reject_mutation()', 'ts_append_only_' || t, t);
    execute format('drop trigger if exists %I on public.%I', 'ts_no_truncate_' || t, t);
    execute format('create trigger %I before truncate on public.%I for each statement execute function public.ts_reject_mutation()', 'ts_no_truncate_' || t, t);
  end loop;
end $$;

commit;

-- Intentionally absent in this starter: rpc_commit_command, rpc_close_period, app_server grants/policies,
-- overlap/gap exclusion enforcement, closed-period correction trigger, command idempotency replay,
-- and production audit/change-product RPC. Implement and test these before any real data is stored.
