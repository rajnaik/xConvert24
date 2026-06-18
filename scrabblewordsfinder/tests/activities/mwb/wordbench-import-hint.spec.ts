import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// Seed: 5 words (below the 10-word threshold)
const FEW_WORDS = JSON.stringify([
  { word: 'ZAX', score: 19, category: 'manual', meaning: 'A tool for cutting roofing slates', dateAdded: '2026-06-18T00:00:00Z' },
  { word: 'QI', score: 11, category: 'manual', meaning: 'Life force in Chinese philosophy', dateAdded: '2026-06-18T00:00:00Z' },
  { word: 'JO', score: 9, category: 'wotd', meaning: 'A Scottish term of endearment', dateAdded: '2026-06-18T00:00:00Z' },
  { word: 'ZAP', score: 14, category: 'solver', meaning: 'To destroy suddenly', dateAdded: '2026-06-18T00:00:00Z' },
  { word: 'JAB', score: 12, category: 'manual', meaning: 'A quick punch', dateAdded: '2026-06-18T00:00:00Z' },
]);

// Seed: exactly 10 words (at threshold boundary — should still show hint)
const TEN_WORDS = JSON.stringify(
  Array.from({ length: 10 }, (_, i) => ({
    word: `WORD${String.fromCharCode(65 + i)}`,
    score: 5 + i,
    category: 'manual',
    meaning: `Meaning for word ${i}`,
    dateAdded: '2026-06-18T00:00:00Z',
  }))
);

// Seed: 11 words (above threshold — hint should be hidden)
const ELEVEN_WORDS = JSON.stringify(
  Array.from({ length: 11 }, (_, i) => ({
    word: `WORD${String.fromCharCode(65 + i)}`,
    score: 5 + i,
    category: 'manual',
    meaning: `Meaning for word ${i}`,
    dateAdded: '2026-06-18T00:00:00Z',
  }))
);

// ── Import Hint (≤10 words) — Positive ───────────────────────────────────

test.describe('WordBench Import Hint (≤10 words) — Positive', () => {
  test('import hint is visible when All category has fewer than 10 words', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, FEW_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    await page.locator('#fc-start-btn').click();
    // Wait for flashcard to render (confirms startFlashCards ran)
    await page.waitForSelector('#fc-card:not(.hidden)', { timeout: 8000 });

    const hintEl = page.locator('#fc-import-hint');
    await expect(hintEl).toBeVisible();
  });

  test('import hint contains "Import All Word Lists" button', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, FEW_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    await page.locator('#fc-start-btn').click();
    await page.waitForSelector('#fc-card:not(.hidden)', { timeout: 8000 });

    const importBtn = page.locator('#fc-import-hint #fc-import-all-btn');
    await expect(importBtn).toBeVisible();
    await expect(importBtn).toContainText('Import All Word Lists');
  });

  test('import hint is visible at exactly 10 words (boundary)', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, TEN_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    await page.locator('#fc-start-btn').click();
    await page.waitForSelector('#fc-card:not(.hidden)', { timeout: 8000 });

    await expect(page.locator('#fc-import-hint')).toBeVisible();
    await expect(page.locator('#fc-import-hint #fc-import-all-btn')).toBeVisible();
  });
});

// ── Import Hint (≤10 words) — Negative ───────────────────────────────────

test.describe('WordBench Import Hint (≤10 words) — Negative', () => {
  test('import hint is hidden when All category has more than 10 words', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, ELEVEN_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    await page.locator('#fc-start-btn').click();
    await page.waitForSelector('#fc-card:not(.hidden)', { timeout: 8000 });

    const hintEl = page.locator('#fc-import-hint');
    await expect(hintEl).not.toBeVisible();
  });

  test('no duplicate import-all-btn in hint area after multiple Start clicks', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, FEW_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    // Click Start multiple times
    await page.locator('#fc-start-btn').click();
    await page.waitForSelector('#fc-card:not(.hidden)', { timeout: 8000 });
    await page.locator('#fc-start-btn').click();
    await page.waitForTimeout(500);

    // Should have at most 1 button inside fc-import-hint
    const btnCount = await page.locator('#fc-import-hint #fc-import-all-btn').count();
    expect(btnCount).toBeLessThanOrEqual(1);
  });

  test('no JavaScript errors when import hint renders with few words', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, FEW_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    await page.locator('#fc-start-btn').click();
    await page.waitForSelector('#fc-card:not(.hidden)', { timeout: 8000 });

    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('import hint shows automatically on page load when words ≤10 (no Start needed)', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, FEW_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    // The hint should appear automatically without needing to click Start
    const hintEl = page.locator('#fc-import-hint');
    await expect(hintEl).toBeVisible();
    await expect(page.locator('#fc-import-hint #fc-import-all-btn')).toBeVisible();
  });
});
