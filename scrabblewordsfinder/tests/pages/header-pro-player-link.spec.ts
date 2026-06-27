import { test, expect } from '@playwright/test';

/**
 * Header Pro Player Link — Tests for the 🏆 Pro Player nav icon
 * Added to Header.astro linking to /blog/roadmap-to-being-a-pro-player/
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Header Pro Player Link — Positive', () => {
  test('pro player link is visible in header', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const link = page.locator('a[href="/blog/roadmap-to-being-a-pro-player/"]');
    await expect(link).toBeAttached();
  });

  test('pro player link has correct href with trailing slash', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const link = page.locator('a[href="/blog/roadmap-to-being-a-pro-player/"]');
    const href = await link.getAttribute('href');
    expect(href).toBe('/blog/roadmap-to-being-a-pro-player/');
  });

  test('pro player link has trophy emoji icon', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const link = page.locator('a[href="/blog/roadmap-to-being-a-pro-player/"]');
    const text = await link.textContent();
    expect(text).toContain('🏆');
  });

  test('pro player link has tooltip with "Pro Player" text', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const tooltip = page.locator('a[href="/blog/roadmap-to-being-a-pro-player/"] span').last();
    const text = await tooltip.textContent();
    expect(text).toContain('Pro Player');
  });

  test('pro player link target page returns 200', async ({ request }) => {
    const res = await request.get(`${BASE}/blog/roadmap-to-being-a-pro-player/`);
    expect(res.status()).toBe(200);
  });
});

test.describe('Header Pro Player Link — Negative', () => {
  test('no duplicate pro player links in header', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const links = page.locator('a[href="/blog/roadmap-to-being-a-pro-player/"]');
    const count = await links.count();
    expect(count).toBeLessThanOrEqual(1);
  });

  test('pro player link does not cause console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/`);
    await page.locator('a[href="/blog/roadmap-to-being-a-pro-player/"]').click();
    await page.waitForTimeout(1500);
    expect(errors.filter(e => !e.includes('net::') && !e.includes('adsbygoogle'))).toHaveLength(0);
  });
});
