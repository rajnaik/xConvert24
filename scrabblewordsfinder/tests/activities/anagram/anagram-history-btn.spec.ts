import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── Anagram History Button — Positive ───────────────────────────────────
test.describe('Anagram History Button — Positive', () => {
  test('history button element exists in the DOM', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const btn = page.locator('#anagram-history-btn');
    await expect(btn).toBeAttached();
  });

  test('history button links to /anagram-history/', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const btn = page.locator('#anagram-history-btn');
    await expect(btn).toHaveAttribute('href', '/anagram-history/');
  });

  test('history button has correct title attribute', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const btn = page.locator('#anagram-history-btn');
    await expect(btn).toHaveAttribute('title', 'Anagram History');
  });

  test('history button contains a clock SVG icon', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const svg = page.locator('#anagram-history-btn svg');
    await expect(svg).toBeAttached();
  });

  test('history button becomes visible when user has played games', async ({ page }) => {
    // Mock the anagram-history count API to return count >= 1
    await page.route('**/api/anagram-history/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 3 }),
      });
    });

    // Set a uid so the fetch fires
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-user-history');
    });

    await page.goto(ACTIVITIES_URL);
    const btn = page.locator('#anagram-history-btn');
    await expect(btn).toBeVisible({ timeout: 5000 });
  });

  test('history count API is called with trailing slash path', async ({ page }) => {
    let requestedUrl = '';
    await page.route('**/api/anagram-history/**', (route) => {
      requestedUrl = new URL(route.request().url()).pathname;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 1 }),
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-user-url-check');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(2000);
    expect(requestedUrl).toBe('/api/anagram-history/');
  });
});

// ── Anagram History Button — Negative ───────────────────────────────────
test.describe('Anagram History Button — Negative', () => {
  test('history button is hidden by default (no play history)', async ({ page }) => {
    // Mock API returning zero games
    await page.route('**/api/anagram-history/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ count: 0 }),
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-user-no-history');
    });

    await page.goto(ACTIVITIES_URL);
    // Wait for JS to run
    await page.waitForTimeout(1500);
    const btn = page.locator('#anagram-history-btn');
    await expect(btn).toBeHidden();
  });

  test('history button stays hidden when no uid is set', async ({ page }) => {
    // Without a uid, the fetch shouldn't fire at all
    await page.addInitScript(() => {
      localStorage.removeItem('swf-uid');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(1500);
    const btn = page.locator('#anagram-history-btn');
    await expect(btn).toBeHidden();
  });

  test('no duplicate history buttons exist on the page', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const btns = page.locator('#anagram-history-btn');
    await expect(btns).toHaveCount(1);
  });

  test('history button does not crash if API fails', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.route('**/api/anagram-history/**', (route) => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-user-error');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(2000);

    // Button should remain hidden
    const btn = page.locator('#anagram-history-btn');
    await expect(btn).toBeHidden();

    // No critical page errors
    expect(errors.filter((e) => e.includes('anagram'))).toHaveLength(0);
  });
});
