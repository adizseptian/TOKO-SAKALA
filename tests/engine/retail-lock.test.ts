import { describe, expect, it } from 'vitest';
import { calculate } from '@/engine/v1/calculate';
import { calculatePurchasePreview } from '@/engine/v1/purchase-preview';
import type { AppEvent, Product } from '@/domain/event';

const mie: Product = { id: 'mie', name: 'Mie Instan', sellingPrice: 7000, active: true };
const asOf = '2026-10-26T12:00:00+07:00';

describe('TOKO SAKALA — Retail Sales & Employee Remittance Lock v1.1', () => {
  it('1. 2 dus × 24 unit menghasilkan 48 unit', () => {
    const preview = calculatePurchasePreview({
      packs: 2,
      unitsPerPack: 24,
      costPerPack: 96000,
      sellingPricePerUnit: 7000
    });
    expect(preview).not.toBeNull();
    expect(preview!.totalUnits).toBe(48);
    expect(preview!.totalCost).toBe(192000);
    expect(preview!.unitCostRounded).toBe(4000);
  });

  it('2. 48 × Rp7.000 menghasilkan potensi nilai jual Rp336.000 (Keuntungan Jual)', () => {
    const preview = calculatePurchasePreview({
      packs: 2,
      unitsPerPack: 24,
      costPerPack: 96000,
      sellingPricePerUnit: 7000
    });
    expect(preview!.potentialSalesRevenue).toBe(336000);

    const events: AppEvent[] = [
      {
        id: 'buy-1',
        seq: 1,
        occurredAt: '2026-10-20T08:00:00+07:00',
        type: 'purchase',
        productId: 'mie',
        packs: 2,
        unitsPerPack: 24,
        totalCost: 192000,
        sourceMoney: 'PERSONAL' // modal talangan pribadi agar kas kasir murni dari penjualan
      }
    ];
    const res = calculate({ products: [mie], events, asOf });
    expect(res.totals.potentialSalesRevenue).toEqual({ min: 336000, max: 336000 });
  });

  it('3, 4, 5, 6, 7. Uji hitung tangan lengkap: terjual 38, penjualan 266rb, HPP 152rb, laba kotor 114rb, laba bersih 94rb', () => {
    const events: AppEvent[] = [
      {
        id: 'buy-1',
        seq: 1,
        occurredAt: '2026-10-20T08:00:00+07:00',
        type: 'purchase',
        productId: 'mie',
        packs: 2,
        unitsPerPack: 24,
        totalCost: 192000,
        sourceMoney: 'PERSONAL'
      },
      {
        id: 'check-1',
        seq: 2,
        occurredAt: '2026-10-21T18:00:00+07:00',
        type: 'stock_check',
        productId: 'mie',
        observedUnits: 10
      },
      {
        id: 'exp-1',
        seq: 3,
        occurredAt: '2026-10-21T19:00:00+07:00',
        type: 'expense',
        description: 'Beban operasional',
        amount: 20000,
        sourceMoney: 'STORE'
      }
    ];

    const result = calculate({ products: [mie], events, asOf });
    const p = result.products[0];

    // 3. Sisa 10 dari 48 -> 38 unit terjual
    expect(p.unitsSold).toBe(38);
    expect(result.totals.unitsSold).toBe(38);

    // 4. Penjualan terhitung: 38 * 7000 = Rp266.000
    expect(p.salesRevenue).toEqual({ min: 266000, max: 266000 });
    expect(result.totals.salesRevenue).toEqual({ min: 266000, max: 266000 });

    // 5. Modal barang terjual: 38 * 4000 = Rp152.000
    expect(p.costOfSoldKnown).toBe(152000);
    expect(result.totals.costOfGoodsSoldKnown).toBe(152000);

    // 6. Laba kotor: Rp266.000 - Rp152.000 = Rp114.000
    expect(p.grossProfit).toEqual({ min: 114000, max: 114000 });
    expect(result.totals.grossProfit).toEqual({ min: 114000, max: 114000 });

    // 7. Pengeluaran Rp20.000 menghasilkan laba bersih Rp94.000
    expect(result.totals.profit).toEqual({ min: 94000, max: 94000 });
    expect(result.totals.netProfit).toEqual({ min: 94000, max: 94000 });
  });

  it('8. Pengeluaran yang dibayar dari kas karyawan mengurangi uang yang seharusnya diserahkan, tetapi tidak mengurangi lagi laba setelah telah dicatat sebagai pengeluaran', () => {
    const events: AppEvent[] = [
      {
        id: 'buy-1',
        seq: 1,
        occurredAt: '2026-10-20T08:00:00+07:00',
        type: 'purchase',
        productId: 'mie',
        packs: 2,
        unitsPerPack: 24,
        totalCost: 192000,
        sourceMoney: 'PERSONAL'
      },
      {
        id: 'check-1',
        seq: 2,
        occurredAt: '2026-10-21T18:00:00+07:00',
        type: 'stock_check',
        productId: 'mie',
        observedUnits: 10 // Penjualan terhitung = 266.000
      },
      {
        id: 'exp-store',
        seq: 3,
        occurredAt: '2026-10-21T19:00:00+07:00',
        type: 'expense',
        description: 'Plastik kresek dari kas toko',
        amount: 20000,
        sourceMoney: 'STORE' // Dibayar dari uang kas toko
      }
    ];

    const res = calculate({ products: [mie], events, asOf });
    // Uang kas yang dipegang karyawan berkurang 20.000 dari 266.000 menjadi 246.000
    expect(res.totals.storeCashAfterDeposits).toEqual({ min: 246000, max: 246000 });
    // Laba bersih = 114.000 - 20.000 = 94.000
    expect(res.totals.netProfit).toEqual({ min: 94000, max: 94000 });
  });

  it('9. Pengeluaran yang dibayar dengan uang pribadi/owner tidak mengurangi uang yang dipegang karyawan, kecuali kejadian tersebut benar-benar memakai kas karyawan', () => {
    const events: AppEvent[] = [
      {
        id: 'buy-1',
        seq: 1,
        occurredAt: '2026-10-20T08:00:00+07:00',
        type: 'purchase',
        productId: 'mie',
        packs: 2,
        unitsPerPack: 24,
        totalCost: 192000,
        sourceMoney: 'PERSONAL'
      },
      {
        id: 'check-1',
        seq: 2,
        occurredAt: '2026-10-21T18:00:00+07:00',
        type: 'stock_check',
        productId: 'mie',
        observedUnits: 10 // Penjualan terhitung = 266.000
      },
      {
        id: 'exp-personal',
        seq: 3,
        occurredAt: '2026-10-21T19:00:00+07:00',
        type: 'expense',
        description: 'Biaya renovasi talangan owner',
        amount: 50000,
        sourceMoney: 'PERSONAL' // Dibayar owner pribadi
      }
    ];

    const res = calculate({ products: [mie], events, asOf });
    // Kas kasir tetap utuh 266.000 karena tidak ditarik dari kas karyawan
    expect(res.totals.storeCashAfterDeposits).toEqual({ min: 266000, max: 266000 });
    // Namun laba bersih toko tetap memperhitungkan beban operasional 50.000: 114.000 - 50.000 = 64.000
    expect(res.totals.netProfit).toEqual({ min: 64000, max: 64000 });
  });

  it('10. Setoran aktual Rp240.000 terhadap uang seharusnya Rp246.000 menghasilkan selisih −Rp6.000', () => {
    const events: AppEvent[] = [
      {
        id: 'buy-1',
        seq: 1,
        occurredAt: '2026-10-20T08:00:00+07:00',
        type: 'purchase',
        productId: 'mie',
        packs: 2,
        unitsPerPack: 24,
        totalCost: 192000,
        sourceMoney: 'PERSONAL'
      },
      {
        id: 'check-1',
        seq: 2,
        occurredAt: '2026-10-21T18:00:00+07:00',
        type: 'stock_check',
        productId: 'mie',
        observedUnits: 10 // Penjualan = 266.000
      },
      {
        id: 'exp-1',
        seq: 3,
        occurredAt: '2026-10-21T19:00:00+07:00',
        type: 'expense',
        description: 'Beban operasional',
        amount: 20000,
        sourceMoney: 'STORE' // Kas berkurang jadi 246.000
      },
      {
        id: 'dep-1',
        seq: 4,
        occurredAt: '2026-10-21T21:00:00+07:00',
        type: 'deposit',
        amount: 240000, // Karyawan menyerahkan 240.000 ke owner
        employeeName: 'Budi'
      }
    ];

    const res = calculate({ products: [mie], events, asOf });
    expect(res.depositChecks.length).toBe(1);
    const check = res.depositChecks[0];

    // Uang yang seharusnya diserahkan: Rp246.000
    expect(check.expectedBeforeDeposit).toEqual({ min: 246000, max: 246000 });
    // Setoran aktual: Rp240.000
    expect(check.actualAmount).toBe(240000);
    // Selisih: 240.000 - 246.000 = -6.000
    expect(check.difference).toEqual({ min: -6000, max: -6000 });
    // Status serah terima: BELUM_COCOK
    expect(check.status).toBe('BELUM_COCOK');
    expect(check.statusLabel).toBe('Belum cocok');
    expect(check.explanation).toContain('kurang Rp 6.000');
    // Saldo uang yang masih dipegang karyawan setelah serah terima: 246.000 - 240.000 = 6.000
    expect(res.totals.storeCashAfterDeposits).toEqual({ min: 6000, max: 6000 });
  });

  it('11. Setoran dari karyawan kepada owner tidak menambah penjualan, pendapatan, laba kotor, atau laba bersih', () => {
    const baseEvents: AppEvent[] = [
      { id: 'b1', seq: 1, occurredAt: '2026-10-20T08:00:00+07:00', type: 'purchase', productId: 'mie', packs: 2, unitsPerPack: 24, totalCost: 192000, sourceMoney: 'PERSONAL' },
      { id: 'c1', seq: 2, occurredAt: '2026-10-21T18:00:00+07:00', type: 'stock_check', productId: 'mie', observedUnits: 10 },
      { id: 'e1', seq: 3, occurredAt: '2026-10-21T19:00:00+07:00', type: 'expense', description: 'Beban', amount: 20000, sourceMoney: 'STORE' }
    ];

    const beforeRemittance = calculate({ products: [mie], events: baseEvents, asOf });

    const withRemittance = calculate({
      products: [mie],
      events: [
        ...baseEvents,
        { id: 'd1', seq: 4, occurredAt: '2026-10-21T21:00:00+07:00', type: 'deposit', amount: 240000 }
      ],
      asOf
    });

    // Penjualan tetap sama
    expect(withRemittance.totals.salesRevenue).toEqual(beforeRemittance.totals.salesRevenue);
    // Pendapatan lain tetap sama
    expect(withRemittance.totals.otherIncome).toBe(beforeRemittance.totals.otherIncome);
    // HPP tetap sama
    expect(withRemittance.totals.costOfGoodsSoldKnown).toBe(beforeRemittance.totals.costOfGoodsSoldKnown);
    // Laba kotor tetap sama
    expect(withRemittance.totals.grossProfit).toEqual(beforeRemittance.totals.grossProfit);
    // Laba bersih tetap sama (Rp94.000)
    expect(withRemittance.totals.netProfit).toEqual(beforeRemittance.totals.netProfit);
  });

  it('12. Setoran dicatat dua kali dengan perintah identik tidak boleh menduplikasi penerimaan aktual (idempotensi)', () => {
    const eventsWithDuplicate: AppEvent[] = [
      { id: 'b1', seq: 1, occurredAt: '2026-10-20T08:00:00+07:00', type: 'purchase', productId: 'mie', packs: 2, unitsPerPack: 24, totalCost: 192000, sourceMoney: 'PERSONAL' },
      { id: 'c1', seq: 2, occurredAt: '2026-10-21T18:00:00+07:00', type: 'stock_check', productId: 'mie', observedUnits: 10 },
      // Duplicate deposit with identical ID
      { id: 'dep-dup', seq: 3, occurredAt: '2026-10-21T21:00:00+07:00', type: 'deposit', amount: 200000 },
      { id: 'dep-dup', seq: 4, occurredAt: '2026-10-21T21:00:00+07:00', type: 'deposit', amount: 200000 }
    ];

    const res = calculate({ products: [mie], events: eventsWithDuplicate, asOf });
    // Total deposits harus tetap 200.000 (tidak menjadi 400.000)
    expect(res.totals.totalDeposits).toBe(200000);
    expect(res.depositChecks.length).toBe(1);
  });

  it('13. Setoran kedua memakai saldo uang yang belum diserahkan sebelumnya, tanpa menghitung ulang transaksi lama', () => {
    const events: AppEvent[] = [
      // Interval 1: Kas masuk 266.000, disetor 200.000 -> sisa dipegang karyawan 66.000
      { id: 'b1', seq: 1, occurredAt: '2026-10-20T08:00:00+07:00', type: 'purchase', productId: 'mie', packs: 2, unitsPerPack: 24, totalCost: 192000, sourceMoney: 'PERSONAL' },
      { id: 'c1', seq: 2, occurredAt: '2026-10-21T18:00:00+07:00', type: 'stock_check', productId: 'mie', observedUnits: 10 }, // 38 pcs sold = 266rb
      { id: 'd1', seq: 3, occurredAt: '2026-10-21T21:00:00+07:00', type: 'deposit', amount: 200000 },
      // Interval 2: Sisa 10 pcs, dicek sisa lagi menjadi 6 pcs -> terjual 4 pcs * 7000 = 28.000
      // Uang yang seharusnya diserahkan = sisa saldo lama 66.000 + penjualan baru 28.000 = 94.000
      { id: 'c2', seq: 4, occurredAt: '2026-10-22T18:00:00+07:00', type: 'stock_check', productId: 'mie', observedUnits: 6 },
      // Setoran kedua: diserahkan 94.000 penuh -> selisih 0 (COCOK)
      { id: 'd2', seq: 5, occurredAt: '2026-10-22T21:00:00+07:00', type: 'deposit', amount: 94000 }
    ];

    const res = calculate({ products: [mie], events, asOf });
    expect(res.depositChecks.length).toBe(2);

    const secondDeposit = res.depositChecks[1];
    expect(secondDeposit.expectedBeforeDeposit).toEqual({ min: 94000, max: 94000 });
    expect(secondDeposit.actualAmount).toBe(94000);
    expect(secondDeposit.difference).toEqual({ min: 0, max: 0 });
    expect(secondDeposit.status).toBe('COCOK');
    expect(res.totals.storeCashAfterDeposits).toEqual({ min: 0, max: 0 });
  });

  it('14. Barang rusak/dipakai tidak dianggap terjual dan tidak dihitung dua kali', () => {
    const events: AppEvent[] = [
      { id: 'b1', seq: 1, occurredAt: '2026-10-20T08:00:00+07:00', type: 'purchase', productId: 'mie', packs: 2, unitsPerPack: 24, totalCost: 192000, sourceMoney: 'STORE' },
      { id: 'loss-1', seq: 2, occurredAt: '2026-10-21T09:00:00+07:00', type: 'loss', productId: 'mie', reason: 'DAMAGE', units: 2 },
      { id: 'c1', seq: 3, occurredAt: '2026-10-21T18:00:00+07:00', type: 'stock_check', productId: 'mie', observedUnits: 10 }
    ];

    const result = calculate({ products: [mie], events, asOf });
    const p = result.products[0];

    // 48 - 2 rusak - 10 sisa = 36 terjual
    expect(p.unitsSold).toBe(36);
    expect(p.damageLossKnown).toBe(8000);
    expect(p.salesRevenue).toEqual({ min: 252000, max: 252000 });
    expect(p.grossProfit).toEqual({ min: 108000, max: 108000 });
    // Laba bersih = 108.000 - 8.000 = 100.000
    expect(result.totals.netProfit).toEqual({ min: 100000, max: 100000 });
  });

  it('15. Stok akhir melebihi stok tersedia memunculkan Perlu Diperiksa, bukan penjualan negatif', () => {
    const events: AppEvent[] = [
      { id: 'b1', seq: 1, occurredAt: '2026-10-20T08:00:00+07:00', type: 'purchase', productId: 'mie', packs: 1, unitsPerPack: 10, totalCost: 40000, sourceMoney: 'STORE' },
      { id: 'c1', seq: 2, occurredAt: '2026-10-21T18:00:00+07:00', type: 'stock_check', productId: 'mie', observedUnits: 15 } // sisa 15 > tersedia 10
    ];

    const result = calculate({ products: [mie], events, asOf });
    expect(result.totals.unitsSold).toBe(0);
    expect(result.issues.some((i) => i.code === 'STOCK_EXCESS')).toBe(true);
    expect(result.products[0].certainty).toBe('PERLU_DIPERIKSA');
  });

  it('16. Harga jual berubah di tengah interval memunculkan label ketidakpastian (range)', () => {
    const events: AppEvent[] = [
      { id: 'p1', seq: 1, occurredAt: '2026-10-18T08:00:00+07:00', type: 'purchase', productId: 'mie', packs: 1, unitsPerPack: 20, totalCost: 80000, sourceMoney: 'STORE' },
      { id: 'pc', seq: 2, occurredAt: '2026-10-19T08:00:00+07:00', type: 'price_change', productId: 'mie', sellingPrice: 8000 },
      { id: 'c1', seq: 3, occurredAt: '2026-10-20T20:00:00+07:00', type: 'stock_check', productId: 'mie', observedUnits: 10 }
    ];

    const result = calculate({ products: [mie], events, asOf });
    expect(result.products[0].salesRevenue.min).toBe(70000);
    expect(result.products[0].salesRevenue.max).toBe(80000);
    expect(result.products[0].certainty).toBe('PERLU_DIPERIKSA');
  });

  it('17. Preview dan hasil tersimpan menggunakan engine perhitungan yang sama', () => {
    const preview = calculatePurchasePreview({
      packs: 2,
      unitsPerPack: 24,
      costPerPack: 96000,
      sellingPricePerUnit: 7000
    });

    const events: AppEvent[] = [
      { id: 'p1', seq: 1, occurredAt: '2026-10-20T08:00:00+07:00', type: 'purchase', productId: 'mie', packs: 2, unitsPerPack: 24, totalCost: 192000, sourceMoney: 'STORE' }
    ];
    const res = calculate({ products: [mie], events, asOf });

    expect(preview!.totalCost).toBe(res.products[0].knownInventoryValue);
    expect(preview!.totalUnits).toBe(res.products[0].availableUnits);
    expect(preview!.potentialSalesRevenue).toBe(res.products[0].potentialSalesRevenue.min);
  });

  it('18. Koreksi transaksi tidak mengubah periode tertutup secara diam-diam (event log append-only)', () => {
    const events: AppEvent[] = [
      { id: 'e1', seq: 1, occurredAt: '2026-10-18T08:00:00+07:00', type: 'purchase', productId: 'mie', packs: 1, unitsPerPack: 10, totalCost: 40000, sourceMoney: 'STORE' },
      { id: 'e2', seq: 2, occurredAt: '2026-10-18T20:00:00+07:00', type: 'stock_check', productId: 'mie', observedUnits: 5 },
      { id: 'e3', seq: 3, occurredAt: '2026-10-18T21:00:00+07:00', type: 'deposit', amount: 35000 }
    ];

    // Cek pada asOf waktu periode 1
    const period1Result = calculate({ products: [mie], events, asOf: '2026-10-18T23:59:59+07:00' });
    expect(period1Result.totals.totalDeposits).toBe(35000);

    // Tambah penyesuaian kas kasir di masa depan tanpa mengubah catatan lama
    const eventsWithCorrection: AppEvent[] = [
      ...events,
      { id: 'e4', seq: 4, occurredAt: '2026-10-19T08:00:00+07:00', type: 'cash_adjustment', amount: 5000, reason: 'Koreksi uang kembalian tertinggal' }
    ];

    // Histori periode 1 tetap tidak berubah saat ditinjau kembali pada asOf periode 1
    const pastCheck = calculate({ products: [mie], events: eventsWithCorrection, asOf: '2026-10-18T23:59:59+07:00' });
    expect(pastCheck.totals.totalDeposits).toBe(35000);
    expect(pastCheck.totals.storeCashAfterDeposits).toEqual(period1Result.totals.storeCashAfterDeposits);

    // Hasil setelah tanggal koreksi terakumulasi secara sah dan transparan
    const currentCheck = calculate({ products: [mie], events: eventsWithCorrection, asOf });
    expect(currentCheck.totals.storeCashAfterDeposits.min).toBe(period1Result.totals.storeCashAfterDeposits.min + 5000);
  });
});
