# TOKO SAKALA — MASTER SPECIFICATION DOSSIER v1.0

**Konsolidasi diskusi sampai 21 Oktober 2026**

Dokumen gabungan 16 bagian. Status LOCKED/PENDING/NOT VERIFIED dipertahankan agar keputusan yang belum disahkan tidak tampak final.


---

# 01 — PRD TOKO SAKALA

**Nama produk:** TOKO SAKALA  
**Versi kompilasi:** 1.0  
**Status dokumen:** Konsolidasi; fondasi produk/UX terkunci, beberapa revisi bisnis dan penutupan periode menunggu lock eksplisit.  
**Audiens:** Product owner, implementer, reviewer, tester.

## 1. Ringkasan produk

TOKO SAKALA adalah webapp pribadi untuk membantu pemilik toko mencatat barang, belanja, sisa stok, barang rusak/dipakai, pengeluaran, pendapatan lain, setoran, serta melihat hasil usaha tanpa harus memahami akuntansi.

**Prinsip terkunci:** “Jangan membuat pengguna memahami sistem. Buat sistem yang memahami pengguna.” Prinsip pendamping: “Yang terlihat mudah. Yang sulit dikerjakan sistem.”

Pengguna mencatat kejadian sehari-hari. Sistem mengubahnya menjadi data terstruktur, menghitung hasil, memeriksa ketidakcocokan, menjaga histori, dan menjelaskan angka dengan bahasa sehari-hari.

## 2. Tujuan

1. Mengurangi pekerjaan pencatatan berulang.
2. Menjadikan stok fisik sebagai input sederhana dan barang terjual sebagai hasil hitung, bukan kewajiban mengetik penjualan satu per satu.
3. Memisahkan keuntungan, uang toko, dan setoran secara ketat.
4. Menjaga semua perubahan penting agar dapat ditelusuri dan dikoreksi.
5. Memudahkan pemeriksaan harian/mingguan dan ekspor laporan.
6. Berangkat dari aplikasi inti tanpa AI, lalu menambahkan bantuan pintar setelah core teruji.

## 3. Pengguna dan konteks

- **Pengguna utama:** pemilik/operator satu toko, satu orang pada satu komputer.
- **Kemampuan:** tidak diasumsikan memahami istilah finansial/akuntansi.
- **Perangkat:** desktop lebih diutamakan untuk administrasi; layar ponsel harus responsif untuk input cepat.
- **Privasi:** penggunaan pribadi/local-first pada lapisan aplikasi; database nyata diarahkan ke satu proyek Supabase Free setelah seluruh gerbang keamanan dan pemulihan dipenuhi.
- **Tanpa login** pada rancangan awal. Ini bukan berarti akses otomatis aman: aplikasi tidak boleh dipublikasikan atau dibuka melalui LAN/tunnel. Host guard, binding localhost, dan pengujian akses wajib sebelum data nyata.

## 4. Pekerjaan utama pengguna

1. Menambahkan barang dan informasi kemasan.
2. Mencatat belanja/restock.
3. Memasukkan jumlah sisa barang fisik.
4. Mencatat barang rusak atau dipakai.
5. Mencatat biaya toko dan pendapatan tambahan.
6. Mencatat setoran uang yang benar-benar diserahkan.
7. Mengetahui hasil, status setoran, dan alasan adanya selisih.
8. Melihat/mengunduh laporan per periode.

## 5. Cakupan MVP

### Termasuk

- Setup toko dan barang.
- Satuan pembelian kemasan → satuan dasar jual (MVP: satuan jual tunggal dan bilangan bulat, biasanya pcs).
- Pembelian dan restock kapan pun tanpa membuat periode baru.
- Cek sisa barang dan perhitungan penjualan dari interval cek.
- Barang rusak, barang dipakai, serta barang berkurang yang penyebabnya tidak diketahui.
- Riwayat harga beli, isi kemasan, dan harga jual.
- Pengeluaran toko, pendapatan lain, setoran satu kali atau beberapa kali per periode.
- Preview sebelum simpan; konfirmasi dan undo/batal sesuai status periode.
- Periode, snapshot, koreksi terhubung ke asal, audit trail.
- Dashboard ringkas, laporan periode, ekspor data/laporan.
- Kesalahan validasi/koneksi dalam Bahasa Indonesia sederhana.

### Di luar MVP

- POS dan pencatatan setiap transaksi pelanggan.
- QRIS/transfer/non-tunai dan piutang pelanggan.
- Pembelian kredit/cicilan pemasok.
- Multi-cabang, multi-pengguna, login/otorisasi berbasis akun.
- Diskon/retur kompleks, barang titipan, bonus supplier, jual dengan beberapa satuan atau satuan pecahan.
- AI, OCR nota, chat command, smart restock/insight otomatis.
- Offline queue/PWA dan hosting publik.
- Integrasi bank, akuntansi penuh, atau fitur ERP.

## 6. Prinsip perhitungan dan aturan bisnis

### Tiga dunia wajib dipisahkan

- **BARANG:** jumlah unit fisik dan nilai modal persediaan.
- **HASIL/UNTUNG:** penjualan dan pendapatan, dikurangi modal barang terjual, barang rusak/dipakai/selisih stok, serta pengeluaran toko sesuai aturan.
- **UANG:** aliran uang tunai yang benar-benar diasumsikan masuk/keluar, termasuk sumber uang untuk pembelian/pengeluaran dan setoran aktual.

Keuntungan ≠ uang toko ≠ setoran. Setoran adalah nominal aktual yang diserahkan; ia bukan pendapatan baru.

### Rumus pokok

- `pcs_masuk = jumlah_kemasan × isi_per_kemasan`.
- `stok_tersedia = stok_acuan_terakhir + barang_masuk − pengeluaran_stok_nonpenjualan_tercatat`.
- `terjual = stok_tersedia − stok_fisik_sisa`, hanya valid jika `0 ≤ terjual ≤ stok_tersedia`.
- `penjualan = terjual × harga_jual_berlaku`, dengan ketidakpastian jika interval melintasi perubahan harga.
- `modal_barang_terjual` memakai **rata-rata bergerak** atas modal yang diketahui; tidak menggunakan FIFO untuk MVP.
- `untung = penjualan + pendapatan_lain − modal_barang_terjual − kerugian_rusak − nilai_barang_dipakai − nilai_selisih_barang − pengeluaran_toko`.
- `uang_toko_kumulatif = uang_masuk − uang_keluar − setoran ± koreksi_kas`, dengan uang keluar dikurangi dari saldo hanya jika sumbernya uang toko.
- `selisih_setoran = setoran_aktual − uang_seharusnya`.

Rumus harus diterapkan oleh satu engine bersama. Nilai rupiah disimpan sebagai integer rupiah; modal per unit boleh tampil pecahan, tetapi nilai sumber total dan jumlah unit menjadi sumber kebenaran untuk menghindari kebocoran pembulatan.

### Pembelian dari uang toko/pribadi

Sumber uang memengaruhi perhitungan uang, bukan jumlah barang atau modal pembelian. Aplikasi bertanya pada transaksi relevan pertama; jawaban menjadi preferensi awal yang dapat diubah pada setiap kejadian. Sumber transaksi disimpan sebagai snapshot historis. Sistem tidak boleh mengasumsikan sumber diam-diam. Sumber awal pilihan masih perlu ditentukan oleh pengguna pada implementasi pertama.

### Ketidakpastian

Setiap nilai penting membawa tingkat kepastian: **Pasti**, **Perlu Diperiksa**, atau **Belum Diketahui**. Nilai turunan tidak boleh memiliki kepastian lebih tinggi daripada komponen terlemahnya. Sistem tidak boleh mengarang modal awal, jumlah stok, sumber uang, alasan selisih, atau harga historis.

## 7. Status setoran

- **COCOK:** jumlah cocok dan seluruh komponen yang memengaruhi kesimpulan dapat dipastikan.
- **PERLU DIPERIKSA:** ada ketidakpastian, kemungkinan rentang, atau komponen belum terkonfirmasi—meskipun selisih yang ditampilkan nol.
- **BELUM COCOK:** terdapat selisih yang tidak dapat diterangkan ketika komponen terkait semuanya pasti.
- **MENUNGGU SETORAN:** setoran belum dicatat/lengkap; tidak boleh disebut cocok.

Sistem menyebut “ada selisih” dan memberi kemungkinan pemeriksaan secara netral, bukan tuduhan kehilangan/pengambilan uang.

## 8. Periode

Arah yang disepakati adalah periode mingguan Senin–Minggu dalam WIB; uang dihitung kumulatif, sedangkan periode menjadi jendela laporan. Restock tidak mereset periode. Periode boleh ditutup sebagian dan snapshot historis harus beku.

**Belum terkunci:** perilaku final jika pengguna menutup periode sebelum akhir minggu kalender. Kandidat TRD v3: akhir segmen menjadi waktu penutupan dan segmen selanjutnya mulai pada waktu tersebut sehingga tanpa celah/tumpang tindih. Kandidat ini tidak boleh dianggap final sebelum konflik antara minggu kalender dan segmen penutupan disetujui.

## 9. Koreksi dan histori

- Kejadian finansial/stok bersifat append-only.
- Edit menghasilkan versi baru; pembatalan menghasilkan void/cancellation record; tidak menimpa atau menghapus jejak asal.
- Periode terbuka boleh dikoreksi lewat versi/void yang terlacak.
- Periode tertutup tidak diubah diam-diam. Koreksi menjadi pembalikan + entri baru pada periode berjalan, terkait ke kejadian/periode asal; snapshot lama tetap sama.
- Undo setelah penyimpanan adalah pencatatan pembatalan; pembatalan tidak bisa di-undo langsung. “Catat ulang” membuat kejadian baru.

## 10. UX dan bahasa

- Bahasa UI utama: Bahasa Indonesia sehari-hari.
- Hindari istilah pada layar utama: HPP, COGS, gross profit, debit/kredit, jurnal, batch, stock ledger, rekonsiliasi, variance.
- Bahasa pengguna: modal barang, untung, uang dari penjualan, pengeluaran toko, pendapatan lain, sisa barang, setoran, selisih, perlu diperiksa.
- Dashboard menjawab maksimal lima hal: kondisi toko, uang seharusnya, status setoran, untung, dan hal yang perlu diperiksa.
- Informasi bertingkat: Level 1 ringkas; Level 2 “Kenapa?”; Level 3 “Lihat perhitungan”; Level 4 riwayat/peristiwa/teknis.
- Form input fokus; satu tindakan utama; pertanyaan hanya saat diperlukan.
- Live preview dua sisi: kiri barang & hasil; kanan uang & setoran; di ponsel menjadi susunan vertikal.
- Konfirmasi tersimpan ringkas dan menawarkan Undo bila masih aman.

## 11. Keberhasilan produk

MVP memenuhi tujuan jika:

- Pengguna dapat menyelesaikan alur belanja → cek sisa → kejadian lain → setoran → melihat hasil tanpa memahami akuntansi.
- Golden tests hitung-tangan lulus 100%.
- Rumus preview identik dengan rumus server dan hasil database.
- Data tidak ditimpa diam-diam, dan koreksi dapat ditelusuri.
- Setoran menampilkan status berdasarkan nilai serta kepastian, bukan warna saja.
- Laporan secara jelas menandai barang/modal yang belum diketahui.
- Backup dan restore telah diuji sebelum data toko sebenarnya dipakai.
- Keamanan localhost dan database diuji secara negatif maupun positif.

## 12. Prioritas produk yang disetujui

**Arah UI:** Pendekatan B — sederhana tetapi modern.  
**Prioritas tahap pertama:** keseimbangan antara kemudahan dan akurasi.  
**Urutan:** integritas data/perhitungan → kemudahan → hierarchy/keterbacaan → keamanan/pemulihan → keindahan/motion.

## 13. Batas status dokumen

PRD v1.0 merupakan baseline yang sebelumnya dikunci. PRD v1.1 dan konsolidasi ini adalah pembaruan/dossier kerja, bukan bukti otomatis bahwa semua bagian baru telah dikunci. Batas periode saat tutup lebih awal, sumber uang default awal, dan butir APPFLOW §22 harus diselesaikan dalam register keputusan sebelum disebut final.

---

# 02 — TRD TOKO SAKALA

**Status:** Revisi TRD v3 yang dikonsolidasikan; belum final/locked sampai PRD, APPFLOW, BUILD ORDER, dan gerbang data nyata selaras.  
**Tujuan:** menetapkan stack, aliran data, keamanan, database, dan perilaku kegagalan secara dapat diuji.

## 1. Baseline teknis

- Next.js App Router dalam mode server lokal.
- TypeScript strict.
- Tailwind CSS v4 dan shadcn/ui dengan basis Radix.
- Zod untuk validasi data pada batas UI/server.
- PostgreSQL melalui satu proyek Supabase Free untuk data nyata.
- PostgreSQL lokal/Supabase CLI untuk pengembangan dan pengujian; data uji tidak dimasukkan ke proyek cloud data nyata.
- GitHub untuk version control; pnpm untuk package manager.
- Vitest untuk unit/golden tests; pengujian SQL/PostgreSQL untuk constraint/RPC; Playwright dan axe untuk E2E serta aksesibilitas.
- Migration SQL di repo; perubahan schema lewat migration, bukan klik manual di dashboard.
- Tidak perlu AI, LLM eksternal, atau OCR untuk MVP.

Versi paket harus dipilih dan direkam berdasarkan dokumentasi/lockfile aktual saat implementasi. Jangan menyalin angka versi historis dari draft tanpa verifikasi.

## 2. Model penggunaan dan penempatan

Aplikasi pribadi berjalan di komputer pemilik dan hanya mengikat `127.0.0.1`. Tidak ada login untuk MVP, tidak ada demo, tidak ada deployment publik, tunnel, port forwarding, atau akses LAN. Database data nyata berada di satu proyek Supabase Free hanya setelah *Data Real Gate* lulus. Karena tanpa login, keamanan aplikasi bergantung pada pembatasan proses lokal, penjagaan Host/origin, rahasia di server, serta kontrol database.

**Tidak boleh dipublikasikan ke Vercel atau host publik berdasarkan dokumen ini.** Jika ingin akses dari ponsel melalui jaringan atau akses jarak jauh, arsitektur dan kontrol identitas harus ditinjau ulang sebelum perubahan.

## 3. Aliran baca

1. Browser meminta halaman/rute kepada server lokal.
2. Server membaca event dan snapshot yang relevan melalui koneksi database server-only.
3. Engine deterministik menghitung angka untuk layar dan menyertakan status kepastian serta struktur penjelasan.
4. Browser menerima hanya data yang diperlukan. Tidak ada data uang yang disimpan dalam persistent client cache.

## 4. Aliran tulis

1. UI mengumpulkan kejadian dalam form terstruktur.
2. Zod memvalidasi bentuk, tipe, dan batas nilai.
3. Preview dibuat memakai engine yang sama dengan jalur save.
4. Pengguna meninjau preview dan mengonfirmasi.
5. Server memvalidasi ulang input dan menghitung ulang dengan versi data yang diharapkan.
6. Server mengirim satu command ber-ID stabil ke RPC Postgres.
7. RPC memeriksa idempotensi, versi data, rantai versi, status periode, dan menginsert event/detail secara atomik.
8. Server mengembalikan hasil authoritative. Preview dan hasil yang berbeda adalah bug yang perlu direkam.

Tidak ada penulisan DB langsung dari browser. Tidak ada secret/service-role key di browser.

## 5. Aliran tutup periode

1. Pengguna meminta tutup periode dan memilih kelengkapan: lengkap/sebagian.
2. Sistem menunjukkan daftar hal yang belum diketahui dan ringkasan setoran.
3. Jika diminta, sistem menunjukkan pilihan mengenai selisih dan konfirmasi.
4. Server menghitung snapshot dengan versi engine, memeriksa input sequence yang diharapkan, dan menutup periode di satu transaksi/RPC.
5. Snapshot, status, dan penyesuaian kas yang dipilih disimpan atomik.
6. Periode tertutup beku; koreksi berikutnya tidak mengedit snapshot.

Kelayakan penutupan, perilaku early-close, dan kesinambungan segmen mesti mengikuti keputusan periode yang sudah disahkan. Sampai konflik itu diputuskan, implementasi kalender/segmen tidak boleh dianggap final.

## 6. Struktur repo yang direkomendasikan

```text
toko-sakala/
├── src/
│   ├── app/                 # route + Server Actions
│   ├── components/          # komponen domain dan ui/
│   ├── domain/               # tipe dan schema Zod
│   ├── engine/contract.ts    # kontrak engine
│   ├── engine/v1/            # engine murni versi 1
│   ├── server/               # db, repo, loader; server-only
│   ├── lib/                  # utilitas non-domain
│   └── types/
├── supabase/
│   ├── migrations/
│   ├── seed.dev.sql
│   └── config.toml
├── scripts/                  # backup, restore, verify, secret scan
├── tests/
│   ├── golden/
│   ├── unit/
│   ├── db/
│   └── e2e/
├── docs/                     # 16 spesifikasi dan register keputusan
├── .env.example
├── .gitignore
├── next.config.ts
├── package.json
└── README.md
```

`src/engine` adalah kode murni: tanpa React/Next/Node, `Date.now()`, `Math.random()`, fetch, DB, atau locale global. Waktu saat ini (`asOf`), urutan event, dan semua data harus menjadi input eksplisit.

## 7. Kebijakan database dan koneksi

- Semua koneksi database berada di sisi server.
- Cloud: koneksi melalui role terbatas `app_server` (SELECT yang diperlukan + EXECUTE RPC, tanpa mutasi event secara langsung); rahasia di `.env.local`/environment server saja.
- `anon` dan `authenticated` tidak diberi hak baca/tulis database; RLS tetap aktif dan hak diuji eksplisit.
- Perubahan event/detail dilakukan melalui RPC atomik, bukan insert langsung dari Server Action.
- `command` ledger dipakai untuk idempotensi, dan hanya dapat diakses lewat RPC.
- Proyek cloud tidak menerima seed uji; seluruh test/mutation test jalan pada DB lokal/test.

## 8. Kontrak engine

`calculate(EngineInput) -> EngineOutput` harus murni, deterministik, dan digunakan bersama oleh preview, server save, dashboard, laporan, status setoran, penjelasan, export, dan input asistif kelak.

Input meliputi event yang relevan, riwayat harga/kemasan, status periode, urutan stabil, versi engine, dan waktu acuan `asOf`. Output mencakup angka, status kepastian, per produk/per periode, serta tree/struktur alasan. Uang rupiah dan jumlah unit menggunakan integer yang aman; nilai yang tidak aman gagal keras.

## 9. Aturan waktu calon TRD

- Tampilan waktu: WIB/Asia-Jakarta (UTC+7, tanpa DST); penyimpanan timestamp UTC.
- Minggu kalender: Senin 00:00 WIB inklusif sampai Senin berikutnya 00:00 WIB eksklusif.
- Event date-only: normalisasi ke 12:00 WIB, jika aturan ini disahkan.
- Urutan: `(occurred_at, seq)`; `seq` diberikan server.
- Tanggal masa depan lebih dari 5 menit terhadap server ditolak, jika disahkan.
- Periode pertama dimulai dari pengamatan awal pertama.
- Interval penjualan ditambatkan oleh checkpoint stok; batas periode yang dipakai untuk atribusi harus sama antara engine, snapshot dan test.
- Early close: TRD v3 menyarankan periode ditutup pada waktu aktual dan periode berikut mulai saat itu (tanpa celah/tumpang tindih). **Menunggu persetujuan** karena perlu disejajarkan dengan definisi kalender Senin–Minggu.

## 10. RPC dan idempotensi

RPC konseptual:

- `rpc_commit_command(...)`: menerima toko, `command_id`, jenis/payload, sequence maksimum yang diharapkan, actor teknis/sumber. Memeriksa command ID; ID + payload identik memutar hasil yang lama; ID sama dengan payload berbeda ditolak; sequence basi ditolak; event dan detail masuk atomik.
- `rpc_close_period(...)`: mengunci rentang periode, memeriksa data terbaru/sequence, memvalidasi tidak ada gap/tumpang tindih sesuai kebijakan yang disetujui, menyimpan snapshot beku, dan menutup periode atomik.

Nama payload/parameter final harus mengikuti migration SQL dan contract types yang benar-benar diimplementasikan.

## 11. Koneksi terputus

| Kondisi | Perilaku wajib |
|---|---|
| Gagal saat memuat | Tampilan “Tidak tersambung” dan tombol Coba lagi; tidak menampilkan angka lama seolah terbaru |
| Terputus setelah data tampil | Tampilkan waktu data terakhir dan status offline; nonaktifkan penyimpanan; draft tidak dibuang |
| Putus tepat saat menyimpan | Katakan “Belum pasti tersimpan”; ulangi menggunakan `command_id` yang sama |
| Proyek database dijeda | Petunjuk pemulihan yang jelas, tidak menyatakan data hilang/tersimpan tanpa bukti |
| Query lama menggantung | Terapkan batas koneksi/statement timeout yang diuji |

Tidak ada offline queue, dan aplikasi tidak menyimpan diam-diam ke local storage lalu berpura-pura server sudah menerima.

## 12. Backup dan restore

Supabase Free tidak boleh diasumsikan memiliki backup otomatis/pemulihan point-in-time. Wajib:

- ekspor JSON/CSV manual dari aplikasi;
- backup PostgreSQL penuh dan terenkripsi, dengan kunci privat hanya di perangkat pemilik;
- catat waktu keberhasilan backup;
- jalankan restore drill ke database kosong;
- verifikasi checksum/row counts setelah pemulihan;
- uji sebelum data nyata pertama dan secara berkala.

Backup yang belum dipulihkan belum terbukti dapat digunakan. Target kehilangan data harus dinyatakan sebagai “sejak backup terakhir yang berhasil”, bukan jaminan real-time.

## 13. Security gate wajib

- Binding eksplisit `127.0.0.1`.
- Host allowlist hanya localhost/127.0.0.1 dan port yang diharapkan, untuk mitigasi DNS rebinding.
- Perangkat lain tidak dapat mengakses port.
- Tidak ada tunnel/port-forwarding/hosting.
- `.env.local` tidak masuk Git; secret scan memeriksa working tree dan riwayat yang relevan.
- Tidak ada credential di `NEXT_PUBLIC_*`, kode klien, prompt, screenshot, atau log.
- Pengujian akses anon/authenticated harus ditolak.
- Backup pertama sudah di-restore dengan hasil terverifikasi.

Status TRD saat kompilasi: desain dan test plan ada; jangan klaim semua kontrol sudah diimplementasikan atau lulus. Lihat `15_TESTING.md` dan `16_ERROR_FIX_PLAYBOOK.md`.

---

# 03 — Architecture TOKO SAKALA

**Status:** arsitektur logis yang disepakati untuk implementasi lokal; detail periode/early-close dan gerbang data nyata masih menunggu bukti/lock final.

## 1. Arsitektur konseptual

```text
Browser UI (form + preview)
        │
        ▼
Next.js Server Actions / Server Components
        │  validate input (Zod)
        │  recalculate (shared pure engine)
        ▼
Repository / DB adapter (server-only)
        │
        ▼
PostgreSQL RPC transaction
  ├── command / idempotency
  ├── append-only event header + typed detail
  ├── audit/version/correction link
  └── period-close snapshot (atomic)

Engine (pure TypeScript)
  events + price histories + asOf + policy version
        └──> numbers + certainty + explanation tree
```

## 2. Batas lapisan

1. **Presentation:** form, dashboard, navigation, status, preview. Tidak boleh memuat rumus bisnis penting.
2. **Domain contract:** tipe event, schema Zod, status kepastian, aturan validasi bentuk payload.
3. **Calculation engine:** pure functions; menentukan stok tersedia/terjual, modal moving-average, penjualan, hasil, uang, setoran dan explanations.
4. **Application/server:** mengautentikasi konteks aplikasi lokal secara teknis, validasi ulang, membaca data, membuat command ID, memanggil RPC, menerjemahkan errors.
5. **Database:** sumber event historis, constraints, append-only enforcement, idempotency, transaksi atomik, close snapshot.
6. **Ops:** migration, secret scan, backup, restore, test, runbook.

## 3. Single source of truth

- Kejadian faktual dan histori harga merupakan sumber data utama.
- Angka turunan dihitung engine; jangan menyimpan salinan yang bisa berbeda kecuali snapshot historis saat periode ditutup.
- Snapshot menyimpan hasil dan versi engine yang membuatnya, untuk menjaga laporan historis.
- `command_id` mencegah submit ulang menggandakan event.
- PostgreSQL menolak pelanggaran yang kritis meskipun UI atau engine salah.

## 4. Aliran read

`Route -> server loader -> repository -> typed rows -> pure engine -> view model -> UI`.

View model menyimpan angka, certainty, dan explanation tree. Komponen UI tidak memutuskan status cocok berdasarkan hitungan mandiri.

## 5. Aliran write

`User input -> draft -> Zod -> preview engine -> show preview -> confirm -> Server Action validation -> engine calculation -> RPC transaction -> reload authoritative state -> success confirmation`.

Semua perubahan multi-event yang menjadi satu command (misalnya masukan AI kelak) harus all-or-nothing. Retry memakai ID command sama. Jika hash/payload berbeda untuk ID sama, tolak sebagai penggunaan ID yang tidak sah.

## 6. Invarians arsitektur

- Tidak ada direct write database dari browser.
- Tidak ada secret di browser.
- Tidak ada perhitungan bisnis di komponen.
- Tidak ada event yang diam-diam ditimpa.
- Tidak ada laporan historical dihitung dengan versi engine terbaru jika snapshot versi lama menjadi sumber resmi.
- Semua urutan dan waktu eksplisit; tidak memakai wall-clock tersembunyi di engine.
- UI menampilkan certainty, bukan menyembunyikan bagian yang belum diketahui.
- Koneksi gagal = tidak ada klaim penyimpanan berhasil.

## 7. Data dan akses

Arsitektur awal mengasumsikan satu toko dan satu operator lokal. Multi-tenant/multiuser tidak termasuk. `toko_id` tetap bisa hadir untuk FK dan isolasi data, tetapi tidak boleh dipasarkan sebagai sistem multi-user aman tanpa identity model. Server DB role dibatasi pada operasi yang dibutuhkan; event ditulis melalui RPC saja.

## 8. Periode dan snapshot

Penutupan harus memiliki optimistic version (`input_max_seq`/sequence), lock/race protection, snapshot, serta rentang periode yang tervalidasi dalam satu transaksi. Bentuk periode kalender vs early-close segment adalah titik tunggu: arsitektur mendukung validasi yang diputuskan tetapi tidak boleh mengimplementasikan dua interpretasi.

## 9. Keputusan evolusi

AI/OCR, parser, smart-restock, dan insight adalah adapter di atas domain engine; tidak ada yang boleh menjadi sumber perhitungan sendiri. AI/OCR hanya menghasilkan draft yang harus melewati validasi, preview, dan konfirmasi manusia.

## 10. Ancaman dan batas

Aplikasi tanpa login di localhost tidak melindungi dari orang yang memakai sesi OS yang sama, malware, atau ekstensi browser berbahaya. Binding localhost, Host guard, secret isolation, DB grants/RLS, dan tidak mempublikasikan app mengurangi risiko, tetapi bukan pengganti autentikasi. Perlu keputusan arsitektur baru sebelum akses jaringan/remote.

---

# 04 — Code Style & Engineering Rules

**Status:** standar engineering yang disarankan untuk diterapkan konsisten; versi tool final mengikuti lockfile dan diverifikasi ketika setup.

## 1. Bahasa dan penamaan

- Kode, tipe, identifier, dan nama file menggunakan Bahasa Inggris konsisten; teks UI menggunakan Bahasa Indonesia sehari-hari.
- `camelCase` untuk variabel/fungsi, `PascalCase` untuk tipe/komponen React, `SCREAMING_SNAKE_CASE` hanya konstanta benar-benar global, `kebab-case` untuk file util/domain bila sesuai pola repo.
- Domain nouns harus konsisten: `product`, `event`, `purchase`, `stockCheck`, `damage`, `usedStock`, `expense`, `otherIncome`, `deposit`, `periodClose`, `certainty`.
- Jangan memakai sinonim berbeda untuk konsep uang sama. `expectedCash` dan `depositActual` harus jelas berbeda.
- Hindari nama ambigu seperti `value`, `data2`, `temp`, `finalResult` jika objeknya memiliki makna domain spesifik.

## 2. TypeScript

- `strict: true`; jangan gunakan `any` kecuali sebagai boundary sementara yang segera dinormalisasi dan disertai alasan.
- Parse data eksternal sebagai `unknown`, lalu validasi dengan Zod.
- Gunakan discriminated unions untuk event, action result, certainty, dan error code.
- Gunakan nominal integer untuk rupiah dan unit pcs; gunakan tipe branded bila bermanfaat (`Rupiah`, `Pcs`, `CommandId`, `EventId`) agar unit berbeda tidak tertukar.
- Jangan mewakili data tidak diketahui dengan `0`. Gunakan status/union `unknown`/`needs_review`.
- Hindari `!` non-null assertion; guard dan hasil validasi harus eksplisit.

## 3. Batas engine murni

`src/engine/**` tidak boleh mengimpor React, Next.js, Node APIs, database driver, browser APIs, logger yang punya efek samping, atau `server/**`.

Tidak boleh memanggil `Date.now()`, `Math.random()`, `Intl` locale-dependent, filesystem, network, atau mutable global. Kirim `asOf`, `seq`, configuration, rounding policy secara eksplisit.

Fungsi utama harus dapat direplay dan deterministik: input sama + versi engine sama = output sama.

## 4. Database & server

- File koneksi database hanya di `src/server/` dan menggunakan penanda server-only.
- Tidak ada client key/server secret dalam komponen client atau `NEXT_PUBLIC_*`.
- Mutasi event hanya lewat fungsi application service → RPC transaction.
- Server Action selalu melakukan validasi Zod ulang; validasi browser bukan sumber keamanan.
- Error DB ditangani lewat code enum yang stabil, bukan dengan mengekspos query/secret ke UI.
- Migration SQL di-commit; jangan membuat schema manual hanya lewat dashboard.

## 5. React/UI

- Komponen visual tidak memiliki rumus keuangan.
- Data dari server adalah read-only state; draft lokal hanya untuk interaksi yang belum disimpan.
- Form menggunakan schema yang sama/ekuivalen dengan kontrak server.
- Jangan menambahkan global state manager tanpa kebutuhan terbukti.
- Gunakan semantic HTML, label input, focus management, keyboard flow, dan status yang tidak hanya bergantung pada warna.
- Focus mode untuk input cepat; jangan mencampur dashboard detail ke dalam form pencatatan.

## 6. Error handling

- Hasil action berbentuk union: sukses dengan data authoritative, validation, stale, conflict, needs confirmation, closed period, DB unavailable, internal.
- Jangan `catch` lalu mengabaikan error.
- Jangan menampilkan stack trace/SQL ke pengguna; log diagnostik yang aman di server.
- Error harus menyertakan tindakan pengguna berikutnya jika ada.
- Retry operasi write memakai `command_id` sama jika status commit belum pasti.

## 7. Pengujian dan kualitas kode

- ESLint, Prettier, TypeScript typecheck, Vitest, DB tests, Playwright/a11y sesuai tahapan.
- Golden tests hitung-tangan wajib untuk setiap perubahan rumus.
- Tidak mengubah fixture hanya agar test lulus tanpa menjelaskan perubahan rumus dan approval.
- Dependency baru harus gratis, berlisensi sesuai, aktif dipelihara, dan punya alasan nyata.
- Jangan mengunci versi yang tidak diverifikasi. Commit lockfile.
- CI: install frozen lockfile → lint → typecheck → unit/golden → database contract tests → build; E2E untuk stage terkait.

## 8. Anti-pattern yang dilarang

- Rumus uang ditulis terpisah di UI, API, export, dan dashboard.
- Menimpa histori harga atau transaksi.
- Menganggap data tidak diketahui sebagai nol/pasti.
- Menganggap penurunan stok otomatis pasti terjual jika tidak valid.
- `Math.round(unitModal)` lalu mengalikannya dengan seluruh stok sebagai nilai sumber.
- Log credential/connection string.
- Membuat fitur AI sebelum core engine lulus.
- Mengklaim build, test, security, backup, atau deploy sukses tanpa hasil yang dapat ditunjukkan.

---

# 05 — APPFLOW TOKO SAKALA

**Status:** APPFLOW revisi 3 merupakan alur kerja yang sudah banyak dirumuskan tetapi dokumen revisinya belum resmi dikunci sampai keputusan §22 dan konsistensi lintas dokumen selesai.

## 1. Prinsip alur

- Pengguna memasukkan kejadian, bukan jurnal atau rumus.
- Sistem menggunakan konteks yang sudah diketahui untuk menghindari pertanyaan berulang.
- Setiap aksi penting menjalani `Draft → Preview → Confirm → Save → Result`.
- Preview menampilkan draft dan dilabeli **Belum disimpan**.
- Sebelum konfirmasi, batal tidak menghasilkan event.
- Setelah tersimpan, Undo menjadi pembatalan terlacak, bukan delete fisik.
- Data yang tidak pasti harus jelas di layar.

## 2. Setup pertama

1. Buka aplikasi lokal.
2. Isi nama toko.
3. Tambahkan barang paling penting.
4. Isi nama, satuan belanja, isi per kemasan, harga beli bila ada, dan harga jual.
5. Catat stok awal fisik.
6. Modal awal opsional; jika tidak diketahui, tandai Belum Diketahui—jangan menebak.
7. Uji contoh pencatatan/hasil sebelum menyimpan data toko nyata.

Tidak perlu memaksa import seluruh katalog atau mengisi semua modal sebelum pengguna dapat mulai.

## 3. Belanja / restock

1. Pilih barang.
2. Masukkan jumlah kemasan.
3. Isi kemasan diambil dari histori terakhir; tanya hanya jika belum ada atau berubah.
4. Masukkan harga per kemasan atau total yang diketahui, dengan satu format yang jelas.
5. Pilih sumber uang untuk kejadian tersebut jika sumber belum diketahui.
6. Preview menunjukkan jumlah unit dasar, total biaya pembelian, estimasi modal per unit, stok setelah masuk, dan dampak uang.
7. Konfirmasi → validasi server → commit atomik.
8. Sistem menyimpan histori tanggal, unit, isi kemasan, harga, dan sumber uang.

Restock tidak membuat periode baru.

## 4. Cek sisa

1. Tampilkan produk aktif dengan jumlah stok tersedia sebagai konteks.
2. Pengguna mengisi jumlah fisik tersisa; input dapat dilakukan beberapa produk dalam satu layar.
3. Engine menghitung selisih dari checkpoint sebelumnya dan event stok yang sudah dicatat.
4. Jika `0 ≤ terjual ≤ tersedia`, penurunan normal dihitung sebagai penjualan sesuai prinsip produk.
5. Jika sisa lebih besar daripada tersedia, jangan buat penjualan negatif. Minta satu pilihan yang relevan: belanja belum dicatat, salah hitung, atau tidak tahu/selisih.
6. Jika penurunan luar pola dan histori memadai, tampilkan soft prompt, jangan memblokir tanpa alasan.
7. Preview dua sisi memperlihatkan BARANG & HASIL di kiri dan UANG & SETORAN di kanan.
8. Konfirmasi dan simpan. Hasil final bersumber dari hasil server.

Pernyataan “tidak ada penjualan sejak cek terakhir” adalah event eksplisit, bukan berarti stok fisik sudah diamati. Jika tidak ada pengamatan stok, status stok tetap belum dicek.

## 5. Barang rusak / dipakai / tidak diketahui

- **Rusak:** catat jumlah dan barang; stok berkurang; keuntungan berkurang sebesar nilai modal; uang tidak berubah.
- **Dipakai:** catat jumlah; stok berkurang; keuntungan berkurang dengan nilai modal; tidak membuat arus kas keluar fiktif.
- **Tidak tahu:** menandai selisih stok; tidak menganggap sebagai penjualan; nilai modal yang diketahui memengaruhi hasil, uang tidak berubah; kepastian Perlu Diperiksa.
- **Salah hitung:** koreksi pengamatan stok sesuai audit/version policy, bukan menambah penjualan palsu.

## 6. Pengeluaran operasional

1. Masukkan deskripsi, jumlah rupiah, tanggal, dan sumber uang jika diperlukan.
2. Sistem mengenali kategori dasar dari konteks tetapi tidak boleh salah mengklasifikasi pembelian barang dagangan sebagai biaya.
3. Jika nama item sama dengan produk master dan jenisnya ambigu, ajukan satu pertanyaan.
4. Preview menguraikan dampak pada hasil dan uang.
5. Simpan, audit, dan Undo sesuai policy.

Contoh: gas, plastik, es batu, sabun.

## 7. Pendapatan lain

Contoh jasa seduh mi Rp2.000. Catat nominal, tanggal, keterangan, dan sumber/penerimaan. Pendapatan lain terpisah dari penjualan barang, menambah hasil dan uang sesuai aturan yang disahkan.

## 8. Setoran

1. Pengguna memasukkan jumlah yang benar-benar diserahkan dan tanggal.
2. Jika ada beberapa setoran dalam periode, jumlahkan tanpa membuatnya menjadi penjualan.
3. Sistem menampilkan uang seharusnya, akumulasi setoran aktual, selisih, status, dan alasan/ketidakpastian.
4. Jika target periode bisa disimpulkan dari tanggal dan konteks, jangan tanya. Jika beberapa periode terbuka membuatnya ambigu, tanyakan satu pertanyaan.
5. `MENUNGGU SETORAN` berlaku sebelum nominal setoran lengkap.

## 9. Penutupan periode

1. Pengguna melihat ringkasan dan daftar yang belum diketahui.
2. Barang belum dicek tidak secara otomatis memblokir penutupan; penutupan menjadi **Ditutup Sebagian** dan ketidakpastian diteruskan.
3. Pengguna mencatat setoran atau menyatakan tidak ada setoran untuk periode tersebut.
4. Jika ada selisih, sistem menampilkan opsi bawa selisih ke periode berikutnya atau catat sebagai selisih kas, sesuai policy yang disahkan.
5. Server snapshot data, kepastian, tree alasan, dan versi engine secara atomik.
6. Histori periode beku; koreksi di masa berikutnya menjadi pembalikan + entri baru yang tertaut.

**Pending lock:** bagaimana early close bersinergi dengan minggu kalender Senin–Minggu dan bagaimana periode berikutnya dimulai. Jangan implementasikan sebelum satu aturan tunggal disetujui.

## 10. Harga jual berubah di tengah interval cek

Jika perubahan harga terjadi sementara ada interval stok terbuka dan penjualan mungkin terjadi, sistem menawarkan cek sisa sekarang. Jika pengguna menunda, interval ditandai harga campuran dan penjualan/uang bisa berupa kisaran dengan status Perlu Diperiksa. Tidak boleh membagi penjualan menurut perkiraan tanpa label.

## 11. Koreksi, Undo, dan void

- Draft batal = tidak ada event.
- Undo setelah commit saat periode terbuka = pencatatan void/cancellation yang menjaga jejak.
- Periode tertutup = correction event/link yang terlihat di periode berjalan; laporan lama tetap beku.
- Retry commit yang statusnya tidak pasti = command ID yang sama.
- Pembatalan tidak dapat “di-undo” dengan menghapus baris; pengguna dapat “Catat ulang” yang menciptakan event baru.

## 12. Koneksi dan kegagalan

- Load gagal: tidak tampilkan data usang seolah live.
- Koneksi putus sesudah load: beri cap waktu data, disable save, draft tetap terlihat.
- Koneksi putus saat save: “Belum pasti tersimpan”; ulangi dengan ID yang sama.
- Tidak ada penyimpanan tersembunyi/offline queue.

---

# 06 — UI/UX TOKO SAKALA

**Arah yang disetujui:** pendekatan B — sederhana tetapi modern. Prioritas tahap pertama adalah keseimbangan kemudahan dan akurasi.

## 1. Prinsip UX terkunci

1. Jangan membuat pengguna memahami sistem; buat sistem memahami pengguna.
2. Pengguna memasukkan kejadian, sistem melakukan penghitungan.
3. Jika sistem sudah tahu, jangan tanya ulang.
4. Sisa stok adalah input; barang terjual adalah hasil engine.
5. Restock tidak membuka periode baru.
6. Histori harga/kemasan tidak boleh ditimpa.
7. Selisih stok tidak otomatis dianggap terjual.
8. Keuntungan, uang toko, dan setoran selalu terpisah.
9. Angka penting dapat dijelaskan.
10. AI tidak pernah mengubah data penting diam-diam.
11. Perubahan penting harus dapat dilacak/dibatalkan sesuai keadaan periode.
12. Tanpa kejadian, tanpa pekerjaan—tidak meminta pengguna mencatat nihil setiap hari tanpa tujuan.

## 2. Progressive disclosure empat level

- **Level 1 — Ringkas:** kondisi toko, untung, uang seharusnya, setoran, selisih, perlu diperiksa. Dashboard maksimal lima informasi utama/status.
- **Level 2 — Penjelasan:** tombol/tautan “Kenapa?” dengan alasan sederhana.
- **Level 3 — Detail:** “Lihat perhitungan” menampilkan jumlah stok, barang masuk, sisa, terjual, harga, modal, subtotal.
- **Level 4 — Teknis/audit:** histori harga/kemasan, source events, koreksi, versions, waktu server, engine version.

Pengguna tidak dipaksa masuk ke level lebih dalam.

## 3. Dashboard

Dashboard menjawab:
1. Bagaimana kondisi toko?
2. Berapa uang yang seharusnya ada?
3. Apakah setoran cocok?
4. Berapa untungnya?
5. Apa yang perlu saya periksa?

Satu kartu aksi utama (misalnya “Cek sisa barang” jika waktunya relevan). Detail lainnya dikelompokkan sebagai “N hal lain”. Jangan membuat dashboard penuh grafik atau dekorasi.

## 4. Input mode / Focus mode

Saat mencatat, fokus pada aktivitas saat ini. Untuk cek stok banyak produk, tampilkan daftar nama dan satu input jumlah per produk dengan label. Hindari statistik tak relevan, grafik, navigasi yang mengganggu, atau formulir panjang bila informasi dapat diwarisi dari konteks.

## 5. Live preview

Desktop: dua kolom yang sejajar dan seimbang.
- Kiri: barang & hasil — stok tersedia, sisa, terjual, penjualan, modal terjual, untung.
- Kanan: uang & setoran — uang seharusnya, pengeluaran, pendapatan lain, setoran, selisih, status.

Mobile: stack vertikal; header ringkas menjaga hubungan antara dampak barang dan dampak uang. Semua preview harus berlabel **Belum disimpan**.

Tidak ada tombol “Hitung”; hitung otomatis. Tombol aksi utama adalah “Simpan” atau “Konfirmasi dan simpan”.

## 6. Kapan bertanya

Tanya hanya saat sistem tidak bisa menyimpulkan sesuatu dengan aman. Satu pertanyaan pada satu waktu. Gunakan pilihan berbasis bahasa sehari-hari. Contoh:
- “Sumber uang belanja ini?” uang toko / uang pribadi.
- “Sisa lebih banyak daripada catatan. Apa yang terjadi?” belanja belum dicatat / salah hitung / belum tahu.
- “Harga jual berubah di tengah periode. Cek sisa sekarang?” cek sekarang / nanti.

Jangan meminta informasi yang sudah diketahui dari produk/riwayat.

## 7. Konfirmasi dan feedback

Sukses: singkat, menyatakan perubahan dan angka kunci, tautan Undo bila layak.
Contoh: “Tersimpan. Mie tersisa 25 bungkus dan 47 terjual. Penjualan Rp329.000; untung dari barang Rp141.000.”

Error: menyatakan keadaan nyata dan langkah aman. Jangan menampilkan stack trace, SQL, atau secret. Jangan menyebut sukses sebelum server mengonfirmasi.

## 8. Aksesibilitas

- Kontras teks normal minimal 4.5:1 sebagai target.
- Target sentuh minimal 44×44 CSS px untuk tindakan utama.
- Status tidak hanya warna: ikon + label + penjelasan bila dibutuhkan.
- Semua form punya label, pesan error terhubung, focus visible, keyboard navigation.
- Hormati `prefers-reduced-motion`.
- Format angka Indonesia: rupiah, pemisah ribuan lokal, tanggal dan waktu WIB; konsisten.

## 9. Kesuksesan UX

- Aktivitas rutin tidak memerlukan istilah akuntansi.
- Cek sisa sekitar 20 barang memiliki target usability di bawah satu menit—ini **target untuk diuji**, belum fakta terukur.
- Tidak ada langkah manual “Hitung”, pemilihan periode berulang, atau data yang harus ditulis dua kali bila sudah diketahui.
- Status ketidakpastian selalu terlihat ketika memengaruhi hasil.

---

# 07 — UI Design Brief

## 1. Mandat visual

Merancang TOKO SAKALA sebagai webapp toko modern yang terasa profesional, tenang, tepercaya, dan tidak rumit. Visual harus memperkuat kejelasan informasi; dekorasi tidak boleh menyaingi data atau menutupi risiko finansial.

**Product owner selection:** pendekatan B — sederhana tetapi modern; prioritas tahap pertama: keseimbangan antara kemudahan dan akurasi.

## 2. Karakter

- Modern, rapi, sederhana, premium melalui presisi.
- Bukan aplikasi pembukuan tradisional yang padat.
- Bukan dashboard analitik yang penuh grafik.
- Tidak menggunakan violet sebagai warna dominan.
- Arah warna awal dari diskusi: deep teal + warm ivory dengan latar gelap/terang yang terkontrol; nilai token final ada di Design System.
- Jangan menggunakan dekorasi yang tak berkaitan dengan aktivitas toko.

## 3. Referensi dan interpretasi

Gunakan bahasa visual dashboard modern dengan kartu tertata, hierarki kuat, whitespace yang cukup, metrik terbatas, dan detail visual terkendali. Referensi hanya inspirasi; jangan menyalin mentah atau mengorbankan kebutuhan data nyata.

## 4. Hierarki visual

1. Status masalah atau kondisi yang membutuhkan tindakan.
2. Angka paling penting: uang seharusnya, status setoran, untung, stok/sisa.
3. Aksi utama.
4. Detail pendukung.
5. Penjelasan dan audit di tingkat lebih dalam.

Hindari menempatkan semua metrik dengan bobot visual yang sama.

## 5. Layout

- Desktop: sidebar sederhana, topbar untuk judul/konteks dan aksi global, area kerja dengan lebar cukup untuk tabel/forms serta preview dua sisi.
- Mobile: navigasi bawah maksimal lima item terlihat. Aksi `+ Tambah` dapat menjadi pusat input; Belanja/Laporan bisa diakses melalui shortcut atau “Lainnya”. Ini mengikuti rekomendasi master UX dan perlu disesuaikan saat prototype.
- Form dan daftar harus responsif pada lebar 360px.
- Tidak ada hero illustration besar di layar pencatatan uang.

## 6. Komposisi dashboard

Kartu utama menampilkan satu tindakan yang paling relevan. Kartu ringkasan menampilkan maksimum lima jawaban. Detail lain masuk section “N hal lain” atau layar spesifik. Grafik hanya ditambahkan bila membantu keputusan dan memiliki data pasti.

## 7. Warna dan tipografi

- Palet dasar deep teal, green-teal, warm ivory, neutral ink/slate.
- Red/amber/green hanya status semantik, tidak menjadi satu-satunya pembawa makna.
- Tipografi sans modern yang jelas; Geist boleh digunakan sebagai pilihan awal jika tersedia dan lisensinya sesuai.
- Angka rupiah memakai tabular numerals bila font mendukung; angka harus mudah dibandingkan.
- Kontras dan line height diprioritaskan daripada gaya tipis/dekoratif.

## 8. Motion dan detail

Motion ringan, singkat, dan hanya untuk state change yang bermakna. Tidak ada animasi berjalan terus, parallax, glow berlebihan, gradient yang mengganggu, atau glassmorphism ekstrem.

## 9. Larangan

- Jangan membuat ulang kalkulasi dalam komponen hanya untuk mempercantik preview.
- Jangan mengubah atau membulatkan angka demi tampilan.
- Jangan menyembunyikan “Belum Diketahui” atau “Perlu Diperiksa”.
- Jangan mengandalkan warna saja.
- Jangan mendesain form seperti spreadsheet yang penuh kolom di layar ponsel.
- Jangan menampilkan istilah HPP/COGS/debit/kredit/reconciliation di permukaan UI utama.

## 10. Deliverables visual

- Prototype Beranda, Barang, Belanja, Cek Sisa, Setoran, Laporan.
- Desktop dan mobile layout.
- Empty/loading/error/success/uncertain states.
- Token color/type/spacing/radius/shadow.
- Komponen preview/confirmation yang berbagi satu kontrak data dengan engine.

---

# 08 — UX Design Brief

## 1. Sasaran pengalaman

Pemilik toko cukup menjawab “apa yang terjadi?”, bukan “bagaimana pencatatan akuntansinya?”. Sistem harus meminimalkan beban ingatan, pertanyaan, penghitungan manual, dan pengulangan data.

## 2. Jobs to be done

- Saat membeli: catat berapa kemasan dan berapa harga.
- Saat menghitung stok: masukkan sisa yang terlihat.
- Saat ada kejadian non-penjualan: jelaskan rusak/dipakai/selisih hanya bila diperlukan.
- Saat menerima uang tambahan atau membayar biaya: catat kejadian.
- Saat menyetor: masukkan angka aktual.
- Saat hasil membingungkan: tekan “Kenapa?” dan dapatkan penjelasan yang bisa ditelusuri.

## 3. Model mental pengguna

Pengguna berurusan dengan barang, uang, dan setoran. Sistem menyimpan tiga alur yang terkait tetapi tidak sama. UI tidak mengharuskan pengguna mengetahui istilah “ledger”, “cost layer”, “moving average”, atau “snapshot”. Detail itu hanya ada pada lapisan teknis/audit.

## 4. Prinsip interaksi

- Context first: gunakan produk, kemasan, tanggal/periode dan histori yang sudah diketahui.
- Ask only when required: tanya bila ada banyak kemungkinan dan pemilihan memengaruhi hasil.
- One question at a time.
- Preview first: tunjukkan dampak sebelum menyimpan.
- Confirmation should be proportional to risk.
- Safe retry: submit ID sama untuk hasil commit yang tidak pasti.
- Honest state: bedakan tersimpan, belum disimpan, dan belum pasti tersimpan.
- Undo is audit, not data deletion.
- Gradual disclosure: mulai dari hasil, lanjut ke alasan, rincian, lalu histori.

## 5. Tingkat kepastian

- **Pasti:** input pengguna atau hasil turunan komponen pasti.
- **Perlu Diperiksa:** kejanggalan, kisaran, estimasi, harga campuran, atau penyebab belum selesai.
- **Belum Diketahui:** nilai belum pernah diamati/dikonfirmasi atau modal/sumber uang belum diketahui.

Sistem tidak boleh menaikkan kepastian sendiri hanya karena angka bisa dihitung.

## 6. UX untuk ketidakcocokan

Sampaikan fakta, bukan tuduhan. Contoh:
- “Sisa lebih banyak dari stok yang tercatat. Apakah ada belanja yang belum dicatat?”
- “Setoran kurang Rp50.000. Ada komponen yang belum pasti; mari periksa belanja dan pengeluaran.”
- “3 barang belum dicek, jadi keuntungan minggu ini belum lengkap.”

Daftar kemungkinan penyebab ditampilkan sebagai hal yang perlu diperiksa, bukan fakta yang telah terbukti.

## 7. Respons terhadap status jaringan

- Load failure: layar kesalahan jelas tanpa angka usang.
- Disconnect after load: label cap waktu, draft disimpan di memori layar, aksi tulis dinonaktifkan.
- Unknown commit outcome: pesan jujur dan retry aman.
- Tidak ada offline queue atau simpan lokal diam-diam.

## 8. Metrik keberhasilan

Metrik target untuk diuji, bukan klaim aktual:

- Cek sisa sekitar 20 barang kurang dari satu menit untuk pengguna yang telah terbiasa.
- Pengguna dapat memahami perbedaan untung, uang toko, dan setoran setelah membaca label/penjelasan tanpa pelatihan akuntansi.
- 100% golden financial tests lulus.
- Nol duplikasi dari retry command yang sama.
- Nol data historis berubah diam-diam setelah periode ditutup.
- Pengguna mampu memulihkan setelah kesalahan dengan petunjuk yang terlihat.

## 9. Pertanyaan yang tidak boleh ditanyakan berulang

Jangan tanyakan isi kemasan yang masih sama; jangan meminta periode pada setiap entry bila tanggal/konteks menentukannya; jangan meminta pengguna memasukkan harga lama jika tersimpan; jangan meminta “terjual berapa” bila sisa dan ketersediaan cukup untuk menghitungnya.

## 10. UX gate

Sebelum data nyata, uji setidaknya: alur tanpa kesalahan, sisa lebih besar daripada tersedia, modal unknown, perubahan harga di tengah interval, periode tertutup, koneksi putus, dan tindakan undo/correction. Setiap layar harus memiliki status loading, empty, error, success, dan uncertain yang benar.

---

# 09 — Userflow TOKO SAKALA

## 1. Navigasi produk

Nav utama yang direkomendasikan:
- Beranda
- Barang
- Belanja
- Setoran
- Laporan
- Asisten (khusus tahap lanjutan)
- Lainnya (Riwayat, Pengaturan, backup/ekspor)
- Aksi global `+ Tambah`

Di ponsel, bottom nav maksimal lima item yang tampak. Saran awal: Beranda, Barang, `+ Tambah`, Setoran, Lainnya. Tidak semua menu harus selalu terlihat.

## 2. Global action `+ Tambah`

- Belanja
- Cek sisa
- Barang rusak
- Barang dipakai
- Pengeluaran
- Pendapatan lain
- Setoran

Jenis kejadian yang di luar MVP tidak muncul.

## 3. First run

```text
Buka aplikasi lokal
  → cek DB/health
  → jika belum ada setup: nama toko
  → tambah barang
  → isi satuan/kemasan + harga yang diketahui
  → cek sisa awal
  → modal awal opsional
  → dashboard
```

Jika database tidak tersambung, user berhenti pada state “Tidak tersambung”, bukan layar kosong yang mirip toko baru.

## 4. Belanja flow

```text
+ Tambah / Belanja
 → pilih barang
 → isi jumlah kemasan
 → ambil isi kemasan dari histori atau konfirmasi jika berubah
 → isi harga
 → pilih sumber uang bila belum diketahui / ubah chip sumber
 → preview stok + modal + uang
 → Confirm & Save
 → validasi server & commit atomik
 → hasil + Undo bila masih dapat dibatalkan di periode terbuka
```

## 5. Cek sisa flow

```text
+ Tambah / Cek Sisa
 → daftar barang aktif dan jumlah tersedia
 → input sisa fisik per item
 → engine menghitung delta
 → valid? ─ yes → preview; no → satu klarifikasi yang diperlukan
 → preview BARANG/HASIL + UANG/SETORAN
 → user confirm
 → server recompute + database commit
 → confirmation / status perlu diperiksa
```

Kasus khusus:
- Sisa lebih besar daripada tersedia → tidak membuat penjualan negatif; minta klarifikasi.
- Penurunan normal → penjualan turunan.
- Penurunan outlier → soft prompt apabila histori cukup.
- “Tidak tahu” → catat sebagai selisih stok, bukan penjualan.
- Produk belum dicek → status belum diketahui, bukan nol atau terjual nol.

## 6. Barang rusak/dipakai

```text
Pilih Barang Rusak/Dipakai
 → pilih barang + jumlah
 → cek jumlah tersedia
 → preview perubahan stok + dampak untung (uang tidak berkurang)
 → confirm → commit → receipt + Undo jika periode terbuka
```

## 7. Pengeluaran/pendapatan lain

```text
Pilih jenis kejadian
 → isi deskripsi, nominal, tanggal
 → untuk pengeluaran: pilih sumber uang toko/pribadi jika diperlukan
 → preview hasil + uang
 → confirm → save → receipt
```

Pendapatan lain tidak dicampur ke penjualan barang.

## 8. Setoran flow

```text
Setoran
 → masukkan nominal aktual + tanggal
 → sistem resolve periode berdasarkan tanggal/konteks
 → jika ambigu, tanya periode sekali
 → preview uang seharusnya, setoran terakumulasi, selisih, certainty
 → konfirmasi → simpan
 → status COCOK / PERLU DIPERIKSA / BELUM COCOK / MENUNGGU SETORAN
```

## 9. Tutup periode flow

```text
Buka ringkasan periode
 → tampilkan setoran & data belum pasti
 → user catat setoran / menyatakan tidak ada setoran
 → jika ada selisih: pilih bawa atau catat sebagai selisih, bila aturan ini disahkan
 → pilih tutup lengkap/sebagian
 → server revalidasi sequence
 → snapshot + close atomik
 → laporan tertutup read-only
```

**Gating:** early close dan definisi segmen periode harus disetujui sebelum flow implementasi diaktifkan.

## 10. Correction flow

```text
Pilih kejadian/angka lama
 → lihat alasan/detail
 → periode terbuka? yes → buat versi/void terhubung
 → periode tertutup? → preview correction delta pada periode berjalan
 → konfirmasi eksplisit
 → append correction + new event
 → old snapshot stays frozen
```

## 11. Connection recovery flow

- Gagal membuka data: retry; jangan tampilkan dashboard contoh/dummy.
- Koneksi putus setelah data dimuat: label waktu data; disable save; draft tetap di layar.
- Hasil commit tidak diketahui: retry command ID yang sama; jangan membuat ID baru.
- Jika proyek cloud dijeda: instruksi runbook tanpa menganggap data terhapus.

## 12. Weekly journey

- **Senin:** dashboard memulai minggu dengan konteks yang telah ditentukan; tidak perlu membuat periode manual.
- **Hari tanpa kejadian:** tidak ada kewajiban mencatat nihil harian.
- **Saat belanja:** catat setiap restock dalam periode berjalan.
- **Saat cek sisa:** stok fisik jadi input; hasil lainnya dihitung.
- **Sabtu:** ringkasan sementara (jika berguna) dan barang yang perlu dicek.
- **Minggu:** setoran dan peninjauan periode.
- **Setelah tutup:** laporan beku dan koreksi kemudian tercatat pada periode berjalan.

Detail early close harus menyatukan minggu kalender dan segmen aktual sebelum status final.

---

# 10 — Design System TOKO SAKALA

**Status:** arah visual disetujui; angka token berikut adalah baseline usulan untuk diimplementasikan dan di-QC, bukan klaim bahwa sudah diterapkan di kode.

## 1. Prinsip

- Clarity over decoration.
- Konsistensi di seluruh form, tabel, preview, status, dan laporan.
- Warna tidak menggantikan label.
- Informasi yang belum pasti tidak boleh disamarkan.
- Komponen mengikuti data engine, bukan membuat angka sendiri.

## 2. Warna awal

Arah utama: deep teal + warm ivory, netral arang/slate, tanpa violet.

| Token | Nilai awal | Tujuan |
|---|---|---|
| `--color-bg-dark` | `#0D1717` | Latar dark |
| `--color-surface-dark` | `#172321` | Panel dark |
| `--color-primary` | `#176B61` | Tombol/aksi utama |
| `--color-accent` | `#55B8A5` | Aksen teal/indikator aktif |
| `--color-warm-accent` | `#B08D3C` | Aksen hangat terbatas |
| `--color-ivory` | `#F5F1E8` | Latar warm light (dapat disesuaikan lewat contrast test) |
| `--color-ink` | `#172321` | Teks utama pada light |
| `--color-muted` | token neutral dengan kontras teruji | Teks sekunder |
| `--color-danger` | warna danger dengan kontras teruji | Error/selisih yang pasti |
| `--color-warning` | warna warning dengan kontras teruji | Perlu diperiksa |
| `--color-success` | warna success dengan kontras teruji | Cocok/pasti |

Nilai token semantik harus diperiksa kontrasnya terhadap permukaan aktual. Jangan menganggap warna accent aman sebagai body text sebelum diuji.

## 3. Tema

- Dark theme dan Light theme dirancang lengkap; light bukan sekadar membalik warna dark.
- Dark/teal adalah arah visual awal. Final default theme dapat disetel saat prototipe, tetapi pengalaman tema harus konsisten dan berkontras baik.
- Simpan warna semantic status terpisah dari warna brand.

## 4. Typography

- Sans modern (Geist menjadi kandidat awal) dengan fallback sistem.
- Heading ringkas, label jelas, body 14–16px sebagai rentang kerja, teks sekunder tidak terlalu kecil.
- Rupiah menggunakan tabular numerals jika tersedia.
- Jangan menggunakan font ultralight untuk data penting.

## 5. Spacing dan grid

Baseline 4px spacing scale: `4, 8, 12, 16, 24, 32, 40, 48`. Jarak besar hanya untuk pemisahan grup, bukan untuk memboroskan layar form.

- Radius kontrol moderat; cards bukan rounded berlebihan.
- Shadow tipis; elevation dipakai untuk menu/dialog, bukan setiap panel.
- Gunakan layout grid yang menjaga scanline tabel dan alignment angka.
- Mobile: padding cukup; form tidak melebar hingga angka/label terputus.

## 6. Bentuk dan status

- Tombol primer jelas satu per layar.
- Tombol destructive terpisah dan butuh confirmation.
- Label certainty: Pasti, Perlu Diperiksa, Belum Diketahui.
- Deposit states selalu teks+ikon+warna.
- Loading, disabled, hover, focus, pressed, success, warning, error harus punya treatment.

## 7. Motion

- Transisi singkat, menguatkan pergantian state.
- Tidak ada auto-play, gerak dekoratif terus-menerus, atau animasi yang memperlambat input.
- Hormati reduced motion.

## 8. Aksesibilitas

- Kontras body minimal 4.5:1, target sentuh 44px, visible focus, semantic HTML, keyboard support.
- Error terkait input dan dapat dibaca pembaca layar.
- Status tidak hanya warna.

## 9. Token implementation

Definisikan CSS variables untuk warna, typography, radius, spacing, shadow, border, focus ring, dan status. Jangan menaruh hex acak di komponen. Token harus memiliki unit test/screenshot review seperlunya untuk menghindari drift.

---

# 11 — Component Inventory

**Status:** inventaris kebutuhan untuk implementasi; nama dapat menyesuaikan codebase, kontrak perilaku tidak.

## 1. Shell dan navigasi

- `AppShell`: layout global dan state koneksi.
- `SidebarNav`: navigasi desktop sederhana.
- `MobileBottomNav`: maksimum lima item.
- `Topbar`: nama layar, konteks periode/toko, aksi sekunder.
- `GlobalAddMenu`: pilihan kejadian.
- `ConnectionStatus`: online/disconnected + timestamp data.

## 2. Dashboard

- `ShopStatusSummary`: kondisi toko.
- `ExpectedCashCard`: uang seharusnya dengan certainty.
- `DepositStatusCard`: setoran, selisih dan label status.
- `ProfitSummaryCard`: untung dan caveat komponen belum diketahui.
- `NeedsAttentionCard`: satu daftar prioritas masalah.
- `OtherItemsDisclosure`: rincian “N hal lain”.

Dashboard tidak boleh memuat angka statis/dummy yang tampak nyata.

## 3. Produk dan stok

- `ProductList` / `ProductRow`.
- `ProductForm`.
- `PackageUnitFields`: jumlah isi kemasan dan satuan dasar.
- `PriceHistoryPanel`.
- `StockAvailabilityBadge`.
- `StockCountForm` dengan input sisa fisik.
- `StockReasonPrompt`: rusak/dipakai/salah hitung/tidak tahu/terjual jika perlu.
- `CertaintyBadge`.

## 4. Pencatatan keuangan

- `PurchaseForm` + `PurchaseItemRow`.
- `MoneySourcePicker` dan `MoneySourceChip`.
- `ExpenseForm`.
- `OtherIncomeForm`.
- `DepositForm`.
- `PeriodPicker` (hanya saat periode tidak dapat diinferensikan).

## 5. Preview dan hasil

- `LivePreviewPanel`: status “Belum disimpan”.
- `GoodsAndResultPreview`: barang, penjualan, modal, untung.
- `MoneyAndDepositPreview`: uang, pengeluaran, setoran, selisih.
- `ExplanationTree`: data struktur penjelasan dari engine.
- `ConfirmationDialog`: konfirmasi berdasarkan risiko.
- `SaveResultToast` / `ResultSummary`.
- `UndoAction`: membatalkan secara terlacak; tidak menghapus data.

## 6. Periode dan audit

- `PeriodSummary`.
- `PeriodCloseReview`.
- `UncertainProductsList`.
- `DepositCompletenessNotice`.
- `SnapshotBadge`.
- `CorrectionPreview`.
- `EventTimeline`.
- `AuditDetailDrawer`.

## 7. Laporan dan eksport

- `ReportPeriodFilter`.
- `ReportSummary`.
- `ProductProfitTable`.
- `CashAndDepositTable`.
- `UncertaintyNotice`.
- `ExportActions` (CSV/JSON dan PDF/Excel sesuai lingkup final yang dipilih).

## 8. State komponen standar

Komponen data harus menangani: loading, empty, data, error, disconnected, pending-save, success, uncertain, stale/conflict, permission/configuration error.

## 9. Aturan component contracts

- Props typed dari domain/view model.
- Jangan hitung laba/selisih setoran di komponent.
- Jangan menyimpan data bisnis yang sudah committed dalam cache persisten di browser.
- Komponen form menggunakan schema validasi.
- Semua tombol dapat dikendalikan keyboard dan fokus tidak hilang setelah dialog.
- Komponen preview harus menerima output engine yang sama dengan server-side calculation.

---

# 12 — Screen Specifications

## 1. Global shell

**Tujuan:** navigasi yang jelas dan status koneksi yang jujur.  
**Elemen:** brand TOKO SAKALA, sidebar desktop, topbar, current period/context, global `+ Tambah`, connection status.  
**States:** loading; offline; normal; stale data with timestamp; configuration/security guard failure.  
**Rules:** no dummy values; disabled writes if DB disconnected.

## 2. Setup

**Fields:** nama toko; data produk dasar; satuan pembelian; isi kemasan; harga jual; harga modal bila diketahui; sisa fisik.  
**Optional:** modal stok awal dapat belum diketahui.  
**Validation:** nama wajib; jumlah unit integer non-negative; isi kemasan positive integer; monetary amount integer rupiah non-negative unless event contract explicitly allows correction signs; don't convert blank modal to zero.  
**Success:** “Toko siap dicatat. Modal untuk beberapa barang masih belum diketahui” if applicable.

## 3. Beranda

**Primary card:** one action based on relevant context, e.g. “Cek sisa barang” or “Periksa setoran”.  
**Maximum key content:** 1) kondisi toko; 2) uang seharusnya; 3) setoran/status; 4) untung; 5) perlu diperiksa.  
**Other content:** collapsible or deeper view.  
**No:** charts without decision purpose, technical accounting language, invented values.  
**Clickthrough:** every figure leads to explanation/detail.

## 4. Barang

**List fields:** nama; satuan jual; stok terakhir/availability; harga jual aktif; status modal/certainty.  
**Actions:** tambah/edit non-event product metadata, archive product (not delete history), view price/package history, cek sisa.  
**Validation:** no negative units; package contents > 0; product IDs immutable in historic events. Product archive can't erase event history.

## 5. Belanja

**Fields:** barang; jumlah kemasan; isi per kemasan; harga/total purchase; tanggal kejadian; sumber uang (toko/pribadi).  
**Context:** fill package size from history, show prompt if it changed.  
**Preview:** pcs masuk, total modal, derived modal/unit, existing and resulting availability, cash impact according to source.  
**Validation:** count/price valid; item totals consistent; source explicit; reused command ID rules.  
**Success:** concise summary, Undo if policy permits.

## 6. Cek Sisa

**Fields:** current physical remainder per selected product; optional “tidak ada penjualan sejak cek terakhir” declaration for products where this is specifically asserted.  
**Context:** show available count and last checked date, not presumed zero.  
**Live result:** quantity sold if possible, sales, cost, product profit, expected money/deposit impact, certainty.  
**Abnormal:** remaining > available blocks auto-sale and asks one question; normal large drop may soft-prompt if history adequate; unknown cause becomes stock discrepancy.  
**Save:** preview → confirm → server recalculate → authoritative confirmation.

## 7. Barang Rusak / Dipakai

**Fields:** product, quantity, date, optional note/reason.  
**Preview:** stock decreases; product result/profit decreases by cost when known; cash unchanged.  
**Rules:** no duplicate stock loss; amount cannot exceed available without exception/correction handling. Historical data retained.

## 8. Pengeluaran

**Fields:** description, amount, event date, source (store/private), category if useful.  
**Rules:** distinguish item purchase from operational expense; if ambiguous ask one simple question. Store-source expense decreases cash; private-source expense does not lower store cash but remains an expense/result according to final business interpretation. This source/result behavior must be explicit in engine tests.

## 9. Pendapatan lain

**Fields:** short description, amount, date.  
**Examples:** jasa seduh mi Rp2.000.  
**Preview:** additional income and cash-in; not counted as product sales.  
**Status:** if receiving channel unknown, don't infer non-cash; MVP scope assumes cash sales/receipts only unless product owner changes scope.

## 10. Setoran

**Fields:** actual amount, event date, period if not inferable.  
**Display:** amount entered, period total deposits, expected cash, signed difference, certainty, status, neutral possible checks.  
**Rules:** deposit does not create income/profit; multiple deposit entries sum. Unresolved differences carry forward according to closed-period policy.

## 11. Close Period

**Review:** period name/boundary, total income/outflow, deposit summary, items not checked, uncertainty status, prospective snapshot.  
**Choice:** full/partial close; carry unresolved discrepancy or record cash difference only if that behavior is approved.  
**Save:** atomic database operation; reject stale sequence; immutable snapshot.  
**Pending:** early-close and segment boundaries are not locked yet.

## 12. Reports

**Filters:** period/date range, product or all products.  
**Sections:** stock changes, product sales/profit, additional income, operating expense, cash expected, deposit total, difference, incomplete/uncertain items.  
**Exports:** PDF/Excel were requested; TRD additionally specifies JSON/CSV for data portability. Exact first-release export format and client-side library choice should be finalized from available free tools. Never export a result without its certainty/period context.

## 13. History / correction

**List:** event date, recorded time, event type, concise description, source manual/AI/OCR if applicable, version/void/correction state.  
**Detail:** before/after summary, linked event, reason if given.  
**Actions:** edit-as-new-version or void when open; correction with link when closed. No physical delete.

## 14. Settings

**Scope:** store profile, defaults for money source (editable per event), period preferences, backup/export status, data information.  
**Security:** do not display secrets. No user accounts/login in MVP.

## 15. Shared states

- **Empty:** explain the next useful step.
- **Loading:** skeleton/spinner with stable layout.
- **Error:** user-safe detail + retry if safe.
- **Disconnected:** clear status, no writing.
- **Stale:** show exact last-loaded time and disable write.
- **Uncertain:** show which numbers are affected and why.
- **Success:** explain what changed in one or two sentences.
- **Conflict/stale:** reload/review; never silently override newer data.

---

# 13 — Backend Schema & Data Model

**Status:** domain/schema proposal aligned to TRD v3. Final DDL must be implemented as SQL migrations and verified against the actual Postgres contract. Table list below is architectural, not a claim that every table has already been created.

## 1. Design rules

- Relational typed tables for core business events; JSON only for derived explanation trees/command result envelope where appropriate.
- Append-only events. Edits/voids/corrections add records/versions rather than overwrite fact history.
- Stable IDs and `toko_id` on tenant-scoped data; composite FKs prevent cross-store references even in single-store deployment.
- Rupiah integer and unit counts as integer; no floating-point money.
- Keep purchase totals and unit counts as source of truth; per-unit average is derived.
- Current product metadata can be updated through an audited path; old purchase/price records remain intact.
- Period snapshots are immutable and carry engine version, sequence/input boundary, certainty, and explanation data.

## 2. Core tables (proposed inventory)

| Table | Responsibility |
|---|---|
| `toko` | one store workspace/settings |
| `product` | product identity, name, base unit, archived state |
| `event` | append-only event header: ID, store, sequence, type, occurrence time, recorded time, precision, command ID, source, supersedes/correction links |
| `ev_stock_check` | physically observed remaining stock per product |
| `ev_purchase` | purchase header: date, source of money, total |
| `ev_purchase_item` | product, packs/units, units per package snapshot, total price, computed base units |
| `ev_damage` | damaged stock outflow |
| `ev_used` | stock used by shop/owner |
| `ev_expense` | operational store expense and money source |
| `ev_other_income` | non-product income |
| `ev_deposit` | actual cash deposited, timestamp and target period/reference |
| `ev_price_change` | effective-dated selling price change |
| `ev_no_sales_statement` | explicit claim of no sales since a check; never substitutes for a stock observation |
| `ev_cash_adjustment` | explicit cash discrepancy/reconciliation correction when approved |
| `ev_setting` | effective-dated settings/default source choices |
| `period_close` | close boundary, completeness, engine version, max input sequence, snapshot reference |
| `snapshot_line` | immutable aggregate lines per period/result category |
| `snapshot_product_state` | frozen stock/value/certainty per product |
| `snapshot_explain` | frozen explanation tree/metadata |
| `command` | idempotency key, normalized payload hash/result, sequence outcome; RPC-only access |
| `audit_log` | non-secret operational audit information/change explanation |
| `backup_log` | backup/restore timestamp and result; never stores private key |

Depending on migrations, some table names may be adjusted, but semantics and invariants cannot be removed without revising this document and tests.

## 3. Common event columns

Suggested common fields:
- `id` UUID or stable identifier;
- `toko_id`;
- `seq` server-assigned monotonic sequence within the store;
- `kind` typed event discriminator;
- `occurred_at` stored in UTC;
- `occurred_precision` (instant/date-only/known interval as supported);
- `recorded_at` server timestamp;
- `command_id` idempotency reference;
- `source` (manual; future parser/OCR only after MVP);
- `supersedes_id` for versioning;
- `correction_of_close_id`/original event reference where applicable;
- `voids_event_id` or equivalent for cancellations.

Use explicit FK, CHECK and UNIQUE constraints rather than only form validation.

## 4. Product and pack history

A purchase item stores the package-content value valid for that event. Product's current default package content may be updated but cannot alter old purchase items. Selling price changes are separate effective-dated events. Purchase-history and package-history screens may be views over event data rather than duplicative source tables.

## 5. Modal model

Per product, the engine maintains two logical pools:
- **Known modal pool:** `{quantity, total_value}`.
- **Unknown modal pool:** quantity with no proven cost.

Moving-average for known modal units uses total known value divided by known quantity, with stable deterministic rounding. Exits consume the selected/policy-defined pool without value leakage; any rounding remainder stays in pool value until later exits. Unknown modal remains unknown unless a user-confirmed, labelled estimate or an approved rule provides a value. Certainty is propagated to result amounts.

## 6. Constraints, indexes, trigger/RPC rules

- CHECK: positive package contents; non-negative quantities unless the event type is a signed correction; monetary values within safe range.
- Unique/idempotency: same store + command ID cannot create multiple effects.
- Sequence and chronology indexes, e.g. `(toko_id, seq)` and `(toko_id, occurred_at, seq)`.
- No cross-store foreign references.
- Append-only enforcement for event/snapshot/command/audit records; UPDATE/DELETE/TRUNCATE refused where policy requires.
- Version chain validation.
- Closed-period gate requires correction relationship rather than direct late mutation.
- Active period range must not overlap; gap/contiguity constraints depend on final early-close rule.
- RLS enabled; `anon` and `authenticated` have no database access in the local-only architecture; `app_server` has limited SELECT and EXECUTE on RPCs.
- Event details cannot be inserted directly from the app role; commit RPC writes header + details in one DB transaction.

## 7. Transaction functions

### `rpc_commit_command`
Responsibilities: acquire store-level concurrency lock; validate store/context; check command ID and payload hash; compare expected max sequence; validate event kinds and closed-period rules; write event headers and detail rows atomically; return IDs/sequence/replayed flag. Same ID/same payload returns existing result; same ID/different payload rejects.

### `rpc_close_period`
Responsibilities: lock closing operation; ensure input sequence current; validate period boundaries and status; create immutable snapshot with engine version and completeness; write required cash adjustment atomically if explicitly selected; mark period closed.

The exact function signature and error codes are established by migration code and integration tests, not by this proposal alone.

## 8. Error codes

Suggested stable app/database error categories: `VALIDATION`, `TS_BAD_PAYLOAD`, `TS_NO_TOKO`, `TS_COMMAND_REUSED`, `TS_STALE`, `TS_BAD_CHAIN`, `TS_CLOSED_PERIOD`, `TS_BAD_CORRECTION`, `TS_PERIOD_GAP`, `TS_APPEND_ONLY`, `TS_UNKNOWN_KIND`, `DB_UNAVAILABLE`, `PARITY_MISMATCH`, `NEED_CONFIRMATION`, `INTERNAL`.

Users see simple Indonesian messages; developer diagnostics preserve safe codes/context without secrets.

## 9. Time and periods

Store event timestamps in UTC and show WIB. Proposed rules: date-only is normalized to noon WIB; chronological ties use server sequence; future events more than five minutes ahead are rejected; weekly period uses Monday 00:00 inclusive to next Monday 00:00 exclusive. Early close and subsequent segment boundaries remain pending until policy is locked. Engine tests and DB constraints must implement exactly one policy.

## 10. Data migration/recovery

All schema changes use versioned SQL migration in Git. Local development DB contains fixtures/seeds; real-data cloud does not receive test seed. Backup/restore must use a full database dump due to cross-table and closed-period constraints. Verify row counts/checksum and constraints after restore. Do not enable live data until restore drill passes.

---

# 14 — Implementation Plan TOKO SAKALA

**Principle:** implement the smallest reliable vertical slice, verify it, then proceed. Do not build all UI/screens before the calculation rules are proven.

## Stage 0 — Document and decision baseline

- [ ] Store this pack under `docs/`.
- [ ] Record decision status in `DECISION_REGISTER.md`.
- [ ] Resolve business questions blocking calculations and period closure.
- [ ] Mark PRD v1.0 baseline and identify revisions that supersede it.
- [ ] Make no claims that draft decisions are locked.

**Exit:** developer can identify what is locked, pending, deferred, and unverified.

## Stage 1 — Repo and local development

- [ ] Create/verify repository; use existing resources when appropriate.
- [ ] Initialize Next.js App Router + TS strict + Tailwind + Radix-based shadcn.
- [ ] Configure pnpm, ESLint, Prettier, TypeScript check, Vitest.
- [ ] Create `.env.example`, `.gitignore`, `README.md`; scan for secrets.
- [ ] Run local PostgreSQL/Supabase CLI for all fixtures and tests.
- [ ] Implement basic health screen and error boundary.

**Exit:** fresh checkout setup succeeds using documented commands; no cloud data touched.

## Stage 2 — Domain and deterministic engine

- [ ] Write event/type unions and Zod schemas.
- [ ] Implement integer money/unit helpers and deterministic rounding.
- [ ] Implement known/unknown modal pools, moving average, and stock conservation.
- [ ] Implement purchase and stock-check interval logic.
- [ ] Implement damage, used stock, unknown stock loss, price/package history.
- [ ] Implement product profit and uncertainty propagation.
- [ ] Implement cash, money-source behavior, deposits, and statuses.
- [ ] Implement price change inside an open interval.
- [ ] Implement period window, closure snapshot, carry-forward differences once period rule approved.
- [ ] Add golden fixtures and hand-calculated expectations.

**Exit:** all approved golden cases pass; deterministic replay; preview/server parity tests set up.

## Stage 3 — Database migrations and atomic commit

- [ ] Implement relational schema/migrations locally.
- [ ] Add FKs, CHECKs, unique/idempotency constraints, append-only rules, RLS and role grants.
- [ ] Implement commit RPC and close-period RPC.
- [ ] Test duplicate command, altered payload, stale sequence, concurrency, closed period, correction chain.
- [ ] Do NOT seed cloud real-data project.

**Exit:** DB tests pass on local Postgres; role/constraint tests document evidence.

## Stage 4 — Server application layer

- [ ] Server-only database connection/repository.
- [ ] Server Actions with Zod and authoritative engine recompute.
- [ ] Standard action result/error union.
- [ ] Stable command ID for idempotent writes.
- [ ] Connection timeouts and DB_UNAVAILABLE behavior.
- [ ] Host guard and localhost binding tests.

**Exit:** one full command commits atomically; retry cannot duplicate; no secret reaches browser.

## Stage 5 — UI vertical slice

Build in this order:
1. App shell and connection status.
2. Setup/product list.
3. Purchase form + preview + save.
4. Stock count + anomaly prompt + preview + save.
5. Damage/used event.
6. Expense and other income.
7. Deposit and status explanation.
8. Close period and read-only snapshot.
9. Report/export and history/correction.

**Exit:** at least one full user path works from UI to real local Postgres and has E2E coverage.

## Stage 6 — UI polish, a11y, UX gate

- [ ] Implement deep teal + warm ivory direction, status semantics, responsive layouts.
- [ ] Check 360px mobile, tablet, desktop.
- [ ] Keyboard and screen-reader review, focus management, reduced motion.
- [ ] Test empty/loading/error/uncertain/offline states.
- [ ] Confirm prohibited technical terms do not leak into primary UI.
- [ ] Verify numbers/formatting against engine output.

**Exit:** UX gate in `15_TESTING.md` passes.

## Stage 7 — Backup, restore, and data-real gate

- [ ] Implement export JSON/CSV and requested PDF/Excel report path as scope permits.
- [ ] Full encrypted DB backup, key private to owner.
- [ ] Restore full backup to empty DB; verify checksums and relations.
- [ ] Validate Supabase limits/pricing directly, no payment method/add-on required.
- [ ] Apply reviewed migrations to a clean Supabase project only at this stage.
- [ ] Test anon/authenticated denial and `app_server` grant boundary in cloud.
- [ ] Verify no test rows in real-data DB.
- [ ] Run localhost binding, Host guard, network reachability, secret scan.

**Exit:** every checkbox of Data Real Gate passes with recorded evidence.

## Stage 8 — Real-data pilot

- [ ] Enter minimal real products only after backup accepted.
- [ ] Reconcile beginning stock manually.
- [ ] Compare first purchase/stock check/deposit against paper/manual calculations.
- [ ] Export data and verify the report.
- [ ] Do not add AI until core behavior is stable and owner approves.

## Stage 9 — Future additions

Only after core sign-off: rule-based text parser, then local/browser OCR, smart restock insights. AI/OCR outputs proposed fields only; all writes use standard preview/confirm/save.

## Reporting cadence for each stage

Developer reports: stage/name; code/resources actually changed; commands/tests and results; open decision; risks; next stage only if exit criteria pass. Never claim tests/security/deploy succeeded without evidence.

---

# 15 — Testing Strategy & Acceptance

**Status:** test matrix and some source artifacts have been discussed. Any prior tests must be attributed exactly to their reported environment; local DB tests do not prove actual Supabase or UI behavior.

## 1. Test layers

1. **Golden business tests:** hand-calculated inputs and expected results.
2. **Unit/invariant tests:** pure calculation engine, rounding, modal pools, certainty propagation.
3. **Database contract tests:** constraints, permissions, idempotency, append-only, RPC atomicity.
4. **Concurrency tests:** simultaneous commands/period closing.
5. **Server Action tests:** input validation, stale-data rejection, DB failure, preview/save parity.
6. **E2E UI tests:** user can run real path end-to-end.
7. **Accessibility tests:** keyboard, focus, contrast, axe checks and labels.
8. **Security tests:** Host guard, localhost binding, secret scan, database role denial.
9. **Backup/restore drill:** full dump → encrypt → restore to empty DB → checksum.
10. **Regression test:** historic snapshots/replay after engine change.

## 2. Golden calculation cases

### GT1 — Package conversion
3 dus × 24 pcs/dus at Rp96.000/dus → 72 pcs, total modal Rp288.000, modal/pcs display Rp4.000.

### GT2 — Stock check sale
Available 72, physical remainder 25 → 47 sold, price Rp7.000 → sales Rp329.000; cost Rp188.000; product profit Rp141.000.

### GT3 — Cash source affects cash, not stock/profit
Same buy/sale as above. If stock-funded purchase: expected cash from events = Rp329.000 − Rp288.000 = Rp41.000 before deposits, excluding any other prior balance/events. If personally funded: expected shop cash from those events = Rp329.000 before deposits. The result must say which source was used.

### GT4 — Unsold stock modal stays in inventory
25 pcs remaining at Rp4.000/pcs represent Rp100.000 remaining modal value; do not subtract all purchased modal from profit.

### GT5 — Moving-average restock
Monday 20 pcs @ Rp4.000; Thursday 20 pcs @ Rp4.200; Sunday remainder 5. Quantity sold 35. Known modal total Rp164.000; moving average Rp4.100; sold cost Rp143.500; ending inventory value Rp20.500.

### GT6 — Unknown initial modal
Stock quantity may be tracked but modal/profit for unknown-cost part stays Belum Diketahui or estimate/Perlu Diperiksa according to approved transition rule. Never label exact certainty without confirmation.

### GT7 — Price change during interval
If price changes while an open interval can include sales, offer a new stock checkpoint. If deferred, sales/cash uses a low/high range and status Perlu Diperiksa. Never invent how many units sold at each price.

### GT8 — Used/damaged/unknown stock
Each physical unit leaves only one bucket: sold, damaged, used, or unexplained discrepancy. Damage/used reduce stock and result, not cash. Unknown loss is not sale; known modal affects result with uncertainty.

### GT9 — Deposit status
- Exact amount + all certainty complete → COCOK.
- Difference with unresolved source/uncertainty → PERLU DIPERIKSA.
- Nonzero definite difference with all relevant components certain → BELUM COCOK.
- No deposit recorded → MENUNGGU SETORAN.

### GT10 — rounding/no value leakage
Unit display may be fractional, but source total and quantity determine values. Exit rounding remainder stays in known modal value; total pool value is conserved.

## 3. Database tests

- Same command ID + same payload: replay previous result; no duplicate rows.
- Same command ID + different payload: reject.
- Stale expected sequence: reject and require reload/review.
- Multi-event command: all events commit or none.
- Append-only UPDATE/DELETE/TRUNCATE denied for protected history.
- `anon` and `authenticated` have no database access under local-only model.
- `app_server` cannot mutate events directly; only permitted reads and RPC.
- Cross-store FK rejected.
- Closed period event requires correction relation.
- Snapshot and period close are atomic.
- Concurrent close/commit cannot create gap/overlap or inconsistent snapshot under approved policy.
- All RLS/GRANT policies have positive and negative tests.

## 4. Server/E2E tests

- Missing/invalid input fails before write.
- Preview output equals server save output for identical state.
- DB unavailable during load does not show fabricated data.
- DB disconnect after load disables save and leaves draft in UI.
- Connection loss at commit retries with same ID and does not duplicate.
- Save success is shown only after authoritative server response.
- Stock count anomaly shows one useful question.
- Confirmation cancel produces no event.
- Undo/void creates traceable event.
- Closed-period correction produces current-period event while old snapshot remains unchanged.
- Every view has loading, empty, error, success, disconnected and uncertainty state.

## 5. Security tests / Data Real Gate

- App listens only on `127.0.0.1`; request from another device in LAN fails.
- Host header not in localhost allowlist returns 403; test `Host: evil.example`.
- No tunnel/port forwarding/remote dev runtime; Ports list checked.
- Secret scan finds no credential in repo, public bundles, Git history as configured, logs or prompts.
- `.env.local` ignored and never bundled.
- Cloud database has no test/demo rows.
- Supabase role tests run against actual project; local PostgreSQL tests do not substitute.
- First backup restored into an empty database and verified.
- Terms/limits/pricing checked; no payment card/add-on accepted.

## 6. UX gate

- Primary UI has no HPP/COGS/debit/credit/journal/reconciliation/batch jargon.
- Status always includes words/icons, not color alone.
- Inputs labelled; keyboard use and visible focus work.
- Contrast target ≥4.5:1 and touch target ≥44px.
- Mobile width 360px: no broken form or hidden action.
- Dashboard has five key answers max.
- Stock count is focused and preview never mistaken for saved data.
- “Belum diketahui” and “Perlu diperiksa” show affected figures.
- User can find “Kenapa?” explanation from core numbers.

## 7. Regression and snapshot testing

After any engine change:
1. bump/version the engine if output semantics change;
2. replay all approved fixtures;
3. compare snapshot output for existing saved closes using the snapshot's engine version;
4. test deltas do not mutate old snapshot;
5. record exact changed values and reason in release notes;
6. do not update goldens solely to conceal a failing behavior.

## 8. Evidence reporting

Every test summary says: environment (local Postgres vs Supabase), command/fixture, count of passed/failed, skipped/uncovered areas, timestamp/build commit. Do not claim “70 assertions pass” as proof of formula, Supabase integration, browser behavior, or restore to Supabase unless those exact tests ran there.

---

# 16 — Error Fix & Problem Solving Playbook

## 1. Golden rule

**Reproduksi → identifikasi lapisan → buat test → perbaiki akar masalah → jalankan test ulang → laporkan bukti.** Jangan menambal UI untuk menutup bug rumus/database dan jangan mengubah histori agar angka tampak cocok.

## 2. Incident classification

- `VALIDATION`: input kosong/salah tipe/di luar rentang.
- `STALE`: state telah berubah sejak preview; reload/re-preview.
- `CONFLICT`: aturan bisnis atau period range konflik.
- `NEED_CONFIRMATION`: aksi berisiko memerlukan persetujuan.
- `CLOSED_PERIOD`: event perlu koreksi, bukan mutasi historis.
- `DB_UNAVAILABLE`: database tak dapat dicapai.
- `PARITY_MISMATCH`: preview vs hasil engine/server tidak identik.
- `TS_COMMAND_REUSED`: command ID yang sama dikirim dengan payload berbeda.
- `TS_BAD_CHAIN`: rantai edit/void/correction tidak valid.
- `TS_APPEND_ONLY`: percobaan mengubah/menghapus record historis.
- `TS_PERIOD_GAP`: range periode tidak memenuhi kebijakan yang disahkan.
- `INTERNAL`: kegagalan tak terduga; detail teknis hanya di log aman.

## 3. Diagnosis cepat

### A. Angka preview dan hasil simpan berbeda
1. Simpan request/fixture dan sequence, tanpa secret.
2. Bandingkan `EngineInput` preview dengan input authoritative server.
3. Pastikan versi engine, history prices, event sort `(occurred_at, seq)`, `asOf`, dan certainty sama.
4. Jalankan golden test minimal yang mereproduksi.
5. Perbaiki satu engine bersama; jangan membuat rumus khusus di komponen.
6. Tambahkan regression fixture. Jangan menampilkan preview sebagai hasil final jika mismatch.

### B. Penjualan menjadi negatif / sisa lebih besar dari tersedia
1. Pastikan pembelian/restock tidak tertinggal.
2. Pastikan event urut tanggal/waktu benar.
3. Jangan insert penjualan negatif.
4. Minta user pilih: belanja belum dicatat, salah hitung, atau tidak tahu.
5. Jika tidak tahu, buat event selisih stok dengan kepastian Perlu Diperiksa.
6. Tambahkan test untuk kombinasi tersebut.

### C. Keuntungan salah
1. Periksa jumlah terjual dan harga jual yang berlaku.
2. Periksa modal known/unknown dan moving-average pool.
3. Periksa kerusakan, barang dipakai, selisih barang, pendapatan lain, biaya.
4. Periksa pembulatan dan sisa nilai di inventory pool.
5. Periksa apakah barang terhitung ganda antara penjualan dan rusak/dipakai.
6. Perbaiki engine dan golden test; jangan mengoreksi total tanpa tautan ke event sumber.

### D. Uang seharusnya tidak cocok
1. Pastikan sumber uang belanja dan pengeluaran dicatat per kejadian.
2. Pisahkan penjualan dari pendapatan lain.
3. Pastikan setoran bukan income dan tidak dihitung dua kali.
4. Pastikan unknown/price-mixed components memberi status Perlu Diperiksa.
5. Baca tree penjelasan; tampilkan kandidat secara netral.
6. Jika semua sumber pasti dan selisih tetap ada, tampilkan BELUM COCOK; jangan membuat penyesuaian otomatis.

### E. Save timeout / tidak tahu tersimpan atau tidak
1. Jangan membuat command ID baru.
2. Retry dengan `command_id` yang sama.
3. Jika command ledger mengatakan replay, kembalikan hasil lama.
4. Jika DB unavailable, simpan draft hanya dalam state layar dan beri tahu belum pasti tersimpan.
5. Periksa database dengan jalur akses yang benar; jangan double-submit untuk “memastikan”.

### F. Periode tertutup
1. Jangan update/delete langsung.
2. Gunakan previewCorrection terhadap snapshot asli dan event correction sebelumnya.
3. Minta konfirmasi eksplisit.
4. Tambahkan reversal + new event ke periode berjalan, dengan link asal.
5. Verifikasi snapshot lama tidak berubah dan delta baru tampak pada periode berjalan.

### G. `TS_COMMAND_REUSED`
ID command yang sama berarti retry payload persis sama. Jika payload berubah, jangan gunakan ID itu. Buat draft baru hanya setelah memastikan operasi sebelumnya telah dipahami; bila commit sebelumnya tidak pasti, query hasil idempotency dulu.

### H. Cloud tidak tersambung/proyek dijeda
1. Jangan menyatakan data hilang sebelum pemeriksaan.
2. Tampilkan DB_UNAVAILABLE dan hentikan write.
3. Periksa status Supabase dan `DATABASE_URL` tanpa membagikan secret.
4. Pastikan timeout terbatas dan server lokal tetap bound ke localhost.
5. Ikuti runbook owner; jangan upgrade/beli add-on otomatis.

### I. Host guard atau localhost security test gagal
1. Hentikan penggunaan data nyata.
2. Pastikan process bind `127.0.0.1`, bukan `0.0.0.0`.
3. Uji Host allowlist dan origin checking.
4. Periksa tunnel, forwarded ports, dev container, VM, reverse proxy.
5. Jangan membuka ke LAN/public sampai desain identitas dan akses baru disetujui.

### J. Backup gagal / restore tidak identik
1. Jangan hapus backup sebelumnya yang masih terverifikasi.
2. Catat exit code, waktu, versi Postgres, dan ukuran file; tanpa mengekspos key.
3. Ulangi backup ke file baru dan verifikasi checksum.
4. Restore full database ke DB kosong, termasuk extension, role, trigger, RLS, constraint.
5. Bandingkan row count/checksum untuk event, purchase items, period snapshots, command log.
6. Jika berbeda, tandai backup belum valid dan jangan membuka gerbang data nyata.

## 4. Prosedur perbaikan umum

1. Buat reproduksi minimal (golden input/E2E).
2. Tentukan sumber kebenaran: event, engine, database atau UI.
3. Tambahkan regression test sebelum atau bersama patch.
4. Perbaiki akar masalah, jangan menyamarkan gejalanya.
5. Jalankan lint, typecheck, relevant unit/DB/E2E, lalu build.
6. Review migrasi dan data historis.
7. Catat perubahan rumus/status/schema pada decision log.
8. Jangan deploy/masukkan data nyata bila gerbang terkait belum lulus.

## 5. Format laporan bug

```text
ID / tanggal:
Lingkungan + commit:
Gejala yang terlihat:
Langkah reproduksi:
Input + sequence/period (tanpa rahasia):
Expected:
Actual:
Lapisan kemungkinan:
Test yang ditambah:
Perbaikan:
Perintah/test yang dijalankan + hasil:
Risiko/regresi yang tersisa:
Status: OPEN / FIXED-LOCAL / VERIFIED-SUPABASE / VERIFIED-E2E
```

`FIXED-LOCAL` tidak boleh dilaporkan sebagai `VERIFIED-SUPABASE` atau `VERIFIED-E2E`.
