# TOKO SAKALA — MODE A: FORENSIC UI/UX AUDIT & DESIGN BLUEPRINT

**Tanggal pemeriksaan:** 13 November 2026  
**Paket sumber:** `toko-sakala.zip` yang diunggah pada percakapan ini  
**Fase:** Mode A — Research & Design Blueprint  
**Status:** Audit awal berbasis source; belum ada perubahan kode dan belum ada persetujuan implementasi.

---

## 1. Tujuan fase

Melakukan audit forensik seluruh pengalaman TOKO SAKALA dan menyusun satu rancangan UI/UX yang konsisten, spesifik, dapat diuji, dan sesuai perilaku aplikasi yang nyata.

Fase ini **tidak boleh mengubah source code, mengaktifkan fitur yang belum ada, mengubah rumus bisnis, mengubah database, atau melakukan redesign langsung**. Hasil akhirnya adalah blueprint yang dapat ditinjau sebelum masuk Mode B.

Prinsip produk yang tidak boleh hilang:

> Jangan membuat pengguna memahami sistem. Buat sistem yang memahami pengguna.

Pengguna cukup mencatat kejadian sederhana. Aplikasi yang harus menghitung, memvalidasi, menghubungkan, dan menjelaskan konsekuensinya. Prioritas: kebenaran data → kejelasan → kemudahan operasi → hierarki → keseimbangan visual → estetika → motion.

## 2. Temuan forensik awal dari paket sumber

### 2.1 Sumber aktif dan struktur

- UI utama berada di `src/App.tsx` (sekitar 8.234 baris pada paket yang diperiksa) dan styling global di `src/styles.css` (sekitar 3.718 baris).
- `App.tsx` memuat banyak screen, state, handler, modal, dan navigasi dalam satu komponen besar. Ini membuat konsistensi lintas layar dan audit dampak perubahan lebih sulit.
- Ditemukan sekitar 754 objek `style={{...}}` inline di `App.tsx`, sekitar 149 kemunculan hex color (43 warna unik), serta 95 nilai hex unik dalam `styles.css`. Angka ini adalah hitungan statis pada paket tersebut, bukan ukuran kualitas otomatis; tetapi menunjukkan risiko token drift.
- `src/components/ModalForm.tsx` adalah modal standar yang menangani Escape dan auto-focus awal. Focus trap, pengembalian fokus ke pemicu, serta pengujian screen reader/keyboard belum terbukti.
- Source berisi IndexedDB, Supabase adapter, SyncEngine, Google Drive adapter, engine domain, SQL migration, tests, dokumen desain, prototype, screenshot, dan rekaman layar. Source React terbaru harus menjadi dasar audit; file prototipe HTML lama tidak boleh dianggap sebagai implementasi aktif.

### 2.2 TOKO MODE tetap menjadi identitas aktif

Token inti yang sudah ditemukan pada source:

| Token | Nilai | Fungsi |
|---|---|---|
| Paper | `#FFFDF6` | Surface utama |
| Canvas | `#F4F0E7` | Latar halaman |
| Ink | `#20211F` | Teks / outline utama |
| Muted | `#686A65` | Teks sekunder |
| Line | `#DEDBD2` | Separator |
| Orange | `#FF5A1F` | Aksi utama / perhatian |
| Lime | `#D7FA4A` | Selected / prioritas |
| Cobalt | `#2958E8` | Aksi sekunder / informasi |

Jangan menghidupkan kembali tema Field Ledger / Forest Green / Brass. Jangan mengganti identitas hanya karena referensi aplikasi lain lebih populer. Riset luar hanya boleh menyumbang pola interaksi, struktur, hierarki, dan solusi komponen yang cocok.

### 2.3 Konflik dokumentasi dengan source aktif

- `README.md`, deskripsi `package.json`, dan beberapa dokumen status v0.5.1 menyatakan aplikasi hanya pratinjau dan transaksi tidak disimpan.
- Namun `src/App.tsx` saat ini memanggil `executeSaveTransaction()`, menulis payload ke IndexedDB melalui `localIndexedDB.saveData()`, memperbarui state UI, lalu mencoba sinkronisasi cloud bila dikonfigurasi.
- `IndexedDBAdapter` memiliki outbox mutation. Jadi pernyataan README bahwa seluruh data bisnis tidak disimpan di perangkat sudah tidak sesuai dengan source terbaru.
- Hal ini **tidak membuktikan transaksi sudah aman atau siap produksi**. Cloud sync, otorisasi, konsistensi, dan pemulihan harus diverifikasi terpisah.

### 2.4 Risiko integritas data / status sistem yang harus dipisahkan dari redesign

1. **Status sync menyesatkan:** `SyncEngine.getStatus()` mengisi `pendingCount: 0` secara tetap. `supabaseConnected` berasal dari `isConfigured()` (URL + anon key + client tersedia), bukan bukti autentikasi pemilik atau sinkronisasi berhasil. Jangan tampilkan badge "tersinkron aman" hanya karena konfigurasi tersedia.
2. **Penghapusan record:** `handleDeleteRecord()` menghapus record dari array payload, lalu menyimpan ulang payload. Ini bertentangan dengan prinsip riwayat append-only dan koreksi yang terhubung. UI tidak boleh mengaburkan tindakan ini dengan label "koreksi".
3. **RLS migration:** `migrations/002_create_domain_tables.sql` membuat policy `USING (true) WITH CHECK (true)` dan memberikan hak `ALL` ke role `anon` serta `authenticated`. Ini tidak sama dengan pembatasan hanya pemilik sebagaimana narasi DR-012. Jangan menyatakan database aman sebelum kebijakan akses ditinjau dan dites.
4. **Skema cloud:** `SyncEngine` mendorong dokumen agregat melalui `toko_documents`; migrasi juga mendefinisikan tabel domain terpisah. Kesesuaian antara arsitektur agregat, tabel relasional, migrasi, dan alur sinkronisasi perlu diputuskan dan diuji.
5. **Status UI tidak boleh mengklaim server-confirmed** ketika hanya IndexedDB lokal yang menerima perubahan. Bedakan: tersimpan di perangkat, antrean tertunda, sinkronisasi berjalan, sinkron ke cloud, gagal, konflik, belum terkonfigurasi.
6. **Satuan pembelian:** handler belanja membuat stock movement dengan `unit: 'pcs'` dan menghitung/mengumumkan `totalPieces`; perlu audit khusus untuk item yang unit stok dasarnya bukan pcs agar kg, liter, porsi, kemasan, dan unit lain tidak dipaksakan ke jumlah pcs.
7. **Hapus data contoh vs data riil:** harus dibedakan tegas, dengan preview dampak dan konfirmasi yang jelas.

Masalah di atas bukan izin untuk mengubah domain atau SQL dalam Mode A. Catat sebagai **BLOCKER / keputusan lintas produk dan engineering** untuk pemilik tinjau.

### 2.5 Ketidakkonsistenan desain yang terlihat

- `DESIGN.md` dan G4 v2.1 secara jelas melarang glassmorphism dan menetapkan bottom navigation berbentuk solid, lima item, active state lime.
- Implementasi React yang diperiksa menggunakan `.floating-dock` gelap/transparan dengan `backdrop-filter: blur`, efek gradient dan tombol tengah orange berglow. Ini menyimpang dari aturan desain aktif yang tertulis.
- Screenshot pada `docs/redesign/screenshots/viewport-390.png`, `viewport-320.png`, dan `1440.png` menunjukkan versi navigasi/prototype yang berbeda dari komponen dock pada React. Screenshot lama bukan bukti tampilan source terbaru.
- Rekaman layar AI Studio memperlihatkan beberapa area form/laporan/riwayat yang perlu pemeriksaan detail ukuran label, jarak, keterbacaan, safe-area, dan potensi dock menutupi konten saat keyboard tampil. Ini temuan visual awal, belum hasil pengujian perangkat.
- Beberapa label/meta menggunakan 9–11px. Perlu audit konteks: angka kecil hanya boleh untuk metadata non-esensial, bukan instruksi, label form, satuan, nominal, status, atau tombol.
- CSS menyatakan font `Plus Jakarta Sans` dan `Roboto Mono`, tetapi `index.html` tidak memuat font-file atau stylesheet eksternal dan tidak ditemukan file font lokal. Browser dapat menggunakan fallback. Pilihan font final harus eksplisit dan diuji offline.

### 2.6 Uji teknis awal pada salinan ZIP

- `npm run scan:secrets`: PASS untuk pola secret yang dikenal; ini bukan jaminan semua secret telah ditemukan.
- `npm run test`: tidak dapat berjalan karena executable `vitest` belum terpasang pada lingkungan pemeriksaan.
- `npm run build`: gagal sebelum build Vite akibat dependency/type yang tidak tersedia dan konfigurasi `ignoreDeprecations` TypeScript yang tidak dikenali oleh versi compiler yang tersedia.
- Node tersedia pada runtime pemeriksaan, tetapi `node_modules` tidak tersedia. Belum ada browser test, viewport sweep, Android Chrome test, atau aksesibilitas perangkat yang dapat diklaim lulus.

**Kesimpulan:** jangan menulis PASS untuk test/build/browser QA saat ini. Catat output dan batasan secara eksplisit.

## 3. Riset referensi: bagaimana sumber digunakan

| Sumber | Fungsi riset | Cara menerapkannya |
|---|---|---|
| Mobbin | Membandingkan layar dan user flow produk nyata, khususnya form, list, search, filter, wallet, activity, dan navigasi | Ambil pola yang punya bukti di lebih dari satu app; catat konteks layar dan tujuan pengguna. Jangan menyalin pixel, branding, atau screenshot. |
| Figma Community / UI Kits | Menelaah component library, variables, styles, contoh layar, dan pola sistem desain | Gunakan untuk membandingkan struktur komponen dan token; periksa kualitas, lisensi, pembuat, update, dan aksesibilitas. Bukan berarti semua template layak diadopsi. |
| GitHub Skills | Memahami workflow kerja repo nyata: issues, pull requests, Actions, Codespaces, review, dan dokumentasi | Bukan galeri visual. Gunakan untuk standar dokumentasi, workflow audit, checklist, dan review perubahan yang dapat dilacak. |
| Threads | Mengumpulkan opini praktisi/pengguna dan pain point yang berulang | Perlakukan sebagai bukti kualitatif, bukan standar desain atau fakta universal. Simpan tema diskusi, tanggal, contoh, dan verifikasi terhadap sumber primer. |
| Square POS / Square Retail | Referensi alur inventaris, filter, stock count, konversi unit, stock received, stock adjustment | Pelajari pemisahan sesi hitung, masukan angka, review, konfirmasi, dan penjelasan unit. |
| Shopify POS | Contoh count yang dikirim untuk review/approval sebelum perubahan inventaris diterapkan, disertai jejak siapa/kapan | Pertimbangkan pola review sebelum commit dan audit trail, sesuai aturan domain TOKO SAKALA. |
| Loyverse POS | POS mobile, operasi offline, pengelolaan uang tunai, inventory history, penyesuaian stok dan laporan | Relevan untuk operasional toko kecil; fitur/layar harus diverifikasi dari dokumentasi atau screenshot aktual. |
| majoo | Referensi lokal Indonesia untuk inventori, multisatuan, stok masuk, opname dan HPP | Pelajari istilah serta pola lokal; jangan menyalin asumsi operasional/fitur berbayar yang tidak masuk scope TOKO SAKALA. |
| Apple HIG + WCAG 2.2 | Standar interaksi, gesture, fokus, alternatif input, ukuran target dan drag | Gesture hanya shortcut tambahan. Semua aksi penting tetap memiliki tombol/alternatif yang dapat ditemukan dan dipakai keyboard/assistive tech. |

**Catatan akses:** jika Mobbin, Figma, Threads atau app tertentu memerlukan login/paywall dan agent tidak dapat melihat konten lengkap, agent wajib menulis "tidak dapat diakses" dan tidak boleh mengarang hasil inspeksi. Gunakan dokumentasi resmi, halaman publik, video/demo yang dapat diakses, atau screenshot yang benar-benar tersedia. Setiap referensi perlu URL dan tanggal pemeriksaan.

## 4. Prioritas referensi yang paling relevan untuk TOKO SAKALA

Jangan membuat daftar aplikasi populer tanpa tujuan. Pilih sekurang-kurangnya 6 produk pembanding dengan pembagian:

- 2–3 aplikasi POS/retail untuk input transaksi, pencatatan stok, pembelian, dan riwayat.
- 1–2 aplikasi finansial untuk pemisahan kategori uang, konfirmasi nominal, dan detail transaksi.
- 1 aplikasi Indonesia yang relevan untuk istilah, kebiasaan, dan format Rupiah.
- 1 design system / UI kit untuk konsistensi komponen, token, state, dan aksesibilitas.

Untuk setiap referensi, catat: nama/versi aplikasi, platform, fitur yang diamati, URL sumber, tanggal, screenshot/flow yang benar-benar dilihat, pola yang berguna, batasan konteks, dan keputusan apakah pola dipakai/diadaptasi/ditolak.

## 5. Kerangka audit seluruh aplikasi

Audit setiap screen dan state yang ditemukan di source. Minimal meliputi:

1. App shell, header, mobile navigation, desktop rail.
2. Beranda.
3. Catat / hub aktivitas.
4. Catat belanja dan keranjang multi-produk.
5. Katalog / daftar produk dan tambah/edit produk.
6. Cek sisa stok massal, per produk, kosong, nol, pencarian, filter, satuan.
7. Setoran karyawan: perkiraan, uang diterima, selisih, konfirmasi, undo.
8. Biaya toko dan pemasukan lain.
9. Laporan, pemilihan periode, ringkasan, print/export.
10. Riwayat, detail, koreksi/hapus, filter.
11. Asisten (tetap OFF / tidak ada pemanggilan model kecuali sudah disetujui terpisah).
12. Pengaturan, koneksi, tema, backup/restore, status penyimpanan dan sinkronisasi.
13. Semua modal, bottom sheet, popover, toast, confirmation dialog, loading, empty, offline, error, disabled, unknown, incomplete, success, conflict, and recovery states.
14. Desktop layout dan breakpoint menengah.

Untuk **setiap layar**, hasil audit harus memuat:

- ID screen dan route/state source yang memicu tampilan.
- Satu tujuan utama pengguna.
- Screenshot dari versi source terkini (bila runtime berhasil dijalankan) dan ukuran viewport.
- Struktur dari atas ke bawah, urutan baca, dan prioritas informasi.
- Daftar elemen: koordinat/posisi relatif, lebar/tinggi, gap, padding, radius, border, shadow, warna, font/size/weight/line-height, ikon, target sentuh, dan perilaku responsive.
- Semua aksi: event/handler, aksi yang terjadi, data/state yang berubah, hasil yang terlihat, loading, error, undo/recovery, dan apakah perubahan benar-benar persisten.
- Bentuk empty/loading/offline/disabled/unknown/zero/error/success state.
- Temuan aksesibilitas: label, role, keyboard, focus, contrast, zoom 200%, screen reader, reduced motion.
- Masalah dan dampak pengguna; tingkat severity; bukti file/line atau screenshot.
- Usulan perbaikan dan acceptance criteria yang dapat diuji.

Jangan mengarang ukuran pixel dari screenshot yang tidak dapat diukur. Tandai "perlu diukur dari render" bila belum bisa diekstrak.

## 6. Spesifikasi desain sistem terpadu yang harus dihasilkan

Buat satu sumber kebenaran design system untuk seluruh aplikasi:

### Fondasi
- Color token: primitive, semantic, surface, text, border, interactive, status, chart, dark-theme mapping.
- Typography: family yang benar-benar tersedia, scale, weight, line-height, numeric/tabular style, fallback offline.
- Spacing: skala konsisten; tidak memakai nilai acak tiap halaman.
- Geometry: radius, border, elevation/shadow, container widths, grid, density.
- Icon: satu keluarga ikon, ukuran, stroke weight, aturan icon-only, fallback.
- Motion: duration, easing, state transition, press feedback, skeleton, sheet, toast, reduced-motion.
- Responsive: 320, 360, 390, 430, 768, 1024, 1440 CSS px.

### Komponen
Buat spec untuk button (primary/secondary/tertiary/destructive/quiet), input, numeric input, Rupiah input, stepper, dropdown, segmented control, chip/filter, product row/card, stock count row, money summary, setoran comparison, status badge, nav item, app bar, modal, sheet, toast, empty/error/loading state, search, date period selector, list row, table, and report summary.

Setiap komponen harus menjelaskan: anatomy, variant, states, dimensions, padding, typography, color tokens, radius/border/shadow, icon placement, disabled/loading/focus/pressed behavior, keyboard behavior, accessibility name, and mobile/desktop response.

### Interaction model
- Tap adalah interaksi utama.
- Swipe/long-press/double-tap boleh ditambahkan hanya sebagai shortcut kontekstual setelah action mudah ditemukan.
- Semua aksi gesture memiliki tombol/alternatif yang terlihat; jangan menjadikan swipe satu-satunya cara menghapus, mengarsipkan, kembali, atau membuka detail.
- Jelaskan threshold, arah, feedback selama gesture, pembatalan, haptic hanya bila platform mendukung, konflik dengan edge/back gesture OS, dan alternative interaction.
- Tidak boleh ada gesture yang mengakibatkan commit finansial tanpa review/confirmation.

## 7. Kontrak perilaku yang wajib dijaga

- Preview ≠ persisted transaction; state harus terlihat jelas dan tidak menyesatkan.
- Satu calculation engine untuk preview, simpan, dashboard, laporan, dan ekspor.
- Penjualan, uang diterima, uang kas tersedia, dan uang yang perlu diserahkan adalah hal yang berbeda.
- Modal yang belum diketahui harus tetap unknown/null, tidak pernah dipaksa menjadi nol.
- Kosong berbeda dari angka nol.
- Jumlah pcs, kg, liter, porsi dan unit lain tidak boleh dijumlahkan secara fisik menjadi satu angka.
- Konversi kemasan harus dapat dilacak dan divalidasi.
- Produk master terpisah dari transaksi pembelian yang menambah stok.
- Periode tertutup tidak boleh berubah diam-diam; koreksi harus menjadi catatan baru yang terhubung.
- Jangan tampilkan angka finansial contoh seolah data toko riil.
- Tidak boleh menambah fitur AI/OCR/API key atau mengirim data toko ke layanan eksternal pada fase ini.
- Jangan mengganti framework, arsitektur, engine bisnis, model data, atau SQL sebagai bagian dari redesign visual.

## 8. Deliverable Mode A yang harus dibuat agent

Simpan dokumen terpisah di `docs/audit-mode-a/` (jangan menimpa dokumen lama):

1. `00_AUDIT_EXECUTIVE_SUMMARY.md` — temuan besar, risiko, keputusan yang dibutuhkan.
2. `01_SOURCE_OF_TRUTH_MATRIX.md` — konflik README vs source vs spec vs SQL vs test; tetapkan source of truth sementara dan unresolved issues.
3. `02_SCREEN_INVENTORY.md` — seluruh screen/state/action/modal dengan referensi file dan line.
4. `03_SCREEN_AUDIT.md` — audit detail per screen dan screenshot evidence.
5. `04_REFERENCE_RESEARCH.md` — 6+ aplikasi pembanding, bukti aktual, pola, adopsi/penolakan.
6. `05_DESIGN_SYSTEM_SPEC.md` — token, type, spacing, radius, color semantics, motion, breakpoints, component variants.
7. `06_INTERACTION_STATE_MAP.md` — seluruh aksi klik/tap/swipe/long-press, state before/after, error/recovery, alternatif aksesibel.
8. `07_ACCESSIBILITY_RESPONSIVE_QA.md` — checklist dan hasil aktual, tandai NOT RUN bila belum dapat dieksekusi.
9. `08_DECISION_LOG.md` — LOCKED, RECOMMENDED, NEEDS OWNER DECISION, BLOCKER; jangan mengubah keputusan terkunci.
10. `09_MODE_B_IMPLEMENTATION_PLAN.md` — urutan implementasi berdasarkan dampak dan risiko, file yang disentuh, dependensi, tests dan rollback plan.

Tambahkan source evidence: path file + line range, command & output, screenshot file & viewport, URL referensi & tanggal. Jangan menulis PASS tanpa bukti.

## 9. Urutan kerja wajib untuk agent Google AI Studio

**Tahap 0 — Read-only setup**
- Identifikasi commit/branch, folder aktif, package manager, Node version, dependencies, dan status git.
- Jangan install paket, jangan menulis file kode, jangan memformat seluruh project, jangan mengubah lockfile.
- Baca `AGENTS.md`, `DESIGN.md`, G3, G4, G5, decision register, PRD/TRD/architecture/flow specs, source audit terdahulu, QA report, dan README.

**Tahap 1 — Source map dan real behavior**
- Inventarisir route/state/component/handler.
- Telusuri setiap handler sampai storage/engine/network; catat apakah local only, remote request, atau sekadar UI state.
- Cocokkan semua copy sukses/simpan/sync dengan hasil yang benar-benar terjadi.
- Petakan semua data states dan edge cases.

**Tahap 2 — Run existing app safely**
- Bila dependency tidak ada, catat; jangan otomatis mengubah paket.
- Bila aman, jalankan app read-only dan ambil screenshot pada 320, 360, 390, 430, 768, 1024, 1440.
- Jangan masukkan data toko asli; gunakan fixtures/sample yang eksplisit dan reversible.
- Jika tidak dapat menjalankan browser, jangan menyimpulkan posisi/ukuran render yang tidak terukur.

**Tahap 3 — Reference research**
- Riset minimal 6 app/reference di tabel §4.
- Utamakan sumber resmi dan screenshot/flow yang benar-benar terlihat.
- Mobbin/Figma/Threads hanya bila akses tersedia; dokumentasikan keterbatasan login/paid access.
- GitHub Skills dipakai untuk workflow pengembangan dan kolaborasi, bukan referensi layar UI.
- Catat apa yang diadaptasi, apa yang ditolak, dan alasannya sesuai pengguna TOKO SAKALA.

**Tahap 4 — Audit & synthesis**
- Audit semua screen, state, action dan breakpoint.
- Buat single design system yang tidak saling bertentangan.
- Jangan ubah identitas TOKO MODE tanpa keputusan pemilik.
- Prioritaskan masalah yang menghambat pencatatan, menyebabkan salah baca angka, menyembunyikan status, atau menimbulkan kesalahan pengguna.

**Tahap 5 — Handoff**
- Tulis sepuluh deliverable §8.
- Buat daftar hal yang perlu keputusan owner sebelum Mode B.
- Laporkan temuan kritis terlebih dahulu.
- **Berhenti. Jangan implementasikan. Jangan ubah kode. Jangan commit atau push.** Tunggu review blueprint.

---

## 10. Referensi eksternal awal

Tanggal pemeriksaan sumber: 13 November 2026.

- Google AI Studio Build mode — dokumentasi impor project GitHub dan environment Build: https://ai.google.dev/gemini-api/docs/aistudio-build-mode
- Mobbin — library referensi app/site, screen, flow, UI elements, dan animasi: https://mobbin.com/
- Figma Community — UI kits, wireframes, templates, plugins, widgets, dan design resources: https://help.figma.com/hc/en-us/articles/360038510693-Guide-to-the-Figma-Community
- Figma UI kits — komponen, styles, variables, dan example screens: https://help.figma.com/hc/en-us/articles/24037724065943-Start-designing-with-UI-kits
- GitHub Skills — interactive exercises on real repository workflows, Issues, Actions, and Codespaces: https://github.com/skills
- Threads Communities — sumber diskusi publik/topikal; konten komunitas bukan standar desain: https://about.fb.com/news/2025/10/introducing-threads-communities-find-your-people/
- Apple HIG Gestures — gesture sebagai shortcut tambahan, bukan pengganti aksi standar: https://developer.apple.com/design/human-interface-guidelines/gestures
- Apple HIG Accessibility — sediakan cara alternatif selain gesture: https://developer.apple.com/design/human-interface-guidelines/accessibility
- WCAG 2.2 — dragging movement alternatives dan minimum target size 24×24 CSS px pada Level AA: https://www.w3.org/TR/wcag/
- Square POS stock management: https://squareup.com/help/us/en/article/6110-manage-inventory-with-the-retail-pos-app
- Square full/cycle stock counts: https://squareup.com/help/us/en/article/8249-conduct-full-inventory-counts-with-square-for-retail
- Shopify POS stock count review/approval (28 September 2026): https://changelog.shopify.com/posts/run-inventory-counts-in-pos
- Loyverse POS features: https://loyverse.com/id/features
- Loyverse inventory history: https://help.loyverse.com/help/inventory-history-and-valuation
- majoo inventory: https://majoo.id/aplikasi-inventori/

---

# PROMPT UNTUK GOOGLE AI STUDIO — MODE A

Salin bagian ini ke Google AI Studio Build setelah project repository TOKO SAKALA berhasil diimpor.

---

Anda bertindak sebagai **Principal Product Designer, UX Researcher, Design Systems Architect, Frontend Auditor, Accessibility Specialist, dan QA Analyst** untuk TOKO SAKALA.

Saya meminta Anda menjalankan **MODE A: FORENSIC UI/UX AUDIT & DESIGN BLUEPRINT** terhadap project yang sedang terbuka.

## KONDISI KERJA MUTLAK

Ini adalah fase penelitian dan perancangan. **DILARANG mengubah kode aplikasi pada fase ini.** Jangan edit, rename, delete, generate ulang, format, refactor, install package, ganti framework, ubah database, ubah engine bisnis, atau commit/push. Anda boleh membuat dokumen audit baru di `docs/audit-mode-a/` saja. Jika pembuatan dokumen di folder tersebut dianggap perubahan kode, jangan lakukan; laporkan dan tampilkan dokumen di chat.

Jangan memulai redesign hanya berdasarkan screenshot. Audit dulu source aktual dan alur data. Jangan menganggap dokumen lama selalu benar; cocokkan klaimnya dengan implementasi, SQL, tests dan output yang dapat diverifikasi. Jangan mengklaim sudah membuka Mobbin/Figma/Threads atau menjalankan browser bila Anda tidak benar-benar dapat melakukannya.

## IDENTITAS PRODUK YANG HARUS DIPERTAHANKAN

TOKO SAKALA adalah alat operasional untuk pemilik toko kecil yang tidak harus memahami akuntansi. Prinsip utamanya:

**"Jangan membuat pengguna memahami sistem. Buat sistem yang memahami pengguna."**

Pengguna mencatat kejadian sederhana; sistem mengurus perhitungan dan menjelaskan hasilnya. Bahasa Indonesia harus natural, ramah pemula, langsung, dan tidak bertele-tele.

Visual identity aktif adalah **TOKO MODE**:
- Paper `#FFFDF6`
- Canvas `#F4F0E7`
- Ink `#20211F`
- Muted `#686A65`
- Line `#DEDBD2`
- Orange `#FF5A1F`
- Lime `#D7FA4A`
- Cobalt `#2958E8`
- Semantic states mengikuti token design system aktif yang sudah ada.

Jangan mengaktifkan kembali Field Ledger / Forest Green / Brass. Jangan membuat tema baru. Riset aplikasi lain hanya untuk mempelajari solusi UX, hierarki, komponen dan interaksi; bukan untuk menyalin brand, pixel, atau aset.

## RULES BISNIS DAN DATA — NON-NEGOTIABLE

1. Preview bukan transaksi tersimpan.
2. Satu engine perhitungan murni harus menjadi dasar preview, save validation, dashboard, laporan dan export.
3. Penjualan, uang diterima, kas toko tersedia, uang yang perlu diserahkan karyawan dan setoran yang diterima adalah konsep berbeda.
4. Modal yang belum diketahui tetap unknown/null, bukan angka nol.
5. Kolom kosong berbeda dari angka 0 yang benar-benar dicatat.
6. Jangan menjumlahkan pcs, kg, liter, porsi atau satuan berbeda seolah-olah satu unit.
7. Konversi kemasan harus eksplisit dan dapat ditelusuri.
8. Produk master/katalog berbeda dari transaksi pembelian yang menambah stok.
9. Periode tertutup tidak boleh diedit diam-diam; koreksi harus berupa record baru yang terhubung.
10. Jangan menampilkan data contoh seolah-olah data keuangan toko yang nyata.
11. Jangan menambahkan AI/OCR, API key browser, telemetry, atau pengiriman data eksternal pada fase ini.
12. Jangan mengubah rumus atau keputusan bisnis terkunci untuk membuat UI lebih mudah. Jika ada konflik, dokumentasikan untuk keputusan pemilik.

## TEMUAN AWAL YANG WAJIB ANDA VERIFIKASI ULANG

- README dan beberapa dokumen v0.5.1 menyebut preview-only, tetapi `src/App.tsx` memiliki `executeSaveTransaction()` yang menulis ke IndexedDB dan mencoba sinkronisasi Supabase. Pastikan perilaku source aktual, jangan ulangi klaim README tanpa verifikasi.
- `SyncEngine.getStatus()` tampak mengembalikan `pendingCount: 0` secara tetap; verifikasi dan dokumentasikan dampak UX.
- `supabaseConnected` tampak berdasarkan konfigurasi, bukan bukti autentikasi/persistensi cloud. Bedakan connected/configured/synced.
- `handleDeleteRecord()` menghapus data lama dari payload; cocokkan dengan kebijakan append-only/correction.
- `migrations/002_create_domain_tables.sql` tampak memakai policy RLS `USING (true) WITH CHECK (true)` dan grants ke role anon/authenticated. Ini berpotensi bertentangan dengan klaim owner-only. Catat sebagai security blocker dan jangan memperbaikinya sekarang.
- SyncEngine mendorong dokumen agregat ke `toko_documents`; telusuri hubungan dengan tabel domain terpisah di migrasi.
- Beberapa purchase handlers tampak menyimpan movement dengan `unit: 'pcs'` dan menghitung `totalPieces`; periksa produk/unit non-pcs.
- Implementasi mobile dock tampak memakai glassmorphism, sementara DESIGN.md/G4 melarangnya dan meminta navigation solid lima item.
- Screenshot lama di `docs/redesign/screenshots/` tidak selalu cocok dengan React source terkini. Buat bukti baru bila runtime tersedia.
- Token font menyebut Plus Jakarta Sans dan Roboto Mono, tetapi font source/binary belum tentu termuat. Periksa font yang benar-benar dipakai browser, bukan hanya string CSS.

## TUGAS 1 — FORENSIC SOURCE AUDIT

Baca minimal:
- `AGENTS.md`, `DESIGN.md`, `README.md`
- `docs/DECISION_REGISTER.md`
- G3, G4, G5, reference research, implementation status, verification report, AI Studio QA report
- semua dokumen spesifikasi produk, arsitektur, appflow, screen specs, userflow, design system, components, testing, reporting/export
- `src/App.tsx`, `src/styles.css`, seluruh komponen, domain, engine, storage, auth, adapters, migrations dan tests.

Buat source map lengkap. Temukan setiap screen, route/state, modal, bottom sheet, toast, form, action, conditional state, error handling dan penyimpanan.

Untuk setiap aksi klik/tap:
- catat komponen dan handler yang dipanggil;
- apa yang berubah di state;
- apakah data hanya berubah di UI, disimpan lokal, masuk outbox, atau benar-benar dikirim ke cloud;
- apa pesan yang muncul dan apakah pesan tersebut jujur;
- bagaimana loading, success, failure, undo, duplicate submit, offline, dan conflict ditangani.

Cari dead button, link tanpa destination, placeholder, fake number, fake sync, fake AI, status yang mengklaim lebih dari bukti, dan tombol aktif yang tidak mengerjakan apa yang dijanjikan.

## TUGAS 2 — SCREEN-BY-SCREEN VISUAL AUDIT

Audit seluruh layar dan semua state yang ditemukan, bukan hanya halaman beranda. Untuk masing-masing screen, dokumentasikan:
- posisi dan urutan konten;
- lebar/tinggi/spacing/padding/gap;
- ukuran, warna, radius, border, shadow;
- font family, size, weight, line-height, letter spacing;
- dimensi dan stroke ikon;
- ukuran target sentuh;
- hierarchy, readability, alignment, density, whitespace;
- keyboard, safe-area, sticky/fixed elements, scroll behavior;
- action/CTA, focus, pressed, active, disabled, loading/error/success states.

Gunakan screenshot source terbaru pada 320, 360, 390, 430, 768, 1024 dan 1440 CSS px jika dapat dijalankan dengan aman. Simpan screenshot dengan nama yang menyertakan screen dan viewport. Jangan mengarang pixel metrics bila tidak ada render yang dapat diukur. Catat 200% zoom, nama produk panjang, teks Indonesia panjang dan nominal Rupiah besar.

## TUGAS 3 — RESEARCH APPS DAN DESIGN SYSTEM

Riset minimal enam produk pembanding yang relevan. Minimal mencakup POS/retail, money management, dan produk Indonesia. Pertimbangkan Square POS, Shopify POS, Loyverse POS, majoo, serta aplikasi fintech yang pola uangnya benar-benar sesuai kebutuhan. Pilihan akhir harus berbasis kecocokan task, bukan popularitas semata.

Gunakan:
- Mobbin untuk screen dan flow produk nyata bila akses tersedia;
- Figma Community/UI Kits untuk component system, variables dan sample screens;
- GitHub Skills untuk workflow issue/review/Actions dan dokumentasi, bukan inspirasi visual;
- Threads untuk opini komunitas yang bersifat kualitatif, bukan kebenaran universal;
- dokumentasi resmi Apple dan WCAG untuk gesture, input, focus, keyboard dan accessibility;
- dokumentasi resmi vendor POS untuk unit conversion, counting, review/approval, history, offline dan cash reconciliation.

Setiap temuan riset harus punya URL, tanggal, apa yang benar-benar diamati, dan bukti. Bila perlu login/subscription, tandai keterbatasannya. Jangan membuat kutipan atau klaim seolah-olah Anda melihat layar yang tidak bisa diakses.

Buat matrix: **Reference → observed pattern → user problem solved → fit for TOKO SAKALA → adapt/reject → reason**.

## TUGAS 4 — SATU DESIGN SYSTEM FINAL

Rekomendasikan satu sistem visual terpadu yang memperkuat TOKO MODE. Tidak boleh ada halaman yang memakai gaya, ukuran, radius, typography atau komponen berbeda tanpa alasan semantik terdokumentasi.

Tentukan secara numerik:
- token warna primitive & semantic termasuk dark mode;
- typography family/scale/weight/line height dan fallback offline;
- spacing scale, grid, container, breakpoint;
- border, radius, shadow/elevation;
- icon family, ukuran dan stroke;
- component variant dan state;
- animation duration, easing, transition dan reduced-motion behavior.

Tentukan spec numerik untuk button, numeric input, Rupiah input, stepper, form row, product row/card, stock count, filter chip, category tabs, summary, setoran comparison, badge, nav, modal, bottom sheet, toast, search, date picker, empty/error/loading states, report list/table.

Berikan contoh pemakaian per screen supaya design tokens tidak berhenti sebagai daftar warna saja.

## TUGAS 5 — MODERN INTERACTIONS DENGAN ALTERNATIF

Usulkan swipe, long-press, drag, pull-to-refresh, bottom sheet gesture, atau quick actions hanya saat jelas manfaatnya.

Untuk setiap gesture, tulis:
- kapan dan di objek mana gesture tersedia;
- arah/threshold/duration;
- feedback sebelum tindakan dikomit;
- apa hasilnya;
- cara membatalkan;
- apakah tindakan reversible;
- kontrol tombol/alternatif yang setara;
- cara kerja keyboard dan assistive tech;
- risiko bentrok dengan gesture navigasi Android/OS.

Gesture tidak boleh menjadi satu-satunya cara menjalankan aksi penting. Jangan memakai swipe-only delete atau drag-only reorder. Tidak ada commit finansial yang diam-diam terjadi hanya karena gesture.

## TUGAS 6 — DELIVERABLES

Buat dokumen:
- `00_AUDIT_EXECUTIVE_SUMMARY.md`
- `01_SOURCE_OF_TRUTH_MATRIX.md`
- `02_SCREEN_INVENTORY.md`
- `03_SCREEN_AUDIT.md`
- `04_REFERENCE_RESEARCH.md`
- `05_DESIGN_SYSTEM_SPEC.md`
- `06_INTERACTION_STATE_MAP.md`
- `07_ACCESSIBILITY_RESPONSIVE_QA.md`
- `08_DECISION_LOG.md`
- `09_MODE_B_IMPLEMENTATION_PLAN.md`

Klasifikasi temuan: **CRITICAL / HIGH / MEDIUM / LOW** dan status **VERIFIED / NEEDS RUNTIME TEST / NEEDS OWNER DECISION / BLOCKED**.

Tulis acceptance criteria dan bukti uji untuk setiap rekomendasi. Jangan mengubah source, dan jangan masuk Mode B.

## OUTPUT AKHIR

Sajikan ringkasan temuan terpenting terlebih dahulu, kemudian tautkan/tampilkan dokumen blueprint. Buat daftar keputusan yang perlu saya setujui. Setelah itu berhenti.

**Sekali lagi: jangan implementasikan desain pada fase ini. Jangan edit file kode. Mode A berakhir ketika blueprint lengkap, transparan, dan siap saya review.**
