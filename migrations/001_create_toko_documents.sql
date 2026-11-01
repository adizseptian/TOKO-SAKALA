-- ==============================================================================
-- TOKO SAKALA — MIGRATION 001: Skema Sinkronisasi Cloud Supabase (PostgreSQL Rp0)
-- Dijalankan pada: SQL Editor di Dashboard Supabase (https://supabase.com)
-- Proyek: dvznpniodskujfbdznnv.supabase.co
-- ==============================================================================

-- 1. Tabel Utama Dokumen Toko (toko_documents)
-- Digunakan untuk menyimpan payload bisnis, versi data, dan checksum SHA-256
CREATE TABLE IF NOT EXISTS public.toko_documents (
  id text PRIMARY KEY,
  data_version bigint NOT NULL DEFAULT 1,
  version bigint NOT NULL DEFAULT 1,
  checksum text NOT NULL,
  content jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Pastikan kedua kolom data_version dan version ada (kompatibilitas skema)
ALTER TABLE public.toko_documents ADD COLUMN IF NOT EXISTS data_version bigint DEFAULT 1;
ALTER TABLE public.toko_documents ADD COLUMN IF NOT EXISTS version bigint DEFAULT 1;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='toko_documents' AND column_name='version') THEN
    UPDATE public.toko_documents SET data_version = version WHERE data_version IS NULL;
  END IF;
END $$;

-- 2. Tabel Cadangan Dokumen Toko (toko_backups)
-- Digunakan untuk menyimpan riwayat snapshot dan pencadangan manual/otomatis
CREATE TABLE IF NOT EXISTS public.toko_backups (
  id text PRIMARY KEY,
  file_name text NOT NULL,
  data_version bigint NOT NULL DEFAULT 1,
  version bigint NOT NULL DEFAULT 1,
  checksum text NOT NULL,
  content text NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.toko_backups ADD COLUMN IF NOT EXISTS data_version bigint DEFAULT 1;
ALTER TABLE public.toko_backups ADD COLUMN IF NOT EXISTS version bigint DEFAULT 1;

-- 3. Aktifkan Row Level Security (RLS) untuk keamanan data
ALTER TABLE public.toko_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toko_backups ENABLE ROW LEVEL SECURITY;

-- 4. Kebijakan Akses (Single-Owner Store via Public Anon Key)
-- Memungkinkan aplikasi peramban pemilik membaca dan menyimpan data secara aman
DROP POLICY IF EXISTS "Allow owner read and write toko_documents" ON public.toko_documents;
CREATE POLICY "Allow owner read and write toko_documents" ON public.toko_documents
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow owner read and write toko_backups" ON public.toko_backups;
CREATE POLICY "Allow owner read and write toko_backups" ON public.toko_backups
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Berikan izin akses API PostgREST (anon & authenticated)
GRANT ALL ON TABLE public.toko_documents TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.toko_backups TO anon, authenticated, service_role;

-- 6. Refresh Schema Cache PostgREST
NOTIFY pgrst, 'reload schema';
