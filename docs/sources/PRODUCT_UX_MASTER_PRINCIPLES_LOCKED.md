# TOKO SAKALA — PRODUCT & UX MASTER PRINCIPLES

## 1. Identitas Aplikasi

**Nama aplikasi: TOKO SAKALA**

TOKO SAKALA adalah aplikasi cerdas untuk membantu pemilik dan operator toko mengelola barang, pembelian, stok, pengeluaran, pendapatan lain, setoran, hasil usaha, dan laporan tanpa harus memahami ilmu keuangan atau akuntansi yang rumit.

### Prinsip utama

> **Yang terlihat mudah. Yang sulit dikerjakan sistem.**

Prinsip yang lebih dalam:

> **Jangan membuat pengguna memahami sistem. Buat sistem yang memahami pengguna.**

---

# 2. Filosofi Produk

TOKO SAKALA tidak boleh terasa seperti aplikasi akuntansi yang rumit.

Pengguna tidak perlu memahami istilah seperti:

- HPP
- COGS
- Gross Profit
- Operating Expense
- Rekonsiliasi
- Inventory Adjustment
- Batch
- Debit/Kredit
- Stock Ledger

Istilah teknis boleh ada di mesin internal dan tampilan detail, tetapi antarmuka utama harus menggunakan bahasa sehari-hari.

### Bahasa utama pengguna

| Istilah rumit | Bahasa TOKO SAKALA |
|---|---|
| Revenue | Uang dari penjualan |
| COGS/HPP | Modal barang terjual |
| Gross Profit | Untung dari barang |
| Operating Expense | Pengeluaran toko |
| Reconciliation | Cek setoran |
| Variance | Selisih |
| Inventory Adjustment | Perbaiki jumlah barang |
| Net Profit | Untung |
| Inventory | Stok barang |

---

# 3. Hukum Desain Utama

TOKO SAKALA harus mengikuti hukum berikut:

1. **Pengguna hanya mencatat kejadian.**
2. **Sistem memahami kejadian.**
3. **Sistem menghitung secara otomatis.**
4. **Sistem mencari kesalahan dan kejanggalan.**
5. **Sistem menjelaskan hasil dengan bahasa sederhana.**
6. **Pengguna hanya mengambil keputusan yang memang membutuhkan manusia.**

Jika sistem dapat mengetahui sesuatu tanpa bertanya, **jangan bertanya kepada pengguna**.

---

# 4. Prinsip "Sederhana di Depan, Canggih di Belakang"

Kompleksitas tidak dihilangkan.

Kompleksitas dipindahkan ke belakang layar.

Contoh pengguna hanya mengatakan:

> "Mie sisa 8."

Sistem yang mengerjakan:

- mengetahui stok tersedia
- menghitung barang terjual
- memperhitungkan restock
- memperhitungkan barang rusak
- menghitung modal
- menghitung hasil penjualan
- menghitung untung
- memperbarui uang yang seharusnya ada
- memperbarui pemeriksaan setoran

Pengguna tidak perlu melakukan perhitungan tersebut.

---

# 5. Model Input Utama

TOKO SAKALA berpusat pada **kejadian sehari-hari**, bukan istilah akuntansi.

Pengguna terutama hanya perlu mencatat:

1. **Belanja**
2. **Cek Sisa**
3. **Barang Rusak**
4. **Pengeluaran**
5. **Pendapatan Lain**
6. **Setoran**

AI dapat menjadi jalur input tercepat untuk seluruh kejadian tersebut.

---

# 6. Navigasi Utama

Navigasi harus tetap sederhana.

Rekomendasi:

- **Beranda** — kondisi toko saat ini
- **Barang** — produk, stok, harga
- **Belanja** — pembelian dan restock
- **Setoran** — hasil dan pemeriksaan setoran
- **Laporan** — laporan berdasarkan periode
- **Asisten** — AI untuk memasukkan kejadian
- **Lainnya** — riwayat, pengaturan, dan fitur tambahan

Sediakan satu aksi utama:

## `+ Tambah`

Isi:

- Belanja
- Cek Sisa
- Barang Rusak
- Pengeluaran
- Pendapatan Lain
- Setoran

AI tetap menjadi jalur tercepat.

---

# 7. Perjalanan Pengguna Senin → Minggu

## Senin — Mulai Minggu

Pengguna tidak perlu membuat periode baru secara manual.

Sistem mengetahui konteks minggu berjalan.

Contoh:

> **Minggu 5–11 Oktober**
>
> Kondisi toko:
> - 3 barang hampir habis
> - 1 barang habis

Tidak perlu:

- membuat periode
- memilih tanggal
- mengisi saldo awal secara manual
- mengatur ulang stok
- membuat laporan baru

Sistem membawa data yang relevan dari periode sebelumnya.

---

## Saat Belanja

Pengguna dapat menulis:

> "Beli 2 dus mie isi 24 harga 96 ribu."

Sistem mengenali:

- produk: Mie
- jumlah: 2 dus
- isi: 24 pcs/dus
- total: 48 pcs
- total modal: Rp192.000
- modal per pcs: Rp4.000

Pengguna cukup melakukan:

**Simpan**

Sistem otomatis:

- menambah stok
- menyimpan histori pembelian
- menyimpan harga
- menyimpan isi kemasan
- memperbarui modal per unit
- memperbarui periode berjalan

---

## Selasa — Tidak Ada Kejadian

Tidak perlu mencatat apa pun jika memang tidak ada kejadian.

TOKO SAKALA tidak boleh menciptakan pekerjaan hanya demi melengkapi data.

Sistem tetap bekerja di belakang:

- memantau stok
- menyimpan histori
- membaca pola
- mendeteksi kejanggalan

---

## Saat Cek Sisa

Contoh:

> "Mie sisa 8, Saltchees 6, Malkis 7."

Pengguna hanya memasukkan **sisa**.

Rumus internal:

`Stok awal + barang masuk - stok akhir - penyesuaian = barang terjual`

Pengguna tidak perlu memasukkan jumlah terjual.

Prinsip:

> **Sisa adalah input. Terjual adalah hasil sistem.**

---

## Live Preview

Hasil berubah secara langsung tanpa tombol Hitung.

### KIRI — BARANG & HASIL

Menampilkan informasi penting seperti:

- barang
- tersedia
- sisa
- terjual
- uang dari penjualan
- untung

### KANAN — UANG & SETORAN

Menampilkan:

- uang yang seharusnya diterima
- pendapatan lain
- pengeluaran
- uang yang sudah disetor
- selisih
- status

Kedua sisi harus diperbarui secara live.

---

## Barang Rusak

Contoh:

> "Jumat 2 mie rusak."

Sistem memahami bahwa barang tersebut:

- bukan barang terjual
- mengurangi stok
- menghasilkan kerugian modal
- memengaruhi hasil
- tidak dianggap sebagai uang penjualan

Pengguna cukup mencatat kejadian.

---

## Restock di Tengah Minggu

Restock tidak membuat minggu baru.

Contoh:

- Senin beli mie
- Kamis mie habis
- Kamis beli mie lagi

Semua tetap berada dalam periode minggu yang sama.

Sistem menghitung seluruh pergerakan stok.

Pengguna hanya melihat:

> **Minggu ini**

Kompleksitas cost layer/batch dapat digunakan di belakang layar untuk menjaga ketepatan modal, tetapi istilah tersebut tidak perlu ditampilkan kepada pengguna.

---

## Pengeluaran Toko

Contoh:

> "Beli gas 20 ribu."

Sistem mengetahui bahwa gas merupakan pengeluaran toko dan bukan barang dagangan.

Tidak perlu meminta pengguna menentukan istilah akuntansi.

---

## Pendapatan Lain

Contoh:

> "Jasa seduh minggu ini 35 ribu."

Sistem mencatatnya sebagai pendapatan lain, terpisah dari penjualan barang.

---

## Sabtu — Pemeriksaan Sementara

Sistem menyiapkan ringkasan otomatis:

> **Hasil sementara minggu ini**
>
> Barang terjual: 286 pcs  
> Pengeluaran: Rp250.000  
> Pendapatan lain: Rp35.000  
> Uang seharusnya: Rp2.850.000
>
> 2 hal perlu diperiksa.

Jika tidak ada masalah:

> **Tidak ada yang perlu diperiksa.**

---

## Minggu — Setoran

Pengguna cukup mengatakan:

> "Setor 2 juta 850."

Sistem membandingkan:

- uang yang seharusnya
- setoran aktual

Jika sama:

> ## 🟢 COCOK
>
> Uang seharusnya: Rp2.850.000  
> Sudah disetor: Rp2.850.000

Jika berbeda:

> ## ⚠️ Setoran kurang Rp150.000

Sistem memberikan kemungkinan penyebab dengan bahasa sederhana:

- ada pengeluaran yang belum dicatat
- ada barang rusak yang belum dicatat
- ada uang yang belum disetor
- ada jumlah barang yang perlu dicek

---

## Tutup Setoran

Setelah pengguna yakin:

**Tutup Setoran**

Periode ditutup dan histori dijaga.

Jika ada kesalahan setelah periode ditutup, sistem membuat **perbaikan/penyesuaian yang terlacak**, bukan diam-diam mengubah sejarah.

---

# 8. Prinsip Stok

TOKO SAKALA menggunakan pendekatan:

> **Catat Sisa Barang**

Bukan:

> Catat setiap penjualan.

Sistem harus memahami:

- stok awal
- pembelian
- restock
- stok akhir
- barang rusak
- barang dipakai
- koreksi
- barang terjual

Sistem tidak boleh diam-diam menganggap selisih stok sebagai penjualan.

Jika stok fisik berbeda dengan perkiraan sistem, sistem meminta pengguna menentukan penyebab jika memang diperlukan.

Pilihan sederhana:

- Terjual
- Rusak
- Dipakai
- Salah hitung
- Tidak tahu

---

# 9. Packaging & Konversi Satuan

Sistem harus memahami:

- dus
- box
- pak
- toples
- pcs
- dan satuan lain

Contoh:

> 2 dus × Rp120.000  
> isi 40 pcs/dus

Sistem menghitung:

- 80 pcs
- total modal Rp240.000
- modal per pcs Rp3.000

Pengguna tidak perlu menghitung 80 pcs secara manual jika sistem sudah mengetahui isi kemasan.

---

# 10. Histori Harga dan Isi Kemasan

Harga pembelian lama tidak boleh ditimpa.

Sistem menyimpan:

- tanggal pembelian
- satuan kemasan
- isi per kemasan
- jumlah pembelian
- harga kemasan
- modal efektif per unit

Contoh:

- 1 Sep: 40 pcs/dus, Rp120.000 → Rp3.000/pcs
- 15 Sep: 40 pcs/dus, Rp124.000 → Rp3.100/pcs
- 1 Okt: 36 pcs/dus, Rp120.000 → Rp3.333/pcs

Jika isi kemasan berubah tetapi harga kemasan tetap:

> ⚠️ Modal per pcs naik karena isi kemasan berkurang.

Sistem menghitung perubahan tersebut secara otomatis.

---

# 11. Histori Harga Jual

Harga jual juga harus memiliki riwayat.

Jika harga berubah:

- harga lama tetap digunakan untuk catatan masa lalu
- harga baru berlaku mulai perubahan
- laporan lama tidak berubah hanya karena harga sekarang berubah

---

# 12. AI sebagai Asisten Operasional

AI bukan sekadar chatbot.

AI adalah **cara tercepat memasukkan kejadian ke sistem**.

Contoh:

> "Rabu 7 Oktober mie sisa 8, saltchees sisa 6."

AI mengenali:

- tanggal
- produk
- jumlah sisa
- jenis kejadian

Contoh:

> "Kamis beli 2 dus mie isi 24 harga 96 ribu, beli gas 20 ribu."

AI memisahkan:

- pembelian barang
- pengeluaran toko

Contoh:

> "Minggu setor 2 juta 850."

AI mengenali:

- setoran
- jumlah
- periode berjalan

---

# 13. Aturan Keamanan AI

### Risiko rendah

AI dapat menyiapkan perubahan dengan cepat.

### Perubahan keuangan biasa

Tampilkan preview singkat:

> Mie — sisa 8  
> Perubahan: stok diperbarui
>
> **[Simpan]**

### Perubahan berisiko tinggi

Harus meminta konfirmasi.

Contoh:

> "Hapus setoran minggu lalu."

Sistem tidak langsung menghapus.

### Undo

Setelah perubahan penting:

> ✓ Berhasil disimpan.
>
> **[Batalkan]**

---

# 14. AI Receipt / Bon Scanner

Sistem dapat membaca nota pembelian.

AI mencoba mengenali:

- nama barang
- jumlah
- kemasan
- isi kemasan
- harga
- total
- tanggal
- toko/supplier jika tersedia

AI juga dapat memahami kebiasaan penamaan toko.

Contoh:

> `MIE GRG 2 DS`

dapat dipetakan ke:

> Mie Goreng — 2 dus

Tetapi AI tidak boleh mengarang data.

Gunakan status:

- Yakin
- Perlu diperiksa
- Kurang yakin

Alur:

**AI → Periksa → Simpan**

---

# 15. Sistem Penjelas Angka

Setiap angka penting harus dapat dijelaskan.

Contoh:

> **Untung minggu ini Rp1.250.000**
>
> **Kenapa?**

Tampilkan:

- Uang dari penjualan: Rp3.000.000
- Pendapatan lain: Rp100.000
- Modal barang terjual: -Rp1.600.000
- Pengeluaran toko: -Rp250.000
- Untung: Rp1.250.000

Bahasa tetap sederhana.

---

# 16. Tingkat Keterlihatan Informasi

TOKO SAKALA menggunakan beberapa lapisan.

### Level 1 — Ringkas

Pengguna melihat:

- Cocok
- Perlu diperiksa
- Untung
- Setoran
- Stok

### Level 2 — Penjelasan

Klik:

> **Kenapa?**

### Level 3 — Detail

Klik:

> **Lihat perhitungan**

### Level 4 — Teknis

Untuk pengguna yang membutuhkan:

- histori perubahan
- perhitungan detail
- histori harga
- histori isi kemasan
- jejak perubahan data

Kompleksitas tersedia, tetapi tidak dipaksakan.

---

# 17. Smart Restock

Sistem dapat mempelajari:

- kecepatan barang terjual
- pola hari ramai
- pola hari sepi
- frekuensi restock
- stok minimum
- riwayat kehabisan

Contoh:

> 🟡 Mie kemungkinan habis dalam 2 hari.
>
> Sisa sekarang: 7 pcs  
> Biasanya terjual: 18–22 pcs/minggu

Tombol:

> **Siapkan Belanja**

Sistem menyiapkan rekomendasi, tetapi tidak melakukan pembelian tanpa tindakan pengguna.

---

# 18. Deteksi Perubahan dan Kejanggalan

Sistem harus aktif mencari hal-hal penting.

Contoh:

### Harga

> Harga beli mie naik.

### Isi kemasan

> Isi dus berubah dari 40 menjadi 36 pcs.

### Stok

> Stok fisik tidak sesuai perkiraan.

### Setoran

> Setoran kurang Rp75.000.

### Pengeluaran

> Pengeluaran minggu ini jauh lebih besar dari biasanya.

### Penjualan

> Mie terjual lebih cepat dari biasanya.

Sistem hanya memberi tahu hal yang relevan.

---

# 19. Dashboard

Dashboard bukan tempat menampilkan semua data.

Dashboard menjawab lima pertanyaan:

1. **Bagaimana kondisi toko?**
2. **Berapa uang yang seharusnya ada?**
3. **Apakah setoran cocok?**
4. **Berapa untungnya?**
5. **Apakah ada sesuatu yang perlu saya periksa?**

Contoh:

## Kondisi Toko

**Uang seharusnya**  
Rp2.850.000

**Sudah disetor**  
Rp2.850.000

**Status**  
🟢 Cocok

**Untung minggu ini**  
Rp1.250.000

**Stok**  
20 jenis barang

**Perlu diperiksa**  
Tidak ada

---

# 20. Focus Mode

Saat pengguna sedang mencatat, antarmuka harus fokus.

Contoh:

## Cek Sisa Barang

Mie Suksess  
`[ 8 ]`

Saltchees  
`[ 6 ]`

Malkis  
`[ 7 ]`

Chocolatos  
`[ 4 ]`

**[Simpan]**

Tidak perlu menampilkan:

- laporan
- grafik
- statistik lain
- navigasi yang mengganggu

Setelah selesai:

> ✓ 4 barang berhasil diperbarui.

---

# 21. Catat vs Lihat

TOKO SAKALA harus membedakan:

### Saat mencatat

> **Apa yang terjadi?**

### Saat melihat hasil

> **Bagaimana keadaan toko?**

Jangan mencampurkan keduanya secara berlebihan.

---

# 22. Fitur yang Tidak Boleh Membebani UI Utama

Istilah berikut tidak boleh menjadi bahasa utama pengguna:

- HPP
- COGS
- Gross Profit
- Net Profit
- Cash Flow
- Inventory Adjustment
- Batch
- Stock Ledger
- Debit
- Kredit
- Rekonsiliasi

Mesin internal boleh menggunakan struktur tersebut jika dibutuhkan.

---

# 23. Pembagian Tugas Pengguna vs Sistem

| Pekerjaan | Pengguna | Sistem |
|---|:---:|:---:|
| Catat belanja | ✓ | |
| Hitung isi kemasan | | ✓ |
| Hitung modal/unit | | ✓ |
| Simpan histori harga | | ✓ |
| Catat sisa | ✓ | |
| Hitung terjual | | ✓ |
| Deteksi stok tidak cocok | | ✓ |
| Catat barang rusak | ✓ | |
| Hitung kerugian | | ✓ |
| Catat pengeluaran | ✓ | |
| Klasifikasi pengeluaran | | ✓ |
| Catat pendapatan lain | ✓ | |
| Hitung hasil | | ✓ |
| Hitung uang seharusnya | | ✓ |
| Catat setoran | ✓ | |
| Cek setoran | | ✓ |
| Cari kemungkinan penyebab selisih | | ✓ |
| Prediksi barang habis | | ✓ |
| Deteksi perubahan harga | | ✓ |
| Deteksi perubahan isi kemasan | | ✓ |
| Jelaskan angka | | ✓ |
| Buat laporan | | ✓ |
| Simpan histori | | ✓ |
| Menjaga data lama | | ✓ |

---

# 24. Aturan Emas TOKO SAKALA

## Rule 01
**Jika sistem bisa mengetahui sesuatu tanpa bertanya, jangan tanya pengguna.**

## Rule 02
**Pengguna memasukkan kejadian, bukan perhitungan.**

## Rule 03
**Sisa adalah input. Terjual adalah hasil sistem.**

## Rule 04
**Restock tidak membuat periode baru.**

## Rule 05
**Harga lama tidak boleh ditimpa.**

## Rule 06
**Sistem tidak boleh menganggap selisih stok sebagai penjualan tanpa dasar.**

## Rule 07
**Uang dan untung harus selalu dibedakan.**

## Rule 08
**Angka penting harus bisa dijelaskan.**

## Rule 09
**AI tidak boleh mengubah data penting secara diam-diam.**

## Rule 10
**Perubahan penting harus bisa dibatalkan atau dilacak.**

## Rule 11
**Sistem harus aktif menemukan masalah, bukan hanya menunggu pengguna menemukannya.**

## Rule 12
**Jika tidak ada kejadian, pengguna tidak perlu melakukan apa pun.**

---

# 25. Definisi Sukses Produk

TOKO SAKALA berhasil jika pengguna yang tidak memahami akuntansi dapat melakukan seluruh pekerjaan utama hanya dengan bahasa sehari-hari.

Pengguna mengatakan:

> "Mie tinggal 8."

> "Beli 2 dus mie."

> "Dua mie rusak."

> "Beli gas 20 ribu."

> "Jasa seduh minggu ini 35 ribu."

> "Minggu setor 2 juta 850."

Dan sistem mampu mengubah semuanya menjadi:

**stok → penjualan → modal → untung → uang → setoran → laporan → insight**

tanpa pengguna harus memahami bagaimana mesin tersebut bekerja.

---

# 26. Kalimat Pengunci Produk

> ## **TOKO SAKALA**
>
> ### **Kamu cukup cerita apa yang terjadi di toko.**
> ### **TOKO SAKALA yang mengurus sisanya.**

---

## STATUS DOKUMEN

**Nama:** TOKO SAKALA  
**Jenis:** Product & UX Master Principles  
**Status:** LOCKED  
**Prinsip utama:** Simple User Experience / Complex System Intelligence  
**Workflow utama:** Senin → Minggu  
**Core philosophy:** Pengguna mencatat kejadian, sistem mengurus kerumitan.
