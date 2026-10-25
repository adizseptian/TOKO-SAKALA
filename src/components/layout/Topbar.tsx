import { useMemo } from 'react';
import { Menu, Plus, Moon, Sun, ShoppingBasket, Calendar } from 'lucide-react';
import type { ScreenId } from '@/types/store';
import { useStore } from '@/context/StoreContext';

interface TopbarProps {
  currentScreen: ScreenId;
  onOpenMobile: () => void;
  onQuickAction: () => void;
}

const SCREEN_TITLES: Record<ScreenId, { title: string; subtitle: string }> = {
  beranda: { title: 'Ringkasan Toko', subtitle: 'Dasbor keuangan dan stok barang' },
  barang: { title: 'Katalog Barang', subtitle: 'Daftar produk, harga jual, dan stok saat ini' },
  belanja: { title: 'Catat Belanja', subtitle: 'Input barang masuk, jumlah kemasan, dan modal' },
  'cek-sisa': { title: 'Cek Sisa Fisik', subtitle: 'Perhitungan sisa barang untuk deteksi penjualan' },
  setoran: { title: 'Setoran dari Karyawan', subtitle: 'Serah terima uang hasil usaha dari karyawan ke owner' },
  laporan: { title: 'Laporan Keuangan', subtitle: 'Rekapitulasi penjualan, laba rugi, dan rekonsiliasi kas' },
  asisten: { title: 'Asisten Pencatatan', subtitle: 'Konversi catatan teks bebas menjadi draft transaksi' },
  riwayat: { title: 'Jejak Riwayat', subtitle: 'Daftar kronologis seluruh aktivitas dan perubahan toko' },
  pengaturan: { title: 'Pengaturan Toko', subtitle: 'Preferensi tema, cadangan data, dan opsi sistem' }
};

export function Topbar({ currentScreen, onOpenMobile, onQuickAction }: TopbarProps) {
  const { theme, setTheme } = useStore();
  const screenInfo = SCREEN_TITLES[currentScreen] || {
    title: 'TOKO SAKALA',
    subtitle: 'Sistem Pencatatan Toko'
  };

  const todayFormatted = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(new Date());
    } catch {
      return 'Hari ini';
    }
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-[var(--bg-card)]/90 backdrop-blur-md border-b border-[var(--border-subtle)] px-4 sm:px-8 flex items-center justify-between gap-4">
      {/* Zone 1: Mobile toggle + Breadcrumb & Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobile}
          className="p-2 -ml-2 rounded-2xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] lg:hidden transition-colors"
          aria-label="Buka navigasi utama"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-dim)]">
            <span className="font-semibold text-[var(--primary)]">Sakala CRM</span>
            <span>/</span>
            <span className="text-[var(--text-muted)] capitalize">
              {currentScreen.replace('-', ' ')}
            </span>
          </div>
          <h1 className="text-base font-bold text-[var(--text-main)] tracking-tight truncate">
            {screenInfo.title}
          </h1>
        </div>
      </div>

      {/* Zone 2: Date & Context indicator (BrightPolicy ivory pill) */}
      <div className="hidden md:flex items-center gap-2.5 text-xs">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-main)] font-medium">
          <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
          <span>{todayFormatted}</span>
        </div>
      </div>

      {/* Zone 3: Actions (Theme Toggle & Primary Action) */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2.5 rounded-2xl text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--bg-elevated)] hover:bg-[var(--border-subtle)] border border-[var(--border-subtle)] transition-colors"
          aria-label={`Ubah ke mode ${theme === 'dark' ? 'terang' : 'gelap'}`}
          title={`Ubah ke mode ${theme === 'dark' ? 'terang' : 'gelap'}`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-700" />}
        </button>

        <button
          type="button"
          onClick={onQuickAction}
          className="sakala-btn sakala-btn-primary h-10 px-4 text-xs whitespace-nowrap rounded-2xl font-bold"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Catat Belanja</span>
          <ShoppingBasket className="w-4 h-4 sm:hidden" />
        </button>
      </div>
    </header>
  );
}
