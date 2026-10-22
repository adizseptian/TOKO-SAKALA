> **Catatan adaptasi v0.2.0:** starter untuk Google AI Studio saat ini adalah UI React + Vite dan belum mempunyai backend transaksi. Diagram/konsep arsitektur dalam dokumen ini adalah tujuan arsitektur bisnis/produksi yang perlu diselaraskan dengan adapter Google AI Studio, bukan pernyataan bahwa backend sudah dibuat. Tidak ada transaksi yang persisten. Lihat `../GOOGLE_AI_STUDIO_ADAPTER.md`.

# 03 — Architecture TOKO SAKALA

**Status:** arsitektur logis yang disepakati untuk implementasi lokal; detail periode/early-close dan gerbang data nyata masih menunggu bukti/lock final.

## 1. Arsitektur konseptual

```text
Browser UI (form + preview)
        │
        ▼
Next.js Server Actions / Server Components
        │  validate input (Zod)
        │  recalculate (shared pure engine)
        ▼
Repository / DB adapter (server-only)
        │
        ▼
PostgreSQL RPC transaction
  ├── command / idempotency
  ├── append-only event header + typed detail
  ├── audit/version/correction link
  └── period-close snapshot (atomic)

Engine (pure TypeScript)
  events + price histories + asOf + policy version
        └──> numbers + certainty + explanation tree
```

## 2. Batas lapisan

1. **Presentation:** form, dashboard, navigation, status, preview. Tidak boleh memuat rumus bisnis penting.
2. **Domain contract:** tipe event, schema Zod, status kepastian, aturan validasi bentuk payload.
3. **Calculation engine:** pure functions; menentukan stok tersedia/terjual, modal moving-average, penjualan, hasil, uang, setoran dan explanations.
4. **Application/server:** mengautentikasi konteks aplikasi lokal secara teknis, validasi ulang, membaca data, membuat command ID, memanggil RPC, menerjemahkan errors.
5. **Database:** sumber event historis, constraints, append-only enforcement, idempotency, transaksi atomik, close snapshot.
6. **Ops:** migration, secret scan, backup, restore, test, runbook.

## 3. Single source of truth

- Kejadian faktual dan histori harga merupakan sumber data utama.
- Angka turunan dihitung engine; jangan menyimpan salinan yang bisa berbeda kecuali snapshot historis saat periode ditutup.
- Snapshot menyimpan hasil dan versi engine yang membuatnya, untuk menjaga laporan historis.
- `command_id` mencegah submit ulang menggandakan event.
- PostgreSQL menolak pelanggaran yang kritis meskipun UI atau engine salah.

## 4. Aliran read

`Route -> server loader -> repository -> typed rows -> pure engine -> view model -> UI`.

View model menyimpan angka, certainty, dan explanation tree. Komponen UI tidak memutuskan status cocok berdasarkan hitungan mandiri.

## 5. Aliran write

`User input -> draft -> Zod -> preview engine -> show preview -> confirm -> Server Action validation -> engine calculation -> RPC transaction -> reload authoritative state -> success confirmation`.

Semua perubahan multi-event yang menjadi satu command (misalnya masukan AI kelak) harus all-or-nothing. Retry memakai ID command sama. Jika hash/payload berbeda untuk ID sama, tolak sebagai penggunaan ID yang tidak sah.

## 6. Invarians arsitektur

- Tidak ada direct write database dari browser.
- Tidak ada secret di browser.
- Tidak ada perhitungan bisnis di komponen.
- Tidak ada event yang diam-diam ditimpa.
- Tidak ada laporan historical dihitung dengan versi engine terbaru jika snapshot versi lama menjadi sumber resmi.
- Semua urutan dan waktu eksplisit; tidak memakai wall-clock tersembunyi di engine.
- UI menampilkan certainty, bukan menyembunyikan bagian yang belum diketahui.
- Koneksi gagal = tidak ada klaim penyimpanan berhasil.

## 7. Data dan akses

Arsitektur awal mengasumsikan satu toko dan satu operator lokal. Multi-tenant/multiuser tidak termasuk. `toko_id` tetap bisa hadir untuk FK dan isolasi data, tetapi tidak boleh dipasarkan sebagai sistem multi-user aman tanpa identity model. Server DB role dibatasi pada operasi yang dibutuhkan; event ditulis melalui RPC saja.

## 8. Periode dan snapshot

Penutupan harus memiliki optimistic version (`input_max_seq`/sequence), lock/race protection, snapshot, serta rentang periode yang tervalidasi dalam satu transaksi. Bentuk periode kalender vs early-close segment adalah titik tunggu: arsitektur mendukung validasi yang diputuskan tetapi tidak boleh mengimplementasikan dua interpretasi.

## 9. Keputusan evolusi

AI/OCR, parser, smart-restock, dan insight adalah adapter di atas domain engine; tidak ada yang boleh menjadi sumber perhitungan sendiri. AI/OCR hanya menghasilkan draft yang harus melewati validasi, preview, dan konfirmasi manusia.

## 10. Ancaman dan batas

Aplikasi tanpa login di localhost tidak melindungi dari orang yang memakai sesi OS yang sama, malware, atau ekstensi browser berbahaya. Binding localhost, Host guard, secret isolation, DB grants/RLS, dan tidak mempublikasikan app mengurangi risiko, tetapi bukan pengganti autentikasi. Perlu keputusan arsitektur baru sebelum akses jaringan/remote.
