import { test, expect } from '@playwright/test';

/**
 * BlogLayout — window.__swfStore Global Storage Helper Tests
 * Verifies the global storage utility with TTL support is available
 * on blog pages and functions correctly.
 */

const BLOG_PAGE = '/blog/what-is-scrabble/';

test.describe('BlogLayout __swfStore — Positive', () => {
  test('window.__swfStore is defined on blog pages', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const hasSWFStore = await page.evaluate(() => typeof (window as any).__swfStore === 'object');
    expect(hasSWFStore).toBe(true);
  });

  test('__swfStore exposes all expected methods', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const methods = await page.evaluate(() => {
      const store = (window as any).__swfStore;
      return {
        setWithExpiry: typeof store.setWithExpiry,
        getIfValid: typeof store.getIfValid,
        setItem: typeof store.setItem,
        getItem: typeof store.getItem,
        removeItem: typeof store.removeItem,
        setRaw: typeof store.setRaw,
        getRaw: typeof store.getRaw,
        purgeExpired: typeof store.purgeExpired,
        getNextMidnightUTC: typeof store.getNextMidnightUTC,
        has: typeof store.has,
      };
    });
    expect(methods.setWithExpiry).toBe('function');
    expect(methods.getIfValid).toBe('function');
    expect(methods.setItem).toBe('function');
    expect(methods.getItem).toBe('function');
    expect(methods.removeItem).toBe('function');
    expect(methods.setRaw).toBe('function');
    expect(methods.getRaw).toBe('function');
    expect(methods.purgeExpired).toBe('function');
    expect(methods.getNextMidnightUTC).toBe('function');
    expect(methods.has).toBe('function');
  });

  test('setItem and getItem round-trip correctly', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const value = await page.evaluate(() => {
      const store = (window as any).__swfStore;
      store.setItem('test-key-roundtrip', 'hello-world');
      return store.getItem('test-key-roundtrip');
    });
    expect(value).toBe('hello-world');
  });

  test('setWithExpiry stores value that is retrievable before expiry', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const value = await page.evaluate(() => {
      const store = (window as any).__swfStore;
      // Set expiry far in the future
      const future = new Date(Date.now() + 60000).toISOString();
      store.setWithExpiry('test-ttl-valid', 'still-valid', future);
      return store.getIfValid('test-ttl-valid');
    });
    expect(value).toBe('still-valid');
  });

  test('setWithExpiry item is removed when expired', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const value = await page.evaluate(() => {
      const store = (window as any).__swfStore;
      // Set expiry in the past
      const past = new Date(Date.now() - 1000).toISOString();
      store.setWithExpiry('test-ttl-expired', 'gone', past);
      return store.getIfValid('test-ttl-expired');
    });
    expect(value).toBeNull();
  });

  test('has() returns true for existing key and false for missing', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const result = await page.evaluate(() => {
      const store = (window as any).__swfStore;
      store.setItem('test-has-key', 'exists');
      return {
        exists: store.has('test-has-key'),
        missing: store.has('test-nonexistent-key'),
      };
    });
    expect(result.exists).toBe(true);
    expect(result.missing).toBe(false);
  });

  test('removeItem deletes the stored value', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const value = await page.evaluate(() => {
      const store = (window as any).__swfStore;
      store.setItem('test-remove-key', 'to-delete');
      store.removeItem('test-remove-key');
      return store.getItem('test-remove-key');
    });
    expect(value).toBeNull();
  });

  test('getNextMidnightUTC returns a valid future ISO string', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const result = await page.evaluate(() => {
      const store = (window as any).__swfStore;
      const midnight = store.getNextMidnightUTC();
      return { midnight, isFuture: new Date(midnight).getTime() > Date.now() };
    });
    expect(result.isFuture).toBe(true);
    expect(result.midnight).toMatch(/^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/);
  });

  test('purgeExpired removes expired items and returns count', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const purged = await page.evaluate(() => {
      const store = (window as any).__swfStore;
      // Insert two expired items directly
      const past = new Date(Date.now() - 5000).toISOString();
      store.setWithExpiry('purge-test-1', 'old1', past);
      store.setWithExpiry('purge-test-2', 'old2', past);
      return store.purgeExpired();
    });
    expect(purged).toBeGreaterThanOrEqual(2);
  });

  test('setRaw and getRaw store plain string without envelope', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const value = await page.evaluate(() => {
      const store = (window as any).__swfStore;
      store.setRaw('test-raw-key', 'plain-value');
      return store.getRaw('test-raw-key');
    });
    expect(value).toBe('plain-value');
  });
});

test.describe('BlogLayout __swfStore — Negative', () => {
  test('getItem returns null for non-existent key', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const value = await page.evaluate(() => {
      return (window as any).__swfStore.getItem('completely-nonexistent-key');
    });
    expect(value).toBeNull();
  });

  test('getIfValid handles corrupted localStorage gracefully', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const value = await page.evaluate(() => {
      // Write invalid JSON directly to localStorage
      localStorage.setItem('corrupted-key', 'not-valid-json{{{');
      return (window as any).__swfStore.getIfValid('corrupted-key');
    });
    expect(value).toBeNull();
  });

  test('no JS errors from __swfStore on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(BLOG_PAGE);
    await page.waitForLoadState('networkidle');
    const storeErrors = errors.filter(e => e.includes('__swfStore') || e.includes('localStorage'));
    expect(storeErrors).toHaveLength(0);
  });

  test('purgeExpired does not crash with empty localStorage', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const result = await page.evaluate(() => {
      // Clear everything first
      localStorage.clear();
      return (window as any).__swfStore.purgeExpired();
    });
    expect(result).toBe(0);
  });
});
