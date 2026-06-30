import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';
const TEST_UID = 'test-diamond-ui-playwright';

/**
 * Diamond Mine UI — Visibility Tests (Updated)
 *
 * After removal of the "Mined ✓" badge, the diamond mine script only renders
 * a clickable gem when a claimable diamond exists. When all are claimed/depleted,
 * nothing renders. These tests validate that no ghost ".diamond-mine-mined" elements
 * appear, and that the gem renders correctly for available diamonds.
 */

// Layout.astro pages with diamond mines (testing the changed code path)
const mines = [
  { id: 1, page: '/activities/', perClaim: 1 },
  { id: 2, page: '/mybag/', perClaim: 1 },
  { id: 4, page: '/quiz-history/', perClaim: 1 },
  { id: 5, page: '/guide/', perClaim: 1 },
  { id: 6, page: '/', perClaim: 3 },
  { id: 8, page: '/faq/', perClaim: 1 },
  { id: 9, page: '/achievements/', perClaim: 1 },
  { id: 10, page: '/sixty-seconds/', perClaim: 100 },
  { id: 11, page: '/stats/', perClaim: 3 },
  { id: 12, page: '/wordbench-practice/', perClaim: 3 },
];

test.describe('Diamond Mine UI — Gem Renders When Available', () => {
  // Test a representative subset (first 3) to avoid excessive network calls
  const subset = mines.slice(0, 3);

  for (const mine of subset) {
    test(`ID:${mine.id} gem renders on ${mine.page} when diamond is available`, async ({ page }) => {
      await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
        if (request.method() === 'GET') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              diamonds: [
                { id: mine.id, diamonds_per_claim: mine.perClaim, diamonds_remaining: 10, depleted: false, already_claimed: false },
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

      await page.goto(`${BASE}${mine.page}`);

      const gem = page.locator('.diamond-mine-gem');
      await expect(gem).toBeVisible({ timeout: 5000 });

      // Verify accessibility
      const label = await gem.getAttribute('aria-label');
      expect(label).toContain('diamond');
    });
  }
});

test.describe('Diamond Mine UI — Nothing Renders When Depleted', () => {
  const subset = mines.slice(0, 3);

  for (const mine of subset) {
    test(`ID:${mine.id} nothing renders on ${mine.page} when all depleted (no prior timestamp)`, async ({ page }) => {
      await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
        if (request.method() === 'GET') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              diamonds: [
                { id: mine.id, diamonds_per_claim: mine.perClaim, diamonds_remaining: 0, depleted: true, already_claimed: true },
              ],
            }),
          });
        } else {
          route.continue();
        }
      });

      await page.addInitScript(({ uid, pagePath }) => {
        localStorage.setItem('swf-uid', uid);
        // Ensure no prior claim timestamp so the new early-return path fires
        localStorage.removeItem('dm-mined-' + pagePath);
      }, { uid: TEST_UID, pagePath: mine.page });

      await page.goto(`${BASE}${mine.page}`);
      await page.waitForTimeout(3000);

      // Nothing should render — no gem, no mined badge (early return when no stored timestamp)
      const gem = page.locator('.diamond-mine-gem');
      const mined = page.locator('.diamond-mine-mined');
      expect(await gem.count()).toBe(0);
      expect(await mined.count()).toBe(0);
    });
  }
});

test.describe('Diamond Mine UI — Negative', () => {
  const subset = mines.slice(0, 3);

  for (const mine of subset) {
    test(`ID:${mine.id} no duplicate diamond elements on ${mine.page}`, async ({ page }) => {
      await page.route('**/api/diamond-hunt-claim/**', (route, request) => {
        if (request.method() === 'GET') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              diamonds: [
                { id: mine.id, diamonds_per_claim: mine.perClaim, diamonds_remaining: 5, depleted: false, already_claimed: false },
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

      await page.goto(`${BASE}${mine.page}`);

      const gem = page.locator('.diamond-mine-gem');
      await expect(gem).toBeVisible({ timeout: 5000 });

      // Only one gem, no mined badge
      expect(await gem.count()).toBe(1);
      const mined = page.locator('.diamond-mine-mined');
      expect(await mined.count()).toBe(0);
    });
  }

  test('no JavaScript errors during diamond mine processing', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

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

    await page.goto(`${BASE}${mines[0].page}`);
    await page.waitForTimeout(2000);

    const dmErrors = errors.filter(e => e.toLowerCase().includes('diamond'));
    expect(dmErrors).toHaveLength(0);
  });
});
