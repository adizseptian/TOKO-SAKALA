# TOKO SAKALA — Alur Cek Sisa Sekaligus v1.0

**Status:** Implementasi UI/preview; penyimpanan belum aktif.  
**Sumber kebutuhan:** lembar cek stok tulisan tangan yang diberikan pemilik.  
**Tujuan:** mengganti kebiasaan membuka form satu per satu dengan satu lembar input massal yang mudah dipahami.

## 1. Prinsip

- Pengguna dapat memasukkan banyak barang dalam satu tabel.
- Nama, jumlah sisa, dan harga jual tampil pada baris yang sama.
- Nilai per baris dan total dihitung otomatis.
- Kategori bersifat opsional dan memakai bahasa sehari-hari.
- Kolom kosong tidak dianggap nol dan tidak diam-diam masuk perhitungan.
- Data ini adalah draf layar sampai penyimpanan backend resmi tersedia.
- Tidak ada rumus keuntungan baru yang disimpulkan dari total harga jual stok tersisa.

## 2. Kolom tabel

| Kolom | Input / otomatis | Aturan |
|---|---|---|
| No. | Otomatis | Nomor baris untuk membantu rujukan |
| Nama barang | Pengguna | Wajib agar baris dihitung |
| Kategori | Opsional | Makanan, Minuman, Kebutuhan toko, Lainnya |
| Sisa sekarang | Pengguna | Bilangan bulat nonnegatif, dalam satuan jual terkecil |
| Harga jual / item | Pengguna pada preview saat ini | Bilangan bulat Rupiah; nantinya dapat diisi dari master barang saat master tersedia |
| Nilai sisa | Otomatis | `sisa × harga jual`; hanya nilai ritel indikatif |

`Isi/Sisa` dan `Jml. Item` pada lembar kertas contoh terlihat berulang dengan nilai yang sama. UI tidak menduplikasi input tersebut. Satu field “Sisa sekarang” digunakan; satuan ditampilkan sebagai bantuan.

## 3. Validasi

Satu baris dianggap lengkap jika nama barang, jumlah sisa, dan harga jual diisi. Jumlah sisa `0` adalah nilai yang sah untuk barang habis. Baris yang benar-benar kosong diabaikan. Baris yang sudah mulai diisi tetapi belum lengkap ditandai dan tidak ikut total.

Nilai setiap baris harus bilangan bulat aman dan tidak negatif. Nilai terlalu besar harus menghasilkan kesalahan validasi, bukan hasil yang meluap.

## 4. Ringkasan yang ditampilkan

- Jumlah jenis barang yang lengkap.
- Total unit sisa dari baris lengkap.
- Nilai sisa pada harga jual.
- Total pengeluaran yang sedang diisi pada bagian terpisah.
- Jumlah baris yang masih perlu dilengkapi.

Peringatan wajib: **“Nilai sisa menurut harga jual” bukan modal sisa, bukan uang kas, dan bukan keuntungan.**

Keuntungan tidak dihitung di layar cek stok saja. Keuntungan harus berasal dari engine yang memperhitungkan penjualan terverifikasi, modal unit, barang rusak/dipakai/tidak diketahui, pendapatan lain, serta pengeluaran yang sesuai.

## 5. Pengeluaran

Pengeluaran dicatat pada panel terpisah dari nilai stok: misalnya gas, plastik, es batu, dan sabun. Tombol cepat hanya membuat baris draf. Nominal dan kategori belum disimpan. Pengeluaran tidak otomatis dikurangi dari nilai sisa atau penjualan.

## 6. Contoh tabel dari foto

Tombol “Lihat contoh tabel” mengisi baris draf dari angka yang terbaca pada foto untuk mencoba interaksi. Contoh itu tidak menjadi data produk nyata dan tidak disimpan. Nama yang tulisan tangannya kurang jelas diberi penanda untuk diperiksa.

Nilai sisa pada harga jual dari baris yang terbaca lengkap harus menjadi **Rp524.000**. Contoh baris ChocoPie tidak mempunyai kuantitas/harga yang terbaca lengkap, sehingga ditandai belum lengkap dan tidak ikut total. Contoh ini adalah pemeriksaan UX aritmetika, bukan laporan bisnis yang disahkan.

## 7. Aksi

- **Tambah baris barang:** menambahkan baris kosong.
- **Lihat contoh tabel:** mengganti draf dengan contoh yang tidak tersimpan.
- **Tinjau ringkasan:** menampilkan ringkasan sementara.
- **Kosongkan form:** menghapus hanya draf di layar.
- **Cetak / Simpan PDF:** membuka dialog cetak browser dengan aturan CSS cetak; pengguna dapat memilih “Save as PDF”. Ini bukan ekspor PDF berbasis laporan tersimpan.
- **Simpan catatan:** tetap nonaktif sampai backend, validasi server, idempotensi, dan jejak audit tersedia.

## 8. Pengujian wajib

1. Contoh foto menghasilkan jumlah 318 unit pada 15 baris lengkap.
2. Nilai ritel stok sisa untuk contoh foto = Rp524.000.
3. ChocoPie yang belum lengkap tidak ikut total dan memberi peringatan.
4. Baris kosong diabaikan.
5. Sisa `0` dianggap lengkap jika nama dan harga jual tersedia.
6. Jumlah/harga negatif, desimal, atau nilai yang menyebabkan overflow ditolak.
7. Mengubah sisa atau harga memperbarui total langsung.
8. Hapus baris hanya mengubah draf, tidak menghapus transaksi historis.
9. “Kosongkan form” hanya membersihkan draf sementara.
10. Dialog cetak dapat membuka halaman cetak yang tidak menyertakan navigasi aplikasi.
11. Tidak ada data draf yang disimpan ke `localStorage` atau backend.

## 9. Pekerjaan berikutnya (belum diimplementasikan)

- Menghubungkan nama, kategori, dan harga jual ke master barang resmi.
- Mengisi jumlah sisa sebelumnya / stok yang tersedia dari data engine, tanpa menganggapnya sebagai penjualan sebelum validasi.
- Menampilkan hasil hitung penjualan dan modal hanya setelah engine dan catatan kejadian tersedia.
- Menyimpan satu sesi cek sisa secara atomik melalui backend.
- Memasukkan laporan tersimpan ke ekspor PDF/XLSX/CSV/JSON.
