import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// Helper: build cache data for a diamond-claimed state
function buildDiamondCache() {
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = 'swf-stars-' + today;
  const starsLsKey = 'swf-stars-earned-' + today;
  const cacheData = JSON.stringify({
    today: { stars_earned: ['wotd', 'quiz', 'wordbench', 'rack', 'anagram', 'sixty'], diamond: 1 },
    games: [
      { slug: 'wotd' }, { slug: 'quiz' }, { slug: 'wordbench' },
      { slug: 'rack' }, { slug: 'anagram' }, { slug: 'sixty' },
    ],
    diamond_threshold: 6,
    lifetime: { current_streak: 1, total_stars: 6, total_diamonds: 1 },
  });
  return { cacheKey, cacheData, starsLsKey };
}

// Helper: build cache data for partial progress (no diamond)
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

// ── Star Bar Diamond Message — Positive ──────────────────────────────────

test.describe('Star Bar Diamond Message — Positive', () => {
  test('sb-diamond-msg element exists in the DOM', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#sb-diamond-msg')).toBeAttached();
  });

  test('sb-diamond-msg shows claimed text when diamond is claimed', async ({ page }) => {
    const { cacheKey, cacheData, starsLsKey } = buildDiamondCache();

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
          today: { stars_earned: ['wotd', 'quiz', 'wordbench', 'rack', 'anagram', 'sixty'], diamond: 1 },
          games: [
            { slug: 'wotd' }, { slug: 'quiz' }, { slug: 'wordbench' },
            { slug: 'rack' }, { slug: 'anagram' }, { slug: 'sixty' },
          ],
          diamond_threshold: 6,
          lifetime: { current_streak: 1, total_stars: 6, total_diamonds: 1 },
        }),
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForFunction(() => {
      const el = document.getElementById('sb-diamond-msg');
      return el && !el.classList.contains('hidden') && el.textContent!.includes('Diamond claimed');
    }, { timeout: 8000 });

    const msgEl = page.locator('#sb-diamond-msg');
    await expect(msgEl).toBeVisible();
    await expect(msgEl).toContainText('Diamond claimed! Come back tomorrow!');
  });

  test('sb-diamond-msg has purple styling when visible', async ({ page }) => {
    const { cacheKey, cacheData, starsLsKey } = buildDiamondCache();

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
          today: { stars_earned: ['wotd', 'quiz', 'wordbench', 'rack', 'anagram', 'sixty'], diamond: 1 },
          games: [
            { slug: 'wotd' }, { slug: 'quiz' }, { slug: 'wordbench' },
            { slug: 'rack' }, { slug: 'anagram' }, { slug: 'sixty' },
          ],
          diamond_threshold: 6,
          lifetime: { current_streak: 1, total_stars: 6, total_diamonds: 1 },
        }),
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForFunction(() => {
      const el = document.getElementById('sb-diamond-msg');
      return el && !el.classList.contains('hidden');
    }, { timeout: 8000 });

    const classAttr = await page.locator('#sb-diamond-msg').getAttribute('class');
    expect(classAttr).toContain('text-purple-300');
    expect(classAttr).toContain('border-purple-500/50');
    expect(classAttr).toContain('bg-purple-900/20');
  });
});

// ── Star Bar Diamond Message — Negative ──────────────────────────────────

test.describe('Star Bar Diamond Message — Negative', () => {
  test('sb-diamond-msg is hidden when diamond is not claimed', async ({ page }) => {
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
    // Wait for starbar render to complete
    await page.waitForFunction(() => {
      const el = document.getElementById('sb-message');
      return el && el.textContent && el.textContent.includes('stars');
    }, { timeout: 8000 });

    const msgEl = page.locator('#sb-diamond-msg');
    await expect(msgEl).toBeHidden();
  });

  test('sb-diamond-msg has no text content when hidden', async ({ page }) => {
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

    const text = await page.locator('#sb-diamond-msg').textContent();
    expect(text).toBe('');
  });

  test('no duplicate sb-diamond-msg elements in the DOM', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const count = await page.locator('#sb-diamond-msg').count();
    expect(count).toBe(1);
  });

  test('no JavaScript errors when diamond message renders', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    const { cacheKey, cacheData, starsLsKey } = buildDiamondCache();

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
          today: { stars_earned: ['wotd', 'quiz', 'wordbench', 'rack', 'anagram', 'sixty'], diamond: 1 },
          games: [
            { slug: 'wotd' }, { slug: 'quiz' }, { slug: 'wordbench' },
            { slug: 'rack' }, { slug: 'anagram' }, { slug: 'sixty' },
          ],
          diamond_threshold: 6,
          lifetime: { current_streak: 1, total_stars: 6, total_diamonds: 1 },
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
});
