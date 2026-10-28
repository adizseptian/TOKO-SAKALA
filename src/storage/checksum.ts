/**
 * SHA-256 Checksum Utility for TOKO SAKALA Storage Integrity
 *
 * Menggunakan standard Web Crypto API (crypto.subtle) yang didukung di peramban modern
 * dan Node.js 18+. Beroperasi secara deterministik dengan mengurutkan key objek JSON.
 */

function sortObjectKeys(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(sortObjectKeys);
  }
  const obj = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = sortObjectKeys(obj[key]);
  }
  return sorted;
}

/**
 * Serialisasi objek ke JSON deterministik (canonical string)
 */
export function canonicalizeJson(data: unknown): string {
  const sorted = sortObjectKeys(data);
  return JSON.stringify(sorted);
}

/**
 * Menghitung SHA-256 hex string dari payload teks atau objek
 */
export async function computeSha256(input: string | unknown): Promise<string> {
  const text = typeof input === 'string' ? input : canonicalizeJson(input);
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  // Web Crypto API (tersedia di browser dan Node.js)
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback Node.js crypto jika crypto.subtle tidak tersedia di lingkungan pengujian
  try {
    // Dynamic import to avoid bundling issues in pure browser builds
    const { createHash } = await import('node:crypto');
    return createHash('sha256').update(data).digest('hex');
  } catch {
    throw new Error('SHA-256 implementation is not available in the current environment.');
  }
}

/**
 * Memvalidasi apakah checksum yang tercatat cocok dengan payload
 */
export async function verifyChecksum(payload: unknown, expectedChecksum: string): Promise<boolean> {
  if (!expectedChecksum || expectedChecksum.length !== 64) {
    return false;
  }
  const actualChecksum = await computeSha256(payload);
  return actualChecksum.toLowerCase() === expectedChecksum.toLowerCase();
}
