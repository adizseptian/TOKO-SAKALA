# 01 — SOURCE OF TRUTH MATRIX & ARCHITECTURE CROSSWALK

**Tanggal Pemutakhiran:** 13 November 2026  
**Keputusan Owner Terkait:** Butir 1 (P&L 9 Langkah PRD/DR-016), Butir 3 (Gunakan TRD v2 + Wajib Crosswalk Arsitektur), Butir 4 (Status Persistensi & Isolasi Sample), Butir 6 (Pertahankan G4), Butir 7 (Hapus `'asisten'`), Butir 8 (Font G4 tanpa bundling wajib).

---

## 1. Hirarki Sumber Kebenaran (Source of Truth) Aktif

Sesuai `docs/DECISION_REGISTER.md` dan keputusan Owner Review 13 November 2026:

| Tingkat Prioritas | Kategori | Dokumen / Aset Resmi | Status Validitas |
|---|---|---|---|
| **Tier 1 (Tertinggi)** | **Aturan Produk & Data Terkunci** | `docs/DECISION_REGISTER.md` (DR-001 s.d. DR-016 + 12 Rule), `docs/specs/01_PRD.md`, dan **8 Keputusan Owner Review (13 Nov 2026)** | **LOCKED** |
| **Tier 2** | **Sistem Visual & Desain UI** | `DESIGN.md`, `docs/redesign/G4_VISUAL_SYSTEM_v2.1.md`, `docs/redesign/G3_SCREEN_BLUEPRINT_v2.1.md`, `docs/redesign/G5_IMPLEMENTATION_QA_v2.1.md` | **LOCKED (Pertahankan G4)** |
| **Tier 3** | **Domain Engine & Formula** | `src/engine/v1/calculate.ts` *(setelah diselaraskan dengan diskon & `LOSS_USED` per PRD §8/DR-016)*, `src/domain/*.ts` | **OTORITAS KALKULASI** *(Wajib perbaikan sinkronisasi bridge sebelum Mode B)* |
| **Tier 4** | **Arsitektur Cloud & Keamanan Target** | **TRD v2 / TRD v2.1** *(ditetapkan Owner Review #3)* | **`BELUM TERSEDIA DI WORKSPACE`** *(Memblokir finalisasi cloud)* |
| **Tier 5 (Usang / Bukan Acuan Utama)** | **Draft / Historis / Adaptor** | `docs/sources/TRD_SOURCE_V3_NOT_LOCKED.txt`, `docs/specs/02_TRD.md`, `docs/specs/13_BACKEND_SCHEMA.md`, `docs/GOOGLE_AI_STUDIO_ADAPTER.md`, `README.md`, `docs/redesign/IMPLEMENTATION_STATUS_v0.5.1.md` | **NON-AUTHORITATIVE / STALE / SUPERSEDED** |

---

## 2. Daftar Konflik Dokumen vs Kode Saat Ini

| ID | Area Konflik | Sumber A (Spesifikasi / Keputusan) | Sumber B (Realitas Kode / Dokumen Lain) | Resolusi Terkunci / Status |
|---|---|---|---|---|
| **C-01** | Mode Persistensi & Demo | `README.md`, `IMPLEMENTATION_STATUS_v0.5.1.md` menyatakan preview-only tanpa DB write | `App.tsx:629–673` menulis ke IndexedDB + outbox + Supabase/Drive; `sampleData` ikut tersinkron | **LOCKED (Owner #4):** Resmi Offline-First Local + Outbox; sync cloud **unverified**; mutakhirkan README & isolasi `sampleData` |
| **C-02** | Definisi Untung Kotor & Bersih | Owner #1 (PRD & DR-016 9-step P&L): `Untung Kotor = Penjualan Bersih − Modal Terjual`; `Untung Bersih` memotong semua rugi & biaya | `engineBridge.ts:351–395` menamai `Penjualan − Diskon` sebagai `untungKotor` dan `untungBersih` melewatkan `COGS` & rugi stok | **LOCKED (Owner #1):** Wajib refactor formula engine/bridge ke 9 langkah PRD/DR-016 |
| **C-03** | Pemetaan `LOSS_USED` & Diskon di Engine | `calculate.ts:44–58` mendukung `USED` & kerugian stok; PRD memasukkan diskon | `engineBridge.ts:198–218` tidak memetakan `LOSS_USED` ke engine; `calculate.ts` tidak memproses diskon | **BLOCKER LOGIC:** Harus disatukan di Mode B Fase 1 |
| **C-04** | Filter Periode `Laporan` | Owner #2: Semua metrik aliran mengikuti periode terpilih; posisi saldo terpisah | `App.tsx:4288–4955` membaca `storeSummary` kumulatif alih-alih `ringkasanData` terfilter | **LOCKED (Owner #2):** Wajib kabelkan metrik aliran ke periode terpilih |
| **C-05** | Target Arsitektur Backend | Owner #3: Acu **TRD v2** (Cloudflare Workers Static Assets, Supabase Free, 1 owner auth, RLS, Edge Function + RPC) | Workspace hanya memiliki **TRD v3 draft** (Next.js lokal `127.0.0.1` + `app_server`), `GOOGLE_AI_STUDIO_ADAPTER` (Vite + direct `supabase-js`), dan **tidak memiliki file TRD v2** | **`NEEDS OWNER DECISION / UPLOAD TRD v2`** |
| **C-06** | Skema SQL Supabase & RLS | `supabase/migrations/20261022000100_initial_schema.sql` (24 tabel append-only, trigger reject mutate, RLS ketat tertutup) | `migrations/001` (2 tabel JSON blob, RLS terbuka `anon`) & `migrations/002` (9 tabel relasional tidak terpakai, RLS terbuka `anon`) | **CRITICAL BLOCKER (SEC-01):** Dilarang buka data nyata ke cloud |
| **C-07** | Dua Client Supabase | Single authenticated owner session untuk DB access | `supabaseClient.ts` (OTP session) terpisah dari `supabaseAdapter.ts` (`createClient()` polos) | **HIGH BLOCKER (SEC-02):** Wajib satukan client/edge token |
| **C-08** | Kebijakan Hapus Catatan | Owner #5 + DR Rule 10: Strict append-only; tidak ada hapus permanen; void/koreksi tertaut; periode tutup beku | `App.tsx:703–721` `handleDeleteRecord` menimpa payload dengan `.filter(...)` tanpa audit/void | **LOCKED (Owner #5):** Ganti dengan pembatalan tercatat (`VOID`) & proteksi tutup periode |
| **C-09** | Status Sinkronisasi Jujur | Owner #4: Jangan tampilkan "Tersinkron" tanpa konfirmasi server atas `dataVersion` aktual | `syncEngine.ts:84` hardcode `pendingCount: 0`; `App.tsx:1944,1987` tampil "Tersinkron" saat `configured && !lastError` | **LOCKED (Owner #4):** Perbaiki outbox count nyata & konfirmasi versi server |
| **C-10** | Bottom Navigation Mobile | Owner #6 + `G4 v2.1` + `DESIGN.md`: Solid 5-tab bar, active lime `#D7FA4A`, NO glassmorphism/glow/pulse | `App.tsx:8178–8231`, `styles.css:3038–3160` memakai `.floating-dock` blur gelap + glow oranye + `.live-pulse-beacon` | **LOCKED (Owner #6):** Kembalikan ke solid bar G4; hapus glow/pulse |
| **C-11** | Penggunaan Modul Domain Teruji | `stock-check-preview.ts`, `purchase-preview.ts`, `ai-feature.ts` lulus Vitest | `App.tsx` menduplikasi logika kalkulasi dan tidak mengimpor modul-modul tersebut | **HIGH:** Konsolidasi saat refactor Mode B |
| **C-12** | Route Mati `'asisten'` | Owner #7 + AI default OFF | `App.tsx:50, 2046` menyisakan type & header `'asisten'` tanpa JSX body | **LOCKED (Owner #7):** Hapus bersih di Mode B |
| **C-13** | Strategi Font Offline | Owner #8 + `DESIGN.md` / G4 (`Inter`, `Plus Jakarta Sans`, fallback sistem, `tabular-nums`) | `styles.css` menyebut `Plus Jakarta Sans` & `Roboto Mono`, tidak ada `@font-face` lokal/remote di `index.html` | **LOCKED (Owner #8):** Tidak wajib bundling/remote font; pastikan `tabular-nums` & kontras |

---

## 3. ARCHITECTURE CROSSWALK (5-Way Comparison — Permintaan Owner #3)

> **Catatan Kritis Ketersediaan Dokumen:** File spesifikasi **`TRD v2`** atau **`TRD v2.1`** **belum tersedia di dalam workspace** (`/docs/sources/` maupun `/docs/specs/` tidak memilikinya). Fakta mengenai isi TRD v2 di kolom berikut bersumber secara ketat dari (a) arahan tertulis Owner pada *Owner Review #3*, dan (b) bagian *Perubahan dari TRD v2.1* pada `docs/sources/TRD_SOURCE_V3_NOT_LOCKED.txt:4, 21, 87–88, 378–381`. **Tidak ada asumsi teknis tambahan yang dikarang untuk mengisi bagian TRD v2 yang hilang.**

| Komponen Arsitektur | 1. Target Owner (**TRD v2** — *Dokumen Hilang*) | 2. `src/` Aktif Sekarang (Vite + React) | 3. `migrations/001` (`toko_documents`) | 4. `migrations/002` (9 Tabel Domain) | 5. `supabase/migrations/20261022000100` (24 Tabel) & `02_TRD.md` / `TRD v3` |
|---|---|---|---|---|---|
| **Hosting Frontend** | Cloudflare Workers Static Assets (Rp0) *[Owner #3, TRD v3:379]* | Static Vite SPA (`dist/`), tanpa `wrangler.toml` / `_headers` | N/A (SQL only) | N/A (SQL only) | `TRD v3`: Next.js mode server lokal `127.0.0.1` (`02_TRD.md`: Next.js + `app_server`) |
| **Autentikasi** | Satu pemilik via Supabase Auth *[Owner #3, TRD v3:379]* | `supabaseClient.ts` punya `signInOwnerWithOtp`, **tidak terhubung** ke `supabaseAdapter.ts`; `auth.ts` juga mengelola Google OAuth Drive | Tidak memakai `auth.uid()` di RLS | Kolom `user_id uuid` ada di 7 tabel, namun RLS **tidak** memeriksa `auth.uid()` | `TRD v3`: Tanpa login/Auth sama sekali (hanya localhost); `supabase/migrations` belum punya policy `authenticated` |
| **Model Penyimpanan** | Supabase Free PostgreSQL *[Owner #3]* *(detail tabel spesifik ada di dok TRD v2 yg belum diunggah)* | 1 payload JSON utuh (`TokoSakalaDocument`) di IndexedDB (`toko_sakala_local_db`) + push JSON ke `toko_documents` | **1 JSONB blob** (`toko_documents`) + `toko_backups` | **9 tabel relasional** (`products`, `sales`, `purchases`, `stock_movements`, `expenses`, `deposits`, `periods`, `sync_events`, `backup_registry`) | **24 tabel event-sourced append-only** (`toko`, `product`, `event`, `ev_*`, `period_close`, `snapshot_*`, `command`, `audit_log`, `backup_log`) |
| **Mekanisme Penulisan** | Lewat **Edge Function + RPC** *[Owner #3, TRD v3:379]* | Browser langsung memanggil `supabase-js` `.upsert()` / `.insert()` ke tabel `toko_documents` via `anon` key (`supabaseAdapter.ts`) | Direct PostgREST table write | Direct PostgREST table write | `02_TRD.md`/`13_BACKEND_SCHEMA.md`: Server Action -> `rpc_commit_command` / `rpc_close_period` (`SECURITY DEFINER`) |
| **Edge Functions / Server Layer** | Supabase Edge Functions *(TRD v3:379)* | **Tidak ada** (`supabase/functions/` tidak ditemukan di repo) | Tidak ada RPC/Edge | Tidak ada RPC/Edge | `TRD v3` mengganti Edge Function menjadi Next.js Server Actions (`app_server`) |
| **Kebijakan RLS & Role** | RLS ketat satu pemilik (tanpa akses publik `anon`) *[Owner #3]* | Browser pakai `anon` key dari env/`localStorage` (`supabaseAdapter.ts:44–65`) | **KRITIS:** `FOR ALL USING (true)` + `GRANT ALL TO anon` | **KRITIS:** `FOR ALL USING (true)` + `GRANT ALL TO anon` | `ENABLE ROW LEVEL SECURITY` tanpa policy -> tertutup default (`anon` diblokir); trigger `ts_reject_mutation()` aktif |
| **Integritas Append-Only & Idempotensi** | Membutuhkan validasi server / RPC *(detail spesifik pada TRD v2 belum tersedia)* | Array di JSON ditimpa penuh oleh client; `handleDeleteRecord` menghapus elemen array; outbox punya `idempotencyKey` lokal saja | Upsert menimpa row `toko_sakala_main_doc` tanpa log event | Tidak ada trigger append-only; `sync_events.idempotency_key` tidak dipakai client | Penuh di SQL: trigger `BEFORE UPDATE OR DELETE OR TRUNCATE`, `command (toko_id, command_id)` unik, `period_close` beku |
| **Integritas Harga Modal / Unit** | Terikat aturan DR / PRD *(non-float, unit terpisah)* | `ProductItem.costPerPack` opsional, `stockMovements` damage hardcode `'pcs'` | Di dalam JSON blob | **BERTENTANGAN:** `products.cost_per_pack numeric NOT NULL DEFAULT 0` (mencampur 0 dengan unknown!) & tidak ada `used`/`damage`/`other_income` | `ev_opening_stock.unit_cost_rupiah` nullable (menjaga unknown ≠ 0); tabel `ev_damage`, `ev_used`, `ev_unknown_loss`, `ev_other_income` terpisah lengkap |

---

## 4. Klasifikasi Status Setiap File SQL / Migrasi

| File SQL / Migrasi | Klasifikasi Status | Alasan Teknis & Konflik | Rekomendasi Mode A |
|---|---|---|---|
| `migrations/001_create_toko_documents.sql` | **AKTIF SAAT INI — NAMUN KRITIS / TIDAK AMAN (`DEPRECATED FOR PROD`)** | Satu-satunya skema yang dipanggil oleh `src/storage/supabaseAdapter.ts` (`toko_documents`, `toko_backups`) dan direferensikan di UI Pengaturan (`App.tsx:5913–6050`). Namun memiliki RLS `USING (true)` ke `anon` (`SEC-01`) dan menimpa blob JSON tanpa append-only. | **Jangan dipakai untuk data toko nyata.** Jika dipakai sementara sebagai jembatan sebelum migrasi penuh, wajib hapus `anon` grant & ganti policy ke `auth.email()` pemilik serta pindahkan penulisan ke Edge Function/RPC. |
| `migrations/002_create_domain_tables.sql` | **TIDAK TERPAKAI / USANG / BERTENTANGAN (`UNUSED & CONFLICTING`)** | Tidak satu pun dari 9 tabel (`products`, `sales`, `purchases`, dll.) pernah di-query di `src/*`. Bertentangan langsung dengan PRD/DR karena: (1) `products.cost_per_pack NOT NULL DEFAULT 0` melanggar `unknown ≠ 0`; (2) membuat tabel `sales` tersendiri padahal penjualan berasal dari selisih stok cek + tidak ada tabel `damage`/`used`/`other_incomes`/`owner_withdrawals`; (3) RLS terbuka `USING (true)` ke `anon`; (4) tetap menampung string SQL di modal Pengaturan `App.tsx:6055+`. | **Usulkan arsip/deprekasi (jangan dieksekusi ke database).** |
| `supabase/migrations/20261022000100_initial_schema.sql` | **DRAFT FONDASI RELASIONAL — BELUM LENGKAP & TIDAK TERSAMBUNG (`DORMANT DRAFT`)** | Selaras penuh dengan `13_BACKEND_SCHEMA.md` (24 tabel append-only, trigger `ts_reject_mutation`, `unit_cost_rupiah` nullable, `ev_damage`/`ev_used`/`ev_other_income`, RLS tertutup default). **Tetapi** `line 239–241` menyatakan eksplisit `rpc_commit_command`, `rpc_close_period`, dan RLS policy pemilik **belum diimplementasikan**, selain `ev_purchase_item` belum memiliki kolom diskon dan `product.base_unit` masih `CHECK (base_unit = 'pcs')` (mengunci satuan tunggal `pcs` saja!). | **Kandidat kuat fondasi DB untuk TRD v2**, namun **memerlukan**: (a) dokumen `TRD v2` dari Owner, (b) perluasan `base_unit` untuk mendukung multi-unit tanpa pencampuran (`kg`, `liter`, `porsi`), (c) penambahan `discount`, (d) pembuatan RPC & Edge Functions, serta (e) policy RLS khusus `authenticated` pemilik. |

---

## 5. Apa yang Belum Dapat Diverifikasi & Syarat Buka Blokir

1. **Dokumen `TRD v2` / `TRD v2.1`** tidak ada di workspace — kontrak persis antara Cloudflare Workers Static Assets, Supabase Edge Function (nama endpoint, JWT verification, CORS), dan skema SQL target belum dapat diaudit.
2. **Konfigurasi live project Supabase** (`dvznpniodskujfbdznnv.supabase.co` yang tertanam di `migrations/001`, `002`, dan teks bantuan `App.tsx`) tidak dapat diuji secara langsung dalam Mode A (tidak ada kredensial admin & dilarang menyentuh cloud). Status RLS aktif di proyek cloud tersebut berstatus **`BELUM TERVERIFIKASI / ANGGAP TIDAK AMAN`**.
