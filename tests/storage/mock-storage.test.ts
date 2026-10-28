import { describe, expect, it } from 'vitest';
import { MockStorageAdapter } from '@/storage/mockStorageAdapter';
import { createDefaultPayload } from '@/storage/storageAdapter';

describe('MockStorageAdapter Lifecycle & Operations', () => {
  it('berhasil memuat dokumen awal dengan checksum valid', async () => {
    const adapter = new MockStorageAdapter();
    const doc = await adapter.loadData();

    expect(doc.app).toBe('toko-sakala');
    expect(doc.schemaVersion).toBe(1);
    expect(doc.dataVersion).toBe(1);
    expect(doc.checksum).toHaveLength(64);
    expect(doc.payload.products.length).toBeGreaterThan(0);

    const status = await adapter.getStatus();
    expect(status.isConnected).toBe(true);
    expect(status.checksumStatus).toBe('VALID');
    expect(status.dataVersion).toBe(1);
  });

  it('menaikkan versi data dan memperbarui checksum saat menyimpan data baru', async () => {
    const adapter = new MockStorageAdapter();
    const doc = await adapter.loadData();
    const initialChecksum = doc.checksum;

    const modifiedPayload = {
      ...doc.payload,
      expenses: [
        {
          id: 'exp-1',
          occurredAt: '2026-10-28T07:20:00Z',
          description: 'Listrik toko',
          amount: 150000,
          sourceMoney: 'STORE' as const,
        },
      ],
    };

    const saveRes = await adapter.saveData(modifiedPayload, doc.dataVersion);
    expect(saveRes.success).toBe(true);
    expect(saveRes.dataVersion).toBe(2);
    expect(saveRes.checksum).toHaveLength(64);
    expect(saveRes.checksum).not.toBe(initialChecksum);

    const reloaded = await adapter.loadData();
    expect(reloaded.dataVersion).toBe(2);
    expect(reloaded.payload.expenses).toHaveLength(1);
    expect(reloaded.payload.expenses[0].amount).toBe(150000);
  });

  it('mencegah konflik konkurensi (optimistic locking) jika baseVersion tidak cocok', async () => {
    const adapter = new MockStorageAdapter();
    const doc = await adapter.loadData();

    // Simpan versi 2
    await adapter.saveData(doc.payload, 1);

    // Coba simpan lagi dengan baseVersion lama (1)
    const conflictRes = await adapter.saveData(doc.payload, 1);
    expect(conflictRes.success).toBe(false);
    expect(conflictRes.error).toContain('Konflik versi data');
  });

  it('mendeteksi korupsi data dan menolak pemuatan jika checksum tidak cocok', async () => {
    const adapter = new MockStorageAdapter();
    await adapter.loadData();

    // Sengaja merusak payload data di storage
    adapter._corruptPayloadForTesting('products');

    await expect(adapter.loadData()).rejects.toThrow('Data korup');

    const status = await adapter.getStatus();
    expect(status.checksumStatus).toBe('CORRUPT');
  });

  it('dapat membuat cadangan, mendaftar cadangan, dan memulihkan dengan snapshot pengaman', async () => {
    const adapter = new MockStorageAdapter();
    const initialDoc = await adapter.loadData();

    // 1. Buat backup v1
    const backupV1 = await adapter.createBackup('Cadangan Baseline v1');
    expect(backupV1.dataVersion).toBe(1);
    expect(backupV1.label).toBe('Cadangan Baseline v1');

    // 2. Simpan data baru menjadi v2
    const updatedPayload = {
      ...initialDoc.payload,
      products: [], // Semua produk dihapus pada v2
    };
    await adapter.saveData(updatedPayload, 1);
    const docV2 = await adapter.loadData();
    expect(docV2.payload.products).toHaveLength(0);

    // 3. Ambil daftar cadangan
    const backups = await adapter.listBackups();
    expect(backups.length).toBeGreaterThanOrEqual(1);
    expect(backups[0].id).toBe(backupV1.id);

    // 4. Pulihkan ke backupV1
    const restoreRes = await adapter.restoreBackup(backupV1.id);
    expect(restoreRes.success).toBe(true);
    expect(restoreRes.preRestoreSnapshotId).toBeDefined();

    // 5. Verifikasi bahwa data v1 telah pulih
    const restoredDoc = await adapter.loadData();
    expect(restoredDoc.payload.products.length).toBeGreaterThan(0);

    // 6. Verifikasi snapshot pengaman otomatis juga tersimpan di list backups
    const backupsAfterRestore = await adapter.listBackups();
    expect(backupsAfterRestore.length).toBeGreaterThan(1);
  });
});
