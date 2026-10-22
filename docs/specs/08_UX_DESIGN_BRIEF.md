# 08 — UX Design Brief

## 1. Sasaran pengalaman

Pemilik toko cukup menjawab “apa yang terjadi?”, bukan “bagaimana pencatatan akuntansinya?”. Sistem harus meminimalkan beban ingatan, pertanyaan, penghitungan manual, dan pengulangan data.

## 2. Jobs to be done

- Saat membeli: catat berapa kemasan dan berapa harga.
- Saat menghitung stok: masukkan sisa yang terlihat.
- Saat ada kejadian non-penjualan: jelaskan rusak/dipakai/selisih hanya bila diperlukan.
- Saat menerima uang tambahan atau membayar biaya: catat kejadian.
- Saat menyetor: masukkan angka aktual.
- Saat hasil membingungkan: tekan “Kenapa?” dan dapatkan penjelasan yang bisa ditelusuri.

## 3. Model mental pengguna

Pengguna berurusan dengan barang, uang, dan setoran. Sistem menyimpan tiga alur yang terkait tetapi tidak sama. UI tidak mengharuskan pengguna mengetahui istilah “ledger”, “cost layer”, “moving average”, atau “snapshot”. Detail itu hanya ada pada lapisan teknis/audit.

## 4. Prinsip interaksi

- Context first: gunakan produk, kemasan, tanggal/periode dan histori yang sudah diketahui.
- Ask only when required: tanya bila ada banyak kemungkinan dan pemilihan memengaruhi hasil.
- One question at a time.
- Preview first: tunjukkan dampak sebelum menyimpan.
- Confirmation should be proportional to risk.
- Safe retry: submit ID sama untuk hasil commit yang tidak pasti.
- Honest state: bedakan tersimpan, belum disimpan, dan belum pasti tersimpan.
- Undo is audit, not data deletion.
- Gradual disclosure: mulai dari hasil, lanjut ke alasan, rincian, lalu histori.

## 5. Tingkat kepastian

- **Pasti:** input pengguna atau hasil turunan komponen pasti.
- **Perlu Diperiksa:** kejanggalan, kisaran, estimasi, harga campuran, atau penyebab belum selesai.
- **Belum Diketahui:** nilai belum pernah diamati/dikonfirmasi atau modal/sumber uang belum diketahui.

Sistem tidak boleh menaikkan kepastian sendiri hanya karena angka bisa dihitung.

## 6. UX untuk ketidakcocokan

Sampaikan fakta, bukan tuduhan. Contoh:
- “Sisa lebih banyak dari stok yang tercatat. Apakah ada belanja yang belum dicatat?”
- “Setoran kurang Rp50.000. Ada komponen yang belum pasti; mari periksa belanja dan pengeluaran.”
- “3 barang belum dicek, jadi keuntungan minggu ini belum lengkap.”

Daftar kemungkinan penyebab ditampilkan sebagai hal yang perlu diperiksa, bukan fakta yang telah terbukti.

## 7. Respons terhadap status jaringan

- Load failure: layar kesalahan jelas tanpa angka usang.
- Disconnect after load: label cap waktu, draft disimpan di memori layar, aksi tulis dinonaktifkan.
- Unknown commit outcome: pesan jujur dan retry aman.
- Tidak ada offline queue atau simpan lokal diam-diam.

## 8. Metrik keberhasilan

Metrik target untuk diuji, bukan klaim aktual:

- Cek sisa sekitar 20 barang kurang dari satu menit untuk pengguna yang telah terbiasa.
- Pengguna dapat memahami perbedaan untung, uang toko, dan setoran setelah membaca label/penjelasan tanpa pelatihan akuntansi.
- 100% golden financial tests lulus.
- Nol duplikasi dari retry command yang sama.
- Nol data historis berubah diam-diam setelah periode ditutup.
- Pengguna mampu memulihkan setelah kesalahan dengan petunjuk yang terlihat.

## 9. Pertanyaan yang tidak boleh ditanyakan berulang

Jangan tanyakan isi kemasan yang masih sama; jangan meminta periode pada setiap entry bila tanggal/konteks menentukannya; jangan meminta pengguna memasukkan harga lama jika tersimpan; jangan meminta “terjual berapa” bila sisa dan ketersediaan cukup untuk menghitungnya.

## 10. UX gate

Sebelum data nyata, uji setidaknya: alur tanpa kesalahan, sisa lebih besar daripada tersedia, modal unknown, perubahan harga di tengah interval, periode tertutup, koneksi putus, dan tindakan undo/correction. Setiap layar harus memiliki status loading, empty, error, success, dan uncertain yang benar.
