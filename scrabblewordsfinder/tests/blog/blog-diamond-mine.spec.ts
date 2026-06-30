import { test, expect } from '@playwright/test';

/**
 * Diamond Mine on BlogLayout — Tests
 * Verifies the Diamond Mine collectible feature works correctly
 * on blog pages rendered via BlogLayout.astro.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';
const BLOG_PAGE = '/blog/what-is-scrabble/';
const TEST_UID = 'test-blog-diamond-mine';

test.describe('Diamond Mine BlogLayout — Positive', () => {
  test('diamond gem renders on blog page when API returns unclaimed diamond', async ({ page }) => {
    await page.goto(`${BASE}${BLOG_PAGE}`);
    await page.evaluate((uid) => localStorage.setItem('swf-uid', uid), TEST_UID);

    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [{ id: 200, diamonds_per_claim: 3, already_claimed: false }],
          }),
        });
      } else if (request.method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, diamonds_earned: 3 }),
        });
      }
    });

    await page.goto(`${BASE}${BLOG_PAGE}`);
    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).toBeVisible({ timeout: 5000 });
  });

  test('diamond gem on blog page has correct accessibility attributes', async ({ page }) => {
    await page.goto(`${BASE}${BLOG_PAGE}`);
    await page.evaluate((uid) => localStorage.setItem('swf-uid', uid), TEST_UID);

    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [{ id: 201, diamonds_per_claim: 5, already_claimed: false }],
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto(`${BASE}${BLOG_PAGE}`);
    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).toBeVisible({ timeout: 5000 });
    await expect(gem).toHaveAttribute('role', 'button');
    await expect(gem).toHaveAttribute('tabindex', '0');
    const label = await gem.getAttribute('aria-label');
    expect(label).toContain('diamond');
    expect(label).toContain('5');
  });

  test('clicking diamond gem on blog page triggers claim and shows success', async ({ page }) => {
    await page.goto(`${BASE}${BLOG_PAGE}`);
    await page.evaluate((uid) => localStorage.setItem('swf-uid', uid), TEST_UID);

    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [{ id: 202, diamonds_per_claim: 2, already_claimed: false }],
          }),
        });
      } else if (request.method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, diamonds_earned: 2 }),
        });
      }
    });

    await page.goto(`${BASE}${BLOG_PAGE}`);
    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).toBeVisible({ timeout: 5000 });
    await gem.click();

    await expect(gem).toHaveClass(/dm-claimed/, { timeout: 5000 });
    const text = await gem.textContent();
    expect(text).toContain('+2');
  });

  test('diamond mine sends page path in GET request on blog page', async ({ page }) => {
    await page.goto(`${BASE}${BLOG_PAGE}`);
    await page.evaluate((uid) => localStorage.setItem('swf-uid', uid), TEST_UID);

    let getUrl = '';
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        getUrl = request.url();
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ diamonds: [] }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto(`${BASE}${BLOG_PAGE}`);
    await page.waitForTimeout(2000);

    expect(getUrl).toContain('page=');
    expect(getUrl).toContain(encodeURIComponent(BLOG_PAGE.replace(/\/$/, '/') || BLOG_PAGE));
  });
});

test.describe('Diamond Mine BlogLayout — Negative', () => {
  test('diamond gem still renders on blog page for user without UID (anonymous browsing)', async ({ page }) => {
    // BlogLayout allows anonymous users to see diamonds (UID created on claim only)
    await page.goto(`${BASE}${BLOG_PAGE}`);
    await page.evaluate(() => localStorage.removeItem('swf-uid'));

    await page.route('**/api/diamond-hunt-claim/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          diamonds: [{ id: 300, diamonds_per_claim: 5, already_claimed: false }],
        }),
      });
    });

    await page.goto(`${BASE}${BLOG_PAGE}`);
    await page.waitForTimeout(2000);

    // Gem should render for anonymous users on blog pages
    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).toBeVisible({ timeout: 5000 });
  });

  test('no duplicate diamond gems on blog page', async ({ page }) => {
    await page.goto(`${BASE}${BLOG_PAGE}`);
    await page.evaluate((uid) => localStorage.setItem('swf-uid', uid), TEST_UID);

    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [
              { id: 301, diamonds_per_claim: 1, already_claimed: false },
              { id: 302, diamonds_per_claim: 2, already_claimed: false },
            ],
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto(`${BASE}${BLOG_PAGE}`);
    await page.waitForTimeout(2000);

    // Only one gem should appear (the first unclaimed)
    const gems = page.locator('.diamond-mine-gem');
    await expect(gems).toHaveCount(1);
  });

  test('no mined badge renders on blog page when all diamonds already claimed', async ({ page }) => {
    await page.goto(`${BASE}${BLOG_PAGE}`);
    await page.evaluate((uid) => localStorage.setItem('swf-uid', uid), TEST_UID);

    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [
              { id: 310, diamonds_per_claim: 5, already_claimed: true },
              { id: 311, diamonds_per_claim: 3, already_claimed: true },
            ],
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto(`${BASE}${BLOG_PAGE}`);
    await page.waitForTimeout(2000);

    // No gem and no mined badge — feature silently exits
    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).toHaveCount(0);
    const mined = page.locator('.diamond-mine-mined');
    await expect(mined).toHaveCount(0);
  });

  test('diamond mine handles API failure gracefully on blog page', async ({ page }) => {
    await page.goto(`${BASE}${BLOG_PAGE}`);
    await page.evaluate((uid) => localStorage.setItem('swf-uid', uid), TEST_UID);

    await page.route('**/api/diamond-hunt-claim/**', route => {
      route.abort('connectionrefused');
    });

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(`${BASE}${BLOG_PAGE}`);
    await page.waitForTimeout(2000);

    // No page crash
    const dmErrors = errors.filter(e => e.toLowerCase().includes('diamond'));
    expect(dmErrors).toHaveLength(0);

    // No gem rendered
    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).toHaveCount(0);
  });

  test('diamond mine claim POST failure shows error state on blog page', async ({ page }) => {
    await page.goto(`${BASE}${BLOG_PAGE}`);
    await page.evaluate((uid) => localStorage.setItem('swf-uid', uid), TEST_UID);

    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [{ id: 303, diamonds_per_claim: 1, already_claimed: false }],
          }),
        });
      } else if (request.method() === 'POST') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Expired' }),
        });
      }
    });

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(`${BASE}${BLOG_PAGE}`);
    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).toBeVisible({ timeout: 5000 });
    await gem.click();

    await page.waitForTimeout(1500);
    const text = await gem.textContent();
    expect(text).toContain('Expired');

    // No crash
    const dmErrors = errors.filter(e => e.toLowerCase().includes('diamond'));
    expect(dmErrors).toHaveLength(0);
  });
});
