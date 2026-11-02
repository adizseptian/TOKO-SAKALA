import { describe, expect, it } from 'vitest';
import { IndexedDBAdapter } from '@/storage/indexeddbAdapter';
import { createDefaultPayload } from '@/storage/storageAdapter';
import type { TokoSakalaPayload } from '@/storage/types';

describe('IndexedDBAdapter — Penyimpanan Lokal Offline-First', () => {
  it('berhasil menginisialisasi dan memuat dokumen awal', async () => {
    const adapter = new IndexedDBAdapter();
    const doc = await adapter.loadData();
    expect(doc.app).toBe('toko-sakala');
    expect(doc.dataVersion).toBe(1);
    expect(doc.checksum).toBeDefined();

    const status = await adapter.getStatus();
    expect(status.isConnected).toBe(true);
    expect(status.backend).toBe('indexeddb');
    expect(status.checksumStatus).toBe('VALID');
  });

  it('menyimpan pembaruan dokumen dengan penambahan versi dan antrean outbox', async () => {
    const adapter = new IndexedDBAdapter();
    const initialDoc = await adapter.loadData();

    const updatedPayload: TokoSakalaPayload = {
      ...initialDoc.payload,
      expenses: [
        {
          id: 'exp-local-1',
          occurredAt: new Date().toISOString(),
          description: 'Beli sedotan & kresek',
          amount: 15000,
          sourceMoney: 'LACI',
        },
      ],
    };

    const res = await adapter.saveData(updatedPayload, initialDoc.dataVersion);
    expect(res.success).toBe(true);
    expect(res.dataVersion).toBe(2);

    const reloaded = await adapter.loadData();
    expect(reloaded.dataVersion).toBe(2);
    expect(reloaded.payload.expenses).toHaveLength(1);
    expect(reloaded.payload.expenses[0].amount).toBe(15000);

    const pending = await adapter.getPendingMutations();
    expect(pending.length).toBeGreaterThan(0);
    expect(pending[0].status).toBe('PENDING');
  });

  it('membuat cadangan lokal dan memulihkannya dengan snapshot pengaman', async () => {
    const adapter = new IndexedDBAdapter();
    const doc = await adapter.loadData();

    const backup = await adapter.createBackup('Cadangan Uji');
    expect(backup.dataVersion).toBe(doc.dataVersion);
    expect(backup.fileName).toContain('toko-sakala-backup-');

    const backups = await adapter.listBackups();
    expect(backups.some((b) => b.id === backup.id)).toBe(true);

    const restoreRes = await adapter.restoreBackup(backup.id);
    expect(restoreRes.success).toBe(true);
    expect(restoreRes.preRestoreSnapshotId).toBeDefined();
  });

  it('mengekspor dan mengimpor file JSON dengan verifikasi integritas', async () => {
    const adapter = new IndexedDBAdapter();
    const jsonStr = await adapter.exportAsJson();
    expect(jsonStr).toContain('toko-sakala');

    const importRes = await adapter.importFromJson(jsonStr);
    expect(importRes.success).toBe(true);
  });

  it('mendukung idempotencyKey dan deviceId dalam penyimpanan transaksi', async () => {
    const adapter = new IndexedDBAdapter();
    const initialDoc = await adapter.loadData();
    const customIdempotencyKey = 'idempotent-tx-999-device-a';

    const updatedPayload: TokoSakalaPayload = {
      ...initialDoc.payload,
      purchaseRecords: [
        {
          id: 'p-idem-1',
          occurredAt: new Date().toISOString(),
          productId: 'indomie',
          packs: 1,
          unitsPerPack: 40,
          totalCost: 96000,
          sourceMoney: 'SETORAN',
        },
      ],
    };

    const res = await adapter.saveData(updatedPayload, initialDoc.dataVersion, {
      idempotencyKey: customIdempotencyKey,
      deviceId: 'device-mobile-pos-1',
    });

    expect(res.success).toBe(true);

    const pending = await adapter.getPendingMutations();
    const matched = pending.find((m) => m.id === customIdempotencyKey);
    expect(matched).toBeDefined();
    expect(matched?.idempotencyKey).toBe(customIdempotencyKey);
    expect(matched?.deviceId).toBe('device-mobile-pos-1');
  });

  it('memeriksa pemanggilan requestPersistentStorage secara aman di lingkungan uji', async () => {
    const adapter = new IndexedDBAdapter();
    const persisted = await adapter.requestPersistentStorage();
    expect(typeof persisted).toBe('boolean');
  });
});
