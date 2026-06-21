import { test, expect } from '@playwright/test';

const PAGE = '/blog/midgame-strategy/';

test.describe('Midgame Strategy — Visual Treatment — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('hero card displays THE MESSY MIDDLE heading', async ({ page }) => {
    await page.goto(PAGE);
    const hero = page.getByText('THE MESSY MIDDLE', { exact: true });
    await expect(hero).toBeVisible();
  });

  test('hero card shows Control Phase label', async ({ page }) => {
    await page.goto(PAGE);
    const label = page.locator('text=Control Phase');
    await expect(label).toBeVisible();
  });

  test('stat strip displays all three midgame statistics', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-cyan-500\\/30').first();
    await expect(statStrip).toBeVisible();
    await expect(statStrip).toContainText('Turns 4–12');
    await expect(statStrip).toContainText('60–70%');
    await expect(statStrip).toContainText('8 TWS');
  });

  test('board reading callout box is visible with correct label', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('text=Board Reading');
    await expect(callout).toBeVisible();
  });

  test('offense-defense comparison cards are both visible', async ({ page }) => {
    await page.goto(PAGE);
    const offenseCard = page.locator('text=Strong Rack → Play Offense');
    const defenseCard = page.locator('text=Weak Rack → Play Defense');
    await expect(offenseCard).toBeVisible();
    await expect(defenseCard).toBeVisible();
  });

  test('setup play risk warning callout is visible', async ({ page }) => {
    await page.goto(PAGE);
    const warning = page.locator('text=Setup Play Risk');
    await expect(warning).toBeVisible();
  });

  test('dig deeper cross-links section has links to endgame and rack management', async ({ page }) => {
    await page.goto(PAGE);
    const digDeeper = page.locator('text=Dig Deeper');
    await expect(digDeeper).toBeVisible();
    const endgameLink = page.locator('a[href="/blog/endgame-strategy/"]').first();
    const rackLink = page.locator('a[href="/blog/rack-management-basics/"]');
    await expect(endgameLink).toBeVisible();
    await expect(rackLink).toBeVisible();
  });

  test('strategy tips section has 5 purple strategy cards', async ({ page }) => {
    await page.goto(PAGE);
    const cards = page.locator('.border-purple-500\\/30.bg-purple-950\\/20');
    await expect(cards).toHaveCount(5);
  });

  test('related articles section shows 3 links', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside');
    await expect(aside).toBeVisible();
    await expect(aside.locator('a[href="/blog/opening-moves-guide/"]')).toBeVisible();
    await expect(aside.locator('a[href="/blog/endgame-strategy/"]')).toBeVisible();
    await expect(aside.locator('a[href="/blog/offensive-scrabble-strategy/"]')).toBeVisible();
  });

  test('CTA links to word finder homepage', async ({ page }) => {
    await page.goto(PAGE);
    const cta = page.locator('a:has-text("Open Word Finder")');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/');
  });
});

test.describe('Midgame Strategy — Visual Treatment — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate hero cards', async ({ page }) => {
    await page.goto(PAGE);
    const heroes = page.locator('.text-2xl.font-black:has-text("THE MESSY MIDDLE")');
    await expect(heroes).toHaveCount(1);
  });

  test('no duplicate stat strips', async ({ page }) => {
    await page.goto(PAGE);
    const strips = page.locator('.border-cyan-500\\/30');
    await expect(strips).toHaveCount(1);
  });

  test('no duplicate Setup Play Risk warnings', async ({ page }) => {
    await page.goto(PAGE);
    const warnings = page.locator('text=Setup Play Risk');
    await expect(warnings).toHaveCount(1);
  });

  test('no duplicate Board Reading callouts', async ({ page }) => {
    await page.goto(PAGE);
    const callouts = page.locator('text=Board Reading').filter({ hasText: 'Board Reading' });
    await expect(callouts).toHaveCount(1);
  });

  test('page does not link to itself', async ({ page }) => {
    await page.goto(PAGE);
    const selfLinks = page.locator(`a[href="${PAGE}"]`);
    await expect(selfLinks).toHaveCount(0);
  });

  test('offense-defense comparison has exactly 2 cards', async ({ page }) => {
    await page.goto(PAGE);
    const greenCard = page.locator('.border-green-500\\/30');
    const redCard = page.locator('.border-red-500\\/30');
    await expect(greenCard).toHaveCount(1);
    await expect(redCard).toHaveCount(1);
  });
});
