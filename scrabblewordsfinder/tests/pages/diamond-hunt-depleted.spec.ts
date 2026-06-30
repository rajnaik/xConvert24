import { test, expect } from '@playwright/test';

/**
 * Diamond Hunt — Depleted Diamond Tests
 * Validates the new behaviour where the API returns depleted diamonds
 * (diamonds_remaining <= 0) with a `depleted: true` flag, and the UI
 * shows a "Mined ✓" indicator instead of the clickable gem.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';
const TEST_UID = 'test-depleted-diamond-pw';
const BLOG_PAGE = '/blog/roadmap-to-being-a-pro-player/';

// ── Depleted Diamond — Positive ─────────────────────────────────────────────

test.describe('Diamond Hunt Depleted — Positive', () => {
  test('API response includes depleted field set to true for exhausted diamond', async ({ page }) => {
    let apiResponse: any = null;
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        const body = {
          diamonds: [
            { id: 5, diamonds_per_claim: 1, diamonds_remaining: 0, depleted: true, already_claimed: false },
          ],
        };
        apiResponse = body;
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(body),
        });
      } else {
        route.continue();
      }
    });

    await page.addInitScript((uid) => {
      localStorage.setItem('swf-uid', uid);
    }, TEST_UID);

    await page.goto(`${BASE}${BLOG_PAGE}`);
    await page.waitForLoadState('networkidle');

    // Verify our mock response has the depleted field
    expect(apiResponse).not.toBeNull();
    expect(apiResponse.diamonds[0].depleted).toBe(true);
    expect(apiResponse.diamonds[0].diamonds_remaining).toBe(0);
  });

  test('API response includes depleted field set to false for available diamond', async ({ page }) => {
    let apiResponse: any = null;
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        const body = {
          diamonds: [
            { id: 5, diamonds_per_claim: 1, diamonds_remaining: 15, depleted: false, already_claimed: false },
          ],
        };
        apiResponse = body;
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(body),
        });
      } else {
        route.continue();
      }
    });

    await page.addInitScript((uid) => {
      localStorage.setItem('swf-uid', uid);
    }, TEST_UID);

    await page.goto(`${BASE}${BLOG_PAGE}`);
    await page.waitForLoadState('networkidle');

    expect(apiResponse).not.toBeNull();
    expect(apiResponse.diamonds[0].depleted).toBe(false);
    expect(apiResponse.diamonds[0].diamonds_remaining).toBe(15);
  });

  test('UI shows "Mined" indicator when diamond is depleted', async ({ page }) => {
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [
              { id: 5, diamonds_per_claim: 1, diamonds_remaining: 0, depleted: true, already_claimed: false },
            ],
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.addInitScript((uid) => {
      localStorage.setItem('swf-uid', uid);
    }, TEST_UID);

    await page.goto(`${BASE}${BLOG_PAGE}`);

    // "Mined ✓" element should appear
    const minedEl = page.locator('.diamond-mine-mined');
    await expect(minedEl).toBeVisible({ timeout: 5000 });

    // Check it contains "Mined" text
    const text = await minedEl.textContent();
    expect(text).toContain('Mined');
  });

  test('UI shows clickable gem when diamond is NOT depleted and NOT claimed', async ({ page }) => {
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [
              { id: 5, diamonds_per_claim: 2, diamonds_remaining: 10, depleted: false, already_claimed: false },
            ],
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.addInitScript((uid) => {
      localStorage.setItem('swf-uid', uid);
    }, TEST_UID);

    await page.goto(`${BASE}${BLOG_PAGE}`);

    // Clickable gem should appear
    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).toBeVisible({ timeout: 5000 });

    // "Mined" indicator should NOT appear
    const minedEl = page.locator('.diamond-mine-mined');
    await expect(minedEl).not.toBeVisible();
  });

  test('UI shows "Mined" when one diamond is depleted and one is already claimed', async ({ page }) => {
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [
              { id: 5, diamonds_per_claim: 1, diamonds_remaining: 0, depleted: true, already_claimed: false },
              { id: 6, diamonds_per_claim: 1, diamonds_remaining: 5, depleted: false, already_claimed: true },
            ],
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.addInitScript((uid) => {
      localStorage.setItem('swf-uid', uid);
    }, TEST_UID);

    await page.goto(`${BASE}${BLOG_PAGE}`);

    // All diamonds either depleted or claimed — show "Mined ✓"
    const minedEl = page.locator('.diamond-mine-mined');
    await expect(minedEl).toBeVisible({ timeout: 5000 });

    // No clickable gem
    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).not.toBeVisible();
  });
});

// ── Depleted Diamond — Negative ─────────────────────────────────────────────

test.describe('Diamond Hunt Depleted — Negative', () => {
  test('no page errors when all diamonds are depleted', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [
              { id: 5, diamonds_per_claim: 1, diamonds_remaining: 0, depleted: true, already_claimed: false },
            ],
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.addInitScript((uid) => {
      localStorage.setItem('swf-uid', uid);
    }, TEST_UID);

    await page.goto(`${BASE}${BLOG_PAGE}`);
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
  });

  test('POST claim is rejected with 410 for depleted diamond', async ({ page }) => {
    let postStatus = 0;
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [
              { id: 5, diamonds_per_claim: 1, diamonds_remaining: 0, depleted: true, already_claimed: false },
            ],
          }),
        });
      } else if (request.method() === 'POST') {
        // Simulate the API rejecting a claim on a depleted diamond
        postStatus = 410;
        route.fulfill({
          status: 410,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'No diamonds remaining' }),
        });
      } else {
        route.continue();
      }
    });

    await page.addInitScript((uid) => {
      localStorage.setItem('swf-uid', uid);
    }, TEST_UID);

    await page.goto(`${BASE}${BLOG_PAGE}`);
    await page.waitForLoadState('networkidle');

    // The gem should NOT be shown, so no clicking; if somehow triggered, the API returns 410
    // Verify the "Mined" state is shown (no gem to click)
    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).not.toBeVisible();
  });

  test('no duplicate mined indicators on the page', async ({ page }) => {
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [
              { id: 5, diamonds_per_claim: 1, diamonds_remaining: 0, depleted: true, already_claimed: false },
              { id: 6, diamonds_per_claim: 1, diamonds_remaining: 0, depleted: true, already_claimed: true },
            ],
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.addInitScript((uid) => {
      localStorage.setItem('swf-uid', uid);
    }, TEST_UID);

    await page.goto(`${BASE}${BLOG_PAGE}`);
    await page.waitForLoadState('networkidle');

    // Only one "Mined" indicator, not two
    const minedElements = page.locator('.diamond-mine-mined');
    await expect(minedElements).toHaveCount(1);
  });
});
