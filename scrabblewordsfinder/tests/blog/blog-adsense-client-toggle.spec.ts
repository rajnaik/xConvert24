import { test, expect } from '@playwright/test';

/**
 * BlogLayout AdSense Client-Side Toggle Tests
 *
 * Blog pages are now prerendered — ad containers render hidden with
 * `data-ad-toggle` + `style="display:none"`. A client script (#adsense-loader)
 * fetches /api/site-status/ and reveals them if adsense === 'ON'.
 *
 * This replaces the previous server-side KV/D1 toggle.
 */

const BLOG_PAGE = '/blog/what-is-scrabble/';

// ── Positive Tests ─────────────────────────────────────────────────────────

test.describe('Blog AdSense Client Toggle — Positive', () => {
  test('adsense-loader inline script is present in blog page head', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const script = page.locator('script#adsense-loader');
    await expect(script).toBeAttached();
  });

  test('data-ad-toggle containers exist in blog page DOM', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const adContainers = page.locator('[data-ad-toggle]');
    const count = await adContainers.count();
    expect(count).toBeGreaterThan(0);
  });

  test('ad containers start hidden (display:none) before API response', async ({ page }) => {
    // Block the site-status API to observe initial hidden state
    await page.route('**/api/site-status/**', route => route.abort());
    await page.goto(BLOG_PAGE);
    const firstContainer = page.locator('[data-ad-toggle]').first();
    await expect(firstContainer).toBeHidden();
  });

  test('ad containers become visible when site-status returns adsense ON', async ({ page }) => {
    // Mock the API to return adsense: 'ON'
    await page.route('**/api/site-status/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'green', logo_option: 1, adsense: 'ON' }),
      });
    });
    await page.goto(BLOG_PAGE);
    // Wait for the client script to process the response
    await page.waitForTimeout(1000);
    const firstContainer = page.locator('[data-ad-toggle]').first();
    // display:none is removed — container should be attached and not hidden by inline style
    const style = await firstContainer.getAttribute('style');
    expect(style).not.toContain('display:none');
    expect(style).not.toContain('display: none');
  });

  test('AdSense script tag is injected when adsense is ON', async ({ page }) => {
    await page.route('**/api/site-status/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'green', logo_option: 1, adsense: 'ON' }),
      });
    });
    await page.goto(BLOG_PAGE);
    await page.waitForTimeout(1000);
    const adsenseScript = page.locator('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]');
    await expect(adsenseScript).toBeAttached();
  });
});

// ── Negative Tests ─────────────────────────────────────────────────────────

test.describe('Blog AdSense Client Toggle — Negative', () => {
  test('ad containers stay hidden when site-status returns adsense OFF', async ({ page }) => {
    await page.route('**/api/site-status/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'green', logo_option: 1, adsense: 'OFF' }),
      });
    });
    await page.goto(BLOG_PAGE);
    await page.waitForTimeout(1000);
    const firstContainer = page.locator('[data-ad-toggle]').first();
    await expect(firstContainer).toBeHidden();
  });

  test('AdSense script is NOT injected when adsense is OFF', async ({ page }) => {
    await page.route('**/api/site-status/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'green', logo_option: 1, adsense: 'OFF' }),
      });
    });
    await page.goto(BLOG_PAGE);
    await page.waitForTimeout(1000);
    const adsenseScript = page.locator('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]');
    expect(await adsenseScript.count()).toBe(0);
  });

  test('ad containers stay hidden when site-status API fails', async ({ page }) => {
    await page.route('**/api/site-status/**', route => route.abort());
    await page.goto(BLOG_PAGE);
    await page.waitForTimeout(1000);
    const firstContainer = page.locator('[data-ad-toggle]').first();
    await expect(firstContainer).toBeHidden();
  });

  test('adsense-loader does not cause page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    // Let it hit the real API (or fail gracefully)
    await page.goto(BLOG_PAGE);
    await page.waitForTimeout(1500);
    const loaderErrors = errors.filter(e =>
      e.toLowerCase().includes('adsense') || e.toLowerCase().includes('adsbygoogle')
    );
    expect(loaderErrors).toHaveLength(0);
  });

  test('no duplicate data-ad-toggle containers of same format', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BLOG_PAGE);
    // On desktop (xl), we should have exactly: 1 banner (lg), 2 skyscrapers (xl)
    // and 1 mobile rectangle (hidden on lg+)
    const allContainers = page.locator('[data-ad-toggle]');
    const count = await allContainers.count();
    // BlogLayout has 4 ad containers: banner (lg), mobile-rect (sm only), left sky, right sky
    expect(count).toBe(4);
  });
});
