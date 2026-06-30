import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';
const TEST_UID = 'test-diamond-ttl-playwright';

// Use a page known to have a diamond mine
const TEST_PAGE = '/activities/';

/**
 * Diamond Mine — No "Mined" Badge After Depletion
 *
 * The "Mined ✓" badge was removed. When all diamonds are claimed or depleted,
 * the diamond mine script simply returns without rendering any UI element.
 * These tests verify the new behaviour: nothing renders when all are claimed/depleted.
 */

test.describe('Diamond Mine — No Badge When Depleted — Positive', () => {
  test('no mined badge renders when all diamonds are claimed/depleted', async ({ page }) => {
    // Mock API to return all depleted
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [
              { id: 1, diamonds_per_claim: 1, diamonds_remaining: 0, depleted: true, already_claimed: true },
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

    await page.goto(`${BASE}${TEST_PAGE}`);
    await page.waitForTimeout(3000);

    // The old .diamond-mine-mined element should NOT exist
    const mined = page.locator('.diamond-mine-mined');
    await expect(mined).toHaveCount(0);
  });

  test('gem renders when mine is active (not depleted, not claimed)', async ({ page }) => {
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [
              { id: 1, diamonds_per_claim: 1, diamonds_remaining: 10, depleted: false, already_claimed: false },
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

    await page.goto(`${BASE}${TEST_PAGE}`);

    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).toBeVisible({ timeout: 5000 });
  });

  test('stale dm-mined localStorage key is cleaned up when mine becomes active', async ({ page }) => {
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [
              { id: 1, diamonds_per_claim: 1, diamonds_remaining: 5, depleted: false, already_claimed: false },
            ],
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.addInitScript(({ uid, pagePath }) => {
      localStorage.setItem('swf-uid', uid);
      // Set a stale mined key (should be cleaned up when mine is active)
      localStorage.setItem('dm-mined-' + pagePath, String(Date.now() - 1000));
    }, { uid: TEST_UID, pagePath: TEST_PAGE });

    await page.goto(`${BASE}${TEST_PAGE}`);

    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).toBeVisible({ timeout: 5000 });

    // The stale dm-mined key should be removed
    const minedKey = await page.evaluate((pagePath) => {
      return localStorage.getItem('dm-mined-' + pagePath);
    }, TEST_PAGE);
    expect(minedKey).toBeNull();
  });
});

test.describe('Diamond Mine — No Badge When Depleted — Negative', () => {
  test('no JavaScript errors when all diamonds are depleted (early return)', async ({ page }) => {
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

    await page.goto(`${BASE}${TEST_PAGE}`);
    await page.waitForTimeout(2000);

    const dmErrors = errors.filter(e => e.toLowerCase().includes('diamond') || e.toLowerCase().includes('dm-mined'));
    expect(dmErrors).toHaveLength(0);
  });

  test('no ghost elements remain after mine script processes depleted state', async ({ page }) => {
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [
              { id: 1, diamonds_per_claim: 1, diamonds_remaining: 0, depleted: true, already_claimed: true },
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

    await page.goto(`${BASE}${TEST_PAGE}`);
    await page.waitForTimeout(3000);

    // Neither gem nor mined badge should exist
    const gem = page.locator('.diamond-mine-gem');
    const mined = page.locator('.diamond-mine-mined');
    expect(await gem.count()).toBe(0);
    expect(await mined.count()).toBe(0);
  });
});
