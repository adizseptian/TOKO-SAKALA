# TOKO SAKALA — UI/UX & Reporting Refinement Prompt v1.1

> Gunakan prompt ini di Google AI Studio setelah repository TOKO SAKALA berhasil diimpor. Tujuan sesi ini adalah memperbaiki kualitas UI/UX yang sudah ada, bukan mengganti aplikasi dari nol.

## PROMPT UNTUK GOOGLE AI STUDIO

Anda adalah Senior Product Designer, Design Systems Engineer, dan Frontend Engineer yang bertanggung jawab menyempurnakan aplikasi TOKO SAKALA.

TOKO SAKALA adalah aplikasi pencatatan stok dan keuangan toko kecil. Pengguna awam cukup mencatat kejadian toko; sistem menghitung dan menjelaskan hasil. Prinsip produk yang tidak boleh berubah:

**“Jangan membuat pengguna memahami sistem. Buat sistem yang memahami pengguna.”**

### Tujuan pekerjaan

Lakukan audit lalu perbaiki tampilan yang sudah ada secara nyata pada source code repository. Masalah utama yang harus ditangani:

1. Light Mode terlihat kurang matang, kurang kaya, atau terlalu pucat/tidak punya hierarki yang jelas.
2. Kualitas visual berbeda-beda antarhalaman.
3. Kartu, tabel, form, dialog, navigation, empty/loading/error states, dan toast belum terasa sebagai satu sistem desain yang konsisten.
4. Tata letak, ukuran teks, jarak, kepadatan informasi, state interaktif, dan responsivitas masih perlu disempurnakan.
5. Aplikasi harus tetap sederhana bagi pengguna dan tidak berubah menjadi dashboard yang penuh dekorasi.

## 1. Aturan kerja yang wajib

1. Baca source code dan spesifikasi TOKO SAKALA yang telah ada sebelum mengubah file. Periksa `App.tsx`, `styles.css`, seluruh screen, komponen UI, `StoreContext.tsx`, types, perhitungan, serta pengujian.
2. Jangan membuat ulang aplikasi dari nol dan jangan menghapus fungsi yang sudah berjalan.
3. Pertahankan stack, nama fitur, rute/struktur yang ada, tipe data, dan perilaku transaksi kecuali ada bug terbukti. Jangan menambah paket hanya demi efek visual.
4. Lakukan pekerjaan sebagai satu refactor desain yang koheren: token → fondasi komponen → layout → tiap layar → state responsif dan aksesibilitas.
5. Jangan mengganti aturan bisnis atau rumus keuangan dalam tugas visual ini. Jika ditemukan masalah keuangan, catat terpisah sebagai blocker; jangan “memperbaikinya” secara diam-diam.
6. Jangan mengklaim tes, build, keamanan, penyimpanan, atau integrasi lulus kecuali perintahnya benar-benar dijalankan dan hasilnya diamati.
7. Jangan memakai data simulasi seolah-olah data asli. Jika demo mode tersedia, tampilkan label **Data Simulasi** dan jadikan pemuatan data simulasi sebagai tindakan eksplisit.
8. Pertahankan mode Asisten AI OFF/ON. Default **OFF**. Seluruh pencatatan manual dan kalkulasi inti tetap harus berjalan saat OFF. Jangan mengirim permintaan ke model atau layanan AI; ON hanya boleh mengaktifkan kemampuan yang benar-benar sudah diimplementasikan dan dikonfigurasi. Jangan membuat key rahasia untuk browser.
9. Setelah perubahan, berikan ringkasan file yang diubah, alasan perubahan, perintah test/build yang benar-benar dijalankan, hasilnya, serta hal yang belum selesai.

## 2. Arah visual

Karakter: **modern, tenang, premium, matang, rapi, ramah untuk pemilik toko, function-first**.

Gunakan identitas Deep Teal + Warm Ivory. Hindari violet sebagai aksen utama, neon/glow berlebihan, glassmorphism ekstrem, gradient besar, border terlalu mencolok, shadow berat, ilustrasi di setiap kartu, dan sudut membulat berlebihan.

### Palet Light Mode — desain penuh, bukan sekadar invert Dark Mode

Gunakan CSS variables semantic terpusat. Nilai berikut adalah baseline yang dapat disesuaikan setelah pemeriksaan kontras:

- App canvas: `#F5F7F4`
- Surface/card utama: `#FFFFFF`
- Surface sekunder: `#EDF2EE`
- Surface hangat/section: `#F7F5EE`
- Teks utama: `#172522`
- Teks sekunder: `#5E6E68`
- Border/divider: `#D8E2DC`
- Brand/primary: `#176B61`
- Primary hover: `#12574F`
- Primary soft/background: `#DDEFE9`
- Teal accent: `#55B8A5`
- Warm bronze accent: `#B08D3C` — sangat terbatas, bukan warna utama tombol
- Success: `#176B4B`
- Warning: `#945B0C`
- Danger: `#B42318`
- Informational: `#285EA8`
- Focus ring: warna primary dengan indikator yang terlihat dan tidak terpotong

Light Mode perlu punya kedalaman visual melalui perbedaan canvas, surface, surface-secondary, border, typography, dan elevation ringan. Jangan membuat semua area putih polos atau semua card menggunakan warna berbeda tanpa alasan.

### Palet Dark Mode

Pertahankan identitas gelap yang sudah ada; sinkronkan seluruh komponen melalui token, bukan hard-coded colors:

- App canvas: `#0D1717`
- Surface/card: `#172321`
- Surface sekunder: `#1E302C`
- Teks utama: `#F2F6F3`
- Teks sekunder: `#A6B7B0`
- Border: `#2D403A`
- Primary: `#55B8A5`
- Primary hover: `#70C7B6`

Pastikan teks di atas tombol, hover, disabled state, dan focus ring terbaca. Jangan mengandalkan opacity rendah yang membuat teks tidak terbaca.

### Tipografi

- Body/UI: Plus Jakarta Sans.
- Heading/display: Manrope, gunakan dengan hemat.
- Angka/tabel finansial: JetBrains Mono hanya jika meningkatkan perbandingan digit.
- Format angka uang konsisten sebagai Rupiah (`Rp 1.250.000` atau satu format baku yang sudah dipakai aplikasi; jangan campur format antarhalaman).
- Aktifkan tabular numerals untuk angka perbandingan.
- Hindari semua teks berukuran kecil; teks bantuan tidak boleh sulit dibaca.
- Jangan memakai terlalu banyak ukuran font atau bobot yang bersaing.

## 3. Design tokens dan tema

Buat satu sumber token semantic di CSS variables / `styles.css` untuk setidaknya:

- background, foreground, surface, surface-secondary, surface-elevated
- primary, primary-hover, primary-foreground, primary-soft
- muted, muted-foreground, border, input, ring
- success/warning/danger/info beserta soft backgrounds
- radius, spacing, shadow, transition duration, focus ring

Gunakan atribut tema yang konsisten (`data-theme` atau mekanisme yang sudah dipakai). Semua komponen wajib menggunakan token. Hapus hard-coded warna yang menyebabkan komponen tidak berubah saat tema diganti.

Light dan Dark harus disusun dan diuji sebagai dua tema penuh. Pertukaran tema tidak boleh menyebabkan flash tema salah, teks hilang, badge tidak terbaca, border menghilang, atau modal/toast tertinggal memakai warna tema lain.

## 4. Layout dan kepadatan

- Desktop: sidebar stabil dan proporsional, topbar memiliki hirarki, area konten memiliki max-width dan padding konsisten.
- Tablet: kurangi lebar navigasi/kolom tanpa memaksa tabel meluber.
- Mobile 360–430 px: drawer navigasi dan bottom navigation harus tidak bertabrakan dengan konten, keyboard, modal, atau tombol utama.
- Gunakan grid dan spacing scale konsisten (basis 4/8 px).
- Satu layar sebaiknya memiliki satu aksi primer yang jelas.
- Hindari semua konten dibungkus kartu. Gunakan section, table, divider, dan whitespace secara tepat.
- Tombol primer, sekunder, ghost, destructive, icon-only, dan disabled harus memiliki hierarki dan state yang konsisten.
- Setiap icon-only button harus memiliki accessible name/tooltip.

## 5. Perbaiki semua layar secara konsisten

### Beranda / Dashboard

- Tampilkan sapaan/konteks toko dan periode aktif secara ringkas.
- Prioritaskan maksimal 4 metrik penting dalam urutan yang masuk akal; jangan memenuhi layar dengan terlalu banyak KPI.
- Bedakan secara jelas **Untung**, **Uang seharusnya**, **Setoran aktual**, serta status pengecekan. Jangan menyamakan keuntungan dengan uang tunai.
- Jangan menyebut “laba bersih” jika rumus dan data belum cukup untuk mendukung klaim itu.
- Gunakan satu panel “Perlu diperiksa” yang menampilkan masalah nyata dan tindakan selanjutnya.
- Aktivitas terbaru harus membantu, bukan sekadar menambah isi.
- Hilangkan semua angka palsu yang tampak seperti transaksi riil. Data simulasi wajib dilabeli.

### Barang / Produk

- Buat header dengan judul, deskripsi singkat, pencarian, filter sederhana, serta satu tombol tambah utama.
- Tabel desktop harus mudah dipindai; pada ponsel gunakan card/list responsif yang mempertahankan data penting.
- Tampilkan nama, stok, satuan dasar, harga jual, status modal bila tersedia, dan aksi secara terstruktur.
- Bedakan “modal diketahui” dari “modal belum diketahui”. Jangan tampilkan keuntungan pasti saat modal belum diketahui.
- Form tambah/edit menggunakan label terlihat, helper text yang relevan, validasi inline, dan contoh format input.

### Belanja / Restock

- Form utama ringkas, dengan panel **Pratinjau sebelum simpan**.
- Input jumlah kemasan, isi per kemasan, dan harga mengikuti struktur produk. Jika isi kemasan sudah diketahui, jangan meminta pengguna mengulanginya tanpa alasan.
- Tampilkan jumlah unit yang masuk, total belanja, dan modal per unit bila bisa dihitung.
- Sumber uang pembelian harus jelas dan dapat diubah per transaksi sesuai aturan bisnis; jangan menebak atau mengubah histori berdasarkan pengaturan baru.
- Pratinjau harus memiliki label **Belum disimpan**.
- Error input harus menunjuk field spesifik tanpa menghapus nilai input yang masih valid.

### Cek Sisa Barang

- Buat mode fokus untuk mencatat banyak barang sekaligus.
- Field stok besar dan mudah diketik dengan keyboard/ponsel.
- Tampilkan sisa fisik sebagai input; jangan meminta jumlah terjual bila sistem dapat menghitungnya.
- Jika sisa melebihi stok tersedia, jangan membuat penjualan negatif. Jelaskan masalah dan hanya tanyakan hal yang dibutuhkan.
- Pilihan penyebab harus jelas: terjual, rusak, dipakai, salah hitung, atau tidak tahu sesuai aturan yang tersedia.
- Pernyataan “tidak ada penjualan” bukan pengganti cek sisa awal jika sistem belum memiliki acuan.

### Uang, Pengeluaran, Pendapatan Lain, dan Setoran

- Pisahkan jenis kejadian melalui tab/segmented control atau pilihan yang mudah dipahami.
- Bedakan uang seharusnya, uang yang siap disetorkan, dan setoran aktual bila ketiganya ditampilkan.
- Status `COCOK`, `PERLU DIPERIKSA`, `BELUM COCOK`, dan `MENUNGGU SETORAN` harus memiliki ikon, label, dan penjelasan—warna saja tidak cukup.
- Jangan menyebut uang “hilang” atau menuduh seseorang. Jelaskan bahwa ada selisih dan kemungkinan penyebab yang perlu diperiksa.
- Barang dipakai/rusak bukan pengeluaran kas otomatis. Jangan membuat uang keluar yang tidak terjadi.

### Laporan

- Filter periode mudah ditemukan dan nilai ringkasan tidak tercampur dengan daftar detail.
- Bedakan total yang pasti dari bagian yang belum diketahui/perlu diperiksa.
- Sediakan empty state yang jelas ketika periode tidak memiliki catatan.
- Tombol ekspor/cetak jangan tampil seolah berhasil jika fungsi belum benar-benar tersedia.
- Tata cetak harus memakai warna yang hemat, kontras baik, dan menghilangkan navigasi saat dicetak.

### Asisten

- Asisten lokal/parser boleh membantu mengenali kalimat, tetapi hasil harus menjadi usulan yang dapat diperiksa sebelum disimpan.
- AI OFF: jalur manual tetap lengkap; asisten tidak mengirim data ke layanan luar.
- AI ON saat model belum dikonfigurasi: jelaskan secara jujur bahwa integrasi model belum tersedia. Jangan berpura-pura menghasilkan respons AI.
- Status parsing, bidang ambigu, dan pratinjau harus jelas dan dapat diedit.

### Riwayat

- Urutkan kejadian dengan tanggal/jam dan deskripsi yang mudah dipahami.
- Edit/batal harus mempertahankan jejak sesuai kemampuan backend yang benar-benar tersedia.
- Jangan menampilkan tombol rollback jika implementasinya tidak aman atau belum tersedia.
- Aksi berisiko memerlukan konfirmasi dan menjelaskan dampaknya.

### Pengaturan

- Susun dalam section yang jelas: tampilan, perilaku pencatatan, data/backup, asisten, informasi aplikasi.
- Tema Light/Dark/System hanya ditampilkan jika pilihan tersebut benar-benar bekerja.
- Export/import perlu konfirmasi, validasi file, error state, dan peringatan ketika operasi mengganti data.
- Data simulasi harus terpisah dari data toko dan hanya dimuat secara eksplisit.

## 6. State lengkap di semua komponen

Audit dan implementasikan yang relevan:

- default
- hover
- focus-visible
- active/pressed
- selected
- disabled
- loading
- empty
- error
- warning
- success
- saving/uncertain-save bila penyimpanan benar-benar ada

Toast sukses hanya boleh muncul setelah penyimpanan benar-benar berhasil. Jika penyimpanan belum tersedia, jangan berpura-pura menyimpan. Toast memiliki teks yang jelas, tidak menutupi tombol penting, dapat ditutup, dan durasinya masuk akal. Jangan menampilkan banyak toast tumpang tindih.

Modal harus accessible: fokus masuk ke dialog, Escape/backdrop mengikuti tingkat risiko, tombol memiliki label yang jelas, fokus kembali setelah modal ditutup, dan isi tidak meluber di viewport ponsel.

## 7. Motion dan micro-interactions

- Gunakan Motion yang sudah terpasang hanya untuk transisi singkat dan bermakna.
- Animasi tidak boleh menunda pekerjaan, mengganggu input, atau menggerakkan layout secara berlebihan.
- Toast/dialog/side drawer menggunakan transisi sederhana.
- Hormati `prefers-reduced-motion`.
- Jangan menambahkan ripple/glow/shake untuk setiap interaksi. Shaker hanya untuk error yang memang membutuhkan perhatian dan tidak boleh menjadi satu-satunya penanda error.

## 8. Aksesibilitas dan kualitas

- Pastikan contrast ratio teks normal minimal WCAG AA 4.5:1, teks besar minimal 3:1, serta kontrol nonteks/focus memiliki kontras yang memadai.
- Jangan memakai warna sebagai satu-satunya pembeda status.
- Semua field harus memiliki label yang terhubung, pesan error bisa dibaca screen reader, dan navigasi keyboard berfungsi.
- Klik target mobile idealnya minimal 44×44 CSS px.
- Uji 360×800, 390×844, 768×1024, 1280×800, dan 1440×900.
- Periksa overflow horizontal, modal, drawer, dropdown, toast, tabel, dan input saat keyboard mobile aktif.

## 9. Jangan mengubah fondasi bisnis/penyimpanan secara diam-diam

Spesifikasi TOKO SAKALA memisahkan **barang**, **hasil/untung**, dan **uang/setoran**. Semua angka turunan harus berasal dari aturan perhitungan yang sama. Riwayat harga dan transaksi tidak boleh ditimpa tanpa jejak.

Jika kode saat ini memakai `localStorage`, nyatakan secara jelas bahwa itu penyimpanan di browser dan bukan backup/database yang tahan kehilangan data. Jangan menyebutnya aman untuk data riil. Jangan mengganti backend atau skema database dalam tugas visual tanpa menyajikan konflik dan rencana migrasi terlebih dahulu.

Sebelum implementasi, laporkan temuan arsitektur yang berpotensi bertentangan dengan spesifikasi, lalu tetap fokus pada perbaikan UI yang tidak mengubah aturan keuangan.

## 10. Laporan profesional dan ekspor ke berbagai format

Perbaiki halaman **Laporan** dan implementasikan ekspor laporan yang benar-benar bekerja. Laporan harus rapi, serius, mudah diaudit, dan cocok untuk arsip bisnis. Ambil inspirasi dari mutu penyajian laporan perusahaan besar, tetapi jangan mengklaim laporan telah memenuhi PSAK/IFRS, audit independen, atau kewajiban pajak kecuali memang ditangani oleh modul akuntansi yang sesuai dan sudah diverifikasi. TOKO SAKALA saat ini adalah sistem pencatatan operasional toko.

### 10.1 Format ekspor

Sediakan format berikut hanya bila masing-masing benar-benar diimplementasikan dan dapat diuji:

- **PDF** — laporan siap cetak dan arsip resmi internal, layout A4 yang tertata, nomor halaman, tabel tidak terpotong, header/footer konsisten.
- **Excel `.xlsx`** — workbook terstruktur dengan beberapa sheet jika relevan, format angka/tanggal, filter tabel, lebar kolom, baris judul, freeze panes, subtotal, dan pengaturan cetak. Hindari menggabungkan cell berlebihan sehingga data sulit diolah.
- **CSV `.csv`** — data tabel untuk dibuka di spreadsheet atau sistem lain; UTF-8, header jelas, format tanggal stabil, escaping yang valid. Jelaskan pemisah kolom apabila menyediakan pilihan delimiter.
- **JSON `.json`** — ekspor data terstruktur/backup, terpisah jelas dari laporan presentasi. Validasi versi skema saat impor dan jangan menimpa data tanpa preview serta konfirmasi.
- **Cetak / Save as PDF** — print stylesheet yang menyembunyikan navigasi, tombol, filter UI, dan elemen dekoratif; gunakan page-break yang masuk akal.

Jangan menampilkan pilihan ekspor yang belum bekerja. Jika suatu format belum siap, tandai **Segera tersedia** atau sembunyikan hingga implementasi selesai. Hindari menambah dependensi sebelum memeriksa package yang sudah terpasang.

### 10.2 Jenis laporan

Sediakan pemilih laporan dengan bahasa sederhana dan filter tanggal/periode:

1. **Ringkasan usaha** — periode, penjualan barang, modal barang terjual, untung dari barang, pendapatan lain, pengeluaran operasional, keuntungan sesuai definisi engine, status kepastian, dan catatan penting.
2. **Penjualan dan keuntungan barang** — produk, jumlah terjual, harga jual yang berlaku, nilai penjualan, modal terjual, dan untung barang.
3. **Stok dan persediaan** — stok awal/tercatat, barang masuk, keluar karena terjual/rusak/dipakai/tidak diketahui, sisa fisik terakhir, nilai modal yang diketahui, dan status belum dicek.
4. **Pembelian dan restock** — tanggal, produk, jumlah kemasan, isi per kemasan saat pembelian, unit dasar, total biaya, sumber uang jika diketahui, serta riwayat harga beli.
5. **Pengeluaran dan pendapatan lain** — tanggal, kategori/deskripsi, nominal, sumber dan status kepastian jika relevan.
6. **Uang toko dan setoran** — uang seharusnya, setoran aktual (termasuk beberapa setoran dalam satu periode), selisih, status, komponen belum pasti, dan catatan penjelasan.
7. **Riwayat transaksi dan koreksi** — urutan kejadian, waktu kejadian/pencatatan, tipe, referensi pembatalan/koreksi, serta perubahan historis yang tersedia.

Jangan menciptakan laporan seolah-olah semuanya merupakan laporan akuntansi formal perusahaan. Nama dan rumus laporan harus mencerminkan definisi produk yang sudah disetujui. Jika data tidak cukup untuk menghitung suatu nilai, tunjukkan **Belum diketahui** atau **Perlu diperiksa**, bukan angka yang dibuat-buat.

### 10.3 Standar layout dokumen PDF

Setiap PDF harus memiliki:

- Nama toko dan identitas teks/logo bila aset resmi tersedia.
- Judul laporan yang spesifik.
- Periode awal–akhir dan zona waktu WIB bila relevan.
- Tanggal/waktu dibuat.
- Ringkasan metrik yang relevan, tidak semua KPI dimasukkan ke semua laporan.
- Tabel dengan judul kolom jelas, rata kiri untuk teks, rata kanan untuk angka, pemisah ribuan yang konsisten, dan simbol Rupiah.
- Subtotal/total dengan penekanan tipografi dan garis yang cukup; hindari warna latar gelap penuh yang boros tinta.
- Penanda status kepastian, data belum lengkap, dan koreksi periode bila relevan.
- Nomor halaman dan footer berisi nama laporan/periode; halaman lanjutan mengulang header tabel jika memungkinkan.
- Ruang tanda tangan hanya pada laporan internal yang memang memerlukan persetujuan; jangan membuat tanda tangan/stempel palsu.

Pilih orientasi portrait untuk laporan ringkas dan landscape untuk tabel lebar. Pastikan angka dan kolom tidak keluar dari batas halaman. Jangan menggunakan screenshot dashboard sebagai PDF laporan utama.

### 10.4 Standar workbook Excel

- Gunakan nama sheet pendek dan jelas, misalnya `Ringkasan`, `Penjualan`, `Stok`, `Belanja`, `Pengeluaran`, `Setoran`, dan `Riwayat` sesuai jenis laporan.
- Sheet pertama berisi informasi toko, nama laporan, periode, waktu ekspor, ringkasan angka, serta peringatan ketidakpastian.
- Tabel data memiliki header, autofilter, freeze panes, lebar kolom yang sesuai, format angka Rupiah, dan tanggal yang benar-benar bertipe tanggal jika format ekspor mengizinkan.
- Tidak boleh mengubah data numerik menjadi teks hanya demi tampilan. Bila rumus workbook digunakan, dokumentasikan dan pastikan nilai tidak bergantung pada formula yang belum dihitung. Jika lebih aman, ekspor nilai tervalidasi dari engine.
- Set print area, orientasi, margin, repeat header rows, dan skala halaman agar dapat dicetak tanpa pemotongan.
- Jangan menyertakan formula yang menjalankan makro, external links, atau konten aktif yang tidak diperlukan.

### 10.5 Satu sumber kebenaran

Semua laporan, dashboard, preview, dan ekspor harus memakai hasil dari **engine perhitungan yang sama**. Jangan menulis ulang rumus keuangan di komponen UI, pembuat PDF, atau pembuat Excel. Server/backend (jika tersedia) memvalidasi dan menghitung ulang sebelum ekspor data final. Jika aplikasi masih menggunakan localStorage, labeli ekspor sebagai berasal dari data perangkat saat ini dan jelaskan bahwa JSON ekspor bukan backup otomatis.

Bekukan parameter laporan sebelum ekspor: jenis laporan, rentang tanggal, zona waktu, filter produk/kategori, status data, dan format. Isi hasil file harus cocok dengan preview yang dilihat pengguna.

### 10.6 Alur ekspor

1. Pengguna membuka **Laporan**.
2. Memilih jenis laporan dan rentang waktu.
3. Sistem menampilkan preview laporan dan menjelaskan bagian yang belum pasti.
4. Pengguna memilih **Ekspor PDF**, **Excel**, **CSV**, **JSON/Backup**, atau **Cetak** sesuai dukungan yang tersedia.
5. Sistem menunjukkan status proses yang benar; tombol tidak boleh menampilkan sukses sebelum file benar-benar dihasilkan.
6. Beri nama file konsisten, misalnya `TOKO-SAKALA_Ringkasan-Usaha_2026-10-01_2026-10-31.pdf`.
7. Bila tidak ada data, rentang tanggal salah, atau ekspor gagal, tampilkan empty/error state yang memberi jalan perbaikan. Jangan mengunduh file kosong atau rusak seolah sukses.

### 10.7 Kriteria penerimaan ekspor

- Preview dan hasil ekspor memuat angka yang identik untuk filter yang sama.
- Total baris dapat dicocokkan ke data sumber.
- Tidak ada row yang terpotong, jumlah yang disembunyikan, kolom tertukar, atau angka yang salah format.
- PDF bisa dibuka, dicetak, memiliki paginasi yang benar, dan tabel lebar tidak terpotong.
- XLSX bisa dibuka di aplikasi spreadsheet umum, memiliki sheet yang sesuai dan angka tetap numerik.
- CSV bisa dibaca ulang dengan encoding yang benar dan tidak merusak koma/kutip/newline dalam nama produk.
- JSON lolos validasi skema dan impor menampilkan preview serta konfirmasi sebelum mengganti data.
- Data belum diketahui/perlu diperiksa selalu ditandai.
- Uji ekspor kasus tanpa data, data panjang, nama produk sangat panjang, nilai Rupiah besar, periode panjang, dan data yang mengandung karakter khusus.
- Bila dependensi ekspor belum tersedia, tulis implementasi dan test plan yang jelas; jangan berpura-pura fitur sudah selesai.

## 11. Urutan eksekusi

Kerjakan berurutan tanpa berhenti pada audit saja:

1. Audit source code saat ini dan daftar temuan singkat.
2. Buat/refactor semantic design tokens untuk Light dan Dark.
3. Perbaiki fondasi tipografi, spacing, button, input, badge/status, card, table, dialog, toast, skeleton, dan empty state.
4. Perbaiki App frame, sidebar, topbar, drawer, serta mobile bottom nav.
5. Perbaiki seluruh screen satu per satu memakai token yang sama.
6. Pastikan seluruh state dan tema bekerja.
7. Jalankan lint/typecheck/test/build yang tersedia. Perbaiki error yang ditemukan.
8. Periksa responsive overflow dan accessibility sejauh alat yang tersedia.
9. Beri laporan akhir: file berubah, temuan yang diselesaikan, test yang benar-benar dijalankan, hasil test, dan risiko yang masih ada.

## 12. Kriteria selesai

- Light Mode terasa dirancang secara khusus, memiliki kedalaman dan kontras yang nyaman, bukan sekadar background putih.
- Dark Mode tetap konsisten dan tidak rusak.
- Semua layar menggunakan token semantic yang sama.
- Tampilan desktop, tablet, dan ponsel tertata dengan baik.
- State loading/empty/error/success konsisten.
- Teks dan angka finansial mudah dibaca.
- Tidak ada data simulasi yang menyamar sebagai transaksi nyata.
- Perilaku dan aturan perhitungan tidak berubah tanpa persetujuan.
- Tidak ada klaim tes atau penyimpanan yang tidak terbukti.

Mulai dengan mengaudit kode yang ada, lalu implementasikan perbaikannya pada file repository secara langsung. Jangan hanya memberikan saran, jangan membuat mockup terpisah, dan jangan mengganti keseluruhan aplikasi tanpa alasan teknis yang kuat.
