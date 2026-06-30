import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// Helper: all stars earned but diamond NOT explicitly claimed (diamond: 0)
function buildAllStarsNoDiamondCache() {
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = 'swf-stars-' + today;
  const starsLsKey = 'swf-stars-earned-' + today;
  const cacheData = JSON.stringify({
    today: { stars_earned: ['wotd', 'quiz', 'wordbench', 'rack', 'anagram', 'sixty'], diamond: 0 },
    games: [
      { slug: 'wotd' }, { slug: 'quiz' }, { slug: 'wordbench' },
      { slug: 'rack' }, { slug: 'anagram' }, { slug: 'sixty' },
    ],
    diamond_threshold: 6,
    lifetime: { current_streak: 1, total_stars: 6, total_diamonds: 0 },
  });
  return { cacheKey, cacheData, starsLsKey };
}

// Helper: partial progress (not all stars)
function buildPartialCache() {
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = 'swf-stars-' + today;
  const starsLsKey = 'swf-stars-earned-' + today;
  const cacheData = JSON.stringify({
    today: { stars_earned: ['wotd', 'quiz'], diamond: 0 },
    games: [
      { slug: 'wotd' }, { slug: 'quiz' }, { slug: 'wordbench' },
      { slug: 'rack' }, { slug: 'anagram' }, { slug: 'sixty' },
    ],
    diamond_threshold: 6,
    lifetime: { current_streak: 1, total_stars: 2, total_diamonds: 0 },
  });
  return { cacheKey, cacheData, starsLsKey };
}

// ── Diamond Auto-Award — Positive ────────────────────────────────────────

test.describe('Diamond Auto-Award — Positive', () => {
  test('diamond icon lights up when all stars earned (even without diamond:1)', async ({ page }) => {
    const { cacheKey, cacheData, starsLsKey } = buildAllStarsNoDiamondCache();

    await page.addInitScript(({ key, data, starsKey }) => {
      localStorage.setItem('swf-uid', 'test-user-123');
      localStorage.setItem(key, data);
      localStorage.setItem(starsKey, JSON.stringify(['wotd', 'quiz', 'wordbench', 'rack', 'anagram', 'sixty']));
    }, { key: cacheKey, data: cacheData, starsKey: starsLsKey });

    await page.route('**/api/daily-progress/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          today: { stars_earned: ['wotd', 'quiz', 'wordbench', 'rack', 'anagram', 'sixty'], diamond: 0 },
          games: [
            { slug: 'wotd' }, { slug: 'quiz' }, { slug: 'wordbench' },
            { slug: 'rack' }, { slug: 'anagram' }, { slug: 'sixty' },
          ],
          diamond_threshold: 6,
          lifetime: { current_streak: 1, total_stars: 6, total_diamonds: 0 },
        }),
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForFunction(() => {
      const el = document.getElementById('sb-diamond');
      return el && el.classList.contains('opacity-100') && el.classList.contains('border-purple-500');
    }, { timeout: 8000 });

    const dEl = page.locator('#sb-diamond');
    const classAttr = await dEl.getAttribute('class');
    expect(classAttr).toContain('opacity-100');
    expect(classAttr).toContain('border-purple-500');
    expect(classAttr).toContain('bg-purple-900/30');
  });

  test('diamond message shows "Diamond earned" when all stars earned (no explicit claim)', async ({ page }) => {
    const { cacheKey, cacheData, starsLsKey } = buildAllStarsNoDiamondCache();

    await page.addInitScript(({ key, data, starsKey }) => {
      localStorage.setItem('swf-uid', 'test-user-123');
      localStorage.setItem(key, data);
      localStorage.setItem(starsKey, JSON.stringify(['wotd', 'quiz', 'wordbench', 'rack', 'anagram', 'sixty']));
    }, { key: cacheKey, data: cacheData, starsKey: starsLsKey });

    await page.route('**/api/daily-progress/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          today: { stars_earned: ['wotd', 'quiz', 'wordbench', 'rack', 'anagram', 'sixty'], diamond: 0 },
          games: [
            { slug: 'wotd' }, { slug: 'quiz' }, { slug: 'wordbench' },
            { slug: 'rack' }, { slug: 'anagram' }, { slug: 'sixty' },
          ],
          diamond_threshold: 6,
          lifetime: { current_streak: 1, total_stars: 6, total_diamonds: 0 },
        }),
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForFunction(() => {
      const el = document.getElementById('sb-diamond-msg');
      return el && !el.classList.contains('hidden') && el.textContent!.includes('Diamond earned');
    }, { timeout: 8000 });

    const msgEl = page.locator('#sb-diamond-msg');
    await expect(msgEl).toBeVisible();
    await expect(msgEl).toContainText('Diamond earned! Come back tomorrow!');
  });

  test('sb-message is hidden when all stars earned (auto-award state)', async ({ page }) => {
    const { cacheKey, cacheData, starsLsKey } = buildAllStarsNoDiamondCache();

    await page.addInitScript(({ key, data, starsKey }) => {
      localStorage.setItem('swf-uid', 'test-user-123');
      localStorage.setItem(key, data);
      localStorage.setItem(starsKey, JSON.stringify(['wotd', 'quiz', 'wordbench', 'rack', 'anagram', 'sixty']));
    }, { key: cacheKey, data: cacheData, starsKey: starsLsKey });

    await page.route('**/api/daily-progress/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          today: { stars_earned: ['wotd', 'quiz', 'wordbench', 'rack', 'anagram', 'sixty'], diamond: 0 },
          games: [
            { slug: 'wotd' }, { slug: 'quiz' }, { slug: 'wordbench' },
            { slug: 'rack' }, { slug: 'anagram' }, { slug: 'sixty' },
          ],
          diamond_threshold: 6,
          lifetime: { current_streak: 1, total_stars: 6, total_diamonds: 0 },
        }),
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForFunction(() => {
      const el = document.getElementById('sb-diamond-msg');
      return el && !el.classList.contains('hidden');
    }, { timeout: 8000 });

    await expect(page.locator('#sb-message')).toBeHidden();
  });
});

// ── Diamond Auto-Award — Negative ────────────────────────────────────────

test.describe('Diamond Auto-Award — Negative', () => {
  test('diamond icon stays dimmed when not all stars earned', async ({ page }) => {
    const { cacheKey, cacheData, starsLsKey } = buildPartialCache();

    await page.addInitScript(({ key, data, starsKey }) => {
      localStorage.setItem('swf-uid', 'test-user-123');
      localStorage.setItem(key, data);
      localStorage.setItem(starsKey, JSON.stringify(['wotd', 'quiz']));
    }, { key: cacheKey, data: cacheData, starsKey: starsLsKey });

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
          lifetime: { current_streak: 1, total_stars: 2, total_diamonds: 0 },
        }),
      });
    });

    await page.goto(ACTIVITIES_URL);
    // Wait for starbar render
    await page.waitForFunction(() => {
      const el = document.getElementById('sb-message');
      return el && el.textContent && el.textContent.includes('stars');
    }, { timeout: 8000 });

    const dEl = page.locator('#sb-diamond');
    const classAttr = await dEl.getAttribute('class');
    expect(classAttr).toContain('opacity-30');
  });

  test('no "Diamond earned" message shows with partial progress', async ({ page }) => {
    const { cacheKey, cacheData, starsLsKey } = buildPartialCache();

    await page.addInitScript(({ key, data, starsKey }) => {
      localStorage.setItem('swf-uid', 'test-user-123');
      localStorage.setItem(key, data);
      localStorage.setItem(starsKey, JSON.stringify(['wotd', 'quiz']));
    }, { key: cacheKey, data: cacheData, starsKey: starsLsKey });

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
          lifetime: { current_streak: 1, total_stars: 2, total_diamonds: 0 },
        }),
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForFunction(() => {
      const el = document.getElementById('sb-message');
      return el && el.textContent && el.textContent.includes('stars');
    }, { timeout: 8000 });

    await expect(page.locator('#sb-diamond-msg')).toBeHidden();
  });

  test('no JS errors when auto-award triggers with all stars earned', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    const { cacheKey, cacheData, starsLsKey } = buildAllStarsNoDiamondCache();

    await page.addInitScript(({ key, data, starsKey }) => {
      localStorage.setItem('swf-uid', 'test-user-123');
      localStorage.setItem(key, data);
      localStorage.setItem(starsKey, JSON.stringify(['wotd', 'quiz', 'wordbench', 'rack', 'anagram', 'sixty']));
    }, { key: cacheKey, data: cacheData, starsKey: starsLsKey });

    await page.route('**/api/daily-progress/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          today: { stars_earned: ['wotd', 'quiz', 'wordbench', 'rack', 'anagram', 'sixty'], diamond: 0 },
          games: [
            { slug: 'wotd' }, { slug: 'quiz' }, { slug: 'wordbench' },
            { slug: 'rack' }, { slug: 'anagram' }, { slug: 'sixty' },
          ],
          diamond_threshold: 6,
          lifetime: { current_streak: 1, total_stars: 6, total_diamonds: 0 },
        }),
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(3000);

    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('sb-redeem-wrap element does not appear (removed feature)', async ({ page }) => {
    const { cacheKey, cacheData, starsLsKey } = buildAllStarsNoDiamondCache();

    await page.addInitScript(({ key, data, starsKey }) => {
      localStorage.setItem('swf-uid', 'test-user-123');
      localStorage.setItem(key, data);
      localStorage.setItem(starsKey, JSON.stringify(['wotd', 'quiz', 'wordbench', 'rack', 'anagram', 'sixty']));
    }, { key: cacheKey, data: cacheData, starsKey: starsLsKey });

    await page.route('**/api/daily-progress/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          today: { stars_earned: ['wotd', 'quiz', 'wordbench', 'rack', 'anagram', 'sixty'], diamond: 0 },
          games: [
            { slug: 'wotd' }, { slug: 'quiz' }, { slug: 'wordbench' },
            { slug: 'rack' }, { slug: 'anagram' }, { slug: 'sixty' },
          ],
          diamond_threshold: 6,
          lifetime: { current_streak: 1, total_stars: 6, total_diamonds: 0 },
        }),
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(2000);

    // The redeem button wrapper should not be visible (feature removed)
    const redeemWrap = page.locator('#sb-redeem-wrap');
    const count = await redeemWrap.count();
    if (count > 0) {
      await expect(redeemWrap).toBeHidden();
    }
  });
});
