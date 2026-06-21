import { test, expect } from '@playwright/test';

const PAGE = '/blog/maximizing-blank-tiles/';

test.describe('Maximizing Blank Tiles — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('hero card with Power Tile badge is visible', async ({ page }) => {
    await page.goto(PAGE);
    const badge = page.locator('text=🃏 Power Tile');
    await expect(badge).toBeVisible();
  });

  test('hero card shows THE ULTIMATE WILDCARD heading', async ({ page }) => {
    await page.goto(PAGE);
    const heading = page.locator('text=THE ULTIMATE WILDCARD');
    await expect(heading).toBeVisible();
  });

  test('hero card displays strategic value stats line', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('.border-2.border-amber-500\\/50');
    await expect(heroCard).toContainText('0 pts face value');
    await expect(heroCard).toContainText('25-30 pts strategic value');
    await expect(heroCard).toContainText('Bingo enabler');
  });

  test('hero card contains descriptive paragraph about blank tiles', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('.border-2.border-amber-500\\/50');
    await expect(heroCard).toContainText('Two blank tiles exist in the bag');
    await expect(heroCard).toContainText('Save them for bingos');
  });

  test('stat strip with blank tile values is visible', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10');
    await expect(statStrip).toBeVisible();
    await expect(statStrip).toContainText('0 pts');
    await expect(statStrip).toContainText('25-30 pts');
  });

  test('article title is correct', async ({ page }) => {
    await page.goto(PAGE);
    const h1 = page.locator('article h1');
    await expect(h1).toContainText('Maximizing Blank Tiles');
  });

  test('breadcrumb navigation shows Strategy category', async ({ page }) => {
    await page.goto(PAGE);
    const nav = page.locator('nav.text-sm');
    await expect(nav).toContainText('Blog');
    await expect(nav).toContainText('Strategy');
  });
});

test.describe('Maximizing Blank Tiles — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate hero cards', async ({ page }) => {
    await page.goto(PAGE);
    const heroCards = page.locator('text=THE ULTIMATE WILDCARD');
    await expect(heroCards).toHaveCount(1);
  });

  test('no duplicate Power Tile badges', async ({ page }) => {
    await page.goto(PAGE);
    const badges = page.locator('text=🃏 Power Tile');
    await expect(badges).toHaveCount(1);
  });

  test('hero card does not render empty or missing text', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('.border-2.border-amber-500\\/50');
    const text = await heroCard.textContent();
    expect(text?.trim().length).toBeGreaterThan(50);
  });

  test('page does not link to itself in navigation', async ({ page }) => {
    await page.goto(PAGE);
    const selfLinks = page.locator(`a[href="${PAGE}"]`);
    await expect(selfLinks).toHaveCount(0);
  });
});
