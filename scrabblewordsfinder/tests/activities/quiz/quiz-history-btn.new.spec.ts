import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'https://scrabblewordsfinder-staging.xconvert.workers.dev';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── Quiz History Button — Positive ───────────────────────────────────────

test.describe('Quiz History Button — Positive', () => {
  test('quiz history button exists with id quiz-history-btn', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const btn = page.locator('#quiz-history-btn');
    // Button starts hidden, but should exist in the DOM
    await expect(btn).toHaveCount(1);
  });

  test('quiz history button links to /quiz-history/', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const btn = page.locator('#quiz-history-btn');
    await expect(btn).toHaveAttribute('href', '/quiz-history/');
  });

  test('quiz history button displays 📊 icon (not 🏅)', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const btn = page.locator('#quiz-history-btn');
    const icon = btn.locator('span').first();
    await expect(icon).toHaveText('📊');
  });

  test('quiz-complete section also links to /quiz-history/', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    // The link in quiz-complete panel
    const link = page.locator('#quiz-complete a[href="/quiz-history/"]');
    await expect(link).toHaveCount(1);
    await expect(link).toContainText('Quiz History');
  });
});

// ── Quiz History Button — Negative ───────────────────────────────────────

test.describe('Quiz History Button — Negative', () => {
  test('quiz history button does NOT link to old /wordbench-practice/ path', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const btn = page.locator('#quiz-history-btn');
    const href = await btn.getAttribute('href');
    expect(href).not.toBe('/wordbench-practice/');
    expect(href).not.toContain('wordbench-practice');
  });

  test('quiz history button does NOT show old 🏅 icon', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const btn = page.locator('#quiz-history-btn');
    const btnHtml = await btn.innerHTML();
    expect(btnHtml).not.toContain('🏅');
  });

  test('no duplicate quiz-history-btn elements', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const btns = page.locator('#quiz-history-btn');
    await expect(btns).toHaveCount(1);
  });

  test('no JS errors on activities page with quiz panel present', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(2000);
    expect(errors.filter(e =>
      e.toLowerCase().includes('uncaught') ||
      e.toLowerCase().includes('typeerror')
    )).toHaveLength(0);
  });
});
