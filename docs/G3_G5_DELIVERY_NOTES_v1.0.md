# TOKO SAKALA — G3–G5 Delivery Notes v1.0

## Ringkasan

Paket v0.4.0 adalah **kandidat desain dan implementasi antarmuka untuk ditinjau**, bukan aplikasi akuntansi produksi. Fondasi produk G0–G2 dipertahankan. Perubahan difokuskan pada pemahaman pengguna, struktur informasi, form mobile, dan ketidakpastian data.

## G3 — Screen Blueprint

- Spesifikasi 13 layar/state: Beranda, Catat, Stok, Setoran, Lainnya, Catat Belanja, Biaya Toko, Cek Sisa, Daftar Barang, Laporan, Riwayat, Asisten, Pengaturan.
- Setiap layar mencakup tujuan, urutan informasi, perilaku mobile, status kosong/belum pasti, tindakan, validasi, dan kriteria penerimaan.
- Navigasi primer diringkas menjadi Beranda, Catat, Stok, Setoran, Lainnya; fitur sekunder tetap ditemukan melalui hub.
- Selisih setoran historis yang tampak bertentangan ditandai sebagai blocker; tidak ditebak atau diperbaiki pada level komponen.

## G4 — Visual System & Prototype

- Arah visual: FIELD LEDGER — Quiet Precision for Everyday Business.
- Tema terang warm ivory / charcoal / forest green dengan brass terbatas; tema gelap menggunakan token deep forest yang terpisah.
- Mobile memakai bottom navigation lima area, formulir satu kolom, dan kartu cek stok berlabel; tidak memaksa tabel desktop masuk ke layar kecil.
- Label tetap tampil di atas input; status tidak mengandalkan warna saja; tombol utama lazimnya 44–48 px tinggi; reduced-motion dihormati.
- Pasangan warna terpilih dihitung dengan rumus luminans sRGB dan dicatat pada `docs/gates/G4_VISUAL_SYSTEM_v1.0.md`. Ini tidak berarti keseluruhan UI tersertifikasi WCAG.
- File `TOKO_SAKALA_FIELD_LEDGER_PROTOTYPE.html` bisa dibuka langsung di browser modern. Prototipe memiliki 13 layar, navigasi interaktif, pratinjau hitungan, dan pilihan tema. Perubahan hanya di memori; tidak ada panggilan jaringan atau penyimpanan transaksi.

## G5 — UI implementation and QA

Perubahan sumber React mencakup shell navigasi lima area, hub tugas, Beranda yang berorientasi status, form belanja kosong secara default, pratinjau biaya dengan sumber uang eksplisit, tema terang/gelap, dan baris cek stok yang mewajibkan satuan hitung/jual.

Contoh cek stok memiliki 15 baris lengkap dengan nilai sisa berdasarkan harga jual Rp524.000. Angka kuantitas 318 hanya merupakan penjumlahan numerik dari beberapa jenis satuan yang berbeda, sehingga **tidak ditampilkan sebagai satu total fisik**. ChocoPie yang belum lengkap dikecualikan dari nilai total.

### Bukti pemeriksaan yang dapat dilakukan

- TypeScript transpilation untuk `src/App.tsx` dan `src/main.tsx`: nol diagnosis sintaks. Ini bukan pemeriksaan tipe penuh.
- Golden case engine belanja: 2 × 24 unit = 48 unit; modal total Rp192.000; modal rata-rata Rp4.000/unit; selisih harga jual vs modal Rp3.000/unit.
- Golden case cek stok: 15 baris lengkap, 1 baris belum lengkap, nilai sisa Rp524.000.
- HTML mandiri: 13 state, satu blok skrip inline lolos `node --check`, 283 kurung kurawal CSS pembuka dan penutup, serta tidak ada `fetch`, `localStorage`, `indexedDB`, atau `XMLHttpRequest`.
- `node scripts/scan-secrets.mjs`: tidak menemukan pola secret yang dikenal. Pemindai pola bukan jaminan semua rahasia terdeteksi.

### Belum dapat dinyatakan lulus

- `npm run test` / Vitest: dependensi tidak terpasang (`vitest` tidak ditemukan); instalasi dependency mengalami timeout.
- `npm run build` dan TypeScript strict check lengkap: belum terverifikasi karena dependensi proyek belum tersedia.
- Screenshot/responsive browser sweep, screen reader, dan keyboard audit: belum dilakukan dengan browser/assistive technology yang dapat diverifikasi.
- Database, authorization/RLS, validasi server, atomic commit, audit append-only, backup/restore, dan penggunaan data toko nyata: belum diimplementasikan atau diverifikasi.

## Pengaman produk yang tidak dibuka

- Semua tombol simpan transaksi tetap nonaktif.
- Tidak ada modal, saldo, keuntungan, atau angka uang sintetis yang ditampilkan seolah-olah transaksi nyata.
- Belanja mengharuskan pilihan sumber uang; biaya juga mempunyai pilihan sumber uang, tetapi keputusan default produk tetap tertunda.
- AI dan OCR belum tersambung; sakelar Asisten hanyalah preferensi tampilan.
- Daftar keputusan `PENDING` pada `docs/DECISION_REGISTER.md` tetap membutuhkan persetujuan bisnis sebelum persistence/produksi.
- Snapshot periode tutup, riwayat append-only, koreksi terhubung, dan definisi uang seharusnya/setoran harus ditegakkan oleh backend dan engine yang sama, bukan komponen UI.

## Langkah sebelum merge/produksi

1. Instal dependensi di lingkungan jaringan normal; jalankan Vitest, strict build dan secret scan.
2. Perbaiki error compile/test tanpa mengubah kontrak kalkulasi yang telah dikunci.
3. Periksa tampilan seluruh 13 state pada lebar 320, 360, 390, 430, 768, 1024, 1280, 1440 CSS px; uji kedua tema dan overflow.
4. Jalankan audit keyboard, focus, reduced motion, kontras seluruh state, dan label form dengan perangkat nyata.
5. Putuskan semua item `PENDING`; rekonsiliasi perbedaan nilai uang seharusnya/setoran yang ditemukan pada rekaman audit.
6. Implementasikan dan uji backend transaksi yang berotorisasi, commit atomik/idempotent, riwayat koreksi, akses, dan pemulihan cadangan.
7. Baru setelah seluruh gerbang tersebut lulus, aktifkan simpan transaksi dan gunakan data toko nyata.
