import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';

// ── Search Lazy-Load Index — Positive ───────────────────────────────────────

test.describe('Search Lazy-Load Index — Positive', () => {
  test('search works with inline fallback before API loads (e.g. "Blog")', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    // Block the search-index API to ensure we test fallback only
    await page.route('**/api/search-index/**', (route) => route.abort());
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.focus();
    await input.fill('Blog');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    await expect(resultsBox.locator('a[href="/blog/"]')).toHaveCount(1);
  });

  test('focus on search input triggers /api/search-index/ fetch', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    let apiCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('/api/search-index/')) apiCalled = true;
    });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.focus();
    // Wait for the API call to be triggered
    await page.waitForTimeout(500);
    expect(apiCalled).toBe(true);
  });

  test('after lazy-load completes, search finds pages not in inline fallback', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    // Focus triggers loadFullIndex()
    await input.focus();
    // Wait for the API response to come back
    await page.waitForResponse((resp) => resp.url().includes('/api/search-index/') && resp.status() === 200);
    // Now search for a page only in the full index (e.g. "Roadmap")
    await input.fill('Roadmap');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    await expect(resultsBox.locator('a[href="/roadmap/"]')).toHaveCount(1);
  });

  test('lazy-loaded index includes pages not in inline fallback (e.g. "Privacy")', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.focus();
    await page.waitForResponse((resp) => resp.url().includes('/api/search-index/') && resp.status() === 200);
    // "Privacy" is in the full index (SITE_PAGES) but NOT in the inline fallback
    await input.fill('Privacy');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    await expect(resultsBox.locator('a[href="/privacy/"]')).toHaveCount(1);
  });

  test('/api/search-index/ returns valid JSON array', async ({ page }) => {
    await page.goto(BASE_URL);
    const response = await page.request.get(`${BASE_URL}/api/search-index/`);
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(10);
    // Each entry should have t, u, d properties
    const first = data[0];
    expect(first).toHaveProperty('t');
    expect(first).toHaveProperty('u');
    expect(first).toHaveProperty('d');
  });

  test('/api/search-index/ entries all have trailing-slash URLs', async ({ page }) => {
    await page.goto(BASE_URL);
    const response = await page.request.get(`${BASE_URL}/api/search-index/`);
    const data = await response.json();
    for (const entry of data) {
      expect(entry.u).toMatch(/\/$/);
    }
  });

  test('second focus does not re-fetch the API (cached in memory)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    let fetchCount = 0;
    page.on('request', (req) => {
      if (req.url().includes('/api/search-index/')) fetchCount++;
    });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    // First focus triggers fetch
    await input.focus();
    await page.waitForResponse((resp) => resp.url().includes('/api/search-index/') && resp.status() === 200);
    // Blur and re-focus
    await page.locator('body').click({ position: { x: 50, y: 50 } });
    await input.focus();
    await page.waitForTimeout(500);
    // Should only have fetched once
    expect(fetchCount).toBe(1);
  });

  test('mobile search focus also triggers lazy-load', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    let apiCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('/api/search-index/')) apiCalled = true;
    });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search-mobile');
    await input.focus();
    await page.waitForTimeout(500);
    expect(apiCalled).toBe(true);
  });
});

// ── Search Lazy-Load Index — Negative ───────────────────────────────────────

test.describe('Search Lazy-Load Index — Negative', () => {
  test('search gracefully degrades when API fails (uses inline fallback)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    // Block the API call to simulate failure
    await page.route('**/api/search-index/**', (route) => route.abort());
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.focus();
    await page.waitForTimeout(500);
    // Should still work with fallback pages (FAQ is in inline list)
    await input.fill('FAQ');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    await expect(resultsBox.locator('a[href="/faq/"]')).toHaveCount(1);
  });

  test('when API fails, pages only in full index show "No results"', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/search-index/**', (route) => route.abort());
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.focus();
    await page.waitForTimeout(500);
    // "Roadmap" is NOT in the inline fallback — only in the full index
    await input.fill('Roadmap');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    await expect(resultsBox).toContainText('No results');
  });

  test('no JavaScript errors during search index load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.focus();
    await page.waitForTimeout(1000);
    await input.fill('guide');
    await page.waitForTimeout(300);
    const searchErrors = errors.filter((e) => e.toLowerCase().includes('search') || e.toLowerCase().includes('pages'));
    expect(searchErrors).toHaveLength(0);
  });

  test('API returning empty array keeps inline fallback working', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    // Return empty array from API
    await page.route('**/api/search-index/**', (route) => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    await page.goto(BASE_URL);
    const input = page.locator('#dict-search');
    await input.focus();
    await page.waitForTimeout(500);
    // Inline fallback should still be active since empty array is falsy for .length check
    await input.fill('Settings');
    await page.waitForTimeout(300);
    const resultsBox = input.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    await expect(resultsBox.locator('a[href="/settings/"]')).toHaveCount(1);
  });
});
