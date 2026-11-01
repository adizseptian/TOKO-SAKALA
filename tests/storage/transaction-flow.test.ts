import { describe, expect, it } from 'vitest';
import { MockStorageAdapter } from '@/storage/mockStorageAdapter';
import { createDefaultPayload } from '@/storage/storageAdapter';
import type { PurchaseRecord, ExpenseRecord, DepositRecord, TokoSakalaPayload } from '@/storage/types';

describe('Alur Transaksi Nyata & Keutuhan Penyimpanan (Save/Load/Restore)', () => {
  it('menyimpan transaksi belanja (Catat Belanja) dan memuat ulang ke state', async () => {
    const adapter = new MockStorageAdapter();
    const doc = await adapter.loadData();
    expect(doc.dataVersion).toBe(1);

    const initialPayload = doc.payload;
    const nowIso = new Date().toISOString();

    const newPurchase: PurchaseRecord = {
      id: `purch-${Date.now()}`,
      occurredAt: nowIso,
      productId: 'indomie',
      packs: 2,
      unitsPerPack: 40,
      totalCost: 192000,
      sourceMoney: 'STORE',
    };

    const updatedPayload: TokoSakalaPayload = {
      ...initialPayload,
      purchaseRecords: [newPurchase, ...initialPayload.purchaseRecords],
      stockMovements: [
        {
          id: `mov-${Date.now()}`,
          occurredAt: nowIso,
          productId: 'indomie',
          type: 'IN_PURCHASE',
          quantity: 80,
          unit: 'pcs',
          notes: 'Belanja 2 Dus (40 pcs)',
        },
        ...initialPayload.stockMovements,
      ],
    };

    const saveResult = await adapter.saveData(updatedPayload, doc.dataVersion);
    expect(saveResult.success).toBe(true);
    expect(saveResult.dataVersion).toBe(2);

    const reloaded = await adapter.loadData();
    expect(reloaded.dataVersion).toBe(2);
    expect(reloaded.payload.purchaseRecords).toHaveLength(1);
    expect(reloaded.payload.purchaseRecords[0].totalCost).toBe(192000);
    expect(reloaded.payload.stockMovements).toHaveLength(1);
  });

  it('menyimpan setoran karyawan dengan selisih dan memuat ulang secara akurat', async () => {
    const adapter = new MockStorageAdapter();
    const doc = await adapter.loadData();

    const deposit: DepositRecord = {
      id: `dep-${Date.now()}`,
      occurredAt: new Date().toISOString(),
      expectedAmount: 1250000,
      receivedAmount: 1200000,
      discrepancy: -50000,
      notes: 'Uang kembalian kurang Rp 50.000',
    };

    const updatedPayload: TokoSakalaPayload = {
      ...doc.payload,
      deposits: [deposit, ...doc.payload.deposits],
    };

    const saveResult = await adapter.saveData(updatedPayload, doc.dataVersion);
    expect(saveResult.success).toBe(true);

    const reloaded = await adapter.loadData();
    expect(reloaded.payload.deposits[0].discrepancy).toBe(-50000);
    expect(reloaded.payload.deposits[0].receivedAmount).toBe(1200000);
  });

  it('menyimpan biaya toko operasional dan memperbarui daftar riwayat', async () => {
    const adapter = new MockStorageAdapter();
    const doc = await adapter.loadData();

    const expense: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      occurredAt: new Date().toISOString(),
      description: 'Listrik toko & pulsa token',
      amount: 150000,
      sourceMoney: 'STORE',
    };

    const updatedPayload: TokoSakalaPayload = {
      ...doc.payload,
      expenses: [expense, ...doc.payload.expenses],
    };

    const saveResult = await adapter.saveData(updatedPayload, doc.dataVersion);
    expect(saveResult.success).toBe(true);

    const reloaded = await adapter.loadData();
    expect(reloaded.payload.expenses[0].amount).toBe(150000);
  });

  it('memulihkan cadangan dan memuat ulang seluruh isi dokumen', async () => {
    const adapter = new MockStorageAdapter();
    const doc1 = await adapter.loadData();

    // Buat cadangan versi 1
    const backup1 = await adapter.createBackup('Cadangan Versi 1');

    // Buat perubahan (Versi 2)
    const updatedPayload: TokoSakalaPayload = {
      ...doc1.payload,
      expenses: [
        {
          id: 'exp-temp',
          occurredAt: new Date().toISOString(),
          description: 'Beli galon air',
          amount: 20000,
          sourceMoney: 'STORE',
        },
      ],
    };
    await adapter.saveData(updatedPayload, doc1.dataVersion);
    const doc2 = await adapter.loadData();
    expect(doc2.dataVersion).toBe(2);
    expect(doc2.payload.expenses).toHaveLength(1);

    // Pulihkan cadangan Versi 1
    const restoreRes = await adapter.restoreBackup(backup1.id);
    expect(restoreRes.success).toBe(true);

    // Muat ulang state dokumen setelah restore
    const docRestored = await adapter.loadData();
    expect(docRestored.payload.expenses).toHaveLength(0);
  });
});
