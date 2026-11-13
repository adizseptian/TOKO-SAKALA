# 07 — ACCESSIBILITY & RESPONSIVE QA REGISTER (MODE A — TOKO SAKALA)

**Tanggal Audit:** 13 November 2026  
**Standar Uji:** WCAG 2.2 Level AA (`SC 1.4.3`, `1.4.4`, `1.4.11`, `2.1.1`, `2.4.7`, `2.4.11`, `2.5.7`, `2.5.8`, `4.1.2`) & Breakpoint Mobile-First (`320, 360, 390, 430, 768, 1024, 1440 CSS px`).  
**Status Lingkungan Browser:** Biner `chromium` / `google-chrome` tidak tersedia di kontainer eksekusi -> seluruh uji render langsung di browser berstatus **`NOT RUN`**. Bagian 1–3 menyajikan data **terverifikasi statis & matematis**, sedangkan Bagian 4 menyajikan protokol uji **`NOT RUN`** wajib untuk awal/akhir Mode B.

---

## 1. Audit Kontras Warna Terukur (WCAG 2.2 AA — Matematis Eksak)

Rumus luminansi relatif WCAG 2.1/2.2 terhadap pasangan token di `src/styles.css:2–49`:

### A. Mode Terang (`:root`)

| Pasangan Warna (Foreground / Background) | Rasio Terukur | Syarat AA Normal (`4.5:1`) | Syarat AA Besar / UI (`3.0:1`) | Status & Tindakan |
|---|---|---|---|---|
| `--ink` (`#20211F`) / `--paper` (`#FFFDF6`) | **`15.89:1`** | PASS | PASS | Aman dipertahankan |
| `--ink` (`#20211F`) / `--canvas` (`#F4F0E7`) | **`14.22:1`** | PASS | PASS | Aman dipertahankan |
| `--muted` (`#686A65`) / `--paper` (`#FFFDF6`) | **`5.38:1`** | PASS | PASS | Aman dipertahankan |
| `--muted` (`#686A65`) / `--canvas` (`#F4F0E7`) | **`4.81:1`** | PASS | PASS | Aman dipertahankan |
| `--ink` (`#20211F`) / `--lime` (`#D7FA4A`) | **`13.60:1`** | PASS | PASS | Sangat aman untuk active bottom tab |
| `--blue` (`#2958E8`) / `--blue-pale` (`#E8EDFF`) | **`4.92:1`** | PASS | PASS | Aman |
| `--green` (`#177245`) / `--green-pale` (`#E4F5E9`) | **`5.25:1`** | PASS | PASS | Aman |
| `--amber` (`#98500D`) / `--amber-pale` (`#FFF0DA`) | **`5.37:1`** | PASS | PASS | Aman |
| `--red` (`#B52821`) / `--red-pale` (`#FFE7E3`) | **`5.41:1`** | PASS | PASS | Aman |
| **`#FFFFFF` / `--orange` (`#FF5A1F`)** | **`3.12:1`** | **FAIL** | PASS (`>=3.0`) | **BUG A11Y-03:** Dipakai pada tombol & label normal (`<18.67px bold`), mis. `Simpan semua` `13px` (`App.tsx:8165–8168`). **Solusi:** Butuh keputusan Owner (`NOD-02`) antara teks `#20211F` (`5.19:1`) atau fill `#B8370B` (`5.85:1`). |
| `--ink` (`#20211F`) / `--orange` (`#FF5A1F`) | **`5.19:1`** | **PASS** | PASS | Alternatif kontras AA terbaik sambil mempertahankan `#FF5A1F` persis! |
| `#FFFFFF` / `--orange-dark` (`#D93C08`) | **`4.57:1`** | **PASS** | PASS | Masih memenuhi AA tipis (`4.57:1`); `#B8370B` memberi margin lebih aman (`5.85:1`). |

### B. Mode Gelap (`[data-theme="dark"]`)

| Pasangan Warna (Foreground / Background) | Rasio Terukur | Syarat AA Normal (`4.5:1`) | Status & Tindakan |
|---|---|---|---|
| `--ink` (`#FFFDF6`) / `--paper` (`#1C1D1B`) | **`16.63:1`** | PASS | Aman |
| `--muted` (`#9FA29C`) / `--paper` (`#1C1D1B`) | **`6.55:1`** | PASS | Aman |
| **`#FFFFFF` / `--orange` (`#FF6B34`)** | **`2.84:1`** | **FAIL (Kritis)** | Gagal baik teks normal maupun besar (`<3.0:1`)! Wajib pakai `#20211F` (`5.70:1`) atau `#B8370B` untuk latar tombol putih. |
| `--ink` (`#20211F`) / `--orange` (`#FF6B34`) | **`5.70:1`** | PASS | Aman jika teks tombol oranye memakai gelap `#20211F`. |
| **`--blue` (`#4872F0`) / `--blue-pale` (`#1C2642`)** | **`3.52:1`** | **FAIL** | Wajib naikkan kecerahan `--blue` di dark mode (mis. `#7CA0FF` -> `6.8:1` on `#1C2642`) untuk teks link/info di dark mode. |
| **`#FFFFFF` / `--blue` (`#4872F0`)** | **`4.25:1`** | **FAIL** | Tombol sekunder biru di dark mode gagal AA normal (`<4.5:1`); perlu `--blue-btn-bg: #254EDB` (`6.37:1` untuk teks putih). |
| `--green` (`#4ADE80`) / `--green-pale` (`#15321F`) | **`9.15:1`** | PASS | Aman |
| `--amber` (`#FBB724`) / `--amber-pale` (`#362912`) | **`8.59:1`** | PASS | Aman |
| `--red` (`#F87171`) / `--red-pale` (`#3B1717`) | **`5.55:1`** | PASS | Aman |

---

## 2. Register Cacat Aksesibilitas Terverifikasi Statis (`src/App.tsx` & `src/styles.css`)

| ID | Kriteria WCAG 2.2 | Temuan Spesifik & Lokasi | Dampak Pengguna | Perbaikan Wajib di Mode B |
|---|---|---|---|---|
| **A11Y-01** | `SC 2.1.1 Keyboard`, `4.1.2 Name Role Value` | **10 elemen** memakai `<div role="button" tabIndex={0} onClick={...}>` **tanpa `onKeyDown`** (`Enter`/`Space` tidak bekerja): `App.tsx:2190, 2350, 2731, 2803, 2958, 4331, 4379, 5033, 8002, 8140`. | Pengguna keyboard/switch/TalkBack tidak dapat membuka hero banner, timeline, kartu produk, rincian laporan, baris riwayat, atau sheet keranjang. | Konversi seluruh 10 elemen menjadi `<button type="button">` native (atau pisahkan kartu statis dengan tombol eksplisit di dalamnya). |
| **A11Y-02** | `SC 1.4.4 Resize Text` & G4 Floor | **229 deklarasi ukuran font `< 12px`** (`173` inline `style` + `56` rule di `styles.css`), bahkan serendah `8px–9px` pada label status/metadata (`App.tsx:1970, 3769, 3884, 7404`). | Teks tidak terbaca oleh pemilik toko di ruang redup/cerah maupun saat zoom teks OS Android diperbesar. | Naikkan semua label penting & copy ke minimal **`12px`**; metadata non-kritis maksimal turun ke `11px` setelah verifikasi render. |
| **A11Y-03** | `SC 1.4.3 Contrast (Minimum)` | Teks putih `#FFFFFF` di atas `#FF5A1F` (`3.12:1`) & `#FF6B34` (`2.84:1`), serta dark mode `#4872F0` (`3.52:1` / `4.25:1`). | Kontras tombol primer dan info box di luar ruang/mode gelap tidak terbaca jelas. | Terapkan hasil `NOD-02` + token dark mode `--blue` yang lulus `>= 4.5:1`. |
| **A11Y-04** | `SC 2.4.3 Focus Order`, `1.3.1`, Dialog Pattern | `ModalForm.tsx` diimpor (`App.tsx:11`) tetapi **0/18 modal** memakainya. Modal inline tidak punya focus trap (Tab keluar ke layar belakang), beberapa tidak punya handler `Escape`, dan tidak mengembalikan fokus ke tombol pemicu saat tutup (terutama stacked modal `detailModal` -> `showItemsBreakdownModal`). | Pengguna screen reader / keyboard tersesat di belakang overlay backdrop. | Refactor semua 18 modal/sheet menggunakan komponen `ModalForm` yang dilengkapi focus trap penuh + Escape + restore focus. |
| **A11Y-05** | `SC 2.5.8 Target Size`, Apple HIG `44×44` | Stepper pecahan uang di Setoran berukuran `32×34 px` (`App.tsx:3955, 3972`); tombol tanggal Laporan `minHeight: 32px` (`4299`), segmented tab Laporan `minHeight: 34px` (`4317`), tombol Timeline `minHeight: 40px` (`8107`), `Simpan semua` cart `height: 40px` (`8163`). | Risiko salah pencet tinggi saat mengoperasikan HP dengan satu tangan di meja kasir. | Wajib naikkan semua kontrol interaktif menjadi minimal **`44×44 CSS px`** (preferred `48×48` untuk stepper berulang). |
| **A11Y-06** | `SC 2.3.3` / `prefers-reduced-motion` | `.live-pulse-beacon` & glow masih didefinisikan di `App.tsx:1975` & `styles.css`. | Melanggar G4 dan mengganggu sensitivitas gerak. | Hapus seluruh beacon pulse dekoratif; pastikan `@media (prefers-reduced-motion: reduce)` mencakup seluruh komponen sheet & toast. |

---

## 3. Matriks Status Pengujian 7 Breakpoint (`NOT RUN` — Membutuhkan Render Nyata)

> **Peringatan Kejujuran:** Semua uji render di bawah berstatus **`NOT RUN`** karena biner browser Chromium tidak tersedia di lingkungan Mode A saat ini. **Tidak ada estimasi piksel yang dikarang.**

| Viewport (CSS px) | Kategori Perangkat | Skenario Kritis yang Wajib Diuji (`Mode B Gate`) | Status Saat Ini |
|---|---|---|---|
| **`320 × 568`** | HP Android mini / layar sempit | Horizontal overflow body; wrapping `2×2` quick tiles; input qty+unit `Catat`; baris `Setoran` (`Target Buku` vs `Hitung Fisik` 2-kolom saat ini rawan sempit!); panjang teks `"Rp 1.250.000.000"` di `Laporan`; modal SQL di `Pengaturan`. | **`NOT RUN`** *(Risiko Tinggi — `perlu diukur dari render`)* |
| **`360 × 640`** | HP Android UMKM umum | Tinggi fold pertama `Beranda`; `Sticky Cart Bar` + `Bottom Bar` saat keyboard virtual terbuka di `Catat Belanja`; `Pecahan Lembaran` di `Setoran`. | **`NOT RUN`** |
| **`390 × 844`** | Standar smartphone modern | Posisi `safe-area-inset-bottom` pada Bottom Nav solid G4; bottom sheet drag-dismiss & backdrop. | **`NOT RUN`** |
| **`430 × 932`** | Smartphone layar besar | Batas peralihan spacing mobile sebelum breakpoint `760px`. | **`NOT RUN`** |
| **`768 × 1024`** | Tablet portrait (peralihan Rail `>=760px`) | Bottom Bar hilang tepat di `760px`; Left Rail `220px` tidak mendorong konten keluar viewport; 2-kolom `Stok`. | **`NOT RUN`** |
| **`1024 × 768`** | Tablet landscape / laptop kecil | Form + Pratinjau 2-kolom sejajar tanpa memotong angka tabel/kartu. | **`NOT RUN`** |
| **`1440 × 900`** | Desktop penuh | Batas max-width container konten; keterbacaan baris `Laporan` tanpa jarak mata terlalu jauh antara label kiri & nominal kanan; `@media print`. | **`NOT RUN`** |

---

## 4. Protokol Uji Otomatis & Manual untuk Mode B (`tests/playwright/`)

Setelah Chromium terpasang (`npx playwright install chromium`) di lingkungan pengembangan Mode B, suite QA wajib mengeksekusi:
1. **Viewport & Overflow Sweep (`320, 360, 390, 430, 768, 1024, 1440`):** Assert `document.documentElement.scrollWidth <= window.innerWidth` di setiap layar dan setiap modal terbuka; verifikasi `getBoundingClientRect()` bahwa elemen berfokus tidak tertutup oleh fixed Bottom Nav (`SC 2.4.11`).
2. **Long String & Edge Data Stress Test:** Seed lokal sandbox dengan nama barang 65 karakter, nominal `Rp 999.999.999`, nilai `0`, `blank`, `unknown`, unit `kg`/`liter`/`porsi` -> assert tidak ada teks bertumpuk atau terpotong.
3. **Axe-core Accessibility Sweep (`@axe-core/playwright`):** Target **0 critical/serious violation** di light & dark mode pada seluruh 10 layar & `ModalForm`.
4. **Keyboard & Reduced Motion Pass:** Tab melalui seluruh kontrol di Beranda -> Catat -> Stok -> Setoran -> Laporan -> Riwayat -> Pengaturan; verifikasi `Escape` & return focus modal; aktifkan `emulateMedia({ reducedMotion: 'reduce' })`.
5. **Print Media Check:** Cek `@media print` di `Laporan` tanpa potongan teks atau shadow/border hilang.
