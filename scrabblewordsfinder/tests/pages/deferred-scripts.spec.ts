import { test, expect } from '@playwright/test';

/**
 * Interaction-Deferred Script Loading — Layout.astro
 *
 * Tests that AdSense and gtag scripts are loaded only after user interaction
 * (scroll/click/mouseover/touchstart/keydown) with a 12s fallback timeout,
 * reducing unused JavaScript on initial page load.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Interaction-Deferred Script Loading — Positive', () => {
  test('adsense-loader uses interaction-based trigger pattern', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const script = page.locator('script#adsense-loader');
    await expect(script).toBeAttached();
    const content = await script.textContent();
    // Verifies the interaction event listeners are registered
    expect(content).toContain('scroll');
    expect(content).toContain('click');
    expect(content).toContain('touchstart');
    expect(content).toContain('addEventListener');
  });

  test('gtag-loader uses interaction-based trigger pattern', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const script = page.locator('script#gtag-loader');
    await expect(script).toBeAttached();
    const content = await script.textContent();
    expect(content).toContain('scroll');
    expect(content).toContain('click');
    expect(content).toContain('touchstart');
    expect(content).toContain('addEventListener');
  });

  test('gtag consent defaults are set before config calls', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const html = await page.content();
    // Consent default must appear in inline script before any gtag('config',...)
    const consentIdx = html.indexOf("gtag('consent','default'");
    const configIdx = html.indexOf("gtag('config'");
    expect(consentIdx).toBeGreaterThan(-1);
    expect(configIdx).toBeGreaterThan(-1);
    expect(consentIdx).toBeLessThan(configIdx);
  });

  test('gtag script not loaded until user interaction occurs', async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    // Before interaction, no gtag script element with src should exist
    const gtagBefore = await page.locator('script[src*="googletagmanager.com/gtag/js"]').count();
    expect(gtagBefore).toBe(0);
    // Trigger interaction
    await page.mouse.move(400, 300);
    await page.waitForTimeout(1500);
    // After interaction, at least one gtag script should be injected
    const gtagAfter = await page.locator('script[src*="googletagmanager.com/gtag/js"]').count();
    expect(gtagAfter).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Interaction-Deferred Script Loading — Negative', () => {
  test('no synchronous gtag script tag in initial HTML source', async ({ request }) => {
    const res = await request.get(`${BASE}/`);
    const html = await res.text();
    // Should NOT have a static <script src="...gtag..."> tag in the raw HTML
    const hasStaticGtagSrc = /<script[^>]+src="[^"]*googletagmanager\.com\/gtag\/js[^"]*"[^>]*>/i.test(html);
    expect(hasStaticGtagSrc).toBe(false);
  });

  test('no page errors from interaction-deferred loading', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/`);
    // Simulate interaction to trigger the loaders
    await page.mouse.click(400, 300);
    await page.waitForTimeout(3000);
    // Filter out benign errors: network issues and AdSense slot warnings
    const relevant = errors.filter(e =>
      !e.includes('net::') && !e.includes('adsbygoogle')
    );
    expect(relevant).toHaveLength(0);
  });
});
