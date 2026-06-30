import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

/**
 * Quick Tests — Diamond Mines
 * Validates that every active mine in the diamond_hunt table is reachable
 * and the diamond-hunt-claim API returns diamonds for its target page.
 *
 * This test fetches the mine list from the local API, then for each mine:
 * 1. Confirms the page exists (200 status)
 * 2. Confirms the GET /api/diamond-hunt-claim/ returns diamonds for that page
 * 3. Confirms the diamond gem element renders on the page (with mocked unclaimed state)
 */

// All active mines from the diamond_hunt table (dom_loc → page path)
const MINES = [
  { id: 1, page: '/activities/', perClaim: 1 },
  { id: 2, page: '/mybag/', perClaim: 1 },
  { id: 3, page: '/blog/roadmap-to-being-a-pro-player/', perClaim: 1 },
  { id: 4, page: '/quiz-history/', perClaim: 1 },
  { id: 5, page: '/guide/', perClaim: 1 },
  { id: 6, page: '/', perClaim: 3 },
  { id: 7, page: '/blog/', perClaim: 3 },
  { id: 8, page: '/faq/', perClaim: 1 },
  { id: 9, page: '/achievements/', perClaim: 1 },
  { id: 10, page: '/sixty-seconds/', perClaim: 100 },
  { id: 11, page: '/stats/', perClaim: 3 },
  { id: 12, page: '/wordbench-practice/', perClaim: 3 },
  { id: 13, page: '/blog/beginner-scrabble-strategy/', perClaim: 3 },
  { id: 14, page: '/blog/best-two-letter-words-scrabble/', perClaim: 3 },
  { id: 15, page: '/blog/how-to-play-scrabble/', perClaim: 1 },
  { id: 16, page: '/blog/highest-scoring-scrabble-words/', perClaim: 3 },
  { id: 17, page: '/blog/scrabble-rules-explained/', perClaim: 10 },
  { id: 18, page: '/blog/best-q-words-scrabble/', perClaim: 5 },
  { id: 19, page: '/blog/words-starting-with-a/', perClaim: 1 },
];

// ── Diamond Mines — API Validation (Positive) ───────────────────────────────

test.describe('Quick Tests — Diamond Mines API — Positive', () => {
  for (const mine of MINES) {
    test(`mine #${mine.id} — API returns diamonds for ${mine.page}`, async ({ request }) => {
      const res = await request.get(
        `${BASE}/api/diamond-hunt-claim/?page=${encodeURIComponent(mine.page)}&user_id=test-quick-check`
      );
      expect(res.status()).toBe(200);
      const data = await res.json();
      expect(data).toHaveProperty('diamonds');
      expect(Array.isArray(data.diamonds)).toBe(true);

      // Should find at least one diamond for this page
      const matching = data.diamonds.find((d: any) => d.id === mine.id);
      expect(matching, `Mine #${mine.id} not returned for ${mine.page}`).toBeDefined();
      expect(matching.diamonds_per_claim).toBe(mine.perClaim);
    });
  }
});

// ── Diamond Mines — Page Accessibility (Positive) ───────────────────────────

test.describe('Quick Tests — Diamond Mines Pages — Positive', () => {
  for (const mine of MINES) {
    test(`mine #${mine.id} — page ${mine.page} returns 200`, async ({ request }) => {
      const res = await request.get(`${BASE}${mine.page}`);
      expect(res.status(), `Page ${mine.page} not found`).toBe(200);
    });
  }
});

// ── Diamond Mines — Gem Renders on Page (Positive) ──────────────────────────

test.describe('Quick Tests — Diamond Mines Gem Render — Positive', () => {
  // Test a representative sample of pages (both Layout.astro and BlogLayout include the diamond mine script)
  const sample = [MINES[0], MINES[3], MINES[5], MINES[9], MINES[2], MINES[12]];

  for (const mine of sample) {
    test(`mine #${mine.id} — gem renders on ${mine.page}`, async ({ page }) => {
      // Ensure UID exists
      await page.goto(`${BASE}/`);
      await page.evaluate(() => localStorage.setItem('swf-uid', 'quick-test-uid'));

      // Mock the API to return this mine as unclaimed
      await page.route('**/api/diamond-hunt-claim/**', (route, req) => {
        if (req.method() === 'GET') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              diamonds: [{ id: mine.id, diamonds_per_claim: mine.perClaim, already_claimed: false }],
            }),
          });
        } else {
          route.continue();
        }
      });

      await page.goto(`${BASE}${mine.page}`);
      const gem = page.locator('.diamond-mine-gem');
      await expect(gem).toBeVisible({ timeout: 5000 });

      // Verify aria-label mentions the correct diamonds_per_claim
      const label = await gem.getAttribute('aria-label');
      expect(label).toContain(String(mine.perClaim));
    });
  }
});

// ── Diamond Mines — Negative ────────────────────────────────────────────────

test.describe('Quick Tests — Diamond Mines — Negative', () => {
  test('API returns empty diamonds for a page with no mine', async ({ request }) => {
    const res = await request.get(
      `${BASE}/api/diamond-hunt-claim/?page=${encodeURIComponent('/settings/')}&user_id=test-neg`
    );
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.diamonds).toHaveLength(0);
  });

  test('API returns 400 when page parameter is missing', async ({ request }) => {
    const res = await request.get(`${BASE}/api/diamond-hunt-claim/?user_id=test-neg`);
    expect(res.status()).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('page');
  });

  test('no mine renders on a page without an active diamond', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'quick-neg-uid'));

    // Mock API to return empty
    await page.route('**/api/diamond-hunt-claim/**', (route, req) => {
      if (req.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ diamonds: [] }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto(`${BASE}/settings/`);
    await page.waitForTimeout(1500);
    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).toHaveCount(0);
  });

  test('already-claimed diamonds do not render the gem', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'quick-claimed-uid'));

    // Mock API: all diamonds already claimed
    await page.route('**/api/diamond-hunt-claim/**', (route, req) => {
      if (req.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            diamonds: [{ id: 6, diamonds_per_claim: 3, already_claimed: true }],
          }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto(`${BASE}/`);
    await page.waitForTimeout(2000);
    const gem = page.locator('.diamond-mine-gem');
    await expect(gem).toHaveCount(0);

    // Should show "mined" badge instead
    const mined = page.locator('.diamond-mine-mined');
    await expect(mined).toBeVisible();
  });
});
