# Panduan ringkas: ZIP → GitHub Desktop → Google AI Studio

## A. Update repository yang sudah ada

Karena repository `toko-sakala` sudah dibuat, **jangan membuat repository dengan nama itu sekali lagi**.

1. Unduh ZIP ini lalu ekstrak ke folder sementara.
2. GitHub Desktop → pilih repository `toko-sakala` → Repository → Show in Explorer.
3. Buat salinan cadangan folder clone jika perlu.
4. Tutup editor. Ganti semua file proyek lama dengan isi folder ZIP ini, tetapi **jangan hapus folder `.git` di root clone**. ZIP yang disediakan tidak mengandung folder `.git`.
5. Pastikan `package.json` ada langsung di root repository.
6. Buka GitHub Desktop → Changes → review diff dan file yang dihapus/ditambahkan.
7. Commit: `chore: adapt TOKO SAKALA starter for Google AI Studio`.
8. Klik **Push origin**.

## B. Impor ke AI Studio

1. Buka Google AI Studio → Build.
2. Pilih Add files (+) → Import from GitHub.
3. Pilih repo `toko-sakala` dan branch terbaru.
4. Buka `AI_STUDIO_START_PROMPT.md`; tempel prompt auditnya.
5. Minta pemeriksaan `npm install`, `npm run test`, dan `npm run build` terlebih dahulu.

## C. AI OFF/ON

Default OFF. Pengaturan menyimpan preferensi UI saja. ON tidak menghubungkan model pada versi ini. Tidak memerlukan API key. Jangan memasukkan secret atau data toko nyata.
