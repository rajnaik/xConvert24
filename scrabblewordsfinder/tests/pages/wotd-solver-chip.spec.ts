import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const SOLVER_URL = `${BASE_URL}/`;

// Mock WOTD API response
const MOCK_WOTD = {
  word: { word: 'QUIXOTIC', meaning: 'Exceedingly idealistic; unrealistic and impractical', date: '2026-07-02' }
};

// ── WOTD Solver Chip — Positive ─────────────────────────────────────────────

test.describe('WOTD Solver Chip — Positive', () => {
  test('WOTD chip is visible and shows word from API', async ({ page }) => {
    await page.route('**/api/wotd/', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_WOTD) })
    );
    await page.goto(SOLVER_URL);
    const chip = page.locator('#wotd-solver-btn');
    await expect(chip).toBeVisible();
    await expect(page.locator('#wotd-solver-word')).toHaveText('QUIXOTIC');
  });

  test('clicking chip opens bubble with word and meaning', async ({ page }) => {
    await page.route('**/api/wotd/', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_WOTD) })
    );
    await page.goto(SOLVER_URL);
    await page.locator('#wotd-solver-btn').click();
    const bubble = page.locator('#wotd-solver-bubble');
    await expect(bubble).toBeVisible();
    await expect(page.locator('#wotd-solver-bubble-word')).toHaveText('QUIXOTIC');
    await expect(page.locator('#wotd-solver-bubble-meaning')).toContainText('idealistic');
  });

  test('clicking chip again closes bubble', async ({ page }) => {
    await page.route('**/api/wotd/', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_WOTD) })
    );
    await page.goto(SOLVER_URL);
    const btn = page.locator('#wotd-solver-btn');
    await btn.click();
    await expect(page.locator('#wotd-solver-bubble')).toBeVisible();
    await btn.click();
    // Wait for the hide animation
    await page.waitForTimeout(300);
    await expect(page.locator('#wotd-solver-bubble')).toBeHidden();
  });

  test('+ button adds word to Memory WordBench localStorage', async ({ page }) => {
    await page.route('**/api/wotd/', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_WOTD) })
    );
    await page.goto(SOLVER_URL);
    // Wait for WOTD to load
    await expect(page.locator('#wotd-solver-word')).toHaveText('QUIXOTIC');
    await page.locator('#wotd-add-btn').click();
    // Button should show green tick
    await expect(page.locator('#wotd-add-btn')).toHaveText('✓');
    // Verify localStorage has the word
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('scbAchievements') || '[]'));
    expect(stored.some((a: any) => a.word === 'QUIXOTIC')).toBe(true);
    expect(stored.find((a: any) => a.word === 'QUIXOTIC').category).toBe('wotd');
  });

  test('chip is positioned to the left of Diamond Hunt icon', async ({ page }) => {
    await page.route('**/api/wotd/', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_WOTD) })
    );
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(SOLVER_URL);
    await expect(page.locator('#wotd-solver-word')).toHaveText('QUIXOTIC');
    const chipBox = await page.locator('#wotd-solver-btn').boundingBox();
    const diamondBox = await page.locator('a[href="/diamond-hunt/"]').boundingBox();
    expect(chipBox).not.toBeNull();
    expect(diamondBox).not.toBeNull();
    // Chip should be to the left of Diamond Hunt icon
    expect(chipBox!.x + chipBox!.width).toBeLessThan(diamondBox!.x);
  });

  test('bubble contains Activities link', async ({ page }) => {
    await page.route('**/api/wotd/', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_WOTD) })
    );
    await page.goto(SOLVER_URL);
    await page.locator('#wotd-solver-btn').click();
    const link = page.locator('#wotd-solver-bubble a[href="/activities/"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText('View on Activities');
  });
});

// ── WOTD Solver Chip — Negative ─────────────────────────────────────────────

test.describe('WOTD Solver Chip — Negative', () => {
  test('chip shows fallback when API fails', async ({ page }) => {
    await page.route('**/api/wotd/', route =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );
    await page.goto(SOLVER_URL);
    // Should still show the initial "..." placeholder (no crash)
    const wordEl = page.locator('#wotd-solver-word');
    await expect(wordEl).toBeVisible();
    await expect(wordEl).toHaveText('...');
  });

  test('no duplicate WOTD chips exist', async ({ page }) => {
    await page.route('**/api/wotd/', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_WOTD) })
    );
    await page.goto(SOLVER_URL);
    const chips = page.locator('#wotd-solver-btn');
    await expect(chips).toHaveCount(1);
  });

  test('clicking + button twice does not duplicate entry', async ({ page }) => {
    await page.route('**/api/wotd/', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_WOTD) })
    );
    await page.goto(SOLVER_URL);
    await expect(page.locator('#wotd-solver-word')).toHaveText('QUIXOTIC');
    await page.locator('#wotd-add-btn').click();
    await page.locator('#wotd-add-btn').click();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('scbAchievements') || '[]'));
    const matches = stored.filter((a: any) => a.word === 'QUIXOTIC');
    expect(matches).toHaveLength(1);
  });

  test('bubble closes when clicking outside', async ({ page }) => {
    await page.route('**/api/wotd/', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_WOTD) })
    );
    await page.goto(SOLVER_URL);
    await page.locator('#wotd-solver-btn').click();
    await expect(page.locator('#wotd-solver-bubble')).toBeVisible();
    // Click away (on the main heading)
    await page.locator('h1:has-text("Scrabble")').click();
    await page.waitForTimeout(300);
    await expect(page.locator('#wotd-solver-bubble')).toBeHidden();
  });

  test('no page errors when WOTD chip loads', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.route('**/api/wotd/', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_WOTD) })
    );
    await page.goto(SOLVER_URL);
    await expect(page.locator('#wotd-solver-word')).toHaveText('QUIXOTIC');
    expect(errors.filter(e => e.toLowerCase().includes('wotd'))).toHaveLength(0);
  });
});
