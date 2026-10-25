import type { AppEvent, Product, MoneySource, Certainty } from '@/domain/event';
import type { EngineOutput, ProductCalculation, DepositCheck } from '@/engine/contract';

export type { AppEvent, Product, MoneySource, Certainty, EngineOutput, ProductCalculation, DepositCheck };

export type ScreenId =
  | 'beranda'
  | 'barang'
  | 'belanja'
  | 'cek-sisa'
  | 'setoran'
  | 'laporan'
  | 'asisten'
  | 'riwayat'
  | 'pengaturan';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
  duration?: number;
}

type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;

export type CreateEventInput = DistributiveOmit<AppEvent, 'id' | 'seq' | 'occurredAt'> & {
  occurredAt?: string;
};

export interface StoreContextType {
  products: Product[];
  events: AppEvent[];
  engineOutput: EngineOutput;
  theme: 'dark' | 'light';
  aiEnabled: boolean;
  toasts: ToastMessage[];
  isLoading: boolean;
  addProduct: (name: string, sellingPrice: number) => Product;
  updateProductPrice: (productId: string, newSellingPrice: number) => void;
  addEvent: (eventData: CreateEventInput) => void;
  deleteEvent: (eventId: string) => void;
  loadSeedData: () => void;
  clearAllData: () => void;
  exportData: () => string;
  importData: (jsonStr: string) => boolean;
  notify: (type: ToastMessage['type'], title: string, description?: string) => void;
  dismissToast: (id: string) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setAiEnabled: (enabled: boolean) => void;
}
