import type { Product, AppEvent } from '@/domain/event';

export const DEMO_PRODUCTS: Product[] = [
  { id: 'prod-mie-sukses', name: 'Mie Suksess Isi 2 Ayam Kecap', sellingPrice: 4500, active: true },
  { id: 'prod-indomie-grg', name: 'Indomie Goreng Spesial', sellingPrice: 3500, active: true },
  { id: 'prod-kopi-kapal', name: 'Kopi Kapal Api Special Mix', sellingPrice: 2000, active: true },
  { id: 'prod-teh-pucuk', name: 'Teh Pucuk Harum 350ml', sellingPrice: 4000, active: true },
  { id: 'prod-minyak-sania', name: 'Minyak Goreng Sania 1 Liter', sellingPrice: 19000, active: true },
  { id: 'prod-telur-kg', name: 'Telur Ayam Negeri (per kg)', sellingPrice: 28000, active: true }
];

export const DEMO_EVENTS: AppEvent[] = [
  // 1. Belanja Mie Suksess (2 dus isi 24 = 48 pcs, modal 168.000, uang toko)
  {
    id: 'ev-demo-1',
    seq: 1,
    occurredAt: '2026-10-18T08:30:00+07:00',
    type: 'purchase',
    productId: 'prod-mie-sukses',
    packs: 2,
    unitsPerPack: 24,
    totalCost: 168000,
    sourceMoney: 'STORE'
  },
  // 2. Belanja Indomie Goreng (1 karton isi 40 = 40 pcs, modal 116.000, uang toko)
  {
    id: 'ev-demo-2',
    seq: 2,
    occurredAt: '2026-10-18T08:45:00+07:00',
    type: 'purchase',
    productId: 'prod-indomie-grg',
    packs: 1,
    unitsPerPack: 40,
    totalCost: 116000,
    sourceMoney: 'STORE'
  },
  // 3. Belanja Kopi Kapal Api (3 renceng isi 10 = 30 sachet, modal 45.000, uang toko)
  {
    id: 'ev-demo-3',
    seq: 3,
    occurredAt: '2026-10-18T09:00:00+07:00',
    type: 'purchase',
    productId: 'prod-kopi-kapal',
    packs: 3,
    unitsPerPack: 10,
    totalCost: 45000,
    sourceMoney: 'STORE'
  },
  // 4. Belanja Teh Pucuk (2 dus isi 24 = 48 botol, modal 144.000, uang pribadi / talangan pemilik)
  {
    id: 'ev-demo-4',
    seq: 4,
    occurredAt: '2026-10-18T09:30:00+07:00',
    type: 'purchase',
    productId: 'prod-teh-pucuk',
    packs: 2,
    unitsPerPack: 24,
    totalCost: 144000,
    sourceMoney: 'PERSONAL'
  },
  // 5. Belanja Minyak Sania (1 dus isi 12 pouch = 12 liter, modal 204.000, uang toko)
  {
    id: 'ev-demo-5',
    seq: 5,
    occurredAt: '2026-10-18T10:00:00+07:00',
    type: 'purchase',
    productId: 'prod-minyak-sania',
    packs: 1,
    unitsPerPack: 12,
    totalCost: 204000,
    sourceMoney: 'STORE'
  },
  // 6. Belanja Telur (1 peti isi 15 kg, modal 360.000, uang toko)
  {
    id: 'ev-demo-6',
    seq: 6,
    occurredAt: '2026-10-18T10:15:00+07:00',
    type: 'purchase',
    productId: 'prod-telur-kg',
    packs: 1,
    unitsPerPack: 15,
    totalCost: 360000,
    sourceMoney: 'STORE'
  },
  // 7. Pengeluaran Toko: Beli Plastik Kresek & Karet
  {
    id: 'ev-demo-7',
    seq: 7,
    occurredAt: '2026-10-19T11:00:00+07:00',
    type: 'expense',
    description: 'Kantong plastik kresek putih & bening',
    amount: 18000,
    sourceMoney: 'STORE'
  },
  // 8. Pendapatan Lain: Jasa seduh mi & es teh
  {
    id: 'ev-demo-8',
    seq: 8,
    occurredAt: '2026-10-19T17:00:00+07:00',
    type: 'other_income',
    description: 'Jasa seduh mi & cup es batu (12 porsi)',
    amount: 24000
  },
  // 9. Cek Sisa Hari ke-2 untuk Mie Suksess (sisa 18 pcs, terjual 30 pcs)
  {
    id: 'ev-demo-9',
    seq: 9,
    occurredAt: '2026-10-20T21:00:00+07:00',
    type: 'stock_check',
    productId: 'prod-mie-sukses',
    observedUnits: 18
  },
  // 10. Cek Sisa Hari ke-2 untuk Indomie Goreng (sisa 12 pcs, terjual 28 pcs)
  {
    id: 'ev-demo-10',
    seq: 10,
    occurredAt: '2026-10-20T21:05:00+07:00',
    type: 'stock_check',
    productId: 'prod-indomie-grg',
    observedUnits: 12
  },
  // 11. Cek Sisa Hari ke-2 untuk Kopi Kapal Api (sisa 8 sachet, terjual 22 sachet)
  {
    id: 'ev-demo-11',
    seq: 11,
    occurredAt: '2026-10-20T21:10:00+07:00',
    type: 'stock_check',
    productId: 'prod-kopi-kapal',
    observedUnits: 8
  },
  // 12. Cek Sisa Hari ke-2 untuk Teh Pucuk (sisa 16 botol, terjual 32 botol)
  {
    id: 'ev-demo-12',
    seq: 12,
    occurredAt: '2026-10-20T21:15:00+07:00',
    type: 'stock_check',
    productId: 'prod-teh-pucuk',
    observedUnits: 16
  },
  // 13. Cek Sisa Hari ke-2 untuk Minyak Sania (sisa 4 liter, terjual 8 liter)
  {
    id: 'ev-demo-13',
    seq: 13,
    occurredAt: '2026-10-20T21:20:00+07:00',
    type: 'stock_check',
    productId: 'prod-minyak-sania',
    observedUnits: 4
  },
  // 14. Cek Sisa Hari ke-2 untuk Telur (sisa 6 kg, terjual 9 kg)
  {
    id: 'ev-demo-14',
    seq: 14,
    occurredAt: '2026-10-20T21:25:00+07:00',
    type: 'stock_check',
    productId: 'prod-telur-kg',
    observedUnits: 6
  },
  // 15. Setoran uang ke pemilik toko / bank
  {
    id: 'ev-demo-15',
    seq: 15,
    occurredAt: '2026-10-21T07:30:00+07:00',
    type: 'deposit',
    amount: 150000
  }
];
