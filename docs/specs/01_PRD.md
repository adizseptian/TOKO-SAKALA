# 01 — PRD TOKO SAKALA

**Nama produk:** TOKO SAKALA  
**Versi kompilasi:** 1.0  
**Status dokumen:** Konsolidasi; fondasi produk/UX terkunci, beberapa revisi bisnis dan penutupan periode menunggu lock eksplisit.  
**Audiens:** Product owner, implementer, reviewer, tester.

## 1. Ringkasan produk

TOKO SAKALA adalah webapp pribadi untuk membantu pemilik toko mencatat barang, belanja, sisa stok, barang rusak/dipakai, pengeluaran, pendapatan lain, setoran, serta melihat hasil usaha tanpa harus memahami akuntansi.

**Prinsip terkunci:** “Jangan membuat pengguna memahami sistem. Buat sistem yang memahami pengguna.” Prinsip pendamping: “Yang terlihat mudah. Yang sulit dikerjakan sistem.”

Pengguna mencatat kejadian sehari-hari. Sistem mengubahnya menjadi data terstruktur, menghitung hasil, memeriksa ketidakcocokan, menjaga histori, dan menjelaskan angka dengan bahasa sehari-hari.

## 2. Tujuan

1. Mengurangi pekerjaan pencatatan berulang.
2. Menjadikan stok fisik sebagai input sederhana dan barang terjual sebagai hasil hitung, bukan kewajiban mengetik penjualan satu per satu.
3. Memisahkan keuntungan, uang toko, dan setoran secara ketat.
4. Menjaga semua perubahan penting agar dapat ditelusuri dan dikoreksi.
5. Memudahkan pemeriksaan harian/mingguan dan ekspor laporan.
6. Berangkat dari aplikasi inti tanpa AI, lalu menambahkan bantuan pintar setelah core teruji.

## 3. Pengguna dan konteks

- **Pengguna utama:** pemilik/operator satu toko, satu orang pada satu komputer.
- **Kemampuan:** tidak diasumsikan memahami istilah finansial/akuntansi.
- **Perangkat:** desktop lebih diutamakan untuk administrasi; layar ponsel harus responsif untuk input cepat.
- **Privasi:** penggunaan pribadi/local-first pada lapisan aplikasi; database nyata diarahkan ke satu proyek Supabase Free setelah seluruh gerbang keamanan dan pemulihan dipenuhi.
- **Tanpa login** pada rancangan awal. Ini bukan berarti akses otomatis aman: aplikasi tidak boleh dipublikasikan atau dibuka melalui LAN/tunnel. Host guard, binding localhost, dan pengujian akses wajib sebelum data nyata.

## 4. Pekerjaan utama pengguna

1. Menambahkan barang dan informasi kemasan.
2. Mencatat belanja/restock.
3. Memasukkan jumlah sisa barang fisik.
4. Mencatat barang rusak atau dipakai.
5. Mencatat biaya toko dan pendapatan tambahan.
6. Mencatat setoran uang yang benar-benar diserahkan.
7. Mengetahui hasil, status setoran, dan alasan adanya selisih.
8. Melihat/mengunduh laporan per periode.

## 5. Cakupan MVP

### Termasuk

- Setup toko dan barang.
- Satuan pembelian kemasan → satuan dasar jual (MVP: satuan jual tunggal dan bilangan bulat, biasanya pcs).
- Pembelian dan restock kapan pun tanpa membuat periode baru.
- Cek sisa barang dan perhitungan penjualan dari interval cek.
- Barang rusak, barang dipakai, serta barang berkurang yang penyebabnya tidak diketahui.
- Riwayat harga beli, isi kemasan, dan harga jual.
- Pengeluaran toko, pendapatan lain, setoran satu kali atau beberapa kali per periode.
- Preview sebelum simpan; konfirmasi dan undo/batal sesuai status periode.
- Periode, snapshot, koreksi terhubung ke asal, audit trail.
- Dashboard ringkas, laporan periode, ekspor data/laporan.
- Kesalahan validasi/koneksi dalam Bahasa Indonesia sederhana.

### Di luar MVP

- POS dan pencatatan setiap transaksi pelanggan.
- QRIS/transfer/non-tunai dan piutang pelanggan.
- Pembelian kredit/cicilan pemasok.
- Multi-cabang, multi-pengguna, login/otorisasi berbasis akun.
- Diskon/retur kompleks, barang titipan, bonus supplier, jual dengan beberapa satuan atau satuan pecahan.
- AI, OCR nota, chat command, smart restock/insight otomatis.
- Offline queue/PWA dan hosting publik.
- Integrasi bank, akuntansi penuh, atau fitur ERP.

## 6. Prinsip perhitungan dan aturan bisnis

### Tiga dunia wajib dipisahkan

- **BARANG:** jumlah unit fisik dan nilai modal persediaan.
- **HASIL/UNTUNG:** penjualan dan pendapatan, dikurangi modal barang terjual, barang rusak/dipakai/selisih stok, serta pengeluaran toko sesuai aturan.
- **UANG:** aliran uang tunai yang benar-benar diasumsikan masuk/keluar, termasuk sumber uang untuk pembelian/pengeluaran dan setoran aktual.

Keuntungan ≠ uang toko ≠ setoran. Setoran adalah nominal aktual yang diserahkan; ia bukan pendapatan baru.

### Rumus pokok

- `pcs_masuk = jumlah_kemasan × isi_per_kemasan`.
- `stok_tersedia = stok_acuan_terakhir + barang_masuk − pengeluaran_stok_nonpenjualan_tercatat`.
- `terjual = stok_tersedia − stok_fisik_sisa`, hanya valid jika `0 ≤ terjual ≤ stok_tersedia`.
- `penjualan = terjual × harga_jual_berlaku`, dengan ketidakpastian jika interval melintasi perubahan harga.
- `modal_barang_terjual` memakai **rata-rata bergerak** atas modal yang diketahui; tidak menggunakan FIFO untuk MVP.
- `untung = penjualan + pendapatan_lain − modal_barang_terjual − kerugian_rusak − nilai_barang_dipakai − nilai_selisih_barang − pengeluaran_toko`.
- `uang_toko_kumulatif = uang_masuk − uang_keluar − setoran ± koreksi_kas`, dengan uang keluar dikurangi dari saldo hanya jika sumbernya uang toko.
- `selisih_setoran = setoran_aktual − uang_seharusnya`.

Rumus harus diterapkan oleh satu engine bersama. Nilai rupiah disimpan sebagai integer rupiah; modal per unit boleh tampil pecahan, tetapi nilai sumber total dan jumlah unit menjadi sumber kebenaran untuk menghindari kebocoran pembulatan.

### Pembelian dari uang toko/pribadi

Sumber uang memengaruhi perhitungan uang, bukan jumlah barang atau modal pembelian. Aplikasi bertanya pada transaksi relevan pertama; jawaban menjadi preferensi awal yang dapat diubah pada setiap kejadian. Sumber transaksi disimpan sebagai snapshot historis. Sistem tidak boleh mengasumsikan sumber diam-diam. Sumber awal pilihan masih perlu ditentukan oleh pengguna pada implementasi pertama.

### Ketidakpastian

Setiap nilai penting membawa tingkat kepastian: **Pasti**, **Perlu Diperiksa**, atau **Belum Diketahui**. Nilai turunan tidak boleh memiliki kepastian lebih tinggi daripada komponen terlemahnya. Sistem tidak boleh mengarang modal awal, jumlah stok, sumber uang, alasan selisih, atau harga historis.

## 7. Status setoran

- **COCOK:** jumlah cocok dan seluruh komponen yang memengaruhi kesimpulan dapat dipastikan.
- **PERLU DIPERIKSA:** ada ketidakpastian, kemungkinan rentang, atau komponen belum terkonfirmasi—meskipun selisih yang ditampilkan nol.
- **BELUM COCOK:** terdapat selisih yang tidak dapat diterangkan ketika komponen terkait semuanya pasti.
- **MENUNGGU SETORAN:** setoran belum dicatat/lengkap; tidak boleh disebut cocok.

Sistem menyebut “ada selisih” dan memberi kemungkinan pemeriksaan secara netral, bukan tuduhan kehilangan/pengambilan uang.

## 8. Periode

Arah yang disepakati adalah periode mingguan Senin–Minggu dalam WIB; uang dihitung kumulatif, sedangkan periode menjadi jendela laporan. Restock tidak mereset periode. Periode boleh ditutup sebagian dan snapshot historis harus beku.

**Belum terkunci:** perilaku final jika pengguna menutup periode sebelum akhir minggu kalender. Kandidat TRD v3: akhir segmen menjadi waktu penutupan dan segmen selanjutnya mulai pada waktu tersebut sehingga tanpa celah/tumpang tindih. Kandidat ini tidak boleh dianggap final sebelum konflik antara minggu kalender dan segmen penutupan disetujui.

## 9. Koreksi dan histori

- Kejadian finansial/stok bersifat append-only.
- Edit menghasilkan versi baru; pembatalan menghasilkan void/cancellation record; tidak menimpa atau menghapus jejak asal.
- Periode terbuka boleh dikoreksi lewat versi/void yang terlacak.
- Periode tertutup tidak diubah diam-diam. Koreksi menjadi pembalikan + entri baru pada periode berjalan, terkait ke kejadian/periode asal; snapshot lama tetap sama.
- Undo setelah penyimpanan adalah pencatatan pembatalan; pembatalan tidak bisa di-undo langsung. “Catat ulang” membuat kejadian baru.

## 10. UX dan bahasa

- Bahasa UI utama: Bahasa Indonesia sehari-hari.
- Hindari istilah pada layar utama: HPP, COGS, gross profit, debit/kredit, jurnal, batch, stock ledger, rekonsiliasi, variance.
- Bahasa pengguna: modal barang, untung, uang dari penjualan, pengeluaran toko, pendapatan lain, sisa barang, setoran, selisih, perlu diperiksa.
- Dashboard menjawab maksimal lima hal: kondisi toko, uang seharusnya, status setoran, untung, dan hal yang perlu diperiksa.
- Informasi bertingkat: Level 1 ringkas; Level 2 “Kenapa?”; Level 3 “Lihat perhitungan”; Level 4 riwayat/peristiwa/teknis.
- Form input fokus; satu tindakan utama; pertanyaan hanya saat diperlukan.
- Live preview dua sisi: kiri barang & hasil; kanan uang & setoran; di ponsel menjadi susunan vertikal.
- Konfirmasi tersimpan ringkas dan menawarkan Undo bila masih aman.

## 11. Keberhasilan produk

MVP memenuhi tujuan jika:

- Pengguna dapat menyelesaikan alur belanja → cek sisa → kejadian lain → setoran → melihat hasil tanpa memahami akuntansi.
- Golden tests hitung-tangan lulus 100%.
- Rumus preview identik dengan rumus server dan hasil database.
- Data tidak ditimpa diam-diam, dan koreksi dapat ditelusuri.
- Setoran menampilkan status berdasarkan nilai serta kepastian, bukan warna saja.
- Laporan secara jelas menandai barang/modal yang belum diketahui.
- Backup dan restore telah diuji sebelum data toko sebenarnya dipakai.
- Keamanan localhost dan database diuji secara negatif maupun positif.

## 12. Prioritas produk yang disetujui

**Arah UI:** Pendekatan B — sederhana tetapi modern.  
**Prioritas tahap pertama:** keseimbangan antara kemudahan dan akurasi.  
**Urutan:** integritas data/perhitungan → kemudahan → hierarchy/keterbacaan → keamanan/pemulihan → keindahan/motion.

## 13. Batas status dokumen

PRD v1.0 merupakan baseline yang sebelumnya dikunci. PRD v1.1 dan konsolidasi ini adalah pembaruan/dossier kerja, bukan bukti otomatis bahwa semua bagian baru telah dikunci. Batas periode saat tutup lebih awal, sumber uang default awal, dan butir APPFLOW §22 harus diselesaikan dalam register keputusan sebelum disebut final.
