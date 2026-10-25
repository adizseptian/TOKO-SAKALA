# Panduan & Prompt Pengembangan Aplikasi (Google AI Studio)

Dokumen ini berisi daftar alat **100% Gratis / Open-Source**, daftar pembaruan fitur yang dapat diterapkan pada aplikasi Anda, serta **Master Prompt** yang siap digunakan di Google AI Studio.

---

## 1. Alat & Referensi Terpilih (100% Gratis & Open-Source)

Berikut adalah referensi pilihan dari daftar sebelumnya yang sepenuhnya gratis (bebas berlangganan) dan sangat cocok untuk membangun serta menyempurnakan aplikasi secara modern:

### A. UI Components & Frameworks
* **[shadcn/ui](https://ui.shadcn.com)**: Komponen UI open-source, sangat populer, terintegrasi dengan Tailwind CSS, dan sepenuhnya dapat disesuaikan.
* **[DaisyUI](https://daisyui.com)**: Plugin Tailwind CSS gratis dengan tema siap pakai untuk mempercepat pembuatan antarmuka.
* **[Uiverse](https://uiverse.io)**: Komponen CSS/HTML gratis buatan komunitas (tombol, card, loader, input).
* **[Aceternity UI](https://ui.aceternity.com)**: Komponen animasi modern gratis berbasis React & Tailwind CSS.

### B. Animasi & Interaktivitas
* **[Motion (Framer Motion)](https://motion.dev)**: Library animasi terpopuler untuk React, gratis dan open-source.
* **[Animista](https://animista.net)**: Generator animasi CSS instan yang dapat langsung di-copy-paste.
* **[LottieFiles](https://lottiefiles.com)**: Animasi ringan berformat Lottie/JSON (tersedia pustaka gratis yang sangat luas).

### C. Desain, Warna, & Tipografi
* **[Google Fonts](https://fonts.google.com)**: Layanan font gratis terlengkap untuk web dan seluler.
* **[Fontshare](https://www.fontshare.com)**: Font kualitas tinggi gratis dari Indian Type Foundry.
* **[Coolors](https://coolors.co)** & **[CSS Gradient](https://cssgradient.io)**: Pembuat palet warna dan efek gradien CSS gratis.

### D. Pengujian & Optimasi Performance
* **[PageSpeed Insights](https://pagespeed.web.dev)**: Alat analisis kecepatan dan skor SEO gratis dari Google.
* **[WebPageTest](https://www.webpagetest.org)**: Pengujian performa web mendalam lintas browser dan perangkat.

---

## 2. List Pembaruan & Fitur Yang Bisa Diterapkan

Berikut adalah aspek pembaruan yang dapat diterapkan ke aplikasi Anda untuk meningkatkan pengalaman pengguna (UX) dan kualitas teknis:

1. **Modernisasi UI dengan System Component**:
   * Mengganti komponen bawaan dengan **shadcn/ui** atau **DaisyUI** agar tampilan konsisten, responsif, dan rapi.
   * Menambahkan *Dark Mode* / *Light Mode* toggle secara otomatis.
2. **Peningkatan Mikro-Interaksi & Animasi**:
   * Menggunakan **Motion (Framer Motion)** untuk efek *fade-in*, *page transition*, dan animasi *modal/dialog*.
   * Menggunakan **Animista** atau **Uiverse** untuk efek tombol *hover*, *loading state*, dan *card animations*.
3. **Penyempurnaan Hirarki Visual & Tipografi**:
   * Mengadopsi kombinasi font modern dari **Fontshare** (seperti *Satoshi*, *General Sans*, atau *Clash Display*) untuk memperkuat identitas brand.
   * Menerapkan variabel warna CSS gradien yang konsisten menggunakan palet dari **Coolors**.
4. **Optimasi Performa & Aksesibilitas (a11y)**:
   * Mengoptimalkan *core web vitals* berbasis skor **PageSpeed Insights** (lazy loading gambar, minimalisir CSS/JS).
   * Memastikan kepatuhan aksesibilitas UI (skema kontras warna yang tepat, navigasi keyboard, aria-label).

---

## 3. Master Prompt untuk Google AI Studio

Gunakan prompt di bawah ini pada **Google AI Studio** (Gemini 1.5 Pro / Flash) untuk membangun atau memperbarui aplikasi Anda secara menyeluruh.

```text
Kamu adalah seorang Senior Full-Stack Engineer dan UI/UX Designer berpengalaman. 
Tugasmu adalah membangun dan menyempurnakan aplikasi web modern dari skrip/aplikasi yang ada, dengan memanfaatkan sistem desain dan pustaka komponen open-source terkini.

### 1. BATASAN & SYARAT UTAMA:
- Seluruh pustaka, library, dan komponen yang digunakan HARUS 100% GRATIS dan OPEN-SOURCE (misalnya: Tailwind CSS, shadcn/ui, DaisyUI, Framer Motion, Google Fonts, Lucide Icons).
- TIDAK BOLEH menggunakan layanan berbayar, kredensial berbayar, atau API yang membutuhkan berlangganan.

### 2. REFERENSI ARSITEKTUR & STACK TEKNOLOGI:
- UI Framework & Styling: Tailwind CSS dengan komponen berbasis shadcn/ui atau DaisyUI.
- Iconography: Lucide-React / Lucide-Icons.
- Animasi & Transisi: Motion (Framer Motion) untuk transisi halaman/elemen dan CSS keyframes dari Animista untuk mikro-interaksi tombol & loader.
- Tipografi & Warna: Menggunakan Google Fonts / Fontshare dengan skema warna CSS variables yang mendukung Dark Mode & Light Mode.
- Komponen Unik: Elemen UI tambahan terinspirasi dari Uiverse (seperti kustomisasi form input & efek hover).

### 3. TUGAS & RUANG LINGKUP PENGERJAAN:
1. **Pembaruan Antarmuka (UI/UX)**:
   - Restrukturisasi antarmuka aplikasi menjadi modern, bersih, dan fully-responsive (Mobile & Desktop).
   - Tambahkan state visual yang jelas: Loading State, Empty State, Error State, dan Success Notification/Toast.
2. **Peningkatan Animasi & Interaktivitas**:
   - Berikan animasi halus pada elemen antarmuka saat muncul (fade-in/slide-up) dan saat diinteraksi pengguna.
3. **Optimalisasi Kode & Struktur**:
   - Tulis kode secara modular, bersih (clean code), dan terstruktur rapi.
   - Pastikan performa tinggi, aksesibel (WCAG compliant), dan mudah dipelihara.

### 4. FORMAT OUTPUT:
- Berikan struktur file lengkap beserta kode penuh yang siap dijalankan tanpa error.
- Berikan penjelasan singkat tentang cara menjalankan aplikasi dan pustaka gratis apa saja yang diinstal/digunakan.

---
[TEMPATKAN KODE APLIKASI SAAT INI ATAU DESKRIPSI DETAIL APLIKASI YANG INGIN DIBUAT DI SINI]
```

---