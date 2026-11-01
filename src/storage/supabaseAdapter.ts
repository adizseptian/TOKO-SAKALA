import { createClient, type SupabaseClient } from '@supabase/supabase-js';
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

export interface SupabaseConfig {
  url?: string;
  anonKey?: string;
  ownerEmail?: string;
}

const RUNTIME_SUPABASE_URL_KEY = 'toko_sakala_supabase_url';
const RUNTIME_SUPABASE_KEY_KEY = 'toko_sakala_supabase_anon_key';
const DOC_RECORD_ID = 'toko_sakala_main_doc';

export class SupabaseAdapter implements StorageAdapter {
  readonly backendType = 'supabase' as const;

  private client: SupabaseClient | null = null;
  private url: string | null = null;
  private anonKey: string | null = null;
  private ownerEmail: string = 'adizseptian@gmail.com';
  private lastKnownVersion: number = 0;
  private lastSyncedAt: string | null = null;
  private checksumStatus: StorageStatus['checksumStatus'] = 'UNCHECKED';

  constructor(config?: SupabaseConfig) {
    this.initConfig(config);
  }

  private initConfig(config?: SupabaseConfig): void {
    const envUrl = typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env.VITE_SUPABASE_URL as string | undefined)
      : undefined;
    const envKey = typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
      : undefined;

    let runtimeUrl: string | null = null;
    let runtimeKey: string | null = null;

    try {
      if (typeof window !== 'undefined') {
        if (window.localStorage) {
          runtimeUrl = window.localStorage.getItem(RUNTIME_SUPABASE_URL_KEY);
          runtimeKey = window.localStorage.getItem(RUNTIME_SUPABASE_KEY_KEY);
        }
        if (!runtimeUrl && window.sessionStorage) {
          runtimeUrl = window.sessionStorage.getItem(RUNTIME_SUPABASE_URL_KEY);
          runtimeKey = window.sessionStorage.getItem(RUNTIME_SUPABASE_KEY_KEY);
        }
      }
    } catch {
      // Ignore
    }

    if (config && 'url' in config) {
      this.url = config.url ? config.url.trim() : null;
    } else {
      this.url = runtimeUrl?.trim() || envUrl?.trim() || null;
    }

    if (config && 'anonKey' in config) {
      this.anonKey = config.anonKey ? config.anonKey.trim() : null;
    } else {
      this.anonKey = runtimeKey?.trim() || envKey?.trim() || null;
    }

    if (config?.ownerEmail) {
      this.ownerEmail = config.ownerEmail;
    }

    if (this.url && this.anonKey) {
      try {
        this.client = createClient(this.url, this.anonKey);
      } catch {
        this.client = null;
      }
    } else {
      this.client = null;
    }
  }

  setRuntimeCredentials(url: string, anonKey: string): void {
    this.url = url.trim();
    this.anonKey = anonKey.trim();
    try {
      if (typeof window !== 'undefined') {
        if (window.localStorage) {
          window.localStorage.setItem(RUNTIME_SUPABASE_URL_KEY, this.url);
          window.localStorage.setItem(RUNTIME_SUPABASE_KEY_KEY, this.anonKey);
        }
        if (window.sessionStorage) {
          window.sessionStorage.setItem(RUNTIME_SUPABASE_URL_KEY, this.url);
          window.sessionStorage.setItem(RUNTIME_SUPABASE_KEY_KEY, this.anonKey);
        }
      }
    } catch {
      // Ignore
    }
    this.client = createClient(this.url, this.anonKey);
  }

  clearRuntimeCredentials(): void {
    this.url = null;
    this.anonKey = null;
    this.client = null;
    try {
      if (typeof window !== 'undefined') {
        if (window.localStorage) {
          window.localStorage.removeItem(RUNTIME_SUPABASE_URL_KEY);
          window.localStorage.removeItem(RUNTIME_SUPABASE_KEY_KEY);
        }
        if (window.sessionStorage) {
          window.sessionStorage.removeItem(RUNTIME_SUPABASE_URL_KEY);
          window.sessionStorage.removeItem(RUNTIME_SUPABASE_KEY_KEY);
        }
      }
    } catch {
      // Ignore
    }
  }

  isConfigured(): boolean {
    return Boolean(this.url && this.anonKey && this.client);
  }

  getCredentials(): { url: string | null; anonKey: string | null } {
    return { url: this.url, anonKey: this.anonKey };
  }

  async connect(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }
    try {
      // Tes koneksi ringan ke basis data Supabase
      const res = await this.client!.from('toko_documents').select('id, data_version').limit(1);
      return !res.error;
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    // Supabase JS client bersifat stateless
    this.client = null;
  }

  async getStatus(): Promise<StorageStatus> {
    if (!this.isConfigured()) {
      return {
        backend: this.backendType,
        isConnected: false,
        userEmail: this.ownerEmail,
        lastSyncedAt: null,
        dataVersion: 0,
        isDirty: false,
        checksumStatus: 'UNCHECKED',
        errorMessage: 'Kredensial Supabase (URL & Anon Key) belum diatur.',
      };
    }

    return {
      backend: this.backendType,
      isConnected: true,
      userEmail: this.ownerEmail,
      lastSyncedAt: this.lastSyncedAt,
      dataVersion: this.lastKnownVersion,
      isDirty: false,
      checksumStatus: this.checksumStatus,
    };
  }

  async loadData(): Promise<TokoSakalaDocument> {
    if (!this.client) {
      throw new Error('Supabase client belum dikonfigurasi. Masukkan URL dan Anon Key.');
    }

    const { data, error } = await this.client
      .from('toko_documents')
      .select('*')
      .eq('id', DOC_RECORD_ID)
      .maybeSingle();

    if (error) {
      if (error.message.includes('schema cache') || error.message.includes('toko_documents')) {
        throw new Error(`Tabel 'public.toko_documents' belum dibuat di database Supabase Anda. Jalankan skrip SQL migrasi migrations/001_create_toko_documents.sql di SQL Editor Supabase.`);
      }
      throw new Error(`Gagal memuat data dari Supabase: ${error.message}`);
    }

    if (!data) {
      // Inisialisasi dokumen baru di Supabase jika belum pernah ada
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

      let upsertPayload: Record<string, unknown> = {
        id: DOC_RECORD_ID,
        data_version: 1,
        checksum,
        updated_at: now,
        content: initialDoc,
      };

      let { error: upsertErr } = await this.client.from('toko_documents').upsert(upsertPayload);

      if (upsertErr && (upsertErr.message.includes('data_version') || upsertErr.message.includes('column'))) {
        upsertPayload = {
          id: DOC_RECORD_ID,
          version: 1,
          checksum,
          updated_at: now,
          content: initialDoc,
        };
        const retry = await this.client.from('toko_documents').upsert(upsertPayload);
        upsertErr = retry.error;
      }

      if (upsertErr) {
        if (upsertErr.message.includes('schema cache') || upsertErr.message.includes('toko_documents')) {
          throw new Error(`Tabel 'public.toko_documents' belum dibuat di Supabase. Jalankan skrip SQL di migrations/001_create_toko_documents.sql.`);
        }
        throw new Error(upsertErr.message);
      }

      this.lastKnownVersion = 1;
      this.lastSyncedAt = now;
      this.checksumStatus = 'VALID';
      return initialDoc;
    }

    const rawContent = (data as Record<string, unknown>).content ?? (data as Record<string, unknown>).data ?? (data as Record<string, unknown>).payload;
    let doc: TokoSakalaDocument;
    if (rawContent && typeof rawContent === 'object' && 'payload' in (rawContent as object)) {
      doc = rawContent as TokoSakalaDocument;
    } else if (rawContent && typeof rawContent === 'object') {
      doc = {
        app: 'toko-sakala',
        schemaVersion: 1,
        dataVersion: Number((data as Record<string, unknown>).data_version ?? (data as Record<string, unknown>).version ?? 1),
        updatedAt: ((data as Record<string, unknown>).updated_at as string) || new Date().toISOString(),
        checksum: ((data as Record<string, unknown>).checksum as string) || '',
        payload: rawContent as TokoSakalaPayload,
      };
    } else {
      throw new Error('Format data tidak sesuai di Supabase.');
    }

    const validated = TokoSakalaDocumentSchema.parse(doc);
    const isValid = await verifyChecksum(validated.payload, validated.checksum);

    if (!isValid) {
      this.checksumStatus = 'CORRUPT';
      throw new Error('Integritas data di Supabase gagal: Checksum SHA-256 tidak valid.');
    }

    this.lastKnownVersion = validated.dataVersion;
    this.lastSyncedAt = validated.updatedAt;
    this.checksumStatus = 'VALID';
    return validated;
  }

  async saveData(payload: TokoSakalaPayload, baseVersion?: number): Promise<SaveResult> {
    if (!this.client) {
      return {
        success: false,
        dataVersion: 0,
        updatedAt: new Date().toISOString(),
        checksum: '',
        error: 'Supabase belum dikonfigurasi.',
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
          error: `Konflik versi cloud: Versi lokal (${baseVersion}) tidak sesuai dengan versi di Supabase (${currentDoc.dataVersion}).`,
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

      let upsertPayload: Record<string, unknown> = {
        id: DOC_RECORD_ID,
        data_version: nextVersion,
        checksum,
        updated_at: now,
        content: nextDoc,
      };

      let { error } = await this.client.from('toko_documents').upsert(upsertPayload);

      if (error && (error.message.includes('data_version') || error.message.includes('column'))) {
        upsertPayload = {
          id: DOC_RECORD_ID,
          version: nextVersion,
          checksum,
          updated_at: now,
          content: nextDoc,
        };
        const retry = await this.client.from('toko_documents').upsert(upsertPayload);
        error = retry.error;
      }

      if (error) {
        throw new Error(error.message);
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
    } catch (err) {
      return {
        success: false,
        dataVersion: this.lastKnownVersion,
        updatedAt: this.lastSyncedAt ?? new Date().toISOString(),
        checksum: '',
        error: err instanceof Error ? err.message : 'Kesalahan menyimpan ke Supabase.',
      };
    }
  }

  async createBackup(label?: string): Promise<BackupMetadata> {
    if (!this.client) {
      throw new Error('Supabase belum dikonfigurasi.');
    }

    const currentDoc = await this.loadData();
    const now = new Date();
    const id = `supabase-backup-${Date.now()}`;
    const fileName = `backup-${now.toISOString().replace(/[:.]/g, '-')}.json`;
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
      label: label ?? 'Cadangan Cloud Supabase',
    };

    let backupPayload: Record<string, unknown> = {
      id,
      file_name: fileName,
      created_at: now.toISOString(),
      data_version: currentDoc.dataVersion,
      checksum: currentDoc.checksum,
      content,
      label: meta.label,
    };

    let { error } = await this.client.from('toko_backups').insert(backupPayload);

    if (error && (error.message.includes('data_version') || error.message.includes('column'))) {
      backupPayload = {
        id,
        file_name: fileName,
        created_at: now.toISOString(),
        version: currentDoc.dataVersion,
        checksum: currentDoc.checksum,
        content,
        label: meta.label,
      };
      const retry = await this.client.from('toko_backups').insert(backupPayload);
      error = retry.error;
    }

    if (error) {
      throw new Error(`Gagal membuat cadangan di Supabase: ${error.message}`);
    }

    return meta;
  }

  async listBackups(): Promise<BackupMetadata[]> {
    if (!this.client) return [];
    try {
      const { data, error } = await this.client
        .from('toko_backups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      return data.map((b: Record<string, unknown>) => ({
        id: (b.id as string) || '',
        fileName: (b.file_name as string) || (b.fileName as string) || '',
        createdAt: (b.created_at as string) || new Date().toISOString(),
        dataVersion: Number(b.data_version ?? b.version ?? 1),
        schemaVersion: 1,
        checksum: (b.checksum as string) || '',
        byteSize: 0,
        label: b.label as string | undefined,
      }));
    } catch {
      return [];
    }
  }

  async restoreBackup(backupId: string): Promise<RestoreResult> {
    if (!this.client) {
      return {
        success: false,
        restoredVersion: 0,
        backupId,
        error: 'Supabase client belum dikonfigurasi.',
      };
    }

    // 1. Snapshot pengaman wajib
    let safetySnapshot: BackupMetadata;
    try {
      safetySnapshot = await this.createBackup('Snapshot otomatis sebelum pemulihan cloud');
    } catch (err) {
      return {
        success: false,
        restoredVersion: this.lastKnownVersion,
        backupId,
        error: `Pemulihan dibatalkan demi keamanan data: snapshot pengaman gagal (${err instanceof Error ? err.message : 'Kesalahan snapshot'}).`,
      };
    }

    try {
      const { data, error } = await this.client
        .from('toko_backups')
        .select('content')
        .eq('id', backupId)
        .single();

      if (error || !data) {
        return {
          success: false,
          restoredVersion: this.lastKnownVersion,
          backupId,
          preRestoreSnapshotId: safetySnapshot.id,
          error: 'File cadangan tidak ditemukan di Supabase.',
        };
      }

      const parsed = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
      const validated = TokoSakalaDocumentSchema.parse(parsed);

      await this.client.from('toko_documents').upsert({
        id: DOC_RECORD_ID,
        data_version: validated.dataVersion,
        checksum: validated.checksum,
        updated_at: new Date().toISOString(),
        content: validated,
      });

      this.lastKnownVersion = validated.dataVersion;
      this.checksumStatus = 'VALID';

      return {
        success: true,
        restoredVersion: validated.dataVersion,
        backupId,
        preRestoreSnapshotId: safetySnapshot.id,
      };
    } catch (err) {
      return {
        success: false,
        restoredVersion: this.lastKnownVersion,
        backupId,
        preRestoreSnapshotId: safetySnapshot.id,
        error: `Gagal pemulihan: ${err instanceof Error ? err.message : 'Kesalahan jaringan'}`,
      };
    }
  }

  async pushDocument(doc: TokoSakalaDocument): Promise<{ success: boolean; error?: string }> {
    if (!this.client) {
      return { success: false, error: 'Supabase belum terhubung.' };
    }

    try {
      let upsertPayload: Record<string, unknown> = {
        id: DOC_RECORD_ID,
        data_version: doc.dataVersion,
        checksum: doc.checksum,
        updated_at: doc.updatedAt,
        content: doc,
      };

      let { error } = await this.client.from('toko_documents').upsert(upsertPayload);

      if (error && (error.message.includes('data_version') || error.message.includes('column'))) {
        upsertPayload = {
          id: DOC_RECORD_ID,
          version: doc.dataVersion,
          checksum: doc.checksum,
          updated_at: doc.updatedAt,
          content: doc,
        };
        const retry = await this.client.from('toko_documents').upsert(upsertPayload);
        error = retry.error;
      }

      if (error) {
        if (error.message.includes('schema cache') || error.message.includes('toko_documents')) {
          return {
            success: false,
            error: `Tabel 'public.toko_documents' belum dibuat di Supabase. Jalankan skrip SQL migrasi migrations/001_create_toko_documents.sql di SQL Editor Supabase. (${error.message})`,
          };
        }
        return { success: false, error: error.message };
      }

      this.lastKnownVersion = doc.dataVersion;
      this.lastSyncedAt = doc.updatedAt;
      this.checksumStatus = 'VALID';
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Koneksi gagal' };
    }
  }

  async pullDocument(): Promise<TokoSakalaDocument | null> {
    if (!this.client) return null;
    try {
      const { data, error } = await this.client
        .from('toko_documents')
        .select('*')
        .eq('id', DOC_RECORD_ID)
        .maybeSingle();

      if (error || !data) return null;
      const rawContent = (data as Record<string, unknown>).content ?? (data as Record<string, unknown>).data ?? (data as Record<string, unknown>).payload;
      if (rawContent && typeof rawContent === 'object' && 'payload' in (rawContent as object)) {
        return TokoSakalaDocumentSchema.parse(rawContent);
      } else if (rawContent && typeof rawContent === 'object') {
        const assembled: TokoSakalaDocument = {
          app: 'toko-sakala',
          schemaVersion: 1,
          dataVersion: Number((data as Record<string, unknown>).data_version ?? (data as Record<string, unknown>).version ?? 1),
          updatedAt: ((data as Record<string, unknown>).updated_at as string) || new Date().toISOString(),
          checksum: ((data as Record<string, unknown>).checksum as string) || '',
          payload: rawContent as TokoSakalaPayload,
        };
        return TokoSakalaDocumentSchema.parse(assembled);
      }
      return null;
    } catch {
      return null;
    }
  }
}
