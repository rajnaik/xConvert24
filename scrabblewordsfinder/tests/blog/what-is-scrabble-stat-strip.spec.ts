import { test, expect } from '@playwright/test';

const PAGE = '/blog/what-is-scrabble/';

test.describe('What Is Scrabble — Stat Strip — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('stat strip container is visible', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    await expect(statStrip).toBeVisible();
  });

  test('stat strip shows 1938 as Invented year', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    await expect(statStrip).toContainText('1938');
    await expect(statStrip).toContainText('Invented');
  });

  test('stat strip shows 150M+ sets sold', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    await expect(statStrip).toContainText('150M+');
    await expect(statStrip).toContainText('Sets Sold');
  });

  test('stat strip shows 30+ languages', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    await expect(statStrip).toContainText('30+');
    await expect(statStrip).toContainText('Languages');
  });

  test('stat strip shows 100 tiles per game', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    await expect(statStrip).toContainText('100');
    await expect(statStrip).toContainText('Tiles per Game');
  });

  test('stat strip contains exactly 4 stat items', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    const statItems = statStrip.locator('.text-2xl.font-bold.text-amber-400');
    await expect(statItems).toHaveCount(4);
  });
});

test.describe('What Is Scrabble — Stat Strip — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate stat strip containers on the page', async ({ page }) => {
    await page.goto(PAGE);
    // Stat strip is the first amber-bordered panel; tile distribution is the second
    const amberPanels = page.locator('.border-amber-500\\/30.bg-amber-950\\/10');
    const count = await amberPanels.count();
    // There should be exactly 2: stat strip + tile distribution (not more)
    expect(count).toBe(2);
  });

  test('stat strip does not contain empty stat values', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    const values = statStrip.locator('.text-2xl.font-bold.text-amber-400');
    const count = await values.count();
    for (let i = 0; i < count; i++) {
      const text = await values.nth(i).textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('stat strip labels are not empty', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    const labels = statStrip.locator('.text-xs.text-gray-400');
    const count = await labels.count();
    expect(count).toBe(4);
    for (let i = 0; i < count; i++) {
      const text = await labels.nth(i).textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });
});
