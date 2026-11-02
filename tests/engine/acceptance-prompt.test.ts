import { describe, expect, it } from 'vitest';
import { runStoreFinancialEngine, type CatalogProduct } from '@/engine/v1/engineBridge';
import type { TokoSakalaPayload } from '@/storage/types';
import { migrateLegacyPayload } from '@/storage/types';

describe('Uji Penerimaan Alur Uang & Aturan Bisnis (Section 5)', () => {
  it('menghitung skenario golden penerimaan: Penjualan 564.000, Biaya laci 34.000, Belanja 489.000, Modal terjual 451.200', () => {
    const catalog: CatalogProduct[] = [
      {
        id: 'prod-a',
        name: 'Barang A',
        category: 'Makanan',
        unit: 'Dus (10 pcs)',
        packSize: 10,
        costPerPack: 45120, // modal per pcs = 4.512
        sellingPricePerUnit: 5640, // jual per pcs = 5.640
        icon: '📦',
      },
    ];

    // 100 pcs terjual -> Penjualan = 100 * 5.640 = 564.000
    // Modal terjual = 100 * 4.512 = 451.200
    const payload: TokoSakalaPayload = {
      products: [
        {
          id: 'prod-a',
          name: 'Barang A',
          category: 'Makanan',
          unit: 'Dus (10 pcs)',
          packSize: 10,
          costPerPack: 45120,
          sellingPricePerUnit: 5640,
          icon: '📦',
          active: true,
        },
      ],
      stockMovements: [
        {
          id: 'mov-init',
          occurredAt: '2026-11-01T08:00:00.000Z',
          productId: 'prod-a',
          type: 'CHECK_ADJUSTMENT',
          quantity: 100, // opening stock 100 pcs
          unit: 'pcs',
        },
        {
          id: 'mov-check',
          occurredAt: '2026-11-02T10:00:00.000Z',
          productId: 'prod-a',
          type: 'CHECK_ADJUSTMENT',
          quantity: 0, // sisa fisik 0 pcs -> terjual 100 pcs
          unit: 'pcs',
        },
      ],
      purchaseRecords: [
        {
          id: 'purch-1',
          occurredAt: '2026-11-02T11:00:00.000Z',
          productId: 'prod-a',
          packs: 1,
          unitsPerPack: 10,
          totalCost: 489000, // Belanja Rp 489.000
          sourceMoney: 'SETORAN',
        },
      ],
      salesRecords: [
        {
          id: 'sale-1',
          occurredAt: '2026-11-02T10:00:00.000Z',
          productId: 'prod-a',
          soldUnits: 100,
          unitSellingPrice: 5640,
          totalSalesValue: 564000,
          isCalculatedFromStockCheck: true,
        },
      ],
      expenses: [
        {
          id: 'exp-1',
          occurredAt: '2026-11-02T09:00:00.000Z',
          description: 'Plastik & gas',
          amount: 34000, // Biaya laci Rp 34.000
          sourceMoney: 'LACI',
        },
      ],
      deposits: [
        {
          id: 'dep-1',
          occurredAt: '2026-11-02T12:00:00.000Z',
          expectedAmount: 530000,
          receivedAmount: 530000, // Setoran diterima Rp 530.000
          discrepancy: 0,
        },
      ],
      ownerWithdrawals: [],
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

    const summary = runStoreFinancialEngine(payload, catalog);

    // Penjualan = 564.000
    expect(summary.grossSales.min).toBe(564000);
    // Modal terjual = 451.200
    expect(summary.cogsKnown).toBe(451200);
    expect(summary.modalKembali).toBe(451200);

    // Setoran seharusnya = Penjualan (564.000) - Biaya laci (34.000) = 530.000
    expect(summary.expectedDeposit).toBe(530000);

    // Setoran diterima 530.000 -> Sisa disetor 0, Selisih 0, Kepastian PASTI
    expect(summary.totalDeposits).toBe(530000);
    expect(summary.remainingDeposit).toBe(0);
    expect(summary.depositDiscrepancy).toBe(0);
    expect(summary.certainty).toBe('PASTI');

    // Uang di tangan = Setoran diterima (530.000) - Belanja dari setoran (489.000) - Penarikan pribadi (0) = 41.000
    expect(summary.cashInHand).toBe(41000);

    // Sisa dana belanja = Modal kembali (451.200) - Total belanja (489.000) = -37.800 (diambil dari untung)
    expect(summary.remainingShoppingBudget).toBe(-37800);
  });

  it('memigrasi data lama STORE -> SETORAN (belanja), STORE -> LACI (biaya), PERSONAL -> PRIBADI', () => {
    const legacyRaw = {
      purchaseRecords: [
        { id: 'p1', totalCost: 10000, sourceMoney: 'STORE' },
        { id: 'p2', totalCost: 20000, sourceMoney: 'PERSONAL' },
      ],
      expenses: [
        { id: 'e1', amount: 5000, sourceMoney: 'STORE' },
        { id: 'e2', amount: 15000, sourceMoney: 'PERSONAL' },
      ],
    };

    const migrated = migrateLegacyPayload(legacyRaw);
    expect(migrated.purchaseRecords[0].sourceMoney).toBe('SETORAN');
    expect(migrated.purchaseRecords[1].sourceMoney).toBe('PRIBADI');
    expect(migrated.expenses[0].sourceMoney).toBe('LACI');
    expect(migrated.expenses[1].sourceMoney).toBe('PRIBADI');
    expect(migrated.ownerWithdrawals).toEqual([]);
  });
});
