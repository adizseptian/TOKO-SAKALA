# Source Verification & Mobile QA — TOKO MODE v0.5.1

Tanggal pemeriksaan: 28 Oktober 2026  
Status keseluruhan: **NOT READY FOR PRODUCTION**

## Ringkasan

Source v0.5.1 diperiksa secara statis dan test engine yang sudah ada dijalankan melalui compatibility harness lokal karena dependensi proyek tidak tersedia. Ada bukti baik untuk sintaks, CSS parse, scan secret dan 14 assertion dari test-source yang ada; tetapi build standar dan QA browser/mobile belum bisa dinyatakan lulus.

## Matriks pemeriksaan

| Area | Status | Bukti / catatan |
|---|---|---|
| TypeScript/TSX syntax transpile | PASS | 13 file diperiksa menggunakan TypeScript `transpileModule`, 0 diagnostic error. Ini bukan full strict type-check. |
| CSS parsing | PASS | PostCSS berhasil parse `src/styles.css` dengan 753 top-level nodes. Parser berhasil bukan jaminan tampilan sudah benar. |
| Metadata | PASS | `package.json` valid JSON, versi `0.5.1`; `index.html` memiliki viewport mobile, `lang="id"`, `noindex,nofollow`, dan `theme-color #fffdf6`. |
| Secret-pattern scan | PASS | `npm run scan:secrets`: “Tidak ditemukan pola secret yang dikenal.” Scanner ini bukan jaminan bahwa semua jenis secret dapat ditemukan. |
| Existing test-source via compatibility harness | PASS WITH LIMITATION | 14 assertion lulus dari 4 file test: AI preference (3), purchase preview (2), stock-check preview (4), golden calculation (5). Harness menggunakan transpile TypeScript + assertion shim, bukan perintah Vitest resmi. |
| `npm install --no-audit --no-fund` | BLOCKED | Instalasi tidak selesai dalam batas waktu lingkungan (120 detik); `node_modules` tidak tersedia. |
| `npm test` / Vitest native | BLOCKED | Binary `vitest` tidak tersedia karena dependensi tidak terpasang. Hasil compatibility harness tidak boleh diklaim sebagai hasil Vitest. |
| `npm run build` | BLOCKED | Tidak bisa menyelesaikan build TypeScript/Vite karena paket dan tipe lokal (`node`, `vite/client`, `vitest/globals`) tidak tersedia. |
| Browser screenshot / viewport sweep | BLOCKED | Playwright/browser tidak dapat membuka halaman lokal dengan `ERR_BLOCKED_BY_ADMINISTRATOR`. Tidak ada hasil screenshot atau ukuran `scrollWidth` nyata yang diklaim. |
| Android Chrome langsung | NOT RUN | Belum diverifikasi pada perangkat fisik atau browser perangkat pengguna. |
| Keyboard / screen reader / zoom / full WCAG audit | NOT RUN | Masih harus dilakukan dalam QA browser setelah dependencies terpasang. |
| Auth, database RLS, atomic transaction save, history, correction, backup/restore | NOT IMPLEMENTED / NOT TESTED | Source ini adalah starter pratinjau; penyimpanan transaksi nyata sengaja belum aktif. |

## Perbaikan source yang sudah diterapkan dalam v0.5.1

1. Kuantitas sisa stok dikembalikan per unit melalui `remainingByUnit`; tidak ada satu jumlah fisik yang mencampur `pcs`, `porsi`, atau unit berbeda.
2. Nilai per baris dan total stok memakai validasi integer aman. Jika perhitungan stok tidak aman, UI menunjukkan kebutuhan memeriksa angka, bukan menyamarkan error sebagai nilai finansial Rp0.
3. Total biaya draft dijaga agar tidak melampaui rentang integer aman dan pratinjau ditahan bila angka tidak aman.
4. Selector hero menggunakan `.home-status-panel` aktual pada komponen, bukan selector lama yang tidak cocok.
5. Branding sidebar dan warna browser mengikuti TOKO MODE (`#fffdf6` paper theme color), bukan identitas Field Ledger.
6. Tombol input, penghapus baris, kontrol ikon serta chip mobile mendapat aturan ukuran sentuh minimum 44px pada breakpoint mobile; hasil render aktual tetap perlu diverifikasi di browser.
7. `prefers-reduced-motion` memiliki aturan CSS untuk menghilangkan transisi yang tidak perlu.
8. Asisten AI masih default OFF dan tidak terhubung ke model. Tombol simpan transaksi belum mengaktifkan persistensi finansial.

## Pemeriksaan unit visual terbatas

Rasio kontras dihitung untuk beberapa kombinasi token inti (bukan audit semua pasangan teks/komponen):

| Foreground / background | Rasio | Hasil terbatas |
|---|---:|---|
| Ink `#20211F` / Orange `#FF5A1F` | 5.19:1 | Lulus batas teks normal WCAG AA berdasarkan pasangan warna ini |
| Ink `#20211F` / Lime `#D7FA4A` | 13.60:1 | Lulus batas teks normal WCAG AA berdasarkan pasangan warna ini |
| White `#FFFFFF` / Cobalt `#2958E8` | 5.74:1 | Lulus batas teks normal WCAG AA berdasarkan pasangan warna ini |
| Ink `#20211F` / Paper `#FFFDF6` | 15.89:1 | Lulus batas teks normal WCAG AA berdasarkan pasangan warna ini |
| White `#FFFFFF` / Orange `#FF5A1F` | 3.12:1 | **Jangan gunakan untuk teks normal**; pakai tinta gelap di atas oranye |

Perhitungan token tidak memvalidasi semua warna opacity, disabled controls, focus rings, status badges, dark theme, atau teks di atas gambar. Audit menyeluruh masih wajib.

## Mobile QA harus dijalankan di Google AI Studio

Verifikasi pada lebar CSS 320, 360, 390, 430, 768, 1024, dan 1440px; screenshot 320, 390, 768, dan 1440px. Periksa:

- Tidak ada horizontal overflow (`scrollWidth <= clientWidth`), clipping, overlap atau bottom-nav menutup konten.
- Safe-area Android, scroll pada sheet/modal, keyboard virtual, fokus keyboard, dan zoom 200%.
- Target sentuh 44×44px, label/teks dapat dibaca, urutan tab masuk akal, dan status tidak hanya diwakili warna.
- Nama barang panjang, angka Rupiah besar, unit berbeda, jumlah 0, kolom kosong, data belum diketahui, dan error validasi.
- Tema terang/gelap serta `prefers-reduced-motion`.
- Semua CTA dan kontrol: navigasi, tambah/kurangi jumlah, filter, form review, pilihan tema, dan tombol simpan (tetap tidak boleh menyimpan transaksi pada fase ini).
- Jalankan `npm run scan:secrets`, `npm test`, dan `npm run build` dalam environment Google AI Studio; tulis output asli dan screenshot ke `docs/redesign/AI_STUDIO_QA_REPORT.md`.

## Gate rilis

**Belum boleh dipakai untuk mencatat transaksi toko nyata dan belum boleh deploy produksi.** Lanjutkan hanya setelah native test dan build berhasil, QA browser/perangkat lulus, serta arsitektur backend keuangan ditinjau terpisah. Jangan menganggap preview UI sebagai sumber catatan resmi.
