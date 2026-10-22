# PROMPT AUDIT AWAL — GOOGLE AI STUDIO BUILD

Kamu melanjutkan repository TOKO SAKALA. **Jangan langsung mengubah banyak file. Audit dulu.**

## Tugas pertama

1. Baca `README.md`, `docs/GOOGLE_AI_STUDIO_ADAPTER.md`, `docs/DECISION_REGISTER.md`, `docs/BUILD_STATUS.md`, semua 16 dokumen di `docs/specs/`, dan sumber business logic di `docs/sources/`.
2. Audit struktur repository dan cek apakah proyek ini dapat dijalankan pada runtime Google AI Studio Build.
3. Jalankan `npm install`, `npm run test`, dan `npm run build` jika runtime mendukung. Laporkan hasil nyata; jangan mengklaim lulus kalau tidak dijalankan.
4. Jika ada error, perbaiki error build yang spesifik tanpa menulis ulang seluruh UI atau mengubah aturan bisnis.
5. Pertahankan tampilan Indonesia, dark-first Deep Teal + Warm Ivory, responsif, dan tanpa violet.

## Pengaturan Asisten AI

- Asisten AI default **OFF**.
- Sakelar di Pengaturan dapat ON/OFF.
- Pada versi ini ON hanya menampilkan panel UI. `AI_INTEGRATION_CONNECTED` tetap false dan tidak boleh ada panggilan model.
- Jangan menambah Gemini API, `GEMINI_API_KEY`, OCR, atau panggilan jaringan AI sampai diminta secara eksplisit.
- Jika kelak diminta mengintegrasikan AI, gunakan server-side secret yang dikelola AI Studio; jangan expose secret ke client atau `VITE_*`. Saat OFF, tidak boleh ada permintaan AI yang dikirim.
- AI hanya menyusun usulan; engine murni menghitung dan server memvalidasi. Jangan biarkan AI menulis transaksi langsung.

## Aturan produk yang terkunci

- Prinsip: “Jangan membuat pengguna memahami sistem. Buat sistem yang memahami pengguna.”
- UI B: sederhana tetapi modern; prioritas seimbang antara kemudahan dan akurasi.
- Pengguna memasukkan kejadian; sistem menghitung, memeriksa, dan menjelaskan.
- Keuntungan ≠ uang toko ≠ setoran.
- Stok sisa adalah input; barang terjual adalah hasil hanya jika matematis valid.
- Modal tak diketahui tidak boleh dikarang.
- Barang rusak, dipakai, dan penyebab penurunan tak diketahui tetap berbeda.
- Restock tidak membuat periode baru.
- Harga beli/jual dan isi kemasan memiliki riwayat, tidak ditimpa.
- Catatan penting append-only; edit adalah versi baru, pembatalan adalah void, koreksi setelah periode ditutup harus terlacak.
- Rupiah/kuantitas dalam integer aman. Hindari floating-point untuk uang.
- Tidak ada transaksi non-tunai, piutang, multi-user, atau hosting publik tanpa keputusan baru.
- Jangan mengaktifkan penyimpanan transaksi sampai backend atomik, idempotency, validasi server, dan pengujian keamanan tersedia.

## Arsitektur untuk versi starter

- React + Vite + TypeScript untuk memudahkan impor Build; pernyataan ini adalah adapter starter, bukan kunci arsitektur produksi akhir.
- Engine perhitungan murni di `src/engine/`, kontrak Zod di `src/domain/`.
- `src/ai-feature.ts` hanya mengelola preferensi UI OFF/ON. Jangan memasukkan panggilan model di sana.
- `localStorage` hanya boleh menyimpan preferensi AI OFF/ON, tidak untuk data keuangan.
- SQL di `supabase/migrations/` adalah draft yang belum boleh diterapkan pada data nyata.
- Tombol simpan sengaja nonaktif dan halaman menandai bahwa ini masih starter.

## Urutan pengembangan

1. Pastikan starter bisa dijalankan/build dan semua tes lulus.
2. Lengkapi engine dari golden cases dan properti integritas data.
3. Finalisasi konflik keputusan yang pending pada Decision Register.
4. Baru implementasikan server/database, migrasi, transaksi atomik/idempotent, RLS/role, snapshot dan koreksi.
5. Uji keamanan, kegagalan koneksi, dan backup/restore.
6. Aktifkan simpan transaksi setelah semua gerbang lulus.
7. Fitur AI/OCR tetap ditunda sampai ada instruksi eksplisit baru.

Untuk setiap perubahan, laporkan file yang berubah, alasan, tes yang benar-benar dijalankan, hasil, bagian yang belum selesai, dan risiko data.
