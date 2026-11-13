import { describe, it, expect } from 'vitest';
import { buildSampleWeekPayload, SAMPLE_PRODUCTS, seedSampleData, removeSampleData, SAMPLE_SEED_ID } from '@/storage/sampleData';
import { runStoreFinancialEngine, calculatePeriodSummary } from '@/engine/v1/engineBridge';
import type { TokoSakalaPayload } from '@/storage/types';

describe('UJI OTOMATIS DATA CONTOH 1 MINGGU PENUH (26 OKT – 1 NOV 2026)', () => {
  const samplePayload = buildSampleWeekPayload();

  it('1. Verifikasi Data Contoh memiliki 25 barang dan total nota belanja sesuai spesifikasi', () => {
    expect(samplePayload.products.length).toBe(25);

    // Belanja Senin (24 barang) = Rp3.652.700
    const mondayPurchases = samplePayload.purchaseRecords.filter(p => p.occurredAt.startsWith('2026-10-26'));
    expect(mondayPurchases.length).toBe(24);
    const mondayTotal = mondayPurchases.reduce((s, p) => s + p.totalCost, 0);
    expect(mondayTotal).toBe(3652700);

    // Belanja Kamis (18 barang) = Rp1.780.600
    const thursdayPurchases = samplePayload.purchaseRecords.filter(p => p.occurredAt.startsWith('2026-10-29'));
    expect(thursdayPurchases.length).toBe(18);
    const thursdayTotal = thursdayPurchases.reduce((s, p) => s + p.totalCost, 0);
    expect(thursdayTotal).toBe(1780600);
  });

  it('2. Periode 1 (Senin 26 Okt – Rabu 28 Okt 17:30)', () => {
    const summaryP1 = runStoreFinancialEngine(samplePayload, SAMPLE_PRODUCTS, '2026-10-28T17:30:00Z');

    let totalCalculated = 0;
    SAMPLE_PRODUCTS.forEach(p => {
      const st = summaryP1.stockByProduct.get(p.id);
      const val = st ? st.unitsSold * p.sellingPricePerUnit : 0;
      totalCalculated += val;
      console.log(`${p.name} (${p.id}): sold=${st?.unitsSold}, avail=${st?.availableUnits}, val=${val}`);
    });
    console.log('TOTAL CALCULATED:', totalCalculated);

    // Penjualan Periode 1 = 1.649.500
    expect(summaryP1.grossSales.min).toBe(1649500);
    // Untung Kotor = 1.649.500 (diskon 0)
    expect(summaryP1.untungKotor.min).toBe(1649500);
    // Jasa = 48.000 (Senin 10.000 + Selasa 14.000 + Rabu 24.000)
    expect(summaryP1.otherIncomeTotal).toBe(48000);
    // Biaya laci = 37.000 (Es batu 15.000 + Gas 22.000)
    expect(summaryP1.expensesLaci).toBe(37000);
    // Setoran seharusnya = Penjualan + Jasa - Biaya laci = 1.649.500 + 48.000 - 37.000 = 1.660.500
    expect(summaryP1.expectedDeposit).toBe(1660500);
    // Setoran diterima = 1.660.500
    expect(summaryP1.totalDeposits).toBe(1660500);
    // Selisih = 0
    expect(summaryP1.depositDiscrepancy).toBe(0);
    // Untung Bersih = Untung kotor - Pengeluaran toko + Pemasukan lain = 1.649.500 - 37.000 + 48.000 = 1.660.500
    expect(summaryP1.untungBersih?.min).toBe(1660500);

    // Detail per barang di Periode 1:
    // Mie Sukses terjual 38 pcs = 266.000
    const mieSuksesStockP1 = summaryP1.stockByProduct.get('mie-sukses');
    expect(mieSuksesStockP1?.unitsSold).toBe(38);
    expect(mieSuksesStockP1 ? mieSuksesStockP1.unitsSold * 7000 : 0).toBe(266000);

    // Kapal Api diisi 30 sebagai stok awal (0 terjual di P1)
    const kapalApiStockP1 = summaryP1.stockByProduct.get('kapal-api');
    expect(kapalApiStockP1?.unitsSold).toBe(0);
    expect(kapalApiStockP1?.availableUnits).toBe(30);
  });

  it('3. Periode 2 (Kamis 29 Okt – Sabtu 31 Okt 17:30) & Rentang Hari/Minggu', () => {
    // Ringkasan periode Kamis 29 Okt s/d Sabtu 31 Okt 17:30
    const startP2 = new Date('2026-10-29T00:00:00Z');
    const endP2 = new Date('2026-10-31T17:30:00Z');
    const summaryP2Range = calculatePeriodSummary(samplePayload, SAMPLE_PRODUCTS, startP2, endP2);

    expect(summaryP2Range.grossSales.min).toBe(2055100);
    expect(summaryP2Range.discountTotal.max).toBe(18000);
    expect(summaryP2Range.untungKotor.min).toBe(2037100);
    expect(summaryP2Range.otherIncomeTotal).toBe(64000); // 16.000 + 18.000 + 30.000
    expect(summaryP2Range.expensesTotal).toBe(41000); // 8.000 + 15.000 + 6.000 + 12.000
    expect(summaryP2Range.untungBersih.min).toBe(2060100); // 2.037.100 - 41.000 + 64.000
    expect(summaryP2Range.depositsTotal).toBe(2067100);

    // Evaluasi engine lengkap saat Sabtu 31 Okt 17:30
    const summarySat = runStoreFinancialEngine(samplePayload, SAMPLE_PRODUCTS, '2026-10-31T17:30:00Z');

    // Mie Sukses Periode 2: tersedia 58 (sisa Rabu) + 72 (belanja Kamis) = 130, sisa 60, terjual 70
    // Untung kotor = 70 × 7.000 - 18.000 = 472.000
    const mieSuksesStock = summarySat.stockByProduct.get('mie-sukses');
    expect(mieSuksesStock?.unitsSold).toBe(38 + 70); // Total kumulatif 108

    // Kapal Api terjual 8 pcs di Periode 2 = Rp12.000 (8 × Rp1.500)
    const kapalApiStock = summarySat.stockByProduct.get('kapal-api');
    expect(kapalApiStock?.unitsSold).toBe(8);

    // Setoran #2 di payload: diterima 2.067.100, expected 2.072.100, selisih -5.000 (Kurang)
    const dep2 = samplePayload.deposits.find(d => d.id === 'seed-dep-2');
    expect(dep2?.expectedAmount).toBe(2072100);
    expect(dep2?.receivedAmount).toBe(2067100);
    expect(dep2?.discrepancy).toBe(-5000);
  });

  it('4. Periode 3 (berjalan, Minggu 1 Nov 2026)', () => {
    // Engine evaluasi pada Minggu 1 Nov 2026 23:59
    const summaryAll = runStoreFinancialEngine(samplePayload, SAMPLE_PRODUCTS, '2026-11-01T23:59:59Z');

    // Sisa disetor = Setoran seharusnya - Setoran diterima sebelumnya
    // Setoran diterima = 1.660.500 + 2.067.100 = 3.727.600
    // Setoran seharusnya kumulatif = (P1: 1.660.500) + (P2: 2.072.100) + (Minggu: 20.000 - 10.000 = 10.000)
    // = 3.742.600 (sebelum dikurangi selisih)
    // Sisa disetor pada periode berjalan adalah 10.000 (dari jasa Minggu 20.000 - biaya laci 10.000)
    expect(summaryAll.remainingDeposit).toBe(10000);
  });

  it('5. Minggu Penuh 26 Okt – 1 Nov: Semua Angka Harapan Golden', () => {
    const summaryAll = runStoreFinancialEngine(samplePayload, SAMPLE_PRODUCTS, '2026-11-01T23:59:59Z');

    // Untung Kotor 3.686.600
    expect(summaryAll.untungKotor.min).toBe(3686600);
    // Setoran 2 kali, total diterima 3.727.600
    expect(summaryAll.totalDeposits).toBe(3727600);
    // Pengeluaran 88.000
    expect(summaryAll.expensesTotal).toBe(88000);
    // Pemasukan jasa 132.000
    expect(summaryAll.otherIncomeTotal).toBe(132000);
    // Untung Bersih 3.730.600
    expect(summaryAll.untungBersih?.min).toBe(3730600);

    // Uang di tangan = Setoran diterima (3.727.600) − Belanja dari setoran (1.780.600) − Pengambilan pribadi (100.000) = 1.847.000
    expect(summaryAll.uangDiTangan).toBe(1847000);

    // Sisa dana belanja = Untung Bersih (3.730.600) − Belanja bersumber setoran (1.780.600) = 1.950.000
    expect(summaryAll.sisaDanaBelanja).toBe(1950000);

    // Status kepastian: "Perlu diperiksa" karena ada 1 barang (Kapal Api) yang modalnya belum diketahui
    expect(summaryAll.certainty).toBe('BELUM_DIKETAHUI');

    // Rincian Penjualan: semua barang yang terjual tidak ada angka negatif
    SAMPLE_PRODUCTS.forEach(p => {
      const st = summaryAll.stockByProduct.get(p.id);
      if (st) {
        expect(st.unitsSold).toBeGreaterThanOrEqual(0);
        expect(st.availableUnits).toBeGreaterThanOrEqual(0);
      }
    });

    console.log('--- HASIL ENGINE AKTUAL MINGGU CONTOH ---');
    console.log('Penjualan:', summaryAll.grossSales.min);
    console.log('Diskon:', summaryAll.discountTotal.max);
    console.log('Untung Kotor:', summaryAll.untungKotor.min);
    console.log('Untung Bersih:', summaryAll.untungBersih?.min);
    console.log('Modal Terjual (cogsKnown):', summaryAll.cogsKnown);
    console.log('Laba setelah modal:', summaryAll.labaSetelahModal?.min);
    console.log('Sisa dana belanja:', summaryAll.sisaDanaBelanja);
    console.log('Uang di tangan:', summaryAll.uangDiTangan);
    console.log('Sisa disetor:', summaryAll.remainingDeposit);
  });

  it('6. Fungsi Seed dan Remove Sample Data: Idempoten dan hanya menghapus isSample', () => {
    // Buat payload kosong
    const emptyPayload: TokoSakalaPayload = {
      products: [],
      purchaseRecords: [],
      stockMovements: [],
      salesRecords: [],
      expenses: [],
      deposits: [],
      ownerWithdrawals: [],
      otherIncomes: [],
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

    // Muat data contoh pertama kali
    const seeded1 = seedSampleData(emptyPayload);
    expect(seeded1.products.length).toBe(25);
    expect(seeded1.purchaseRecords.length).toBe(42); // 24 + 18
    expect(seeded1.stockMovements.length).toBe(53); // 25 + 3 + 25

    // Muat data contoh kedua kali (idempoten, tidak menduplikasi)
    const seeded2 = seedSampleData(seeded1);
    expect(seeded2.products.length).toBe(25);
    expect(seeded2.purchaseRecords.length).toBe(42);
    expect(seeded2.stockMovements.length).toBe(53);

    // Tambah satu rekaman asli milik pemilik (isSample: false)
    const withRealRecord: TokoSakalaPayload = {
      ...seeded2,
      expenses: [
        ...seeded2.expenses,
        {
          id: 'real-expense-1',
          occurredAt: '2026-11-02T10:00:00Z',
          description: 'Beli spidol permanen',
          amount: 15000,
          sourceMoney: 'LACI',
          isSample: false,
        },
      ],
    };

    // Hapus data contoh
    const cleaned = removeSampleData(withRealRecord);
    expect(cleaned.products.length).toBe(0);
    expect(cleaned.purchaseRecords.length).toBe(0);
    expect(cleaned.stockMovements.length).toBe(0);
    // Data asli pemilik tetap ada!
    expect(cleaned.expenses.length).toBe(1);
    expect(cleaned.expenses[0].id).toBe('real-expense-1');
  });
});
