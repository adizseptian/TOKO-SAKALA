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
  /** Nilai penjualan dari cek sisa stok (Untung Kotor: Σ terjual × harga jual − Diskon) */
  grossSales: { min: number; max: number };
  untungKotor: { min: number; max: number };
  /** Modal barang terjual (HPP dengan modal terbaru) */
  cogsKnown: number;
  modalKembali: number;
  /** Laba setelah modal = Untung Bersih - modal barang terjual (hanya di Laporan) */
  labaSetelahModal: { min: number; max: number } | null;
  grossProfit: { min: number; max: number } | null;
  /** Total seluruh biaya operasional toko */
  expensesTotal: number;
  /** Biaya dari laci kasir (yang mengurangi setoran seharusnya) */
  expensesLaci: number;
  /** Untung Bersih = Untung Kotor − semua pengeluaran toko + pemasukan lain */
  untungBersih: { min: number; max: number } | null;
  netProfit: { min: number; max: number } | null;
  /** Setoran kas yang seharusnya diserahkan (Untung Kotor - Biaya laci) */
  expectedDeposit: number;
  /** Total setoran yang sudah diterima dari karyawan */
  totalDeposits: number;
  /** Sisa disetor (Setoran seharusnya - Setoran diterima sebelumnya) */
  remainingDeposit: number;
  /** Selisih setoran (Diterima - Seharusnya) */
  depositDiscrepancy: number;
  /** Total belanja keseluruhan */
  totalPurchases: number;
  /** Belanja yang dibayar dari uang setoran ("Untung bersih toko") */
  purchasesFromSetoran: number;
  /** Pengambilan pribadi oleh pemilik */
  ownerWithdrawalsTotal: number;
  /** Uang di tangan (Setoran diterima - Belanja dari setoran - Pengambilan pribadi) */
  cashInHand: number;
  isCashInHandCalculable: boolean;
  /** Sisa dana belanja (Untung Bersih − belanja bersumber "Untung bersih toko") */
  remainingShoppingBudget: number;
  sisaDanaBelanjaUntung: number;
  /** Status kepastian angka keuangan */
  certainty: 'PASTI' | 'PERLU_DIPERIKSA' | 'BELUM_DIKETAHUI';
  /** Satu alasan utama badge/chip peringatan */
  reviewReason: string | null;
  /** Total item barang fisik yang tersedia di toko menurut catatan */
  totalAvailableUnits: number;
  /** Nilai aset barang fisik di toko menurut modal yang diketahui */
  knownInventoryValue: number;
  /** Map sisa stok per produk menurut catatan */
  stockByProduct: Map<string, {
    availableUnits: number;
    lastObservedUnits: number | null;
    unitsSold: number;
    latestUnitCost: number | null;
    checkCount: number;
  }>;
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
    let sourceMoney: any = purch.sourceMoney;
    if (sourceMoney === 'STORE') sourceMoney = 'SETORAN';
    else if (sourceMoney === 'PERSONAL') sourceMoney = 'PRIBADI';
    else if (!sourceMoney) sourceMoney = 'SETORAN';

    events.push({
      id: purch.id,
      seq: 0,
      occurredAt: purch.occurredAt,
      type: 'purchase',
      productId: purch.productId,
      packs: Math.max(1, purch.packs),
      unitsPerPack: Math.max(1, purch.unitsPerPack),
      totalCost: purch.totalCost,
      sourceMoney,
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
    let sourceMoney: any = exp.sourceMoney;
    if (sourceMoney === 'STORE') sourceMoney = 'LACI';
    else if (sourceMoney === 'PERSONAL') sourceMoney = 'PRIBADI';
    else if (!sourceMoney) sourceMoney = 'LACI';

    events.push({
      id: exp.id,
      seq: 0,
      occurredAt: exp.occurredAt,
      type: 'expense',
      description: exp.description,
      amount: exp.amount,
      sourceMoney,
    });
  });

  // 5. Kumpulkan setoran kas karyawan (deposit)
  (payload.deposits || []).forEach((dep) => {
    events.push({
      id: dep.id,
      seq: 0,
      occurredAt: dep.occurredAt,
      type: 'deposit',
      amount: dep.receivedAmount ?? (dep as any).amount ?? 0,
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
  const untungKotor = grossSales;
  const cogsKnown = engineOutput.totals.costOfGoodsSoldKnown;
  const modalKembali = cogsKnown;
  const expensesTotal = engineOutput.totals.expenses;

  // Biaya dari laci kasir (hanya yang mengurangi setoran toko)
  let expensesLaci = 0;
  (payload.expenses || []).forEach((e) => {
    if (e.sourceMoney === 'LACI' || (e.sourceMoney as any) === 'STORE') {
      expensesLaci += e.amount;
    }
  });

  // Laba Kotor Operasional = Penjualan - Modal Terjual
  const grossProfit =
    engineOutput.totals.profit !== null
      ? {
          min: grossSales.min - cogsKnown,
          max: grossSales.max - cogsKnown,
        }
      : null;

  // Laba Bersih Operasional = Laba Kotor - Total Biaya Toko
  const netProfit =
    grossProfit !== null
      ? {
          min: grossProfit.min - expensesTotal,
          max: grossProfit.max - expensesTotal,
        }
      : null;

  // Istilah Pemilik Toko:
  // Untung Bersih = Untung Kotor − semua pengeluaran toko + pemasukan lain
  const untungBersih = {
    min: untungKotor.min - expensesTotal,
    max: untungKotor.max - expensesTotal,
  };

  // Laba setelah modal = Untung Bersih − modal barang terjual (hanya di Laporan)
  const labaSetelahModal = {
    min: untungBersih.min - cogsKnown,
    max: untungBersih.max - cogsKnown,
  };

  // Setoran seharusnya = Untung Kotor + pemasukan lain − pengeluaran yang dibayar uang laci
  const expectedDeposit = Math.max(0, untungKotor.min - expensesLaci);

  // Total setoran yang sudah diterima dari karyawan
  const totalDeposits = engineOutput.totals.totalDeposits;

  // Sisa disetor = Setoran seharusnya - Setoran diterima sebelumnya
  const remainingDeposit = Math.max(0, expectedDeposit - totalDeposits);

  // Selisih = Diterima - Seharusnya
  const depositDiscrepancy = totalDeposits - expectedDeposit;

  // Belanja
  let totalPurchases = 0;
  let purchasesFromSetoran = 0;
  (payload.purchaseRecords || []).forEach((p) => {
    totalPurchases += p.totalCost;
    if (p.sourceMoney === 'SETORAN' || (p.sourceMoney as any) === 'STORE') {
      purchasesFromSetoran += p.totalCost;
    }
  });

  // Pengambilan pribadi
  let ownerWithdrawalsTotal = 0;
  (payload.ownerWithdrawals || []).forEach((w) => {
    ownerWithdrawalsTotal += w.amount;
  });

  // Uang di tangan = setoran diterima − belanja bersumber "Untung bersih toko" − pengambilan pribadi
  const cashInHand = totalDeposits - purchasesFromSetoran - ownerWithdrawalsTotal;
  const isCashInHandCalculable = totalDeposits > 0;

  // Sisa dana belanja:
  // 1. Menurut modal: Modal kembali - Total belanja (negatif = diambil dari untung)
  const remainingShoppingBudget = modalKembali - totalPurchases;
  // 2. Menurut untung bersih toko: Untung Bersih - Belanja bersumber untung bersih toko
  const sisaDanaBelanjaUntung = untungBersih.min - purchasesFromSetoran;

  // Cari satu alasan utama bila kepastian bukan PASTI
  let reviewReason: string | null = null;
  if (engineOutput.totals.certainty !== 'PASTI') {
    if (engineOutput.issues.some((i) => i.code === 'UNKNOWN_MODAL_SOLD')) {
      reviewReason = 'Modal belum diketahui';
    } else if (engineOutput.issues.some((i) => i.code === 'PRODUCT_NOT_CHECKED')) {
      reviewReason = 'Cek sisa belum lengkap';
    } else if (engineOutput.issues.some((i) => i.code === 'MIXED_SELLING_PRICE')) {
      reviewReason = 'Harga berubah';
    } else if (engineOutput.issues.some((i) => i.code === 'STOCK_EXCESS')) {
      reviewReason = 'Sisa melebihi catatan';
    } else if (engineOutput.issues.length > 0) {
      reviewReason = engineOutput.issues[0].message;
    }
  }

  let totalAvailableUnits = 0;
  let knownInventoryValue = 0;
  const stockByProduct = new Map<
    string,
    {
      availableUnits: number;
      lastObservedUnits: number | null;
      unitsSold: number;
      latestUnitCost: number | null;
      checkCount: number;
    }
  >();

  engineOutput.products.forEach((p) => {
    totalAvailableUnits += p.availableUnits;
    knownInventoryValue += p.knownInventoryValue;
    const checkCount = (payload.stockMovements || []).filter(
      (m) => m.productId === p.productId && m.type === 'CHECK_ADJUSTMENT'
    ).length;

    stockByProduct.set(p.productId, {
      availableUnits: p.availableUnits,
      lastObservedUnits: p.lastObservedUnits,
      unitsSold: p.unitsSold,
      latestUnitCost: p.latestUnitCost ?? null,
      checkCount,
    });
  });

  return {
    engineOutput,
    grossSales,
    untungKotor,
    cogsKnown,
    modalKembali,
    labaSetelahModal,
    grossProfit,
    expensesTotal,
    expensesLaci,
    untungBersih,
    netProfit,
    expectedDeposit,
    totalDeposits,
    remainingDeposit,
    depositDiscrepancy,
    totalPurchases,
    purchasesFromSetoran,
    ownerWithdrawalsTotal,
    cashInHand,
    isCashInHandCalculable,
    remainingShoppingBudget,
    sisaDanaBelanjaUntung,
    certainty: engineOutput.totals.certainty,
    reviewReason,
    totalAvailableUnits,
    knownInventoryValue,
    stockByProduct,
  };
}

/**
 * Mengambil modal per pcs terbaru suatu produk:
 * 1. Dari belanja bernota paling mutakhir (totalCost ÷ pcs masuk).
 * 2. Atau dari modal produk awal jika ada.
 * 3. Null jika belum diketahui.
 */
export function getProductLatestUnitCost(
  productId: string,
  payload: TokoSakalaPayload,
  catalog: CatalogProduct[]
): number | null {
  const purchases = (payload.purchaseRecords || [])
    .filter((p) => p.productId === productId && p.totalCost > 0)
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));

  if (purchases.length > 0) {
    const latest = purchases[0];
    const totalPcs = latest.packs * latest.unitsPerPack;
    if (totalPcs > 0) {
      return Math.round(latest.totalCost / totalPcs);
    }
  }

  const prod = catalog.find((c) => c.id === productId);
  if (prod && prod.costPerPack !== null && prod.costPerPack !== undefined && prod.packSize > 0) {
    return Math.floor(prod.costPerPack / prod.packSize);
  }

  return null;
}
