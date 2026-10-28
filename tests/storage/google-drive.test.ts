import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GoogleDriveAdapter } from '@/storage/googleDriveAdapter';
import type { TokoSakalaDocument } from '@/storage/types';
import { createDefaultPayload } from '@/storage/storageAdapter';
import { computeSha256 } from '@/storage/checksum';

describe('GoogleDriveAdapter REST API v3 Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('mengembalikan status tidak terhubung jika token akses tidak tersedia', async () => {
    const adapter = new GoogleDriveAdapter({
      getAccessToken: async () => null,
      userEmail: 'adizseptian@gmail.com',
    });

    const status = await adapter.getStatus();
    expect(status.isConnected).toBe(false);
    expect(status.userEmail).toBeNull();
  });

  it('mencari file toko yang ada dan mengunduhnya dengan verifikasi SHA-256', async () => {
    const payload = createDefaultPayload();
    const checksum = await computeSha256(payload);
    const mockDoc: TokoSakalaDocument = {
      app: 'toko-sakala',
      schemaVersion: 1,
      dataVersion: 3,
      updatedAt: '2026-10-28T09:00:00Z',
      checksum,
      payload,
    };

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/about?')) {
        return Promise.resolve(new Response(JSON.stringify({ user: { emailAddress: 'adizseptian@gmail.com' } })));
      }
      if (url.includes('/files?q=')) {
        // Search file
        return Promise.resolve(new Response(JSON.stringify({ files: [{ id: 'drive-file-123', name: 'toko-sakala-data.json' }] })));
      }
      if (url.includes('/files/drive-file-123?alt=media')) {
        // Download file
        return Promise.resolve(new Response(JSON.stringify(mockDoc)));
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });

    vi.stubGlobal('fetch', mockFetch);

    const adapter = new GoogleDriveAdapter({
      getAccessToken: async () => 'mock-oauth-token',
      userEmail: 'adizseptian@gmail.com',
    });

    const connected = await adapter.connect();
    expect(connected).toBe(true);

    const doc = await adapter.loadData();
    expect(doc.dataVersion).toBe(3);
    expect(doc.checksum).toBe(checksum);

    const status = await adapter.getStatus();
    expect(status.isConnected).toBe(true);
    expect(status.checksumStatus).toBe('VALID');
  });

  it('menolak memuat data dan menandai CORRUPT jika checksum pada Google Drive tidak cocok', async () => {
    const payload = createDefaultPayload();
    const mockDoc: TokoSakalaDocument = {
      app: 'toko-sakala',
      schemaVersion: 1,
      dataVersion: 1,
      updatedAt: '2026-10-28T09:00:00Z',
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // Checksum tidak cocok
      payload,
    };

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/files?q=')) {
        return Promise.resolve(new Response(JSON.stringify({ files: [{ id: 'drive-file-123', name: 'toko-sakala-data.json' }] })));
      }
      if (url.includes('/files/drive-file-123?alt=media')) {
        return Promise.resolve(new Response(JSON.stringify(mockDoc)));
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });

    vi.stubGlobal('fetch', mockFetch);

    const adapter = new GoogleDriveAdapter({
      getAccessToken: async () => 'mock-oauth-token',
      userEmail: 'adizseptian@gmail.com',
    });

    await expect(adapter.loadData()).rejects.toThrow('Integritas data gagal');

    const status = await adapter.getStatus();
    expect(status.checksumStatus).toBe('CORRUPT');
  });
});
