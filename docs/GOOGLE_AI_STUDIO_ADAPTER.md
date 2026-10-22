# Google AI Studio Adapter — v0.2.0

## Tujuan

Starter ini disiapkan untuk diimpor dari GitHub ke Google AI Studio Build. Dokumentasi resmi Google menjelaskan bahwa web app Build menggunakan React sebagai frontend default serta runtime Node.js untuk ekstensi full-stack. Build mode dapat mengimpor repository GitHub. Referensi: https://ai.google.dev/gemini-api/docs/aistudio-build-mode

## Perubahan framework dalam starter

- Starter v0.1 memakai Next.js App Router.
- Starter v0.2 ini menggunakan React + Vite + TypeScript supaya struktur web awal lebih dekat dengan lingkungan frontend React yang umum pada Build mode.
- Ini adalah **keputusan adapter implementasi**, bukan klaim bahwa Google AI Studio hanya mendukung Vite, dan bukan keputusan final arsitektur produksi.
- Domain Zod, engine perhitungan, contoh test, migrasi SQL draft, dan 16 dokumen spesifikasi dipertahankan.
- Sebelum membangun backend, keputusan final apakah proyek akan tetap di Vite + Node server atau kembali ke Next.js harus dicatat. Jangan mencampur dua framework dalam satu entry point.

## Perilaku Asisten AI

- `AI_DEFAULT_ENABLED = false`.
- Preferensi disimpan di `localStorage` dengan key `toko-sakala:assistant-enabled:v1`.
- Hanya preferensi tampilan yang disimpan; tidak ada uang, produk, stok, atau transaksi yang disimpan di browser.
- `AI_INTEGRATION_CONNECTED = false`; tidak ada SDK Gemini dan tidak ada request ke model.
- ON menampilkan panel rancangan asisten. Label UI harus menyatakan bahwa AI belum tersambung.
- ON/OFF adalah gerbang UI, bukan fitur keamanan atau koneksi AI. Saat integrasi kelak dilakukan, server wajib memeriksa flag, menghindari request bila OFF, menyimpan key di secret server-side, dan meminta konfirmasi pengguna sebelum transaksi ditulis.

## Data dan backend

- Tombol simpan transaksi tidak aktif.
- Migration dalam `supabase/migrations/` merupakan draft untuk audit, belum untuk data nyata.
- Jangan menghubungkan database yang berisi data toko di Build preview.
- Penyimpanan uang tidak boleh memakai `localStorage`.
- Backend harus menyertakan validasi server, transaksi atomik, idempotency, append-only history, peran/akses database, logging, dan backup/restore test sebelum data real.

## Git workflow

Karena pengguna memiliki repository `toko-sakala`, ZIP sengaja tidak menyertakan `.git`. Salin isi zip ke folder clone repository tersebut sambil mempertahankan `.git`, lalu review, commit dan Push origin. Di AI Studio, impor repository yang sama melalui **Build → Add files (+) → Import from GitHub**. Hindari perubahan paralel pada file yang sama tanpa sinkronisasi.
