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
