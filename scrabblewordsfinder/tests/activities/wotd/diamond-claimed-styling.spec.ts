import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4342';
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

// Helper: build cache data for a partial progress state
function buildPartialCache() {
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = 'swf-stars-' + today;
  const starsLsKey = 'swf-stars-earned-' + today;
  const cacheData = JSON.stringify({
    today: { stars_earned: ['wotd'], diamond: 0 },
    games: [
      { slug: 'wotd' }, { slug: 'quiz' }, { slug: 'wordbench' },
      { slug: 'rack' }, { slug: 'anagram' }, { slug: 'sixty' },
    ],
    diamond_threshold: 6,
    lifetime: { current_streak: 1, total_stars: 1, total_diamonds: 0 },
  });
  return { cacheKey, cacheData, starsLsKey };
}

// ── Diamond Claimed Message Styling — Positive ───────────────────────────

test.describe('Diamond Claimed Message Styling — Positive', () => {
  test('diamond claimed text shows next to diamond icon with purple styling', async ({ page }) => {
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
          games: [{ slug: 'wotd' }, { slug: 'quiz' }, { slug: 'wordbench' }, { slug: 'rack' }, { slug: 'anagram' }, { slug: 'sixty' }],
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
    await expect(msgEl).toContainText('Diamond claimed! Come back tomorrow!');

    const classAttr = await msgEl.getAttribute('class');
    expect(classAttr).toContain('border-purple-500/50');
    expect(classAttr).toContain('bg-purple-900/20');
    expect(classAttr).toContain('text-purple-300');
    expect(classAttr).toContain('text-[11px]');
  });

  test('diamond claimed text does NOT contain diamond emoji', async ({ page }) => {
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
          games: [{ slug: 'wotd' }, { slug: 'quiz' }, { slug: 'wordbench' }, { slug: 'rack' }, { slug: 'anagram' }, { slug: 'sixty' }],
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

    const text = await page.locator('#sb-diamond-msg').textContent();
    expect(text).not.toContain('💎');
  });

  test('sb-message is hidden when diamond is claimed', async ({ page }) => {
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
          games: [{ slug: 'wotd' }, { slug: 'quiz' }, { slug: 'wordbench' }, { slug: 'rack' }, { slug: 'anagram' }, { slug: 'sixty' }],
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

    // The normal sb-message should be hidden
    await expect(page.locator('#sb-message')).toBeHidden();
  });
});

// ── Diamond Claimed Message Styling — Negative ───────────────────────────

test.describe('Diamond Claimed Message Styling — Negative', () => {
  test('sb-diamond-msg is hidden when diamond is NOT claimed', async ({ page }) => {
    const { cacheKey, cacheData, starsLsKey } = buildPartialCache();

    await page.addInitScript(({ key, data, starsKey }) => {
      localStorage.setItem('swf-uid', 'test-user-123');
      localStorage.setItem(key, data);
      localStorage.setItem(starsKey, JSON.stringify(['wotd']));
    }, { key: cacheKey, data: cacheData, starsKey: starsLsKey });

    await page.route('**/api/daily-progress/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          today: { stars_earned: ['wotd'], diamond: 0 },
          games: [{ slug: 'wotd' }, { slug: 'quiz' }, { slug: 'wordbench' }, { slug: 'rack' }, { slug: 'anagram' }, { slug: 'sixty' }],
          diamond_threshold: 6,
          lifetime: { current_streak: 1, total_stars: 1, total_diamonds: 0 },
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

  test('no JavaScript errors on activities page with diamond claimed state', async ({ page }) => {
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
          games: [{ slug: 'wotd' }, { slug: 'quiz' }, { slug: 'wordbench' }, { slug: 'rack' }, { slug: 'anagram' }, { slug: 'sixty' }],
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
