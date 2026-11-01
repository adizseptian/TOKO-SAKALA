import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Inisialisasi Supabase Client untuk TOKO SAKALA
 * Menggunakan public URL dan anon key (Client-Side Safe, Rp0 Free Tier)
 * Dilengkapi dengan fallback runtime credentials (sessionStorage)
 */

const ENV_URL = typeof import.meta !== 'undefined' && import.meta.env
  ? (import.meta.env.VITE_SUPABASE_URL as string | undefined)
  : undefined;

const ENV_ANON_KEY = typeof import.meta !== 'undefined' && import.meta.env
  ? (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
  : undefined;

const RUNTIME_URL_KEY = 'toko_sakala_supabase_url';
const RUNTIME_ANON_KEY = 'toko_sakala_supabase_anon_key';

function getStoredItem(key: string): string {
  try {
    if (typeof localStorage !== 'undefined') {
      const val = localStorage.getItem(key);
      if (val) return val;
    }
    if (typeof sessionStorage !== 'undefined') {
      const val = sessionStorage.getItem(key);
      if (val) return val;
    }
  } catch {
    // Ignore storage errors
  }
  return '';
}

function setStoredItem(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(key, value);
    }
  } catch {
    // Ignore
  }
}

function removeStoredItem(key: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(key);
    }
  } catch {
    // Ignore
  }
}

let cachedClient: SupabaseClient | null = null;
let currentUrl: string = ENV_URL || getStoredItem(RUNTIME_URL_KEY);
let currentKey: string = ENV_ANON_KEY || getStoredItem(RUNTIME_ANON_KEY);

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  return {
    url: currentUrl,
    anonKey: currentKey,
  };
}

export function isSupabaseConfigured(): boolean {
  return Boolean(currentUrl && currentKey);
}

export function setSupabaseCredentials(url: string, anonKey: string): void {
  currentUrl = url.trim();
  currentKey = anonKey.trim();
  setStoredItem(RUNTIME_URL_KEY, currentUrl);
  setStoredItem(RUNTIME_ANON_KEY, currentKey);
  cachedClient = null; // Invalidate cache agar client diinisialisasi ulang
}

export function clearSupabaseCredentials(): void {
  currentUrl = '';
  currentKey = '';
  removeStoredItem(RUNTIME_URL_KEY);
  removeStoredItem(RUNTIME_ANON_KEY);
  cachedClient = null;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(currentUrl, currentKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return cachedClient;
}

/**
 * Supabase Auth: Masuk dengan OTP / Magic Link untuk Pemilik Toko
 */
export async function signInOwnerWithOtp(email: string = 'adizseptian@gmail.com'): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase belum dikonfigurasi.' };
  }

  try {
    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Gagal mengirim tautan masuk.' };
  }
}

/**
 * Supabase Auth: Keluar dari sesi pemilik
 */
export async function signOutOwner(): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    await client.auth.signOut().catch(() => {});
  }
}

/**
 * Supabase Auth: Dapatkan user aktif
 */
export async function getCurrentOwnerUser() {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data: { user } } = await client.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
