import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// Seed data containing high-scoring category words (mimics auto-import result)
const HIGH_SCORING_WORDS = JSON.stringify([
  { word: 'ZAX', score: 19, category: 'high-scoring', meaning: 'A tool for cutting roofing slates', dateAdded: '2026-06-18T00:00:00Z' },
  { word: 'QI', score: 11, category: 'high-scoring', meaning: 'Life force in Chinese philosophy', dateAdded: '2026-06-18T00:00:00Z' },
  { word: 'JO', score: 9, category: 'high-scoring', meaning: 'A Scottish term of endearment', dateAdded: '2026-06-18T00:00:00Z' },
  { word: 'ZAP', score: 14, category: 'high-scoring', meaning: 'To destroy suddenly', dateAdded: '2026-06-18T00:00:00Z' },
  { word: 'JAB', score: 12, category: 'high-scoring', meaning: 'A quick punch', dateAdded: '2026-06-18T00:00:00Z' },
  { word: 'AA', score: 2, category: 'two-letter', meaning: 'A type of lava', dateAdded: '2026-06-18T00:00:00Z' },
  { word: 'AB', score: 4, category: 'two-letter', meaning: 'An abdominal muscle', dateAdded: '2026-06-18T00:00:00Z' },
  { word: 'QUAFF', score: 20, category: 'wotd', meaning: 'To drink heartily', dateAdded: '2026-06-18T00:00:00Z' },
]);

// ── High-Scoring Category Import — Positive ──────────────────────────────

test.describe('WordBench High-Scoring Category — Positive', () => {
  test('high-scoring category tab is visible when high-scoring words exist', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, HIGH_SCORING_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.fc-cat-filter[data-cat="high-scoring"]', { timeout: 8000 });

    await expect(page.locator('.fc-cat-filter[data-cat="high-scoring"]')).toBeVisible();
  });

  test('clicking high-scoring tab shows only high-scoring words in deck', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, HIGH_SCORING_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.fc-cat-filter[data-cat="high-scoring"]', { timeout: 8000 });

    await page.locator('.fc-cat-filter[data-cat="high-scoring"]').click();
    await page.waitForSelector('#fc-card:not(.hidden)', { timeout: 5000 });

    // Should show 5 high-scoring words (ZAX, QI, JO, ZAP, JAB)
    const counter = await page.locator('#fc-counter').textContent();
    const total = parseInt((counter || '').split('/')[1]?.trim() || '0');
    expect(total).toBe(5);
  });
});

// ── High-Scoring Category Import — Negative ──────────────────────────────

test.describe('WordBench High-Scoring Category — Negative', () => {
  test('high-scoring tab does not appear when no high-scoring words exist', async ({ page }) => {
    const noHighScoring = JSON.stringify([
      { word: 'AA', score: 2, category: 'two-letter', meaning: 'A type of lava', dateAdded: '2026-06-18T00:00:00Z' },
      { word: 'AB', score: 4, category: 'two-letter', meaning: 'An abdominal muscle', dateAdded: '2026-06-18T00:00:00Z' },
    ]);
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, noHighScoring);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.fc-cat-filter[data-cat="two-letter"]', { timeout: 8000 });

    // high-scoring tab should not exist
    const highScoringTab = page.locator('.fc-cat-filter[data-cat="high-scoring"]');
    await expect(highScoringTab).toHaveCount(0);
  });

  test('no JS errors when clicking high-scoring tab rapidly', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, HIGH_SCORING_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.fc-cat-filter[data-cat="high-scoring"]', { timeout: 8000 });

    // Click high-scoring tab rapidly multiple times
    await page.locator('.fc-cat-filter[data-cat="high-scoring"]').click();
    await page.waitForTimeout(100);
    await page.locator('.fc-cat-filter[data-cat="high-scoring"]').click();
    await page.waitForTimeout(100);
    await page.locator('.fc-cat-filter[data-cat="high-scoring"]').click();
    await page.waitForTimeout(500);

    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
