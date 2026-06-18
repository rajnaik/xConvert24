import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4342';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// Seed: WOTD words with dates
const WOTD_WORDS = JSON.stringify([
  { word: 'QUAFF', score: 20, category: 'wotd', meaning: 'To drink heartily', dateAdded: '2026-06-18T10:00:00Z' },
  { word: 'ZEPHYR', score: 23, category: 'wotd', meaning: 'A gentle breeze', dateAdded: '2026-06-17T10:00:00Z' },
  { word: 'JINX', score: 18, category: 'wotd', meaning: 'A person or thing that brings bad luck', dateAdded: '2026-06-16T10:00:00Z' },
  { word: 'ZAP', score: 14, category: 'solver', meaning: 'To destroy suddenly', dateAdded: '2026-06-15T10:00:00Z' },
  { word: 'QI', score: 11, category: 'manual', meaning: 'Life force in Chinese philosophy', dateAdded: '2026-06-14T10:00:00Z' },
]);

// ── WOTD History Button — Positive ───────────────────────────────────────

test.describe('WOTD History Button — Positive', () => {
  test('history button is visible in WOTD panel header', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-history-btn', { timeout: 8000 });

    await expect(page.locator('#wotd-history-btn')).toBeVisible();
  });

  test('clicking history button shows the history panel', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, WOTD_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-history-btn', { timeout: 8000 });

    await page.locator('#wotd-history-btn').click();
    await expect(page.locator('#wotd-history-panel')).toBeVisible();
  });

  test('history panel shows only wotd-category words in table', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, WOTD_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-history-btn', { timeout: 8000 });

    await page.locator('#wotd-history-btn').click();
    await page.waitForSelector('#wotd-history-content:not(.hidden)', { timeout: 3000 });

    // Should show 3 wotd words (QUAFF, ZEPHYR, JINX) — not ZAP (solver) or QI (manual)
    const rows = page.locator('#wotd-history-body tr');
    await expect(rows).toHaveCount(3);
  });

  test('history table shows words sorted newest first', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, WOTD_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-history-btn', { timeout: 8000 });

    await page.locator('#wotd-history-btn').click();
    await page.waitForSelector('#wotd-history-content:not(.hidden)', { timeout: 3000 });

    const firstRow = page.locator('#wotd-history-body tr').first();
    await expect(firstRow).toContainText('QUAFF');
    await expect(firstRow).toContainText('2026-06-18');
  });

  test('clicking close button hides the history panel', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, WOTD_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-history-btn', { timeout: 8000 });

    await page.locator('#wotd-history-btn').click();
    await expect(page.locator('#wotd-history-panel')).toBeVisible();

    await page.locator('#wotd-history-close').click();
    await expect(page.locator('#wotd-history-panel')).not.toBeVisible();
  });
});

// ── WOTD History Button — Negative ───────────────────────────────────────

test.describe('WOTD History Button — Negative', () => {
  test('history panel shows empty state when no wotd words exist', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('scbAchievements', JSON.stringify([
        { word: 'ZAP', score: 14, category: 'solver', meaning: 'To destroy', dateAdded: '2026-06-15T10:00:00Z' },
      ]));
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-history-btn', { timeout: 8000 });

    await page.locator('#wotd-history-btn').click();
    await expect(page.locator('#wotd-history-empty')).toBeVisible();
    await expect(page.locator('#wotd-history-content')).not.toBeVisible();
  });

  test('history panel is hidden by default on page load', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-history-btn', { timeout: 8000 });

    await expect(page.locator('#wotd-history-panel')).not.toBeVisible();
  });

  test('no JavaScript errors when toggling history panel', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, WOTD_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-history-btn', { timeout: 8000 });

    await page.locator('#wotd-history-btn').click();
    await page.waitForTimeout(300);
    await page.locator('#wotd-history-btn').click();
    await page.waitForTimeout(300);

    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('toggling history button twice hides the panel (toggle behaviour)', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, WOTD_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-history-btn', { timeout: 8000 });

    await page.locator('#wotd-history-btn').click();
    await expect(page.locator('#wotd-history-panel')).toBeVisible();

    await page.locator('#wotd-history-btn').click();
    await expect(page.locator('#wotd-history-panel')).not.toBeVisible();
  });
});
