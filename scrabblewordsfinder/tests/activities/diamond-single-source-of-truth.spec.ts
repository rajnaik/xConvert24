import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── Diamond Single Source of Truth — Positive ────────────────────────────

test.describe('Diamond Single Source of Truth — Positive', () => {
  test('total_diamonds displayed matches the API lifetime value', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = 'swf-stars-' + today;
    const starsLsKey = 'swf-stars-earned-' + today;

    await page.addInitScript(({ key, starsKey }) => {
      localStorage.setItem('swf-uid', 'test-user-diamonds');
      localStorage.setItem(starsKey, JSON.stringify(['wotd', 'quiz']));
    }, { key: cacheKey, starsKey: starsLsKey });

    // Mock API with total_diamonds = 5 (derived from daily_progress count)
    await page.route('**/api/daily-progress/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          today: { stars_earned: ['wotd', 'quiz'], diamond: 0 },
          games: [
            { slug: 'wotd' }, { slug: 'quiz' }, { slug: 'wordbench' },
            { slug: 'rack' }, { slug: 'anagram' }, { slug: 'sixty' },
          ],
          diamond_threshold: 6,
          lifetime: { current_streak: 3, total_stars: 42, total_diamonds: 5 },
        }),
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForFunction(() => {
      const el = document.getElementById('sb-total-diamonds');
      return el && el.textContent === '5';
    }, { timeout: 8000 });

    const diamondCount = await page.locator('#sb-total-diamonds').textContent();
    expect(diamondCount).toBe('5');
  });

  test('diamond auto-awarded: total_diamonds increments when all stars earned', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0];
    const starsLsKey = 'swf-stars-earned-' + today;

    await page.addInitScript(({ starsKey }) => {
      localStorage.setItem('swf-uid', 'test-user-diamonds');
      localStorage.setItem(starsKey, JSON.stringify(['wotd', 'quiz', 'wordbench', 'rack', 'anagram', 'sixty']));
    }, { starsKey: starsLsKey });

    // All stars + diamond auto-awarded: total_diamonds reflects the new count
    await page.route('**/api/daily-progress/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          today: { stars_earned: ['wotd', 'quiz', 'wordbench', 'rack', 'anagram', 'sixty'], diamond: 1 },
          games: [
            { slug: 'wotd' }, { slug: 'quiz' }, { slug: 'wordbench' },
            { slug: 'rack' }, { slug: 'anagram' }, { slug: 'sixty' },
          ],
          diamond_threshold: 6,
          lifetime: { current_streak: 4, total_stars: 48, total_diamonds: 6 },
        }),
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForFunction(() => {
      const el = document.getElementById('sb-total-diamonds');
      return el && el.textContent === '6';
    }, { timeout: 8000 });

    const diamondCount = await page.locator('#sb-total-diamonds').textContent();
    expect(diamondCount).toBe('6');
  });
});

// ── Diamond Single Source of Truth — Negative ────────────────────────────

test.describe('Diamond Single Source of Truth — Negative', () => {
  test('total_diamonds shows 0 when no diamonds earned (not a stale value)', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0];
    const starsLsKey = 'swf-stars-earned-' + today;

    await page.addInitScript(({ starsKey }) => {
      localStorage.setItem('swf-uid', 'test-user-new');
      localStorage.setItem(starsKey, JSON.stringify(['wotd']));
    }, { starsKey: starsLsKey });

    await page.route('**/api/daily-progress/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          today: { stars_earned: ['wotd'], diamond: 0 },
          games: [
            { slug: 'wotd' }, { slug: 'quiz' }, { slug: 'wordbench' },
            { slug: 'rack' }, { slug: 'anagram' }, { slug: 'sixty' },
          ],
          diamond_threshold: 6,
          lifetime: { current_streak: 1, total_stars: 1, total_diamonds: 0 },
        }),
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForFunction(() => {
      const el = document.getElementById('sb-total-diamonds');
      return el && el.textContent === '0';
    }, { timeout: 8000 });

    const diamondCount = await page.locator('#sb-total-diamonds').textContent();
    expect(diamondCount).toBe('0');
  });

  test('no redeem button exists in the DOM (auto-award only)', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const redeemBtn = page.locator('#sb-redeem-btn');
    expect(await redeemBtn.count()).toBe(0);
  });
});
