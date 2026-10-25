import {
  Home,
  Package,
  ShoppingBasket,
  ClipboardCheck,
  Banknote,
  FileChartColumn,
  Sparkles,
  History,
  Settings2,
  X,
  Store,
  Layers,
  CheckCircle2
} from 'lucide-react';
import type { ScreenId } from '@/types/store';
import { useStore } from '@/context/StoreContext';

interface SidebarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItemDef {
  id: ScreenId;
  label: string;
  icon: typeof Home;
  section: 'utama' | 'sistem';
  badge?: string;
}

const NAV_ITEMS: NavItemDef[] = [
  { id: 'beranda', label: 'Ringkasan', icon: Home, section: 'utama' },
  { id: 'barang', label: 'Katalog Barang', icon: Package, section: 'utama' },
  { id: 'belanja', label: 'Catat Belanja', icon: ShoppingBasket, section: 'utama' },
  { id: 'cek-sisa', label: 'Cek Sisa Fisik', icon: ClipboardCheck, section: 'utama' },
  { id: 'setoran', label: 'Setoran Karyawan', icon: Banknote, section: 'utama' },
  { id: 'laporan', label: 'Laporan Toko', icon: FileChartColumn, section: 'utama' },
  { id: 'asisten', label: 'Asisten Catatan', icon: Sparkles, section: 'sistem' },
  { id: 'riwayat', label: 'Jejak Riwayat', icon: History, section: 'sistem' },
  { id: 'pengaturan', label: 'Pengaturan', icon: Settings2, section: 'sistem' }
];

export function Sidebar({
  currentScreen,
  onNavigate,
  mobileOpen,
  onCloseMobile
}: SidebarProps) {
  const { products, events, aiEnabled } = useStore();

  const mainItems = NAV_ITEMS.filter((item) => item.section === 'utama');
  const systemItems = NAV_ITEMS.filter((item) => item.section === 'sistem');

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#e06346] to-[#cc5438] flex items-center justify-center text-white shadow-sm">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-display font-extrabold text-sm tracking-tight text-[var(--text-main)] block">
                TOKO SAKALA
              </span>
              <span className="text-[10px] tracking-wider text-[var(--text-dim)] uppercase block font-semibold">
                Sistem Toko & Kas
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-xl text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] lg:hidden transition-colors"
            aria-label="Tutup menu navigasi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6">
          <div>
            <div className="text-[10px] font-bold text-[var(--text-dim)] px-3 mb-2 uppercase tracking-wider">
              Operasional Harian
            </div>
            <nav className="space-y-1">
              {mainItems.map((item) => {
                const Icon = item.icon;
                const active = currentScreen === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onNavigate(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs transition-all ${
                      active
                        ? 'bg-[var(--text-main)] text-[var(--bg-card)] dark:bg-[var(--primary)] dark:text-slate-950 font-bold shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] font-medium'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-transform ${active ? 'scale-110' : ''}`} />
                    <span className="truncate">{item.label}</span>
                    {item.id === 'barang' && products.length > 0 && (
                      <span className={`ml-auto text-[10px] tabular-nums px-2 py-0.5 rounded-full ${
                        active
                          ? 'bg-white/20 text-white dark:bg-black/20 dark:text-slate-950'
                          : 'bg-[var(--bg-elevated)] text-[var(--text-dim)]'
                      }`}>
                        {products.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div>
            <div className="text-[10px] font-bold text-[var(--text-dim)] px-3 mb-2 uppercase tracking-wider">
              Audit & Pengaturan
            </div>
            <nav className="space-y-1">
              {systemItems.map((item) => {
                const Icon = item.icon;
                const active = currentScreen === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onNavigate(item.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs transition-all ${
                      active
                        ? 'bg-[var(--text-main)] text-[var(--bg-card)] dark:bg-[var(--primary)] dark:text-slate-950 font-bold shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-elevated)] font-medium'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-transform ${active ? 'scale-110' : ''}`} />
                    <span className="truncate">{item.label}</span>
                    {item.id === 'asisten' && (
                      <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${
                        active
                          ? 'bg-white/20 text-white dark:bg-black/20 dark:text-slate-950'
                          : 'bg-[var(--bg-elevated)] text-[var(--text-dim)]'
                      }`}>
                        {aiEnabled ? 'ON' : 'OFF'}
                      </span>
                    )}
                    {item.id === 'riwayat' && events.length > 0 && (
                      <span className={`ml-auto text-[10px] tabular-nums px-2 py-0.5 rounded-full ${
                        active
                          ? 'bg-white/20 text-white dark:bg-black/20 dark:text-slate-950'
                          : 'bg-[var(--bg-elevated)] text-[var(--text-dim)]'
                      }`}>
                        {events.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Store Status Card (BrightPolicy sticky note card) */}
        <div className="p-3.5 border-t border-[var(--border-subtle)]">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border border-amber-300/40 dark:border-amber-700/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                Pencatatan Rapi
              </span>
              <span className="text-[10px] font-mono text-amber-800 dark:text-amber-300">
                SAKALA v1.0
              </span>
            </div>
            <p className="text-[11px] text-amber-900/80 dark:text-amber-200/80 leading-relaxed font-sans">
              "Catatan teliti, omzet terukur, kas toko selalu terkendali."
            </p>
            <div className="pt-1 flex items-center justify-between text-[10px] text-amber-800/80 dark:text-amber-300/80 border-t border-amber-300/30">
              <span>{products.length} Barang</span>
              <span className="tabular-nums">{events.length} Riwayat</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
