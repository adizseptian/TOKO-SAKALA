/**
 * TOKO SAKALA — Google Identity Services (GIS) OAuth 2.0 Client
 * 
 * Mengelola otentikasi client-side menggunakan Google Identity Services (GIS) Token Client.
 * - Skop minimum: https://www.googleapis.com/auth/drive.file
 * - Token disimpan di MEMORI saja (tidak pernah di localStorage demi keamanan)
 * - Bebas dari Client Secret (hanya membutuhkan Client ID publik)
 */

export const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

export type AuthState =
  | 'UNCONFIGURED' // Client ID belum diatur
  | 'DISCONNECTED' // Belum login
  | 'CONNECTING'   // Pop-up otorisasi sedang terbuka
  | 'CONNECTED'    // Token aktif dan valid
  | 'EXPIRED'      // Token kedaluwarsa, perlu otorisasi ulang
  | 'ERROR';       // Terjadi kesalahan (akses ditolak, popup diblokir, dll.)

export interface GoogleUserInfo {
  email: string;
  name?: string;
  picture?: string;
}

export interface GoogleAuthListener {
  (state: AuthState, error?: string | null): void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse) => void;
            error_callback?: (error: { type: string; message?: string }) => void;
            prompt?: string;
          }) => TokenClient;
          revoke: (accessToken: string, done?: () => void) => void;
        };
      };
    };
  }
}

interface TokenResponse {
  access_token?: string;
  expires_in?: number | string;
  error?: string;
  error_description?: string;
  error_uri?: string;
}

interface TokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
}

const RUNTIME_CLIENT_ID_KEY = 'toko_sakala_runtime_client_id';

export class GoogleAuthService {
  private static instance: GoogleAuthService | null = null;

  private clientId: string | null = null;
  private accessToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  private userInfo: GoogleUserInfo | null = null;
  private authState: AuthState = 'UNCONFIGURED';
  private errorMessage: string | null = null;
  private tokenClient: TokenClient | null = null;
  private listeners: Set<GoogleAuthListener> = new Set();
  private scriptLoadingPromise: Promise<boolean> | null = null;

  constructor() {
    this.initClientId();
  }

  static getInstance(): GoogleAuthService {
    if (!GoogleAuthService.instance) {
      GoogleAuthService.instance = new GoogleAuthService();
    }
    return GoogleAuthService.instance;
  }

  private initClientId(): void {
    // 1. Cek environment variable Vite
    const envClientId = typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)
      : undefined;

    // 2. Cek runtime storage (berguna jika pengguna memasukkan Client ID di UI)
    let runtimeClientId: string | null = null;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        runtimeClientId = window.sessionStorage.getItem(RUNTIME_CLIENT_ID_KEY);
      }
    } catch {
      // Ignore storage restrictions
    }

    const resolved = envClientId?.trim() || runtimeClientId?.trim() || null;
    this.clientId = resolved;
    this.authState = resolved ? 'DISCONNECTED' : 'UNCONFIGURED';
  }

  getClientId(): string | null {
    return this.clientId;
  }

  setClientId(newClientId: string): void {
    const trimmed = newClientId.trim();
    if (!trimmed) return;
    this.clientId = trimmed;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(RUNTIME_CLIENT_ID_KEY, trimmed);
      }
    } catch {
      // Ignore
    }
    this.tokenClient = null;
    this.disconnect();
    this.setAuthState('DISCONNECTED');
  }

  clearRuntimeClientId(): void {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(RUNTIME_CLIENT_ID_KEY);
      }
    } catch {
      // Ignore
    }
    this.initClientId();
    this.tokenClient = null;
    this.disconnect();
    this.notifyListeners();
  }

  getAuthState(): AuthState {
    if (this.accessToken && this.isTokenExpired()) {
      return 'EXPIRED';
    }
    return this.authState;
  }

  getErrorMessage(): string | null {
    return this.errorMessage;
  }

  getUserInfo(): GoogleUserInfo | null {
    return this.userInfo;
  }

  subscribe(listener: GoogleAuthListener): () => void {
    this.listeners.add(listener);
    listener(this.getAuthState(), this.errorMessage);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const state = this.getAuthState();
    this.listeners.forEach((listener) => listener(state, this.errorMessage));
  }

  private setAuthState(state: AuthState, error: string | null = null): void {
    this.authState = state;
    this.errorMessage = error;
    this.notifyListeners();
  }

  isTokenExpired(): boolean {
    if (!this.accessToken || !this.tokenExpiresAt) return true;
    // Buffer keamanan 60 detik sebelum benar-benar kedaluwarsa
    return Date.now() >= this.tokenExpiresAt - 60000;
  }

  async getValidAccessToken(): Promise<string | null> {
    if (!this.accessToken) {
      return null;
    }
    if (this.isTokenExpired()) {
      this.setAuthState('EXPIRED', 'Token otorisasi Google Drive telah kedaluwarsa. Silakan otorisasi ulang.');
      return null;
    }
    return this.accessToken;
  }

  /**
   * Memuat script Google Identity Services secara dinamis jika belum ada
   */
  async loadGsiScript(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (window.google?.accounts?.oauth2) return true;

    if (this.scriptLoadingPromise) {
      return this.scriptLoadingPromise;
    }

    this.scriptLoadingPromise = new Promise<boolean>((resolve) => {
      // Cek apakah tag script sudah ada
      const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(true));
        existingScript.addEventListener('error', () => resolve(false));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.error('Gagal memuat Google Identity Services script.');
        resolve(false);
      };
      document.head.appendChild(script);
    });

    return this.scriptLoadingPromise;
  }

  /**
   * Menyiapkan Token Client GIS
   */
  private async ensureTokenClient(): Promise<TokenClient> {
    if (this.tokenClient) return this.tokenClient;

    if (!this.clientId) {
      this.setAuthState('UNCONFIGURED', 'OAuth 2.0 Client ID belum dikonfigurasi.');
      throw new Error('OAuth 2.0 Client ID belum dikonfigurasi. Atur VITE_GOOGLE_CLIENT_ID atau masukkan di menu Pengaturan.');
    }

    const loaded = await this.loadGsiScript();
    if (!loaded || !window.google?.accounts?.oauth2) {
      this.setAuthState('ERROR', 'Gagal memuat pustaka Google Identity Services. Periksa koneksi internet.');
      throw new Error('Gagal memuat Google Identity Services (GIS). Periksa koneksi internet.');
    }

    return new Promise<TokenClient>((resolve, reject) => {
      try {
        const client = window.google!.accounts!.oauth2!.initTokenClient({
          client_id: this.clientId!,
          scope: DRIVE_FILE_SCOPE,
          callback: (response: TokenResponse) => {
            this.handleTokenResponse(response);
          },
          error_callback: (error) => {
            this.handleTokenError(error);
          },
        });
        this.tokenClient = client;
        resolve(client);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal menginisialisasi Token Client GIS.';
        this.setAuthState('ERROR', msg);
        reject(err);
      }
    });
  }

  private handleTokenResponse(response: TokenResponse): void {
    if (response.error) {
      let friendlyMsg = `Otorisasi Google gagal: ${response.error}`;
      if (response.error === 'access_denied') {
        friendlyMsg = 'Izin akses Google Drive ditolak atau dibatalkan oleh pengguna.';
      } else if (response.error === 'popup_closed_by_user') {
        friendlyMsg = 'Jendela pop-up login ditutup sebelum otorisasi selesai.';
      }
      this.setAuthState('ERROR', friendlyMsg);
      return;
    }

    if (!response.access_token) {
      this.setAuthState('ERROR', 'Tidak ada token akses yang dikembalikan oleh Google.');
      return;
    }

    const expiresInSec = typeof response.expires_in === 'string'
      ? parseInt(response.expires_in, 10)
      : (response.expires_in || 3600);

    this.accessToken = response.access_token;
    this.tokenExpiresAt = Date.now() + (expiresInSec * 1000);
    this.setAuthState('CONNECTED');

    // Ambil profil pengguna di latar belakang
    this.fetchUserProfile(response.access_token).catch(() => {
      // Default ke email pemilik jika fetch profil gagal
      if (!this.userInfo) {
        this.userInfo = { email: 'adizseptian@gmail.com' };
        this.notifyListeners();
      }
    });
  }

  private handleTokenError(error: { type: string; message?: string }): void {
    let msg = 'Terjadi kesalahan pada alur otorisasi Google.';
    if (error.type === 'popup_blocked') {
      msg = 'Jendela pop-up otorisasi diblokir oleh peramban. Silakan izinkan pop-up untuk situs ini.';
    } else if (error.type === 'popup_closed') {
      msg = 'Pop-up otorisasi ditutup sebelum proses selesai.';
    } else if (error.message) {
      msg = `Kesalahan Google Auth: ${error.message}`;
    }
    this.setAuthState('ERROR', msg);
  }

  /**
   * Membuka popup otorisasi Google untuk meminta access token
   */
  async requestAccessToken(promptConsent: boolean = false): Promise<string> {
    this.setAuthState('CONNECTING');
    try {
      const client = await this.ensureTokenClient();

      return new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (this.authState === 'CONNECTING') {
            this.setAuthState('ERROR', 'Waktu tunggu otorisasi habis (timeout). Silakan coba lagi.');
            reject(new Error('Waktu tunggu otorisasi habis (timeout).'));
          }
        }, 120000); // 2 menit timeout

        const cleanup = this.subscribe((state, err) => {
          if (state === 'CONNECTED' && this.accessToken) {
            clearTimeout(timeout);
            cleanup();
            resolve(this.accessToken);
          } else if (state === 'ERROR') {
            clearTimeout(timeout);
            cleanup();
            reject(new Error(err || 'Otorisasi Google gagal.'));
          }
        });

        client.requestAccessToken({
          prompt: promptConsent ? 'consent' : undefined,
        });
      });
    } catch (err) {
      this.setAuthState('ERROR', err instanceof Error ? err.message : 'Gagal meminta token.');
      throw err;
    }
  }

  /**
   * Mengambil data email pengguna dari Google API
   */
  private async fetchUserProfile(token: string): Promise<GoogleUserInfo | null> {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        this.userInfo = {
          email: data.email || 'adizseptian@gmail.com',
          name: data.name,
          picture: data.picture,
        };
        this.notifyListeners();
        return this.userInfo;
      }
    } catch {
      // Abaikan jika userinfo endpoint tidak dapat diakses
    }
    return null;
  }

  /**
   * Memutuskan sesi Google Drive
   */
  async disconnect(): Promise<void> {
    if (this.accessToken && typeof window !== 'undefined' && window.google?.accounts?.oauth2?.revoke) {
      try {
        window.google.accounts.oauth2.revoke(this.accessToken, () => {});
      } catch {
        // Ignore
      }
    }
    this.accessToken = null;
    this.tokenExpiresAt = null;
    this.userInfo = null;
    this.setAuthState(this.clientId ? 'DISCONNECTED' : 'UNCONFIGURED');
  }
}

export const googleAuth = GoogleAuthService.getInstance();
