import { describe, expect, it } from "vitest";
import { calculate } from "@/engine/v1/calculate";
import type { AppEvent, Product } from "@/domain/event";

const mie: Product = { id: "mie", name: "Mie Suksess", sellingPrice: 7000, active: true };
const asOf = "2026-10-22T12:00:00+07:00";

function purchaseAndCount(sourceMoney: "STORE" | "PERSONAL"): AppEvent[] {
  return [
    { id: "buy-1", seq: 1, occurredAt: "2026-10-19T08:00:00+07:00", type: "purchase", productId: "mie", packs: 3, unitsPerPack: 24, totalCost: 288000, sourceMoney },
    { id: "check-1", seq: 2, occurredAt: "2026-10-22T10:00:00+07:00", type: "stock_check", productId: "mie", observedUnits: 25 }
  ];
}

describe("TOKO SAKALA engine — golden examples", () => {
  it("menghitung 3 dus × 24 pcs, sisa 25", () => {
    const result = calculate({ products: [mie], events: purchaseAndCount("STORE"), asOf });
    const product = result.products[0];
    expect(product.unitsSold).toBe(47);
    expect(product.availableUnits).toBe(25);
    expect(product.knownInventoryValue).toBe(100000);
    expect(product.costOfSoldKnown).toBe(188000);
    expect(product.salesRevenue).toEqual({ min: 329000, max: 329000 });
    expect(result.totals.profit).toEqual({ min: 141000, max: 141000 });
    expect(result.totals.storeCashAfterDeposits).toEqual({ min: 41000, max: 41000 });
    expect(result.totals.certainty).toBe("PASTI");
  });

  it("memisahkan laba dari arus uang saat belanja memakai uang pribadi", () => {
    const result = calculate({ products: [mie], events: purchaseAndCount("PERSONAL"), asOf });
    expect(result.totals.profit).toEqual({ min: 141000, max: 141000 });
    expect(result.totals.storeCashAfterDeposits).toEqual({ min: 329000, max: 329000 });
  });

  it("menggunakan rata-rata modal bergerak untuk restock", () => {
    const products: Product[] = [{ ...mie, sellingPrice: 6000 }];
    const events: AppEvent[] = [
      { id: "p1", seq: 1, occurredAt: "2026-10-19T08:00:00+07:00", type: "purchase", productId: "mie", packs: 1, unitsPerPack: 20, totalCost: 80000, sourceMoney: "STORE" },
      { id: "p2", seq: 2, occurredAt: "2026-10-21T08:00:00+07:00", type: "purchase", productId: "mie", packs: 1, unitsPerPack: 20, totalCost: 84000, sourceMoney: "STORE" },
      { id: "c1", seq: 3, occurredAt: "2026-10-22T10:00:00+07:00", type: "stock_check", productId: "mie", observedUnits: 5 }
    ];
    const result = calculate({ products, events, asOf });
    expect(result.products[0].unitsSold).toBe(35);
    expect(result.products[0].costOfSoldKnown).toBe(143500);
    expect(result.products[0].knownInventoryValue).toBe(20500);
    expect(result.totals.salesRevenue).toEqual({ min: 210000, max: 210000 });
    expect(result.totals.profit).toEqual({ min: 66500, max: 66500 });
  });

  it("tidak membuat penjualan negatif ketika sisa melebihi stok tersedia", () => {
    const result = calculate({
      products: [mie],
      events: [{ id: "c1", seq: 1, occurredAt: "2026-10-22T10:00:00+07:00", type: "stock_check", productId: "mie", observedUnits: 9 }],
      asOf
    });
    expect(result.totals.unitsSold).toBe(0);
    expect(result.issues.some(issue => issue.code === "STOCK_EXCESS")).toBe(true);
    expect(result.products[0].certainty).toBe("PERLU_DIPERIKSA");
  });
});

it("pernyataan eksplisit tidak ada penjualan menutup interval harga sebelumnya", () => {
  const result = calculate({
    products: [mie],
    events: [
      { id: "buy", seq: 1, occurredAt: "2026-10-19T08:00:00+07:00", type: "purchase", productId: "mie", packs: 3, unitsPerPack: 24, totalCost: 288000, sourceMoney: "STORE" },
      { id: "baseline", seq: 2, occurredAt: "2026-10-19T09:00:00+07:00", type: "stock_check", productId: "mie", observedUnits: 72 },
      { id: "price", seq: 3, occurredAt: "2026-10-21T08:00:00+07:00", type: "price_change", productId: "mie", sellingPrice: 6000 },
      { id: "no-sales", seq: 4, occurredAt: "2026-10-21T09:00:00+07:00", type: "no_sales_statement", productId: "mie", noSales: true },
      { id: "count", seq: 5, occurredAt: "2026-10-22T10:00:00+07:00", type: "stock_check", productId: "mie", observedUnits: 25 }
    ],
    asOf
  });
  expect(result.products[0].unitsSold).toBe(47);
  expect(result.totals.salesRevenue).toEqual({ min: 282000, max: 282000 });
});
