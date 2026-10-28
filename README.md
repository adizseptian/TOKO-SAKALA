# TOKO SAKALA — Google AI Studio Starter v0.5.1 (TOKO MODE mobile QA pass)

**Arah visual aktif:** TOKO MODE — bright value-retail, mobile-first, orange/lime/cobalt/near-black/paper. Ini menggantikan identitas visual Field Ledger untuk lapisan presentasi. Logika domain dan perhitungan tetap dipertahankan kecuali perbaikan QA yang disebutkan dalam changelog.

> **G3–G5:** blueprint layar, sistem token terang/gelap, shell navigasi lima area, hub tugas, pratinjau biaya, dan baris cek sisa mobile yang sadar satuan diterapkan. Prototipe HTML mandiri disertakan. Build React dan pengujian browser penuh tetap wajib sebelum merge. Lihat `docs/gates/` dan `docs/GATE_STATUS_G3_G5.md`.

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

`localStorage` hanya digunakan untuk menyimpan preferensi OFF/ON Asisten dan tema terang/gelap, bukan stok, transaksi, harga, saldo, atau data keuangan.

## Yang tersedia

- Alur cek sisa barang sekaligus dalam satu tabel, subtotal otomatis, ringkasan sederhana, dan input pengeluaran terpisah (semua masih draf, belum disimpan).
- Tombol “Lihat contoh tabel” memasukkan contoh eksplisit untuk menguji lembar: 15 baris lengkap dan nilai sisa menurut harga jual Rp524.000; baris ChocoPie yang belum lengkap tidak ikut subtotal. Jumlah fisik tidak dijumlahkan lintas satuan karena pcs, kg, dan porsi tidak sebanding. Contoh bukan master stok.
- Tombol “Cetak / Simpan PDF” membuka dialog print browser dan memakai stylesheet cetak A4. Ini tidak sama dengan ekspor PDF dari laporan transaksi tersimpan.

- UI berbahasa Indonesia dengan lima area utama: Beranda, Catat, Stok, Setoran, Lainnya; halaman sekunder tetap bisa diakses melalui hub.
- TOKO MODE memakai tema terang paper + orange/lime/cobalt/near-black dan tema gelap near-black + orange/lime. Keduanya belum disertifikasi lewat pengujian browser/perangkat lengkap.
- Pratinjau belanja interaktif yang menggunakan fungsi perhitungan bersama.
- Kontrak event Zod serta engine perhitungan awal dan golden tests.
- Draft migrasi PostgreSQL di `supabase/migrations/` untuk ditinjau; **jangan jalankan pada database data nyata**.
- 16 dokumen konsolidasi utama ditambah spesifikasi alur cek sisa, spesifikasi ekspor, dan decision register.
- `metadata.json` tanpa izin perangkat tambahan.

## Yang belum tersedia

- Backend penyimpanan transaksi dan RPC atomik.
- Koneksi database / Supabase yang siap dipakai.
- Auth atau pengamanan akses untuk pemakaian publik.
- Penutupan periode dan snapshot final yang siap produksi.
- Backup/restore cloud yang sudah diuji.
- Integrasi AI/Gemini dan OCR.
- Penyimpanan data bisnis yang nyata. Tombol simpan sengaja nonaktif; form hanya pratinjau.

## Prototipe yang dapat dibuka langsung

Buka `TOKO_SAKALA_FIELD_LEDGER_PROTOTYPE.html` di browser modern untuk meninjau 13 state layar dan navigasi responsif tanpa memasang paket npm. Form contoh hanya menghitung di layar; tombol simpan tetap nonaktif. Ini adalah prototipe review terpisah, bukan build React produksi dan bukan penyimpanan transaksi.

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

## Alur cek sisa barang

Baca `docs/specs/17_ALUR_CEK_SISA_SEKALIGUS.md`. Spesifikasi laporan dan ekspor tersedia di `docs/specs/18_REPORTING_EXPORT_SPEC.md`. Prompt perbaikan visual tersimpan di `docs/UI_UX_REFINEMENT_PROMPT_v1.1.md`. Pengguna dapat memasukkan banyak baris sekaligus; total pada harga jual adalah nilai ritel indikatif, bukan modal sisa atau keuntungan. Form hanya bekerja di memori halaman, tidak disimpan ke `localStorage` maupun database, dan draf hilang jika halaman ditinggalkan atau dimuat ulang. Tombol simpan transaksi tetap nonaktif.

## Sumber keputusan

- `docs/specs/` — 16 dokumen konsolidasi.
- `docs/DECISION_REGISTER.md` — keputusan terkunci/pending.
- `docs/GOOGLE_AI_STUDIO_ADAPTER.md` — batas adaptasi framework dan toggle AI.
- `docs/BUILD_STATUS.md` — status starter versi ini.
- `docs/VERIFICATION_v0.3.0.md` — pemeriksaan yang benar-benar dilakukan dan batasannya.
- `TOKO_SAKALA_WORKFLOW_REFINE_PROMPT_v1.0.md` — prompt untuk menerapkan alur ini ke repository TOKO SAKALA yang sedang ada; periksa diff dan jangan menimpa pekerjaan lain.

Jangan menganggap spesifikasi bertanda pending atau test yang belum dijalankan sebagai keputusan final atau bukti lulus.


## TOKO MODE v0.5.1 visual implementation

This source package applies the approved TOKO MODE visual layer to the existing React/Vite starter. It changes the visual system (orange, lime, cobalt, near-black and paper), mobile navigation, controls, panels, form fields, stock tables and responsive spacing. Existing domain/preview calculations remain unchanged. It is still a preview-only starter: no real transaction persistence, backend integration, production authentication or real export is enabled.


## QA status v0.5.1

See `docs/redesign/IMPLEMENTATION_STATUS_v0.5.1.md`. Syntax diagnostics and secret-pattern scan were possible; full type check, unit tests, Vite build and browser/device sweep remain blocked by unavailable dependencies/browser policy.
