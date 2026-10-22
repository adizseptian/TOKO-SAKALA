export const AI_PREFERENCE_KEY = 'toko-sakala:assistant-enabled:v1';
export const AI_DEFAULT_ENABLED = false;

/** Reads only a UI preference. This module never calls an AI provider. */
export function readAssistantPreference(storage?: Pick<Storage, 'getItem'> | null): boolean {
  try {
    const stored = storage?.getItem(AI_PREFERENCE_KEY);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
  } catch {
    // Private browsing or storage restrictions: safely return the default.
  }
  return AI_DEFAULT_ENABLED;
}

/** Saves only a UI preference; no money or shop data is persisted. */
export function writeAssistantPreference(enabled: boolean, storage?: Pick<Storage, 'setItem'> | null): void {
  try {
    storage?.setItem(AI_PREFERENCE_KEY, String(enabled));
  } catch {
    // UI still works for this session if storage is unavailable.
  }
}

export const AI_INTEGRATION_CONNECTED = false;
