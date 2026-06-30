import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── StarBar Diamond Counts — Positive ──────────────────────────────────

test.describe('StarBar Diamond Counts — Positive', () => {
  test('MyBag button has sb-mybag-count span element', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const countEl = page.locator('#sb-mybag-count');
    expect(await countEl.count()).toBe(1);
  });

  test('Diamond Hunt button has sb-hunt-count span element', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const countEl = page.locator('#sb-hunt-count');
    expect(await countEl.count()).toBe(1);
  });

  test('MyBag count shows earned diamonds when user has data', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-diamond-counts');
    });

    await page.route('**/api/daily-progress/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          games: [{ slug: 'wotd', name: 'WOTD', icon: '📖', color: 'amber' }],
          diamond_threshold: 7,
          today: { date: '2026-06-30', stars_earned: [], stars_total: 0, diamond: 0 },
          lifetime: {
            total_stars: 100,
            total_diamonds: 56,
            diamonds_earned: 26,
            diamonds_mined: 30,
            diamonds_lost: 0,
            near_misses: 0,
            avg_stars_week: 5,
            avg_stars_month: 4,
            current_streak: 3,
            best_streak: 10,
            diamond_streak: 2,
            best_diamond_streak: 5,
            themes: [],
            perks: [],
          },
        }),
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(2000);

    const mybagCount = page.locator('#sb-mybag-count');
    await expect(mybagCount).toBeVisible();
    await expect(mybagCount).toContainText('26');
  });

  test('Diamond Hunt count shows mined diamonds when user has data', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-diamond-counts-2');
    });

    await page.route('**/api/daily-progress/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          games: [{ slug: 'wotd', name: 'WOTD', icon: '📖', color: 'amber' }],
          diamond_threshold: 7,
          today: { date: '2026-06-30', stars_earned: [], stars_total: 0, diamond: 0 },
          lifetime: {
            total_stars: 100,
            total_diamonds: 56,
            diamonds_earned: 26,
            diamonds_mined: 30,
            diamonds_lost: 0,
            near_misses: 0,
            avg_stars_week: 5,
            avg_stars_month: 4,
            current_streak: 3,
            best_streak: 10,
            diamond_streak: 2,
            best_diamond_streak: 5,
            themes: [],
            perks: [],
          },
        }),
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(2000);

    const huntCount = page.locator('#sb-hunt-count');
    await expect(huntCount).toBeVisible();
    await expect(huntCount).toContainText('30');
  });

  test('counts display with dash separator format', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-diamond-format');
    });

    await page.route('**/api/daily-progress/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          games: [{ slug: 'wotd', name: 'WOTD', icon: '📖', color: 'amber' }],
          diamond_threshold: 7,
          today: { date: '2026-06-30', stars_earned: [], stars_total: 0, diamond: 0 },
          lifetime: {
            total_stars: 50,
            total_diamonds: 15,
            diamonds_earned: 10,
            diamonds_mined: 5,
            diamonds_lost: 0,
            near_misses: 0,
            avg_stars_week: 3,
            avg_stars_month: 3,
            current_streak: 1,
            best_streak: 5,
            diamond_streak: 1,
            best_diamond_streak: 3,
            themes: [],
            perks: [],
          },
        }),
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(2000);

    const mybagCount = page.locator('#sb-mybag-count');
    const huntCount = page.locator('#sb-hunt-count');
    await expect(mybagCount).toHaveText('- 10');
    await expect(huntCount).toHaveText('- 5');
  });
});

// ── StarBar Diamond Counts — Negative ──────────────────────────────────

test.describe('StarBar Diamond Counts — Negative', () => {
  test('counts are hidden when no user is logged in', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('swf-uid');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(1500);

    const mybagCount = page.locator('#sb-mybag-count');
    const huntCount = page.locator('#sb-hunt-count');
    await expect(mybagCount).toBeHidden();
    await expect(huntCount).toBeHidden();
  });

  test('counts are hidden when user has zero diamonds', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-zero-diamonds');
    });

    await page.route('**/api/daily-progress/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          games: [{ slug: 'wotd', name: 'WOTD', icon: '📖', color: 'amber' }],
          diamond_threshold: 7,
          today: { date: '2026-06-30', stars_earned: [], stars_total: 0, diamond: 0 },
          lifetime: {
            total_stars: 5,
            total_diamonds: 0,
            diamonds_earned: 0,
            diamonds_mined: 0,
            diamonds_lost: 0,
            near_misses: 0,
            avg_stars_week: 1,
            avg_stars_month: 1,
            current_streak: 1,
            best_streak: 1,
            diamond_streak: 0,
            best_diamond_streak: 0,
            themes: [],
            perks: [],
          },
        }),
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(2000);

    const mybagCount = page.locator('#sb-mybag-count');
    const huntCount = page.locator('#sb-hunt-count');
    await expect(mybagCount).toBeHidden();
    await expect(huntCount).toBeHidden();
  });

  test('no duplicate count elements exist', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    expect(await page.locator('#sb-mybag-count').count()).toBe(1);
    expect(await page.locator('#sb-hunt-count').count()).toBe(1);
  });

  test('no JS errors when rendering diamond counts', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-no-errors');
    });

    await page.route('**/api/daily-progress/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          games: [{ slug: 'wotd', name: 'WOTD', icon: '📖', color: 'amber' }],
          diamond_threshold: 7,
          today: { date: '2026-06-30', stars_earned: [], stars_total: 0, diamond: 0 },
          lifetime: {
            total_stars: 10,
            total_diamonds: 8,
            diamonds_earned: 5,
            diamonds_mined: 3,
            diamonds_lost: 0,
            near_misses: 0,
            avg_stars_week: 2,
            avg_stars_month: 2,
            current_streak: 1,
            best_streak: 3,
            diamond_streak: 1,
            best_diamond_streak: 2,
            themes: [],
            perks: [],
          },
        }),
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(2000);

    const critical = errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'));
    expect(critical).toHaveLength(0);
  });
});
