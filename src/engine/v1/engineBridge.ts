import type { AppEvent, Product } from '@/domain/event';
import type { EngineInput, EngineOutput } from '@/engine/contract';
import { calculate } from '@/engine/v1/calculate';
import type { TokoSakalaPayload, StorageProduct } from '@/storage/types';

export interface CatalogProduct {
  id: string;
  name: string;
  category: 'Makanan' | 'Minuman' | 'Rokok' | 'Lainnya';
  unit: string;
  packSize: number;
  costPerPack: number | null;
  sellingPricePerUnit: number;
  icon: string;
  active?: boolean;
}

export interface StoreFinancialSummary {
  engineOutput: EngineOutput;
  /** Nilai penjualan dari cek sisa stok */
  grossSales: { min: number; max: number };
  /** Modal barang terjual (HPP) */
  cogsKnown: number;
  /** Laba kotor (Penjualan - Modal) */
  grossProfit: { min: number; max: number } | null;
  /** Total biaya operasional toko */
  expensesTotal: number;
  /** Laba bersih operasional (Laba kotor - Biaya toko) */
  netProfit: { min: number; max: number } | null;
  /** Uang kas toko yang seharusnya siap disetor karyawan */
  expectedDeposit: number;
  /** Total setoran yang sudah diterima dari karyawan */
  totalDeposits: number;
  /** Selisih setoran terakhir / akumulasi */
  depositDiscrepancy: number;
  /** Status kepastian angka keuangan */
  certainty: 'PASTI' | 'PERLU_DIPERIKSA' | 'BELUM_DIKETAHUI';
  /** Total item barang fisik yang tersedia di toko menurut catatan */
  totalAvailableUnits: number;
  /** Nilai aset barang fisik di toko menurut modal yang diketahui */
  knownInventoryValue: number;
  /** Map sisa stok per produk menurut catatan */
  stockByProduct: Map<string, { availableUnits: number; lastObservedUnits: number | null; unitsSold: number }>;
}

/**
 * Mengubah data dokumen persistensi TOKO SAKALA (IndexedDB/Supabase)
 * menjadi urutan kejadian domain (AppEvent[]) yang valid dan memanggil mesin hitung calculate().
 */
export function buildEngineInputFromPayload(
  payload: TokoSakalaPayload,
  catalog: CatalogProduct[],
  asOfTime?: string
): EngineInput {
  const asOf = asOfTime || new Date().toISOString();

  // 1. Daftar produk
  const products: Product[] = catalog.map((p) => ({
    id: p.id,
    name: p.name,
    sellingPrice: p.sellingPricePerUnit,
    active: p.active ?? true,
  }));

  const events: AppEvent[] = [];
  const productHasBaseline = new Set<string>();

  // 2. Kumpulkan mutasi pembelian belanja (purchase)
  (payload.purchaseRecords || []).forEach((purch) => {
    events.push({
      id: purch.id,
      seq: 0,
      occurredAt: purch.occurredAt,
      type: 'purchase',
      productId: purch.productId,
      packs: Math.max(1, purch.packs),
      unitsPerPack: Math.max(1, purch.unitsPerPack),
      totalCost: purch.totalCost,
      sourceMoney: purch.sourceMoney || 'STORE',
    });
  });

  // 3. Kumpulkan mutasi sisa stok & susut (stockMovements)
  // Urutkan per produk untuk membedakan opening_stock pertama vs cek sisa lanjutan
  const sortedMovements = [...(payload.stockMovements || [])].sort(
    (a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt)
  );

  for (const mov of sortedMovements) {
    if (mov.type === 'CHECK_ADJUSTMENT') {
      const prod = catalog.find((c) => c.id === mov.productId);
      const hasPurchasesBefore = (payload.purchaseRecords || []).some(
        (pr) => pr.productId === mov.productId && Date.parse(pr.occurredAt) <= Date.parse(mov.occurredAt)
      );

      // Jika belum ada pembelian dan belum ada baseline, kejadian pertama ini adalah stok awal (opening_stock)
      if (!productHasBaseline.has(mov.productId) && !hasPurchasesBefore) {
        const unitCost =
          prod && prod.costPerPack !== null && prod.packSize > 0
            ? Math.floor(prod.costPerPack / prod.packSize)
            : undefined;

        events.push({
          id: mov.id,
          seq: 0,
          occurredAt: mov.occurredAt,
          type: 'opening_stock',
          productId: mov.productId,
          units: mov.quantity,
          unitCost,
        });
        productHasBaseline.add(mov.productId);
      } else {
        // Cek sisa berkala berikutnya
        events.push({
          id: mov.id,
          seq: 0,
          occurredAt: mov.occurredAt,
          type: 'stock_check',
          productId: mov.productId,
          observedUnits: mov.quantity,
        });
        productHasBaseline.add(mov.productId);
      }
    } else if (mov.type === 'LOSS_DAMAGE') {
      events.push({
        id: mov.id,
        seq: 0,
        occurredAt: mov.occurredAt,
        type: 'loss',
        productId: mov.productId,
        reason: 'DAMAGE',
        units: Math.max(1, mov.quantity),
      });
    } else if (mov.type === 'LOSS_UNKNOWN') {
      events.push({
        id: mov.id,
        seq: 0,
        occurredAt: mov.occurredAt,
        type: 'loss',
        productId: mov.productId,
        reason: 'UNKNOWN',
        units: Math.max(1, mov.quantity),
      });
    }
  }

  // 4. Kumpulkan pengeluaran operasional toko (expense)
  (payload.expenses || []).forEach((exp) => {
    events.push({
      id: exp.id,
      seq: 0,
      occurredAt: exp.occurredAt,
      type: 'expense',
      description: exp.description,
      amount: exp.amount,
      sourceMoney: exp.sourceMoney || 'STORE',
    });
  });

  // 5. Kumpulkan setoran kas karyawan (deposit)
  (payload.deposits || []).forEach((dep) => {
    events.push({
      id: dep.id,
      seq: 0,
      occurredAt: dep.occurredAt,
      type: 'deposit',
      amount: dep.receivedAmount,
    });
  });

  // Urutkan seluruh kejadian secara kronologis dan berikan seq sekuensial
  events.sort((a, b) => {
    const diff = Date.parse(a.occurredAt) - Date.parse(b.occurredAt);
    if (diff !== 0) return diff;
    // Prioritaskan opening_stock -> purchase -> stock_check -> expense -> deposit
    const priority = (type: string) => {
      switch (type) {
        case 'opening_stock': return 1;
        case 'purchase': return 2;
        case 'loss': return 3;
        case 'stock_check': return 4;
        case 'expense': return 5;
        case 'deposit': return 6;
        default: return 9;
      }
    };
    return priority(a.type) - priority(b.type);
  });

  events.forEach((ev, idx) => {
    ev.seq = idx + 1;
  });

  return {
    products,
    events,
    asOf,
  };
}

/**
 * Menghitung ringkasan kondisi keuangan toko sesungguhnya dari event domain
 */
export function runStoreFinancialEngine(
  payload: TokoSakalaPayload,
  catalog: CatalogProduct[],
  asOfTime?: string
): StoreFinancialSummary {
  const engineInput = buildEngineInputFromPayload(payload, catalog, asOfTime);
  const engineOutput = calculate(engineInput);

  const grossSales = engineOutput.totals.salesRevenue;
  const cogsKnown = engineOutput.totals.costOfGoodsSoldKnown;
  const expensesTotal = engineOutput.totals.expenses;

  // Laba Kotor = Penjualan - Modal Terjual
  const grossProfit =
    engineOutput.totals.profit !== null
      ? {
          min: grossSales.min - cogsKnown,
          max: grossSales.max - cogsKnown,
        }
      : null;

  // Laba Bersih = Laba Kotor - Biaya Toko
  const netProfit =
    grossProfit !== null
      ? {
          min: grossProfit.min - expensesTotal,
          max: grossProfit.max - expensesTotal,
        }
      : null;

  // Uang yang seharusnya diserahkan karyawan:
  // Dihitung dari kas toko dari penjualan dikurangi biaya toko & belanja yang dibayar kas toko,
  // sebelum setoran diserahkan.
  let cashFromSales = grossSales.min;
  let cashOutStore = 0;
  (payload.expenses || []).forEach((e) => {
    if (e.sourceMoney === 'STORE') cashOutStore += e.amount;
  });
  (payload.purchaseRecords || []).forEach((p) => {
    if (p.sourceMoney === 'STORE') cashOutStore += p.totalCost;
  });

  // Uang kas toko yang siap setor (tidak boleh negatif)
  const expectedDeposit = Math.max(0, cashFromSales - cashOutStore);

  const totalDeposits = engineOutput.totals.totalDeposits;
  const depositDiscrepancy = totalDeposits - expectedDeposit;

  let totalAvailableUnits = 0;
  let knownInventoryValue = 0;
  const stockByProduct = new Map<
    string,
    { availableUnits: number; lastObservedUnits: number | null; unitsSold: number }
  >();

  engineOutput.products.forEach((p) => {
    totalAvailableUnits += p.availableUnits;
    knownInventoryValue += p.knownInventoryValue;
    stockByProduct.set(p.productId, {
      availableUnits: p.availableUnits,
      lastObservedUnits: p.lastObservedUnits,
      unitsSold: p.unitsSold,
    });
  });

  return {
    engineOutput,
    grossSales,
    cogsKnown,
    grossProfit,
    expensesTotal,
    netProfit,
    expectedDeposit,
    totalDeposits,
    depositDiscrepancy,
    certainty: engineOutput.totals.certainty,
    totalAvailableUnits,
    knownInventoryValue,
    stockByProduct,
  };
}
