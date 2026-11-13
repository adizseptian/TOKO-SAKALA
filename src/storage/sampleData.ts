import type { TokoSakalaPayload, StorageProduct, PurchaseRecord, StockMovementRecord, ExpenseRecord, DepositRecord, OwnerWithdrawalRecord, OtherIncomeRecord } from './types';
import type { CatalogProduct } from '@/engine/v1/engineBridge';

export const SAMPLE_SEED_ID = 'toko-sakala-sample-week-2026';

export const SAMPLE_PRODUCTS: CatalogProduct[] = [
  { id: 'mie-sukses', name: 'Mie Sukses Cup', category: 'Makanan', unit: 'Dus 24', packSize: 24, costPerPack: 120000, sellingPricePerUnit: 7000, icon: '🍜', discountDay: 'Jumat', discountPerUnit: 1000 },
  { id: 'indomie', name: 'Indomie Goreng', category: 'Makanan', unit: 'Dus 40', packSize: 40, costPerPack: 126000, sellingPricePerUnit: 3500, icon: '🍜' },
  { id: 'mie-sedaap', name: 'Mie Sedaap Ayam Bawang', category: 'Makanan', unit: 'Dus 40', packSize: 40, costPerPack: 110000, sellingPricePerUnit: 3300, icon: '🍜' },
  { id: 'telur', name: 'Telur Ayam Negeri', category: 'Makanan', unit: 'Kg 1', packSize: 1, costPerPack: 27000, sellingPricePerUnit: 30000, icon: '🥚' },
  { id: 'gula', name: 'Gula Pasir', category: 'Makanan', unit: 'Kg 1', packSize: 1, costPerPack: 16000, sellingPricePerUnit: 18000, icon: '🍚' },
  { id: 'minyakita', name: 'Minyakita 1L', category: 'Makanan', unit: 'Karton 12', packSize: 12, costPerPack: 186000, sellingPricePerUnit: 17000, icon: '🛢️' },
  { id: 'aqua', name: 'Aqua 600ml', category: 'Minuman', unit: 'Dus 24', packSize: 24, costPerPack: 48000, sellingPricePerUnit: 3500, icon: '💧' },
  { id: 'teh-pucuk', name: 'Teh Pucuk Harum 350ml', category: 'Minuman', unit: 'Dus 24', packSize: 24, costPerPack: 75000, sellingPricePerUnit: 4000, icon: '🧃' },
  { id: 'pocari', name: 'Pocari Sweat 350ml', category: 'Minuman', unit: 'Dus 24', packSize: 24, costPerPack: 138000, sellingPricePerUnit: 7500, icon: '🥤' },
  { id: 'teh-sisri', name: 'Teh Sisri', category: 'Minuman', unit: 'Renceng 10', packSize: 10, costPerPack: 8500, sellingPricePerUnit: 1000, icon: '🧋' },
  { id: 'marimas', name: 'Marimas Anggur', category: 'Minuman', unit: 'Renceng 10', packSize: 10, costPerPack: 8800, sellingPricePerUnit: 1000, icon: '🍇' },
  { id: 'good-day', name: 'Good Day Cappuccino', category: 'Minuman', unit: 'Renceng 10', packSize: 10, costPerPack: 14500, sellingPricePerUnit: 2000, icon: '☕' },
  { id: 'skm-indomilk', name: 'SKM Indomilk Sachet', category: 'Minuman', unit: 'Renceng 12', packSize: 12, costPerPack: 22000, sellingPricePerUnit: 2500, icon: '🥛' },
  { id: 'chiki', name: 'Chiki Balls 20g', category: 'Makanan', unit: 'Pack 20', packSize: 20, costPerPack: 33000, sellingPricePerUnit: 2000, icon: '🍿' },
  { id: 'beng-beng', name: 'Beng-Beng 20g', category: 'Makanan', unit: 'Box 20', packSize: 20, costPerPack: 32000, sellingPricePerUnit: 2500, icon: '🍫' },
  { id: 'kacang-atom', name: 'Kacang Atom', category: 'Makanan', unit: 'Toples 40', packSize: 40, costPerPack: 36000, sellingPricePerUnit: 1500, icon: '🥜' },
  { id: 'permen-relaxa', name: 'Permen Relaxa', category: 'Makanan', unit: 'Toples 100', packSize: 100, costPerPack: 25000, sellingPricePerUnit: 500, icon: '🍬' },
  { id: 'kerupuk', name: 'Kerupuk Udang', category: 'Makanan', unit: 'Toples 30', packSize: 30, costPerPack: 45000, sellingPricePerUnit: 2000, icon: '🍘' },
  { id: 'sampoerna', name: 'Rokok Sampoerna Mild', category: 'Rokok', unit: 'Slop 10', packSize: 10, costPerPack: 310000, sellingPricePerUnit: 34000, icon: '🚬' },
  { id: 'korek', name: 'Korek Gas', category: 'Lainnya', unit: 'Pack 20', packSize: 20, costPerPack: 24000, sellingPricePerUnit: 2000, icon: '🔥' },
  { id: 'rinso', name: 'Rinso Sachet', category: 'Lainnya', unit: 'Renceng 12', packSize: 12, costPerPack: 10500, sellingPricePerUnit: 1000, icon: '🧼' },
  { id: 'sunsilk', name: 'Sunsilk Sachet', category: 'Lainnya', unit: 'Renceng 12', packSize: 12, costPerPack: 11000, sellingPricePerUnit: 1000, icon: '🧴' },
  { id: 'tisu', name: 'Tisu Paseo Travel', category: 'Lainnya', unit: 'Pack 12', packSize: 12, costPerPack: 36000, sellingPricePerUnit: 4000, icon: '🧻' },
  { id: 'pulpen', name: 'Pulpen Standard AE7', category: 'Lainnya', unit: 'Lusin 12', packSize: 12, costPerPack: 18000, sellingPricePerUnit: 2000, icon: '🖊️' },
  { id: 'kapal-api', name: 'Kapal Api Special Mix', category: 'Minuman', unit: 'Renceng 10', packSize: 10, costPerPack: null, sellingPricePerUnit: 1500, icon: '☕' },
];

export function buildSampleWeekPayload(): TokoSakalaPayload {
  const products: StorageProduct[] = SAMPLE_PRODUCTS.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    unit: p.unit,
    packSize: p.packSize,
    costPerPack: p.costPerPack,
    sellingPricePerUnit: p.sellingPricePerUnit,
    icon: p.icon,
    active: true,
    discountDay: p.discountDay ?? null,
    discountPerUnit: p.discountPerUnit ?? null,
    isSample: true,
    seedId: SAMPLE_SEED_ID,
  }));

  // Belanja 1: Senin 26 Okt 2026, 08:00 WIB (Z offset +07:00 or UTC: 2026-10-26T01:00:00Z)
  // We use standard ISO strings with Z
  const purchasesMon: Array<{ pId: string; packs: number; unitsPerPack: number; totalCost: number }> = [
    { pId: 'mie-sukses', packs: 4, unitsPerPack: 24, totalCost: 480000 },
    { pId: 'indomie', packs: 3, unitsPerPack: 40, totalCost: 378000 },
    { pId: 'mie-sedaap', packs: 2, unitsPerPack: 40, totalCost: 220000 },
    { pId: 'telur', packs: 10, unitsPerPack: 1, totalCost: 270000 },
    { pId: 'gula', packs: 10, unitsPerPack: 1, totalCost: 160000 },
    { pId: 'minyakita', packs: 2, unitsPerPack: 12, totalCost: 372000 },
    { pId: 'aqua', packs: 4, unitsPerPack: 24, totalCost: 192000 },
    { pId: 'teh-pucuk', packs: 2, unitsPerPack: 24, totalCost: 150000 },
    { pId: 'pocari', packs: 1, unitsPerPack: 24, totalCost: 138000 },
    { pId: 'teh-sisri', packs: 5, unitsPerPack: 10, totalCost: 42500 },
    { pId: 'marimas', packs: 4, unitsPerPack: 10, totalCost: 35200 },
    { pId: 'good-day', packs: 4, unitsPerPack: 10, totalCost: 58000 },
    { pId: 'skm-indomilk', packs: 3, unitsPerPack: 12, totalCost: 66000 },
    { pId: 'chiki', packs: 3, unitsPerPack: 20, totalCost: 99000 },
    { pId: 'beng-beng', packs: 2, unitsPerPack: 20, totalCost: 64000 },
    { pId: 'kacang-atom', packs: 2, unitsPerPack: 40, totalCost: 72000 },
    { pId: 'permen-relaxa', packs: 1, unitsPerPack: 100, totalCost: 25000 },
    { pId: 'kerupuk', packs: 2, unitsPerPack: 30, totalCost: 90000 },
    { pId: 'sampoerna', packs: 2, unitsPerPack: 10, totalCost: 620000 },
    { pId: 'korek', packs: 1, unitsPerPack: 20, totalCost: 24000 },
    { pId: 'rinso', packs: 2, unitsPerPack: 12, totalCost: 21000 },
    { pId: 'sunsilk', packs: 2, unitsPerPack: 12, totalCost: 22000 },
    { pId: 'tisu', packs: 1, unitsPerPack: 12, totalCost: 36000 },
    { pId: 'pulpen', packs: 1, unitsPerPack: 12, totalCost: 18000 },
  ];

  const purchaseRecords: PurchaseRecord[] = purchasesMon.map((p, idx) => ({
    id: `seed-pr-mon-${idx + 1}`,
    occurredAt: '2026-10-26T08:00:00Z',
    productId: p.pId,
    packs: p.packs,
    unitsPerPack: p.unitsPerPack,
    totalCost: p.totalCost,
    sourceMoney: 'PRIBADI',
    isSample: true,
    seedId: SAMPLE_SEED_ID,
  }));

  // Belanja 2: Kamis 29 Okt 2026, 08:30 WIB
  const purchasesThu: Array<{ pId: string; packs: number; unitsPerPack: number; totalCost: number }> = [
    { pId: 'mie-sukses', packs: 3, unitsPerPack: 24, totalCost: 378000 },
    { pId: 'indomie', packs: 2, unitsPerPack: 40, totalCost: 252000 },
    { pId: 'telur', packs: 5, unitsPerPack: 1, totalCost: 140000 },
    { pId: 'aqua', packs: 3, unitsPerPack: 24, totalCost: 144000 },
    { pId: 'teh-pucuk', packs: 1, unitsPerPack: 24, totalCost: 75000 },
    { pId: 'pocari', packs: 1, unitsPerPack: 24, totalCost: 138000 },
    { pId: 'teh-sisri', packs: 3, unitsPerPack: 10, totalCost: 25500 },
    { pId: 'marimas', packs: 2, unitsPerPack: 10, totalCost: 17600 },
    { pId: 'good-day', packs: 2, unitsPerPack: 10, totalCost: 29000 },
    { pId: 'skm-indomilk', packs: 2, unitsPerPack: 12, totalCost: 44000 },
    { pId: 'chiki', packs: 2, unitsPerPack: 20, totalCost: 66000 },
    { pId: 'beng-beng', packs: 1, unitsPerPack: 20, totalCost: 32000 },
    { pId: 'kacang-atom', packs: 1, unitsPerPack: 40, totalCost: 36000 },
    { pId: 'permen-relaxa', packs: 1, unitsPerPack: 100, totalCost: 25000 },
    { pId: 'kerupuk', packs: 1, unitsPerPack: 30, totalCost: 45000 },
    { pId: 'sampoerna', packs: 1, unitsPerPack: 10, totalCost: 312000 },
    { pId: 'rinso', packs: 1, unitsPerPack: 12, totalCost: 10500 },
    { pId: 'sunsilk', packs: 1, unitsPerPack: 12, totalCost: 11000 },
  ];

  purchasesThu.forEach((p, idx) => {
    purchaseRecords.push({
      id: `seed-pr-thu-${idx + 1}`,
      occurredAt: '2026-10-29T08:30:00Z',
      productId: p.pId,
      packs: p.packs,
      unitsPerPack: p.unitsPerPack,
      totalCost: p.totalCost,
      sourceMoney: 'SETORAN',
      isSample: true,
      seedId: SAMPLE_SEED_ID,
    });
  });

  // Stock movements
  const stockMovements: StockMovementRecord[] = [];

  // Cek Sisa Stok #1: Rabu 28 Okt 2026, 17:00 WIB
  const checkWed: Record<string, number> = {
    'mie-sukses': 58,
    'indomie': 68,
    'mie-sedaap': 50,
    'telur': 4,
    'gula': 5,
    'minyakita': 15,
    'aqua': 52,
    'teh-pucuk': 28,
    'pocari': 14,
    'teh-sisri': 28,
    'marimas': 22,
    'good-day': 21,
    'skm-indomilk': 22,
    'chiki': 36,
    'beng-beng': 22,
    'kacang-atom': 55,
    'permen-relaxa': 60,
    'kerupuk': 38,
    'sampoerna': 20,
    'korek': 12,
    'rinso': 14,
    'sunsilk': 15,
    'tisu': 7,
    'pulpen': 8,
    'kapal-api': 30,
  };

  Object.entries(checkWed).forEach(([pId, qty], idx) => {
    stockMovements.push({
      id: `seed-sm-wed-${idx + 1}`,
      occurredAt: '2026-10-28T17:00:00Z',
      productId: pId,
      type: 'CHECK_ADJUSTMENT',
      quantity: qty,
      unit: 'pcs',
      notes: pId === 'kapal-api' ? 'Stok awal, belum ada pembanding' : 'Cek sisa stok Rabu sore',
      isSample: true,
      seedId: SAMPLE_SEED_ID,
    });
  });

  // Barang Rusak: Sabtu 31 Okt 2026, 10:00 WIB
  stockMovements.push(
    {
      id: 'seed-dmg-1',
      occurredAt: '2026-10-31T10:00:00Z',
      productId: 'indomie',
      type: 'LOSS_DAMAGE',
      quantity: 2,
      unit: 'pcs',
      notes: 'Kemasan sobek',
      isSample: true,
      seedId: SAMPLE_SEED_ID,
    },
    {
      id: 'seed-dmg-2',
      occurredAt: '2026-10-31T10:00:00Z',
      productId: 'aqua',
      type: 'LOSS_DAMAGE',
      quantity: 1,
      unit: 'pcs',
      notes: 'Botol bocor',
      isSample: true,
      seedId: SAMPLE_SEED_ID,
    },
    {
      id: 'seed-dmg-3',
      occurredAt: '2026-10-31T10:00:00Z',
      productId: 'chiki',
      type: 'LOSS_DAMAGE',
      quantity: 3,
      unit: 'pcs',
      notes: 'Dimakan tikus',
      isSample: true,
      seedId: SAMPLE_SEED_ID,
    }
  );

  // Cek Sisa Stok #2: Sabtu 31 Okt 2026, 17:00 WIB
  const checkSat: Record<string, number> = {
    'mie-sukses': 60,
    'indomie': 86,
    'mie-sedaap': 28,
    'telur': 2,
    'gula': 1,
    'minyakita': 7,
    'aqua': 73,
    'teh-pucuk': 34,
    'pocari': 29,
    'teh-sisri': 32,
    'marimas': 22,
    'good-day': 24,
    'skm-indomilk': 34,
    'chiki': 45,
    'beng-beng': 27,
    'kacang-atom': 75,
    'permen-relaxa': 125,
    'kerupuk': 52,
    'sampoerna': 24,
    'korek': 6,
    'rinso': 17,
    'sunsilk': 19,
    'tisu': 3,
    'pulpen': 5,
    'kapal-api': 22,
  };

  Object.entries(checkSat).forEach(([pId, qty], idx) => {
    stockMovements.push({
      id: `seed-sm-sat-${idx + 1}`,
      occurredAt: '2026-10-31T17:00:00Z',
      productId: pId,
      type: 'CHECK_ADJUSTMENT',
      quantity: qty,
      unit: 'pcs',
      discountSoldUnits: pId === 'mie-sukses' ? 18 : null,
      notes: 'Cek sisa stok Sabtu sore',
      isSample: true,
      seedId: SAMPLE_SEED_ID,
    });
  });

  // Biaya Toko (Expenses)
  const expenses: ExpenseRecord[] = [
    {
      id: 'seed-exp-1',
      occurredAt: '2026-10-27T10:00:00Z', // Selasa
      description: 'Es batu',
      amount: 15000,
      sourceMoney: 'LACI',
      isSample: true,
      seedId: SAMPLE_SEED_ID,
    },
    {
      id: 'seed-exp-2',
      occurredAt: '2026-10-28T11:00:00Z', // Rabu
      description: 'Gas',
      amount: 22000,
      sourceMoney: 'LACI',
      isSample: true,
      seedId: SAMPLE_SEED_ID,
    },
    {
      id: 'seed-exp-3',
      occurredAt: '2026-10-29T10:00:00Z', // Kamis
      description: 'Plastik es',
      amount: 8000,
      sourceMoney: 'LACI',
      isSample: true,
      seedId: SAMPLE_SEED_ID,
    },
    {
      id: 'seed-exp-4',
      occurredAt: '2026-10-30T10:00:00Z', // Jumat
      description: 'Es batu',
      amount: 15000,
      sourceMoney: 'LACI',
      isSample: true,
      seedId: SAMPLE_SEED_ID,
    },
    {
      id: 'seed-exp-5',
      occurredAt: '2026-10-31T11:00:00Z', // Sabtu
      description: 'Sedotan',
      amount: 6000,
      sourceMoney: 'LACI',
      isSample: true,
      seedId: SAMPLE_SEED_ID,
    },
    {
      id: 'seed-exp-6',
      occurredAt: '2026-10-31T14:00:00Z', // Sabtu
      description: 'Sabun cuci piring',
      amount: 12000,
      sourceMoney: 'PRIBADI',
      isSample: true,
      seedId: SAMPLE_SEED_ID,
    },
    {
      id: 'seed-exp-7',
      occurredAt: '2026-11-01T10:00:00Z', // Minggu
      description: 'Es batu',
      amount: 10000,
      sourceMoney: 'LACI',
      isSample: true,
      seedId: SAMPLE_SEED_ID,
    },
  ];

  // Pemasukan Lain (Other Incomes: Jasa seduh Rp2.000)
  const otherIncomes: OtherIncomeRecord[] = [
    {
      id: 'seed-inc-1',
      occurredAt: '2026-10-26T12:00:00Z', // Senin (5 kali)
      name: 'Jasa seduh',
      nominal: 2000,
      quantity: 5,
      totalAmount: 10000,
      notes: 'Seduh mie & minuman sachet',
      isSample: true,
      seedId: SAMPLE_SEED_ID,
    },
    {
      id: 'seed-inc-2',
      occurredAt: '2026-10-27T12:00:00Z', // Selasa (7 kali)
      name: 'Jasa seduh',
      nominal: 2000,
      quantity: 7,
      totalAmount: 14000,
      notes: 'Seduh mie & minuman sachet',
      isSample: true,
      seedId: SAMPLE_SEED_ID,
    },
    {
      id: 'seed-inc-3',
      occurredAt: '2026-10-28T12:00:00Z', // Rabu (12 kali)
      name: 'Jasa seduh',
      nominal: 2000,
      quantity: 12,
      totalAmount: 24000,
      notes: 'Seduh mie & minuman sachet',
      isSample: true,
      seedId: SAMPLE_SEED_ID,
    },
    {
      id: 'seed-inc-4',
      occurredAt: '2026-10-29T12:00:00Z', // Kamis (8 kali)
      name: 'Jasa seduh',
      nominal: 2000,
      quantity: 8,
      totalAmount: 16000,
      notes: 'Seduh mie & minuman sachet',
      isSample: true,
      seedId: SAMPLE_SEED_ID,
    },
    {
      id: 'seed-inc-5',
      occurredAt: '2026-10-30T12:00:00Z', // Jumat (9 kali)
      name: 'Jasa seduh',
      nominal: 2000,
      quantity: 9,
      totalAmount: 18000,
      notes: 'Seduh mie & minuman sachet',
      isSample: true,
      seedId: SAMPLE_SEED_ID,
    },
    {
      id: 'seed-inc-6',
      occurredAt: '2026-10-31T12:00:00Z', // Sabtu (15 kali)
      name: 'Jasa seduh',
      nominal: 2000,
      quantity: 15,
      totalAmount: 30000,
      notes: 'Seduh mie & minuman sachet',
      isSample: true,
      seedId: SAMPLE_SEED_ID,
    },
    {
      id: 'seed-inc-7',
      occurredAt: '2026-11-01T12:00:00Z', // Minggu (10 kali)
      name: 'Jasa seduh',
      nominal: 2000,
      quantity: 10,
      totalAmount: 20000,
      notes: 'Seduh mie & minuman sachet',
      isSample: true,
      seedId: SAMPLE_SEED_ID,
    },
  ];

  // Setoran (Deposits)
  const deposits: DepositRecord[] = [
    {
      id: 'seed-dep-1',
      occurredAt: '2026-10-28T17:30:00Z', // Rabu
      expectedAmount: 1660500,
      receivedAmount: 1660500,
      discrepancy: 0,
      notes: 'Setoran #1 lengkap',
      isSample: true,
      seedId: SAMPLE_SEED_ID,
    },
    {
      id: 'seed-dep-2',
      occurredAt: '2026-10-31T17:30:00Z', // Sabtu
      expectedAmount: 2072100,
      receivedAmount: 2067100,
      discrepancy: -5000,
      notes: 'uang kembalian kurang',
      isSample: true,
      seedId: SAMPLE_SEED_ID,
    },
  ];

  // Pengambilan Pribadi (Owner Withdrawal)
  const ownerWithdrawals: OwnerWithdrawalRecord[] = [
    {
      id: 'seed-wth-1',
      occurredAt: '2026-10-31T18:00:00Z', // Sabtu
      amount: 100000,
      notes: 'Pengambilan pribadi',
      isSample: true,
      seedId: SAMPLE_SEED_ID,
    },
  ];

  return {
    products,
    purchaseRecords,
    stockMovements,
    salesRecords: [],
    expenses,
    deposits,
    ownerWithdrawals,
    otherIncomes,
    closedPeriods: [],
    corrections: [],
    settings: {
      shopName: 'TOKO SAKALA',
      ownerEmail: 'adizseptian@gmail.com',
      currency: 'IDR',
      theme: 'light',
      aiAssistantEnabled: false,
    },
  };
}

/**
 * Idempotently injects sample data into existing payload.
 */
export function seedSampleData(payload: TokoSakalaPayload): TokoSakalaPayload {
  const sample = buildSampleWeekPayload();

  const filterNonSample = <T extends { isSample?: boolean; seedId?: string }>(arr: T[] | undefined): T[] => {
    return (arr || []).filter((item) => !item.isSample && item.seedId !== SAMPLE_SEED_ID);
  };

  return {
    ...payload,
    products: [...filterNonSample(payload.products), ...sample.products],
    purchaseRecords: [...filterNonSample(payload.purchaseRecords), ...sample.purchaseRecords],
    stockMovements: [...filterNonSample(payload.stockMovements), ...sample.stockMovements],
    salesRecords: filterNonSample(payload.salesRecords),
    expenses: [...filterNonSample(payload.expenses), ...sample.expenses],
    deposits: [...filterNonSample(payload.deposits), ...sample.deposits],
    ownerWithdrawals: [...filterNonSample(payload.ownerWithdrawals), ...sample.ownerWithdrawals],
    otherIncomes: [...filterNonSample(payload.otherIncomes), ...(sample.otherIncomes || [])],
    closedPeriods: payload.closedPeriods || [],
    corrections: payload.corrections || [],
  };
}

/**
 * Removes only sample records (with isSample: true or seedId === SAMPLE_SEED_ID)
 */
export function removeSampleData(payload: TokoSakalaPayload): TokoSakalaPayload {
  const keepOnlyReal = <T extends { isSample?: boolean; seedId?: string }>(arr: T[] | undefined): T[] => {
    return (arr || []).filter((item) => !item.isSample && item.seedId !== SAMPLE_SEED_ID);
  };

  return {
    ...payload,
    products: keepOnlyReal(payload.products),
    purchaseRecords: keepOnlyReal(payload.purchaseRecords),
    stockMovements: keepOnlyReal(payload.stockMovements),
    salesRecords: keepOnlyReal(payload.salesRecords),
    expenses: keepOnlyReal(payload.expenses),
    deposits: keepOnlyReal(payload.deposits),
    ownerWithdrawals: keepOnlyReal(payload.ownerWithdrawals),
    otherIncomes: keepOnlyReal(payload.otherIncomes),
    closedPeriods: payload.closedPeriods || [],
    corrections: payload.corrections || [],
  };
}
