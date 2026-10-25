import { useState } from 'react';
import {
  Home,
  Package,
  ShoppingBasket,
  ClipboardCheck,
  Banknote,
  FileChartColumn,
  History,
  Settings2
} from 'lucide-react';
import type { ScreenId, Product } from '@/types/store';
import { StoreProvider } from '@/context/StoreContext';
import { ToastContainer } from '@/components/ui/Toast';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { DashboardScreen } from '@/components/screens/DashboardScreen';
import { ProductsScreen } from '@/components/screens/ProductsScreen';
import { PurchaseScreen } from '@/components/screens/PurchaseScreen';
import { StockCheckScreen } from '@/components/screens/StockCheckScreen';
import { CashScreen } from '@/components/screens/CashScreen';
import { ReportsScreen } from '@/components/screens/ReportsScreen';
import { AssistantScreen } from '@/components/screens/AssistantScreen';
import { HistoryScreen } from '@/components/screens/HistoryScreen';
import { SettingsScreen } from '@/components/screens/SettingsScreen';

function MainApp() {
  const [screen, setScreen] = useState<ScreenId>('beranda');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedProductForPurchase, setSelectedProductForPurchase] = useState<Product | null>(null);

  const navigate = (next: ScreenId) => {
    setScreen(next);
    setMobileOpen(false);
  };

  const handleSelectProductForPurchase = (product: Product) => {
    setSelectedProductForPurchase(product);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] flex flex-col">
      {/* Toast notifications container */}
      <ToastContainer />

      {/* Responsive Sidebar */}
      <Sidebar
        currentScreen={screen}
        onNavigate={navigate}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Workspace Area (offset by 256px on desktop) */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <Topbar
          currentScreen={screen}
          onOpenMobile={() => setMobileOpen(true)}
          onQuickAction={() => navigate('belanja')}
        />

        {/* Viewport Content with Fluid Slide-in Animation */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-12">
          <div key={screen} className="animate-screen-slide">
            {screen === 'beranda' && <DashboardScreen onNavigate={navigate} />}
            {screen === 'barang' && (
              <ProductsScreen
                onNavigate={navigate}
                onSelectProductForPurchase={handleSelectProductForPurchase}
              />
            )}
            {screen === 'belanja' && (
              <PurchaseScreen initialProduct={selectedProductForPurchase} />
            )}
            {screen === 'cek-sisa' && <StockCheckScreen />}
            {screen === 'setoran' && <CashScreen />}
            {screen === 'laporan' && <ReportsScreen />}
            {screen === 'asisten' && <AssistantScreen />}
            {screen === 'riwayat' && <HistoryScreen />}
            {screen === 'pengaturan' && <SettingsScreen />}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Quick Navigation */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 h-16 bg-[var(--bg-card)]/95 backdrop-blur-md border-t border-[var(--border-subtle)] grid grid-cols-5 items-center px-1 lg:hidden"
        aria-label="Navigasi cepat ponsel"
      >
        <button
          type="button"
          onClick={() => navigate('beranda')}
          className={`flex flex-col items-center justify-center gap-1 text-[10px] min-h-[44px] transition-colors ${
            screen === 'beranda'
              ? 'text-[var(--primary)] font-bold'
              : 'text-[var(--text-dim)] hover:text-[var(--text-muted)] font-medium'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Beranda</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('barang')}
          className={`flex flex-col items-center justify-center gap-1 text-[10px] min-h-[44px] transition-colors ${
            screen === 'barang'
              ? 'text-[var(--primary)] font-bold'
              : 'text-[var(--text-dim)] hover:text-[var(--text-muted)] font-medium'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Barang</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('belanja')}
          className={`flex flex-col items-center justify-center gap-1 text-[10px] min-h-[44px] transition-colors ${
            screen === 'belanja'
              ? 'text-[var(--primary)] font-bold'
              : 'text-[var(--text-dim)] hover:text-[var(--text-muted)] font-medium'
          }`}
        >
          <ShoppingBasket className="w-4 h-4" />
          <span>Belanja</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('setoran')}
          className={`flex flex-col items-center justify-center gap-1 text-[10px] min-h-[44px] transition-colors ${
            screen === 'setoran'
              ? 'text-[var(--primary)] font-bold'
              : 'text-[var(--text-dim)] hover:text-[var(--text-muted)] font-medium'
          }`}
        >
          <Banknote className="w-4 h-4" />
          <span>Uang</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('laporan')}
          className={`flex flex-col items-center justify-center gap-1 text-[10px] min-h-[44px] transition-colors ${
            screen === 'laporan'
              ? 'text-[var(--primary)] font-bold'
              : 'text-[var(--text-dim)] hover:text-[var(--text-muted)] font-medium'
          }`}
        >
          <FileChartColumn className="w-4 h-4" />
          <span>Laporan</span>
        </button>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <MainApp />
    </StoreProvider>
  );
}
