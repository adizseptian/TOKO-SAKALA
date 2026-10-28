import { z } from 'zod';
import { RupiahSchema, QuantitySchema } from '@/domain/event';

/**
 * TOKO SAKALA — Storage & Google Drive Data Contract v1.0
 * 
 * Prinsip:
 * 1. Integer Rupiah only (non-negative).
 * 2. Kuantitas per satuan dipisahkan (pcs, kg, dus, botol).
 * 3. Modal tidak diketahui tetap unknown (null/undefined, bukan 0 palsu).
 * 4. Nilai penjualan, uang diterima, kas toko, dan estimasi setoran terpisah tegas.
 * 5. Checksum SHA-256 memverifikasi keutuhan data terhadap manipulasi atau kerusakan.
 */

export const StorageProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(120),
  category: z.enum(['Makanan', 'Minuman', 'Rokok', 'Lainnya']),
  unit: z.string().trim().min(1).max(30),
  packSize: QuantitySchema.refine((v) => v > 0, 'Ukuran kemasan minimal 1'),
  costPerPack: RupiahSchema.nullable().optional(), // Nullable: modal tidak diketahui tetap null, bukan 0
  sellingPricePerUnit: RupiahSchema,
  icon: z.string().default('📦'),
  active: z.boolean().default(true),
});

export const StockMovementSchema = z.object({
  id: z.string().min(1),
  occurredAt: z.string().datetime({ offset: true }),
  productId: z.string().min(1),
  type: z.enum(['IN_PURCHASE', 'OUT_SALE', 'CHECK_ADJUSTMENT', 'LOSS_DAMAGE', 'LOSS_UNKNOWN']),
  quantity: QuantitySchema,
  unit: z.string().trim().min(1),
  notes: z.string().max(200).optional(),
});

export const PurchaseRecordSchema = z.object({
  id: z.string().min(1),
  occurredAt: z.string().datetime({ offset: true }),
  productId: z.string().min(1),
  packs: QuantitySchema.refine((v) => v > 0),
  unitsPerPack: QuantitySchema.refine((v) => v > 0),
  totalCost: RupiahSchema,
  sourceMoney: z.enum(['STORE', 'PERSONAL']),
  receiptRef: z.string().max(60).optional(),
});

export const SalesRecordSchema = z.object({
  id: z.string().min(1),
  occurredAt: z.string().datetime({ offset: true }),
  productId: z.string().min(1),
  soldUnits: QuantitySchema,
  unitSellingPrice: RupiahSchema,
  totalSalesValue: RupiahSchema,
  isCalculatedFromStockCheck: z.boolean().default(true),
});

export const ExpenseRecordSchema = z.object({
  id: z.string().min(1),
  occurredAt: z.string().datetime({ offset: true }),
  description: z.string().trim().min(1).max(160),
  amount: RupiahSchema.refine((v) => v > 0),
  sourceMoney: z.enum(['STORE', 'PERSONAL']),
});

export const DepositRecordSchema = z.object({
  id: z.string().min(1),
  occurredAt: z.string().datetime({ offset: true }),
  expectedAmount: RupiahSchema, // Estimasi yang seharusnya diserahkan
  receivedAmount: RupiahSchema, // Uang riil yang diterima dari karyawan
  discrepancy: z.number().int().safe(), // Positif = lebih, Negatif = kurang
  notes: z.string().max(250).optional(),
});

export const ClosedPeriodSchema = z.object({
  id: z.string().min(1),
  periodStart: z.string().datetime({ offset: true }),
  periodEnd: z.string().datetime({ offset: true }),
  closedAt: z.string().datetime({ offset: true }),
  totalSales: RupiahSchema,
  totalExpenses: RupiahSchema,
  totalDeposits: RupiahSchema,
  finalCashBalance: z.number().int().safe(),
  isLocked: z.literal(true), // Periode yang ditutup tidak boleh diedit diam-diam
});

export const CorrectionRecordSchema = z.object({
  id: z.string().min(1),
  occurredAt: z.string().datetime({ offset: true }),
  targetType: z.enum(['PURCHASE', 'EXPENSE', 'DEPOSIT', 'STOCK_COUNT']),
  targetId: z.string().min(1),
  reason: z.string().trim().min(3).max(300),
  previousValueJson: z.string(),
  newValueJson: z.string(),
  authorizedBy: z.string().default('owner'),
});

export const AppSettingsSchema = z.object({
  shopName: z.string().min(1).default('TOKO SAKALA'),
  ownerEmail: z.string().email().default('adizseptian@gmail.com'),
  currency: z.literal('IDR').default('IDR'),
  theme: z.enum(['light', 'dark']).default('light'),
  aiAssistantEnabled: z.boolean().default(false), // AI default OFF
});

/**
 * Payload data utama TOKO SAKALA
 */
export const TokoSakalaPayloadSchema = z.object({
  products: z.array(StorageProductSchema).default([]),
  stockMovements: z.array(StockMovementSchema).default([]),
  purchaseRecords: z.array(PurchaseRecordSchema).default([]),
  salesRecords: z.array(SalesRecordSchema).default([]),
  expenses: z.array(ExpenseRecordSchema).default([]),
  deposits: z.array(DepositRecordSchema).default([]),
  closedPeriods: z.array(ClosedPeriodSchema).default([]),
  corrections: z.array(CorrectionRecordSchema).default([]),
  settings: AppSettingsSchema.default({
    shopName: 'TOKO SAKALA',
    ownerEmail: 'adizseptian@gmail.com',
    currency: 'IDR',
    theme: 'light',
    aiAssistantEnabled: false,
  }),
});

/**
 * Dokumen penyimpanan utuh berversi dengan SHA-256 checksum
 */
export const TokoSakalaDocumentSchema = z.object({
  app: z.literal('toko-sakala'),
  schemaVersion: z.literal(1),
  dataVersion: z.number().int().nonnegative(),
  updatedAt: z.string().datetime({ offset: true }),
  checksum: z.string().length(64), // SHA-256 hex string 64 karakter
  payload: TokoSakalaPayloadSchema,
});

export type TokoSakalaPayload = z.infer<typeof TokoSakalaPayloadSchema>;
export type TokoSakalaDocument = z.infer<typeof TokoSakalaDocumentSchema>;
export type StorageProduct = z.infer<typeof StorageProductSchema>;
export type PurchaseRecord = z.infer<typeof PurchaseRecordSchema>;
export type ExpenseRecord = z.infer<typeof ExpenseRecordSchema>;
export type DepositRecord = z.infer<typeof DepositRecordSchema>;

/**
 * Metadata Cadangan (Backup)
 */
export interface BackupMetadata {
  id: string; // Google Drive file ID atau local identifier
  fileName: string; // e.g. backup-2026-10-28-175642.json
  createdAt: string;
  dataVersion: number;
  schemaVersion: number;
  checksum: string;
  byteSize: number;
  label?: string;
}

/**
 * Status Adapter Penyimpanan
 */
export type StorageBackendType = 'google_drive' | 'in_memory' | 'offline_local';

export interface StorageStatus {
  backend: StorageBackendType;
  isConnected: boolean;
  userEmail: string | null;
  lastSyncedAt: string | null;
  dataVersion: number;
  isDirty: boolean;
  checksumStatus: 'VALID' | 'CORRUPT' | 'UNCHECKED';
  errorMessage?: string | null;
}

export interface SaveResult {
  success: boolean;
  dataVersion: number;
  updatedAt: string;
  checksum: string;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  restoredVersion: number;
  backupId: string;
  preRestoreSnapshotId?: string;
  error?: string;
}
