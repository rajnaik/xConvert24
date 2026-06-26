import { test, expect } from '@playwright/test';

/**
 * Ad Unit Placement Tests
 *
 * Verifies that AdUnit components render correctly on public pages
 * with proper slot IDs and format attributes, and are hidden on admin pages.
 */

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';

// ── Ad Unit Placements — Positive ──────────────────────────────────────────

test.describe('Ad Unit Placements — Positive', () => {
  test('banner ad unit exists on homepage with correct slot ID', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const bannerAd = page.locator('.ad-unit--banner ins.adsbygoogle[data-ad-slot="4433159473"]');
    await expect(bannerAd).toBeAttached();
  });

  test('banner ad unit has correct data-ad-client attribute', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const bannerAd = page.locator('.ad-unit--banner ins.adsbygoogle');
    const client = await bannerAd.getAttribute('data-ad-client');
    expect(client).toBe('ca-pub-8890486330870317');
  });

  test('banner ad unit container has data-ad-format="banner"', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const container = page.locator('[data-ad-format="banner"]');
    await expect(container).toBeAttached();
  });

  test('rectangle ad unit exists on homepage with correct slot ID', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const rectAd = page.locator('.ad-unit--rectangle ins.adsbygoogle[data-ad-slot="6908113726"]');
    await expect(rectAd.first()).toBeAttached();
  });

  test('skyscraper ad unit exists on homepage with correct slot ID', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const skyAd = page.locator('.ad-unit--skyscraper ins.adsbygoogle[data-ad-slot="2761553378"]');
    await expect(skyAd).toBeAttached();
  });
});

// ── Ad Unit Placements — Negative ──────────────────────────────────────────

test.describe('Ad Unit Placements — Negative', () => {
  test('no ad units on admin dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/`);
    const adUnits = page.locator('.ad-unit ins.adsbygoogle');
    expect(await adUnits.count()).toBe(0);
  });

  test('no placeholder ad divs when slot is configured', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    // The banner slot is configured so there should be no placeholder
    const placeholder = page.locator('.ad-unit--banner >> text=Ad: banner');
    expect(await placeholder.count()).toBe(0);
  });

  test('banner ad unit does not appear more than once in the header area', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const bannerAds = page.locator('.ad-unit--banner ins.adsbygoogle[data-ad-slot="4433159473"]');
    const count = await bannerAds.count();
    expect(count).toBe(1);
  });

  test('ad units do not cause page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(1500);
    const adErrors = errors.filter(e => e.toLowerCase().includes('ad') && !e.includes('adsbygoogle'));
    expect(adErrors).toHaveLength(0);
  });
});
