import { describe, expect, it } from 'vitest';
import { calculate } from '@/engine/v1/calculate';
import { calculatePurchasePreview } from '@/engine/v1/purchase-preview';
import type { AppEvent, Product } from '@/domain/event';

const mie: Product = { id: 'mie', name: 'Mie Instan', sellingPrice: 7000, active: true };
const asOf = '2026-10-22T12:00:00+07:00';

describe('TOKO SAKALA — Retail Sales Calculation Lock v1.0', () => {
  it('1 & 2. 2 dus × 24 unit menghasilkan 48 unit dan potensi nilai jual Rp336.000', () => {
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
    expect(preview!.potentialSalesRevenue).toBe(336000);
  });

  it('3, 4, 5, 6, 7. Uji hitung tangan lengkap (Section 6 & Acceptance 3-7)', () => {
    // 2 dus mie, modal 192.000, sisa 10, pengeluaran 20.000
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
        sourceMoney: 'STORE'
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

    // Acceptance 2: Potensi nilai jual Rp336.000
    expect(p.potentialSalesRevenue).toEqual({ min: 336000, max: 336000 });
    expect(result.totals.potentialSalesRevenue).toEqual({ min: 336000, max: 336000 });

    // Nilai sisa pada harga jual: 10 * 7000 = 70.000
    expect(p.remainingAtSellingPrice).toEqual({ min: 70000, max: 70000 });

    // Acceptance 3: Unit terjual: 48 - 10 = 38 unit
    expect(p.unitsSold).toBe(38);
    expect(result.totals.unitsSold).toBe(38);

    // Acceptance 4: Penjualan terhitung: 38 * 7000 = Rp266.000
    expect(p.salesRevenue).toEqual({ min: 266000, max: 266000 });
    expect(result.totals.salesRevenue).toEqual({ min: 266000, max: 266000 });

    // Acceptance 5: Modal barang terjual: 38 * 4000 = Rp152.000
    expect(p.costOfSoldKnown).toBe(152000);
    expect(result.totals.costOfGoodsSoldKnown).toBe(152000);

    // Acceptance 6: Laba kotor: 266.000 - 152.000 = Rp114.000
    expect(p.grossProfit).toEqual({ min: 114000, max: 114000 });
    expect(result.totals.grossProfit).toEqual({ min: 114000, max: 114000 });

    // Acceptance 7: Laba bersih (setelah beban Rp20.000) = Rp94.000
    expect(result.totals.profit).toEqual({ min: 94000, max: 94000 });
    expect(result.totals.netProfit).toEqual({ min: 94000, max: 94000 });

    // Acceptance 12: Penjualan, laba kotor, laba bersih, dan saldo uang kas adalah angka yang berbeda
    expect(result.totals.salesRevenue.min).toBe(266000);
    expect(result.totals.grossProfit.min).toBe(114000);
    expect(result.totals.netProfit!.min).toBe(94000);
    // Kas toko: masuk 266.000 - modal keluar 192.000 - beban 20.000 = 54.000
    expect(result.totals.storeCashAfterDeposits.min).toBe(54000);
  });

  it('8. Barang rusak/dipakai tidak dianggap terjual dan tidak dihitung dua kali', () => {
    const events: AppEvent[] = [
      {
        id: 'buy',
        seq: 1,
        occurredAt: '2026-10-20T08:00:00+07:00',
        type: 'purchase',
        productId: 'mie',
        packs: 2,
        unitsPerPack: 24,
        totalCost: 192000, // 48 pcs @ 4000
        sourceMoney: 'STORE'
      },
      {
        id: 'loss-1',
        seq: 2,
        occurredAt: '2026-10-21T09:00:00+07:00',
        type: 'loss',
        productId: 'mie',
        reason: 'DAMAGE',
        units: 2 // 2 pcs rusak (modal 8.000)
      },
      {
        id: 'check',
        seq: 3,
        occurredAt: '2026-10-21T18:00:00+07:00',
        type: 'stock_check',
        productId: 'mie',
        observedUnits: 10 // sisa fisik 10 pcs
      }
    ];

    const result = calculate({ products: [mie], events, asOf });
    const p = result.products[0];

    // Total awal 48, rusak 2, sisa 10 -> terjual = 48 - 2 - 10 = 36 pcs
    expect(p.unitsSold).toBe(36);
    expect(p.damageLossKnown).toBe(8000);
    // Penjualan terhitung = 36 * 7000 = 252.000
    expect(p.salesRevenue).toEqual({ min: 252000, max: 252000 });
    // HPP terjual = 36 * 4000 = 144.000
    expect(p.costOfSoldKnown).toBe(144000);
    // Laba kotor = 252.000 - 144.000 = 108.000
    expect(p.grossProfit).toEqual({ min: 108000, max: 108000 });
    // Laba bersih = 108.000 - 8.000 (kerugian barang rusak) = 100.000
    expect(result.totals.profit).toEqual({ min: 100000, max: 100000 });
  });

  it('9. Stok akhir melebihi stok tersedia memunculkan Perlu Diperiksa, bukan penjualan negatif', () => {
    const events: AppEvent[] = [
      {
        id: 'buy',
        seq: 1,
        occurredAt: '2026-10-20T08:00:00+07:00',
        type: 'purchase',
        productId: 'mie',
        packs: 1,
        unitsPerPack: 10,
        totalCost: 40000,
        sourceMoney: 'STORE'
      },
      {
        id: 'check-excess',
        seq: 2,
        occurredAt: '2026-10-21T18:00:00+07:00',
        type: 'stock_check',
        productId: 'mie',
        observedUnits: 15 // sisa 15 padahal stok cuma 10
      }
    ];

    const result = calculate({ products: [mie], events, asOf });
    expect(result.totals.unitsSold).toBe(0);
    expect(result.issues.some((i) => i.code === 'STOCK_EXCESS')).toBe(true);
    expect(result.products[0].certainty).toBe('PERLU_DIPERIKSA');
  });

  it('10. Setoran berikutnya dimulai dari stok akhir sebelumnya plus barang masuk interval baru', () => {
    const events: AppEvent[] = [
      // Interval 1: Beli 20 pcs, sisa 5 pcs -> terjual 15 pcs
      { id: 'p1', seq: 1, occurredAt: '2026-10-18T08:00:00+07:00', type: 'purchase', productId: 'mie', packs: 1, unitsPerPack: 20, totalCost: 80000, sourceMoney: 'STORE' },
      { id: 'c1', seq: 2, occurredAt: '2026-10-18T20:00:00+07:00', type: 'stock_check', productId: 'mie', observedUnits: 5 },
      { id: 'd1', seq: 3, occurredAt: '2026-10-18T21:00:00+07:00', type: 'deposit', amount: 50000 },
      // Interval 2: Masuk lagi 10 pcs (total tersedia jadi 5 + 10 = 15 pcs), sisa dihitung 3 pcs -> terjual 12 pcs lagi
      { id: 'p2', seq: 4, occurredAt: '2026-10-19T08:00:00+07:00', type: 'purchase', productId: 'mie', packs: 1, unitsPerPack: 10, totalCost: 40000, sourceMoney: 'STORE' },
      { id: 'c2', seq: 5, occurredAt: '2026-10-19T20:00:00+07:00', type: 'stock_check', productId: 'mie', observedUnits: 3 }
    ];

    const result = calculate({ products: [mie], events, asOf });
    // Total terjual kumulatif = 15 + 12 = 27 pcs
    expect(result.products[0].unitsSold).toBe(27);
    expect(result.products[0].availableUnits).toBe(3);
    // Setoran tercatat
    expect(result.totals.totalDeposits).toBe(50000);
  });

  it('11. Harga jual berubah di tengah interval memunculkan label ketidakpastian (range)', () => {
    const events: AppEvent[] = [
      { id: 'p1', seq: 1, occurredAt: '2026-10-18T08:00:00+07:00', type: 'purchase', productId: 'mie', packs: 1, unitsPerPack: 20, totalCost: 80000, sourceMoney: 'STORE' },
      { id: 'price-chg', seq: 2, occurredAt: '2026-10-19T08:00:00+07:00', type: 'price_change', productId: 'mie', sellingPrice: 8000 },
      { id: 'c1', seq: 3, occurredAt: '2026-10-20T20:00:00+07:00', type: 'stock_check', productId: 'mie', observedUnits: 10 }
    ];

    const result = calculate({ products: [mie], events, asOf });
    // Karena harga berubah antara 7000 dan 8000 sebelum ada cek sisa pemisah, penjualan adalah kisaran
    expect(result.products[0].salesRevenue.min).toBe(70000);
    expect(result.products[0].salesRevenue.max).toBe(80000);
    expect(result.products[0].certainty).toBe('PERLU_DIPERIKSA');
  });
});
