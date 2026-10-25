# TOKO SAKALA — Prompt Penyempurnaan Alur Catat Sisa Barang v1.0

## Instruksi utama

Sempurnakan **repository TOKO SAKALA yang sedang terbuka ini** berdasarkan foto lembar pencatatan yang dilampirkan pengguna. Jangan membuat proyek baru, jangan mengganti framework, dan jangan menulis ulang seluruh aplikasi. Audit komponen yang ada terlebih dahulu, lalu buat perubahan sekecil dan setepat mungkin agar mudah ditinjau.

Pertahankan layout, komponen, navigasi, design tokens, pengaturan Light/Dark Mode, animasi Motion, ikon Lucide, validasi Zod, serta state/context yang sudah ada jika masih layak. Reuse komponen dan utilitas yang sudah tersedia. Jangan menggandakan engine perhitungan.

## Tujuan pengguna

Pengguna terbiasa mencatat sisa barang di atas kertas, dalam satu tabel panjang. Ia ingin pekerjaan yang sama di webapp menjadi lebih cepat: lihat semua barang sekaligus, masukkan jumlah sisa, dan biarkan aplikasi menghitung nilai setiap baris serta jumlah keseluruhan. Bahasa antarmuka harus sangat mudah dipahami pengguna toko yang tidak memiliki latar belakang akuntansi.

Prinsip: **pengguna mencatat kejadian; sistem merapikan dan menghitung.**

## 1. Buat alur “Cek Sisa Sekaligus”

Audit lalu sempurnakan screen komponen yang sesuai, misalnya `src/components/screens/StockCheckScreen.tsx`. Jangan membuat layar kedua yang menduplikasi screen stok saat ini.

Tampilkan tabel responsif dengan kolom:

1. No.
2. Nama barang.
3. Kategori (opsional).
4. **Sisa sekarang** — input utama pengguna, bilangan bulat nonnegatif; `0` berarti habis dan sah.
5. **Harga jual / item** — otomatis mengambil harga jual terkini dari master barang bila tersedia.
6. **Nilai sisa** — dihitung otomatis `sisa sekarang × harga jual`.
7. Aksi hapus baris draf, bila diperlukan.

Jika master barang dan harga sudah ada, nama/kategori/harga tidak perlu diketik ulang. Fokus pengguna harus pada jumlah sisa. Bila master data tidak ada atau harga tidak diketahui, jangan mengarang nilai; tunjukkan informasi yang perlu dilengkapi. Jika input per satuan jual belum jelas, tanya sekali secara kontekstual.

Jangan membuat kolom ganda “Isi/Sisa” dan “Jml. Item” bila sebenarnya berisi angka yang sama. Gunakan satu kolom “Sisa sekarang” dan tampilkan satuannya (pcs, bungkus, botol, atau satuan jual yang memang disimpan pada master produk).

Tabel harus mudah dipakai untuk banyak jenis barang: sticky header di desktop, scroll horizontal atau tampilan baris/kartu yang rapi di ponsel, nomor baris yang konsisten, tombol tambah baris, dan pencarian bila katalog panjang. Jangan memaksa pengguna membuka modal untuk setiap barang.

## 2. Ringkasan otomatis di bawah tabel

Tampilkan:

- Jumlah jenis barang yang lengkap.
- Jumlah unit tersisa.
- Total **nilai sisa menurut harga jual**.
- Jumlah baris yang belum lengkap / perlu diperiksa.
- Tombol **Tinjau ringkasan** sebelum alur selesai.

Baris kosong diabaikan. Baris yang mulai diisi tetapi belum lengkap ditandai dan tidak ikut subtotal. Validasi harus menolak angka negatif, pecahan untuk jumlah unit, dan angka yang terlalu besar untuk dihitung dengan aman. Harga atau jumlah `0` tidak boleh diam-diam dianggap sebagai informasi yang belum diisi.

### Peringatan nama dan arti angka

Gunakan label eksplisit: **“Nilai sisa menurut harga jual”**. Sertakan penjelasan yang mudah dipahami:

> Ini perkiraan nilai jika semua sisa barang berhasil dijual. Angka ini bukan modal barang yang tersisa dan bukan keuntungan.

Jangan mengubah subtotal ini menjadi “untung”, “laba”, atau “uang kas”. **Keuntungan, modal sisa, uang toko, dan setoran adalah angka yang berbeda.**

Keuntungan hanya boleh dihitung oleh engine bisnis bersama dari catatan stok, pembelian/modal, barang yang terjual, barang rusak/dipakai/tidak diketahui, pendapatan lain, dan pengeluaran yang relevan. Jika sumber datanya belum ada, tampilkan “Belum dapat dihitung dari catatan ini saja”, bukan angka rekaan.

## 3. Gunakan foto sebagai contoh format, bukan sumber data nyata

Pengguna boleh menambahkan foto kertas ke konteks Google AI Studio untuk memahami susunan tabel. Jika menambahkan tombol “Lihat contoh tabel”, beri label yang jelas bahwa itu **contoh sementara** dan jangan menyimpannya sebagai stok toko nyata.

Angka yang terbaca pada 15 baris lengkap di contoh foto:

- Jumlah sisa: **318 unit**.
- Total nilai sisa pada harga jual: **Rp524.000**.
- Satu baris ChocoPie belum memiliki jumlah/harga lengkap dan harus tetap ditandai belum lengkap, tidak masuk subtotal.

Gunakan angka ini hanya sebagai uji hitungan tabel; nama barang yang tulisan tangannya kurang jelas tidak perlu dipastikan. Jangan memuat contoh otomatis saat aplikasi pertama dibuka, dan jangan mengubah angka contoh menjadi catatan transaksi.

## 4. Pengeluaran toko tetap terpisah

Buat panel sederhana **Pengeluaran toko** di bawah atau sesudah tabel. Pengeluaran seperti gas, plastik, es batu, atau sabun dicatat pada baris tersendiri dengan nama dan nominal. Sediakan shortcut untuk menambahkan kategori yang umum, tetapi jangan otomatis membuat transaksi hanya karena shortcut ditekan; shortcut hanya membuat baris input.

Tampilkan jumlah pengeluaran terpisah. Jangan mengurangkan pengeluaran dari nilai stok pada harga jual. Hubungkan ke engine keuangan hanya jika aturan dan data transaksi memang tersedia. Jika belum, beri keterangan jelas bahwa hasil akhir keuntungan belum dapat dihitung.

## 5. Bahasa antarmuka

Gunakan bahasa yang langsung dimengerti:

- “Cek sisa barang”
- “Sisa sekarang”
- “Harga jual / item”
- “Nilai sisa”
- “Pengeluaran toko”
- “Tinjau ringkasan”
- “Masih ada baris yang perlu dilengkapi”
- “Belum disimpan”
- “Coba periksa jumlah atau harga pada baris ini”

Hindari istilah di layar utama: HPP, COGS, jurnal, rekonsiliasi, batch, ledger, debit, kredit, inventory adjustment.

Bila draft hanya ada di state halaman, beritahu pengguna bahwa draft belum tersimpan dan akan hilang jika halaman ditinggalkan/dimuat ulang. Jangan menunjukkan toast “Berhasil disimpan” untuk data yang hanya berada di memori.

## 6. Cetak dan laporan

Sediakan aksi **“Cetak / Simpan PDF”** untuk lembar cek sisa menggunakan print stylesheet yang rapi:

- A4, judul, nama toko jika tersedia, tanggal/periode bila tersedia.
- Header tabel kontras, total mudah ditemukan, footer sederhana.
- Kolom dan angka tidak terpotong; gunakan landscape bila tabel terlalu lebar.
- Sembunyikan navigasi, tombol aksi, dekorasi layar, dan elemen yang tidak perlu dicetak.

Jangan mengklaim ini sebagai ekspor PDF laporan keuangan tersimpan. Untuk PDF/XLSX/CSV/JSON yang sesungguhnya, ikuti spesifikasi laporan yang ada dan gunakan sumber perhitungan yang sama dengan dashboard.

## 7. Design dan aksesibilitas

- Jaga hierarki dan keterbacaan; jangan mengecilkan teks agar seluruh kolom muat.
- Light Mode harus benar-benar dirancang, bukan sekadar membalik warna Dark Mode. Tabel, input, garis, status, hover, fokus, dan dialog harus diuji pada kedua tema.
- Gunakan warna status bersama label teks; jangan mengandalkan warna saja.
- Semua input punya label/accessible name dan berfungsi dengan keyboard.
- Hormati prefers-reduced-motion.
- Hindari glow/animasi berlebihan pada tabel kerja.

## 8. Integritas data dan batasan

- Jangan ubah rumus bisnis yang sudah dikunci.
- Jangan mencampur nilai stok harga jual dengan modal atau keuntungan.
- Gunakan engine murni bersama untuk semua kalkulasi terkait.
- Jangan menambahkan panggilan AI/Gemini; AI tetap OFF dan tidak diperlukan untuk alur ini.
- Jangan menambah ketergantungan `localStorage` untuk data keuangan nyata. Jika penyimpanan proyek saat ini masih prototipe browser, labeli dengan jujur dan jangan mengklaim aman untuk data toko sebenarnya.
- Tombol simpan nyata hanya boleh aktif jika mekanisme penyimpanan backend yang aman, validasi server, idempotensi, histori perubahan, dan pemulihan data sudah tersedia dan diuji. Jangan menghapus proteksi ini demi demo.

## 9. Tes wajib sebelum selesai

1. 15 baris contoh lengkap menghasilkan 318 unit dan Rp524.000.
2. Baris tidak lengkap tidak ikut subtotal dan terlihat jelas.
3. Baris kosong diabaikan.
4. Sisa nol tetap valid bila nama dan harga tersedia.
5. Nilai negatif, pecahan kuantitas, dan overflow ditolak.
6. Mengubah qty/harga memperbarui baris dan ringkasan otomatis.
7. Menghapus baris tidak menghapus transaksi lama; bila hanya draft, jelas bahwa hanya draft yang dibuang.
8. Pengeluaran terpisah dari nilai sisa dan keuntungan.
9. Print preview A4 tidak memotong kolom/tabel dan tidak mencetak navigasi.
10. Uji desktop dan viewport ponsel.
11. Jalankan tes dan build yang tersedia. Jika dependensi atau alat uji tidak tersedia, laporkan sebagai belum dijalankan—jangan mengklaim lulus.

## Hasil yang harus dilaporkan

Sebelum mengakhiri tugas, jelaskan file yang diubah, perilaku baru, tes yang benar-benar dijalankan, hasilnya, fitur yang belum aktif, dan risiko data yang masih tersisa. Jangan mengganti seluruh proyek; fokus pada peningkatan alur yang diminta.
