import { describe, expect, it } from 'vitest';
import { SupabaseAdapter } from '@/storage/supabaseAdapter';
import { createDefaultPayload } from '@/storage/storageAdapter';

describe('SupabaseAdapter — Konfigurasi & Status Penyimpanan Cloud', () => {
  it('menginisialisasi status UNCONFIGURED jika kredensial belum ada', async () => {
    const adapter = new SupabaseAdapter({ url: '', anonKey: '' });
    expect(adapter.isConfigured()).toBe(false);

    const status = await adapter.getStatus();
    expect(status.isConnected).toBe(false);
    expect(status.backend).toBe('supabase');
    expect(status.errorMessage).toContain('belum diatur');
  });

  it('mengatur dan membersihkan kredensial runtime secara dinamis', async () => {
    const adapter = new SupabaseAdapter();
    adapter.setRuntimeCredentials('https://test-project.supabase.co', 'mock-anon-key');

    expect(adapter.isConfigured()).toBe(true);
    const creds = adapter.getCredentials();
    expect(creds.url).toBe('https://test-project.supabase.co');

    adapter.clearRuntimeCredentials();
    expect(adapter.isConfigured()).toBe(false);
  });

  it('mengembalikan error saat pushDocument dipanggil tanpa kredensial', async () => {
    const adapter = new SupabaseAdapter({ url: '', anonKey: '' });
    const res = await adapter.pushDocument({
      app: 'toko-sakala',
      schemaVersion: 1,
      dataVersion: 1,
      updatedAt: new Date().toISOString(),
      checksum: 'dummy-checksum',
      payload: createDefaultPayload(),
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('belum terhubung');
  });

  it('menguji utilitas auth supabaseClient: getCredentials & setCredentials', async () => {
    const { setSupabaseCredentials, getSupabaseCredentials, isSupabaseConfigured, clearSupabaseCredentials } = await import('@/auth/supabaseClient');
    setSupabaseCredentials('https://test-auth.supabase.co', 'dummy-key');
    expect(isSupabaseConfigured()).toBe(true);
    expect(getSupabaseCredentials().url).toBe('https://test-auth.supabase.co');

    clearSupabaseCredentials();
    expect(isSupabaseConfigured()).toBe(false);
  });
});
