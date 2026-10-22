> **Catatan adaptasi v0.2.0 untuk Google AI Studio:** implementasi starter pada repository ini memakai React + Vite + TypeScript agar mudah diimpor sebagai proyek web React. Bagian TRD ini berasal dari konsolidasi spesifikasi sebelumnya dan masih perlu rekonsiliasi sebelum arsitektur produksi dikunci. Jangan menambahkan Next.js App Router ke starter ini tanpa keputusan arsitektur yang eksplisit. Seluruh aturan bisnis, integritas data, dan keamanan dalam spesifikasi tetap berlaku. Lihat `../GOOGLE_AI_STUDIO_ADAPTER.md`.

# 02 — TRD TOKO SAKALA

**Status:** Revisi TRD v3 yang dikonsolidasikan; belum final/locked sampai PRD, APPFLOW, BUILD ORDER, dan gerbang data nyata selaras.  
**Tujuan:** menetapkan stack, aliran data, keamanan, database, dan perilaku kegagalan secara dapat diuji.

## 1. Baseline teknis

- Next.js App Router dalam mode server lokal.
- TypeScript strict.
- Tailwind CSS v4 dan shadcn/ui dengan basis Radix.
- Zod untuk validasi data pada batas UI/server.
- PostgreSQL melalui satu proyek Supabase Free untuk data nyata.
- PostgreSQL lokal/Supabase CLI untuk pengembangan dan pengujian; data uji tidak dimasukkan ke proyek cloud data nyata.
- GitHub untuk version control; pnpm untuk package manager.
- Vitest untuk unit/golden tests; pengujian SQL/PostgreSQL untuk constraint/RPC; Playwright dan axe untuk E2E serta aksesibilitas.
- Migration SQL di repo; perubahan schema lewat migration, bukan klik manual di dashboard.
- Tidak perlu AI, LLM eksternal, atau OCR untuk MVP.

Versi paket harus dipilih dan direkam berdasarkan dokumentasi/lockfile aktual saat implementasi. Jangan menyalin angka versi historis dari draft tanpa verifikasi.

## 2. Model penggunaan dan penempatan

Aplikasi pribadi berjalan di komputer pemilik dan hanya mengikat `127.0.0.1`. Tidak ada login untuk MVP, tidak ada demo, tidak ada deployment publik, tunnel, port forwarding, atau akses LAN. Database data nyata berada di satu proyek Supabase Free hanya setelah *Data Real Gate* lulus. Karena tanpa login, keamanan aplikasi bergantung pada pembatasan proses lokal, penjagaan Host/origin, rahasia di server, serta kontrol database.

**Tidak boleh dipublikasikan ke Vercel atau host publik berdasarkan dokumen ini.** Jika ingin akses dari ponsel melalui jaringan atau akses jarak jauh, arsitektur dan kontrol identitas harus ditinjau ulang sebelum perubahan.

## 3. Aliran baca

1. Browser meminta halaman/rute kepada server lokal.
2. Server membaca event dan snapshot yang relevan melalui koneksi database server-only.
3. Engine deterministik menghitung angka untuk layar dan menyertakan status kepastian serta struktur penjelasan.
4. Browser menerima hanya data yang diperlukan. Tidak ada data uang yang disimpan dalam persistent client cache.

## 4. Aliran tulis

1. UI mengumpulkan kejadian dalam form terstruktur.
2. Zod memvalidasi bentuk, tipe, dan batas nilai.
3. Preview dibuat memakai engine yang sama dengan jalur save.
4. Pengguna meninjau preview dan mengonfirmasi.
5. Server memvalidasi ulang input dan menghitung ulang dengan versi data yang diharapkan.
6. Server mengirim satu command ber-ID stabil ke RPC Postgres.
7. RPC memeriksa idempotensi, versi data, rantai versi, status periode, dan menginsert event/detail secara atomik.
8. Server mengembalikan hasil authoritative. Preview dan hasil yang berbeda adalah bug yang perlu direkam.

Tidak ada penulisan DB langsung dari browser. Tidak ada secret/service-role key di browser.

## 5. Aliran tutup periode

1. Pengguna meminta tutup periode dan memilih kelengkapan: lengkap/sebagian.
2. Sistem menunjukkan daftar hal yang belum diketahui dan ringkasan setoran.
3. Jika diminta, sistem menunjukkan pilihan mengenai selisih dan konfirmasi.
4. Server menghitung snapshot dengan versi engine, memeriksa input sequence yang diharapkan, dan menutup periode di satu transaksi/RPC.
5. Snapshot, status, dan penyesuaian kas yang dipilih disimpan atomik.
6. Periode tertutup beku; koreksi berikutnya tidak mengedit snapshot.

Kelayakan penutupan, perilaku early-close, dan kesinambungan segmen mesti mengikuti keputusan periode yang sudah disahkan. Sampai konflik itu diputuskan, implementasi kalender/segmen tidak boleh dianggap final.

## 6. Struktur repo yang direkomendasikan

```text
toko-sakala/
├── src/
│   ├── app/                 # route + Server Actions
│   ├── components/          # komponen domain dan ui/
│   ├── domain/               # tipe dan schema Zod
│   ├── engine/contract.ts    # kontrak engine
│   ├── engine/v1/            # engine murni versi 1
│   ├── server/               # db, repo, loader; server-only
│   ├── lib/                  # utilitas non-domain
│   └── types/
├── supabase/
│   ├── migrations/
│   ├── seed.dev.sql
│   └── config.toml
├── scripts/                  # backup, restore, verify, secret scan
├── tests/
│   ├── golden/
│   ├── unit/
│   ├── db/
│   └── e2e/
├── docs/                     # 16 spesifikasi dan register keputusan
├── .env.example
├── .gitignore
├── next.config.ts
├── package.json
└── README.md
```

`src/engine` adalah kode murni: tanpa React/Next/Node, `Date.now()`, `Math.random()`, fetch, DB, atau locale global. Waktu saat ini (`asOf`), urutan event, dan semua data harus menjadi input eksplisit.

## 7. Kebijakan database dan koneksi

- Semua koneksi database berada di sisi server.
- Cloud: koneksi melalui role terbatas `app_server` (SELECT yang diperlukan + EXECUTE RPC, tanpa mutasi event secara langsung); rahasia di `.env.local`/environment server saja.
- `anon` dan `authenticated` tidak diberi hak baca/tulis database; RLS tetap aktif dan hak diuji eksplisit.
- Perubahan event/detail dilakukan melalui RPC atomik, bukan insert langsung dari Server Action.
- `command` ledger dipakai untuk idempotensi, dan hanya dapat diakses lewat RPC.
- Proyek cloud tidak menerima seed uji; seluruh test/mutation test jalan pada DB lokal/test.

## 8. Kontrak engine

`calculate(EngineInput) -> EngineOutput` harus murni, deterministik, dan digunakan bersama oleh preview, server save, dashboard, laporan, status setoran, penjelasan, export, dan input asistif kelak.

Input meliputi event yang relevan, riwayat harga/kemasan, status periode, urutan stabil, versi engine, dan waktu acuan `asOf`. Output mencakup angka, status kepastian, per produk/per periode, serta tree/struktur alasan. Uang rupiah dan jumlah unit menggunakan integer yang aman; nilai yang tidak aman gagal keras.

## 9. Aturan waktu calon TRD

- Tampilan waktu: WIB/Asia-Jakarta (UTC+7, tanpa DST); penyimpanan timestamp UTC.
- Minggu kalender: Senin 00:00 WIB inklusif sampai Senin berikutnya 00:00 WIB eksklusif.
- Event date-only: normalisasi ke 12:00 WIB, jika aturan ini disahkan.
- Urutan: `(occurred_at, seq)`; `seq` diberikan server.
- Tanggal masa depan lebih dari 5 menit terhadap server ditolak, jika disahkan.
- Periode pertama dimulai dari pengamatan awal pertama.
- Interval penjualan ditambatkan oleh checkpoint stok; batas periode yang dipakai untuk atribusi harus sama antara engine, snapshot dan test.
- Early close: TRD v3 menyarankan periode ditutup pada waktu aktual dan periode berikut mulai saat itu (tanpa celah/tumpang tindih). **Menunggu persetujuan** karena perlu disejajarkan dengan definisi kalender Senin–Minggu.

## 10. RPC dan idempotensi

RPC konseptual:

- `rpc_commit_command(...)`: menerima toko, `command_id`, jenis/payload, sequence maksimum yang diharapkan, actor teknis/sumber. Memeriksa command ID; ID + payload identik memutar hasil yang lama; ID sama dengan payload berbeda ditolak; sequence basi ditolak; event dan detail masuk atomik.
- `rpc_close_period(...)`: mengunci rentang periode, memeriksa data terbaru/sequence, memvalidasi tidak ada gap/tumpang tindih sesuai kebijakan yang disetujui, menyimpan snapshot beku, dan menutup periode atomik.

Nama payload/parameter final harus mengikuti migration SQL dan contract types yang benar-benar diimplementasikan.

## 11. Koneksi terputus

| Kondisi | Perilaku wajib |
|---|---|
| Gagal saat memuat | Tampilan “Tidak tersambung” dan tombol Coba lagi; tidak menampilkan angka lama seolah terbaru |
| Terputus setelah data tampil | Tampilkan waktu data terakhir dan status offline; nonaktifkan penyimpanan; draft tidak dibuang |
| Putus tepat saat menyimpan | Katakan “Belum pasti tersimpan”; ulangi menggunakan `command_id` yang sama |
| Proyek database dijeda | Petunjuk pemulihan yang jelas, tidak menyatakan data hilang/tersimpan tanpa bukti |
| Query lama menggantung | Terapkan batas koneksi/statement timeout yang diuji |

Tidak ada offline queue, dan aplikasi tidak menyimpan diam-diam ke local storage lalu berpura-pura server sudah menerima.

## 12. Backup dan restore

Supabase Free tidak boleh diasumsikan memiliki backup otomatis/pemulihan point-in-time. Wajib:

- ekspor JSON/CSV manual dari aplikasi;
- backup PostgreSQL penuh dan terenkripsi, dengan kunci privat hanya di perangkat pemilik;
- catat waktu keberhasilan backup;
- jalankan restore drill ke database kosong;
- verifikasi checksum/row counts setelah pemulihan;
- uji sebelum data nyata pertama dan secara berkala.

Backup yang belum dipulihkan belum terbukti dapat digunakan. Target kehilangan data harus dinyatakan sebagai “sejak backup terakhir yang berhasil”, bukan jaminan real-time.

## 13. Security gate wajib

- Binding eksplisit `127.0.0.1`.
- Host allowlist hanya localhost/127.0.0.1 dan port yang diharapkan, untuk mitigasi DNS rebinding.
- Perangkat lain tidak dapat mengakses port.
- Tidak ada tunnel/port-forwarding/hosting.
- `.env.local` tidak masuk Git; secret scan memeriksa working tree dan riwayat yang relevan.
- Tidak ada credential di `NEXT_PUBLIC_*`, kode klien, prompt, screenshot, atau log.
- Pengujian akses anon/authenticated harus ditolak.
- Backup pertama sudah di-restore dengan hasil terverifikasi.

Status TRD saat kompilasi: desain dan test plan ada; jangan klaim semua kontrol sudah diimplementasikan atau lulus. Lihat `15_TESTING.md` dan `16_ERROR_FIX_PLAYBOOK.md`.
