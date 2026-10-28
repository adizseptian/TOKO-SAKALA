# Prompt untuk Google AI Studio Build — TOKO MODE v0.5.1

Impor/lanjutkan **repository TOKO SAKALA yang sudah ada**. Jangan buat aplikasi baru atau menimpa repository dengan nama lain. Sebelum mengedit, baca `AGENTS.md`, `DESIGN.md`, `README.md`, dokumen G3/G4/G5 di `docs/redesign/`, `docs/redesign/IMPLEMENTATION_STATUS_v0.5.1.md`, dan `docs/DECISION_REGISTER.md`.

## Tahap 1 — verifikasi dulu, jangan desain ulang
1. Periksa framework dan file proyek apa adanya. Pertahankan React + Vite + TypeScript starter ini; jangan campur Next.js atau membuat scaffold baru.
2. Jalankan instalasi dependensi menggunakan package manager yang sesuai, lalu jalankan `npm run scan:secrets`, `npm run test`, dan `npm run build`. Tampilkan output/error nyata. Perbaiki error yang terbukti dengan diff minimal. Jangan menyebut build/test lulus jika belum dijalankan.
3. Periksa bahwa `src/engine/v1/stock-check-preview.ts` mengembalikan kuantitas per satuan melalui `remainingByUnit`, bukan satu total campuran; uji pcs dan porsi terpisah. Periksa juga handling angka terlalu besar di layar cek sisa.
4. Pastikan tombol simpan tetap nonaktif, penyimpanan uang tidak memakai localStorage, Asisten AI default OFF dan tidak memanggil model, tidak ada angka contoh yang ditampilkan sebagai transaksi tersimpan.

## Tahap 2 — mobile QA
Periksa tampilan pada 320, 360, 390, 430, 768, 1024 dan 1440 CSS px (Android Chrome/device preview jika tersedia). Ambil screenshot untuk 320, 390, 768 dan 1440. Laporkan: scrollWidth vs viewportWidth, console/runtime errors, bottom navigation dan safe area, semua kontrol sentuh minimal 44×44 px (kecuali kontrol padat yang memiliki alasan jelas), ukuran teks, form/keyboard, fokus keyboard, tema terang/gelap, nama barang panjang, nominal Rupiah besar, keadaan kosong/0/belum diketahui/error, serta `prefers-reduced-motion`.

## Tahap 3 — perbaiki hanya temuan terbukti
Pertahankan TOKO MODE sesuai `DESIGN.md`: paper `#FFFDF6`, ink `#20211F`, orange `#FF5A1F`, lime `#D7FA4A`, cobalt `#2958E8`. Jangan mengembalikan tema Field Ledger. Jangan menambah bento/gradient/animasi dekoratif tanpa fungsi. Satu layar punya tujuan utama dan satu CTA dominan. Semua status memiliki teks, bukan warna saja.

## Tahap 4 — hasil QA yang harus dikembalikan
Buat `docs/redesign/AI_STUDIO_QA_REPORT.md` dengan tabel PASS / FAIL / BLOCKED, bukti command, hasil screenshot viewport, bug ditemukan, file yang berubah, dan tes yang belum berhasil. Jangan deploy ke production, jangan menghubungkan database data nyata, jangan membuat atau mengubah secret, jangan mengaktifkan simpan transaksi atau AI. Tunggu review sebelum pekerjaan backend berikutnya.
