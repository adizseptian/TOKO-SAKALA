import type { AmountRange, DepositCheck, EngineInput, EngineOutput, ProductCalculation, RemittanceStatus } from "@/engine/contract";
import type { AppEvent, Product } from "@/domain/event";

interface Pool {
  knownUnits: number;
  knownValue: number;
  unknownUnits: number;
  currentPrice: number;
  intervalPrices: number[];
  lastObservedUnits: number | null;
  baselineSeen: boolean;
  unitsSold: number;
  totalUnitsInPeriod: number;
  salesRevenue: AmountRange;
  costOfSoldKnown: number;
  damageLossKnown: number;
  usedLossKnown: number;
  unknownLossKnown: number;
  uncertainCostSold: boolean;
  notes: string[];
  certainty: ProductCalculation["certainty"];
}

const exact = (value: number): AmountRange => ({ min: value, max: value });
const addRange = (a: AmountRange, b: AmountRange): AmountRange => ({ min: a.min + b.min, max: a.max + b.max });
const subRangeFromNumber = (a: AmountRange, value: number): AmountRange => ({ min: a.min - value, max: a.max - value });
const roundHalfUp = (numerator: number, denominator: number): number => {
  if (denominator <= 0) return 0;
  return Math.floor(numerator / denominator + 0.5);
};

function orderedEvents(events: AppEvent[]): AppEvent[] {
  return [...events].sort((a, b) => {
    const timeA = Date.parse(a.occurredAt);
    const timeB = Date.parse(b.occurredAt);
    if (timeA < timeB) return -1;
    if (timeA > timeB) return 1;
    return a.seq - b.seq;
  });
}

function ensureSafeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) throw new Error(`ENGINE_UNSAFE_INTEGER:${label}`);
}

/** Remove units proportionally from known-modal and unknown-modal pools. All arithmetic is integer rupiah/pcs. */
function removeUnits(pool: Pool, requested: number): { removed: number; knownValueRemoved: number; unknownUnitsRemoved: number } {
  const available = pool.knownUnits + pool.unknownUnits;
  const removed = Math.min(Math.max(0, requested), available);
  if (removed === 0 || available === 0) return { removed: 0, knownValueRemoved: 0, unknownUnitsRemoved: 0 };

  let knownOut = Math.min(pool.knownUnits, roundHalfUp(removed * pool.knownUnits, available));
  let unknownOut = removed - knownOut;
  if (unknownOut > pool.unknownUnits) {
    unknownOut = pool.unknownUnits;
    knownOut = removed - unknownOut;
  }
  if (knownOut > pool.knownUnits) {
    knownOut = pool.knownUnits;
    unknownOut = removed - knownOut;
  }

  const valueOut = knownOut === pool.knownUnits
    ? pool.knownValue
    : knownOut === 0 || pool.knownUnits === 0
      ? 0
      : roundHalfUp(pool.knownValue * knownOut, pool.knownUnits);

  pool.knownUnits -= knownOut;
  pool.unknownUnits -= unknownOut;
  pool.knownValue -= valueOut;

  ensureSafeInteger(pool.knownUnits, "knownUnits");
  ensureSafeInteger(pool.unknownUnits, "unknownUnits");
  ensureSafeInteger(pool.knownValue, "knownValue");
  return { removed, knownValueRemoved: valueOut, unknownUnitsRemoved: unknownOut };
}

function rangeFromIntervalPrices(sold: number, prices: number[]): AmountRange {
  const set = prices.length ? prices : [0];
  const min = Math.min(...set);
  const max = Math.max(...set);
  return { min: sold * min, max: sold * max };
}

function setReview(pool: Pool, note: string, defaultCertainty: ProductCalculation["certainty"] = "PERLU_DIPERIKSA"): void {
  if (!pool.notes.includes(note)) pool.notes.push(note);
  if (pool.certainty === "PASTI") pool.certainty = defaultCertainty;
  else if (defaultCertainty === "BELUM_DIKETAHUI") pool.certainty = "BELUM_DIKETAHUI";
}

/**
 * Pure calculation engine v1. Scope is deliberately the tested starter slice, not the full financial engine.
 * `asOf` is required so the caller passes time explicitly; this function does not call Date.now().
 */
export function calculate(input: EngineInput): EngineOutput {
  if (!input.asOf || !Number.isFinite(Date.parse(input.asOf))) throw new Error("ENGINE_INVALID_AS_OF");
  const productsById = new Map<string, Product>();
  const states = new Map<string, Pool>();
  for (const product of input.products) {
    productsById.set(product.id, product);
    states.set(product.id, {
      knownUnits: 0, knownValue: 0, unknownUnits: 0,
      currentPrice: product.sellingPrice, intervalPrices: [product.sellingPrice],
      lastObservedUnits: null, baselineSeen: false, unitsSold: 0, totalUnitsInPeriod: 0, salesRevenue: exact(0),
      costOfSoldKnown: 0, damageLossKnown: 0, usedLossKnown: 0, unknownLossKnown: 0,
      uncertainCostSold: false, notes: [], certainty: "PASTI"
    });
  }

  let otherIncome = 0;
  let expenses = 0;
  let damageLossKnown = 0;
  let usedLossKnown = 0;
  let unknownLossKnown = 0;
  let salesRevenue: AmountRange = exact(0);
  let storeCash: AmountRange = exact(0);
  let totalDeposits = 0;
  const depositChecks: DepositCheck[] = [];
  const issues: EngineOutput["issues"] = [];
  let globalCertainty: EngineOutput["totals"]["certainty"] = "PASTI";

  const markGlobalReview = () => { if (globalCertainty === "PASTI") globalCertainty = "PERLU_DIPERIKSA"; };

  // De-duplicate events by event.id or idempotencyKey to ensure strict idempotency (Acceptance 12)
  const seenIds = new Set<string>();
  const seenIdempotencyKeys = new Set<string>();
  const sorted = orderedEvents(input.events);
  const events: AppEvent[] = [];
  for (const ev of sorted) {
    if (seenIds.has(ev.id)) continue;
    seenIds.add(ev.id);
    if ((ev as any).idempotencyKey) {
      if (seenIdempotencyKeys.has((ev as any).idempotencyKey)) continue;
      seenIdempotencyKeys.add((ev as any).idempotencyKey);
    }
    events.push(ev);
  }

  for (const event of events) {
    if (Date.parse(event.occurredAt) > Date.parse(input.asOf)) continue;

    if (event.type === "purchase") {
      const pool = states.get(event.productId);
      if (!pool) {
        issues.push({ code: "UNKNOWN_PRODUCT", message: "Belanja merujuk barang yang belum terdaftar.", eventId: event.id, productId: event.productId });
        markGlobalReview();
        continue;
      }
      const purchasedUnits = event.packs * event.unitsPerPack;
      ensureSafeInteger(purchasedUnits, "purchaseUnits");
      pool.knownUnits += purchasedUnits;
      pool.knownValue += event.totalCost;
      pool.totalUnitsInPeriod += purchasedUnits;
      ensureSafeInteger(pool.knownUnits, "knownUnitsAfterPurchase");
      ensureSafeInteger(pool.knownValue, "knownValueAfterPurchase");
      if (event.sourceMoney === "STORE") storeCash = subRangeFromNumber(storeCash, event.totalCost);
      continue;
    }

    if (event.type === "opening_stock") {
      const pool = states.get(event.productId);
      if (!pool) {
        issues.push({ code: "UNKNOWN_PRODUCT", message: "Cek sisa merujuk barang yang belum terdaftar.", eventId: event.id, productId: event.productId });
        markGlobalReview();
        continue;
      }
      if (pool.baselineSeen || pool.knownUnits + pool.unknownUnits > 0) {
        setReview(pool, "Stok awal muncul setelah ada pergerakan stok; perlu diperiksa agar tidak menghitung ganda.");
        issues.push({ code: "OPENING_STOCK_ORDER", message: "Stok awal tercatat setelah pergerakan stok.", eventId: event.id, productId: event.productId });
        markGlobalReview();
        continue;
      }
      if (event.unitCost === undefined) pool.unknownUnits += event.units;
      else { pool.knownUnits += event.units; pool.knownValue += event.units * event.unitCost; }
      pool.totalUnitsInPeriod += event.units;
      pool.lastObservedUnits = event.units;
      pool.baselineSeen = true;
      continue;
    }

    if (event.type === "no_sales_statement") {
      const pool = states.get(event.productId);
      if (!pool) {
        issues.push({ code: "UNKNOWN_PRODUCT", message: "Pernyataan tidak ada penjualan merujuk barang yang belum terdaftar.", eventId: event.id, productId: event.productId });
        markGlobalReview();
        continue;
      }
      if (!pool.baselineSeen) {
        setReview(pool, "Pernyataan tidak ada penjualan belum memiliki acuan stok.");
        issues.push({ code: "NO_SALES_WITHOUT_BASELINE", message: "Cek sisa perlu menjadi acuan sebelum pernyataan tidak ada penjualan.", eventId: event.id, productId: event.productId });
        markGlobalReview();
        continue;
      }
      // The user's explicit statement closes the prior price interval without inventing a stock count.
      pool.intervalPrices = [pool.currentPrice];
      continue;
    }

    if (event.type === "price_change") {
      const pool = states.get(event.productId);
      if (!pool) { markGlobalReview(); continue; }
      pool.currentPrice = event.sellingPrice;
      pool.intervalPrices.push(event.sellingPrice);
      continue;
    }

    if (event.type === "stock_check") {
      const pool = states.get(event.productId);
      if (!pool) {
        issues.push({ code: "UNKNOWN_PRODUCT", message: "Cek sisa merujuk barang yang belum terdaftar.", eventId: event.id, productId: event.productId });
        markGlobalReview();
        continue;
      }
      const available = pool.knownUnits + pool.unknownUnits;
      if (event.observedUnits > available) {
        setReview(pool, `Sisa fisik (${event.observedUnits}) lebih banyak daripada stok yang dapat dijelaskan (${available}). Tidak dibuat penjualan negatif.`);
        issues.push({ code: "STOCK_EXCESS", message: "Sisa fisik lebih banyak daripada stok catatan.", productId: event.productId, eventId: event.id });
        markGlobalReview();
        continue;
      }
      const sold = available - event.observedUnits;
      const revenue = rangeFromIntervalPrices(sold, pool.intervalPrices);
      const removed = removeUnits(pool, sold);
      pool.unitsSold += sold;
      pool.salesRevenue = addRange(pool.salesRevenue, revenue);
      pool.costOfSoldKnown += removed.knownValueRemoved;
      salesRevenue = addRange(salesRevenue, revenue);
      storeCash = addRange(storeCash, revenue);
      if (removed.unknownUnitsRemoved > 0) {
        pool.uncertainCostSold = true;
        setReview(pool, `${removed.unknownUnitsRemoved} pcs terjual berasal dari stok yang modalnya belum diketahui.`, "BELUM_DIKETAHUI");
        issues.push({ code: "UNKNOWN_MODAL_SOLD", message: "Sebagian modal barang terjual belum diketahui.", productId: event.productId, eventId: event.id });
        globalCertainty = "BELUM_DIKETAHUI";
      }
      if (revenue.min !== revenue.max) {
        setReview(pool, "Harga jual berubah sebelum cek sisa; penjualan ditampilkan sebagai kisaran.");
        issues.push({ code: "MIXED_SELLING_PRICE", message: "Harga jual berubah di dalam interval cek sisa; penjualan belum pasti.", productId: event.productId, eventId: event.id });
        markGlobalReview();
      }
      pool.lastObservedUnits = event.observedUnits;
      pool.baselineSeen = true;
      pool.intervalPrices = [pool.currentPrice];
      continue;
    }

    if (event.type === "loss") {
      const pool = states.get(event.productId);
      if (!pool) { markGlobalReview(); continue; }
      const available = pool.knownUnits + pool.unknownUnits;
      if (event.units > available) {
        setReview(pool, "Jumlah barang keluar melebihi stok yang dapat dijelaskan.");
        issues.push({ code: "LOSS_EXCEEDS_STOCK", message: "Jumlah barang keluar melebihi stok catatan.", productId: event.productId, eventId: event.id });
        markGlobalReview();
        continue;
      }
      const removed = removeUnits(pool, event.units);
      if (event.reason === "DAMAGE") { pool.damageLossKnown += removed.knownValueRemoved; damageLossKnown += removed.knownValueRemoved; }
      if (event.reason === "USED") { pool.usedLossKnown += removed.knownValueRemoved; usedLossKnown += removed.knownValueRemoved; }
      if (event.reason === "UNKNOWN") { pool.unknownLossKnown += removed.knownValueRemoved; unknownLossKnown += removed.knownValueRemoved; }
      if (removed.unknownUnitsRemoved > 0) {
        pool.uncertainCostSold = true;
        setReview(pool, `Modal ${removed.unknownUnitsRemoved} pcs barang keluar belum diketahui.`, "BELUM_DIKETAHUI");
        globalCertainty = "BELUM_DIKETAHUI";
      }
      continue;
    }

    if (event.type === "expense") {
      expenses += event.amount;
      if (event.sourceMoney === "STORE") storeCash = subRangeFromNumber(storeCash, event.amount);
      continue;
    }
    if (event.type === "other_income") {
      otherIncome += event.amount;
      storeCash = addRange(storeCash, exact(event.amount));
      continue;
    }
    if (event.type === "cash_adjustment") {
      storeCash = addRange(storeCash, exact(event.amount));
      if (event.amount !== 0) markGlobalReview();
      continue;
    }
    if (event.type === "deposit") {
      const expected = { ...storeCash };
      const difference = { min: event.amount - expected.max, max: event.amount - expected.min };
      let certainty: DepositCheck["certainty"] = "PASTI";
      if (expected.min !== expected.max) certainty = "PERLU_DIPERIKSA";

      let status: RemittanceStatus;
      let statusLabel: string;
      let explanation: string;

      if (difference.min === 0 && difference.max === 0 && certainty === "PASTI") {
        status = "COCOK";
        statusLabel = "Cocok";
        explanation = "Jumlah yang diterima owner sama dengan jumlah yang seharusnya diserahkan dan semua komponen yang diperlukan pasti.";
      } else if (certainty !== "PASTI") {
        status = "PERLU_DIPERIKSA";
        statusLabel = "Perlu diperiksa";
        explanation = "Terdapat komponen perhitungan yang belum pasti. Periksa kembali catatan sebelum serah terima difinalisasi.";
      } else if (difference.max < 0) {
        status = "BELUM_COCOK";
        statusLabel = "Belum cocok";
        const diffVal = Math.abs(difference.max);
        explanation = `Setoran kurang Rp ${diffVal.toLocaleString('id-ID')} dari perhitungan saat ini. Periksa pengeluaran, belanja yang dibayar dari uang toko, sisa stok, dan saldo sebelumnya.`;
      } else {
        status = "PERLU_DIPERIKSA";
        statusLabel = "Perlu diperiksa";
        const diffVal = difference.min;
        explanation = `Owner menerima lebih Rp ${diffVal.toLocaleString('id-ID')} dari perkiraan saat ini. Periksa kemungkinan penjualan belum dicatat, pendapatan lain belum dicatat, salah hitung sisa, atau saldo sebelumnya.`;
      }

      depositChecks.push({
        eventId: event.id,
        actualAmount: event.amount,
        expectedBeforeDeposit: { ...expected },
        difference,
        certainty,
        status,
        statusLabel,
        explanation,
        employeeName: (event as any).employeeName,
        notes: (event as any).notes,
        periodId: (event as any).periodId,
        occurredAt: event.occurredAt
      });
      totalDeposits += event.amount;
      storeCash = subRangeFromNumber(storeCash, event.amount);
      continue;
    }
  }

  const productResults: ProductCalculation[] = [...states.entries()].map(([productId, pool]) => {
    const product = productsById.get(productId)!;
    const potentialSalesRevenue = rangeFromIntervalPrices(pool.totalUnitsInPeriod, pool.intervalPrices);
    const currentRemainingUnits = pool.lastObservedUnits !== null ? pool.lastObservedUnits : (pool.knownUnits + pool.unknownUnits);
    const remainingAtSellingPrice = rangeFromIntervalPrices(currentRemainingUnits, [pool.currentPrice]);
    const grossProfit: AmountRange = {
      min: pool.salesRevenue.min - pool.costOfSoldKnown,
      max: pool.salesRevenue.max - pool.costOfSoldKnown
    };

    return {
      productId, name: product.name,
      availableUnits: pool.knownUnits + pool.unknownUnits,
      knownCostUnits: pool.knownUnits,
      unknownCostUnits: pool.unknownUnits,
      knownInventoryValue: pool.knownValue,
      lastObservedUnits: pool.lastObservedUnits,
      unitsSold: pool.unitsSold,
      salesRevenue: pool.salesRevenue,
      costOfSoldKnown: pool.costOfSoldKnown,
      damageLossKnown: pool.damageLossKnown,
      usedLossKnown: pool.usedLossKnown,
      unknownLossKnown: pool.unknownLossKnown,
      certainty: pool.certainty,
      notes: pool.notes,
      potentialSalesRevenue,
      remainingAtSellingPrice,
      grossProfit
    };
  });

  const allProductsChecked = productResults.every(p => p.lastObservedUnits !== null);
  const uncertainCostSold = [...states.values()].some(p => p.uncertainCostSold);
  const hasPriceRange = salesRevenue.min !== salesRevenue.max;
  const costOfGoodsSoldKnown = productResults.reduce((sum, p) => sum + p.costOfSoldKnown, 0);
  const knownProfitLower = salesRevenue.min + otherIncome - costOfGoodsSoldKnown - damageLossKnown - usedLossKnown - unknownLossKnown - expenses;
  const knownProfitUpper = salesRevenue.max + otherIncome - costOfGoodsSoldKnown - damageLossKnown - usedLossKnown - unknownLossKnown - expenses;
  const profit = uncertainCostSold ? null : { min: knownProfitLower, max: knownProfitUpper };

  const totalPotentialSalesRevenue: AmountRange = productResults.reduce(
    (sum, p) => addRange(sum, p.potentialSalesRevenue),
    exact(0)
  );
  const totalRemainingInventoryAtSellingPrice: AmountRange = productResults.reduce(
    (sum, p) => addRange(sum, p.remainingAtSellingPrice),
    exact(0)
  );
  const totalGrossProfit: AmountRange = {
    min: salesRevenue.min - costOfGoodsSoldKnown,
    max: salesRevenue.max - costOfGoodsSoldKnown
  };

  if (uncertainCostSold) globalCertainty = "BELUM_DIKETAHUI";
  else if (hasPriceRange || !allProductsChecked || productResults.some(p => p.certainty !== "PASTI") || issues.length > 0) {
    if (globalCertainty === "PASTI") globalCertainty = "PERLU_DIPERIKSA";
  }
  if (!allProductsChecked) issues.push({ code: "PRODUCT_NOT_CHECKED", message: "Ada barang yang belum memiliki cek sisa. Hasil keseluruhan belum final." });

  for (const range of [salesRevenue, storeCash, totalPotentialSalesRevenue, totalRemainingInventoryAtSellingPrice, totalGrossProfit]) {
    ensureSafeInteger(range.min, "range.min");
    ensureSafeInteger(range.max, "range.max");
  }

  const latestCheck = depositChecks.length > 0 ? depositChecks[depositChecks.length - 1] : null;
  const remittanceStatus = latestCheck
    ? {
        status: latestCheck.status,
        statusLabel: latestCheck.statusLabel,
        explanation: latestCheck.explanation,
        difference: latestCheck.difference
      }
    : {
        status: "MENUNGGU_SETORAN" as RemittanceStatus,
        statusLabel: "Menunggu setoran",
        explanation: "Setoran aktual dari karyawan ke owner belum dicatat.",
        difference: { min: -storeCash.max, max: -storeCash.min }
      };

  return {
    products: productResults,
    totals: {
      unitsSold: productResults.reduce((sum, p) => sum + p.unitsSold, 0),
      salesRevenue,
      costOfGoodsSoldKnown,
      otherIncome,
      expenses,
      damageLossKnown,
      usedLossKnown,
      unknownLossKnown,
      profit,
      certainty: globalCertainty,
      storeCashAfterDeposits: storeCash,
      totalDeposits,
      expectedEmployeeRemittance: storeCash,
      potentialSalesRevenue: totalPotentialSalesRevenue,
      remainingInventoryAtSellingPrice: totalRemainingInventoryAtSellingPrice,
      grossProfit: totalGrossProfit,
      netProfit: profit,
      remittanceStatus
    },
    depositChecks,
    issues
  };
}
