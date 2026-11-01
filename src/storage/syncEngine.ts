import { type IndexedDBAdapter } from './indexeddbAdapter';
import { type SupabaseAdapter } from './supabaseAdapter';
import { type TokoSakalaDocument } from './types';

export interface SyncEngineStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  lastError: string | null;
  supabaseConnected: boolean;
}

export type SyncListener = (status: SyncEngineStatus) => void;

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  pulledUpdate: boolean;
  error?: string;
}

export class SyncEngine {
  private localAdapter: IndexedDBAdapter;
  private cloudAdapter: SupabaseAdapter;
  private isOnline: boolean;
  private isSyncing: boolean = false;
  private lastSyncedAt: string | null = null;
  private lastError: string | null = null;
  private listeners: Set<SyncListener> = new Set();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(localAdapter: IndexedDBAdapter, cloudAdapter: SupabaseAdapter) {
    this.localAdapter = localAdapter;
    this.cloudAdapter = cloudAdapter;
    this.isOnline =
      typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
        ? navigator.onLine
        : true;

    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnlineEvent);
      window.addEventListener('offline', this.handleOfflineEvent);
    }
  }

  private handleOnlineEvent = () => {
    this.isOnline = true;
    this.notify();
    this.syncNow().catch(() => {});
  };

  private handleOfflineEvent = () => {
    this.isOnline = false;
    this.notify();
  };

  start(intervalMs: number = 30000): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = setInterval(() => {
      if (this.isOnline && this.cloudAdapter.isConfigured() && !this.isSyncing) {
        this.syncNow().catch(() => {});
      }
    }, intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnlineEvent);
      window.removeEventListener('offline', this.handleOfflineEvent);
    }
  }

  getStatus(): SyncEngineStatus {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: 0,
      lastSyncedAt: this.lastSyncedAt,
      lastError: this.lastError,
      supabaseConnected: this.cloudAdapter.isConfigured(),
    };
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const status = this.getStatus();
    this.listeners.forEach((l) => l(status));
  }

  /**
   * Menjalankan sinkronisasi dua arah:
   * 1. Ambil mutasi outbox dari IndexedDB dan dorong dokumen terbaru ke Supabase.
   * 2. Tarik dokumen cloud jika ada versi yang lebih baru dan mutasikan ke IndexedDB.
   */
  async syncNow(): Promise<SyncResult> {
    if (!this.cloudAdapter.isConfigured()) {
      return {
        success: false,
        syncedCount: 0,
        pulledUpdate: false,
        error: 'Supabase belum dikonfigurasi. Mode offline-first lokal tetap aktif.',
      };
    }

    if (!this.isOnline) {
      return {
        success: false,
        syncedCount: 0,
        pulledUpdate: false,
        error: 'Perangkat sedang luring (offline). Sinkronisasi ditunda sampai koneksi pulih.',
      };
    }

    this.isSyncing = true;
    this.notify();

    try {
      const localDoc = await this.localAdapter.loadData();
      const pendingMutations = await this.localAdapter.getPendingMutations();

      let syncedCount = 0;
      let pulledUpdate = false;

      // 1. Jika ada perubahan lokal yang tertunda, dorong ke cloud
      if (pendingMutations.length > 0) {
        const pushRes = await this.cloudAdapter.pushDocument(localDoc);
        if (!pushRes.success) {
          throw new Error(pushRes.error || 'Gagal mengirim mutasi ke Supabase.');
        }

        // Tandai mutasi sebagai berhasil terkirim
        for (const item of pendingMutations) {
          await this.localAdapter.markMutationSynced(item.id);
          syncedCount++;
        }
      } else {
        // 2. Jika tidak ada mutasi lokal tertunda, cek apakah ada update di cloud (pull)
        const cloudDoc = await this.cloudAdapter.pullDocument();
        if (cloudDoc && cloudDoc.dataVersion > localDoc.dataVersion) {
          // Versi cloud lebih baru, selaraskan dokumen lokal
          await this.localAdapter.saveData(cloudDoc.payload, localDoc.dataVersion);
          pulledUpdate = true;
        }
      }

      this.lastSyncedAt = new Date().toISOString();
      this.lastError = null;
      this.isSyncing = false;
      this.notify();

      return {
        success: true,
        syncedCount,
        pulledUpdate,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Kesalahan sinkronisasi.';
      this.lastError = msg;
      this.isSyncing = false;
      this.notify();

      return {
        success: false,
        syncedCount: 0,
        pulledUpdate: false,
        error: msg,
      };
    }
  }
}
