import { test, expect } from '@playwright/test';

/**
 * Banner Preload Link — LCP Optimisation
 * Verifies the <link rel="preload"> for the hero banner SVG exists in <head>
 * so the browser fetches it before parsing the body.
 *
 * File changed: src/layouts/Layout.astro
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Banner Preload Link — Positive', () => {
  test('preload link for banner-1.svg exists in head', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const preload = page.locator('head link[rel="preload"][href="/banner-options/banner-1.svg"]');
    await expect(preload).toBeAttached();
  });

  test('preload link has correct as="image" attribute', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const preload = page.locator('head link[rel="preload"][href="/banner-options/banner-1.svg"]');
    await expect(preload).toHaveAttribute('as', 'image');
  });

  test('preload link has type="image/svg+xml"', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const preload = page.locator('head link[rel="preload"][href="/banner-options/banner-1.svg"]');
    await expect(preload).toHaveAttribute('type', 'image/svg+xml');
  });

  test('preload link has fetchpriority="high"', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const preload = page.locator('head link[rel="preload"][href="/banner-options/banner-1.svg"]');
    await expect(preload).toHaveAttribute('fetchpriority', 'high');
  });
});

test.describe('Banner Preload Link — Negative', () => {
  test('no duplicate preload links for banner-1.svg', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const preloads = page.locator('head link[rel="preload"][href="/banner-options/banner-1.svg"]');
    const count = await preloads.count();
    expect(count).toBe(1);
  });

  test('preload link is present on blog pages too (shared Layout)', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    const preload = page.locator('head link[rel="preload"][href="/banner-options/banner-1.svg"]');
    await expect(preload).toBeAttached();
  });
});
