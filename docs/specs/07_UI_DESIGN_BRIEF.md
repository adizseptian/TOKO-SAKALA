# 07 — UI Design Brief

## 1. Mandat visual

Merancang TOKO SAKALA sebagai webapp toko modern yang terasa profesional, tenang, tepercaya, dan tidak rumit. Visual harus memperkuat kejelasan informasi; dekorasi tidak boleh menyaingi data atau menutupi risiko finansial.

**Product owner selection:** pendekatan B — sederhana tetapi modern; prioritas tahap pertama: keseimbangan antara kemudahan dan akurasi.

## 2. Karakter

- Modern, rapi, sederhana, premium melalui presisi.
- Bukan aplikasi pembukuan tradisional yang padat.
- Bukan dashboard analitik yang penuh grafik.
- Tidak menggunakan violet sebagai warna dominan.
- Arah warna awal dari diskusi: deep teal + warm ivory dengan latar gelap/terang yang terkontrol; nilai token final ada di Design System.
- Jangan menggunakan dekorasi yang tak berkaitan dengan aktivitas toko.

## 3. Referensi dan interpretasi

Gunakan bahasa visual dashboard modern dengan kartu tertata, hierarki kuat, whitespace yang cukup, metrik terbatas, dan detail visual terkendali. Referensi hanya inspirasi; jangan menyalin mentah atau mengorbankan kebutuhan data nyata.

## 4. Hierarki visual

1. Status masalah atau kondisi yang membutuhkan tindakan.
2. Angka paling penting: uang seharusnya, status setoran, untung, stok/sisa.
3. Aksi utama.
4. Detail pendukung.
5. Penjelasan dan audit di tingkat lebih dalam.

Hindari menempatkan semua metrik dengan bobot visual yang sama.

## 5. Layout

- Desktop: sidebar sederhana, topbar untuk judul/konteks dan aksi global, area kerja dengan lebar cukup untuk tabel/forms serta preview dua sisi.
- Mobile: navigasi bawah maksimal lima item terlihat. Aksi `+ Tambah` dapat menjadi pusat input; Belanja/Laporan bisa diakses melalui shortcut atau “Lainnya”. Ini mengikuti rekomendasi master UX dan perlu disesuaikan saat prototype.
- Form dan daftar harus responsif pada lebar 360px.
- Tidak ada hero illustration besar di layar pencatatan uang.

## 6. Komposisi dashboard

Kartu utama menampilkan satu tindakan yang paling relevan. Kartu ringkasan menampilkan maksimum lima jawaban. Detail lain masuk section “N hal lain” atau layar spesifik. Grafik hanya ditambahkan bila membantu keputusan dan memiliki data pasti.

## 7. Warna dan tipografi

- Palet dasar deep teal, green-teal, warm ivory, neutral ink/slate.
- Red/amber/green hanya status semantik, tidak menjadi satu-satunya pembawa makna.
- Tipografi sans modern yang jelas; Geist boleh digunakan sebagai pilihan awal jika tersedia dan lisensinya sesuai.
- Angka rupiah memakai tabular numerals bila font mendukung; angka harus mudah dibandingkan.
- Kontras dan line height diprioritaskan daripada gaya tipis/dekoratif.

## 8. Motion dan detail

Motion ringan, singkat, dan hanya untuk state change yang bermakna. Tidak ada animasi berjalan terus, parallax, glow berlebihan, gradient yang mengganggu, atau glassmorphism ekstrem.

## 9. Larangan

- Jangan membuat ulang kalkulasi dalam komponen hanya untuk mempercantik preview.
- Jangan mengubah atau membulatkan angka demi tampilan.
- Jangan menyembunyikan “Belum Diketahui” atau “Perlu Diperiksa”.
- Jangan mengandalkan warna saja.
- Jangan mendesain form seperti spreadsheet yang penuh kolom di layar ponsel.
- Jangan menampilkan istilah HPP/COGS/debit/kredit/reconciliation di permukaan UI utama.

## 10. Deliverables visual

- Prototype Beranda, Barang, Belanja, Cek Sisa, Setoran, Laporan.
- Desktop dan mobile layout.
- Empty/loading/error/success/uncertain states.
- Token color/type/spacing/radius/shadow.
- Komponen preview/confirmation yang berbagi satu kontrak data dengan engine.
