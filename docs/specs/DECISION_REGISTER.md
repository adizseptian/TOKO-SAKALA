# Decision Register — TOKO SAKALA

Tanggal konsolidasi: 21 Oktober 2026.

## A. Locked / accepted

| ID | Keputusan | Status |
|---|---|---|
| D-001 | Nama aplikasi TOKO SAKALA | LOCKED |
| D-002 | Prinsip utama: “Jangan membuat pengguna memahami sistem. Buat sistem yang memahami pengguna.” | LOCKED |
| D-003 | Pengguna mencatat kejadian; sistem hitung, periksa, jelaskan | LOCKED |
| D-004 | UI approach B: sederhana tetapi modern | APPROVED DIRECTION |
| D-005 | Prioritas tahap pertama: keseimbangan kemudahan dan akurasi | APPROVED DIRECTION |
| D-006 | Core MVP dibangun tanpa AI/OCR; AI/OCR setelah core stabil | LOCKED/DIRECTION |
| D-007 | Bahasa UI utama Indonesia sederhana; istilah akuntansi teknis tidak di layar utama | LOCKED |
| D-008 | Dashboard menjawab maksimal lima pertanyaan inti; focus mode untuk input | LOCKED |
| D-009 | Preview dua sisi: barang & hasil; uang & setoran; mobile ditumpuk vertikal | LOCKED DIRECTION |
| D-010 | Keuntungan ≠ uang toko ≠ setoran | LOCKED |
| D-011 | Input stok fisik/sisa; penjualan turunan jika 0 ≤ terjual ≤ tersedia | LOCKED |
| D-012 | Tidak ada penjualan negatif; anomaly menjadi Perlu Diperiksa | LOCKED |
| D-013 | Moving average digunakan, bukan FIFO | LOCKED DIRECTION |
| D-014 | Event append-only; edit jadi versi, cancel/void tercatat, koreksi closed period melalui reversal + new event | LOCKED PRINCIPLE |
| D-015 | Harga beli, harga jual, dan isi kemasan berhistoris; harga lama tidak ditimpa | LOCKED |
| D-016 | Semua angka membawa certainty: Pasti / Perlu Diperiksa / Belum Diketahui | LOCKED |
| D-017 | Satu calculation engine untuk preview, save, dashboard, report, explanation, export, deposit check | LOCKED PRINCIPLE |
| D-018 | Produk/stok yang belum dicek bukan nol dan bukan terjual nol | LOCKED |
| D-019 | Barang rusak/dipakai/tidak diketahui tidak boleh diam-diam dianggap terjual | LOCKED |
| D-020 | Restock tidak membuat periode baru | LOCKED |
| D-021 | Setoran adalah uang aktual, dapat beberapa kali per periode, bukan pendapatan | LOCKED |
| D-022 | AI/OCR hanya proposal; semua write melalui validasi, preview, confirm, standard command | LOCKED FOR FUTURE |
| D-023 | Tidak ada non-tunai/piutang pada MVP; model awal memperlakukan penjualan sebagai tunai | LOCKED SCOPE (revisit only by change request) |
| D-024 | Satu toko/operator lokal; no login; tidak boleh public/LAN; data nyata protected by local/DB/backup gates | LOCKED SCOPE + SAFETY GATE |
| D-025 | Target biaya Rp0; bila layanan meminta kartu/add-on, berhenti dan laporkan | LOCKED GOAL |
| D-026 | Pengguna memilih pendekatan sederhana namun modern setelah sebelumnya khawatir aplikasi menjadi rumit | APPROVED DIRECTION |

## B. Pending explicit lock

| ID | Decision | Kenapa pending |
|---|---|---|
| P-001 | Default awal sumber uang untuk belanja/pengeluaran | Mekanisme bertanya sekali dan dapat mengubah per transaksi disepakati; pilihan awal toko/pribadi belum aman diasumsikan |
| P-002 | Early close vs boundary minggu kalender | APPFLOW mendukung close early; TRD mengusulkan segmen berurutan mulai pada waktu close, sementara minggu kalender tetap Senin–Minggu |
| P-003 | Periode pertama dan periode yang dibuka bersamaan: aturan final penyusunan boundary | Perlu satu aturan tanpa gap/overlap lintas engine/database/report |
| P-004 | Tanggal date-only → pukul 12.00 WIB | Disebut di TRD, menunggu §22/sign-off |
| P-005 | Event >5 menit di masa depan ditolak | Disebut di TRD, menunggu §22/sign-off |
| P-006 | Kebijakan identifikasi actor/audit tanpa login | Sumber manual/AI/OCR tercatat, tetapi “oleh siapa” tidak bisa dijamin tanpa identity layer |
| P-007 | Rincian kapan Undo masih boleh berlaku vs wajib correction | Prinsipnya locked; batas teknis mengikuti periode/event state |
| P-008 | Exact export support at MVP: report PDF/Excel vs data JSON/CSV | PDF/Excel diminta; TRD emphasizes JSON/CSV portable; urutan implementasi perlu disepakati |
| P-009 | Threshold outlier “penurunan stok jauh di luar pola” | Harus berupa konfigurasi yang diuji, bukan ambang yang dikarang |
| P-010 | Confidence threshold OCR/AI | Deferred; belum dikalibrasi dan tidak blocking MVP |
| P-011 | Whether unknown initial modal is estimated from first later purchase and exact pool transition | Draft says estimate with Perlu Diperiksa; engine spec/test must fix exact deterministic handling |
| P-012 | Close-time deposit requirement and semantics of “tidak ada setoran” | Flow described; precise data model/policy must be made consistent |
| P-013 | PRD §22 approval checklist (8 items) | APPFLOW revision says pending; do not mark PRD v1.1/TRD v3 locked until checked against current source docs and test evidence |

## C. Not verified / do not claim complete

- Real implementation of Host guard and test `Host: evil.example -> 403`.
- Actual binding to 127.0.0.1 tested from another device.
- Supabase real project role/RLS/RPC behavior.
- Formula engine complete and all money golden tests passing.
- UI/E2E/accessibility behavior.
- Actual Supabase restore drill and checksum parity.
- Cloud project settings/pricing/pause state at moment of use.
- Security review of every Server Action/migration.
- PDF/Excel export as implemented feature.

## D. Change control

Any change to locked business rules requires: (1) decision ID/reason, (2) affected PRD/APPFLOW/TRD/engine/schema/screens/tests, (3) new golden case, (4) owner approval, (5) migration/engine version handling, (6) changelog. Do not silently move Pending to Locked.
