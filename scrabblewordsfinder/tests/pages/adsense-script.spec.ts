import { test, expect } from '@playwright/test';

/**
 * AdSense Script Injection Tests
 *
 * Verifies the Google AdSense script is loaded on public pages after user
 * interaction (scroll/click/mouseover/touchstart/keydown) and excluded from
 * admin pages (per Layout.astro conditional logic).
 *
 * Updated June 27, 2026: Script loading changed from requestIdleCallback
 * to interaction-deferred (first user event or 12s fallback).
 */

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';

/** Trigger a user interaction to fire the deferred loader */
async function triggerInteraction(page: import('@playwright/test').Page) {
  await page.mouse.move(400, 300);
  await page.waitForTimeout(2000);
}

// ── AdSense Script — Positive ──────────────────────────────────────────────

test.describe('AdSense Script — Positive', () => {
  test('AdSense loader script element exists on the homepage', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const loaderScript = page.locator('script#adsense-loader');
    await expect(loaderScript).toBeAttached();
  });

  test('AdSense script injected after user interaction on homepage', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await triggerInteraction(page);
    const script = page.locator('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]');
    await expect(script).toBeAttached();
  });

  test('AdSense script has correct client ID after interaction', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await triggerInteraction(page);
    const script = page.locator('script[src*="adsbygoogle.js"]');
    const src = await script.getAttribute('src');
    expect(src).toContain('client=ca-pub-8890486330870317');
  });

  test('AdSense script has async attribute after interaction', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await triggerInteraction(page);
    const script = page.locator('script[src*="adsbygoogle.js"]');
    const asyncAttr = await script.getAttribute('async');
    expect(asyncAttr).not.toBeNull();
  });

  test('AdSense script has crossorigin attribute after interaction', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await triggerInteraction(page);
    const script = page.locator('script[src*="adsbygoogle.js"]');
    const crossorigin = await script.getAttribute('crossorigin');
    expect(crossorigin).toBe('anonymous');
  });

  test('AdSense script is injected on public pages (blog) after interaction', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/`, { waitUntil: 'networkidle' });
    await triggerInteraction(page);
    const script = page.locator('script[src*="adsbygoogle.js"]');
    await expect(script).toBeAttached();
  });

  test('AdSense script is injected on public pages (about) after interaction', async ({ page }) => {
    await page.goto(`${BASE_URL}/about/`, { waitUntil: 'networkidle' });
    await triggerInteraction(page);
    const script = page.locator('script[src*="adsbygoogle.js"]');
    await expect(script).toBeAttached();
  });
});

// ── AdSense Script — Negative ──────────────────────────────────────────────

test.describe('AdSense Script — Negative', () => {
  test('AdSense loader is NOT present on admin dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/`);
    const loader = page.locator('script#adsense-loader');
    expect(await loader.count()).toBe(0);
  });

  test('AdSense script is NOT injected on admin emails page after interaction', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/emails`);
    await triggerInteraction(page);
    const script = page.locator('script[src*="adsbygoogle.js"]');
    expect(await script.count()).toBe(0);
  });

  test('AdSense script not loaded before any interaction', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    const script = page.locator('script[src*="adsbygoogle.js"]');
    expect(await script.count()).toBe(0);
  });

  test('AdSense script does not appear more than once after interaction', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await triggerInteraction(page);
    const scripts = page.locator('script[src*="adsbygoogle.js"]');
    const count = await scripts.count();
    expect(count).toBeLessThanOrEqual(1);
  });

  test('AdSense script does not cause console errors after interaction', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE_URL}/`);
    await triggerInteraction(page);
    await page.waitForTimeout(1000);
    // Exclude all adsbygoogle-related errors — expected on non-approved domains (localhost/dev)
    const criticalErrors = errors.filter(e => !e.toLowerCase().includes('adsbygoogle'));
    expect(criticalErrors).toHaveLength(0);
  });
});
