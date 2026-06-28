import { test, expect } from '@playwright/test';

/**
 * Banner Image Performance Attributes
 * Verifies the hero banner <img> has width, height, and fetchpriority="high"
 * to prevent CLS and prioritise LCP loading.
 *
 * File changed: src/components/Header.astro
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Banner Image — Positive', () => {
  test('banner img has explicit width and height attributes', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const img = page.locator('img[id$="-img"][alt="Scrabble Word Finder"]').first();
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('width', '1200');
    await expect(img).toHaveAttribute('height', '80');
  });

  test('banner img has fetchpriority="high"', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const img = page.locator('img[id$="-img"][alt="Scrabble Word Finder"]').first();
    await expect(img).toHaveAttribute('fetchpriority', 'high');
  });
});

test.describe('Banner Image — Negative', () => {
  test('no duplicate banner images on homepage', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const banners = page.locator('img[id$="-img"][alt="Scrabble Word Finder"]');
    // Should be exactly 1 (main header only on homepage)
    const count = await banners.count();
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(2); // main + blog layout at most
  });

  test('banner img does not use loading="lazy" (LCP element)', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const img = page.locator('img[id$="-img"][alt="Scrabble Word Finder"]').first();
    const loading = await img.getAttribute('loading');
    expect(loading).not.toBe('lazy');
  });
});
