# 04 — REFERENCE RESEARCH & BENCHMARK MATRIX (MODE A — TOKO SAKALA)

**Tanggal Riset:** 13 November 2026  
**Sumber Akses:** Penelusuran web publik ke dokumentasi resmi produk POS, aplikasi pembukuan UMKM Indonesia, panduan sistem desain, dan standar aksesibilitas.  
**Prinsip Kejujuran Anti-Fabrikasi:** Hanya pola yang **terverifikasi langsung dari sumber publik yang dapat diakses** yang dicantumkan dalam tabel perbandingan di bawah. Situs yang memerlukan autentikasi/langganan dicatat jujur pada Bagian 3.

---

## 1. Ringkasan Eksekutif Riset

Riset membandingkan **7 referensi yang berhasil diakses publik** (Square POS, Shopify POS, Loyverse POS, majoo, BukuWarung / Kasir Pintar, Figma Design Tokens/UI Kits Docs, dan Apple HIG + WCAG 2.2) untuk memecahkan masalah spesifik TOKO SAKALA:
1. Input hitung stok & konversi satuan ganda tanpa mencampur unit fisik;
2. Rekonsiliasi setoran uang tunai shift kasir + pencegahan kehilangan data offline;
3. Keterbacaan angka finansial satu tangan di HP Android 320–430 px yang memenuhi WCAG 2.2 AA.

---

## 2. Matriks Perbandingan Referensi Terverifikasi

| Referensi (URL & Tanggal Akses) | Pola yang Diamati (Actual Pattern) | Masalah Pengguna yang Diselesaikan | Kecocokan untuk TOKO SAKALA | Keputusan (`ADAPT` / `REJECT`) & Alasan |
|---|---|---|---|---|
| **1. Square POS** (`squareup.com/help` — Unit conversion, Stock counts, Cash drawer — *diakses 13 Nov 2026*) | Memisahkan **base stock unit** dan **secondary unit** (mis. box/pack ke satuan dasar) saat penerimaan barang; membedakan **Full Count** (item tak dihitung menjadi 0!) vs **Cycle Count** (item tak dihitung dibiarkan utuh); menerapkan tahap **Review & Approval** sebelum stok commit; mencatat *Paid In / Paid Out* terpisah dari penjualan. | Mencegah kasir/pemilik secara tidak sengaja meng-nol-kan barang yang hanya belum sempat dihitung, serta mencegah tercampurnya uang belanja laci dengan omzet penjualan. | **Sangat Tinggi** | **`ADAPT` (Cycle Count semantics & Review screen); `REJECT` (Auto-zero Full Count):** Adaptasi pemisahan unit beli vs unit dasar, konfirmasi pratinjau sebelum simpan stok, serta pencatatan kas masuk/keluar terpisah. **Tolak** perilaku menganggap kolom kosong (`blank`) sebagai `0`. |
| **2. Shopify POS** (`help.shopify.com` — Stock counts & scheduled variance review — *diakses 13 Nov 2026*) | Proses hitung stok dipisah menjadi status *Scheduled / In-progress ("Counted by")* dan **tidak langsung mengubah nilai inventori** sebelum melewati layar tinjauan selisih (*variance review*) dan konfirmasi admin. | Mengurangi kesalahan fatal salah ketik saat menghitung di rak toko yang ramai/terinterupsi. | **Tinggi** | **`ADAPT`:** Pertahankan prinsip *"Pratinjau — belum disimpan"* (`stock-check-preview.ts`) yang menampilkan perubahan stok & indikasi selisih sebelum tombol simpan final ditekan. |
| **3. Loyverse POS** (`help.loyverse.com` — Shift Management & Working Offline — *diakses 13 Nov 2026*) | Pencatatan shift kasir (*Pay In / Pay Out*, *Expected Cash vs Actual Cash*) tetap berjalan saat offline dengan penandaan eksplisit status **`Unsynced`** per transaksi, plus peringatan eksplisit agar **tidak logout/hapus data lokal sebelum sinkronisasi selesai** serta menonaktifkan fitur yang bergantung server saat offline. | Menghindari ilusi palsu bahwa data offline sudah masuk server (yang membuat user berani ganti perangkat/hapus cache dan kehilangan catatan hari itu). | **Sangat Tinggi** | **`ADAPT`:** Terapkan badge jujur `"Tersimpan lokal · Menunggu sinkron"` saat ada antrean outbox/belum terverifikasi server (memperbaiki bug `pendingCount: 0` di `syncEngine.ts:84`) serta peringatan sebelum hapus cache/logout. |
| **4. majoo Indonesia** (`majoo.id` / dokumentasi fitur inventori UMKM — *diakses 13 Nov 2026*) | Alur *Stok Opname* memakai input langsung *Stok Aktual* per SKU yang otomatis menghitung selisih tercatat dan memperbarui HPP/biaya rata-rata, dilengkapi multi-satuan dan penyesuaian barang rusak/keluar terpisah. | Mempermudah pemilik toko Indonesia membandingkan fisik rak vs catatan tanpa membuat rumus manual. | **Tinggi** | **`ADAPT` (Istilah & Alur Opname); `REJECT` (Kepadatan tabel desktop):** Adaptasi bahasa stok opname/barang rusak berbahasa Indonesia sederhana. **Tolak** tata letak tabel multi-kolom lebar yang sesak di layar HP `320–430 px`. |
| **5. BukuWarung / Kasir Pintar** (`bukuwarung.com`, `kasirpintar.co.id` — *diakses 13 Nov 2026*) | Memakai istilah warung/toko lokal yang sangat membumi (*Modal, Jual, Untung, Pengeluaran, Catat Utang/Kas*), ringkasan harian langsung di layar awal, serta kartu pencatatan cepat satu-tangan. | Menurunkan hambatan belajar pemilik toko kelontong/UMKM pemula yang tidak berlatar belakang akuntansi. | **Tinggi** | **`ADAPT` (Gaya Bahasa Pemula); `REJECT` (Simplifikasi Laba Berlebih):** Ambil kemudahan kosakata Indonesianya, tetapi **tolak** penyederhanaan yang mencampur kas laci dengan laba bersih atau menyembunyikan modal terjual (wajib ikut 9 langkah PRD/DR-016). |
| **6. Figma Design Tokens & Variable Modes** (`help.figma.com` — *diakses 13 Nov 2026*) | Arsitektur token 3-lapis (**Primitive -> Semantic -> Component tokens**) dengan Variable Modes untuk Light/Dark theme dan penetapan radius/stroke/spacing konsisten. | Menghilangkan `754` inline style & ratusan hex acak lintas 18 modal dan 10 layar agar tema gelap & aksesibilitas konsisten. | **Sangat Tinggi** | **`ADAPT`:** Gunakan arsitektur 3-lapis token di `05_DESIGN_SYSTEM_SPEC.md` (`--paper`, `--ink`, `--orange`, dll. -> semantic tokens -> component specs) sehingga tidak ada hex mentah seperti `#dc2626` di `App.tsx`. |
| **7. Apple HIG & W3C WCAG 2.2** (`developer.apple.com/design/human-interface-guidelines`, `w3.org/TR/WCAG22/` — *diakses 13 Nov 2026*) | Apple HIG mewajibkan target sentuh minimal **`44×44 pt`** untuk seluruh tombol interaktif. WCAG 2.2 Level AA mewajibkan **SC 2.5.8** target min `24×24 CSS px` (kami tetap pakai `44×44 px` sesuai G4), **SC 2.5.7** (*Dragging Movements* — semua aksi geser wajib punya alternatif klik tunggal), **SC 2.4.11** (*Focus Not Obscured* — fixed dock/sticky bar tidak boleh menutupi elemen berfokus), serta kontras teks normal **`>= 4.5:1`** dan teks besar **`>= 3.0:1`**. | Menjamin kasir dapat menekan tombol pecahan/stepper cepat dengan satu jempol tanpa salah pencet dan pengguna keyboard/low-vision tetap aman. | **Wajib (Mandatori)** | **`ADAPT` 100%:** Terapkan target `>= 44×44 px` pada stepper Setoran (`32×34 px` saat ini gagal), alternatif klik untuk semua bottom sheet/gestur, serta koreksi kontras tombol oranye & dark cobalt. |

---

## 3. Referensi yang TIDAK Dapat Diakses (Anti-Fabrikasi)

Sesuai komitmen kejujuran Mode A, berikut sumber yang disebut dalam arahan eksplorasi awal namun **tidak dapat diaudit secara interaktif karena berbayar/memerlukan akun login**:

1. **Mobbin (`mobbin.com`):** Terkunci di balik paywall & login akun; galeri screenshot mobile app 2025/2026 tidak dapat ditelusuri. **Status:** *Tidak dapat diakses (memerlukan login/langganan).*
2. **Figma Community Interactive Files (`figma.com/community`):** Preview interaktif inspeksi layer/spacing file UI Kit pihak ketiga memerlukan autentikasi Figma; hanya dokumentasi resmi publik sistem token Figma (`help.figma.com`) yang diverifikasi di tabel di atas. **Status:** *File interaktif tidak dapat diakses (memerlukan login).*
3. **Threads (`threads.net`) / Diskusi Tertutup Komunitas UI/UX:** Konten diskusi dan utas visual di balik login wall tidak dapat ditelusuri penuh tanpa akun aktif. **Status:** *Tidak dapat diakses secara penuh (memerlukan login).*

---

## 4. Kesimpulan Implementatif untuk Desain TOKO SAKALA

1. **Jangan tiru UI "dashboard gelap mewah / kaca transparan":** Bukti dari *TOKO MODE G4* (`LOCKED`) + *Loyverse/Square* menunjukkan bahwa kejelasan angka di kondisi toko terang, batas tegas `1.5px` ink, pemisahan visual antara pratinjau vs tersimpan, dan status offline/unsynced yang jujur jauh lebih bernilai daripada efek glassmorphism/pulse.
2. **Alur rekonsiliasi Setoran** di `App.tsx:3749–4113` sudah sejalan dengan pola kasir Square/Loyverse, hanya perlu menaikkan stepper dari `32×34 px` ke `44×44 px`, menghilangkan glow, memperbaiki akurasi `Target Buku`, dan memisahkan kontras aksesibel.
3. **Alur Stok & Catat Belanja** wajib menyambungkan modul *variance preview* (`stock-check-preview.ts` & `purchase-preview.ts`) agar menyamai standar keamanan review sebelum simpan seperti Shopify POS & Square POS.
