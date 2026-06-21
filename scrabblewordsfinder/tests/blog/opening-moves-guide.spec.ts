import { test, expect } from '@playwright/test';

const PAGE = '/blog/opening-moves-guide/';

test.describe('Opening Moves Guide — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('hero card with First Move badge is visible', async ({ page }) => {
    await page.goto(PAGE);
    const badge = page.locator('text=🎯 First Move');
    await expect(badge).toBeVisible();
  });

  test('hero card shows SET THE TONE heading', async ({ page }) => {
    await page.goto(PAGE);
    const heading = page.locator('text=SET THE TONE');
    await expect(heading).toBeVisible();
  });

  test('stat strip displays first-player advantage stats', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10');
    await expect(statStrip).toBeVisible();
    await expect(statStrip).toContainText('52–54%');
    await expect(statStrip).toContainText('5 tiles');
    await expect(statStrip).toContainText('10–15 pts');
  });

  test('Board Direction insight callout is visible', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('.border-blue-500\\/30.bg-blue-950\\/20').filter({ hasText: 'Board Direction' });
    await expect(callout).toBeVisible();
  });

  test('5-letter vs 3-letter comparison cards are visible', async ({ page }) => {
    await page.goto(PAGE);
    const goodCard = page.locator('.border-green-500\\/30').filter({ hasText: '5-Letter Openers' });
    const badCard = page.locator('.border-red-500\\/30').filter({ hasText: '3-Letter Openers' });
    await expect(goodCard).toBeVisible();
    await expect(badCard).toBeVisible();
  });

  test('Leave Rule warning callout is visible', async ({ page }) => {
    await page.goto(PAGE);
    const warning = page.locator('.border-amber-500\\/30').filter({ hasText: 'Leave Rule' });
    await expect(warning).toBeVisible();
  });

  test('strategy tips section has 5 purple cards', async ({ page }) => {
    await page.goto(PAGE);
    const strategyCards = page.locator('.border-purple-500\\/30.bg-purple-950\\/20');
    await expect(strategyCards).toHaveCount(5);
  });

  test('Dig Deeper cross-links section exists', async ({ page }) => {
    await page.goto(PAGE);
    const crossLinks = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10');
    await expect(crossLinks).toBeVisible();
    await expect(crossLinks).toContainText('Beginner Scrabble Strategy');
  });

  test('Related Articles aside is visible with 3 links', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    await expect(aside).toBeVisible();
    const links = aside.locator('a');
    await expect(links).toHaveCount(3);
  });

  test('CTA box with word finder link is visible', async ({ page }) => {
    await page.goto(PAGE);
    const cta = page.locator('.bg-gradient-to-r.from-blue-900\\/20').filter({ hasText: 'best opening moves' });
    await expect(cta).toBeVisible();
  });
});

test.describe('Opening Moves Guide — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate hero cards', async ({ page }) => {
    await page.goto(PAGE);
    const heroCards = page.locator('text=SET THE TONE');
    await expect(heroCards).toHaveCount(1);
  });

  test('no duplicate stat strips', async ({ page }) => {
    await page.goto(PAGE);
    const strips = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10');
    await expect(strips).toHaveCount(1);
  });

  test('no duplicate CTA boxes', async ({ page }) => {
    await page.goto(PAGE);
    const ctas = page.locator('.bg-gradient-to-r.from-blue-900\\/20');
    await expect(ctas).toHaveCount(1);
  });

  test('page does not link to itself', async ({ page }) => {
    await page.goto(PAGE);
    const selfLinks = page.locator(`a[href="${PAGE}"]`);
    await expect(selfLinks).toHaveCount(0);
  });

  test('no duplicate Dig Deeper sections', async ({ page }) => {
    await page.goto(PAGE);
    const sections = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10');
    await expect(sections).toHaveCount(1);
  });
});
