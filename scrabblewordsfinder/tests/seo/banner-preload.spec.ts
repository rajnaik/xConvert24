import { test, expect } from '@playwright/test';

/**
 * Banner Preload Link Tests
 * Verifies the <link rel="preload"> for the LCP hero banner exists in <head>.
 * Added: June 27, 2026 — performance optimization to preload banner-1.svg.
 */

const PAGES_WITH_LAYOUT = [
  '/',
  '/blog/',
  '/guide/',
  '/about/',
  '/contact/',
];

test.describe('Banner Preload — Positive', () => {
  test('homepage has preload link for banner-1.svg', async ({ page }) => {
    await page.goto('/');
    const preload = page.locator('link[rel="preload"][href="/banner-options/banner-1.svg"]');
    await expect(preload).toHaveCount(1);
    await expect(preload).toHaveAttribute('as', 'image');
    await expect(preload).toHaveAttribute('type', 'image/svg+xml');
    await expect(preload).toHaveAttribute('fetchpriority', 'high');
  });

  test('preload link exists on multiple pages using Layout', async ({ page }) => {
    for (const path of PAGES_WITH_LAYOUT) {
      await page.goto(path);
      const preload = page.locator('link[rel="preload"][href="/banner-options/banner-1.svg"]');
      const count = await preload.count();
      expect(count, `Expected preload on ${path}`).toBe(1);
    }
  });
});

test.describe('Banner Preload — Negative', () => {
  test('no duplicate preload links for banner-1.svg on homepage', async ({ page }) => {
    await page.goto('/');
    const preloads = page.locator('link[rel="preload"][href="/banner-options/banner-1.svg"]');
    const count = await preloads.count();
    expect(count).toBe(1);
  });

  test('preload link does not use wrong asset type', async ({ page }) => {
    await page.goto('/');
    const preload = page.locator('link[rel="preload"][href="/banner-options/banner-1.svg"]');
    const asAttr = await preload.getAttribute('as');
    // Must be "image", not "fetch" or "script"
    expect(asAttr).toBe('image');
  });
});
