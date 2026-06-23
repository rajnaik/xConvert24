import { test, expect } from '@playwright/test';

/**
 * AdSense Script Injection Tests
 *
 * Verifies the Google AdSense script is loaded on public pages
 * and excluded from admin pages (per Layout.astro conditional logic).
 */

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';

// ── AdSense Script — Positive ──────────────────────────────────────────────

test.describe('AdSense Script — Positive', () => {
  test('AdSense script tag is present on the homepage', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const script = page.locator('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]');
    await expect(script).toBeAttached();
  });

  test('AdSense script has correct client ID', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const script = page.locator('script[src*="adsbygoogle.js"]');
    const src = await script.getAttribute('src');
    expect(src).toContain('client=ca-pub-8890486330870317');
  });

  test('AdSense script has async attribute', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const script = page.locator('script[src*="adsbygoogle.js"]');
    const asyncAttr = await script.getAttribute('async');
    expect(asyncAttr).not.toBeNull();
  });

  test('AdSense script has crossorigin attribute', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const script = page.locator('script[src*="adsbygoogle.js"]');
    const crossorigin = await script.getAttribute('crossorigin');
    expect(crossorigin).toBe('anonymous');
  });

  test('AdSense script is present on public pages (blog)', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/`);
    const script = page.locator('script[src*="adsbygoogle.js"]');
    await expect(script).toBeAttached();
  });

  test('AdSense script is present on public pages (about)', async ({ page }) => {
    await page.goto(`${BASE_URL}/about/`);
    const script = page.locator('script[src*="adsbygoogle.js"]');
    await expect(script).toBeAttached();
  });
});

// ── AdSense Script — Negative ──────────────────────────────────────────────

test.describe('AdSense Script — Negative', () => {
  test('AdSense script is NOT present on admin dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/`);
    const script = page.locator('script[src*="adsbygoogle.js"]');
    expect(await script.count()).toBe(0);
  });

  test('AdSense script is NOT present on admin emails page', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/emails`);
    const script = page.locator('script[src*="adsbygoogle.js"]');
    expect(await script.count()).toBe(0);
  });

  test('AdSense script does not appear more than once on a page', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const scripts = page.locator('script[src*="adsbygoogle.js"]');
    const count = await scripts.count();
    expect(count).toBeLessThanOrEqual(1);
  });

  test('AdSense script does not cause console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(2000);
    const adsenseErrors = errors.filter(e => e.toLowerCase().includes('adsbygoogle'));
    expect(adsenseErrors).toHaveLength(0);
  });
});
