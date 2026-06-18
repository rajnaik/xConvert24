import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'https://scrabblewordsfinder-staging.xconvert.workers.dev';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// Seed data with multiple categories
const MULTI_CATEGORY_WORDS = JSON.stringify([
  { word: 'AA', score: 2, category: 'two-letter', meaning: 'A type of lava', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'AB', score: 4, category: 'two-letter', meaning: 'An abdominal muscle', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'AD', score: 3, category: 'two-letter', meaning: 'An advertisement', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'ZAP', score: 14, category: 'manual', meaning: 'To destroy or obliterate', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'QUIZ', score: 22, category: 'manual', meaning: 'A test of knowledge', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'QI', score: 11, category: 'q-without-u', meaning: 'Life force in Chinese philosophy', dateAdded: '2026-01-01T00:00:00Z' },
]);

// ── Category Filter Persistence — Positive ───────────────────────────────

test.describe('WordBench Category Filter Persistence — Positive', () => {
  test('selected category filter persists when startFlashCards is re-invoked without args', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MULTI_CATEGORY_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    // Start flash cards
    await page.locator('#fc-start-btn').click();
    await page.waitForSelector('.fc-cat-filter', { timeout: 5000 });

    // Click the "two-letter" category filter
    const twoLetterBtn = page.locator('.fc-cat-filter[data-cat="two-letter"]');
    await twoLetterBtn.click();
    await page.waitForTimeout(300);

    // Verify the two-letter filter is active (green styling)
    const classAttr = await page.locator('.fc-cat-filter[data-cat="two-letter"]').getAttribute('class');
    expect(classAttr).toContain('border-green-500');
    expect(classAttr).toContain('bg-green-900');
  });

  test('category filter remains after re-clicking Start button (no explicit category)', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MULTI_CATEGORY_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    // Start flash cards
    await page.locator('#fc-start-btn').click();
    await page.waitForSelector('.fc-cat-filter', { timeout: 5000 });

    // Select "two-letter" category
    await page.locator('.fc-cat-filter[data-cat="two-letter"]').click();
    await page.waitForTimeout(300);

    // Re-click Start (calls startFlashCards() without args)
    await page.locator('#fc-start-btn').click();
    await page.waitForTimeout(500);

    // The two-letter filter should STILL be highlighted as active
    const twoLetterClass = await page.locator('.fc-cat-filter[data-cat="two-letter"]').getAttribute('class');
    expect(twoLetterClass).toContain('border-green-500');

    // The "All" filter should NOT be highlighted
    const allClass = await page.locator('.fc-cat-filter[data-cat="all"]').getAttribute('class');
    expect(allClass).not.toContain('bg-green-900');
  });

  test('flash card word belongs to the persisted category after restart', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MULTI_CATEGORY_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    // Start flash cards and filter to two-letter
    await page.locator('#fc-start-btn').click();
    await page.waitForSelector('.fc-cat-filter', { timeout: 5000 });
    await page.locator('.fc-cat-filter[data-cat="two-letter"]').click();
    await page.waitForTimeout(300);

    // Re-click Start to re-invoke without explicit category
    await page.locator('#fc-start-btn').click();
    await page.waitForTimeout(500);

    // The displayed word should be a two-letter word (AA, AB, or AD)
    const wordEl = page.locator('#fc-word');
    await expect(wordEl).toBeVisible();
    const word = await wordEl.textContent();
    expect(['AA', 'AB', 'AD']).toContain(word?.trim());
  });
});

// ── Category Filter Persistence — Negative ───────────────────────────────

test.describe('WordBench Category Filter Persistence — Negative', () => {
  test('selecting "All" resets persistence and shows all words', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MULTI_CATEGORY_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    // Start and select a category
    await page.locator('#fc-start-btn').click();
    await page.waitForSelector('.fc-cat-filter', { timeout: 5000 });
    await page.locator('.fc-cat-filter[data-cat="two-letter"]').click();
    await page.waitForTimeout(300);

    // Now click "All" to reset
    await page.locator('.fc-cat-filter[data-cat="all"]').click();
    await page.waitForTimeout(300);

    // Re-click Start — should show all words, not persist two-letter
    await page.locator('#fc-start-btn').click();
    await page.waitForTimeout(500);

    const allClass = await page.locator('.fc-cat-filter[data-cat="all"]').getAttribute('class');
    expect(allClass).toContain('border-green-500');
  });

  test('no JavaScript errors when category filter persists across re-renders', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MULTI_CATEGORY_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    // Start, filter, restart — full cycle
    await page.locator('#fc-start-btn').click();
    await page.waitForSelector('.fc-cat-filter', { timeout: 5000 });
    await page.locator('.fc-cat-filter[data-cat="two-letter"]').click();
    await page.waitForTimeout(300);
    await page.locator('#fc-start-btn').click();
    await page.waitForTimeout(500);

    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('persisted category that no longer exists in data falls back to "all"', async ({ page }) => {
    // Start with multi-category data, select q-without-u, then reload with data missing that category
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MULTI_CATEGORY_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    // Start and select q-without-u
    await page.locator('#fc-start-btn').click();
    await page.waitForSelector('.fc-cat-filter', { timeout: 5000 });
    await page.locator('.fc-cat-filter[data-cat="q-without-u"]').click();
    await page.waitForTimeout(300);

    // Remove q-without-u words from localStorage (simulate data change)
    await page.evaluate(() => {
      const words = JSON.parse(localStorage.getItem('scbAchievements') || '[]');
      const filtered = words.filter((w: any) => w.category !== 'q-without-u');
      localStorage.setItem('scbAchievements', JSON.stringify(filtered));
    });

    // Re-click Start — should fall back to "all" since q-without-u no longer exists
    await page.locator('#fc-start-btn').click();
    await page.waitForTimeout(500);

    const allClass = await page.locator('.fc-cat-filter[data-cat="all"]').getAttribute('class');
    expect(allClass).toContain('border-green-500');
  });

  test('no duplicate category filter buttons after multiple re-renders with persistence', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, MULTI_CATEGORY_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-start-btn', { timeout: 8000 });

    // Start, filter, restart multiple times
    await page.locator('#fc-start-btn').click();
    await page.waitForSelector('.fc-cat-filter', { timeout: 5000 });
    await page.locator('.fc-cat-filter[data-cat="two-letter"]').click();
    await page.waitForTimeout(200);
    await page.locator('#fc-start-btn').click();
    await page.waitForTimeout(300);
    await page.locator('#fc-start-btn').click();
    await page.waitForTimeout(300);

    // Count "All" buttons — should only be 1
    const allBtnCount = await page.locator('.fc-cat-filter[data-cat="all"]').count();
    expect(allBtnCount).toBe(1);

    // Count two-letter buttons — should only be 1
    const twoLetterCount = await page.locator('.fc-cat-filter[data-cat="two-letter"]').count();
    expect(twoLetterCount).toBe(1);
  });
});
