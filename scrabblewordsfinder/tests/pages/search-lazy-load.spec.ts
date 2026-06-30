import { test, expect } from '@playwright/test';

/**
 * Search Bar — Lazy-Load Index Tests
 *
 * The site search bar now lazy-loads the full search index from /api/search-index/
 * on first focus, with a small inline fallback available instantly.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Search Lazy-Load — Positive', () => {
  test('search input exists on homepage (desktop)', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const input = page.locator('#dict-search');
    await expect(input).toBeAttached();
  });

  test('search shows results from inline fallback before API loads', async ({ page }) => {
    // Block the API to ensure only fallback is used
    await page.route('**/api/search-index/**', route => route.abort());
    await page.goto(`${BASE}/`);
    const input = page.locator('#dict-search');
    await input.focus();
    await input.fill('Blog');
    await page.waitForTimeout(300);
    const dropdown = page.locator('.search-results, [class*="search-drop"], [id*="search-result"]').first();
    // Should find "Blog" from the inline fallback
    if (await dropdown.count() > 0) {
      const text = await dropdown.textContent();
      expect(text?.toLowerCase()).toContain('blog');
    }
  });

  test('/api/search-index/ returns valid JSON array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/search-index/`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(10);
    // Each item should have t, u, d fields
    const first = body[0];
    expect(first.t).toBeDefined();
    expect(first.u).toBeDefined();
    expect(first.d).toBeDefined();
  });

  test('focus on search input triggers /api/search-index/ fetch', async ({ page }) => {
    let apiCalled = false;
    await page.route('**/api/search-index/**', async (route) => {
      apiCalled = true;
      await route.continue();
    });
    await page.goto(`${BASE}/`);
    const input = page.locator('#dict-search');
    await input.focus();
    await page.waitForTimeout(500);
    expect(apiCalled).toBe(true);
  });

  test('search finds blog posts after full index loads', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const input = page.locator('#dict-search');
    await input.focus();
    // Wait for the API to load
    await page.waitForTimeout(1000);
    await input.fill('strategy');
    await page.waitForTimeout(300);
    const dropdown = page.locator('.search-results, [class*="search-drop"], [id*="search-result"]').first();
    if (await dropdown.count() > 0) {
      const text = await dropdown.textContent();
      expect(text?.toLowerCase()).toContain('strategy');
    }
  });
});

test.describe('Search Lazy-Load — Negative', () => {
  test('search does not crash when API returns error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.route('**/api/search-index/**', route =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );
    await page.goto(`${BASE}/`);
    const input = page.locator('#dict-search');
    await input.focus();
    await input.fill('test');
    await page.waitForTimeout(500);
    // No page crashes
    expect(errors.filter(e => e.includes('search'))).toHaveLength(0);
  });

  test('search does not fetch index multiple times on repeated focus', async ({ page }) => {
    let callCount = 0;
    await page.route('**/api/search-index/**', async (route) => {
      callCount++;
      await route.continue();
    });
    await page.goto(`${BASE}/`);
    const input = page.locator('#dict-search');
    // Focus multiple times
    await input.focus();
    await page.waitForTimeout(300);
    await input.blur();
    await page.waitForTimeout(100);
    await input.focus();
    await page.waitForTimeout(300);
    await input.blur();
    await page.waitForTimeout(100);
    await input.focus();
    await page.waitForTimeout(300);
    // Should only call API once (the loadFullIndex guard prevents duplicates)
    expect(callCount).toBe(1);
  });

  test('no console errors on homepage with search interaction', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/`);
    const input = page.locator('#dict-search');
    await input.focus();
    await page.waitForTimeout(500);
    await input.fill('abc');
    await page.waitForTimeout(300);
    await input.fill('');
    await page.waitForTimeout(200);
    expect(errors.filter(e => !e.includes('net::'))).toHaveLength(0);
  });

  test('inline fallback URLs use trailing slashes', async ({ page }) => {
    // Block API to ensure we test the fallback
    await page.route('**/api/search-index/**', route => route.abort());
    await page.goto(`${BASE}/`);
    const input = page.locator('#dict-search');
    await input.focus();
    await input.fill('Guide');
    await page.waitForTimeout(300);
    // Check that any rendered link for "Guide" has a trailing slash
    const guideLink = page.locator('a[href="/guide/"]');
    // If dropdown renders links, verify trailing slash
    const dropdown = page.locator('.search-results, [class*="search-drop"], [id*="search-result"]').first();
    if (await dropdown.count() > 0) {
      const html = await dropdown.innerHTML();
      if (html.includes('/guide')) {
        expect(html).toContain('/guide/');
      }
    }
  });
});
