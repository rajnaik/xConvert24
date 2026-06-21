import { test, expect } from '@playwright/test';

const PAGE = '/blog/counting-tiles-strategy/';

test.describe('Counting Tiles Strategy — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('hero card with Core Principle is visible', async ({ page }) => {
    await page.goto(PAGE);
    const hero = page.locator('text=Core Principle');
    await expect(hero).toBeVisible();
  });

  test('hero card displays KNOWLEDGE = POWER headline', async ({ page }) => {
    await page.goto(PAGE);
    const headline = page.locator('text=KNOWLEDGE = POWER');
    await expect(headline).toBeVisible();
  });

  test('stat strip displays all 4 tile statistics', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10');
    await expect(statStrip.first()).toBeVisible();
    await expect(statStrip.first()).toContainText('100');
    await expect(statStrip.first()).toContainText('27');
    await expect(statStrip.first()).toContainText('187');
    await expect(statStrip.first()).toContainText('15-25');
  });

  test('stat strip labels are correct', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10');
    await expect(statStrip.first()).toContainText('Total tiles');
    await expect(statStrip.first()).toContainText('Unique letters + blank');
    await expect(statStrip.first()).toContainText('Total point value');
    await expect(statStrip.first()).toContainText('Extra pts/game from tracking');
  });

  test('What Is Tile Tracking section heading is visible', async ({ page }) => {
    await page.goto(PAGE);
    const heading = page.locator('h2', { hasText: 'What Is Tile Tracking?' });
    await expect(heading).toBeVisible();
  });

  test('Why It Works insight callout is visible', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('text=Why It Works');
    await expect(callout).toBeVisible();
  });

  test('The Tally Sheet Method section heading is visible', async ({ page }) => {
    await page.goto(PAGE);
    const heading = page.locator('h2', { hasText: 'The Tally Sheet Method' });
    await expect(heading).toBeVisible();
  });

  test('How to Start Tracking steps block is visible with 4 steps', async ({ page }) => {
    await page.goto(PAGE);
    const stepsBox = page.locator('.border-purple-500\\/30.bg-purple-950\\/10').first();
    await expect(stepsBox).toBeVisible();
    await expect(stepsBox.locator('text=How to Start Tracking')).toBeVisible();
    const steps = stepsBox.locator('.flex.items-start.gap-3');
    await expect(steps).toHaveCount(4);
  });

  test('step 1 mentions print a tally sheet', async ({ page }) => {
    await page.goto(PAGE);
    const stepsBox = page.locator('.border-purple-500\\/30.bg-purple-950\\/10').first();
    await expect(stepsBox).toContainText('Print a tally sheet');
  });

  test('step 4 mentions verify your count', async ({ page }) => {
    await page.goto(PAGE);
    const stepsBox = page.locator('.border-purple-500\\/30.bg-purple-950\\/10').first();
    await expect(stepsBox).toContainText('Verify your count');
  });

  test('breadcrumb links to blog and strategy category', async ({ page }) => {
    await page.goto(PAGE);
    const blogLink = page.locator('nav a[href="/blog/"]');
    const strategyLink = page.locator('nav a[href="/blog/strategy/"]');
    await expect(blogLink).toBeVisible();
    await expect(strategyLink).toBeVisible();
  });

  test('article meta shows publication date and read time', async ({ page }) => {
    await page.goto(PAGE);
    const time = page.locator('time[datetime="2026-06-15"]');
    await expect(time).toBeVisible();
    const readTime = page.locator('text=7 min read');
    await expect(readTime).toBeVisible();
  });
});

test.describe('Counting Tiles Strategy — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate Core Principle hero cards', async ({ page }) => {
    await page.goto(PAGE);
    const heroes = page.locator('text=Core Principle');
    await expect(heroes).toHaveCount(1);
  });

  test('no duplicate How to Start Tracking sections', async ({ page }) => {
    await page.goto(PAGE);
    const sections = page.locator('text=How to Start Tracking');
    await expect(sections).toHaveCount(1);
  });

  test('no duplicate Why It Works callouts', async ({ page }) => {
    await page.goto(PAGE);
    const callouts = page.locator('text=Why It Works');
    await expect(callouts).toHaveCount(1);
  });

  test('page does not link to itself', async ({ page }) => {
    await page.goto(PAGE);
    const selfLinks = page.locator(`a[href="${PAGE}"]`);
    await expect(selfLinks).toHaveCount(0);
  });

  test('no broken heading hierarchy — article h1 exists and is unique', async ({ page }) => {
    await page.goto(PAGE);
    const articleH1s = page.locator('article h1');
    await expect(articleH1s).toHaveCount(1);
  });

  test('stat strip does not contain NaN or undefined values', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    const text = await statStrip.textContent();
    expect(text).not.toContain('NaN');
    expect(text).not.toContain('undefined');
  });
});
