import { test, expect } from '@playwright/test';

const PAGE = '/blog/power-plays-under-5-tiles/';

test.describe('Power Plays Under 5 Tiles — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('h1 heading is visible with correct text', async ({ page }) => {
    await page.goto(PAGE);
    const h1 = page.locator('article h1');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('Power Plays Under 5 Tiles');
  });

  test('breadcrumb links to Strategy category', async ({ page }) => {
    await page.goto(PAGE);
    const strategyLink = page.locator('nav a[href="/blog/strategy/"]');
    await expect(strategyLink).toBeVisible();
    await expect(strategyLink).toContainText('Strategy');
  });

  test('hero card about QI on TLS + TWS is visible', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('text=QI ON TLS + TWS = 62 POINTS');
    await expect(heroCard).toBeVisible();
  });

  test('2-letter power words card grid shows all 6 cards', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('p:has-text("QI — 11 pts")')).toBeVisible();
    await expect(page.locator('p:has-text("ZA — 11 pts")')).toBeVisible();
    await expect(page.locator('p:has-text("XI — 9 pts")')).toBeVisible();
    await expect(page.locator('p:has-text("XU — 9 pts")')).toBeVisible();
    await expect(page.locator('p:has-text("AX / EX / OX — 9 pts each")')).toBeVisible();
    await expect(page.locator('p:has-text("JO — 9 pts")')).toBeVisible();
  });

  test('3-letter power words section heading is visible', async ({ page }) => {
    await page.goto(PAGE);
    const heading = page.locator('h2:has-text("3-Letter Power Words")');
    await expect(heading).toBeVisible();
  });

  test('3-letter power words table has 8 word rows', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
    const rows = table.locator('tbody tr');
    await expect(rows).toHaveCount(8);
  });

  test('3-letter table shows ZAX as first entry with 19 points', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table').first();
    const firstRow = table.locator('tbody tr').first();
    await expect(firstRow.locator('td').first()).toContainText('ZAX');
    await expect(firstRow.locator('td').nth(1)).toContainText('19');
  });

  test('3-letter table has correct column headers', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table').first();
    await expect(table.locator('th:has-text("Word")')).toBeVisible();
    await expect(table.locator('th:has-text("Points")')).toBeVisible();
    await expect(table.locator('th:has-text("Power Tiles")')).toBeVisible();
    await expect(table.locator('th:has-text("On DWS")')).toBeVisible();
    await expect(table.locator('th:has-text("On TWS")')).toBeVisible();
  });

  test('ZAX explained callout is visible', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('text=ZAX Explained');
    await expect(callout).toBeVisible();
    const parent = page.locator('.border-cyan-500\\/30');
    await expect(parent).toContainText('Z (10) + A (1) + X (8) = 19');
  });

  test('QI Score by Square stat strip is visible', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('text=QI Score by Square');
    await expect(statStrip).toBeVisible();
  });

  test('power tile pill badges show Q, Z, X, J values', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('.rounded-lg:has-text("Q") >> text=10 pts')).toBeVisible();
    await expect(page.locator('.rounded-lg:has-text("Z") >> text=10 pts')).toBeVisible();
    await expect(page.locator('.rounded-lg:has-text("X") >> text=8 pts')).toBeVisible();
    await expect(page.locator('.rounded-lg:has-text("J") >> text=8 pts')).toBeVisible();
  });
});

test.describe('Power Plays Under 5 Tiles — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate h1 elements', async ({ page }) => {
    await page.goto(PAGE);
    const h1s = page.locator('article h1');
    await expect(h1s).toHaveCount(1);
  });

  test('no duplicate 3-letter power words tables', async ({ page }) => {
    await page.goto(PAGE);
    const tables = page.locator('table');
    // Page has exactly 2 tables: 3-letter power words + full scoring reference
    expect(await tables.count()).toBe(2);
  });

  test('no duplicate ZAX Explained callouts', async ({ page }) => {
    await page.goto(PAGE);
    const callouts = page.locator('.border-cyan-500\\/30');
    await expect(callouts).toHaveCount(1);
  });

  test('no duplicate hero cards', async ({ page }) => {
    await page.goto(PAGE);
    const heroCards = page.locator('text=QI ON TLS + TWS = 62 POINTS');
    await expect(heroCards).toHaveCount(1);
  });

  test('page does not link to itself', async ({ page }) => {
    await page.goto(PAGE);
    const selfLinks = page.locator(`a[href="${PAGE}"]`);
    await expect(selfLinks).toHaveCount(0);
  });

  test('FAQPage schema exists in page source', async ({ page }) => {
    await page.goto(PAGE);
    const html = await page.content();
    expect(html).toContain('"@type":"FAQPage"');
  });

  test('Article schema exists in page source', async ({ page }) => {
    await page.goto(PAGE);
    const html = await page.content();
    expect(html).toContain('"@type":"Article"');
  });

  test('3-letter table DWS column shows doubled values', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table').first();
    // ZAX: 19 base → DWS should be 38
    const zaxRow = table.locator('tbody tr').first();
    const dwsCell = zaxRow.locator('td').nth(3);
    await expect(dwsCell).toContainText('38');
  });

  test('3-letter table TWS column shows tripled values', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table').first();
    // ZAX: 19 base → TWS should be 57
    const zaxRow = table.locator('tbody tr').first();
    const twsCell = zaxRow.locator('td').nth(4);
    await expect(twsCell).toContainText('57');
  });
});
