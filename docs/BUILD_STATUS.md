# Build Status — TOKO SAKALA AI Studio Starter v0.3.0

## Ada di paket
- [x] React + Vite + TypeScript entry point.
- [x] UI dark-first berbahasa Indonesia.
- [x] Layout desktop/mobile, navigasi starter.
- [x] Preview belanja via fungsi engine bersama.
- [x] Asisten AI OFF default; ON/OFF hanya preferensi UI, tidak ada API AI.
- [x] Zod event schemas, pure calculation engine, golden tests.
- [x] Draft migration SQL; bukan produksi.
- [x] 16 dokumen konsolidasi utama, 2 spesifikasi tambahan, decision register, prompt Build, GitHub Desktop quickstart.

## Belum selesai
- [ ] Menjalankan tes dan build pada lingkungan Google AI Studio nyata.
- [ ] Backend persistensi dan RPC transaksi atomik.
- [ ] Finalisasi keputusan pending (periode, koreksi, setoran, sumber uang dan uncertainty).
- [ ] RLS/role dan pengujian database pada provider sesungguhnya.
- [ ] Backup/restore produksi.
- [ ] Transaksi stok, uang dan setoran nyata.
- [ ] Integrasi AI/Gemini/OCR (sengaja ditunda).

## Cara membaca hasil
UI yang terlihat tidak berarti ada data yang tersimpan. Tes engine bukan validasi database. Keberhasilan build bukan bukti sistem aman untuk uang toko.

## Tambahan v0.3.0 — 2026-10-22
- Ditambahkan alur preview cek sisa sekaligus terinspirasi lembar pencatatan kertas dengan bahasa sederhana.
- Engine preview dan tes untuk subtotal Rp524.000 serta 318 unit pada 15 baris lengkap.
- Ditambahkan print stylesheet. PDF tersimpan via print browser saja, bukan ekspor laporan database.
- Penyimpanan transaksi tetap nonaktif; jangan masukkan data toko sebenarnya.
- Build penuh harus diverifikasi di lingkungan Node yang memasang semua dependensi; lihat hasil verifikasi aktual sebelum mengklaim lulus.
