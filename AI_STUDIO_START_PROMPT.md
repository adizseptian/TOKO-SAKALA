# PROMPT AUDIT & LANJUTAN — GOOGLE AI STUDIO BUILD

Lanjutkan repository TOKO SAKALA yang sudah ada. Jangan membuat proyek baru dan jangan menulis ulang seluruh aplikasi.

## Prioritas UI terbaru: cek sisa barang satu tabel

Baca `docs/specs/17_ALUR_CEK_SISA_SEKALIGUS.md` dan audit implementasinya pada `src/App.tsx`, `src/styles.css`, serta `src/engine/v1/stock-check-preview.ts`.

Kebutuhan produk:
- Pengguna bisa memeriksa banyak barang dari satu tabel: nama, kategori opsional, sisa sekarang, harga jual per item, dan nilai sisa otomatis.
- Gunakan bahasa Indonesia sehari-hari: “Sisa sekarang”, “Harga jual / item”, “Pengeluaran toko”, “Tinjau ringkasan”. Jangan pakai HPP/COGS/jurnal/re konsiliasi dalam UI utama.
- Satu field “Sisa sekarang” cukup; jangan duplikasi input “isi/sisa” dengan “jumlah item” apabila satuannya memang sama.
- Baris kosong diabaikan, sisa 0 sah, baris setengah terisi ditandai.
- Total `sisa × harga jual` harus dilabeli sebagai nilai sisa pada harga jual, bukan modal, kas, atau keuntungan.
- Pengeluaran dipisahkan dari stok. AI OFF default; jangan panggil model AI/API.
- “Lihat contoh tabel” hanya memuat draf di layar dan harus jelas bahwa draf tidak disimpan.
- Cetak / Simpan PDF memakai print stylesheet hanya sebagai print preview; jangan mengklaim itu ekspor laporan keuangan tersimpan.
- Tombol penyimpanan transaksi tetap nonaktif sampai backend aman selesai.

## Validasi data contoh

Foto referensi mempunyai subtotal nilai sisa menurut harga jual Rp524.000 untuk 15 baris yang terbaca lengkap; ChocoPie tidak lengkap sehingga tidak ikut jumlah. Jumlah unit dari 15 baris lengkap adalah 318. Ini hanya validasi alur/tabel, bukan sumber stok nyata.

## Tugas pertama

1. Baca `README.md`, `docs/BUILD_STATUS.md`, `docs/DECISION_REGISTER.md`, semua dokumen pada `docs/specs/`, termasuk `17_ALUR_CEK_SISA_SEKALIGUS.md` dan `18_REPORTING_EXPORT_SPEC.md`, serta `docs/UI_UX_REFINEMENT_PROMPT_v1.1.md`.
2. Jalankan `npm install`, `npm run test`, `npm run build`, dan `npm run scan:secrets` jika runtime mendukung. Laporkan hasil nyata, jangan mengklaim lulus kalau belum dijalankan.
3. Perbaiki error yang dapat direproduksi secara terisolasi.
4. Pastikan seluruh tombol yang aktif melakukan aksi nyata; jangan memasang tombol dekoratif.
5. Periksa ukuran layar desktop, tablet, dan ponsel serta dialog cetak.

## Kunci produk

- Prinsip utama: “Jangan membuat pengguna memahami sistem. Buat sistem yang memahami pengguna.”
- Keuntungan ≠ uang toko ≠ setoran.
- Modal tidak diketahui jangan dikarang.
- Sisa barang merupakan input; penjualan hanya hasil engine jika stok dan data pendukung dapat dijelaskan.
- Riwayat tidak boleh berubah diam-diam.
- `localStorage` hanya untuk preferensi UI, bukan data transaksi.
- AI default OFF dan belum terhubung. Jangan menambah API key atau mengirim data ke layanan eksternal.
- Jangan aktifkan penyimpanan transaksi sampai backend atomik, idempotensi, validasi server, jejak audit, kontrol akses, serta backup/pemulihan diuji.

## Laporan dan ekspor

Baca `docs/specs/18_REPORTING_EXPORT_SPEC.md`, dan tandai PDF/XLSX/CSV/JSON sebagai belum aktif kecuali benar-benar sudah dibuat serta diuji. Print to PDF melalui browser tidak sama dengan ekspor PDF laporan tersimpan.

Setiap akhir tugas, laporkan file yang berubah, tes yang benar-benar dijalankan, hasil, pekerjaan yang belum selesai, dan risiko yang tersisa.
