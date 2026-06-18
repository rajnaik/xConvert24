import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'https://scrabblewordsfinder-staging.xconvert.workers.dev';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// Seed data: mix of words with real meanings and filler/placeholder meanings
const MIXED_MEANING_WORDS = JSON.stringify([
  { word: 'QUAFF', score: 20, category: 'wotd', meaning: 'To drink heartily', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'ZAP', score: 14, category: 'rare-letters', meaning: 'To destroy suddenly', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'AA', score: 2, category: 'two-letter', meaning: 'Scrabble-legal word, valid in SOWPODS', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'QI', score: 11, category: 'q-without-u', meaning: 'Life force in Chinese philosophy', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'ZO', score: 11, category: 'two-letter', meaning: '', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'XU', score: 9, category: 'two-letter', meaning: 'No standard definition available', dateAdded: '2026-01-01T00:00:00Z' },
]);

// ── Meaningful Only Filter Default State — Positive ──────────────────────

test.describe('WordBench "Meaningful only" Filter — Positive', () => {
  test('checkbox defaults to unchecked on page load', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MIXED_MEANING_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-real-meanings', { timeout: 8000 });

    const isChecked = await page.locator('#fc-real-meanings').isChecked();
    expect(isChecked).toBe(false);
  });

  test('Start shows all words when checkbox is unchecked (default)', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MIXED_MEANING_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    await page.locator('#fc-start-btn').click();
    await page.waitForSelector('#fc-card:not(.hidden)', { timeout: 5000 });

    // All 6 words should be in the deck (no filtering applied)
    const counter = await page.locator('#fc-counter').textContent();
    const total = parseInt((counter || '').split('/')[1]?.trim() || '0');
    expect(total).toBe(6);
  });

  test('checking the box and starting filters to meaningful words only', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MIXED_MEANING_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-real-meanings', { timeout: 8000 });

    // Manually check the box
    await page.locator('#fc-real-meanings').check();
    expect(await page.locator('#fc-real-meanings').isChecked()).toBe(true);

    await page.locator('#fc-start-btn').click();
    await page.waitForSelector('#fc-card:not(.hidden)', { timeout: 5000 });

    // Only QUAFF, ZAP, QI have real meanings (AA has filler, ZO has empty, XU has placeholder)
    const counter = await page.locator('#fc-counter').textContent();
    const total = parseInt((counter || '').split('/')[1]?.trim() || '0');
    expect(total).toBe(3);
  });

  test('checkbox is visible and interactive', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MIXED_MEANING_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-real-meanings', { timeout: 8000 });

    const checkbox = page.locator('#fc-real-meanings');
    await expect(checkbox).toBeVisible();
    await expect(checkbox).toBeEnabled();
  });
});

// ── Meaningful Only Filter Default State — Negative ──────────────────────

test.describe('WordBench "Meaningful only" Filter — Negative', () => {
  test('unchecked checkbox does not filter out words with empty meanings', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MIXED_MEANING_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    // Confirm checkbox is unchecked
    expect(await page.locator('#fc-real-meanings').isChecked()).toBe(false);

    await page.locator('#fc-start-btn').click();
    await page.waitForSelector('#fc-card:not(.hidden)', { timeout: 5000 });

    // Words with empty meaning (ZO) and filler meaning (AA, XU) should all appear
    const counter = await page.locator('#fc-counter').textContent();
    const total = parseInt((counter || '').split('/')[1]?.trim() || '0');
    expect(total).toBe(6);
  });

  test('no JS errors when toggling the checkbox before starting', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MIXED_MEANING_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-real-meanings', { timeout: 8000 });

    // Toggle checkbox multiple times
    await page.locator('#fc-real-meanings').check();
    await page.locator('#fc-real-meanings').uncheck();
    await page.locator('#fc-real-meanings').check();

    await page.waitForTimeout(300);

    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('checking the box does not crash when all words have filler meanings', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    // All words have filler/empty meanings
    const allFiller = JSON.stringify([
      { word: 'AA', score: 2, category: 'two-letter', meaning: 'Scrabble-legal word, valid in SOWPODS', dateAdded: '2026-01-01T00:00:00Z' },
      { word: 'ZO', score: 11, category: 'two-letter', meaning: '', dateAdded: '2026-01-01T00:00:00Z' },
      { word: 'XU', score: 9, category: 'two-letter', meaning: 'No standard definition available', dateAdded: '2026-01-01T00:00:00Z' },
    ]);

    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, allFiller);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-real-meanings', { timeout: 8000 });

    await page.locator('#fc-real-meanings').check();
    await page.locator('#fc-start-btn').click();
    await page.waitForTimeout(1000);

    // Should gracefully show all words (filter skipped when all would be excluded)
    // or show empty message — either way no crash
    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('label text reads "Meaningful only" (not a stale label)', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MIXED_MEANING_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-real-meanings', { timeout: 8000 });

    const labelText = await page.locator('label:has(#fc-real-meanings) span').textContent();
    expect(labelText?.trim()).toBe('Meaningful only');
  });
});
