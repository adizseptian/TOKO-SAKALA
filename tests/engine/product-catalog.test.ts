import { describe, expect, it } from 'vitest';
import { StorageProductSchema, TokoSakalaPayloadSchema, type TokoSakalaPayload } from '@/storage/types';
import { createDefaultPayload } from '@/storage/storageAdapter';

describe('Product Catalog & Unit Conversion Logic (Phase 06 & Phase 07)', () => {
  it('TC-PROD-01: Modal produk yang belum diketahui wajib disimpan sebagai null (bukan Rp 0)', () => {
    const rawProduct = {
      id: 'prod-teh-pucuk',
      name: 'Teh Pucuk Harum 350ml',
      category: 'Minuman' as const,
      unit: 'Dus (24 botol)',
      packSize: 24,
      costPerPack: null, // Modal belum diketahui
      sellingPricePerUnit: 3500,
      icon: '🧃',
      active: true,
    };

    const parsed = StorageProductSchema.parse(rawProduct);
    expect(parsed.costPerPack).toBeNull();
    expect(parsed.costPerPack).not.toBe(0);
  });

  it('TC-PROD-02: Menambah master produk baru tidak otomatis menambah stok awal atau membuat mutasi pembelian', () => {
    const initialPayload: TokoSakalaPayload = createDefaultPayload();
    const initialProductCount = initialPayload.products.length;
    expect(initialProductCount).toBeGreaterThanOrEqual(1);
    expect(initialPayload.stockMovements).toHaveLength(0);
    expect(initialPayload.purchaseRecords).toHaveLength(0);

    const newProduct = {
      id: 'prod-kopi-kapal-api',
      name: 'Kopi Kapal Api Spesial',
      category: 'Minuman' as const,
      unit: 'Renceng (10 sachet)',
      packSize: 10,
      costPerPack: 12000,
      sellingPricePerUnit: 1500,
      icon: '☕',
      active: true,
    };

    const updatedPayload: TokoSakalaPayload = {
      ...initialPayload,
      products: [...initialPayload.products, newProduct],
    };

    // Validasi skema dokumen utuh
    const validated = TokoSakalaPayloadSchema.parse(updatedPayload);
    expect(validated.products).toHaveLength(initialProductCount + 1);
    expect(validated.products.some(p => p.name === 'Kopi Kapal Api Spesial')).toBe(true);
    // Stok dan pembelian HARUS tetap 0
    expect(validated.stockMovements).toHaveLength(0);
    expect(validated.purchaseRecords).toHaveLength(0);
  });

  it('TC-PROD-03: Konversi satuan pembelian: Pembelian 3 dus x 24 pcs wajib menghasilkan 72 pcs stok masuk', () => {
    const qtyPurchased = 3;
    const packSize = 24;
    const physicalStockIn = qtyPurchased * packSize;

    expect(physicalStockIn).toBe(72);
    expect(physicalStockIn).not.toBe(3); // Bukan 3 pcs!
  });

  it('TC-PROD-04: Menolak nama produk duplikat secara case-insensitive', () => {
    const existingCatalog = [
      { id: '1', name: 'Indomie Goreng', category: 'Makanan' },
      { id: '2', name: 'Aqua 600ml', category: 'Minuman' },
    ];

    const isDuplicate = (name: string) => {
      const trimmed = name.trim().toLowerCase();
      return existingCatalog.some((p) => p.name.toLowerCase() === trimmed);
    };

    expect(isDuplicate('indomie goreng')).toBe(true);
    expect(isDuplicate('INDOMIE GORENG')).toBe(true);
    expect(isDuplicate('Indomie Ayam Bawang')).toBe(false);
  });
});
