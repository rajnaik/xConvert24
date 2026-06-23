import { test, expect } from '@playwright/test';

const PAGE = '/blog/ai-scrabble-opponents/';

test.describe('AI Scrabble Opponents — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('h1 title is visible', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('article h1')).toContainText('AI Scrabble Opponents');
  });

  test('AI Decision Pipeline section has 4 numbered steps', async ({ page }) => {
    await page.goto(PAGE);
    const pipeline = page.locator('.border-cyan-500\\/30');
    await expect(pipeline).toBeVisible();
    await expect(pipeline.locator('text=Dictionary lookup')).toBeVisible();
    await expect(pipeline.locator('text=Move generation')).toBeVisible();
    await expect(pipeline.locator('text=Evaluation')).toBeVisible();
    await expect(pipeline.locator('text=Selection')).toBeVisible();
  });

  test('difficulty level cards are visible (Easy, Medium, Expert, Maximum)', async ({ page }) => {
    await page.goto(PAGE);
    const cards = page.locator('.border-purple-500\\/30');
    await expect(cards).toHaveCount(4);
    await expect(page.locator('text=Easy AI:')).toBeVisible();
    await expect(page.locator('text=Medium AI:')).toBeVisible();
    await expect(page.locator('text=Expert AI:')).toBeVisible();
    await expect(page.locator('text=Maximum AI:')).toBeVisible();
  });

  test('stats strip shows key numbers', async ({ page }) => {
    await page.goto(PAGE);
    const statsStrip = page.locator('.border-amber-500\\/30');
    await expect(statsStrip).toBeVisible();
    await expect(statsStrip.locator('text=178,691')).toBeVisible();
    await expect(statsStrip.locator('text=~500')).toBeVisible();
    await expect(statsStrip.locator('text=~95%')).toBeVisible();
  });

  test('Effective Training Protocol section has 4 steps', async ({ page }) => {
    await page.goto(PAGE);
    const protocol = page.locator('.border-green-500\\/30').filter({ hasText: 'Effective Training Protocol' });
    await expect(protocol).toBeVisible();
    const steps = protocol.locator('.rounded-full');
    await expect(steps).toHaveCount(4);
  });

  test('Notable AI Programs table has 4 rows', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table');
    await expect(table).toBeVisible();
    await expect(table.locator('text=Quackle')).toBeVisible();
    await expect(table.locator('text=Maven')).toBeVisible();
    await expect(table.locator('text=Elise')).toBeVisible();
    await expect(table.locator('text=Scrabble GO AI')).toBeVisible();
  });

  test('AI Teaches / Cannot Teach comparison cards visible', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('text=AI Teaches').first()).toBeVisible();
    await expect(page.locator('text=AI Cannot Teach').first()).toBeVisible();
  });

  test('Key Insight callout with equity points text is visible', async ({ page }) => {
    await page.goto(PAGE);
    const insight = page.locator('.border-blue-500\\/30').filter({ hasText: 'Key Insight' });
    await expect(insight).toBeVisible();
    await expect(insight.locator('text=15-25 equity points per turn')).toBeVisible();
  });

  test('Dig Deeper internal links section is visible', async ({ page }) => {
    await page.goto(PAGE);
    const digDeeper = page.locator('.border-indigo-500\\/30');
    await expect(digDeeper).toBeVisible();
    await expect(digDeeper.locator('a[href="/blog/rack-management-basics/"]')).toBeVisible();
    await expect(digDeeper.locator('a[href="/blog/tile-tracking-guide/"]')).toBeVisible();
  });

  test('related articles section has links', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside');
    await expect(aside).toBeVisible();
    await expect(aside.locator('a[href="/blog/best-scrabble-apps/"]')).toBeVisible();
    await expect(aside.locator('a[href="/blog/expert-scrabble-tactics/"]')).toBeVisible();
  });
});

test.describe('AI Scrabble Opponents — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate h1 elements in article', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('article h1')).toHaveCount(1);
  });

  test('no duplicate AI Programs tables', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('table')).toHaveCount(1);
  });

  test('no duplicate stats strips', async ({ page }) => {
    await page.goto(PAGE);
    const statsStrips = page.locator('.border-amber-500\\/30');
    await expect(statsStrips).toHaveCount(1);
  });

  test('page does not link to itself', async ({ page }) => {
    await page.goto(PAGE);
    const selfLinks = page.locator(`a[href="${PAGE}"]`);
    await expect(selfLinks).toHaveCount(0);
  });

  test('no broken internal links (all start with /)', async ({ page }) => {
    await page.goto(PAGE);
    const links = page.locator('article a[href^="/"]');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).toMatch(/^\//);
    }
  });
});
