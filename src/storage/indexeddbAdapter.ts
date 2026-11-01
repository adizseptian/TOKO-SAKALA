import {
  type StorageAdapter,
  createDefaultPayload,
} from './storageAdapter';
import {
  type TokoSakalaDocument,
  type TokoSakalaPayload,
  type BackupMetadata,
  type StorageStatus,
  type SaveResult,
  type RestoreResult,
  TokoSakalaDocumentSchema,
} from './types';
import { computeSha256, verifyChecksum } from './checksum';

const DB_NAME = 'toko_sakala_offline_db';
const DB_VERSION = 1;
const DOC_STORE = 'document_store';
const BACKUP_STORE = 'backup_store';
const OUTBOX_STORE = 'outbox_queue';
const DOC_KEY = 'main_document';

export interface OutboxItem {
  id: string;
  idempotencyKey?: string;
  deviceId?: string;
  action: string;
  payload: unknown;
  createdAt: string;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  retryCount?: number;
}

/**
 * IndexedDBAdapter — Implementasi Penyimpanan Offline-First Berkinerja Tinggi
 * Berjalan 100% di browser pengguna tanpa ketergantungan koneksi jaringan.
 * Memiliki fallback memory transparan untuk lingkungan unit test (Node.js/Vitest).
 */
export class IndexedDBAdapter implements StorageAdapter {
  readonly backendType = 'indexeddb' as const;

  private connected: boolean = true;
  private memoryDoc: TokoSakalaDocument | null = null;
  private memoryBackups: Map<string, { meta: BackupMetadata; content: string }> = new Map();
  private memoryOutbox: Map<string, OutboxItem> = new Map();
  private isBrowserIndexedDB: boolean;

  constructor() {
    this.isBrowserIndexedDB = typeof window !== 'undefined' && 'indexedDB' in window;
  }

  private async openDB(): Promise<IDBDatabase> {
    if (!this.isBrowserIndexedDB) {
      throw new Error('IndexedDB tidak tersedia di lingkungan non-browser.');
    }

    return new Promise((resolve, reject) => {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(DOC_STORE)) {
          db.createObjectStore(DOC_STORE);
        }
        if (!db.objectStoreNames.contains(BACKUP_STORE)) {
          db.createObjectStore(BACKUP_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
          db.createObjectStore(OUTBOX_STORE, { keyPath: 'id' });
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async connect(): Promise<boolean> {
    this.connected = true;
    if (this.isBrowserIndexedDB) {
      try {
        const db = await this.openDB();
        db.close();
      } catch {
        // Fallback to memory
        this.isBrowserIndexedDB = false;
      }
    }
    return true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  /**
   * Meminta peramban agar penyimpanan IndexedDB tidak dihapus otomatis saat disk menipis
   * Menggunakan API standar navigator.storage.persist()
   */
  async requestPersistentStorage(): Promise<boolean> {
    if (
      typeof navigator !== 'undefined' &&
      navigator.storage &&
      typeof navigator.storage.persist === 'function'
    ) {
      try {
        const isPersisted = typeof navigator.storage.persisted === 'function'
          ? await navigator.storage.persisted()
          : false;
        if (isPersisted) return true;
        return await navigator.storage.persist();
      } catch (err) {
        console.warn('Gagal meminta persistensi penyimpanan:', err);
        return false;
      }
    }
    return false;
  }

  async getStatus(): Promise<StorageStatus> {
    if (!this.connected) {
      return {
        backend: this.backendType,
        isConnected: false,
        userEmail: null,
        lastSyncedAt: null,
        dataVersion: 0,
        isDirty: false,
        checksumStatus: 'UNCHECKED',
        errorMessage: 'Penyimpanan lokal terputus.',
      };
    }

    try {
      const doc = await this.loadData();
      const valid = await verifyChecksum(doc.payload, doc.checksum);

      return {
        backend: this.backendType,
        isConnected: true,
        userEmail: 'Penyimpanan Lokal (Offline-First)',
        lastSyncedAt: doc.updatedAt,
        dataVersion: doc.dataVersion,
        isDirty: false,
        checksumStatus: valid ? 'VALID' : 'CORRUPT',
      };
    } catch {
      return {
        backend: this.backendType,
        isConnected: true,
        userEmail: 'Penyimpanan Lokal (Offline-First)',
        lastSyncedAt: null,
        dataVersion: 0,
        isDirty: false,
        checksumStatus: 'UNCHECKED',
      };
    }
  }

  async loadData(): Promise<TokoSakalaDocument> {
    if (!this.connected) {
      throw new Error('Penyimpanan lokal IndexedDB tidak terhubung.');
    }

    if (this.isBrowserIndexedDB) {
      const db = await this.openDB();
      return new Promise<TokoSakalaDocument>((resolve, reject) => {
        const tx = db.transaction(DOC_STORE, 'readonly');
        const store = tx.objectStore(DOC_STORE);
        const req = store.get(DOC_KEY);

        req.onsuccess = async () => {
          if (!req.result) {
            // Inisialisasi dokumen baru jika kosong
            const initialPayload = createDefaultPayload();
            const now = new Date().toISOString();
            const checksum = await computeSha256(initialPayload);
            const initialDoc: TokoSakalaDocument = {
              app: 'toko-sakala',
              schemaVersion: 1,
              dataVersion: 1,
              updatedAt: now,
              checksum,
              payload: initialPayload,
            };

            const writeTx = db.transaction(DOC_STORE, 'readwrite');
            writeTx.objectStore(DOC_STORE).put(initialDoc, DOC_KEY);
            writeTx.oncomplete = () => resolve(initialDoc);
            writeTx.onerror = () => reject(writeTx.error);
          } else {
            const doc = req.result as TokoSakalaDocument;
            const valid = await verifyChecksum(doc.payload, doc.checksum);
            if (!valid) {
              reject(new Error('Integritas data lokal gagal: Checksum SHA-256 tidak cocok.'));
            } else {
              resolve(doc);
            }
          }
        };
        req.onerror = () => reject(req.error);
      });
    }

    // In-memory fallback
    if (!this.memoryDoc) {
      const initialPayload = createDefaultPayload();
      const now = new Date().toISOString();
      const checksum = await computeSha256(initialPayload);
      this.memoryDoc = {
        app: 'toko-sakala',
        schemaVersion: 1,
        dataVersion: 1,
        updatedAt: now,
        checksum,
        payload: initialPayload,
      };
    }

    const valid = await verifyChecksum(this.memoryDoc.payload, this.memoryDoc.checksum);
    if (!valid) {
      throw new Error('Integritas data lokal gagal: Checksum SHA-256 tidak cocok.');
    }
    return JSON.parse(JSON.stringify(this.memoryDoc));
  }

  async saveData(
    payload: TokoSakalaPayload,
    baseVersion?: number,
    options?: { idempotencyKey?: string; deviceId?: string }
  ): Promise<SaveResult> {
    if (!this.connected) {
      return {
        success: false,
        dataVersion: 0,
        updatedAt: new Date().toISOString(),
        checksum: '',
        error: 'Penyimpanan lokal tidak terhubung.',
      };
    }

    try {
      const currentDoc = await this.loadData();
      if (baseVersion !== undefined && baseVersion !== currentDoc.dataVersion) {
        return {
          success: false,
          dataVersion: currentDoc.dataVersion,
          updatedAt: currentDoc.updatedAt,
          checksum: '',
          error: `Konflik versi: Versi lokal (${baseVersion}) tidak sesuai dengan versi penyimpanan (${currentDoc.dataVersion}).`,
        };
      }

      const nextVersion = currentDoc.dataVersion + 1;
      const now = new Date().toISOString();
      const checksum = await computeSha256(payload);

      const nextDoc: TokoSakalaDocument = {
        app: 'toko-sakala',
        schemaVersion: 1,
        dataVersion: nextVersion,
        updatedAt: now,
        checksum,
        payload,
      };

      // Validasi skema
      TokoSakalaDocumentSchema.parse(nextDoc);

      const outboxId = options?.idempotencyKey || `mutation-${nextVersion}-${Date.now()}`;
      const outboxItem: OutboxItem = {
        id: outboxId,
        idempotencyKey: options?.idempotencyKey,
        deviceId: options?.deviceId,
        action: 'SAVE_DOC',
        payload: nextDoc,
        createdAt: now,
        status: 'PENDING',
      };

      if (this.isBrowserIndexedDB) {
        const db = await this.openDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction([DOC_STORE, OUTBOX_STORE], 'readwrite');
          tx.objectStore(DOC_STORE).put(nextDoc, DOC_KEY);

          // Masukkan ke outbox untuk antrean sinkronisasi
          tx.objectStore(OUTBOX_STORE).put(outboxItem);

          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } else {
        this.memoryDoc = JSON.parse(JSON.stringify(nextDoc));
        this.memoryOutbox.set(outboxItem.id, outboxItem);
      }

      return {
        success: true,
        dataVersion: nextVersion,
        updatedAt: now,
        checksum,
      };
    } catch (err) {
      return {
        success: false,
        dataVersion: 0,
        updatedAt: new Date().toISOString(),
        checksum: '',
        error: err instanceof Error ? err.message : 'Kesalahan menyimpan ke IndexedDB.',
      };
    }
  }

  async createBackup(label?: string): Promise<BackupMetadata> {
    const currentDoc = await this.loadData();
    const now = new Date();
    const id = `local-backup-${Date.now()}`;
    const fileName = `toko-sakala-backup-${now.toISOString().replace(/[:.]/g, '-')}.json`;
    const content = JSON.stringify(currentDoc, null, 2);
    const byteSize = new TextEncoder().encode(content).length;

    const meta: BackupMetadata = {
      id,
      fileName,
      createdAt: now.toISOString(),
      dataVersion: currentDoc.dataVersion,
      schemaVersion: currentDoc.schemaVersion,
      checksum: currentDoc.checksum,
      byteSize,
      label: label ?? 'Cadangan Lokal IndexedDB',
    };

    if (this.isBrowserIndexedDB) {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(BACKUP_STORE, 'readwrite');
        tx.objectStore(BACKUP_STORE).put({ id, meta, content });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } else {
      this.memoryBackups.set(id, { meta, content });
    }

    return meta;
  }

  async listBackups(): Promise<BackupMetadata[]> {
    if (this.isBrowserIndexedDB) {
      const db = await this.openDB();
      return new Promise<BackupMetadata[]>((resolve, reject) => {
        const tx = db.transaction(BACKUP_STORE, 'readonly');
        const req = tx.objectStore(BACKUP_STORE).getAll();
        req.onsuccess = () => {
          const items = (req.result || []) as Array<{ id: string; meta: BackupMetadata; content: string }>;
          const metas = items.map((i) => i.meta).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          resolve(metas);
        };
        req.onerror = () => reject(req.error);
      });
    }

    return Array.from(this.memoryBackups.values())
      .map((b) => b.meta)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async restoreBackup(backupId: string): Promise<RestoreResult> {
    // 1. Snapshot keselamatan wajib sebelum ditimpa
    let safetySnapshot: BackupMetadata;
    try {
      safetySnapshot = await this.createBackup('Snapshot otomatis sebelum pemulihan cadangan');
    } catch (err) {
      return {
        success: false,
        restoredVersion: 0,
        backupId,
        error: `Pemulihan dibatalkan demi keamanan data: snapshot pengaman gagal dibuat (${err instanceof Error ? err.message : 'Kesalahan snapshot'}).`,
      };
    }

    let backupContent: string | null = null;

    if (this.isBrowserIndexedDB) {
      const db = await this.openDB();
      backupContent = await new Promise<string | null>((resolve, reject) => {
        const tx = db.transaction(BACKUP_STORE, 'readonly');
        const req = tx.objectStore(BACKUP_STORE).get(backupId);
        req.onsuccess = () => resolve(req.result ? (req.result as { content: string }).content : null);
        req.onerror = () => reject(req.error);
      });
    } else {
      const item = this.memoryBackups.get(backupId);
      backupContent = item ? item.content : null;
    }

    if (!backupContent) {
      return {
        success: false,
        restoredVersion: 0,
        backupId,
        preRestoreSnapshotId: safetySnapshot.id,
        error: 'File cadangan tidak ditemukan di penyimpanan lokal.',
      };
    }

    try {
      const parsed = JSON.parse(backupContent);
      const validated = TokoSakalaDocumentSchema.parse(parsed);

      const isValidChecksum = await verifyChecksum(validated.payload, validated.checksum);
      if (!isValidChecksum) {
        return {
          success: false,
          restoredVersion: 0,
          backupId,
          preRestoreSnapshotId: safetySnapshot.id,
          error: 'Integritas cadangan gagal: Checksum SHA-256 tidak valid.',
        };
      }

      if (this.isBrowserIndexedDB) {
        const db = await this.openDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(DOC_STORE, 'readwrite');
          tx.objectStore(DOC_STORE).put(validated, DOC_KEY);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } else {
        this.memoryDoc = JSON.parse(JSON.stringify(validated));
      }

      return {
        success: true,
        restoredVersion: validated.dataVersion,
        backupId,
        preRestoreSnapshotId: safetySnapshot.id,
      };
    } catch (err) {
      return {
        success: false,
        restoredVersion: 0,
        backupId,
        preRestoreSnapshotId: safetySnapshot.id,
        error: `Gagal memulihkan: ${err instanceof Error ? err.message : 'Kesalahan format'}`,
      };
    }
  }

  async getPendingMutations(): Promise<OutboxItem[]> {
    if (this.isBrowserIndexedDB) {
      const db = await this.openDB();
      return new Promise<OutboxItem[]>((resolve, reject) => {
        const tx = db.transaction(OUTBOX_STORE, 'readonly');
        const req = tx.objectStore(OUTBOX_STORE).getAll();
        req.onsuccess = () => {
          const items = (req.result || []) as OutboxItem[];
          resolve(items.filter((i) => i.status === 'PENDING'));
        };
        req.onerror = () => reject(req.error);
      });
    }

    return Array.from(this.memoryOutbox.values()).filter((i) => i.status === 'PENDING');
  }

  async markMutationSynced(id: string): Promise<void> {
    if (this.isBrowserIndexedDB) {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(OUTBOX_STORE, 'readwrite');
        tx.objectStore(OUTBOX_STORE).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } else {
      this.memoryOutbox.delete(id);
    }
  }

  async exportAsJson(): Promise<string> {
    const doc = await this.loadData();
    return JSON.stringify(doc, null, 2);
  }

  async importFromJson(jsonStr: string): Promise<RestoreResult> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return {
        success: false,
        restoredVersion: 0,
        backupId: 'import',
        error: 'Isi file bukan JSON yang valid.',
      };
    }

    const validated = TokoSakalaDocumentSchema.safeParse(parsed);
    if (!validated.success) {
      return {
        success: false,
        restoredVersion: 0,
        backupId: 'import',
        error: 'Format data JSON tidak sesuai skema TOKO SAKALA.',
      };
    }

    // Safety snapshot
    let safetySnapshot: BackupMetadata;
    try {
      safetySnapshot = await this.createBackup('Snapshot otomatis sebelum impor JSON');
    } catch (err) {
      return {
        success: false,
        restoredVersion: 0,
        backupId: 'import',
        error: `Impor dibatalkan: gagal membuat snapshot keselamatan (${err instanceof Error ? err.message : 'Kesalahan snapshot'}).`,
      };
    }

    const doc = validated.data;
    if (this.isBrowserIndexedDB) {
      const db = await this.openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(DOC_STORE, 'readwrite');
        tx.objectStore(DOC_STORE).put(doc, DOC_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } else {
      this.memoryDoc = JSON.parse(JSON.stringify(doc));
    }

    return {
      success: true,
      restoredVersion: doc.dataVersion,
      backupId: 'import',
      preRestoreSnapshotId: safetySnapshot.id,
    };
  }
}
