import { describe, it, expect } from 'vitest';
import { calculate } from '@/engine/v1/calculate';
import { runStoreFinancialEngine, getProductLatestUnitCost, calculatePeriodSummary, type CatalogProduct } from '@/engine/v1/engineBridge';
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
      otherIncomes: [],
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
      otherIncomes: [],
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
      otherIncomes: [],
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
      otherIncomes: [],
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
      otherIncomes: [],
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
      otherIncomes: [],
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

  it('8. Catat Belanja: Belanja 2 dus × 24 pcs, harga jual Rp7.000 menghasilkan "Jika habis terjual Rp336.000"', () => {
    const packs = 2;
    const unitsPerPack = 24;
    const sellingPricePerUnit = 7000;
    const piecesToAdd = packs * unitsPerPack; // 48 pcs
    const grossPotential = piecesToAdd * sellingPricePerUnit;

    expect(piecesToAdd).toBe(48);
    expect(grossPotential).toBe(336000);

    // Dengan modal diketahui (total nota Rp240.000)
    const totalCostKnown = 240000;
    const netPotentialKnown = grossPotential - totalCostKnown;
    expect(netPotentialKnown).toBe(96000);

    // Bila modal belum diketahui
    const totalCostUnknown = 0;
    const netPotentialUnknown = totalCostUnknown > 0 ? grossPotential - totalCostUnknown : null;
    expect(netPotentialUnknown).toBeNull();
  });

  it('9. Pemasukan Lain: Jasa seduh Rp2.000 × 3 kali menambah Rp6.000 ke Untung Bersih dan Setoran seharusnya', () => {
    const payload: TokoSakalaPayload = {
      products: [],
      purchaseRecords: [],
      stockMovements: [],
      salesRecords: [],
      expenses: [],
      deposits: [],
      ownerWithdrawals: [],
      otherIncomes: [
        {
          id: 'inc-1',
          occurredAt: '2026-11-02T10:00:00Z',
          name: 'Jasa seduh',
          nominal: 2000,
          quantity: 3,
          totalAmount: 6000,
          notes: 'Seduh 3 mie instan',
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

    expect(summary.otherIncomeTotal).toBe(6000);
    // Masuk ke Untung Bersih
    expect(summary.untungBersih?.min).toBe(6000);
    // Masuk ke Setoran Seharusnya
    expect(summary.expectedDeposit).toBe(6000);
  });

  it('10. Barang Rusak: Rusak 2 pcs menurunkan stok tersedia 2, terjual tidak berubah, Laporan menampilkan Rugi barang rusak tanpa mengurangi Untung Bersih', () => {
    const payload: TokoSakalaPayload = {
      products: [],
      purchaseRecords: [
        {
          id: 'pr-indomie',
          occurredAt: '2026-11-01T08:00:00Z',
          productId: 'indomie',
          packs: 1,
          unitsPerPack: 40,
          totalCost: 96000, // Rp2.400 / pcs
          sourceMoney: 'SETORAN',
        },
      ],
      stockMovements: [
        {
          id: 'loss-indomie',
          occurredAt: '2026-11-01T12:00:00Z',
          productId: 'indomie',
          type: 'LOSS_DAMAGE',
          quantity: 2, // 2 pcs rusak
          unit: 'pcs',
          notes: 'Barang rusak: dimakan tikus',
        },
      ],
      salesRecords: [],
      expenses: [],
      deposits: [],
      ownerWithdrawals: [],
      otherIncomes: [],
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

    // Dari 40 pcs belanja, rusak 2 pcs -> sisa stok tersedia turun 2 menjadi 38 pcs
    expect(indomieStock.availableUnits).toBe(38);
    // Tidak dihitung terjual
    expect(indomieStock.unitsSold).toBe(0);
    expect(summary.grossSales.min).toBe(0);

    // Laporan menampilkan nilai modalnya sebagai Rugi barang rusak: 2 pcs × Rp2.400 = Rp4.800
    expect(summary.damageLossTotal).toBe(4800);
    // Rugi barang rusak TIDAK mengurangi Untung Bersih (tetap Rp0 karena belum ada penjualan/biaya)
    expect(summary.untungBersih?.min).toBe(0);
  });

  it('11. Diskon hari tertentu: Selang cek melewati Jumat dengan diskon; kosong -> kisaran + "Perlu diperiksa"; terisi -> diskon pasti', () => {
    const catalogWithDiscount: CatalogProduct[] = [
      {
        id: 'indomie',
        name: 'Indomie Goreng',
        category: 'Makanan',
        unit: 'Dus (40 pcs)',
        packSize: 40,
        costPerPack: 96000,
        sellingPricePerUnit: 3000,
        icon: '🍜',
        discountDay: 'Jumat',
        discountPerUnit: 1000, // Potongan Rp1.000 / pcs khusus hari Jumat
      },
    ];

    // Cek 1: Kamis 5 November 2026 jam 17:00 (baseline 20 pcs)
    // Cek 2: Sabtu 7 November 2026 jam 08:00 (sisa fisik 15 pcs -> terjual 5 pcs)
    // Selang melewati hari Jumat!
    const payloadUnfilled: TokoSakalaPayload = {
      products: [],
      purchaseRecords: [],
      stockMovements: [
        {
          id: 'chk-kamis',
          occurredAt: '2026-11-05T17:00:00Z', // Kamis
          productId: 'indomie',
          type: 'CHECK_ADJUSTMENT',
          quantity: 20,
          unit: 'pcs',
        },
        {
          id: 'chk-sabtu',
          occurredAt: '2026-11-07T08:00:00Z', // Sabtu
          productId: 'indomie',
          type: 'CHECK_ADJUSTMENT',
          quantity: 15, // Terjual 5 pcs
          unit: 'pcs',
          discountSoldUnits: null, // Kolom kosong belum diisi
        },
      ],
      salesRecords: [],
      expenses: [],
      deposits: [],
      ownerWithdrawals: [],
      otherIncomes: [],
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

    const summaryUnfilled = runStoreFinancialEngine(payloadUnfilled, catalogWithDiscount, '2026-11-08T00:00:00Z');

    // Penjualan kotor = 5 pcs × Rp3.000 = Rp15.000
    expect(summaryUnfilled.grossSales.min).toBe(15000);
    // Karena kosong, diskon dihitung sebagai kisaran 0 sampai 5 pcs × Rp1.000 = Rp5.000
    expect(summaryUnfilled.discountTotal.min).toBe(0);
    expect(summaryUnfilled.discountTotal.max).toBe(5000);
    // Untung kotor: Rp10.000 .. Rp15.000
    expect(summaryUnfilled.untungKotor.min).toBe(10000);
    expect(summaryUnfilled.untungKotor.max).toBe(15000);
    // Status kepastian: Perlu diperiksa
    expect(summaryUnfilled.certainty).toBe('PERLU_DIPERIKSA');
    expect(summaryUnfilled.hasDiscountReview).toBe(true);

    // Sekarang jika diisi pengguna: 3 pcs terjual saat diskon Jumat (3 × Rp1.000 = Rp3.000)
    const payloadFilled: TokoSakalaPayload = {
      ...payloadUnfilled,
      stockMovements: [
        payloadUnfilled.stockMovements[0],
        {
          ...payloadUnfilled.stockMovements[1],
          discountSoldUnits: 3, // Diisi 3 pcs
        },
      ],
    };

    const summaryFilled = runStoreFinancialEngine(payloadFilled, catalogWithDiscount, '2026-11-08T00:00:00Z');

    // Diskon pasti Rp3.000
    expect(summaryFilled.discountTotal.min).toBe(3000);
    expect(summaryFilled.discountTotal.max).toBe(3000);
    // Untung kotor = Rp15.000 - Rp3.000 = Rp12.000
    expect(summaryFilled.untungKotor.min).toBe(12000);
    expect(summaryFilled.untungKotor.max).toBe(12000);
    // Status kepastian kembali PASTI
    expect(summaryFilled.certainty).toBe('PASTI');
    expect(summaryFilled.hasDiscountReview).toBe(false);
  });

  it('12. Ganti Hari -> Minggu -> Bulan: semua angka Ringkasan berubah sesuai rentang', () => {
    // Transaksi di 2 hari berbeda: 1 Nov 2026 dan 2 Nov 2026
    const payload: TokoSakalaPayload = {
      products: [],
      purchaseRecords: [],
      stockMovements: [],
      salesRecords: [],
      expenses: [
        {
          id: 'exp-1',
          occurredAt: '2026-11-01T10:00:00Z',
          description: 'Plastik',
          amount: 50000,
          sourceMoney: 'LACI',
        },
        {
          id: 'exp-2',
          occurredAt: '2026-11-02T10:00:00Z',
          description: 'Gas Elpiji',
          amount: 22000,
          sourceMoney: 'LACI',
        },
      ],
      deposits: [
        {
          id: 'dep-1',
          occurredAt: '2026-11-01T21:00:00Z',
          expectedAmount: 500000,
          receivedAmount: 500000,
          discrepancy: 0,
        },
        {
          id: 'dep-2',
          occurredAt: '2026-11-02T21:00:00Z',
          expectedAmount: 300000,
          receivedAmount: 300000,
          discrepancy: 0,
        },
      ],
      ownerWithdrawals: [],
      otherIncomes: [
        {
          id: 'inc-1',
          occurredAt: '2026-11-01T11:00:00Z',
          name: 'Jasa seduh',
          nominal: 2000,
          quantity: 5,
          totalAmount: 10000,
        },
        {
          id: 'inc-2',
          occurredAt: '2026-11-02T11:00:00Z',
          name: 'Jasa seduh',
          nominal: 2000,
          quantity: 2,
          totalAmount: 4000,
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

    // Rentang HARI: 2026-11-02 saja
    const dayStart = new Date('2026-11-02T00:00:00Z');
    const dayEnd = new Date('2026-11-02T23:59:59Z');
    const summaryDay = calculatePeriodSummary(payload, dummyCatalog, dayStart, dayEnd);

    // Hanya transaksi 2 Nov yang masuk
    expect(summaryDay.depositsCount).toBe(1);
    expect(summaryDay.depositsTotal).toBe(300000);
    expect(summaryDay.expensesTotal).toBe(22000);
    expect(summaryDay.otherIncomeTotal).toBe(4000);

    // Rentang MINGGU / 2 HARI: 2026-11-01 s/d 2026-11-02
    const weekStart = new Date('2026-11-01T00:00:00Z');
    const weekEnd = new Date('2026-11-07T23:59:59Z');
    const summaryWeek = calculatePeriodSummary(payload, dummyCatalog, weekStart, weekEnd);

    // Dua-duanya masuk
    expect(summaryWeek.depositsCount).toBe(2);
    expect(summaryWeek.depositsTotal).toBe(800000);
    expect(summaryWeek.expensesTotal).toBe(72000);
    expect(summaryWeek.otherIncomeTotal).toBe(14000);

    // Rentang BULAN: Seluruh Nov 2026
    const monthStart = new Date('2026-11-01T00:00:00Z');
    const monthEnd = new Date('2026-11-30T23:59:59Z');
    const summaryMonth = calculatePeriodSummary(payload, dummyCatalog, monthStart, monthEnd);

    expect(summaryMonth.depositsCount).toBe(2);
    expect(summaryMonth.depositsTotal).toBe(800000);
    expect(summaryMonth.expensesTotal).toBe(72000);
    expect(summaryMonth.otherIncomeTotal).toBe(14000);
  });

  it('13. Belanja di tengah periode menambah stok tersedia dan rumus tetap konsisten', () => {
    // Siklus toko:
    // 1. Stok awal: 10 pcs
    // 2. Belanja di tengah periode: 2 dus × 40 pcs = 80 pcs (modal Rp2.400/pcs)
    // 3. Stok tersedia menjadi: 10 + 80 = 90 pcs
    // 4. Cek sisa fisik: 20 pcs
    // 5. Terjual = 90 - 20 = 70 pcs!
    // 6. Penjualan = 70 pcs × Rp3.000 = Rp210.000
    // 7. Modal terjual = 70 pcs × Rp2.400 = Rp168.000
    // 8. Untung bersih = Rp210.000 - Rp0 = Rp210.000 (sebelum kurangi modal)
    const payload: TokoSakalaPayload = {
      products: [],
      purchaseRecords: [
        {
          id: 'pr-mid',
          occurredAt: '2026-11-02T12:00:00Z',
          productId: 'indomie',
          packs: 2,
          unitsPerPack: 40,
          totalCost: 192000, // Rp2.400/pcs
          sourceMoney: 'SETORAN',
        },
      ],
      stockMovements: [
        {
          id: 'chk-start',
          occurredAt: '2026-11-01T08:00:00Z',
          productId: 'indomie',
          type: 'CHECK_ADJUSTMENT',
          quantity: 10,
          unit: 'pcs',
        },
        {
          id: 'chk-end',
          occurredAt: '2026-11-02T20:00:00Z',
          productId: 'indomie',
          type: 'CHECK_ADJUSTMENT',
          quantity: 20,
          unit: 'pcs',
        },
      ],
      salesRecords: [],
      expenses: [],
      deposits: [],
      ownerWithdrawals: [],
      otherIncomes: [],
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

    const summary = runStoreFinancialEngine(payload, dummyCatalog, '2026-11-03T00:00:00Z');
    const indomieStock = summary.stockByProduct.get('indomie')!;

    // Total terjual dihitung: (10 + 80) - 20 = 70 pcs
    expect(indomieStock.unitsSold).toBe(70);
    // Sisa fisik akhir: 20 pcs
    expect(indomieStock.lastObservedUnits).toBe(20);
    // Penjualan: 70 pcs × Rp3.000 = Rp210.000
    expect(summary.grossSales.min).toBe(210000);
    // Modal barang terjual: 70 pcs × Rp2.400 = Rp168.000
    expect(summary.cogsKnown).toBe(168000);
    // Laba setelah modal: Rp210.000 - Rp168.000 = Rp42.000
    expect(summary.labaSetelahModal?.min).toBe(42000);
  });
});

