import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── Anagram Lex Chat Link — Positive ────────────────────────────────────
test.describe('Anagram Lex Chat Link — Positive', () => {
  test('Lex chat link is visible in the anagram panel header', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const lexLink = page.locator('a[href="/chat/?context=anagram"]');
    await expect(lexLink).toBeVisible();
  });

  test('Lex chat link has correct href with trailing slash', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const lexLink = page.locator('a[href="/chat/?context=anagram"]');
    await expect(lexLink).toHaveAttribute('href', '/chat/?context=anagram');
  });

  test('Lex chat link has correct title tooltip', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const lexLink = page.locator('a[href="/chat/?context=anagram"]');
    await expect(lexLink).toHaveAttribute('title', 'Get AI coaching on your anagram skills');
  });

  test('Lex chat link displays Lex avatar image', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const lexImg = page.locator('a[href="/chat/?context=anagram"] img[alt="Lex"]');
    await expect(lexImg).toBeVisible();
    await expect(lexImg).toHaveAttribute('src', '/lex-avatar-32.png');
  });

  test('Lex chat link shows "Lex" label text', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const lexLink = page.locator('a[href="/chat/?context=anagram"]');
    await expect(lexLink).toContainText('Lex');
  });
});

// ── Anagram Lex Chat Link — Negative ────────────────────────────────────
test.describe('Anagram Lex Chat Link — Negative', () => {
  test('no duplicate Lex chat links exist in the anagram panel', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const lexLinks = page.locator('a[href="/chat/?context=anagram"]');
    await expect(lexLinks).toHaveCount(1);
  });

  test('Lex chat link does not cause page errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(ACTIVITIES_URL);
    await page.waitForLoadState('networkidle');

    expect(errors.filter((e) => e.toLowerCase().includes('lex'))).toHaveLength(0);
  });

  test('Lex avatar image dimensions are set correctly (16x16)', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const lexImg = page.locator('a[href="/chat/?context=anagram"] img[alt="Lex"]');
    await expect(lexImg).toHaveAttribute('width', '16');
    await expect(lexImg).toHaveAttribute('height', '16');
  });

  test('Lex chat link is positioned alongside the history button (not replacing it)', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    // Both the Lex link and the history button container should coexist
    const lexLink = page.locator('a[href="/chat/?context=anagram"]');
    const historyBtn = page.locator('#anagram-history-btn');
    await expect(lexLink).toBeAttached();
    await expect(historyBtn).toBeAttached();
  });
});
