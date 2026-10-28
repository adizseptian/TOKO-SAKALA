import { describe, expect, it } from 'vitest';
import { canonicalizeJson, computeSha256, verifyChecksum } from '@/storage/checksum';

describe('Checksum SHA-256 Storage Integrity', () => {
  it('menghasilkan JSON canonical yang deterministik terlepas dari urutan properti', () => {
    const objA = { z: 1, a: 2, m: { b: 3, a: 4 } };
    const objB = { a: 2, z: 1, m: { a: 4, b: 3 } };

    const jsonA = canonicalizeJson(objA);
    const jsonB = canonicalizeJson(objB);

    expect(jsonA).toBe(jsonB);
    expect(jsonA).toBe('{"a":2,"m":{"a":4,"b":3},"z":1}');
  });

  it('menghasilkan hash 64 karakter heksadesimal yang konsisten', async () => {
    const data = { app: 'toko-sakala', version: 1 };
    const hash1 = await computeSha256(data);
    const hash2 = await computeSha256(data);

    expect(hash1).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(hash1)).toBe(true);
    expect(hash1).toBe(hash2);
  });

  it('mendeteksi perubahan kecil pada payload (tamper-detection)', async () => {
    const original = { balance: 1000000, shop: 'TOKO SAKALA' };
    const tampered = { balance: 1000001, shop: 'TOKO SAKALA' };

    const originalHash = await computeSha256(original);
    const tamperedHash = await computeSha256(tampered);

    expect(originalHash).not.toBe(tamperedHash);

    const isValidOriginal = await verifyChecksum(original, originalHash);
    const isValidTampered = await verifyChecksum(tampered, originalHash);

    expect(isValidOriginal).toBe(true);
    expect(isValidTampered).toBe(false);
  });

  it('mengembalikan false jika format checksum yang diharapkan tidak valid', async () => {
    const data = { test: true };
    expect(await verifyChecksum(data, '')).toBe(false);
    expect(await verifyChecksum(data, 'short-hash')).toBe(false);
  });
});
