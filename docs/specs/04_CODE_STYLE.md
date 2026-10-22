# 04 — Code Style & Engineering Rules

**Status:** standar engineering yang disarankan untuk diterapkan konsisten; versi tool final mengikuti lockfile dan diverifikasi ketika setup.

## 1. Bahasa dan penamaan

- Kode, tipe, identifier, dan nama file menggunakan Bahasa Inggris konsisten; teks UI menggunakan Bahasa Indonesia sehari-hari.
- `camelCase` untuk variabel/fungsi, `PascalCase` untuk tipe/komponen React, `SCREAMING_SNAKE_CASE` hanya konstanta benar-benar global, `kebab-case` untuk file util/domain bila sesuai pola repo.
- Domain nouns harus konsisten: `product`, `event`, `purchase`, `stockCheck`, `damage`, `usedStock`, `expense`, `otherIncome`, `deposit`, `periodClose`, `certainty`.
- Jangan memakai sinonim berbeda untuk konsep uang sama. `expectedCash` dan `depositActual` harus jelas berbeda.
- Hindari nama ambigu seperti `value`, `data2`, `temp`, `finalResult` jika objeknya memiliki makna domain spesifik.

## 2. TypeScript

- `strict: true`; jangan gunakan `any` kecuali sebagai boundary sementara yang segera dinormalisasi dan disertai alasan.
- Parse data eksternal sebagai `unknown`, lalu validasi dengan Zod.
- Gunakan discriminated unions untuk event, action result, certainty, dan error code.
- Gunakan nominal integer untuk rupiah dan unit pcs; gunakan tipe branded bila bermanfaat (`Rupiah`, `Pcs`, `CommandId`, `EventId`) agar unit berbeda tidak tertukar.
- Jangan mewakili data tidak diketahui dengan `0`. Gunakan status/union `unknown`/`needs_review`.
- Hindari `!` non-null assertion; guard dan hasil validasi harus eksplisit.

## 3. Batas engine murni

`src/engine/**` tidak boleh mengimpor React, Next.js, Node APIs, database driver, browser APIs, logger yang punya efek samping, atau `server/**`.

Tidak boleh memanggil `Date.now()`, `Math.random()`, `Intl` locale-dependent, filesystem, network, atau mutable global. Kirim `asOf`, `seq`, configuration, rounding policy secara eksplisit.

Fungsi utama harus dapat direplay dan deterministik: input sama + versi engine sama = output sama.

## 4. Database & server

- File koneksi database hanya di `src/server/` dan menggunakan penanda server-only.
- Tidak ada client key/server secret dalam komponen client atau `NEXT_PUBLIC_*`.
- Mutasi event hanya lewat fungsi application service → RPC transaction.
- Server Action selalu melakukan validasi Zod ulang; validasi browser bukan sumber keamanan.
- Error DB ditangani lewat code enum yang stabil, bukan dengan mengekspos query/secret ke UI.
- Migration SQL di-commit; jangan membuat schema manual hanya lewat dashboard.

## 5. React/UI

- Komponen visual tidak memiliki rumus keuangan.
- Data dari server adalah read-only state; draft lokal hanya untuk interaksi yang belum disimpan.
- Form menggunakan schema yang sama/ekuivalen dengan kontrak server.
- Jangan menambahkan global state manager tanpa kebutuhan terbukti.
- Gunakan semantic HTML, label input, focus management, keyboard flow, dan status yang tidak hanya bergantung pada warna.
- Focus mode untuk input cepat; jangan mencampur dashboard detail ke dalam form pencatatan.

## 6. Error handling

- Hasil action berbentuk union: sukses dengan data authoritative, validation, stale, conflict, needs confirmation, closed period, DB unavailable, internal.
- Jangan `catch` lalu mengabaikan error.
- Jangan menampilkan stack trace/SQL ke pengguna; log diagnostik yang aman di server.
- Error harus menyertakan tindakan pengguna berikutnya jika ada.
- Retry operasi write memakai `command_id` sama jika status commit belum pasti.

## 7. Pengujian dan kualitas kode

- ESLint, Prettier, TypeScript typecheck, Vitest, DB tests, Playwright/a11y sesuai tahapan.
- Golden tests hitung-tangan wajib untuk setiap perubahan rumus.
- Tidak mengubah fixture hanya agar test lulus tanpa menjelaskan perubahan rumus dan approval.
- Dependency baru harus gratis, berlisensi sesuai, aktif dipelihara, dan punya alasan nyata.
- Jangan mengunci versi yang tidak diverifikasi. Commit lockfile.
- CI: install frozen lockfile → lint → typecheck → unit/golden → database contract tests → build; E2E untuk stage terkait.

## 8. Anti-pattern yang dilarang

- Rumus uang ditulis terpisah di UI, API, export, dan dashboard.
- Menimpa histori harga atau transaksi.
- Menganggap data tidak diketahui sebagai nol/pasti.
- Menganggap penurunan stok otomatis pasti terjual jika tidak valid.
- `Math.round(unitModal)` lalu mengalikannya dengan seluruh stok sebagai nilai sumber.
- Log credential/connection string.
- Membuat fitur AI sebelum core engine lulus.
- Mengklaim build, test, security, backup, atau deploy sukses tanpa hasil yang dapat ditunjukkan.
