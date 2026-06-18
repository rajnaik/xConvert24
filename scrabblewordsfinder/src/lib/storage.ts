/**
 * storage.ts — Shared localStorage helpers with TTL support
 *
 * Two modes:
 * 1. TTL-based (server-provided expiry): setWithExpiry / getIfValid
 * 2. Permanent (no expiry): setItem / getItem
 *
 * All values are stored as JSON envelopes:
 *   { value: T, expiresAt?: string (ISO 8601) }
 *
 * For permanent storage (no TTL), expiresAt is omitted.
 *
 * Usage (ES module):
 *   import { store } from '../lib/storage';
 *   store.setWithExpiry('drc-tile', data, '2026-06-19T00:00:00Z');
 *   const cached = store.getIfValid<RackData>('drc-tile');
 *
 * Usage (inline scripts):
 *   The Layout injects window.__swfStore with the same API.
 *   var cached = window.__swfStore.getIfValid('drc-tile');
 */

export interface StorageEnvelope<T = unknown> {
  value: T;
  expiresAt?: string; // ISO 8601 UTC timestamp — if omitted, never expires
}

/**
 * Store a value with a server-provided absolute expiry time.
 * When the expiry passes, getIfValid() returns null and removes the key.
 */
export function setWithExpiry<T>(key: string, value: T, expiresAt: string): void {
  try {
    const envelope: StorageEnvelope<T> = { value, expiresAt };
    localStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    // localStorage full or unavailable — fail silently
  }
}

/**
 * Retrieve a value that was stored with setWithExpiry.
 * Returns null (and removes the key) if:
 * - Key doesn't exist
 * - Data is corrupted
 * - expiresAt has passed
 */
export function getIfValid<T = unknown>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const envelope: StorageEnvelope<T> = JSON.parse(raw);

    // If there's an expiry and it has passed, clean up
    if (envelope.expiresAt && new Date(envelope.expiresAt).getTime() <= Date.now()) {
      localStorage.removeItem(key);
      return null;
    }

    return envelope.value;
  } catch {
    // Corrupted data — clean up
    localStorage.removeItem(key);
    return null;
  }
}

/**
 * Store a value permanently (no TTL). Still uses the envelope format
 * so getIfValid works uniformly, but never expires.
 */
export function setItem<T>(key: string, value: T): void {
  try {
    const envelope: StorageEnvelope<T> = { value };
    localStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    // localStorage full or unavailable
  }
}

/**
 * Retrieve a permanent value (no TTL check — just unwraps the envelope).
 * Also works for TTL values (respects expiry if present).
 */
export function getItem<T = unknown>(key: string): T | null {
  return getIfValid<T>(key);
}

/**
 * Remove a key from localStorage.
 */
export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

/**
 * Store a raw string value (no envelope). Use for legacy keys
 * that other code reads directly (e.g., 'swf-uid', 'scbDictionary').
 */
export function setRaw(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage full or unavailable
  }
}

/**
 * Retrieve a raw string value (no envelope unwrapping).
 * Use for legacy keys stored by other code.
 */
export function getRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Purge all expired keys from localStorage.
 * Scans all keys looking for our envelope format with expiresAt.
 * Call on page load for housekeeping.
 */
export function purgeExpired(): number {
  let purged = 0;
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const envelope = JSON.parse(raw);
        if (envelope && envelope.expiresAt && new Date(envelope.expiresAt).getTime() <= Date.now()) {
          localStorage.removeItem(key);
          purged++;
        }
      } catch {
        // Not our format — skip
      }
    }
  } catch {
    // localStorage unavailable
  }
  return purged;
}

/**
 * Get next midnight UTC as an ISO string.
 * Use this as the default expiresAt for daily-rotating content.
 */
export function getNextMidnightUTC(): string {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}

/**
 * Convenience: check if a cached value exists and is still valid.
 */
export function has(key: string): boolean {
  return getIfValid(key) !== null;
}

// Named export as a namespace-like object for inline scripts
// (inline scripts can't import ES modules, so they'll use window.__swfStore)
export const store = {
  setWithExpiry,
  getIfValid,
  setItem,
  getItem,
  removeItem,
  setRaw,
  getRaw,
  purgeExpired,
  getNextMidnightUTC,
  has,
};
