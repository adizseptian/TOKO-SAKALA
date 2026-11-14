# 06 — INTERACTION & STATE TRANSITION MAP (MODE A — TOKO SAKALA)

**Tanggal:** 13 November 2026  
**Prinsip Utama:** **Tap-First & Financial-Safety-First.** Setiap tindakan di aplikasi harus dapat dilakukan dengan satu ketukan (`single tap`) dan navigasi keyboard penuh. Gestur sentuh (*swipe/drag/long-press*) hanya berperan sebagai akselerator opsional dan **tidak boleh pernah menjadi satu-satunya cara** atau memicu simpan/hapus transaksi finansial secara diam-diam.

---

## 1. Spesifikasi Gestur Lengkap (Aturan Wajib 9 Atribut)

| # | Nama Gestur | 1. Trigger & Zona Sentuh | 2. Ambang Jarak / Waktu / Kecepatan | 3. Umpan Balik Visual & Haptic-Visual | 4. Pembatalan (`Cancel`) | 5. Konflik OS & Scroll | 6. Alternatif Keyboard | 7. Alternatif Tombol Terlihat (Tap) | 8. Catatan Aksesibilitas (WCAG 2.2) | 9. Pengaman Finansial |
|---|---|---|---|---|---|---|---|---|---|---|
| **G-01** | **Bottom Sheet Drag-to-Dismiss** (`CartSheet`, `TimelineSheet`, `ModalForm` mobile) | Handle bar di bagian paling atas sheet (`height: 40px`, lebar penuh sheet). | Tarik ke bawah `>= 96px` atau kecepatan `> 0.45 px/ms`. | Sheet mengikuti posisi jari 1:1 (tanpa lag); backdrop memudar proporsional. Mengikuti `prefers-reduced-motion` (snap langsung saat dilepas). | Jika dilepas di bawah ambang batas `< 96px`, sheet memantul kembali ke posisi terbuka (`160ms`). | Hanya aktif jika area scroll internal sheet berada di `scrollTop === 0` dan arah awal `|dy| > 1.5 * |dx|` ke bawah; **tidak memblokir** swipe tepi kiri/kanan Back OS Android. | Tombol `Escape` menutup sheet dan mengembalikan fokus ke tombol pemicu. | Tombol tutup `✕` berukuran `>= 44×44 px` di header sheet (`aria-label="Tutup"`) + klik area backdrop di luar sheet. Memenuhi **SC 2.5.7**. | Jika ada perubahan draft belum tersimpan di form sheet, munculkan dialog konfirmasi singkat *"Buang draft?"* — tidak menyimpan diam-diam. |
| **G-02** | **Horizontal Scroll Chip Kategori & Periode** (`Catat`, `Stok`, `Riwayat`) | Area baris chip di bawah bar pencarian (`height >= 44px`). | Geser horizontal `> 12px` di dalam kontainer `.chip-scroll-row`. | Scroll native halus dengan indikasi tepi gradient/fade tipis (bukan panah paksa) bila masih ada chip tersembunyi. | Melepas jari menghentikan scroll alami (*inertia*). | Terisolasi di `overflow-x: auto; touch-action: pan-x pan-y;` sehingga **tidak memicu** horizontal overflow body maupun tab swipe halaman. | `Tab` + `ArrowLeft`/`ArrowRight` atau `Enter` pada setiap `<button>` chip. | Chip tetap dapat diketuk langsung (`>= 44px`); di desktop seluruh chip terbungkus (`flex-wrap: wrap`). | Scrollbar tidak mengganggu keterbacaan teks; fokus elemen ter-scroll otomatis masuk viewport (`scroll-margin`). | Hanya mengubah filter tampilan (`view state`), nol perubahan data atau transaksi. |
| **G-03** | **Swipe / Pull-to-Refresh Sync Manual** (`Pengaturan` & header list — Opsional) | Hanya pada area atas daftar jika `scrollTop === 0`, dan **dinonaktifkan di dalam form input** (`Catat`, `Stok`, `Setoran`). | Tarik ke bawah `>= 80px` dan tahan saat indikator *"Lepas untuk sinkron"* aktif. | Indikator teks jujur (`"Menarik pembaruan..."` -> `"Tersinkron vX"` / `"Gagal: ..."`). Tanpa animasi berputar dekoratif jika reduced motion aktif. | Mengembalikan jari ke atas sebelum `80px` membatalkan refresh. | Dilarang aktif di layar form input (`Setoran`, `Catat`, `Stok`) agar tidak bentrok dengan scroll form atau keyboard virtual Android. | Tombol `Refresh / Sinkronkan Sekarang` (`Enter`/`Space`). | Tombol eksplisit **`Sinkronkan Sekarang`** (`App.tsx:5456`) selalu tersedia dan terlihat jelas. | Memenuhi **SC 2.5.7** (single-pointer button alternative). | Pull-to-refresh hanya memicu `syncNow()` (baca/dorong outbox aman yang sudah divalidasi), **tidak** pernah men-submit draft form aktif. |
| **G-04** | **Tap & Hold Stepper Cepat** *(Hanya untuk qty non-kritis, opsi peningkatan di Mode B)* | Tombol `+` / `-` (`>= 44×44 px`) pada `Stok` & `Pecahan Setoran`. | Ketuk tunggal = `±1`. Tahan `>= 500ms` (opsional, dibatasi maks 4 langkah/detik). | Efek tekan fisik `2px` (`translateY(2px)`), angka langsung terbarukan dengan `tabular-nums`. | Melepas jari langsung menghentikan kenaikan tanpa sisa momentum. | Dibatasi tidak terpicu saat user sedang men-scroll daftar secara vertikal (`touchmove` > `8px` langsung membatalkan timer hold). | Input angka langsung (`inputMode="numeric"`) + tombol `+` / `-` individual via `Enter`/`Space`. | Ketuk tunggal `+` / `-` atau mengetik angka langsung pada field numerik. | Setiap perubahan langsung dapat diedit balik; nilai `blank` ke `1` tetap berada di state `Pratinjau` hingga user menekan `Simpan`. | Tidak pernah mengirim transaksi ke DB saat menekan `+` / `-`. Menjaga penuh `blank ≠ 0` (decrement disabled di `0` / `blank`). |
| **G-05** | **Row Click -> Detail & Aksi Lanjutan (`Riwayat` / `Beranda`)** | Seluruh kartu baris catatan menggunakan **`<button type="button">`** (atau tombol aksi eksplisit di dalam kartu). | Ketuk tunggal (`tap`). | Highlight singkat `--canvas` + fokus ring `3px --blue`; membuka `DetailModal` yang berisi tombol **`Batalkan (Void)`** (jika periode terbuka) atau info gembok periode tertutup. | Tutup `DetailModal` dengan `✕`, `Escape`, atau klik luar tanpa efek samping. | **TIDAK ADA swipe-to-delete** dan **TIDAK ADA long-press delete** di baris riwayat untuk mencegah penghapusan tak sengaja saat men-scroll di HP satu tangan. | `Tab` -> `Enter`/`Space` membuka `DetailModal`; semua aksi ada sebagai tombol standar di dalam modal. | Ketuk baris -> tombol eksplisit `Batalkan Catatan (Void)` dengan dialog konfirmasi + alasan. | Menghapus seluruh 10 `<div role="button">` tanpa `onKeyDown`; memenuhi **SC 2.1.1 Keyboard** & **SC 2.5.7**. | Memblokir total penghapusan permanen; periode tertutup hanya mengizinkan tombol *"Buat Catatan Koreksi"* yang tertaut ke event asal. |

---

## 2. State Machine 1 — Siklus Hidup Form & Kejujuran Input

```
[BLANK: "Belum diisi" / '—']
   │ (User mengetik angka / menekan '+' atau tombol eksplisit '0 (Habis)')
   ▼
[DRAFT / PRATINJAU: "Pratinjau — belum disimpan"]
   │─(Validasi lokal gagal: kosong wajib / negatif / rusak > stok / tanggal >5 menit ke depan)─► [VALIDATION ERROR INLINE] (input sah dipertahankan)
   │
   │ (User menekan tombol 'Simpan ...')
   ▼
[LOCAL COMMITTED (IndexedDB vN)] ──► Menulis ke IndexedDB + Antrean Outbox (idempotencyKey + payload)
   │
   ├─► (Offline / Belum Konfigurasi Cloud) ─► Banner/Toast: "Tersimpan di perangkat (lokal vN)"
   │
   └─► (Target Arsitektur Saat TRD v2 Disahkan) ─► Kirim ke Edge Function/RPC [NOD-01: IMPLEMENTATION BLOCKED — TRD v2 absen di workspace]
         ├─(ACK server cocok dgn vN) ──────► Status: "Tersimpan & Terkonfirmasi Server (vN)"
         └─(Gagal / Konflik versi / Timeout) ► Tetap aman di Outbox: "Tersimpan lokal · N tertunda" + tombol "Sinkronkan Sekarang"
```

### Aturan Status Wajib di State Machine Form:
1. **`blank` vs `0`:** Input jumlah stok atau setoran yang tidak disentuh bernilai `null` / `''` (`"Belum diisi"`), **bukan `0`**. Menjadikan `0` hanya bisa lewat ketikan `"0"` atau tombol eksplisit `"Nol (Habis)"`.
2. **`unknown`:** Sumber uang *"Belum tahu"* atau harga modal belum diketahui (`costPerPack = null/undefined`) disimpan sebagai kondisi `BELUM_DIKETAHUI` dan memicu label `"Perlu diperiksa"` — tidak pernah diisi `0`.
3. **Preview vs Confirmed:** Tidak ada autosave diam-diam pada transaksi keuangan saat mengetik. Status `"Pratinjau — belum disimpan"` wajib tampil sampai tombol simpan ditekan.

---

## 3. State Machine 2 — Status Sinkronisasi Jujur (`SyncEngine`)

Memperbaiki bug kritis `pendingCount: 0` di `src/storage/syncEngine.ts:84`:

| Kondisi Nyata Sistem | `pendingCount` | `serverConfirmedVersion` | Label UI Wajib (`Header`, `Rail`, `Pengaturan`) | Warna & Ikon (Non-Pulse) |
|---|---|---|---|---|
| Belum konfigurasi cloud (`!configured`) | `0` atau `>=0` | `null` | **`Tersimpan di perangkat (Lokal)`** | Netral (`--ink` / `--muted`) + Ikon `HardDrive` |
| Sedang offline (`!isOnline`) | `0` | Ada / null | **`Offline · Data lokal aman`** | `--amber` + `--amber-pale` + Ikon `WifiOff` |
| Sedang offline atau gagal sync **dan ada antrean** | `> 0` | `< localVersion` | **`Tersimpan lokal · {N} tertunda`** | `--amber` + `--amber-pale` + Ikon `Clock` |
| Sedang mengirim (`isSyncing === true`) | `>= 0` | Menunggu | **`Menyinkronkan ke server...`** | `--blue` + `--blue-pale` + Ikon `RefreshCw` *(statis jika reduced-motion)* |
| Error server / Auth kedaluwarsa (`lastError !== null`) | `>= 0` | `< localVersion` | **`Gagal sinkron · Data tetap aman di HP`** *(+ pesan ringkas & tombol Coba Lagi)* | `--red` + `--red-pale` + Ikon `AlertTriangle` |
| Konfigurasi aktif, outbox `0`, & server mengonfirmasi `serverVersion === localVersion` | `0` | `=== localVersion` | **`Terkonfirmasi server (v{N})`** | `--green` + `--green-pale` + Ikon `CheckCircle2` |

> **Aturan Mutlak (`DL-04` & `NOD-04`):** Label `"Terkonfirmasi server"` / `"Tersinkron"` **DILARANG** muncul bila `pendingCount > 0` atau `serverConfirmedVersion !== localVersion`. Status header Notification Bell bersifat **`CONDITIONAL`**: hanya boleh dipertahankan jika didasari antrean sinkronisasi lokal nyata, kegagalan sinkronisasi terkonfirmasi, atau peringatan stok berbasis data aktual dengan tindakan bermakna; jika tidak terbukti fungsional, keluarkan dari rilis awal.

---

## 4. State Machine 3 — Strict Append-Only (`NOD-03: LOCKED` & `NOD-03B: DEFERRED`)

Menggantikan `handleDeleteRecord` (`App.tsx:703–721`) dan `handleUndoSave` (`1164–1175`):

```
[EVENT FINANSIAL CANCELLABLE AKTIF (Periode Normal Terbuka)]
   ├── Aksi: "Batalkan Catatan (Void)" + Alasan wajib + Referensi Event Asal
   │     └──► Mencatat Event baru: { kind: 'VOID', voidsEventId: event.id, reason, occurredAt }
   │          (Event asli tidak dihapus & tetap tersimpan; master data, konfigurasi, snapshot, dan event sistem
   │           TIDAK otomatis dapat di-VOID)
   │
   └── Tutup Periode Normal (`period_close` -> snapshot immutable; Early Close DEFERRED/EXCLUDED per NOD-03B)
         └──► Event masuk ke [PERIODE TERTUTUP (BEKU / IMMUTABLE)]
               ├── Tombol "Batalkan / Edit" DIKUNCI (Ikon Gembok + pesan: "Periode sudah ditutup")
               └── Aksi yang diizinkan: "Buat Catatan Koreksi"
                     └──► Mencatat Event baru pada periode aktif saat ini: { kind: 'CORRECTION', correctionOfCloseId, supersedesEventId, delta, reason }
```

- **Semantik Undo (`saveResultModal`):** Menekan `Urungkan` segera setelah simpan **tidak menimpa balik snapshot lama** (`previousPayload`), melainkan memanggil mekanisme `VOID` atas `eventId` / `commandId` transaksi finansial yang baru dibuat dengan alasan + referensi event asal (`NOD-03`).
- **Larangan *Early Close* (`NOD-03B — DEFERRED — EXCLUDED FROM INITIAL RELEASE`):** Tidak ada state transition, kontrol, pengaturan, notifikasi, ataupun mekanisme perpindahan periode otomatis untuk *Early Close* pada cakupan rilis awal; hanya alur penutupan periode normal yang digunakan.

---

## 5. Isolasi Mode Data Contoh (`Sandbox Isolation`)

- Bila user menekan **"Muat data contoh"**:
  - Data contoh disimpan di namespace/database terpisah (`toko_sakala_sandbox_db`) atau ditandai ketat sebagai `sandboxMode: true` dengan **pemblokiran mutlak** di `SyncEngine` & `GoogleDriveAdapter` (`if (isSandboxMode) abortCloudSync()`).
  - Banner kuning persisten muncul di atas layar: *"Mode Simulasi Data Contoh — tidak tersinkron ke cloud toko nyata"*.
  - Menghapus data contoh hanya membersihkan ruang sandbox dan mengembalikan workspace toko nyata dalam kondisi bersih.
