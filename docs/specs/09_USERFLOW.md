# 09 — Userflow TOKO SAKALA

## 1. Navigasi produk

Nav utama yang direkomendasikan:
- Beranda
- Barang
- Belanja
- Setoran
- Laporan
- Asisten (khusus tahap lanjutan)
- Lainnya (Riwayat, Pengaturan, backup/ekspor)
- Aksi global `+ Tambah`

Di ponsel, bottom nav maksimal lima item yang tampak. Saran awal: Beranda, Barang, `+ Tambah`, Setoran, Lainnya. Tidak semua menu harus selalu terlihat.

## 2. Global action `+ Tambah`

- Belanja
- Cek sisa
- Barang rusak
- Barang dipakai
- Pengeluaran
- Pendapatan lain
- Setoran

Jenis kejadian yang di luar MVP tidak muncul.

## 3. First run

```text
Buka aplikasi lokal
  → cek DB/health
  → jika belum ada setup: nama toko
  → tambah barang
  → isi satuan/kemasan + harga yang diketahui
  → cek sisa awal
  → modal awal opsional
  → dashboard
```

Jika database tidak tersambung, user berhenti pada state “Tidak tersambung”, bukan layar kosong yang mirip toko baru.

## 4. Belanja flow

```text
+ Tambah / Belanja
 → pilih barang
 → isi jumlah kemasan
 → ambil isi kemasan dari histori atau konfirmasi jika berubah
 → isi harga
 → pilih sumber uang bila belum diketahui / ubah chip sumber
 → preview stok + modal + uang
 → Confirm & Save
 → validasi server & commit atomik
 → hasil + Undo bila masih dapat dibatalkan di periode terbuka
```

## 5. Cek sisa flow

```text
+ Tambah / Cek Sisa
 → daftar barang aktif dan jumlah tersedia
 → input sisa fisik per item
 → engine menghitung delta
 → valid? ─ yes → preview; no → satu klarifikasi yang diperlukan
 → preview BARANG/HASIL + UANG/SETORAN
 → user confirm
 → server recompute + database commit
 → confirmation / status perlu diperiksa
```

Kasus khusus:
- Sisa lebih besar daripada tersedia → tidak membuat penjualan negatif; minta klarifikasi.
- Penurunan normal → penjualan turunan.
- Penurunan outlier → soft prompt apabila histori cukup.
- “Tidak tahu” → catat sebagai selisih stok, bukan penjualan.
- Produk belum dicek → status belum diketahui, bukan nol atau terjual nol.

## 6. Barang rusak/dipakai

```text
Pilih Barang Rusak/Dipakai
 → pilih barang + jumlah
 → cek jumlah tersedia
 → preview perubahan stok + dampak untung (uang tidak berkurang)
 → confirm → commit → receipt + Undo jika periode terbuka
```

## 7. Pengeluaran/pendapatan lain

```text
Pilih jenis kejadian
 → isi deskripsi, nominal, tanggal
 → untuk pengeluaran: pilih sumber uang toko/pribadi jika diperlukan
 → preview hasil + uang
 → confirm → save → receipt
```

Pendapatan lain tidak dicampur ke penjualan barang.

## 8. Setoran flow

```text
Setoran
 → masukkan nominal aktual + tanggal
 → sistem resolve periode berdasarkan tanggal/konteks
 → jika ambigu, tanya periode sekali
 → preview uang seharusnya, setoran terakumulasi, selisih, certainty
 → konfirmasi → simpan
 → status COCOK / PERLU DIPERIKSA / BELUM COCOK / MENUNGGU SETORAN
```

## 9. Tutup periode flow

```text
Buka ringkasan periode
 → tampilkan setoran & data belum pasti
 → user catat setoran / menyatakan tidak ada setoran
 → jika ada selisih: pilih bawa atau catat sebagai selisih, bila aturan ini disahkan
 → pilih tutup lengkap/sebagian
 → server revalidasi sequence
 → snapshot + close atomik
 → laporan tertutup read-only
```

**Gating:** early close dan definisi segmen periode harus disetujui sebelum flow implementasi diaktifkan.

## 10. Correction flow

```text
Pilih kejadian/angka lama
 → lihat alasan/detail
 → periode terbuka? yes → buat versi/void terhubung
 → periode tertutup? → preview correction delta pada periode berjalan
 → konfirmasi eksplisit
 → append correction + new event
 → old snapshot stays frozen
```

## 11. Connection recovery flow

- Gagal membuka data: retry; jangan tampilkan dashboard contoh/dummy.
- Koneksi putus setelah data dimuat: label waktu data; disable save; draft tetap di layar.
- Hasil commit tidak diketahui: retry command ID yang sama; jangan membuat ID baru.
- Jika proyek cloud dijeda: instruksi runbook tanpa menganggap data terhapus.

## 12. Weekly journey

- **Senin:** dashboard memulai minggu dengan konteks yang telah ditentukan; tidak perlu membuat periode manual.
- **Hari tanpa kejadian:** tidak ada kewajiban mencatat nihil harian.
- **Saat belanja:** catat setiap restock dalam periode berjalan.
- **Saat cek sisa:** stok fisik jadi input; hasil lainnya dihitung.
- **Sabtu:** ringkasan sementara (jika berguna) dan barang yang perlu dicek.
- **Minggu:** setoran dan peninjauan periode.
- **Setelah tutup:** laporan beku dan koreksi kemudian tercatat pada periode berjalan.

Detail early close harus menyatukan minggu kalender dan segmen aktual sebelum status final.
