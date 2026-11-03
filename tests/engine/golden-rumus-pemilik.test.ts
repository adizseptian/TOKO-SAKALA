import { describe, it, expect } from 'vitest';
import { calculate } from '@/engine/v1/calculate';
import { runStoreFinancialEngine, getProductLatestUnitCost, type CatalogProduct } from '@/engine/v1/engineBridge';
import type { TokoSakalaPayload } from '@/storage/types';
import type { AppEvent, Product } from '@/domain/event';

describe('RUMUS PEMILIK & ACCEPTANCE TESTS — TOKO SAKALA', () => {
  const dummyCatalog: CatalogProduct[] = [
    { id: 'indomie', name: 'Indomie Goreng', category: 'Makanan', unit: 'Dus (40 pcs)', packSize: 40, costPerPack: 96000, sellingPricePerUnit: 3000, icon: '🍜' },
    { id: 'aqua', name: 'Aqua 600ml', category: 'Minuman', unit: 'Dus (24 botol)', packSize: 24, costPerPack: 48000, sellingPricePerUnit: 3000, icon: '💧' },
    { id: 'kopi', name: 'Kopi Hitam', category: 'Minuman', unit: 'Dus (24 pcs)', packSize: 24, costPerPack: null, sellingPricePerUnit: 2000, icon: '☕' },
  ];

  it('1. Modal dari belanja terbaru menggantikan modal lama (bukan rata-rata bergerak)', () => {
    const products: Product[] = [
      { id: 'indomie', name: 'Indomie Goreng', sellingPrice: 3000, active: true },
    ];

    // Belanja 1: 10 dus @ 40 pcs = 400 pcs, total nota Rp960.000 -> modal Rp2.400 / pcs
    // Belanja 2: 5 dus @ 40 pcs = 200 pcs, total nota Rp600.000 -> modal Rp3.000 / pcs (naik Rp600/pcs)
    // Cek fisik: sisa 500 pcs -> terjual = (400 + 200) - 500 = 100 pcs
    // Rumus pemilik: modal terjual = 100 pcs × Rp3.000 (modal terbaru) = Rp300.000 (BUKAN rata-rata Rp2.600)
    const events: AppEvent[] = [
      {
        id: 'p1',
        seq: 1,
        occurredAt: '2026-11-01T08:00:00Z',
        type: 'purchase',
        productId: 'indomie',
        packs: 10,
        unitsPerPack: 40,
        totalCost: 960000,
        sourceMoney: 'SETORAN',
      },
      {
        id: 'p2',
        seq: 2,
        occurredAt: '2026-11-02T08:00:00Z',
        type: 'purchase',
        productId: 'indomie',
        packs: 5,
        unitsPerPack: 40,
        totalCost: 600000,
        sourceMoney: 'SETORAN',
      },
      {
        id: 'chk1',
        seq: 3,
        occurredAt: '2026-11-02T18:00:00Z',
        type: 'stock_check',
        productId: 'indomie',
        observedUnits: 500,
      },
    ];

    const out = calculate({ asOf: '2026-11-03T00:00:00Z', products, events });
    const indomieRes = out.products.find(p => p.productId === 'indomie')!;

    expect(indomieRes.unitsSold).toBe(100);
    // Terjual 100 pcs @ Rp3.000 modal terbaru = Rp300.000
    expect(indomieRes.costOfSoldKnown).toBe(300000);
    expect(out.totals.costOfGoodsSoldKnown).toBe(300000);
    expect(indomieRes.latestUnitCost).toBe(3000);
    // Nilai sisa 500 pcs @ Rp3.000 = Rp1.500.000
    expect(indomieRes.knownInventoryValue).toBe(1500000);
  });

  it('2. Satuan belanja konversi: 2 Pcs = +2 pcs; 2 Dus @ 24 = +48 pcs', () => {
    const payload: TokoSakalaPayload = {
      products: [],
      purchaseRecords: [
        {
          id: 'pr-pcs',
          occurredAt: '2026-11-01T08:00:00Z',
          productId: 'aqua',
          packs: 2,
          unitsPerPack: 1, // 2 pcs
          totalCost: 4000,
          sourceMoney: 'SETORAN',
        },
        {
          id: 'pr-dus',
          occurredAt: '2026-11-02T08:00:00Z',
          productId: 'aqua',
          packs: 2,
          unitsPerPack: 24, // 2 dus @ 24 = 48 pcs
          totalCost: 96000,
          sourceMoney: 'SETORAN',
        },
      ],
      stockMovements: [],
      salesRecords: [],
      expenses: [],
      deposits: [],
      ownerWithdrawals: [],
      closedPeriods: [],
      corrections: [],
      settings: {
        shopName: 'TOKO SAKALA',
        ownerEmail: 'test@example.com',
        currency: 'IDR',
        theme: 'light',
        aiAssistantEnabled: false,
      },
    };

    const summary = runStoreFinancialEngine(payload, dummyCatalog);
    const aquaStock = summary.stockByProduct.get('aqua')!;
    // Total fisik masuk = 2 pcs + 48 pcs = 50 pcs
    expect(aquaStock.availableUnits).toBe(50);
  });

  it('3. Stok Awal: Cek pertama pada barang tanpa rekaman stok menjadi baseline opening_stock (0 terjual)', () => {
    const payload: TokoSakalaPayload = {
      products: [],
      purchaseRecords: [],
      stockMovements: [
        {
          id: 'init-indomie',
          occurredAt: '2026-11-01T08:00:00Z',
          productId: 'indomie',
          type: 'CHECK_ADJUSTMENT',
          quantity: 20,
          unit: 'pcs',
          notes: 'Stok awal fisik: 20 pcs',
        },
      ],
      salesRecords: [],
      expenses: [],
      deposits: [],
      ownerWithdrawals: [],
      closedPeriods: [],
      corrections: [],
      settings: {
        shopName: 'TOKO SAKALA',
        ownerEmail: 'test@example.com',
        currency: 'IDR',
        theme: 'light',
        aiAssistantEnabled: false,
      },
    };

    const summary = runStoreFinancialEngine(payload, dummyCatalog);
    const indomieStock = summary.stockByProduct.get('indomie')!;

    expect(indomieStock.availableUnits).toBe(20);
    expect(indomieStock.unitsSold).toBe(0);
    expect(summary.grossSales.min).toBe(0);
    expect(summary.untungKotor.min).toBe(0);
    expect(summary.cogsKnown).toBe(0);
  });

  it('4. Cek sisa stok kedua menghitung penjualan menggunakan harga jual satuan', () => {
    const payload: TokoSakalaPayload = {
      products: [],
      purchaseRecords: [],
      stockMovements: [
        {
          id: 'init-indomie',
          occurredAt: '2026-11-01T08:00:00Z',
          productId: 'indomie',
          type: 'CHECK_ADJUSTMENT',
          quantity: 20,
          unit: 'pcs',
          notes: 'Stok awal fisik: 20 pcs',
        },
        {
          id: 'check2-indomie',
          occurredAt: '2026-11-02T18:00:00Z',
          productId: 'indomie',
          type: 'CHECK_ADJUSTMENT',
          quantity: 15, // sisa 15 pcs -> terjual 5 pcs
          unit: 'pcs',
          notes: 'Cek sisa fisik: 15 pcs',
        },
      ],
      salesRecords: [],
      expenses: [],
      deposits: [],
      ownerWithdrawals: [],
      closedPeriods: [],
      corrections: [],
      settings: {
        shopName: 'TOKO SAKALA',
        ownerEmail: 'test@example.com',
        currency: 'IDR',
        theme: 'light',
        aiAssistantEnabled: false,
      },
    };

    const summary = runStoreFinancialEngine(payload, dummyCatalog);
    const indomieStock = summary.stockByProduct.get('indomie')!;

    expect(indomieStock.unitsSold).toBe(5);
    // 5 pcs × Rp3.000 harga jual = Rp15.000
    expect(summary.grossSales.min).toBe(15000);
    expect(summary.untungKotor.min).toBe(15000);
    expect(summary.expectedDeposit).toBe(15000);
  });

  it('5. Uang di tangan: Belum bisa dihitung jika setoran diterima === 0, bukan angka minus', () => {
    const payload: TokoSakalaPayload = {
      products: [],
      purchaseRecords: [
        {
          id: 'pr1',
          occurredAt: '2026-11-01T08:00:00Z',
          productId: 'indomie',
          packs: 1,
          unitsPerPack: 40,
          totalCost: 96000,
          sourceMoney: 'SETORAN',
        },
      ],
      stockMovements: [],
      salesRecords: [],
      expenses: [],
      deposits: [], // 0 setoran diterima
      ownerWithdrawals: [],
      closedPeriods: [],
      corrections: [],
      settings: {
        shopName: 'TOKO SAKALA',
        ownerEmail: 'test@example.com',
        currency: 'IDR',
        theme: 'light',
        aiAssistantEnabled: false,
      },
    };

    const summary = runStoreFinancialEngine(payload, dummyCatalog);

    expect(summary.totalDeposits).toBe(0);
    expect(summary.isCashInHandCalculable).toBe(false);
  });

  it('6. Uang di tangan dihitung saat setoran ada: setoran diterima - belanja setoran - pengambilan pribadi', () => {
    const payload: TokoSakalaPayload = {
      products: [],
      purchaseRecords: [
        {
          id: 'pr1',
          occurredAt: '2026-11-01T08:00:00Z',
          productId: 'indomie',
          packs: 1,
          unitsPerPack: 40,
          totalCost: 100000,
          sourceMoney: 'SETORAN',
        },
      ],
      stockMovements: [],
      salesRecords: [],
      expenses: [],
      deposits: [
        {
          id: 'dep1',
          occurredAt: '2026-11-01T20:00:00Z',
          expectedAmount: 500000,
          receivedAmount: 500000,
          discrepancy: 0,
        },
      ],
      ownerWithdrawals: [
        {
          id: 'w1',
          occurredAt: '2026-11-02T10:00:00Z',
          amount: 50000,
          notes: 'Ambil keperluan dapur',
        },
      ],
      closedPeriods: [],
      corrections: [],
      settings: {
        shopName: 'TOKO SAKALA',
        ownerEmail: 'test@example.com',
        currency: 'IDR',
        theme: 'light',
        aiAssistantEnabled: false,
      },
    };

    const summary = runStoreFinancialEngine(payload, dummyCatalog);

    expect(summary.totalDeposits).toBe(500000);
    expect(summary.purchasesFromSetoran).toBe(100000);
    expect(summary.ownerWithdrawalsTotal).toBe(50000);
    expect(summary.isCashInHandCalculable).toBe(true);
    // Uang di tangan = 500.000 - 100.000 - 50.000 = 350.000
    expect(summary.cashInHand).toBe(350000);
  });

  it('7. getProductLatestUnitCost mengambil modal dari belanja terbaru', () => {
    const payload: TokoSakalaPayload = {
      products: [],
      purchaseRecords: [
        {
          id: 'p1',
          occurredAt: '2026-11-01T08:00:00Z',
          productId: 'kopi',
          packs: 2,
          unitsPerPack: 24, // 48 pcs
          totalCost: 240000, // Rp5.000 / pcs
          sourceMoney: 'SETORAN',
        },
        {
          id: 'p2',
          occurredAt: '2026-11-02T08:00:00Z',
          productId: 'kopi',
          packs: 2,
          unitsPerPack: 24, // 48 pcs
          totalCost: 264000, // Rp5.500 / pcs (+Rp500)
          sourceMoney: 'SETORAN',
        },
      ],
      stockMovements: [],
      salesRecords: [],
      expenses: [],
      deposits: [],
      ownerWithdrawals: [],
      closedPeriods: [],
      corrections: [],
      settings: {
        shopName: 'TOKO SAKALA',
        ownerEmail: 'test@example.com',
        currency: 'IDR',
        theme: 'light',
        aiAssistantEnabled: false,
      },
    };

    const latestCost = getProductLatestUnitCost('kopi', payload, dummyCatalog);
    expect(latestCost).toBe(5500);
  });
});
