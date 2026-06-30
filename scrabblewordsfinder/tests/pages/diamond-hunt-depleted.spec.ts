import { test, expect } from '@playwright/test';

/**
 * Diamond Hunt — Depleted Diamond Tests (Updated)
 *
 * The "Mined ✓" badge logic was simplified in Layout.astro: when all diamonds
 * are claimed/depleted AND there's no prior claim timestamp in localStorage,
 * the script does nothing (early return). The badge still shows temporarily
 * on pages (via BlogLayout or Layout post-claim path) when a dm-mined- key exists
 * and hasn't expired.
 *
 * Tests use /activities/ (Layout.astro) to validate the new Layout behaviour.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';
const TEST_UID = 'test-depleted-diamond-pw';
// Use a Layout.astro page to test the changed behaviour (not BlogLayout)
const LAYOUT_PAGE = '/activities/';

// ── Depleted Diamond — Positive ─────────────────────────────────────────────

test.describe('Diamond Hunt Depleted — Positive', () => {
  test('API response includes depleted field set to true for exhausted diamond', async ({ page }) => {
    let apiResponse: any = null;
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        const body = {
          diamonds: [
            { id: 1, diamonds_per_claim: 1, diamonds_remaining: 0, depleted: true, already_claimed: false },
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

    await page.goto(`${BASE}${LAYOUT_PAGE}`);
    await page.waitForLoadState('networkidle');

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
            { id: 1, diamonds_per_claim: 1, diamonds_remaining: 15, depleted: false, already_claimed: false },
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

    await page.goto(`${BASE}${LAYOUT_PAGE}`);
    await page.waitForLoadState('networkidle');

    expect(apiResponse).not.toBeNull();
    expect(apiResponse.diamonds[0].depleted).toBe(false);
    expect(apiResponse.diamonds[0].diamonds_remaining).toBe(15);
  });

  test('no gem renders when diamond is depleted and no prior claim timestamp', async ({ page }) => {
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [
              { id: 1, diamonds_per_claim: 1, diamonds_remaining: 0, depleted: true, already_claimed: false },
            ],
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.addInitScript(({ uid, pagePath }) => {
      localStorage.setItem('swf-uid', uid);
      // Ensure no prior claim timestamp (the new path just returns early)
      localStorage.removeItem('dm-mined-' + pagePath);
    }, { uid: TEST_UID, pagePath: LAYOUT_PAGE });

    await page.goto(`${BASE}${LAYOUT_PAGE}`);
    await page.waitForTimeout(3000);

    // No gem (depleted) and no badge (no prior claim timestamp)
    const gem = page.locator('.diamond-mine-gem');
    expect(await gem.count()).toBe(0);
  });

  test('UI shows clickable gem when diamond is NOT depleted and NOT claimed', async ({ page }) => {
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [
              { id: 1, diamonds_per_claim: 2, diamonds_remaining: 10, depleted: false, already_claimed: false },
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

    await page.goto(`${BASE}${LAYOUT_PAGE}`);

    // Clickable gem should appear
    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).toBeVisible({ timeout: 5000 });

    // "Mined" indicator should NOT appear
    const minedEl = page.locator('.diamond-mine-mined');
    await expect(minedEl).not.toBeVisible();
  });

  test('no gem renders when one diamond is depleted and one is already claimed (no prior timestamp)', async ({ page }) => {
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [
              { id: 1, diamonds_per_claim: 1, diamonds_remaining: 0, depleted: true, already_claimed: false },
              { id: 2, diamonds_per_claim: 1, diamonds_remaining: 5, depleted: false, already_claimed: true },
            ],
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.addInitScript(({ uid, pagePath }) => {
      localStorage.setItem('swf-uid', uid);
      localStorage.removeItem('dm-mined-' + pagePath);
    }, { uid: TEST_UID, pagePath: LAYOUT_PAGE });

    await page.goto(`${BASE}${LAYOUT_PAGE}`);
    await page.waitForTimeout(3000);

    // All diamonds either depleted or claimed — no gem renders
    const gem = page.locator('.diamond-mine-gem');
    expect(await gem.count()).toBe(0);
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
              { id: 1, diamonds_per_claim: 1, diamonds_remaining: 0, depleted: true, already_claimed: false },
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

    await page.goto(`${BASE}${LAYOUT_PAGE}`);
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
  });

  test('no gem rendered for depleted diamond (no way to attempt claim)', async ({ page }) => {
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [
              { id: 1, diamonds_per_claim: 1, diamonds_remaining: 0, depleted: true, already_claimed: false },
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

    await page.goto(`${BASE}${LAYOUT_PAGE}`);
    await page.waitForTimeout(3000);

    // Gem should NOT be visible — depleted diamonds can't be clicked
    const gem = page.locator('.diamond-mine-gem');
    expect(await gem.count()).toBe(0);
  });

  test('no duplicate diamond elements on page when all depleted', async ({ page }) => {
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [
              { id: 1, diamonds_per_claim: 1, diamonds_remaining: 0, depleted: true, already_claimed: false },
              { id: 2, diamonds_per_claim: 1, diamonds_remaining: 0, depleted: true, already_claimed: true },
            ],
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.addInitScript(({ uid, pagePath }) => {
      localStorage.setItem('swf-uid', uid);
      localStorage.removeItem('dm-mined-' + pagePath);
    }, { uid: TEST_UID, pagePath: LAYOUT_PAGE });

    await page.goto(`${BASE}${LAYOUT_PAGE}`);
    await page.waitForTimeout(3000);

    // With the new behaviour: no prior timestamp = nothing renders
    const gem = page.locator('.diamond-mine-gem');
    const mined = page.locator('.diamond-mine-mined');
    expect(await gem.count()).toBe(0);
    expect(await mined.count()).toBe(0);
  });
});
