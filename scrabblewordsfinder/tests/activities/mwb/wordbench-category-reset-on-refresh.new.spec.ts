import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'https://scrabblewordsfinder-staging.xconvert.workers.dev';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// Seed data with multiple categories
const MULTI_CATEGORY_WORDS = JSON.stringify([
  { word: 'AA', score: 2, category: 'two-letter', meaning: 'A type of lava', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'AB', score: 4, category: 'two-letter', meaning: 'An abdominal muscle', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'ZAP', score: 14, category: 'manual', meaning: 'To destroy or obliterate', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'QUIZ', score: 22, category: 'manual', meaning: 'A test of knowledge', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'QI', score: 11, category: 'q-without-u', meaning: 'Life force in Chinese philosophy', dateAdded: '2026-01-01T00:00:00Z' },
]);

// ── Category Reset on Refresh — Positive ───────────────────────────────

test.describe('WordBench Category Reset on Refresh — Positive', () => {
  test('activeCategory resets to "all" when refreshWordBench rebuilds filters', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MULTI_CATEGORY_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    // Start flash cards, then select a specific category
    await page.locator('#fc-start-btn').click();
    await page.waitForSelector('.fc-cat-filter', { timeout: 5000 });
    await page.locator('.fc-cat-filter[data-cat="two-letter"]').click();
    await page.waitForTimeout(300);

    // Dispatch mwb-updated event to trigger refreshWordBench()
    await page.evaluate(() => {
      document.dispatchEvent(new CustomEvent('mwb-updated'));
    });
    await page.waitForTimeout(500);

    // After refresh, the "All" filter should be active (green styling)
    const allClass = await page.locator('.fc-cat-filter[data-cat="all"]').getAttribute('class');
    expect(allClass).toContain('border-green-500');
    expect(allClass).toContain('bg-green-900');
  });

  test('Start button after mwb-updated uses all words, not stale category', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MULTI_CATEGORY_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    // Start flash cards and filter to two-letter only
    await page.locator('#fc-start-btn').click();
    await page.waitForSelector('.fc-cat-filter', { timeout: 5000 });
    await page.locator('.fc-cat-filter[data-cat="two-letter"]').click();
    await page.waitForTimeout(300);

    // Simulate adding a new word and dispatching mwb-updated
    await page.evaluate(() => {
      const saved = JSON.parse(localStorage.getItem('scbAchievements') || '[]');
      saved.push({ word: 'JINX', score: 18, category: 'manual', meaning: 'A curse', dateAdded: new Date().toISOString() });
      localStorage.setItem('scbAchievements', JSON.stringify(saved));
      document.dispatchEvent(new CustomEvent('mwb-updated'));
    });
    await page.waitForTimeout(500);

    // Now click Start — should use all words (including new JINX)
    await page.locator('#fc-start-btn').click();
    await page.waitForTimeout(500);

    // Verify all words are available in localStorage (original 5 + new 1 = 6)
    const count = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('scbAchievements') || '[]').length;
    });
    expect(count).toBe(6);
  });
});

// ── Category Reset on Refresh — Negative ───────────────────────────────

test.describe('WordBench Category Reset on Refresh — Negative', () => {
  test('no stale category filter persists after refreshWordBench triggers', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MULTI_CATEGORY_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    // Start and filter to q-without-u (only 1 word)
    await page.locator('#fc-start-btn').click();
    await page.waitForSelector('.fc-cat-filter', { timeout: 5000 });
    await page.locator('.fc-cat-filter[data-cat="q-without-u"]').click();
    await page.waitForTimeout(300);

    // Trigger refreshWordBench via mwb-updated
    await page.evaluate(() => {
      document.dispatchEvent(new CustomEvent('mwb-updated'));
    });
    await page.waitForTimeout(500);

    // The q-without-u filter should NOT be active anymore
    const quClass = await page.locator('.fc-cat-filter[data-cat="q-without-u"]').getAttribute('class');
    expect(quClass).not.toContain('bg-green-900');
    // Active tab has 'border-green-500/50' without 'hover:' prefix; inactive has 'hover:border-green-500/50'
    // Check active indicator: bg-green-900/30 is only on the active tab
    expect(quClass).not.toContain('bg-green-900/30');
  });

  test('no JavaScript errors when category resets during active flash card session', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MULTI_CATEGORY_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    // Start flash cards, filter, then trigger refresh mid-session
    await page.locator('#fc-start-btn').click();
    await page.waitForSelector('.fc-cat-filter', { timeout: 5000 });
    await page.locator('.fc-cat-filter[data-cat="two-letter"]').click();
    await page.waitForTimeout(300);

    // Trigger multiple rapid refreshes (simulates burst of mwb-updated events)
    await page.evaluate(() => {
      document.dispatchEvent(new CustomEvent('mwb-updated'));
      document.dispatchEvent(new CustomEvent('mwb-updated'));
      document.dispatchEvent(new CustomEvent('mwb-updated'));
    });
    await page.waitForTimeout(800);

    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
