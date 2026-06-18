import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'https://scrabblewordsfinder-staging.xconvert.workers.dev';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// Seed data with multiple categories
const MULTI_CATEGORY_WORDS = JSON.stringify([
  { word: 'AA', score: 2, category: 'two-letter', meaning: 'A type of lava', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'AB', score: 4, category: 'two-letter', meaning: 'An abdominal muscle', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'QI', score: 11, category: 'q-without-u', meaning: 'Life force in Chinese philosophy', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'QOPH', score: 18, category: 'q-without-u', meaning: 'Hebrew letter', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'QUAFF', score: 20, category: 'wotd', meaning: 'To drink heartily', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'ZAP', score: 14, category: 'rare-letters', meaning: 'To destroy suddenly', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'ZAX', score: 19, category: 'rare-letters', meaning: 'A tool for cutting roofing slates', dateAdded: '2026-01-01T00:00:00Z' },
]);

// ── Category Tab Auto-Play — Positive ────────────────────────────────────

test.describe('WordBench Category Tab Auto-Play — Positive', () => {
  test('clicking a category tab loads the deck and starts auto-play', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MULTI_CATEGORY_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.fc-cat-filter[data-cat="two-letter"]', { timeout: 8000 });

    // Click the "two-letter" category tab
    await page.locator('.fc-cat-filter[data-cat="two-letter"]').click();
    await page.waitForSelector('#fc-card:not(.hidden)', { timeout: 5000 });

    // Verify auto-play checkbox is checked
    const isAutoPlaying = await page.locator('#fc-autoplay').isChecked();
    expect(isAutoPlaying).toBe(true);
  });

  test('clicking a category tab shows the flash card with correct word count', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MULTI_CATEGORY_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.fc-cat-filter[data-cat="q-without-u"]', { timeout: 8000 });

    await page.locator('.fc-cat-filter[data-cat="q-without-u"]').click();
    await page.waitForSelector('#fc-card:not(.hidden)', { timeout: 5000 });

    // Counter should show 2 words (QI, QOPH)
    const counter = await page.locator('#fc-counter').textContent();
    const total = parseInt((counter || '').split('/')[1]?.trim() || '0');
    expect(total).toBe(2);
  });

  test('clicking "All" category tab loads all words and starts auto-play', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MULTI_CATEGORY_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.fc-cat-filter[data-cat="all"]', { timeout: 8000 });

    await page.locator('.fc-cat-filter[data-cat="all"]').click();
    await page.waitForSelector('#fc-card:not(.hidden)', { timeout: 5000 });

    // Auto-play should be active
    const isAutoPlaying = await page.locator('#fc-autoplay').isChecked();
    expect(isAutoPlaying).toBe(true);

    // All 7 words should be in the deck
    const counter = await page.locator('#fc-counter').textContent();
    const total = parseInt((counter || '').split('/')[1]?.trim() || '0');
    expect(total).toBe(7);
  });

  test('auto-play button shows pause icon after category tab click', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MULTI_CATEGORY_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.fc-cat-filter[data-cat="rare-letters"]', { timeout: 8000 });

    await page.locator('.fc-cat-filter[data-cat="rare-letters"]').click();
    await page.waitForSelector('#fc-card:not(.hidden)', { timeout: 5000 });

    // Auto-play button should show pause icon (two vertical bars path)
    const btnHtml = await page.locator('#fc-autoplay-btn').innerHTML();
    expect(btnHtml).toContain('M6 4h4v16H6V4z');
  });

  test('speed controls are visible after category tab triggers auto-play', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MULTI_CATEGORY_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.fc-cat-filter[data-cat="two-letter"]', { timeout: 8000 });

    await page.locator('.fc-cat-filter[data-cat="two-letter"]').click();
    await page.waitForSelector('#fc-card:not(.hidden)', { timeout: 5000 });

    // Speed wrap should be visible
    await expect(page.locator('#fc-speed-wrap')).not.toHaveClass(/hidden/);
  });

  test('timer starts after category tab triggers auto-play', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MULTI_CATEGORY_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.fc-cat-filter[data-cat="two-letter"]', { timeout: 8000 });

    await page.locator('.fc-cat-filter[data-cat="two-letter"]').click();
    await page.waitForSelector('#fc-timer:not(.hidden)', { timeout: 5000 });

    // Timer should be visible and counting
    const timerText = await page.locator('#fc-timer').textContent();
    expect(timerText).toMatch(/\d+:\d+/);
  });
});

// ── Category Tab Auto-Play — Negative ────────────────────────────────────

test.describe('WordBench Category Tab Auto-Play — Negative', () => {
  test('Start button does NOT trigger auto-play (only category tabs do)', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MULTI_CATEGORY_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    // Click Start (not a category tab)
    await page.locator('#fc-start-btn').click();
    await page.waitForSelector('#fc-card:not(.hidden)', { timeout: 5000 });

    // Auto-play should NOT be active
    const isAutoPlaying = await page.locator('#fc-autoplay').isChecked();
    expect(isAutoPlaying).toBe(false);
  });

  test('no JS errors when clicking category tabs rapidly', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MULTI_CATEGORY_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.fc-cat-filter[data-cat="two-letter"]', { timeout: 8000 });

    // Click multiple category tabs rapidly
    await page.locator('.fc-cat-filter[data-cat="two-letter"]').click();
    await page.waitForTimeout(100);
    await page.locator('.fc-cat-filter[data-cat="q-without-u"]').click();
    await page.waitForTimeout(100);
    await page.locator('.fc-cat-filter[data-cat="rare-letters"]').click();
    await page.waitForTimeout(500);

    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('switching categories resets deck to new category (no stale cards)', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MULTI_CATEGORY_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.fc-cat-filter[data-cat="two-letter"]', { timeout: 8000 });

    // Start with two-letter (2 words)
    await page.locator('.fc-cat-filter[data-cat="two-letter"]').click();
    await page.waitForSelector('#fc-card:not(.hidden)', { timeout: 5000 });
    const counter1 = await page.locator('#fc-counter').textContent();
    const total1 = parseInt((counter1 || '').split('/')[1]?.trim() || '0');
    expect(total1).toBe(2);

    // Switch to rare-letters (2 words)
    await page.locator('.fc-cat-filter[data-cat="rare-letters"]').click();
    await page.waitForTimeout(300);
    const counter2 = await page.locator('#fc-counter').textContent();
    const total2 = parseInt((counter2 || '').split('/')[1]?.trim() || '0');
    expect(total2).toBe(2);
  });

  test('auto-play does not crash on category with single word', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MULTI_CATEGORY_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.fc-cat-filter[data-cat="wotd"]', { timeout: 8000 });

    // wotd has only 1 word
    await page.locator('.fc-cat-filter[data-cat="wotd"]').click();
    await page.waitForSelector('#fc-card:not(.hidden)', { timeout: 5000 });

    // Wait for one auto-play cycle
    await page.waitForTimeout(6000);

    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
