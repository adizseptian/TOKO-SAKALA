import { describe, it, expect } from 'vitest';
import {
  escapeCSV,
  formatCurrencyForCSV,
  serializeProductsToCSV,
  serializeTransactionsToCSV,
  serializeMasterReportToCSV
} from '@/utils/export';
import type { Product, AppEvent } from '@/domain/event';
import type { EngineOutput, ProductCalculation } from '@/engine/contract';

describe('Export CSV Utility Tests', () => {
  describe('escapeCSV', () => {
    it('returns quoted empty string for null and undefined', () => {
      expect(escapeCSV(null)).toBe('""');
      expect(escapeCSV(undefined)).toBe('""');
    });

    it('returns plain string for simple alphanumeric values', () => {
      expect(escapeCSV('Kopi')).toBe('"Kopi"');
      expect(escapeCSV(12500)).toBe('"12500"');
    });

    it('doubles quotes for strings containing quotes', () => {
      expect(escapeCSV('Gula "Manis"')).toBe('"Gula ""Manis"""');
    });

    it('wraps strings containing commas or newlines', () => {
      expect(escapeCSV('Kopi, Susu, Gula')).toBe('"Kopi, Susu, Gula"');
      expect(escapeCSV("Baris 1\nBaris 2")).toBe('"Baris 1\nBaris 2"');
    });
  });

  describe('formatCurrencyForCSV', () => {
    it('rounds numbers to whole integers', () => {
      expect(formatCurrencyForCSV(15000.75)).toBe(15001);
      expect(formatCurrencyForCSV(20000)).toBe(20000);
    });
  });

  describe('serializeProductsToCSV', () => {
    it('produces valid CSV headers and product rows', () => {
      const products: Product[] = [
        { id: 'p1', name: 'Mie Instan Spesial', sellingPrice: 7000, active: true },
        { id: 'p2', name: 'Kopi Kapal Api', sellingPrice: 3000, active: true }
      ];

      const calculations: ProductCalculation[] = [
        {
          productId: 'p1',
          name: 'Mie Instan Spesial',
          availableUnits: 10,
          knownCostUnits: 10,
          unknownCostUnits: 0,
          knownInventoryValue: 40000,
          lastObservedUnits: 10,
          unitsSold: 38,
          salesRevenue: { min: 266000, max: 266000 },
          costOfSoldKnown: 152000,
          damageLossKnown: 0,
          usedLossKnown: 0,
          unknownLossKnown: 0,
          certainty: 'PASTI',
          notes: [],
          potentialSalesRevenue: { min: 336000, max: 336000 },
          remainingAtSellingPrice: { min: 70000, max: 70000 },
          grossProfit: { min: 114000, max: 114000 }
        }
      ];

      const csv = serializeProductsToCSV(products, calculations);
      expect(csv).toContain('Nama Barang');
      expect(csv).toContain('Keuntungan Jual / Potensi Omzet (IDR)');
      expect(csv).toContain('"Mie Instan Spesial"');
      expect(csv).toContain('"7000"');
      expect(csv).toContain('"336000"');
      expect(csv).toContain('"266000"');
      expect(csv).toContain('"114000"');
    });
  });

  describe('serializeTransactionsToCSV', () => {
    it('correctly maps purchase and expense transactions', () => {
      const products: Product[] = [
        { id: 'p1', name: 'Mie Instan', sellingPrice: 7000, active: true }
      ];

      const events: AppEvent[] = [
        {
          seq: 1,
          id: 'ev-1',
          occurredAt: '2026-10-22T08:00:00Z',
          type: 'purchase',
          productId: 'p1',
          packs: 2,
          unitsPerPack: 24,
          totalCost: 192000,
          sourceMoney: 'STORE'
        },
        {
          seq: 2,
          id: 'ev-2',
          occurredAt: '2026-10-22T09:00:00Z',
          type: 'expense',
          description: 'Beli Kantong Kresek',
          amount: 15000,
          sourceMoney: 'STORE'
        }
      ];

      const csv = serializeTransactionsToCSV(events, products);
      expect(csv).toContain('"Belanja Barang Masuk"');
      expect(csv).toContain('"Mie Instan"');
      expect(csv).toContain('"192000"');
      expect(csv).toContain('"Kas Toko"');
      expect(csv).toContain('"Pengeluaran Operasional"');
      expect(csv).toContain('"Beli Kantong Kresek"');
      expect(csv).toContain('"15000"');
    });
  });

  describe('serializeMasterReportToCSV', () => {
    it('includes financial summary sections and locked warning banner', () => {
      const products: Product[] = [
        { id: 'p1', name: 'Mie Instan', sellingPrice: 7000, active: true }
      ];

      const engineOutput: EngineOutput = {
        products: [],
        totals: {
          unitsSold: 38,
          salesRevenue: { min: 266000, max: 266000 },
          costOfGoodsSoldKnown: 152000,
          otherIncome: 0,
          expenses: 20000,
          damageLossKnown: 0,
          usedLossKnown: 0,
          unknownLossKnown: 0,
          profit: { min: 94000, max: 94000 },
          certainty: 'PASTI',
          storeCashAfterDeposits: { min: 54000, max: 54000 },
          totalDeposits: 0,
          potentialSalesRevenue: { min: 336000, max: 336000 },
          remainingInventoryAtSellingPrice: { min: 70000, max: 70000 },
          grossProfit: { min: 114000, max: 114000 },
          netProfit: { min: 94000, max: 94000 }
        },
        depositChecks: [],
        issues: []
      };

      const csv = serializeMasterReportToCSV(engineOutput, products);
      expect(csv).toContain('TOKO SAKALA - LAPORAN KEUANGAN & STOK RITEL');
      expect(csv).toContain('Peringatan: Nilai total penjualan setelah dikurangi nilai sisa berdasarkan harga jual bukan otomatis laba kotor');
      expect(csv).toContain('"1. Keuntungan Jual (Potensi Omzet)"');
      expect(csv).toContain('"336000"');
      expect(csv).toContain('"3. Penjualan setelah dikurangi sisa (Penjualan Terhitung)"');
      expect(csv).toContain('"266000"');
      expect(csv).toContain('"6. Laba Kotor Operasional"');
      expect(csv).toContain('"114000"');
      expect(csv).toContain('"9. Estimasi Laba Bersih Final"');
      expect(csv).toContain('"94000"');
    });
  });
});
