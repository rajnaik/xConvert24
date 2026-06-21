import { test, expect } from '@playwright/test';

const PAGE = '/blog/tile-tracking-guide/';

test.describe('Tile Tracking Guide — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('hero card with Information Edge badge is visible', async ({ page }) => {
    await page.goto(PAGE);
    const badge = page.locator('text=🧠 Information Edge');
    await expect(badge).toBeVisible();
  });

  test('hero card shows COUNT EVERYTHING heading', async ({ page }) => {
    await page.goto(PAGE);
    const heading = page.locator('text=COUNT EVERYTHING');
    await expect(heading).toBeVisible();
  });

  test('stat strip displays tile counts', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10');
    await expect(statStrip).toBeVisible();
    await expect(statStrip).toContainText('100');
    await expect(statStrip).toContainText('12');
    await expect(statStrip).toContainText('<15');
  });

  test('The Formula insight callout is visible', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('text=The Formula');
    await expect(callout).toBeVisible();
  });

  test('tracking insight comparison cards are visible', async ({ page }) => {
    await page.goto(PAGE);
    const goodCard = page.locator('.border-green-500\\/30').filter({ hasText: 'All S tiles played' });
    const badCard = page.locator('.border-red-500\\/30').filter({ hasText: 'Both blanks unseen' });
    await expect(goodCard).toBeVisible();
    await expect(badCard).toBeVisible();
  });

  test('Exchange Decision warning callout is visible', async ({ page }) => {
    await page.goto(PAGE);
    const warning = page.locator('.border-amber-500\\/30').filter({ hasText: 'Exchange Decision' });
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
    await expect(crossLinks).toContainText('Endgame Strategy');
  });

  test('Related Articles aside is visible', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    await expect(aside).toBeVisible();
    const links = aside.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('CTA box with word finder link is visible', async ({ page }) => {
    await page.goto(PAGE);
    const cta = page.locator('.bg-gradient-to-r.from-blue-900\\/20').filter({ hasText: 'tile bag tracking' });
    await expect(cta).toBeVisible();
  });
});

test.describe('Tile Tracking Guide — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate hero cards', async ({ page }) => {
    await page.goto(PAGE);
    const heroCards = page.locator('text=COUNT EVERYTHING');
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
