import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// Helper: generate N words for seeding
function makeWords(count: number) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const words = [];
  for (let i = 0; i < count; i++) {
    const w = letters[i % 26] + letters[(i + 1) % 26];
    words.push({ word: w, score: 2 + i, category: 'two-letter', meaning: `Meaning of ${w}`, dateAdded: '2026-06-18T00:00:00Z' });
  }
  return JSON.stringify(words);
}

const FIVE_WORDS = makeWords(5);
const TEN_WORDS = makeWords(10);
const ELEVEN_WORDS = makeWords(11);
const TWENTY_WORDS = makeWords(20);

// ── Import Hint Visibility — Positive ────────────────────────────────────

test.describe('WordBench Import Hint Visibility — Positive', () => {
  test('import button shown when MWB has 0 words (empty state)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('scbAchievements');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-import-all-btn', { timeout: 8000 });

    await expect(page.locator('#fc-import-all-btn')).toBeVisible();
  });

  test('import hint shown when MWB has 5 words (under threshold)', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, FIVE_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-import-hint', { timeout: 8000 });

    await expect(page.locator('#fc-import-hint')).not.toHaveClass(/hidden/);
    await expect(page.locator('#fc-import-hint #fc-import-all-btn')).toBeVisible();
  });

  test('import hint shown when MWB has exactly 10 words (boundary)', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, TEN_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-import-hint', { timeout: 8000 });

    await expect(page.locator('#fc-import-hint')).not.toHaveClass(/hidden/);
    await expect(page.locator('#fc-import-hint #fc-import-all-btn')).toBeVisible();
  });

  test('import hint hidden when MWB has 11 words (over threshold)', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, ELEVEN_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-cat-filters', { timeout: 8000 });

    // Give refreshWordBench time to run
    await page.waitForTimeout(500);
    await expect(page.locator('#fc-import-hint')).toHaveClass(/hidden/);
  });
});

// ── Import Hint Visibility — Negative ────────────────────────────────────

test.describe('WordBench Import Hint Visibility — Negative', () => {
  test('import hint hidden when MWB has 20 words (well over threshold)', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, TWENTY_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-cat-filters', { timeout: 8000 });

    await page.waitForTimeout(500);
    await expect(page.locator('#fc-import-hint')).toHaveClass(/hidden/);
  });

  test('no duplicate import buttons when hint is visible', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, FIVE_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-import-hint', { timeout: 8000 });

    // There should be exactly 1 import button on the page (in the hint area)
    const btnCount = await page.locator('#fc-import-all-btn').count();
    expect(btnCount).toBe(1);
  });

  test('no JS errors when import hint appears alongside category tabs', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, TEN_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-import-hint', { timeout: 8000 });

    // Click Start to exercise the full path
    await page.locator('#fc-start-btn').click();
    await page.waitForTimeout(500);

    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('import hint button is clickable and starts the import flow', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, FIVE_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-import-hint #fc-import-all-btn', { timeout: 8000 });

    // Click the import button — it should change text to loading state
    await page.locator('#fc-import-hint #fc-import-all-btn').click();
    await page.waitForTimeout(500);

    // Button text should change (loading or success state)
    const btnText = await page.locator('#fc-import-all-btn').textContent();
    expect(btnText).not.toBe('📥 Import All Word Lists');
  });
});
