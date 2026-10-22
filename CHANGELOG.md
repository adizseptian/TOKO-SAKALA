# Changelog

## v0.2.0 — Google AI Studio adapter
- Mengganti entry point framework starter dari Next.js App Router menjadi React + Vite + TypeScript untuk memudahkan impor Build mode.
- Menambahkan `metadata.json` tanpa permintaan izin perangkat.
- Menambahkan sakelar Asisten AI OFF/ON (default OFF); panel ON masih placeholder dan tidak memanggil model AI.
- Mempertahankan engine awal, Zod schemas, golden tests, 16 dokumen spesifikasi, dan migration SQL draft.
- Menghapus kebutuhan menyertakan `.git` pada ZIP agar tidak menimpa metadata GitHub Desktop repository yang sudah ada.
- Menambah instruksi mengganti file pada clone yang sudah ada, lalu commit + Push origin.

## Batas versi
Tidak ada persistence transaksi dan belum siap untuk data toko nyata. Adaptasi framework belum mengunci arsitektur produksi akhir.
