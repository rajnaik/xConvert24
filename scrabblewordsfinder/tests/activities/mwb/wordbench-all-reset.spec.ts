import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'https://scrabblewordsfinder-staging.xconvert.workers.dev';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// Seed data with multiple categories including wotd
const MULTI_CATEGORY_WORDS = JSON.stringify([
  { word: 'AA', score: 2, category: 'two-letter', meaning: 'A type of lava', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'AB', score: 4, category: 'two-letter', meaning: 'An abdominal muscle', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'QUAFF', score: 20, category: 'wotd', meaning: 'To drink heartily', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'ZEPHYR', score: 23, category: 'wotd', meaning: 'A gentle breeze', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'ZAP', score: 14, category: 'manual', meaning: 'To destroy', dateAdded: '2026-01-01T00:00:00Z' },
]);

// ── MWB "All" Category Reset After refreshWordBench — Positive ───────────

test.describe('WordBench All Category Reset — Positive', () => {
  test('clicking Start after page load shows all words (not just wotd)', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MULTI_CATEGORY_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    // Click Start without selecting any category filter first
    await page.locator('#fc-start-btn').click();
    await page.waitForSelector('#fc-card:not(.hidden)', { timeout: 5000 });

    // The counter should reflect ALL 5 words, not just 2 wotd
    const counter = await page.locator('#fc-counter').textContent();
    const total = parseInt((counter || '').split('/')[1]?.trim() || '0');
    expect(total).toBe(5);
  });

  test('All button is highlighted green on initial page load', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MULTI_CATEGORY_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.fc-cat-filter[data-cat="all"]', { timeout: 8000 });

    const allClass = await page.locator('.fc-cat-filter[data-cat="all"]').getAttribute('class');
    expect(allClass).toContain('border-green-500');
    expect(allClass).toContain('bg-green-900');
  });

  test('refreshWordBench resets activeCategory so Start shows all after WOTD save', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MULTI_CATEGORY_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    // Start flashcards and select "wotd" category
    await page.locator('#fc-start-btn').click();
    await page.waitForSelector('.fc-cat-filter[data-cat="wotd"]', { timeout: 5000 });
    await page.locator('.fc-cat-filter[data-cat="wotd"]').click();
    await page.waitForTimeout(300);

    // Verify wotd is now active (only 2 cards)
    const counterBefore = await page.locator('#fc-counter').textContent();
    const totalBefore = parseInt((counterBefore || '').split('/')[1]?.trim() || '0');
    expect(totalBefore).toBe(2);

    // Simulate a WOTD save event (adds a word + dispatches mwb-updated)
    await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('scbAchievements') || '[]');
      saved.push({ word: 'PLUMB', score: 11, category: 'wotd', meaning: 'To measure depth', dateAdded: new Date().toISOString() });
      localStorage.setItem('scbAchievements', JSON.stringify(saved));
      document.dispatchEvent(new CustomEvent('mwb-updated'));
    });
    await page.waitForTimeout(500);

    // After mwb-updated, refreshWordBench runs and resets activeCategory to 'all'
    // Since fcState.active was true, startFlashCards() re-runs and should pick up 'all'
    // But startFlashCards() uses fcState.activeCategory which was set to 'wotd' before mwb-updated
    // The fix in refreshWordBench resets it to 'all' BEFORE startFlashCards re-runs
    // Actually wait — mwb-updated calls refreshWordBench() then startFlashCards() in sequence
    // refreshWordBench sets fcState.activeCategory = 'all', then startFlashCards() picks that up

    // Verify the "All" button is highlighted after the refresh
    const allClass = await page.locator('.fc-cat-filter[data-cat="all"]').getAttribute('class');
    expect(allClass).toContain('border-green-500');
  });
});

// ── MWB "All" Category Reset — Negative ──────────────────────────────────

test.describe('WordBench All Category Reset — Negative', () => {
  test('Start button does NOT filter to wotd when user never selected a category', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MULTI_CATEGORY_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    // Click Start immediately — should show ALL words
    await page.locator('#fc-start-btn').click();
    await page.waitForSelector('#fc-card:not(.hidden)', { timeout: 5000 });

    // Verify the word shown is from any category (not exclusively wotd)
    const counter = await page.locator('#fc-counter').textContent();
    const total = parseInt((counter || '').split('/')[1]?.trim() || '0');
    // With 5 words and "meaningful only" checked, might filter some — but never just 2 (wotd count)
    expect(total).toBeGreaterThan(2);
  });

  test('no JS errors when mwb-updated fires and resets category state', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MULTI_CATEGORY_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    // Start cards, select wotd, then trigger mwb-updated
    await page.locator('#fc-start-btn').click();
    await page.waitForSelector('.fc-cat-filter[data-cat="wotd"]', { timeout: 5000 });
    await page.locator('.fc-cat-filter[data-cat="wotd"]').click();
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      document.dispatchEvent(new CustomEvent('mwb-updated'));
    });
    await page.waitForTimeout(500);

    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
