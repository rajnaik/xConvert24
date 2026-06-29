import { test, expect } from '@playwright/test';

/**
 * Blog Layout — Global Storage Helpers (__swfStore) Tests
 * Verifies window.__swfStore is available on blog pages (served via BlogLayout.astro).
 * The same helper exists in Layout.astro; this ensures BlogLayout parity.
 */

const BLOG_URL = '/blog/best-two-letter-words-scrabble/';

test.describe('BlogLayout __swfStore — Positive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BLOG_URL);
    await page.evaluate(() => localStorage.clear());
  });

  test('window.__swfStore is defined on blog pages', async ({ page }) => {
    const exists = await page.evaluate(() => typeof window.__swfStore === 'object' && window.__swfStore !== null);
    expect(exists).toBe(true);
  });

  test('all expected methods exist on __swfStore', async ({ page }) => {
    const methods = await page.evaluate(() => {
      const s = window.__swfStore;
      return {
        setWithExpiry: typeof s.setWithExpiry === 'function',
        getIfValid: typeof s.getIfValid === 'function',
        setItem: typeof s.setItem === 'function',
        getItem: typeof s.getItem === 'function',
        removeItem: typeof s.removeItem === 'function',
        setRaw: typeof s.setRaw === 'function',
        getRaw: typeof s.getRaw === 'function',
        purgeExpired: typeof s.purgeExpired === 'function',
        getNextMidnightUTC: typeof s.getNextMidnightUTC === 'function',
        has: typeof s.has === 'function',
      };
    });
    expect(Object.values(methods).every(v => v === true)).toBe(true);
  });

  test('setWithExpiry and getIfValid work on blog page', async ({ page }) => {
    const value = await page.evaluate(() => {
      window.__swfStore.setWithExpiry('blog-test', 'scrabble', '2099-01-01T00:00:00.000Z');
      return window.__swfStore.getIfValid('blog-test');
    });
    expect(value).toBe('scrabble');
  });

  test('purgeExpired auto-runs on blog page load', async ({ page }) => {
    // Seed an expired item then navigate to a blog page
    await page.evaluate(() => {
      localStorage.setItem('blog-expired', JSON.stringify({ value: 'old', expiresAt: '2020-01-01T00:00:00.000Z' }));
    });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    const item = await page.evaluate(() => localStorage.getItem('blog-expired'));
    expect(item).toBeNull();
  });

  test('getNextMidnightUTC returns valid future date on blog page', async ({ page }) => {
    const midnight = await page.evaluate(() => window.__swfStore.getNextMidnightUTC());
    const parsed = new Date(midnight);
    expect(parsed.getTime()).toBeGreaterThan(Date.now());
    expect(parsed.getUTCHours()).toBe(0);
  });

  test('data stored on homepage is readable from blog page', async ({ page }) => {
    // Store via homepage Layout
    await page.goto('/');
    await page.evaluate(() => {
      window.__swfStore.setWithExpiry('cross-layout', 'shared', '2099-12-31T23:59:59.000Z');
    });
    // Navigate to blog page (BlogLayout)
    await page.goto(BLOG_URL);
    const value = await page.evaluate(() => window.__swfStore.getIfValid('cross-layout'));
    expect(value).toBe('shared');
  });
});

test.describe('BlogLayout __swfStore — Negative', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BLOG_URL);
    await page.evaluate(() => localStorage.clear());
  });

  test('getIfValid returns null for expired key on blog page', async ({ page }) => {
    const value = await page.evaluate(() => {
      window.__swfStore.setWithExpiry('blog-stale', 'expired', '2020-06-01T00:00:00.000Z');
      return window.__swfStore.getIfValid('blog-stale');
    });
    expect(value).toBeNull();
  });

  test('has returns false for non-existent key on blog page', async ({ page }) => {
    const result = await page.evaluate(() => window.__swfStore.has('ghost'));
    expect(result).toBe(false);
  });

  test('no page errors from __swfStore on blog page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(BLOG_URL);
    await page.waitForTimeout(500);
    expect(errors.filter(e => e.includes('swfStore') || e.includes('localStorage'))).toHaveLength(0);
  });

  test('malformed JSON in localStorage does not crash blog page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.evaluate(() => {
      localStorage.setItem('broken-blog', 'not{json');
    });
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Accessing the broken key returns null gracefully
    const value = await page.evaluate(() => window.__swfStore.getIfValid('broken-blog'));
    expect(value).toBeNull();
    expect(errors.filter(e => e.includes('swfStore'))).toHaveLength(0);
  });
});
