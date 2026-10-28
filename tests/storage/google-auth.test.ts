import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { GoogleAuthService, DRIVE_FILE_SCOPE } from '@/storage/googleAuth';

describe('GoogleAuthService & GIS Integration', () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    vi.restoreAllMocks();
    // Setup a mock window environment for Node.js test runner
    const mockSessionStorage = new Map<string, string>();
    globalThis.window = {
      sessionStorage: {
        getItem: (k: string) => mockSessionStorage.get(k) ?? null,
        setItem: (k: string, v: string) => mockSessionStorage.set(k, v),
        removeItem: (k: string) => mockSessionStorage.delete(k),
        clear: () => mockSessionStorage.clear(),
        length: 0,
        key: () => null,
      },
      location: {
        origin: 'http://localhost:3000',
      },
    } as unknown as Window & typeof globalThis;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  it('menggunakan skop minimum drive.file', () => {
    expect(DRIVE_FILE_SCOPE).toBe('https://www.googleapis.com/auth/drive.file');
  });

  it('menginisialisasi status UNCONFIGURED jika Client ID belum ada', () => {
    const service = new GoogleAuthService();
    service.clearRuntimeClientId();
    expect(service.getAuthState()).toBe('UNCONFIGURED');
    expect(service.getClientId()).toBeNull();
  });

  it('beralih ke status DISCONNECTED saat Client ID disetel', () => {
    const service = new GoogleAuthService();
    service.setClientId('test-client-id-123.apps.googleusercontent.com');
    expect(service.getClientId()).toBe('test-client-id-123.apps.googleusercontent.com');
    expect(service.getAuthState()).toBe('DISCONNECTED');
  });

  it('mendeteksi kedaluwarsa token secara akurat dengan buffer waktu', () => {
    const service = new GoogleAuthService();
    service.setClientId('test-client-id-123');
    
    // Simulate internal token setup
    (service as unknown as { accessToken: string; tokenExpiresAt: number }).accessToken = 'mock-token';
    
    // Token expires in 30 seconds (< 60 second buffer) -> considered expired
    (service as unknown as { tokenExpiresAt: number }).tokenExpiresAt = Date.now() + 30000;
    expect(service.isTokenExpired()).toBe(true);

    // Token expires in 300 seconds (> 60 second buffer) -> valid
    (service as unknown as { tokenExpiresAt: number }).tokenExpiresAt = Date.now() + 300000;
    expect(service.isTokenExpired()).toBe(false);
  });

  it('mengirim pembaruan status ke subscriber saat status berubah', () => {
    const service = new GoogleAuthService();
    const states: string[] = [];

    const unsubscribe = service.subscribe((state) => {
      states.push(state);
    });

    service.setClientId('my-client-id');
    expect(states).toContain('DISCONNECTED');

    unsubscribe();
  });
});
