import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppEvent, Product } from '@/domain/event';
import type { EngineOutput, StoreContextType, ToastMessage, CreateEventInput } from '@/types/store';
import { calculate } from '@/engine/v1/calculate';
import { DEMO_PRODUCTS, DEMO_EVENTS } from '@/seed/demo-data';
import { generateId } from '@/lib/utils';
import { readAssistantPreference, writeAssistantPreference } from '@/ai-feature';

const PRODUCTS_STORAGE_KEY = 'toko-sakala:products:v2';
const EVENTS_STORAGE_KEY = 'toko-sakala:events:v2';
const THEME_STORAGE_KEY = 'toko-sakala:theme:v2';

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const stored = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEMO_PRODUCTS;
  });

  const [events, setEvents] = useState<AppEvent[]>(() => {
    try {
      const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEMO_EVENTS;
  });

  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      // ignore
    }
    return 'dark';
  });

  const [aiEnabled, setAiEnabledState] = useState<boolean>(() => {
    try {
      return readAssistantPreference(window.localStorage);
    } catch {
      return false;
    }
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync products to local storage
  useEffect(() => {
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    } catch (e) {
      console.warn('Failed to persist products to localStorage', e);
    }
  }, [products]);

  // Sync events to local storage
  useEffect(() => {
    try {
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
    } catch (e) {
      console.warn('Failed to persist events to localStorage', e);
    }
  }, [events]);

  // Apply theme to document
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    } catch {
      // ignore
    }
  }, [theme]);

  const setTheme = (nextTheme: 'dark' | 'light') => {
    setThemeState(nextTheme);
  };

  const setAiEnabled = (enabled: boolean) => {
    setAiEnabledState(enabled);
    writeAssistantPreference(enabled, window.localStorage);
  };

  const notify = (type: ToastMessage['type'], title: string, description?: string) => {
    const id = generateId('toast');
    const newToast: ToastMessage = { id, type, title, description, duration: 4000 };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Pure deterministic engine calculation
  const engineOutput: EngineOutput = useMemo(() => {
    try {
      return calculate({
        products,
        events,
        asOf: new Date().toISOString()
      });
    } catch (err) {
      console.error('Engine calculation error:', err);
      return {
        products: [],
        totals: {
          unitsSold: 0,
          salesRevenue: { min: 0, max: 0 },
          costOfGoodsSoldKnown: 0,
          otherIncome: 0,
          expenses: 0,
          damageLossKnown: 0,
          usedLossKnown: 0,
          unknownLossKnown: 0,
          profit: { min: 0, max: 0 },
          certainty: 'PERLU_DIPERIKSA',
          storeCashAfterDeposits: { min: 0, max: 0 },
          totalDeposits: 0,
          potentialSalesRevenue: { min: 0, max: 0 },
          remainingInventoryAtSellingPrice: { min: 0, max: 0 },
          grossProfit: { min: 0, max: 0 },
          netProfit: { min: 0, max: 0 },
          expectedEmployeeRemittance: { min: 0, max: 0 },
          remittanceStatus: {
            status: 'MENUNGGU_SETORAN',
            statusLabel: 'Menunggu setoran',
            explanation: 'Belum ada catatan setoran.',
            difference: { min: 0, max: 0 }
          }
        },
        depositChecks: [],
        issues: [{ code: 'CALC_ERROR', message: 'Terjadi kesalahan perhitungan engine.' }]
      };
    }
  }, [products, events]);

  const addProduct = (name: string, sellingPrice: number): Product => {
    const trimmed = name.trim();
    const id = `prod-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const newProduct: Product = {
      id,
      name: trimmed,
      sellingPrice: Math.max(0, Math.round(sellingPrice)),
      active: true
    };
    setProducts((prev) => [...prev, newProduct]);
    notify('success', 'Barang ditambahkan', `"${trimmed}" berhasil didaftarkan ke katalog.`);
    return newProduct;
  };

  const updateProductPrice = (productId: string, newSellingPrice: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const roundedPrice = Math.max(0, Math.round(newSellingPrice));

    // Update product active price
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, sellingPrice: roundedPrice } : p))
    );

    // Also log price_change event for engine historical accuracy
    addEvent({
      type: 'price_change',
      productId,
      sellingPrice: roundedPrice
    });

    notify('info', 'Harga diperbarui', `Harga ${product.name} diubah menjadi Rp ${roundedPrice.toLocaleString('id-ID')}`);
  };

  const addEvent = (eventData: CreateEventInput) => {
    setIsLoading(true);
    // Idempotency protection (Acceptance 12)
    if ((eventData as any).id && events.some((e) => e.id === (eventData as any).id)) {
      setIsLoading(false);
      return;
    }
    if ((eventData as any).idempotencyKey && events.some((e: any) => e.idempotencyKey === (eventData as any).idempotencyKey)) {
      setIsLoading(false);
      return;
    }

    const nextSeq = events.length > 0 ? Math.max(...events.map((e) => e.seq)) + 1 : 1;
    const newEvent: AppEvent = {
      ...eventData,
      id: (eventData as any).id || generateId('ev'),
      seq: nextSeq,
      occurredAt: eventData.occurredAt || new Date().toISOString()
    } as AppEvent;

    setEvents((prev) => [...prev, newEvent]);
    setIsLoading(false);
  };

  const deleteEvent = (eventId: string) => {
    const target = events.find((e) => e.id === eventId);
    if (!target) return;
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    notify('info', 'Catatan dihapus', `Transaksi urutan #${target.seq} telah dihapus dari riwayat.`);
  };

  const loadSeedData = () => {
    setProducts(DEMO_PRODUCTS);
    setEvents(DEMO_EVENTS);
    notify('success', 'Data simulasi dimuat', 'Data toko contoh warung berhasil dimuat.');
  };

  const clearAllData = () => {
    setProducts([]);
    setEvents([]);
    notify('warning', 'Data dibersihkan', 'Semua barang dan transaksi toko telah dikosongkan.');
  };

  const exportData = (): string => {
    const payload = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      products,
      events
    };
    return JSON.stringify(payload, null, 2);
  };

  const importData = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.products) && Array.isArray(parsed.events)) {
        setProducts(parsed.products);
        setEvents(parsed.events);
        notify('success', 'Data dipulihkan', `Berhasil memuat ${parsed.products.length} barang dan ${parsed.events.length} catatan.`);
        return true;
      }
      throw new Error('Format JSON tidak sesuai');
    } catch (err) {
      notify('error', 'Gagal memulihkan', 'Format file cadangan tidak valid.');
      return false;
    }
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        events,
        engineOutput,
        theme,
        aiEnabled,
        toasts,
        isLoading,
        addProduct,
        updateProductPrice,
        addEvent,
        deleteEvent,
        loadSeedData,
        clearAllData,
        exportData,
        importData,
        notify,
        dismissToast,
        setTheme,
        setAiEnabled
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextType {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
