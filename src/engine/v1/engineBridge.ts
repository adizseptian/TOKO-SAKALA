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
  discountDay?: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu' | null;
  discountPerUnit?: number | null;
}

/**
 * Cek apakah rentang tanggal [startDateStr, endDateStr] memuat nama hari tertentu (misal: "Jumat").
 */
export function hasDayInInterval(startDateStr: string, endDateStr: string, targetDayName: string): boolean {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const targetDayIdx = dayNames.indexOf(targetDayName);
  if (targetDayIdx === -1) return false;

  const diffDays = Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays >= 7) return true;

  const current = new Date(Math.min(start.getTime(), end.getTime()));
  const targetEnd = new Date(Math.max(start.getTime(), end.getTime()));
  current.setHours(0, 0, 0, 0);
  targetEnd.setHours(23, 59, 59, 999);

  while (current <= targetEnd) {
    if (current.getDay() === targetDayIdx) {
      return true;
    }
    current.setDate(current.getDate() + 1);
  }
  return false;
}

export interface StoreFinancialSummary {
  engineOutput: EngineOutput;
  /** Nilai penjualan dari cek sisa stok (Sebelum diskon) */
  grossSales: { min: number; max: number };
  /** Untung Kotor: Σ terjual × harga jual − Diskon */
  untungKotor: { min: number; max: number };
  /** Total potongan diskon hari tertentu */
  discountTotal: { min: number; max: number };
  hasDiscountReview: boolean;
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
  /** Total pemasukan lain (misal: jasa seduh mie) */
  otherIncomeTotal: number;
  /** Nilai modal rugi barang rusak (tidak mengurangi Untung Bersih, hanya di Laporan) */
  damageLossTotal: number;
  /** Untung Bersih = Untung Kotor − semua pengeluaran toko + pemasukan lain */
  untungBersih: { min: number; max: number } | null;
  netProfit: { min: number; max: number } | null;
  /** Setoran kas yang seharusnya diserahkan (Untung Kotor + pemasukan lain − pengeluaran uang laci) */
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
  uangDiTangan: number;
  isCashInHandCalculable: boolean;
  /** Sisa dana belanja (Untung Bersih − belanja bersumber "Untung bersih toko") */
  remainingShoppingBudget: number;
  sisaDanaBelanjaUntung: number;
  sisaDanaBelanja: number;
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

  // 4b. Kumpulkan pemasukan lain (other_income)
  (payload.otherIncomes || []).forEach((inc) => {
    events.push({
      id: inc.id,
      seq: 0,
      occurredAt: inc.occurredAt,
      type: 'other_income',
      description: `${inc.name} (${inc.quantity}x)`,
      amount: inc.totalAmount,
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
    // Prioritaskan opening_stock -> purchase -> loss -> stock_check -> other_income -> expense -> deposit
    const priority = (type: string) => {
      switch (type) {
        case 'opening_stock': return 1;
        case 'purchase': return 2;
        case 'loss': return 3;
        case 'stock_check': return 4;
        case 'other_income': return 5;
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
  const modalKembali = cogsKnown;
  const expensesTotal = engineOutput.totals.expenses;
  const otherIncomeTotal = engineOutput.totals.otherIncome;
  const damageLossTotal = engineOutput.totals.damageLossKnown;

  const asOfMs = asOfTime ? Date.parse(asOfTime) : Infinity;

  // 4. Hitung Diskon hari tertentu (hanya cek sisa yang terjadi <= asOfMs)
  let discountMin = 0;
  let discountMax = 0;
  let hasDiscountReview = false;

  catalog.forEach((prod) => {
    if (!prod.discountDay || !prod.discountPerUnit || prod.discountPerUnit <= 0) return;

    // Ambil mutasi cek sisa untuk produk ini berurutan waktu sampai asOfMs
    const checks = (payload.stockMovements || [])
      .filter((m) => m.productId === prod.id && m.type === 'CHECK_ADJUSTMENT' && Date.parse(m.occurredAt) <= asOfMs)
      .sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt));

    for (let i = 0; i < checks.length; i++) {
      const curCheck = checks[i];
      const prevCheck = i > 0 ? checks[i - 1] : null;
      const startDate = prevCheck ? prevCheck.occurredAt : curCheck.occurredAt;
      const crossed = hasDayInInterval(startDate, curCheck.occurredAt, prod.discountDay);

      if (crossed) {
        const soldInInterval = prevCheck ? Math.max(0, prevCheck.quantity - curCheck.quantity) : 0;
        if (curCheck.discountSoldUnits !== null && curCheck.discountSoldUnits !== undefined) {
          const pot = curCheck.discountSoldUnits * prod.discountPerUnit;
          discountMin += pot;
          discountMax += pot;
        } else if (soldInInterval > 0) {
          // Kolom kosong: Diskon tampil sebagai kisaran (0 sampai terjual × potongan) dengan status "Perlu diperiksa"
          discountMin += 0;
          discountMax += soldInInterval * prod.discountPerUnit;
          hasDiscountReview = true;
        }
      }
    }
  });

  const discountTotal = { min: discountMin, max: discountMax };

  // Untung Kotor = Σ terjual × harga jual − Diskon
  const untungKotor = {
    min: Math.max(0, grossSales.min - discountTotal.max),
    max: Math.max(0, grossSales.max - discountTotal.min),
  };

  // Biaya dari laci kasir (hanya yang mengurangi setoran toko, sampai asOfMs)
  let expensesLaci = 0;
  (payload.expenses || []).forEach((e) => {
    if (Date.parse(e.occurredAt) <= asOfMs) {
      if (e.sourceMoney === 'LACI' || (e.sourceMoney as any) === 'STORE') {
        expensesLaci += e.amount;
      }
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

  // Laba Bersih Operasional = Laba Kotor - Total Biaya Toko + Pemasukan Lain
  const netProfit =
    grossProfit !== null
      ? {
          min: grossProfit.min - expensesTotal + otherIncomeTotal,
          max: grossProfit.max - expensesTotal + otherIncomeTotal,
        }
      : null;

  // Istilah Pemilik Toko:
  // Untung Bersih = Untung Kotor − semua pengeluaran toko + pemasukan lain
  const untungBersih = {
    min: untungKotor.min - expensesTotal + otherIncomeTotal,
    max: untungKotor.max - expensesTotal + otherIncomeTotal,
  };

  // Laba setelah modal = Untung Bersih − modal barang terjual (hanya di Laporan)
  const labaSetelahModal = {
    min: untungBersih.min - cogsKnown,
    max: untungBersih.max - cogsKnown,
  };

  // Setoran seharusnya kumulatif = Untung Kotor + pemasukan lain − pengeluaran yang dibayar uang laci
  const cumulativeExpectedDeposit = Math.max(0, untungKotor.min + otherIncomeTotal - expensesLaci);

  // Setoran yang sudah tersimpan sebelum/pada asOfMs
  const previousDeposits = (payload.deposits || [])
    .filter((d) => Date.parse(d.occurredAt) <= asOfMs)
    .sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt));

  const totalDeposits = engineOutput.totals.totalDeposits;

  // Setoran seharusnya periode berjalan (sejak setoran terakhir disimpan)
  let expectedDeposit = cumulativeExpectedDeposit;
  let remainingDeposit = Math.max(0, cumulativeExpectedDeposit - totalDeposits);

  if (previousDeposits.length > 0) {
    const previousExpectedTotal = previousDeposits.reduce((sum, d) => sum + (d.expectedAmount ?? 0), 0);
    const runningExpected = Math.max(0, cumulativeExpectedDeposit - previousExpectedTotal);

    if (runningExpected > 0) {
      // Ada transaksi baru di periode berjalan (misal: Minggu setelah setoran Sabtu)
      expectedDeposit = runningExpected;
      remainingDeposit = runningExpected;
    } else {
      // Tidak ada sisa yang belum disetor di periode berjalan
      const lastDep = previousDeposits[previousDeposits.length - 1];
      expectedDeposit = lastDep.expectedAmount;
      remainingDeposit = 0;
    }
  }

  // Selisih = Diterima - Seharusnya
  const depositDiscrepancy = totalDeposits - cumulativeExpectedDeposit;

  // Belanja (sampai asOfMs)
  let totalPurchases = 0;
  let purchasesFromSetoran = 0;
  (payload.purchaseRecords || []).forEach((p) => {
    if (Date.parse(p.occurredAt) <= asOfMs) {
      totalPurchases += p.totalCost;
      if (p.sourceMoney === 'SETORAN' || (p.sourceMoney as any) === 'STORE') {
        purchasesFromSetoran += p.totalCost;
      }
    }
  });

  // Pengambilan pribadi (sampai asOfMs)
  let ownerWithdrawalsTotal = 0;
  (payload.ownerWithdrawals || []).forEach((w) => {
    if (Date.parse(w.occurredAt) <= asOfMs) {
      ownerWithdrawalsTotal += w.amount;
    }
  });

  // Uang di tangan = setoran diterima − belanja bersumber "Untung bersih toko" − pengambilan pribadi
  const cashInHand = totalDeposits - purchasesFromSetoran - ownerWithdrawalsTotal;
  const uangDiTangan = cashInHand;
  const isCashInHandCalculable = totalDeposits > 0;

  // Sisa dana belanja:
  // 1. Menurut modal: Modal kembali - Total belanja (negatif = diambil dari untung)
  const remainingShoppingBudget = modalKembali - totalPurchases;
  // 2. Menurut untung bersih toko: Untung Bersih - Belanja bersumber untung bersih toko
  const sisaDanaBelanjaUntung = untungBersih.min - purchasesFromSetoran;
  const sisaDanaBelanja = sisaDanaBelanjaUntung;

  // Cari satu alasan utama bila kepastian bukan PASTI
  let certainty = engineOutput.totals.certainty;
  let reviewReason: string | null = null;
  if (hasDiscountReview || discountTotal.min !== discountTotal.max) {
    if (certainty === 'PASTI') certainty = 'PERLU_DIPERIKSA';
    reviewReason = 'Perlu diperiksa (diskon hari tertentu)';
  }

  if (certainty !== 'PASTI' && !reviewReason) {
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
    discountTotal,
    hasDiscountReview,
    cogsKnown,
    modalKembali,
    labaSetelahModal,
    grossProfit,
    expensesTotal,
    expensesLaci,
    otherIncomeTotal,
    damageLossTotal,
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
    uangDiTangan,
    isCashInHandCalculable,
    remainingShoppingBudget,
    sisaDanaBelanjaUntung,
    sisaDanaBelanja,
    certainty,
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

export interface DateRangePeriodSummary {
  untungKotor: { min: number; max: number };
  grossSales: { min: number; max: number };
  discountTotal: { min: number; max: number };
  depositsCount: number;
  depositsTotal: number;
  expensesTotal: number;
  otherIncomeTotal: number;
  untungBersih: { min: number; max: number };
}

/**
 * Menghitung ringkasan keuangan toko untuk rentang waktu spesifik (Hari, Minggu, Bulan, Tahun).
 */
export function calculatePeriodSummary(
  payload: TokoSakalaPayload,
  catalog: CatalogProduct[],
  startDate: string | Date,
  endDate: string | Date
): DateRangePeriodSummary {
  const startMs = typeof startDate === 'string' ? Date.parse(startDate) : startDate.getTime();
  const endMs = typeof endDate === 'string' ? Date.parse(endDate) : endDate.getTime();

  // 1. Setoran dalam rentang
  const deps = (payload.deposits || []).filter((d) => {
    const t = Date.parse(d.occurredAt);
    return t >= startMs && t <= endMs;
  });
  const depositsCount = deps.length;
  const depositsTotal = deps.reduce((sum, d) => sum + (d.receivedAmount ?? (d as any).amount ?? 0), 0);

  // 2. Biaya pengeluaran dalam rentang
  const exps = (payload.expenses || []).filter((e) => {
    const t = Date.parse(e.occurredAt);
    return t >= startMs && t <= endMs;
  });
  const expensesTotal = exps.reduce((sum, e) => sum + e.amount, 0);

  // 3. Pemasukan lain dalam rentang
  const incs = (payload.otherIncomes || []).filter((i) => {
    const t = Date.parse(i.occurredAt);
    return t >= startMs && t <= endMs;
  });
  const otherIncomeTotal = incs.reduce((sum, i) => sum + i.totalAmount, 0);

  // 4. Penjualan & Diskon dalam rentang
  let rangeGrossSales = 0;
  let rangeDiscountMin = 0;
  let rangeDiscountMax = 0;

  catalog.forEach((prod) => {
    const prodsChecks = (payload.stockMovements || [])
      .filter((m) => m.productId === prod.id && m.type === 'CHECK_ADJUSTMENT')
      .sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt));

    const prodsPurchases = (payload.purchaseRecords || []).filter((p) => p.productId === prod.id);

    // Hitung pergerakan stok untuk produk ini
    let available = 0;
    let baselineSeen = false;

    // Kumpulkan semua event relevan sebelum endMs
    type MovEv = { time: number; type: string; qty: number; discountSoldUnits?: number | null; occurredAt: string };
    const movs: MovEv[] = [];

    prodsPurchases.forEach((p) => {
      movs.push({
        time: Date.parse(p.occurredAt),
        type: 'purchase',
        qty: p.packs * p.unitsPerPack,
        occurredAt: p.occurredAt,
      });
    });

    (payload.stockMovements || [])
      .filter((m) => m.productId === prod.id)
      .forEach((m) => {
        movs.push({
          time: Date.parse(m.occurredAt),
          type: m.type,
          qty: m.quantity,
          discountSoldUnits: m.discountSoldUnits,
          occurredAt: m.occurredAt,
        });
      });

    movs.sort((a, b) => a.time - b.time);

    let prevCheckTime: string | null = null;
    let prevCheckQty: number | null = null;

    for (const ev of movs) {
      if (ev.time > endMs) break;

      if (ev.type === 'purchase') {
        available += ev.qty;
      } else if (ev.type === 'LOSS_DAMAGE' || ev.type === 'LOSS_UNKNOWN') {
        available = Math.max(0, available - ev.qty);
      } else if (ev.type === 'CHECK_ADJUSTMENT') {
        if (!baselineSeen && prodsPurchases.every((p) => Date.parse(p.occurredAt) > ev.time)) {
          // Stok awal
          baselineSeen = true;
          available = ev.qty;
          prevCheckTime = ev.occurredAt;
          prevCheckQty = ev.qty;
        } else {
          // Cek sisa berkala
          baselineSeen = true;
          const sold = Math.max(0, available - ev.qty);
          available = ev.qty;

          // Apakah cek sisa ini berada dalam interval [startMs, endMs]?
          if (ev.time >= startMs && ev.time <= endMs) {
            rangeGrossSales += sold * prod.sellingPricePerUnit;

            // Diskon
            if (prod.discountDay && prod.discountPerUnit) {
              const startDateStr = prevCheckTime || ev.occurredAt;
              const crossed = hasDayInInterval(startDateStr, ev.occurredAt, prod.discountDay);
              if (crossed) {
                if (ev.discountSoldUnits !== null && ev.discountSoldUnits !== undefined) {
                  const pot = ev.discountSoldUnits * prod.discountPerUnit;
                  rangeDiscountMin += pot;
                  rangeDiscountMax += pot;
                } else if (sold > 0) {
                  rangeDiscountMax += sold * prod.discountPerUnit;
                }
              }
            }
          }

          prevCheckTime = ev.occurredAt;
          prevCheckQty = ev.qty;
        }
      }
    }
  });

  // Jika payload memiliki salesRecords yang tepat dalam rentang, pastikan sinkron
  if (rangeGrossSales === 0) {
    const salesInRange = (payload.salesRecords || []).filter((s) => {
      const t = Date.parse(s.occurredAt);
      return t >= startMs && t <= endMs;
    });
    if (salesInRange.length > 0) {
      rangeGrossSales = salesInRange.reduce((sum, s) => sum + s.totalSalesValue, 0);
    }
  }

  const grossSales = { min: rangeGrossSales, max: rangeGrossSales };
  const discountTotal = { min: rangeDiscountMin, max: rangeDiscountMax };
  const untungKotor = {
    min: Math.max(0, grossSales.min - discountTotal.max),
    max: Math.max(0, grossSales.max - discountTotal.min),
  };

  const untungBersih = {
    min: untungKotor.min - expensesTotal + otherIncomeTotal,
    max: untungKotor.max - expensesTotal + otherIncomeTotal,
  };

  return {
    grossSales,
    discountTotal,
    untungKotor,
    depositsCount,
    depositsTotal,
    expensesTotal,
    otherIncomeTotal,
    untungBersih,
  };
}
