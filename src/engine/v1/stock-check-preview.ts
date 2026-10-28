/** Pure preview for the paper-inspired bulk stock-count sheet.
 * This module never saves data. It only calculates values shown before review.
 */
export type StockCheckPreviewRow = {
  id: number;
  name: string;
  category?: string;
  unit?: string;
  remaining: number | null;
  sellingPrice: number | null;
};

export type StockCheckPreview = {
  enteredRowIds: number[];
  completeRowIds: number[];
  incompleteRowIds: number[];
  completeItemTypes: number;
  /** Quantity grouped by unit. Never sum pcs, kg, porsi, liters, etc. together. */
  remainingByUnit: Record<string, number>;
  totalRetailValueOfRemainingStock: number;
};

function assertNonNegativeSafeInteger(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${field} harus berupa bilangan bulat aman dan tidak boleh negatif.`);
  }
}

/** This is a display value at selling price, NOT remaining cost or profit. */
export function calculateStockCheckLineValue(remaining: number, sellingPrice: number): number {
  assertNonNegativeSafeInteger(remaining, 'Jumlah sisa');
  assertNonNegativeSafeInteger(sellingPrice, 'Harga jual');
  const result = remaining * sellingPrice;
  if (!Number.isSafeInteger(result)) throw new RangeError('Nilai baris terlalu besar untuk dihitung dengan aman.');
  return result;
}

export function calculateStockCheckPreview(rows: StockCheckPreviewRow[]): StockCheckPreview {
  const enteredRows = rows.filter((row) =>
    row.name.trim().length > 0 || row.category?.trim().length || row.remaining !== null || row.sellingPrice !== null
  );
  const completeRows = enteredRows.filter((row) =>
    row.name.trim().length > 0 && row.remaining !== null && row.sellingPrice !== null
  );
  const incompleteRows = enteredRows.filter((row) =>
    !(row.name.trim().length > 0 && row.remaining !== null && row.sellingPrice !== null)
  );

  const remainingByUnit: Record<string, number> = {};
  let totalRetailValueOfRemainingStock = 0;
  for (const row of completeRows) {
    const remaining = row.remaining as number;
    const sellingPrice = row.sellingPrice as number;
    assertNonNegativeSafeInteger(remaining, 'Jumlah sisa');
    assertNonNegativeSafeInteger(sellingPrice, 'Harga jual');
    const unit = row.unit?.trim() || "satuan tidak ditentukan";
    remainingByUnit[unit] = (remainingByUnit[unit] ?? 0) + remaining;
    if (!Number.isSafeInteger(remainingByUnit[unit])) throw new RangeError("Jumlah per satuan terlalu besar untuk dihitung dengan aman.");
    totalRetailValueOfRemainingStock += calculateStockCheckLineValue(remaining, sellingPrice);
  }
  if (!Number.isSafeInteger(totalRetailValueOfRemainingStock)) {
    throw new RangeError('Total nilai terlalu besar untuk dihitung dengan aman.');
  }

  return {
    enteredRowIds: enteredRows.map((row) => row.id),
    completeRowIds: completeRows.map((row) => row.id),
    incompleteRowIds: incompleteRows.map((row) => row.id),
    completeItemTypes: completeRows.length,
    remainingByUnit,
    totalRetailValueOfRemainingStock,
  };
}
