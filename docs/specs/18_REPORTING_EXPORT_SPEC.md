# TOKO SAKALA — Reporting & Export Specification v1.0

**Status:** Persyaratan fitur yang perlu diimplementasikan dan diuji; bukan klaim bahwa fitur ekspor telah ada.

## Tujuan
Menyediakan laporan bisnis toko yang disajikan secara profesional, konsisten, mudah dibaca, dapat ditelusuri ke data sumber, serta dapat diekspor untuk arsip dan analisis. Gaya penyajian boleh setara kerapian laporan perusahaan besar, tetapi jangan mengklaim kepatuhan PSAK/IFRS, audit independen, atau pelaporan pajak tanpa scope dan verifikasi yang memang memadai.

## Format
- PDF A4, siap cetak, header/footer, nomor halaman, judul, identitas toko, periode, timestamp ekspor, subtotal, penanda ketidakpastian.
- XLSX dengan sheet sesuai jenis laporan, tabel/filter, freeze panes, format numerik/tanggal, print area, dan header cetak berulang.
- CSV UTF-8 dengan header dan escaping yang benar.
- JSON untuk backup/transfer data, dengan versi skema dan validasi impor. JSON bukan laporan keuangan presentasi dan bukan backup otomatis.
- Browser Print / Save as PDF memakai print CSS.

## Jenis laporan yang disarankan
1. Ringkasan usaha.
2. Penjualan dan keuntungan barang.
3. Stok serta persediaan.
4. Pembelian dan restock.
5. Pengeluaran dan pendapatan lain.
6. Uang toko, setoran, dan selisih.
7. Riwayat transaksi, pembatalan, dan koreksi.

## Template PDF
- Header: nama toko, judul laporan, rentang periode, zona waktu WIB bila relevan, dibuat pada.
- Ringkasan eksekutif dengan hanya metrik yang relevan.
- Tabel terstruktur dengan teks rata kiri dan angka rata kanan.
- Format Rupiah konsisten dengan pemisah ribuan.
- Total/subtotal yang mudah ditemukan tanpa warna blok besar.
- Catatan data belum diketahui/perlu diperiksa, rentang harga campuran, koreksi, atau stok yang belum dicek.
- Footer, nomor halaman, dan pengulangan header tabel pada halaman berikutnya jika memungkinkan.
- Portrait untuk ringkasan, landscape untuk tabel lebar. Jangan ekspor screenshot dashboard sebagai laporan.

## Struktur XLSX
Sheet pertama `Ringkasan`; sheet data dibuat sesuai jenis laporan, misalnya `Penjualan`, `Stok`, `Belanja`, `Pengeluaran`, `Setoran`, `Riwayat`. Jangan mengubah angka menjadi string hanya untuk tampilan. Jangan menyisipkan macro atau external content. Atur cetak agar kolom tidak terpotong.

## Integritas perhitungan
- Gunakan engine perhitungan yang sama dengan dashboard dan preview.
- Jangan duplikasi rumus di renderer PDF/XLSX.
- Rentang/filter ekspor harus sama dengan preview.
- Angka yang tak pasti tidak boleh ditampilkan sebagai angka pasti.
- Koreksi terhadap periode tertutup harus tetap tampak sebagai koreksi; sejarah tidak diubah diam-diam.
- Ekspor bukan bukti bahwa data sudah dibackup atau dipulihkan.

## Alur UX
Pilih laporan → tentukan periode/filter → preview → periksa peringatan data → pilih format → hasilkan file → notifikasi hanya setelah file dibuat.

## Pengujian minimum
- Preview sama dengan ekspor.
- PDF terbuka, tercetak, bernomor halaman, tidak terpotong.
- XLSX terbuka dan nilai tetap numerik.
- CSV encoding/escaping valid.
- JSON skema valid dan import memerlukan preview/konfirmasi.
- Uji data kosong, ribuan baris, nama produk panjang, nilai besar, karakter khusus, tanggal tepi periode, serta komponen dengan kepastian `Perlu Diperiksa`/`Belum Diketahui`.
- Format yang belum benar-benar berjalan tidak boleh ditampilkan sebagai tersedia.
