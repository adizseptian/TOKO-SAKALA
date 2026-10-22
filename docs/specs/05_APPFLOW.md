# 05 — APPFLOW TOKO SAKALA

**Status:** APPFLOW revisi 3 merupakan alur kerja yang sudah banyak dirumuskan tetapi dokumen revisinya belum resmi dikunci sampai keputusan §22 dan konsistensi lintas dokumen selesai.

## 1. Prinsip alur

- Pengguna memasukkan kejadian, bukan jurnal atau rumus.
- Sistem menggunakan konteks yang sudah diketahui untuk menghindari pertanyaan berulang.
- Setiap aksi penting menjalani `Draft → Preview → Confirm → Save → Result`.
- Preview menampilkan draft dan dilabeli **Belum disimpan**.
- Sebelum konfirmasi, batal tidak menghasilkan event.
- Setelah tersimpan, Undo menjadi pembatalan terlacak, bukan delete fisik.
- Data yang tidak pasti harus jelas di layar.

## 2. Setup pertama

1. Buka aplikasi lokal.
2. Isi nama toko.
3. Tambahkan barang paling penting.
4. Isi nama, satuan belanja, isi per kemasan, harga beli bila ada, dan harga jual.
5. Catat stok awal fisik.
6. Modal awal opsional; jika tidak diketahui, tandai Belum Diketahui—jangan menebak.
7. Uji contoh pencatatan/hasil sebelum menyimpan data toko nyata.

Tidak perlu memaksa import seluruh katalog atau mengisi semua modal sebelum pengguna dapat mulai.

## 3. Belanja / restock

1. Pilih barang.
2. Masukkan jumlah kemasan.
3. Isi kemasan diambil dari histori terakhir; tanya hanya jika belum ada atau berubah.
4. Masukkan harga per kemasan atau total yang diketahui, dengan satu format yang jelas.
5. Pilih sumber uang untuk kejadian tersebut jika sumber belum diketahui.
6. Preview menunjukkan jumlah unit dasar, total biaya pembelian, estimasi modal per unit, stok setelah masuk, dan dampak uang.
7. Konfirmasi → validasi server → commit atomik.
8. Sistem menyimpan histori tanggal, unit, isi kemasan, harga, dan sumber uang.

Restock tidak membuat periode baru.

## 4. Cek sisa

1. Tampilkan produk aktif dengan jumlah stok tersedia sebagai konteks.
2. Pengguna mengisi jumlah fisik tersisa; input dapat dilakukan beberapa produk dalam satu layar.
3. Engine menghitung selisih dari checkpoint sebelumnya dan event stok yang sudah dicatat.
4. Jika `0 ≤ terjual ≤ tersedia`, penurunan normal dihitung sebagai penjualan sesuai prinsip produk.
5. Jika sisa lebih besar daripada tersedia, jangan buat penjualan negatif. Minta satu pilihan yang relevan: belanja belum dicatat, salah hitung, atau tidak tahu/selisih.
6. Jika penurunan luar pola dan histori memadai, tampilkan soft prompt, jangan memblokir tanpa alasan.
7. Preview dua sisi memperlihatkan BARANG & HASIL di kiri dan UANG & SETORAN di kanan.
8. Konfirmasi dan simpan. Hasil final bersumber dari hasil server.

Pernyataan “tidak ada penjualan sejak cek terakhir” adalah event eksplisit, bukan berarti stok fisik sudah diamati. Jika tidak ada pengamatan stok, status stok tetap belum dicek.

## 5. Barang rusak / dipakai / tidak diketahui

- **Rusak:** catat jumlah dan barang; stok berkurang; keuntungan berkurang sebesar nilai modal; uang tidak berubah.
- **Dipakai:** catat jumlah; stok berkurang; keuntungan berkurang dengan nilai modal; tidak membuat arus kas keluar fiktif.
- **Tidak tahu:** menandai selisih stok; tidak menganggap sebagai penjualan; nilai modal yang diketahui memengaruhi hasil, uang tidak berubah; kepastian Perlu Diperiksa.
- **Salah hitung:** koreksi pengamatan stok sesuai audit/version policy, bukan menambah penjualan palsu.

## 6. Pengeluaran operasional

1. Masukkan deskripsi, jumlah rupiah, tanggal, dan sumber uang jika diperlukan.
2. Sistem mengenali kategori dasar dari konteks tetapi tidak boleh salah mengklasifikasi pembelian barang dagangan sebagai biaya.
3. Jika nama item sama dengan produk master dan jenisnya ambigu, ajukan satu pertanyaan.
4. Preview menguraikan dampak pada hasil dan uang.
5. Simpan, audit, dan Undo sesuai policy.

Contoh: gas, plastik, es batu, sabun.

## 7. Pendapatan lain

Contoh jasa seduh mi Rp2.000. Catat nominal, tanggal, keterangan, dan sumber/penerimaan. Pendapatan lain terpisah dari penjualan barang, menambah hasil dan uang sesuai aturan yang disahkan.

## 8. Setoran

1. Pengguna memasukkan jumlah yang benar-benar diserahkan dan tanggal.
2. Jika ada beberapa setoran dalam periode, jumlahkan tanpa membuatnya menjadi penjualan.
3. Sistem menampilkan uang seharusnya, akumulasi setoran aktual, selisih, status, dan alasan/ketidakpastian.
4. Jika target periode bisa disimpulkan dari tanggal dan konteks, jangan tanya. Jika beberapa periode terbuka membuatnya ambigu, tanyakan satu pertanyaan.
5. `MENUNGGU SETORAN` berlaku sebelum nominal setoran lengkap.

## 9. Penutupan periode

1. Pengguna melihat ringkasan dan daftar yang belum diketahui.
2. Barang belum dicek tidak secara otomatis memblokir penutupan; penutupan menjadi **Ditutup Sebagian** dan ketidakpastian diteruskan.
3. Pengguna mencatat setoran atau menyatakan tidak ada setoran untuk periode tersebut.
4. Jika ada selisih, sistem menampilkan opsi bawa selisih ke periode berikutnya atau catat sebagai selisih kas, sesuai policy yang disahkan.
5. Server snapshot data, kepastian, tree alasan, dan versi engine secara atomik.
6. Histori periode beku; koreksi di masa berikutnya menjadi pembalikan + entri baru yang tertaut.

**Pending lock:** bagaimana early close bersinergi dengan minggu kalender Senin–Minggu dan bagaimana periode berikutnya dimulai. Jangan implementasikan sebelum satu aturan tunggal disetujui.

## 10. Harga jual berubah di tengah interval cek

Jika perubahan harga terjadi sementara ada interval stok terbuka dan penjualan mungkin terjadi, sistem menawarkan cek sisa sekarang. Jika pengguna menunda, interval ditandai harga campuran dan penjualan/uang bisa berupa kisaran dengan status Perlu Diperiksa. Tidak boleh membagi penjualan menurut perkiraan tanpa label.

## 11. Koreksi, Undo, dan void

- Draft batal = tidak ada event.
- Undo setelah commit saat periode terbuka = pencatatan void/cancellation yang menjaga jejak.
- Periode tertutup = correction event/link yang terlihat di periode berjalan; laporan lama tetap beku.
- Retry commit yang statusnya tidak pasti = command ID yang sama.
- Pembatalan tidak dapat “di-undo” dengan menghapus baris; pengguna dapat “Catat ulang” yang menciptakan event baru.

## 12. Koneksi dan kegagalan

- Load gagal: tidak tampilkan data usang seolah live.
- Koneksi putus sesudah load: beri cap waktu data, disable save, draft tetap terlihat.
- Koneksi putus saat save: “Belum pasti tersimpan”; ulangi dengan ID yang sama.
- Tidak ada penyimpanan tersembunyi/offline queue.
