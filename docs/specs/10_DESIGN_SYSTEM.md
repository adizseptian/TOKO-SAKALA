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
