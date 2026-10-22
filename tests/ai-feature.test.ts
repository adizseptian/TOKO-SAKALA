import { describe, expect, it } from 'vitest';
import { AI_DEFAULT_ENABLED, AI_INTEGRATION_CONNECTED, AI_PREFERENCE_KEY, readAssistantPreference, writeAssistantPreference } from '@/ai-feature';

describe('preference Asisten TOKO SAKALA', () => {
  it('default OFF dan tidak menganggap model tersambung', () => {
    expect(AI_DEFAULT_ENABLED).toBe(false);
    expect(AI_INTEGRATION_CONNECTED).toBe(false);
    expect(readAssistantPreference({ getItem: () => null })).toBe(false);
  });

  it('membaca dan menyimpan OFF/ON sebagai preferensi UI saja', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); }
    };
    expect(readAssistantPreference(storage)).toBe(false);
    writeAssistantPreference(true, storage);
    expect(values.get(AI_PREFERENCE_KEY)).toBe('true');
    expect(readAssistantPreference(storage)).toBe(true);
    writeAssistantPreference(false, storage);
    expect(readAssistantPreference(storage)).toBe(false);
  });

  it('kembali ke OFF jika storage error', () => {
    expect(readAssistantPreference({ getItem: () => { throw new Error('blocked'); } })).toBe(false);
  });
});
