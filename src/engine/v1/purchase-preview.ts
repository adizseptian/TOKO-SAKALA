export interface PurchasePreviewInput {
  packs: number;
  unitsPerPack: number;
  costPerPack: number;
  sellingPricePerUnit: number;
}

export interface PurchasePreviewOutput {
  totalUnits: number;
  totalCost: number;
  unitCostRounded: number;
  sellingPricePerUnit: number;
  unitPriceDifference: number;
  potentialSalesRevenue: number;
}

/** Shared pure preview function; UI must not reimplement purchase arithmetic. */
export function calculatePurchasePreview(input: PurchasePreviewInput): PurchasePreviewOutput | null {
  const values = [input.packs, input.unitsPerPack, input.costPerPack, input.sellingPricePerUnit];
  if (!values.every(Number.isSafeInteger)) return null;
  if (input.packs < 1 || input.unitsPerPack < 1 || input.costPerPack < 0 || input.sellingPricePerUnit < 0) return null;

  const totalUnits = input.packs * input.unitsPerPack;
  const totalCost = input.packs * input.costPerPack;
  if (!Number.isSafeInteger(totalUnits) || !Number.isSafeInteger(totalCost) || totalUnits < 1) return null;

  const unitCostRounded = Math.floor(totalCost / totalUnits + 0.5);
  const potentialSalesRevenue = totalUnits * input.sellingPricePerUnit;

  return {
    totalUnits,
    totalCost,
    unitCostRounded,
    sellingPricePerUnit: input.sellingPricePerUnit,
    unitPriceDifference: input.sellingPricePerUnit - unitCostRounded,
    potentialSalesRevenue
  };
}
