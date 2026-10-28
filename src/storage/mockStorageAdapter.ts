import {
  type TokoSakalaDocument,
  type TokoSakalaPayload,
  type BackupMetadata,
  type StorageStatus,
  type SaveResult,
  type RestoreResult,
  TokoSakalaDocumentSchema,
} from './types';
import { type StorageAdapter, createDefaultPayload } from './storageAdapter';
import { computeSha256, verifyChecksum } from './checksum';

export class MockStorageAdapter implements StorageAdapter {
  readonly backendType = 'in_memory' as const;

  private connected: boolean = true;
  private currentDoc: TokoSakalaDocument | null = null;
  private backups: Map<string, { meta: BackupMetadata; content: string }> = new Map();
  private userEmail: string | null = 'adizseptian@gmail.com';

  constructor(initialPayload?: TokoSakalaPayload) {
    // Initializer will be executed asynchronously when loadData or init is invoked
    this.initialPayload = initialPayload ?? createDefaultPayload();
  }

  private initialPayload: TokoSakalaPayload;

  async connect(): Promise<boolean> {
    this.connected = true;
    return true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
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
        errorMessage: 'Penyimpanan terputus.',
      };
    }

    if (!this.currentDoc) {
      return {
        backend: this.backendType,
        isConnected: true,
        userEmail: this.userEmail,
        lastSyncedAt: null,
        dataVersion: 0,
        isDirty: false,
        checksumStatus: 'UNCHECKED',
      };
    }

    const isChecksumValid = await verifyChecksum(
      this.currentDoc.payload,
      this.currentDoc.checksum
    );

    return {
      backend: this.backendType,
      isConnected: true,
      userEmail: this.userEmail,
      lastSyncedAt: this.currentDoc.updatedAt,
      dataVersion: this.currentDoc.dataVersion,
      isDirty: false,
      checksumStatus: isChecksumValid ? 'VALID' : 'CORRUPT',
    };
  }

  async loadData(): Promise<TokoSakalaDocument> {
    if (!this.connected) {
      throw new Error('Tidak dapat memuat data: penyimpanan terputus.');
    }

    if (!this.currentDoc) {
      const now = new Date().toISOString();
      const checksum = await computeSha256(this.initialPayload);
      const newDoc: TokoSakalaDocument = {
        app: 'toko-sakala',
        schemaVersion: 1,
        dataVersion: 1,
        updatedAt: now,
        checksum,
        payload: this.initialPayload,
      };
      this.currentDoc = TokoSakalaDocumentSchema.parse(newDoc);
    }

    // Verifikasi checksum saat loading
    const isValid = await verifyChecksum(this.currentDoc.payload, this.currentDoc.checksum);
    if (!isValid) {
      throw new Error(
        'Data korup: Checksum SHA-256 tidak cocok dengan konten penyimpanan.'
      );
    }

    // Return deep copy
    return JSON.parse(JSON.stringify(this.currentDoc));
  }

  async saveData(payload: TokoSakalaPayload, baseVersion?: number): Promise<SaveResult> {
    if (!this.connected) {
      return {
        success: false,
        dataVersion: this.currentDoc?.dataVersion ?? 0,
        updatedAt: new Date().toISOString(),
        checksum: '',
        error: 'Penyimpanan terputus.',
      };
    }

    if (this.currentDoc && baseVersion !== undefined && baseVersion !== this.currentDoc.dataVersion) {
      return {
        success: false,
        dataVersion: this.currentDoc.dataVersion,
        updatedAt: this.currentDoc.updatedAt,
        checksum: this.currentDoc.checksum,
        error: `Konflik versi data: versi dasar ${baseVersion} tidak cocok dengan versi terkini ${this.currentDoc.dataVersion}.`,
      };
    }

    const nextVersion = (this.currentDoc?.dataVersion ?? 0) + 1;
    const now = new Date().toISOString();
    const checksum = await computeSha256(payload);

    const updatedDoc: TokoSakalaDocument = {
      app: 'toko-sakala',
      schemaVersion: 1,
      dataVersion: nextVersion,
      updatedAt: now,
      checksum,
      payload,
    };

    // Validasi skema Zod sebelum commit
    this.currentDoc = TokoSakalaDocumentSchema.parse(updatedDoc);

    return {
      success: true,
      dataVersion: nextVersion,
      updatedAt: now,
      checksum,
    };
  }

  async createBackup(label?: string): Promise<BackupMetadata> {
    if (!this.currentDoc) {
      await this.loadData();
    }
    const doc = this.currentDoc!;
    const now = new Date();
    const dateStr = now.toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-${dateStr}.json`;
    const content = JSON.stringify(doc, null, 2);
    const backupId = `mock-backup-${Date.now()}`;

    const meta: BackupMetadata = {
      id: backupId,
      fileName,
      createdAt: now.toISOString(),
      dataVersion: doc.dataVersion,
      schemaVersion: doc.schemaVersion,
      checksum: doc.checksum,
      byteSize: new TextEncoder().encode(content).length,
      label,
    };

    this.backups.set(backupId, { meta, content });
    return meta;
  }

  async listBackups(): Promise<BackupMetadata[]> {
    return Array.from(this.backups.values())
      .map((b) => b.meta)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async restoreBackup(backupId: string): Promise<RestoreResult> {
    const backupEntry = this.backups.get(backupId);
    if (!backupEntry) {
      return {
        success: false,
        restoredVersion: this.currentDoc?.dataVersion ?? 0,
        backupId,
        error: `Cadangan dengan ID ${backupId} tidak ditemukan.`,
      };
    }

    // 1. Snapshot pengaman data terkini sebelum pemulihan
    const safetySnapshot = await this.createBackup('Safety snapshot before restore');

    // 2. Parse dan validasi backup target
    let parsed: unknown;
    try {
      parsed = JSON.parse(backupEntry.content);
    } catch {
      return {
        success: false,
        restoredVersion: this.currentDoc?.dataVersion ?? 0,
        backupId,
        preRestoreSnapshotId: safetySnapshot.id,
        error: 'Isi file cadangan bukan format JSON yang valid.',
      };
    }

    const validatedDoc = TokoSakalaDocumentSchema.safeParse(parsed);
    if (!validatedDoc.success) {
      return {
        success: false,
        restoredVersion: this.currentDoc?.dataVersion ?? 0,
        backupId,
        preRestoreSnapshotId: safetySnapshot.id,
        error: `Struktur data cadangan tidak memenuhi skema: ${validatedDoc.error.message}`,
      };
    }

    // 3. Verifikasi SHA-256
    const isChecksumValid = await verifyChecksum(
      validatedDoc.data.payload,
      validatedDoc.data.checksum
    );
    if (!isChecksumValid) {
      return {
        success: false,
        restoredVersion: this.currentDoc?.dataVersion ?? 0,
        backupId,
        preRestoreSnapshotId: safetySnapshot.id,
        error: 'Integritas cadangan gagal: Checksum SHA-256 tidak sesuai.',
      };
    }

    // 4. Terapkan pemulihan
    this.currentDoc = validatedDoc.data;

    return {
      success: true,
      restoredVersion: validatedDoc.data.dataVersion,
      backupId,
      preRestoreSnapshotId: safetySnapshot.id,
    };
  }

  // Testing helper: deliberately corrupt the in-memory document to test detection
  _corruptPayloadForTesting(tamperedField: string): void {
    if (this.currentDoc) {
      (this.currentDoc.payload as unknown as Record<string, unknown>)[tamperedField] = 'TAMPERED';
    }
  }
}
