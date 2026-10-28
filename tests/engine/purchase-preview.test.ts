import { describe, expect, it } from "vitest";
import { calculatePurchasePreview } from "@/engine/v1/purchase-preview";

describe("purchase preview", () => {
  it("menghitung jumlah pcs dan modal dari 3 dus", () => {
    expect(calculatePurchasePreview({ packs: 3, unitsPerPack: 24, costPerPack: 96000, sellingPricePerUnit: 7000 })).toEqual({
      totalUnits: 72,
      totalCost: 288000,
      unitCostRounded: 4000,
      sellingPricePerUnit: 7000,
      unitPriceDifference: 3000
    });
  });

  it("menolak pecahan satuan dan angka yang tidak aman", () => {
    expect(calculatePurchasePreview({ packs: 1.5, unitsPerPack: 24, costPerPack: 96000, sellingPricePerUnit: 7000 })).toBeNull();
    expect(calculatePurchasePreview({ packs: Number.MAX_SAFE_INTEGER, unitsPerPack: 24, costPerPack: 96000, sellingPricePerUnit: 7000 })).toBeNull();
  });
});
