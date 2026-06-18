import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'https://scrabblewordsfinder-staging.xconvert.workers.dev';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// Seed localStorage with words so the panel renders fully
const SEED_WORDS = JSON.stringify([
  { word: 'QUAFF', score: 20, category: 'wotd', meaning: 'To drink heartily', dateAdded: '2026-01-01T00:00:00Z' },
  { word: 'ZAP', score: 14, category: 'rare-letters', meaning: 'To destroy suddenly', dateAdded: '2026-01-01T00:00:00Z' },
]);

// ── Practice History Button — Positive ───────────────────────────────────

test.describe('WordBench Practice History Button — Positive', () => {
  test('practice history button exists and is visible', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-history-btn', { timeout: 8000 });

    await expect(page.locator('#fc-history-btn')).toBeVisible();
  });

  test('practice history button has clock icon SVG', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-history-btn', { timeout: 8000 });

    const svgContent = await page.locator('#fc-history-btn svg').innerHTML();
    // Clock icon has the circular path with "12 8v4l3 3" pattern
    expect(svgContent).toContain('12 8v4l3 3');
  });

  test('practice history button has correct title attribute', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-history-btn', { timeout: 8000 });

    const title = await page.locator('#fc-history-btn').getAttribute('title');
    expect(title).toBe('Practice History');
  });

  test('clicking history button shows the history panel', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
      localStorage.setItem('swf-uid', 'test-user-123');
    }, SEED_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-history-btn', { timeout: 8000 });

    await page.locator('#fc-history-btn').click();

    await expect(page.locator('#fc-history-panel')).toBeVisible();
  });

  test('history panel shows "Practice History" heading', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
      localStorage.setItem('swf-uid', 'test-user-123');
    }, SEED_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-history-btn', { timeout: 8000 });

    await page.locator('#fc-history-btn').click();
    await expect(page.locator('#fc-history-panel')).toBeVisible();

    await expect(page.locator('#fc-history-panel h3')).toContainText('Practice History');
  });

  test('history panel has "View full" link to /wordbench-practice/', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
      localStorage.setItem('swf-uid', 'test-user-123');
    }, SEED_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-history-btn', { timeout: 8000 });

    await page.locator('#fc-history-btn').click();
    await expect(page.locator('#fc-history-panel')).toBeVisible();

    const link = page.locator('#fc-history-panel a[href="/wordbench-practice/"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText('View full');
  });

  test('clicking close button hides the history panel', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
      localStorage.setItem('swf-uid', 'test-user-123');
    }, SEED_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-history-btn', { timeout: 8000 });

    await page.locator('#fc-history-btn').click();
    await expect(page.locator('#fc-history-panel')).toBeVisible();

    await page.locator('#fc-history-close').click();
    await expect(page.locator('#fc-history-panel')).not.toBeVisible();
  });

  test('clicking history button again toggles panel closed', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
      localStorage.setItem('swf-uid', 'test-user-123');
    }, SEED_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-history-btn', { timeout: 8000 });

    // Open
    await page.locator('#fc-history-btn').click();
    await expect(page.locator('#fc-history-panel')).toBeVisible();

    // Toggle closed
    await page.locator('#fc-history-btn').click();
    await expect(page.locator('#fc-history-panel')).not.toBeVisible();
  });
});

// ── Practice History Button — Negative ───────────────────────────────────

test.describe('WordBench Practice History Button — Negative', () => {
  test('history panel is hidden by default on page load', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
    }, SEED_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-history-btn', { timeout: 8000 });

    await expect(page.locator('#fc-history-panel')).not.toBeVisible();
  });

  test('shows empty message when no practice history and no uid', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
      localStorage.removeItem('swf-uid');
    }, SEED_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-history-btn', { timeout: 8000 });

    await page.locator('#fc-history-btn').click();
    await expect(page.locator('#fc-history-panel')).toBeVisible();

    // Should show empty state when no uid
    await expect(page.locator('#fc-history-empty')).toBeVisible({ timeout: 5000 });
  });

  test('no JS errors when clicking history button rapidly', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
      localStorage.setItem('swf-uid', 'test-user-123');
    }, SEED_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-history-btn', { timeout: 8000 });

    // Click rapidly to toggle open/close
    await page.locator('#fc-history-btn').click();
    await page.waitForTimeout(50);
    await page.locator('#fc-history-btn').click();
    await page.waitForTimeout(50);
    await page.locator('#fc-history-btn').click();
    await page.waitForTimeout(300);

    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('history button does not interfere with Start button functionality', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
      localStorage.setItem('swf-uid', 'test-user-123');
    }, SEED_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-history-btn', { timeout: 8000 });

    // Open history panel
    await page.locator('#fc-history-btn').click();
    await expect(page.locator('#fc-history-panel')).toBeVisible();

    // Start button should still work
    await page.locator('#fc-start-btn').click();
    await page.waitForSelector('#fc-card:not(.hidden)', { timeout: 5000 });

    // Flash card should be visible
    await expect(page.locator('#fc-card')).toBeVisible();
  });

  test('history panel does not create duplicate elements on repeated opens', async ({ page }) => {
    await page.addInitScript((data) => {
      localStorage.setItem('scbAchievements', data);
      localStorage.setItem('swf-uid', 'test-user-123');
    }, SEED_WORDS);
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#fc-history-btn', { timeout: 8000 });

    // Open, close, open again
    await page.locator('#fc-history-btn').click();
    await page.waitForTimeout(500);
    await page.locator('#fc-history-btn').click();
    await page.waitForTimeout(200);
    await page.locator('#fc-history-btn').click();
    await page.waitForTimeout(500);

    // Should only have one history panel
    const panelCount = await page.locator('#fc-history-panel').count();
    expect(panelCount).toBe(1);
  });
});
