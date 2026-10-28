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
import { computeSha256, verifyChecksum, canonicalizeJson } from './checksum';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3/files';
const DATA_FILE_NAME = 'toko-sakala-data.json';
const BACKUP_FOLDER_NAME = 'TOKO_SAKALA_BACKUPS';

export interface GoogleDriveConfig {
  getAccessToken: () => Promise<string | null>;
  userEmail?: string;
}

export class GoogleDriveAdapter implements StorageAdapter {
  readonly backendType = 'google_drive' as const;

  private getAccessToken: () => Promise<string | null>;
  private userEmail: string;
  private mainFileId: string | null = null;
  private backupFolderId: string | null = null;
  private lastSyncedAt: string | null = null;
  private lastKnownVersion: number = 0;
  private checksumStatus: StorageStatus['checksumStatus'] = 'UNCHECKED';

  constructor(config: GoogleDriveConfig) {
    this.getAccessToken = config.getAccessToken;
    this.userEmail = config.userEmail ?? 'adizseptian@gmail.com';
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getAccessToken();
    if (!token) {
      throw new Error(
        'Akses Google Drive belum diotorisasi. Silakan hubungkan akun Google Anda.'
      );
    }
    return {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };
  }

  async connect(): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();
      const res = await fetch(`${DRIVE_API_BASE}/about?fields=user`, { headers });
      if (!res.ok) {
        return false;
      }
      const data = await res.json();
      if (data.user?.emailAddress) {
        this.userEmail = data.user.emailAddress;
      }
      return true;
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.mainFileId = null;
    this.backupFolderId = null;
    this.checksumStatus = 'UNCHECKED';
  }

  async getStatus(): Promise<StorageStatus> {
    const token = await this.getAccessToken().catch(() => null);
    if (!token) {
      return {
        backend: this.backendType,
        isConnected: false,
        userEmail: null,
        lastSyncedAt: this.lastSyncedAt,
        dataVersion: this.lastKnownVersion,
        isDirty: false,
        checksumStatus: this.checksumStatus,
        errorMessage: 'Belum terhubung ke Google Drive.',
      };
    }

    return {
      backend: this.backendType,
      isConnected: true,
      userEmail: this.userEmail,
      lastSyncedAt: this.lastSyncedAt,
      dataVersion: this.lastKnownVersion,
      isDirty: false,
      checksumStatus: this.checksumStatus,
    };
  }

  /**
   * Mencari atau membuat file data utama di Google Drive
   */
  private async findOrCreateDataFile(): Promise<string> {
    if (this.mainFileId) {
      return this.mainFileId;
    }

    const headers = await this.getAuthHeaders();
    // Query files yang tidak berada di trash dan memiliki nama DATA_FILE_NAME
    const q = encodeURIComponent(`name = '${DATA_FILE_NAME}' and trashed = false`);
    const listUrl = `${DRIVE_API_BASE}/files?q=${q}&fields=files(id,name,modifiedTime)`;
    
    const res = await fetch(listUrl, { headers });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gagal mencari file toko di Google Drive: ${res.status} ${err}`);
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      this.mainFileId = data.files[0].id;
      return this.mainFileId!;
    }

    // Buat file baru dengan initial payload
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

    const newFileId = await this.uploadNewFile(DATA_FILE_NAME, initialDoc);
    this.mainFileId = newFileId;
    this.lastKnownVersion = 1;
    this.lastSyncedAt = now;
    this.checksumStatus = 'VALID';

    return newFileId;
  }

  /**
   * Mencari atau membuat folder BACKUPS di Google Drive
   */
  private async findOrCreateBackupFolder(): Promise<string> {
    if (this.backupFolderId) {
      return this.backupFolderId;
    }

    const headers = await this.getAuthHeaders();
    const q = encodeURIComponent(
      `mimeType = 'application/vnd.google-apps.folder' and name = '${BACKUP_FOLDER_NAME}' and trashed = false`
    );
    const res = await fetch(`${DRIVE_API_BASE}/files?q=${q}&fields=files(id,name)`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.files && data.files.length > 0) {
        this.backupFolderId = data.files[0].id;
        return this.backupFolderId!;
      }
    }

    // Buat folder baru
    const folderMetadata = {
      name: BACKUP_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Folder cadangan berkala TOKO SAKALA',
    };

    const createRes = await fetch(`${DRIVE_API_BASE}/files`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(folderMetadata),
    });

    if (!createRes.ok) {
      throw new Error('Gagal membuat folder cadangan di Google Drive.');
    }

    const created = await createRes.json();
    this.backupFolderId = created.id;
    return created.id;
  }

  /**
   * Helper multipart upload untuk membuat file baru
   */
  private async uploadNewFile(
    fileName: string,
    contentObj: unknown,
    parentId?: string,
    appProperties?: Record<string, string>
  ): Promise<string> {
    const headers = await this.getAuthHeaders();
    const boundary = '-------TokoSakalaBoundary' + Math.random().toString(36).substring(2);

    const metadata: Record<string, unknown> = {
      name: fileName,
      mimeType: 'application/json',
      appProperties,
    };
    if (parentId) {
      metadata.parents = [parentId];
    }

    const fileContent = typeof contentObj === 'string' ? contentObj : JSON.stringify(contentObj, null, 2);

    const multipartRequestBody =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      `${fileContent}\r\n` +
      `--${boundary}--`;

    const res = await fetch(`${DRIVE_UPLOAD_BASE}?uploadType=multipart`, {
      method: 'POST',
      headers: {
        Authorization: headers.Authorization,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gagal mengunggah file baru ke Google Drive: ${res.status} ${err}`);
    }

    const json = await res.json();
    return json.id;
  }

  async loadData(): Promise<TokoSakalaDocument> {
    const fileId = await this.findOrCreateDataFile();
    const headers = await this.getAuthHeaders();

    const res = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, { headers });
    if (!res.ok) {
      this.checksumStatus = 'CORRUPT';
      throw new Error(`Gagal mengunduh data toko dari Google Drive: status ${res.status}`);
    }

    let parsed: unknown;
    try {
      parsed = await res.json();
    } catch {
      this.checksumStatus = 'CORRUPT';
      throw new Error('File data toko di Google Drive bukan JSON yang valid.');
    }

    // 1. Validasi struktur skema
    const validated = TokoSakalaDocumentSchema.safeParse(parsed);
    if (!validated.success) {
      this.checksumStatus = 'CORRUPT';
      throw new Error(`Format data tidak valid: ${validated.error.message}`);
    }

    const doc = validated.data;

    // 2. Verifikasi Checksum SHA-256
    const isChecksumValid = await verifyChecksum(doc.payload, doc.checksum);
    if (!isChecksumValid) {
      this.checksumStatus = 'CORRUPT';
      throw new Error(
        'Integritas data gagal: Checksum SHA-256 tidak cocok dengan konten payload. File mungkin telah dimodifikasi secara eksternal.'
      );
    }

    this.checksumStatus = 'VALID';
    this.lastKnownVersion = doc.dataVersion;
    this.lastSyncedAt = doc.updatedAt;

    return doc;
  }

  async saveData(payload: TokoSakalaPayload, baseVersion?: number): Promise<SaveResult> {
    try {
      const fileId = await this.findOrCreateDataFile();
      const headers = await this.getAuthHeaders();

      if (baseVersion !== undefined && this.lastKnownVersion !== 0 && baseVersion !== this.lastKnownVersion) {
        return {
          success: false,
          dataVersion: this.lastKnownVersion,
          updatedAt: this.lastSyncedAt ?? new Date().toISOString(),
          checksum: '',
          error: `Konflik versi: versi lokal (${baseVersion}) tidak sesuai dengan versi Drive (${this.lastKnownVersion}).`,
        };
      }

      const nextVersion = this.lastKnownVersion + 1;
      const now = new Date().toISOString();
      const checksum = await computeSha256(payload);

      const doc: TokoSakalaDocument = {
        app: 'toko-sakala',
        schemaVersion: 1,
        dataVersion: nextVersion,
        updatedAt: now,
        checksum,
        payload,
      };

      // Validasi skema sebelum upload
      TokoSakalaDocumentSchema.parse(doc);

      const content = JSON.stringify(doc, null, 2);

      const res = await fetch(`${DRIVE_UPLOAD_BASE}/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          Authorization: headers.Authorization,
          'Content-Type': 'application/json',
        },
        body: content,
      });

      if (!res.ok) {
        const err = await res.text();
        return {
          success: false,
          dataVersion: this.lastKnownVersion,
          updatedAt: this.lastSyncedAt ?? now,
          checksum: '',
          error: `Gagal memperbarui file di Google Drive: ${res.status} ${err}`,
        };
      }

      this.lastKnownVersion = nextVersion;
      this.lastSyncedAt = now;
      this.checksumStatus = 'VALID';

      return {
        success: true,
        dataVersion: nextVersion,
        updatedAt: now,
        checksum,
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Kesalahan jaringan Google Drive.';
      return {
        success: false,
        dataVersion: this.lastKnownVersion,
        updatedAt: this.lastSyncedAt ?? new Date().toISOString(),
        checksum: '',
        error: msg,
      };
    }
  }

  async createBackup(label?: string): Promise<BackupMetadata> {
    const folderId = await this.findOrCreateBackupFolder();
    const currentDoc = await this.loadData();

    const now = new Date();
    const dateStr = now.toISOString().replace(/[:.]/g, '-');
    const fileName = `backup-${dateStr}.json`;
    const content = JSON.stringify(currentDoc, null, 2);
    const byteSize = new TextEncoder().encode(content).length;

    const fileId = await this.uploadNewFile(fileName, content, folderId, {
      tokoSakalaBackup: 'true',
      dataVersion: String(currentDoc.dataVersion),
      schemaVersion: String(currentDoc.schemaVersion),
      checksum: currentDoc.checksum,
      label: label ?? 'Manual Backup',
    });

    return {
      id: fileId,
      fileName,
      createdAt: now.toISOString(),
      dataVersion: currentDoc.dataVersion,
      schemaVersion: currentDoc.schemaVersion,
      checksum: currentDoc.checksum,
      byteSize,
      label,
    };
  }

  async listBackups(): Promise<BackupMetadata[]> {
    const folderId = await this.findOrCreateBackupFolder();
    const headers = await this.getAuthHeaders();

    const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const fields = encodeURIComponent('files(id,name,size,createdTime,appProperties)');
    const res = await fetch(`${DRIVE_API_BASE}/files?q=${q}&fields=${fields}&orderBy=createdTime desc`, {
      headers,
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    if (!data.files) return [];

    return data.files.map((f: { id: string; name: string; size?: string; createdTime: string; appProperties?: Record<string, string> }) => ({
      id: f.id,
      fileName: f.name,
      createdAt: f.createdTime,
      dataVersion: Number(f.appProperties?.dataVersion ?? 1),
      schemaVersion: Number(f.appProperties?.schemaVersion ?? 1),
      checksum: f.appProperties?.checksum ?? '',
      byteSize: Number(f.size ?? 0),
      label: f.appProperties?.label,
    }));
  }

  async restoreBackup(backupId: string): Promise<RestoreResult> {
    const headers = await this.getAuthHeaders();

    // 1. Ambil snapshot pengaman dari data saat ini sebelum ditimpa
    let safetySnapshot: BackupMetadata | undefined;
    try {
      safetySnapshot = await this.createBackup('Snapshot otomatis sebelum pemulihan cadangan');
    } catch {
      // Catat peringatan tapi jangan gagalkan jika backup kosong
    }

    // 2. Ambil isi file cadangan dari Google Drive
    const res = await fetch(`${DRIVE_API_BASE}/files/${backupId}?alt=media`, { headers });
    if (!res.ok) {
      return {
        success: false,
        restoredVersion: this.lastKnownVersion,
        backupId,
        preRestoreSnapshotId: safetySnapshot?.id,
        error: `Gagal membaca file cadangan: status ${res.status}`,
      };
    }

    let parsed: unknown;
    try {
      parsed = await res.json();
    } catch {
      return {
        success: false,
        restoredVersion: this.lastKnownVersion,
        backupId,
        preRestoreSnapshotId: safetySnapshot?.id,
        error: 'File cadangan bukan format JSON yang valid.',
      };
    }

    // 3. Validasi skema cadangan
    const validated = TokoSakalaDocumentSchema.safeParse(parsed);
    if (!validated.success) {
      return {
        success: false,
        restoredVersion: this.lastKnownVersion,
        backupId,
        preRestoreSnapshotId: safetySnapshot?.id,
        error: `Struktur data cadangan tidak memenuhi skema: ${validated.error.message}`,
      };
    }

    // 4. Verifikasi SHA-256
    const isChecksumValid = await verifyChecksum(validated.data.payload, validated.data.checksum);
    if (!isChecksumValid) {
      return {
        success: false,
        restoredVersion: this.lastKnownVersion,
        backupId,
        preRestoreSnapshotId: safetySnapshot?.id,
        error: 'Integritas file cadangan gagal: Checksum SHA-256 tidak cocok.',
      };
    }

    // 5. Simpan data yang dipulihkan sebagai versi terbaru
    const saveRes = await this.saveData(validated.data.payload);
    if (!saveRes.success) {
      return {
        success: false,
        restoredVersion: this.lastKnownVersion,
        backupId,
        preRestoreSnapshotId: safetySnapshot?.id,
        error: `Gagal menulis data yang dipulihkan ke file utama: ${saveRes.error}`,
      };
    }

    return {
      success: true,
      restoredVersion: saveRes.dataVersion,
      backupId,
      preRestoreSnapshotId: safetySnapshot?.id,
    };
  }
}
