import { describe, expect, it } from 'vitest';
import { runStoreFinancialEngine, buildEngineInputFromPayload, type CatalogProduct } from '@/engine/v1/engineBridge';
import type { TokoSakalaPayload } from '@/storage/types';
import { createDefaultPayload } from '@/storage/storageAdapter';

const mockCatalog: CatalogProduct[] = [
  { id: 'indomie', name: 'Indomie Goreng', category: 'Makanan', unit: 'Dus (40 pcs)', packSize: 40, costPerPack: 96000, sellingPricePerUnit: 3000, icon: '🍜', active: true },
  { id: 'aqua', name: 'Aqua 600ml', category: 'Minuman', unit: 'Dus (24 botol)', packSize: 24, costPerPack: 45000, sellingPricePerUnit: 3000, icon: '💧', active: true },
];

describe('TOKO SAKALA Engine Bridge', () => {
  it('beroperasi mulus pada payload default awal (0 transaksi)', () => {
    const payload = createDefaultPayload();
    const summary = runStoreFinancialEngine(payload, mockCatalog, '2026-11-02T12:00:00Z');

    expect(summary.grossSales.min).toBe(0);
    expect(summary.cogsKnown).toBe(0);
    expect(summary.expectedDeposit).toBe(0);
    expect(summary.totalDeposits).toBe(0);
  });

  it('menghitung penjualan, modal, laba kotor, dan kas siap setor setelah belanja dan cek sisa', () => {
    const payload: TokoSakalaPayload = {
      ...createDefaultPayload(),
      purchaseRecords: [
        {
          id: 'p1',
          occurredAt: '2026-11-01T08:00:00Z',
          productId: 'indomie',
          packs: 2,
          unitsPerPack: 40,
          totalCost: 192000, // 80 pcs @ 2.400
          sourceMoney: 'SETORAN',
        },
      ],
      stockMovements: [
        {
          id: 'm1',
          occurredAt: '2026-11-02T10:00:00Z',
          productId: 'indomie',
          type: 'CHECK_ADJUSTMENT',
          quantity: 70, // Sisa fisik 70 -> terjual 10 pcs
          unit: 'pcs',
        },
      ],
    };

    const summary = runStoreFinancialEngine(payload, mockCatalog, '2026-11-02T12:00:00Z');

    // 10 pcs terjual @ 3.000 = Rp 30.000 penjualan
    expect(summary.grossSales.min).toBe(30000);
    // Modal 10 pcs @ 2.400 = Rp 24.000
    expect(summary.cogsKnown).toBe(24000);
    // Laba kotor = 30.000 - 24.000 = Rp 6.000
    expect(summary.grossProfit?.min).toBe(6000);
    // Sisa fisik di toko = 70 pcs
    expect(summary.stockByProduct.get('indomie')?.availableUnits).toBe(70);
    expect(summary.stockByProduct.get('indomie')?.unitsSold).toBe(10);
  });

  it('mengurangi uang siap setor jika ada biaya toko yang dibayar uang kasir', () => {
    const payload: TokoSakalaPayload = {
      ...createDefaultPayload(),
      purchaseRecords: [
        {
          id: 'p1',
          occurredAt: '2026-11-01T08:00:00Z',
          productId: 'indomie',
          packs: 1,
          unitsPerPack: 40,
          totalCost: 96000,
          sourceMoney: 'PRIBADI', // dibayar uang pribadi pemilik, tidak mengurangi kasir
        },
      ],
      stockMovements: [
        {
          id: 'm1',
          occurredAt: '2026-11-02T10:00:00Z',
          productId: 'indomie',
          type: 'CHECK_ADJUSTMENT',
          quantity: 20, // Terjual 20 pcs @ 3.000 = Rp 60.000
          unit: 'pcs',
        },
      ],
      expenses: [
        {
          id: 'e1',
          occurredAt: '2026-11-02T11:00:00Z',
          description: 'Beli plastik dan sedotan',
          amount: 10000,
          sourceMoney: 'LACI', // dipotong dari uang kasir
        },
      ],
    };

    const summary = runStoreFinancialEngine(payload, mockCatalog, '2026-11-02T12:00:00Z');

    expect(summary.grossSales.min).toBe(60000);
    expect(summary.expensesTotal).toBe(10000);
    // Laba bersih = Laba kotor (60.000 - 48.000 = 12.000) - Biaya (10.000) = Rp 2.000
    expect(summary.netProfit?.min).toBe(2000);
    // Uang siap setor = 60.000 - 10.000 = Rp 50.000
    expect(summary.expectedDeposit).toBe(50000);
  });
});
