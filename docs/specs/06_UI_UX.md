# 06 — UI/UX TOKO SAKALA

**Arah yang disetujui:** pendekatan B — sederhana tetapi modern. Prioritas tahap pertama adalah keseimbangan kemudahan dan akurasi.

## 1. Prinsip UX terkunci

1. Jangan membuat pengguna memahami sistem; buat sistem memahami pengguna.
2. Pengguna memasukkan kejadian, sistem melakukan penghitungan.
3. Jika sistem sudah tahu, jangan tanya ulang.
4. Sisa stok adalah input; barang terjual adalah hasil engine.
5. Restock tidak membuka periode baru.
6. Histori harga/kemasan tidak boleh ditimpa.
7. Selisih stok tidak otomatis dianggap terjual.
8. Keuntungan, uang toko, dan setoran selalu terpisah.
9. Angka penting dapat dijelaskan.
10. AI tidak pernah mengubah data penting diam-diam.
11. Perubahan penting harus dapat dilacak/dibatalkan sesuai keadaan periode.
12. Tanpa kejadian, tanpa pekerjaan—tidak meminta pengguna mencatat nihil setiap hari tanpa tujuan.

## 2. Progressive disclosure empat level

- **Level 1 — Ringkas:** kondisi toko, untung, uang seharusnya, setoran, selisih, perlu diperiksa. Dashboard maksimal lima informasi utama/status.
- **Level 2 — Penjelasan:** tombol/tautan “Kenapa?” dengan alasan sederhana.
- **Level 3 — Detail:** “Lihat perhitungan” menampilkan jumlah stok, barang masuk, sisa, terjual, harga, modal, subtotal.
- **Level 4 — Teknis/audit:** histori harga/kemasan, source events, koreksi, versions, waktu server, engine version.

Pengguna tidak dipaksa masuk ke level lebih dalam.

## 3. Dashboard

Dashboard menjawab:
1. Bagaimana kondisi toko?
2. Berapa uang yang seharusnya ada?
3. Apakah setoran cocok?
4. Berapa untungnya?
5. Apa yang perlu saya periksa?

Satu kartu aksi utama (misalnya “Cek sisa barang” jika waktunya relevan). Detail lainnya dikelompokkan sebagai “N hal lain”. Jangan membuat dashboard penuh grafik atau dekorasi.

## 4. Input mode / Focus mode

Saat mencatat, fokus pada aktivitas saat ini. Untuk cek stok banyak produk, tampilkan daftar nama dan satu input jumlah per produk dengan label. Hindari statistik tak relevan, grafik, navigasi yang mengganggu, atau formulir panjang bila informasi dapat diwarisi dari konteks.

## 5. Live preview

Desktop: dua kolom yang sejajar dan seimbang.
- Kiri: barang & hasil — stok tersedia, sisa, terjual, penjualan, modal terjual, untung.
- Kanan: uang & setoran — uang seharusnya, pengeluaran, pendapatan lain, setoran, selisih, status.

Mobile: stack vertikal; header ringkas menjaga hubungan antara dampak barang dan dampak uang. Semua preview harus berlabel **Belum disimpan**.

Tidak ada tombol “Hitung”; hitung otomatis. Tombol aksi utama adalah “Simpan” atau “Konfirmasi dan simpan”.

## 6. Kapan bertanya

Tanya hanya saat sistem tidak bisa menyimpulkan sesuatu dengan aman. Satu pertanyaan pada satu waktu. Gunakan pilihan berbasis bahasa sehari-hari. Contoh:
- “Sumber uang belanja ini?” uang toko / uang pribadi.
- “Sisa lebih banyak daripada catatan. Apa yang terjadi?” belanja belum dicatat / salah hitung / belum tahu.
- “Harga jual berubah di tengah periode. Cek sisa sekarang?” cek sekarang / nanti.

Jangan meminta informasi yang sudah diketahui dari produk/riwayat.

## 7. Konfirmasi dan feedback

Sukses: singkat, menyatakan perubahan dan angka kunci, tautan Undo bila layak.
Contoh: “Tersimpan. Mie tersisa 25 bungkus dan 47 terjual. Penjualan Rp329.000; untung dari barang Rp141.000.”

Error: menyatakan keadaan nyata dan langkah aman. Jangan menampilkan stack trace, SQL, atau secret. Jangan menyebut sukses sebelum server mengonfirmasi.

## 8. Aksesibilitas

- Kontras teks normal minimal 4.5:1 sebagai target.
- Target sentuh minimal 44×44 CSS px untuk tindakan utama.
- Status tidak hanya warna: ikon + label + penjelasan bila dibutuhkan.
- Semua form punya label, pesan error terhubung, focus visible, keyboard navigation.
- Hormati `prefers-reduced-motion`.
- Format angka Indonesia: rupiah, pemisah ribuan lokal, tanggal dan waktu WIB; konsisten.

## 9. Kesuksesan UX

- Aktivitas rutin tidak memerlukan istilah akuntansi.
- Cek sisa sekitar 20 barang memiliki target usability di bawah satu menit—ini **target untuk diuji**, belum fakta terukur.
- Tidak ada langkah manual “Hitung”, pemilihan periode berulang, atau data yang harus ditulis dua kali bila sudah diketahui.
- Status ketidakpastian selalu terlihat ketika memengaruhi hasil.
