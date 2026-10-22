# TOKO SAKALA — Google AI Studio Starter v0.2.0

**Arah:** antarmuka sederhana tetapi modern, akurasi di atas dekorasi, dan aplikasi tetap berguna tanpa AI.

> **Status:** starter UI + fondasi engine perhitungan. Belum siap dipakai untuk mencatat uang atau stok toko sebenarnya.

## Kenapa versi ini dibuat

Versi ini disusun agar mudah diimpor sebagai proyek web React ke Google AI Studio Build dari GitHub. Dokumentasi Google menjelaskan bahwa aplikasi web AI Studio menggunakan frontend React secara default dan runtime Node.js untuk perluasan full-stack; proyek yang sudah ada dapat diimpor lewat **Build → Add files (+) → Import from GitHub**.

Untuk membuat starter lebih mudah dipindahkan, UI versi ini menggunakan React + Vite + TypeScript. Dokumen bisnis di `docs/specs/` tetap menjadi acuan aturan produk. Perubahan dari Next.js pada starter terdahulu adalah **adapter implementasi untuk alur AI Studio**, bukan keputusan bahwa arsitektur produksi akhir sudah final. Backend aman dan kontrak database harus diselaraskan sebelum transaksi nyata diaktifkan.

Referensi resmi: https://ai.google.dev/gemini-api/docs/aistudio-build-mode

## Asisten AI: OFF / ON

- Default aplikasi adalah **OFF**.
- Sakelar berada di **Pengaturan → Asisten AI** dan pilihan UI tersimpan di browser.
- Saat ON, hanya panel UI asisten yang ditampilkan.
- **Integrasi model tidak disertakan dan tidak ada panggilan AI**, sekalipun sakelar ON. Tidak memerlukan `GEMINI_API_KEY`.
- Asisten baru boleh dihubungkan setelah ada keputusan eksplisit, implementasi server-side, pembatasan data yang dikirim, validasi, preview, persetujuan pengguna, dan tes.
- Pengaturan ON/OFF bukan pengganti tombol konfirmasi. AI kelak hanya boleh mengusulkan; engine bisnis tetap sumber kebenaran.

`localStorage` hanya digunakan untuk menyimpan preferensi OFF/ON, bukan stok, transaksi, harga, saldo, atau data keuangan.

## Yang tersedia

- UI responsif berbahasa Indonesia: Beranda, Barang, Belanja, Cek Sisa, Uang & Setoran, Laporan, Asisten, Riwayat, Pengaturan.
- Tema dark-first dengan Deep Teal + Warm Ivory; tanpa violet.
- Pratinjau belanja interaktif yang menggunakan fungsi perhitungan bersama.
- Kontrak event Zod serta engine perhitungan awal dan golden tests.
- Draft migrasi PostgreSQL di `supabase/migrations/` untuk ditinjau; **jangan jalankan pada database data nyata**.
- Semua 16 dokumen spesifikasi dan decision register.
- `metadata.json` tanpa izin perangkat tambahan.

## Yang belum tersedia

- Backend penyimpanan transaksi dan RPC atomik.
- Koneksi database / Supabase yang siap dipakai.
- Auth atau pengamanan akses untuk pemakaian publik.
- Penutupan periode dan snapshot final yang siap produksi.
- Backup/restore cloud yang sudah diuji.
- Integrasi AI/Gemini dan OCR.
- Penyimpanan data bisnis yang nyata. Tombol simpan sengaja nonaktif; form hanya pratinjau.

## Cara menjalankan lokal

Node.js **22.12+** disarankan untuk Vite versi saat ini. `npm run dev` mendengarkan pada semua antarmuka agar preview container dapat diakses; pakai `npm run dev:local` untuk mengikat hanya ke `127.0.0.1` di komputer sendiri.

```bash
npm install
npm run dev
```

Buka alamat lokal yang dicetak oleh Vite. Untuk memeriksa starter:

```bash
npm run test
npm run build
npm run scan:secrets
```

Aplikasi ini menggunakan Vite untuk pengembangan UI. `npm run dev` hanya membuka UI; belum ada backend transaksi.

## GitHub Desktop — pakai repository `toko-sakala` yang sudah ada

**Jangan klik “Publish repository” untuk membuat repository bernama sama lagi.**

1. Unduh ZIP starter ini dan ekstrak ke folder sementara.
2. Buka GitHub Desktop, pilih repository `toko-sakala` yang sudah ada, lalu **Repository → Show in Explorer**.
3. Pastikan folder yang dibuka benar-benar merupakan hasil **clone repository** (di dalamnya ada folder tersembunyi `.git`).
4. Buat cadangan salinan folder jika ingin menyimpan versi lama.
5. Tutup aplikasi yang sedang mengedit folder tersebut. Ganti file proyek lama dengan seluruh isi folder ZIP versi ini. **Jangan menghapus atau menimpa folder `.git`** di root hasil clone. ZIP ini tidak berisi `.git`.
6. Pastikan `package.json`, `index.html`, `src/`, `docs/`, dan `metadata.json` berada langsung di root repository, bukan di subfolder tambahan.
7. Kembali ke GitHub Desktop. Perubahan akan terlihat di tab **Changes**. Periksa daftar file, terutama penghapusan file Next.js lama yang memang sudah tidak dipakai.
8. Commit dengan summary `chore: adapt TOKO SAKALA starter for Google AI Studio`.
9. Klik **Push origin** untuk mengirim perubahan ke repository yang sudah ada.

Jangan menghapus `.git`, jangan membuat `.env.local`, dan jangan memasukkan kredensial database atau data toko nyata.

## Impor ke Google AI Studio

1. Push commit dari GitHub Desktop.
2. Buka Google AI Studio → **Build**.
3. Pada kotak prompt pilih **Add files (+) → Import from GitHub**.
4. Pilih repository `toko-sakala` dan branch yang berisi starter ini.
5. Setelah proyek diimpor, buka `AI_STUDIO_START_PROMPT.md` lalu salin prompt audit ke chat Build.
6. Minta agent memeriksa instalasi, `npm run test`, dan `npm run build` terlebih dahulu. Jangan minta semua fitur selesai sekaligus.
7. Jika repository sudah ditautkan lewat Settings → GitHub, sinkronkan perubahan secara teratur. Hindari mengubah file yang sama di AI Studio dan GitHub Desktop sebelum menyinkronkan.

UI ini disusun agar ringan dan mudah diimpor, tetapi **impor belum diverifikasi langsung pada akun AI Studio pengguna**. Jika AI Studio meminta penyesuaian scaffold, minta ia mempertahankan file domain/engine, aturan bisnis, preferensi AI OFF/ON, serta dokumen keputusan.

## Aturan data dan keamanan

- Jangan memasukkan data toko sebenarnya sebelum backend transaksi, validasi server, append-only history, idempotency, RLS/role, security checks, backup dan restore diuji.
- Jangan menaruh API key dalam `src/`, `VITE_*`, repo, prompt, atau browser.
- Jangan memberi label “AI aktif” hanya karena sakelar ON; pada starter ini model belum tersambung.
- Preview bukan transaksi yang tersimpan.
- Semua angka UI yang berkaitan dengan transaksi harus dihitung menggunakan engine bersama, bukan rumus duplikat.
- Ketika AI/OCR ditambahkan kelak, ia hanya memberi usulan yang dikonfirmasi pengguna.

## Sumber keputusan

- `docs/specs/` — 16 dokumen konsolidasi.
- `docs/DECISION_REGISTER.md` — keputusan terkunci/pending.
- `docs/GOOGLE_AI_STUDIO_ADAPTER.md` — batas adaptasi framework dan toggle AI.
- `docs/BUILD_STATUS.md` — status starter versi ini.

Jangan menganggap spesifikasi bertanda pending atau test yang belum dijalankan sebagai keputusan final atau bukti lulus.
