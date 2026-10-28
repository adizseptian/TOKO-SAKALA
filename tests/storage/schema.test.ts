import { describe, expect, it } from 'vitest';
import {
  TokoSakalaDocumentSchema,
  TokoSakalaPayloadSchema,
  StorageProductSchema,
  DepositRecordSchema,
} from '@/storage/types';
import { createDefaultPayload } from '@/storage/storageAdapter';

describe('Storage Schema & Domain Integrity Rules', () => {
  it('memvalidasi payload bawaan dengan benar', () => {
    const defaultPayload = createDefaultPayload();
    const result = TokoSakalaPayloadSchema.safeParse(defaultPayload);
    expect(result.success).toBe(true);
  });

  it('menolak nominal rupiah negatif atau desimal', () => {
    const invalidProduct = {
      id: 'test',
      name: 'Barang Uji',
      category: 'Makanan',
      unit: 'Pcs',
      packSize: 1,
      costPerPack: -1000, // negatif tidak diperbolehkan
      sellingPricePerUnit: 2000,
    };
    expect(StorageProductSchema.safeParse(invalidProduct).success).toBe(false);

    const decimalProduct = {
      ...invalidProduct,
      costPerPack: 1500.5, // desimal tidak diperbolehkan
    };
    expect(StorageProductSchema.safeParse(decimalProduct).success).toBe(false);
  });

  it('mengizinkan modal tidak diketahui (null/undefined) tanpa memaksakan angka 0', () => {
    const productWithUnknownCost = {
      id: 'unknown-cost-item',
      name: 'Krupuk Kaleng',
      category: 'Makanan' as const,
      unit: 'Bungkus',
      packSize: 1,
      costPerPack: null, // modal tidak diketahui tetap null
      sellingPricePerUnit: 2000,
      active: true,
      icon: '🍘',
    };
    const parsed = StorageProductSchema.safeParse(productWithUnknownCost);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.costPerPack).toBeNull();
    }
  });

  it('memvalidasi record setoran dengan expectedAmount, receivedAmount, dan selisih bertanda', () => {
    const deposit = {
      id: 'dep-1',
      occurredAt: '2026-10-28T09:00:00Z',
      expectedAmount: 1250000,
      receivedAmount: 1200000,
      discrepancy: -50000, // Selisih negatif: karyawan menyerahkan kurang Rp 50.000
      notes: 'Uang kembalian kurang Rp 50.000',
    };
    const parsed = DepositRecordSchema.safeParse(deposit);
    expect(parsed.success).toBe(true);
  });

  it('menolak dokumen dengan checksum bukan 64 hex characters', () => {
    const doc = {
      app: 'toko-sakala',
      schemaVersion: 1,
      dataVersion: 1,
      updatedAt: '2026-10-28T09:00:00Z',
      checksum: 'too-short',
      payload: createDefaultPayload(),
    };
    expect(TokoSakalaDocumentSchema.safeParse(doc).success).toBe(false);
  });
});
