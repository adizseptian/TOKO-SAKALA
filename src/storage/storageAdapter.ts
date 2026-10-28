import {
  type TokoSakalaDocument,
  type TokoSakalaPayload,
  type BackupMetadata,
  type StorageStatus,
  type SaveResult,
  type RestoreResult,
} from './types';

/**
 * StorageAdapter Contract
 * 
 * Abstraksi backend penyimpanan TOKO SAKALA:
 * Dapat diimplementasikan oleh GoogleDriveAdapter (produksi Google Drive v3 REST),
 * MockStorageAdapter (unit testing & fallback offline), dsb.
 */
export interface StorageAdapter {
  readonly backendType: StorageStatus['backend'];

  /**
   * Menghubungkan adapter (misal validasi token OAuth Google Drive)
   */
  connect(): Promise<boolean>;

  /**
   * Memutuskan sambungan adapter
   */
  disconnect(): Promise<void>;

  /**
   * Membaca status adapter saat ini
   */
  getStatus(): Promise<StorageStatus>;

  /**
   * Memuat dokumen utama toko
   */
  loadData(): Promise<TokoSakalaDocument>;

  /**
   * Menyimpan dokumen toko dengan checksum baru dan kenaikan versi
   */
  saveData(payload: TokoSakalaPayload, baseVersion?: number): Promise<SaveResult>;

  /**
   * Membuat file cadangan (backup) berstempel waktu
   */
  createBackup(label?: string): Promise<BackupMetadata>;

  /**
   * Mengambil daftar cadangan yang tersedia
   */
  listBackups(): Promise<BackupMetadata[]>;

  /**
   * Memulihkan data dari cadangan dengan snapshot pengaman otomatis
   */
  restoreBackup(backupId: string): Promise<RestoreResult>;
}

/**
 * Nilai default payload toko jika file belum pernah ada
 */
export function createDefaultPayload(): TokoSakalaPayload {
  return {
    products: [
      { id: 'indomie', name: 'Indomie Goreng', category: 'Makanan', unit: 'Dus (40 pcs)', packSize: 40, costPerPack: 96000, sellingPricePerUnit: 3000, icon: '🍜', active: true },
      { id: 'sedap', name: 'Mie Sedap', category: 'Makanan', unit: 'Dus (40 pcs)', packSize: 40, costPerPack: 92000, sellingPricePerUnit: 2800, icon: '🍜', active: true },
      { id: 'aqua', name: 'Aqua 600ml', category: 'Minuman', unit: 'Dus (24 botol)', packSize: 24, costPerPack: 45000, sellingPricePerUnit: 3000, icon: '💧', active: true },
      { id: 'telur', name: 'Telur Ayam Negeri', category: 'Makanan', unit: 'Kg', packSize: 1, costPerPack: 26000, sellingPricePerUnit: 29000, icon: '🥚', active: true },
      { id: 'gula', name: 'Gula Pasir', category: 'Makanan', unit: 'Kg', packSize: 1, costPerPack: 16000, sellingPricePerUnit: 18000, icon: '🍚', active: true },
      { id: 'chocopie', name: 'ChocoPie', category: 'Makanan', unit: 'Pcs', packSize: 1, costPerPack: 2000, sellingPricePerUnit: 2500, icon: '🍪', active: true },
      { id: 'sampoerna', name: 'Rokok Sampoerna', category: 'Rokok', unit: 'Slop (10 bks)', packSize: 10, costPerPack: 310000, sellingPricePerUnit: 34000, icon: '🚬', active: true },
    ],
    stockMovements: [],
    purchaseRecords: [],
    salesRecords: [],
    expenses: [],
    deposits: [],
    closedPeriods: [],
    corrections: [],
    settings: {
      shopName: 'TOKO SAKALA',
      ownerEmail: 'adizseptian@gmail.com',
      currency: 'IDR',
      theme: 'light',
      aiAssistantEnabled: false,
    },
  };
}
