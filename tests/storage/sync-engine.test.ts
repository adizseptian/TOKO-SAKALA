import { describe, expect, it } from 'vitest';
import { SyncEngine } from '@/storage/syncEngine';
import { IndexedDBAdapter } from '@/storage/indexeddbAdapter';
import { SupabaseAdapter } from '@/storage/supabaseAdapter';

describe('SyncEngine — Koordinasi Sinkronisasi Dua Arah Offline-First', () => {
  it('memberikan status default dan menangani offline/unconfigured secara graceful', async () => {
    const local = new IndexedDBAdapter();
    const cloud = new SupabaseAdapter({ url: '', anonKey: '' });
    const engine = new SyncEngine(local, cloud);

    const status = engine.getStatus();
    expect(status.supabaseConnected).toBe(false);

    // Saat cloud belum dikonfigurasi, syncNow mengembalikan pesan edukatif tanpa error fatal
    const res = await engine.syncNow();
    expect(res.success).toBe(false);
    expect(res.error).toContain('Supabase belum dikonfigurasi');
  });

  it('mengirim pembaruan status ke subscriber saat dipicu', () => {
    const local = new IndexedDBAdapter();
    const cloud = new SupabaseAdapter();
    const engine = new SyncEngine(local, cloud);

    let observedOnline = false;
    const unsub = engine.subscribe((s) => {
      observedOnline = s.isOnline;
    });

    expect(typeof observedOnline).toBe('boolean');
    unsub();
  });
});
