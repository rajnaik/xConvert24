import { test, expect } from '@playwright/test';

/**
 * Global Storage Helpers (__swfStore) Tests
 * Tests the window.__swfStore utility available on every page via Layout.astro.
 * Covers: setWithExpiry, getIfValid, setItem, getItem, removeItem,
 *         setRaw, getRaw, purgeExpired, getNextMidnightUTC, has
 */

test.describe('Global Storage Helpers — Positive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('window.__swfStore is defined on the page', async ({ page }) => {
    const exists = await page.evaluate(() => typeof window.__swfStore === 'object' && window.__swfStore !== null);
    expect(exists).toBe(true);
  });

  test('setWithExpiry stores value with expiresAt envelope', async ({ page }) => {
    const stored = await page.evaluate(() => {
      window.__swfStore.setWithExpiry('test-key', 'hello', '2099-01-01T00:00:00.000Z');
      const raw = localStorage.getItem('test-key');
      return raw ? JSON.parse(raw) : null;
    });
    expect(stored).not.toBeNull();
    expect(stored.value).toBe('hello');
    expect(stored.expiresAt).toBe('2099-01-01T00:00:00.000Z');
  });

  test('getIfValid returns value for non-expired key', async ({ page }) => {
    const value = await page.evaluate(() => {
      window.__swfStore.setWithExpiry('valid-key', { foo: 'bar' }, '2099-12-31T23:59:59.000Z');
      return window.__swfStore.getIfValid('valid-key');
    });
    expect(value).toEqual({ foo: 'bar' });
  });

  test('setItem and getItem work without TTL', async ({ page }) => {
    const value = await page.evaluate(() => {
      window.__swfStore.setItem('simple-key', 42);
      return window.__swfStore.getItem('simple-key');
    });
    expect(value).toBe(42);
  });

  test('setItem stores complex objects', async ({ page }) => {
    const value = await page.evaluate(() => {
      const data = { words: ['qi', 'za'], score: 100 };
      window.__swfStore.setItem('complex', data);
      return window.__swfStore.getItem('complex');
    });
    expect(value).toEqual({ words: ['qi', 'za'], score: 100 });
  });

  test('removeItem deletes the key', async ({ page }) => {
    const result = await page.evaluate(() => {
      window.__swfStore.setItem('to-delete', 'bye');
      window.__swfStore.removeItem('to-delete');
      return localStorage.getItem('to-delete');
    });
    expect(result).toBeNull();
  });

  test('setRaw and getRaw handle plain strings', async ({ page }) => {
    const value = await page.evaluate(() => {
      window.__swfStore.setRaw('raw-key', 'plain-text');
      return window.__swfStore.getRaw('raw-key');
    });
    expect(value).toBe('plain-text');
  });

  test('has returns true for existing non-expired key', async ({ page }) => {
    const result = await page.evaluate(() => {
      window.__swfStore.setWithExpiry('exists', true, '2099-01-01T00:00:00.000Z');
      return window.__swfStore.has('exists');
    });
    expect(result).toBe(true);
  });

  test('getNextMidnightUTC returns a valid future ISO date', async ({ page }) => {
    const midnight = await page.evaluate(() => window.__swfStore.getNextMidnightUTC());
    const parsed = new Date(midnight);
    expect(parsed.getTime()).toBeGreaterThan(Date.now());
    expect(parsed.getUTCHours()).toBe(0);
    expect(parsed.getUTCMinutes()).toBe(0);
    expect(parsed.getUTCSeconds()).toBe(0);
  });

  test('purgeExpired removes expired keys and returns count', async ({ page }) => {
    const purged = await page.evaluate(() => {
      // Set an already-expired item directly in localStorage
      localStorage.setItem('expired-1', JSON.stringify({ value: 'old', expiresAt: '2020-01-01T00:00:00.000Z' }));
      localStorage.setItem('expired-2', JSON.stringify({ value: 'old2', expiresAt: '2021-06-15T00:00:00.000Z' }));
      // Set a valid item
      window.__swfStore.setWithExpiry('still-valid', 'keep', '2099-01-01T00:00:00.000Z');
      return window.__swfStore.purgeExpired();
    });
    expect(purged).toBeGreaterThanOrEqual(2);

    // Verify expired keys are gone but valid one remains
    const results = await page.evaluate(() => ({
      expired1: localStorage.getItem('expired-1'),
      expired2: localStorage.getItem('expired-2'),
      valid: window.__swfStore.getIfValid('still-valid'),
    }));
    expect(results.expired1).toBeNull();
    expect(results.expired2).toBeNull();
    expect(results.valid).toBe('keep');
  });

  test('__swfStore persists across page reloads', async ({ page }) => {
    // Store a value, reload, confirm it's still accessible via __swfStore
    await page.evaluate(() => {
      window.__swfStore.setWithExpiry('reload-test', 'persisted', '2099-01-01T00:00:00.000Z');
    });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    const value = await page.evaluate(() => window.__swfStore.getIfValid('reload-test'));
    expect(value).toBe('persisted');
  });

  test('purgeExpired runs automatically via idle callback after page load', async ({ page }) => {
    // Seed an expired item, then navigate — purge fires via requestIdleCallback/setTimeout
    await page.evaluate(() => {
      localStorage.setItem('auto-purge-test', JSON.stringify({ value: 'stale', expiresAt: '2019-01-01T00:00:00.000Z' }));
    });
    await page.reload();
    // Wait for the idle callback (or setTimeout fallback) to fire and purge expired items
    await page.waitForFunction(() => localStorage.getItem('auto-purge-test') === null, null, { timeout: 5000 });
    const item = await page.evaluate(() => localStorage.getItem('auto-purge-test'));
    expect(item).toBeNull();
  });

  test('purgeExpired deferred execution does not block page interactivity', async ({ page }) => {
    // Verify that __swfStore is immediately usable even before purge completes
    await page.evaluate(() => {
      // Seed many expired items to make purge "heavier"
      for (let i = 0; i < 50; i++) {
        localStorage.setItem(`bulk-expired-${i}`, JSON.stringify({ value: i, expiresAt: '2018-01-01T00:00:00.000Z' }));
      }
    });
    await page.reload();
    // __swfStore should be immediately available for reads/writes even while purge is pending
    const canUseStore = await page.evaluate(() => {
      window.__swfStore.setWithExpiry('immediate-use', 'works', '2099-01-01T00:00:00.000Z');
      return window.__swfStore.getIfValid('immediate-use');
    });
    expect(canUseStore).toBe('works');
    // Eventually the expired items get purged
    await page.waitForFunction(() => localStorage.getItem('bulk-expired-0') === null, null, { timeout: 5000 });
  });
});

test.describe('Global Storage Helpers — Negative', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('getIfValid returns null for expired key', async ({ page }) => {
    const value = await page.evaluate(() => {
      window.__swfStore.setWithExpiry('expired-key', 'stale', '2020-01-01T00:00:00.000Z');
      return window.__swfStore.getIfValid('expired-key');
    });
    expect(value).toBeNull();
  });

  test('expired key is removed from localStorage on access', async ({ page }) => {
    const raw = await page.evaluate(() => {
      window.__swfStore.setWithExpiry('expired-remove', 'gone', '2020-06-01T00:00:00.000Z');
      window.__swfStore.getIfValid('expired-remove'); // triggers removal
      return localStorage.getItem('expired-remove');
    });
    expect(raw).toBeNull();
  });

  test('getIfValid returns null for non-existent key', async ({ page }) => {
    const value = await page.evaluate(() => window.__swfStore.getIfValid('does-not-exist'));
    expect(value).toBeNull();
  });

  test('getItem returns null for non-existent key', async ({ page }) => {
    const value = await page.evaluate(() => window.__swfStore.getItem('nope'));
    expect(value).toBeNull();
  });

  test('has returns false for non-existent key', async ({ page }) => {
    const result = await page.evaluate(() => window.__swfStore.has('ghost-key'));
    expect(result).toBe(false);
  });

  test('has returns false for expired key', async ({ page }) => {
    const result = await page.evaluate(() => {
      window.__swfStore.setWithExpiry('has-expired', 'x', '2020-01-01T00:00:00.000Z');
      return window.__swfStore.has('has-expired');
    });
    expect(result).toBe(false);
  });

  test('getIfValid handles malformed JSON gracefully', async ({ page }) => {
    const value = await page.evaluate(() => {
      localStorage.setItem('bad-json', '{not valid json!!!');
      return window.__swfStore.getIfValid('bad-json');
    });
    expect(value).toBeNull();

    // Key should be removed after parse failure
    const remains = await page.evaluate(() => localStorage.getItem('bad-json'));
    expect(remains).toBeNull();
  });

  test('purgeExpired does not remove non-envelope items', async ({ page }) => {
    const value = await page.evaluate(() => {
      localStorage.setItem('plain-string', 'just-a-string');
      window.__swfStore.purgeExpired();
      return localStorage.getItem('plain-string');
    });
    // Plain strings won't parse to an envelope with expiresAt, so they survive
    expect(value).toBe('just-a-string');
  });

  test('removeItem does not throw on non-existent key', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.evaluate(() => {
      window.__swfStore.removeItem('never-existed');
    });

    expect(errors.filter(e => e.includes('swfStore'))).toHaveLength(0);
  });

  test('no page errors from __swfStore on fresh load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    await page.waitForTimeout(500);

    expect(errors.filter(e => e.includes('swfStore') || e.includes('localStorage'))).toHaveLength(0);
  });
});
