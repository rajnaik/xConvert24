import { test, expect } from '@playwright/test';

/**
 * Diamond Hunt — Anonymous User Tests
 * Validates that the diamond hunt feature works for users WITHOUT a pre-existing UID.
 * After the BlogLayout change, the /api/diamond-hunt-claim/ fetch fires regardless of UID,
 * and getOrCreateUid() generates a UID on claim if none exists.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

// Use a blog page that has a diamond mine (ID 3)
const BLOG_PAGE = '/blog/roadmap-to-being-a-pro-player/';

// ── Positive Tests ──────────────────────────────────────────────────────────

test.describe('Diamond Hunt Anonymous — Positive', () => {
  test('diamond gem appears on blog page without pre-existing UID', async ({ page }) => {
    // Clear any existing UID before navigating
    await page.addInitScript(() => {
      localStorage.removeItem('swf-uid');
    });

    // Mock the API to return an available diamond
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [
              { id: 3, diamonds_per_claim: 1, diamonds_remaining: 10, already_claimed: false },
            ],
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto(`${BASE}${BLOG_PAGE}`);

    // The diamond gem should be visible (previously it would not appear for anonymous users)
    const diamond = page.locator('.diamond-mine-gem');
    await expect(diamond).toBeVisible({ timeout: 5000 });
  });

  test('API call fires without user_id param when no UID exists', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('swf-uid');
    });

    let capturedUrl = '';
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        capturedUrl = request.url();
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

    // The URL should NOT contain user_id when no UID exists
    expect(capturedUrl).toContain('/api/diamond-hunt-claim/');
    expect(capturedUrl).toContain('page=');
    expect(capturedUrl).not.toContain('user_id=');
  });

  test('API call includes user_id param when UID exists', async ({ page }) => {
    const TEST_UID = 'test-anon-diamond-uid-check';
    await page.addInitScript((uid) => {
      localStorage.setItem('swf-uid', uid);
    }, TEST_UID);

    let capturedUrl = '';
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        capturedUrl = request.url();
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

    // The URL SHOULD contain user_id when UID exists
    expect(capturedUrl).toContain('user_id=' + encodeURIComponent(TEST_UID));
  });

  test('clicking diamond gem auto-generates UID and sends POST with user_id', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('swf-uid');
    });

    let postBody: any = null;
    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [
              { id: 3, diamonds_per_claim: 1, diamonds_remaining: 10, already_claimed: false },
            ],
          }),
        });
      } else if (request.method() === 'POST') {
        postBody = JSON.parse(request.postData() || '{}');
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, diamonds_earned: 1 }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto(`${BASE}${BLOG_PAGE}`);

    const diamond = page.locator('.diamond-mine-gem');
    await expect(diamond).toBeVisible({ timeout: 5000 });

    // Click the diamond to claim
    await diamond.click();

    // Wait for the POST to fire
    await page.waitForTimeout(2000);

    // POST body should contain a generated user_id (starts with 'swf-')
    expect(postBody).not.toBeNull();
    expect(postBody.user_id).toBeTruthy();
    expect(postBody.user_id).toMatch(/^swf-/);
    expect(postBody.diamond_id).toBe(3);

    // UID should now be in localStorage
    const storedUid = await page.evaluate(() => localStorage.getItem('swf-uid'));
    expect(storedUid).toBe(postBody.user_id);
  });
});

// ── Negative Tests ──────────────────────────────────────────────────────────

test.describe('Diamond Hunt Anonymous — Negative', () => {
  test('no page errors when UID is missing and API returns empty diamonds', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('swf-uid');
    });

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
      if (request.method() === 'GET') {
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
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
  });

  test('no page errors when API returns 500 for anonymous user', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('swf-uid');
    });

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('**/api/diamond-hunt-claim/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal error' }),
      });
    });

    await page.goto(`${BASE}${BLOG_PAGE}`);
    await page.waitForLoadState('networkidle');

    // Script has a .catch() — should not throw
    expect(errors).toHaveLength(0);

    // No diamond gem should appear
    const diamond = page.locator('.diamond-mine-gem');
    await expect(diamond).not.toBeVisible();
  });
});
