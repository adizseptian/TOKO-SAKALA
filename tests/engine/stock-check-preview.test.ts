import { describe, expect, it } from 'vitest';
import { calculateStockCheckLineValue, calculateStockCheckPreview } from '@/engine/v1/stock-check-preview';

describe('stock check worksheet preview', () => {
  it('matches the sum of the readable completed rows in the supplied paper example', () => {
    const values = [
      ['Mie', 34, 7000, 'pcs'], ['Seblak', 79, 1000, 'porsi'], ['Saltchees', 25, 1000, 'pcs'], ['Malkis', 18, 1000, 'pcs'],
      ['Superco', 4, 1000, 'pcs'], ['Tic Tac', 6, 1000, 'pcs'], ['Mie Krispi', 5, 1000, 'pcs'], ['Cloud 9', 9, 1000, 'pcs'],
      ['Chocolatos', 35, 1000, 'pcs'], ['Pilus', 4, 2000, 'pcs'], ['Better', 8, 2000, 'pcs'], ['So Nice', 1, 1000, 'pcs'],
      ['Seblak ceker', 18, 500, 'porsi'], ['Sosis goreng', 2, 500, 'pcs'], ['Kukoya', 70, 1000, 'pcs'],
    ] as const;
    const result = calculateStockCheckPreview([
      ...values.map(([name, remaining, sellingPrice, unit], index) => ({ id: index + 1, name, remaining, sellingPrice, unit })),
      { id: 16, name: 'ChocoPie', remaining: null, sellingPrice: null },
      { id: 17, name: '', remaining: null, sellingPrice: null },
    ]);
    expect(result.completeItemTypes).toBe(15);
    expect(result.incompleteRowIds).toEqual([16]);
    expect(result.remainingByUnit).toEqual({ pcs: 221, porsi: 97 });
    expect(result.totalRetailValueOfRemainingStock).toBe(524000);
  });

  it('ignores truly empty rows and counts a zero remainder as valid', () => {
    const result = calculateStockCheckPreview([
      { id: 1, name: '', remaining: null, sellingPrice: null },
      { id: 2, name: 'Barang habis', unit: 'pcs', remaining: 0, sellingPrice: 1500 },
    ]);
    expect(result.enteredRowIds).toEqual([2]);
    expect(result.completeItemTypes).toBe(1);
    expect(result.remainingByUnit).toEqual({ pcs: 0 });
    expect(result.totalRetailValueOfRemainingStock).toBe(0);
  });

  it('separates a display value at selling price from cost and profit', () => {
    expect(calculateStockCheckLineValue(34, 7000)).toBe(238000);
  });

  it('rejects negative, fractional, or unsafe amounts', () => {
    expect(() => calculateStockCheckLineValue(-1, 1000)).toThrow(RangeError);
    expect(() => calculateStockCheckLineValue(2.5, 1000)).toThrow(RangeError);
    expect(() => calculateStockCheckLineValue(Number.MAX_SAFE_INTEGER, 1000)).toThrow(RangeError);
  });

  it('strictly isolates remainingByUnit per unit type without mixing pcs and porsi', () => {
    const preview = calculateStockCheckPreview([
      { id: 1, name: 'Mie Instan', unit: 'pcs', remaining: 10, sellingPrice: 3500 },
      { id: 2, name: 'Seblak Pedas', unit: 'porsi', remaining: 5, sellingPrice: 12000 },
      { id: 3, name: 'Biskuit', unit: 'pcs', remaining: 20, sellingPrice: 2000 },
      { id: 4, name: 'Kopi Seduh', unit: 'porsi', remaining: 15, sellingPrice: 5000 }
    ]);

    expect(preview.remainingByUnit).toEqual({
      pcs: 30,
      porsi: 20
    });
    // Ensure no combined physical total property exists
    expect((preview as Record<string, unknown>).totalPhysicalQuantity).toBeUndefined();
    expect(preview.remainingByUnit.pcs).toBe(30);
    expect(preview.remainingByUnit.porsi).toBe(20);
    expect(preview.totalRetailValueOfRemainingStock).toBe(10 * 3500 + 5 * 12000 + 20 * 2000 + 15 * 5000);
  });

  it('rejects oversized quantities exceeding safe integer in calculateStockCheckPreview', () => {
    expect(() => calculateStockCheckPreview([
      { id: 1, name: 'Barang Raksasa', unit: 'pcs', remaining: Number.MAX_SAFE_INTEGER, sellingPrice: 2 }
    ])).toThrow(RangeError);
  });
});
