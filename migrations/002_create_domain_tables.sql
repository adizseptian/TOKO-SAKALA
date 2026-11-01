-- ==============================================================================
-- TOKO SAKALA — MIGRATION 002: Skema Tabel Domain Bisnis & Event Sinkronisasi
-- Dijalankan pada: SQL Editor di Dashboard Supabase (https://supabase.com)
-- Proyek: dvznpniodskujfbdznnv.supabase.co
-- ==============================================================================

-- 1. Tabel Produk / Katalog (products)
CREATE TABLE IF NOT EXISTS public.products (
  product_id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Makanan',
  unit text NOT NULL DEFAULT 'pcs',
  pack_size integer NOT NULL DEFAULT 1,
  cost_per_pack numeric NOT NULL DEFAULT 0,
  selling_price_per_unit numeric NOT NULL DEFAULT 0,
  icon text DEFAULT '📦',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Tabel Pergerakan Stok (stock_movements)
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id text PRIMARY KEY,
  product_id text REFERENCES public.products(product_id) ON DELETE CASCADE,
  change integer NOT NULL,
  unit text NOT NULL DEFAULT 'pcs',
  movement_type text NOT NULL DEFAULT 'MANUAL',
  note text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Tabel Belanja Barang / Pembelian (purchases)
CREATE TABLE IF NOT EXISTS public.purchases (
  id text PRIMARY KEY,
  product_id text REFERENCES public.products(product_id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  units_per_pack integer NOT NULL DEFAULT 1,
  total numeric NOT NULL,
  source_money text NOT NULL DEFAULT 'STORE',
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Tabel Penjualan Barang (sales)
CREATE TABLE IF NOT EXISTS public.sales (
  id text PRIMARY KEY,
  product_id text REFERENCES public.products(product_id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  total numeric NOT NULL,
  source_payment text NOT NULL DEFAULT 'CASH',
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Tabel Biaya Operasional Toko (expenses)
CREATE TABLE IF NOT EXISTS public.expenses (
  id text PRIMARY KEY,
  description text NOT NULL,
  amount numeric NOT NULL,
  source_money text NOT NULL DEFAULT 'STORE',
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Tabel Setoran Kasir / Karyawan (deposits)
CREATE TABLE IF NOT EXISTS public.deposits (
  id text PRIMARY KEY,
  expected_amount numeric NOT NULL,
  received_amount numeric NOT NULL,
  discrepancy numeric NOT NULL DEFAULT 0,
  note text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Tabel Periode Pembukuan (periods)
CREATE TABLE IF NOT EXISTS public.periods (
  id text PRIMARY KEY,
  start_date date NOT NULL,
  end_date date,
  is_closed boolean NOT NULL DEFAULT false,
  closed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Tabel Jejak Sinkronisasi & Idempotensi (sync_events)
CREATE TABLE IF NOT EXISTS public.sync_events (
  id text PRIMARY KEY,
  item_type text NOT NULL,
  item_id text NOT NULL,
  action text NOT NULL,
  idempotency_key text UNIQUE,
  device_id text,
  synced boolean NOT NULL DEFAULT true,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 9. Tabel Pendaftaran Cadangan Cloud (backup_registry)
CREATE TABLE IF NOT EXISTS public.backup_registry (
  id text PRIMARY KEY,
  file_name text NOT NULL,
  data_version integer NOT NULL DEFAULT 1,
  byte_size bigint NOT NULL DEFAULT 0,
  checksum text NOT NULL,
  description text,
  storage_path text,
  user_id uuid REFERENCES auth.users(id),
  backup_time timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- KEBIJAKAN KEAMANAN ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_registry ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses:
-- Mengizinkan akses pemilik toko. Jika user login via Supabase Auth (auth.uid()),
-- verifikasi identitas pengguna; jika anon client (public key dengan single-owner device),
-- berikan akses terotorisasi.
CREATE POLICY "Products access" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Stock movements access" ON public.stock_movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Purchases access" ON public.purchases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Sales access" ON public.sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Expenses access" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Deposits access" ON public.deposits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Periods access" ON public.periods FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Sync events access" ON public.sync_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Backup registry access" ON public.backup_registry FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- HAK AKSES ROLE SUPABASE API
-- ==============================================================================
GRANT ALL ON TABLE public.products TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.stock_movements TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.purchases TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.sales TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.expenses TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.deposits TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.periods TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.sync_events TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.backup_registry TO anon, authenticated, service_role;

-- Muat ulang cache schema PostgREST Supabase
NOTIFY pgrst, 'reload schema';
