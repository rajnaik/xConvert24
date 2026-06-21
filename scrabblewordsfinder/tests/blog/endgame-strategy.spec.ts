import { test, expect } from '@playwright/test';

const PAGE = '/blog/endgame-strategy/';

test.describe('Endgame Strategy — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('hero card with Endgame Phase badge is visible', async ({ page }) => {
    await page.goto(PAGE);
    const badge = page.locator('text=🏁 Endgame Phase');
    await expect(badge).toBeVisible();
  });

  test('hero card shows THE FINAL COUNTDOWN heading', async ({ page }) => {
    await page.goto(PAGE);
    const heading = page.locator('text=THE FINAL COUNTDOWN');
    await expect(heading).toBeVisible();
  });

  test('going-out bonus stat strip displays values', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10');
    await expect(statStrip).toBeVisible();
    await expect(statStrip).toContainText('14–20 pts');
    await expect(statStrip).toContainText('2×');
    await expect(statStrip).toContainText('30–40 pts');
  });

  test('Key Insight callout about going-out bonus is visible', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('.border-blue-500\\/30.bg-blue-950\\/20').filter({ hasText: 'Key Insight' });
    await expect(callout).toBeVisible();
    await expect(callout).toContainText('12-point play that ends the game');
  });

  test('Rush vs Slow comparison cards are visible', async ({ page }) => {
    await page.goto(PAGE);
    const rushCard = page.locator('.border-green-500\\/30').filter({ hasText: 'Rush When Ahead' });
    const slowCard = page.locator('.border-red-500\\/30').filter({ hasText: "Don't Rush When Behind" });
    await expect(rushCard).toBeVisible();
    await expect(slowCard).toBeVisible();
  });

  test('Critical Warning callout about bingo threat is visible', async ({ page }) => {
    await page.goto(PAGE);
    const warning = page.locator('.border-amber-500\\/30').filter({ hasText: 'Critical Warning' });
    await expect(warning).toBeVisible();
  });

  test('stuck tile penalty stat strip displays values', async ({ page }) => {
    await page.goto(PAGE);
    const statStrips = page.locator('.border-amber-500\\/30.bg-amber-950\\/10');
    const count = await statStrips.count();
    expect(count).toBeGreaterThanOrEqual(1);
    const penaltyStrip = statStrips.filter({ hasText: 'Stuck Q penalty' });
    await expect(penaltyStrip).toBeVisible();
    await expect(penaltyStrip).toContainText('-20 pts');
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
    await expect(crossLinks).toContainText('Midgame Strategy');
  });

  test('Related Articles aside is visible', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    await expect(aside).toBeVisible();
  });

  test('CTA box with word finder link is visible', async ({ page }) => {
    await page.goto(PAGE);
    const cta = page.locator('.bg-gradient-to-r.from-blue-900\\/20').filter({ hasText: 'endgame moves' });
    await expect(cta).toBeVisible();
  });
});

test.describe('Endgame Strategy — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate hero cards', async ({ page }) => {
    await page.goto(PAGE);
    const heroCards = page.locator('text=THE FINAL COUNTDOWN');
    await expect(heroCards).toHaveCount(1);
  });

  test('no duplicate CTA boxes', async ({ page }) => {
    await page.goto(PAGE);
    const ctas = page.locator('.bg-gradient-to-r.from-blue-900\\/20');
    await expect(ctas).toHaveCount(1);
  });

  test('no duplicate Related Articles aside sections', async ({ page }) => {
    await page.goto(PAGE);
    const asides = page.locator('aside').filter({ hasText: 'Related Articles' });
    await expect(asides).toHaveCount(1);
  });

  test('page does not link to itself', async ({ page }) => {
    await page.goto(PAGE);
    const selfLinks = page.locator(`a[href="${PAGE}"]`);
    await expect(selfLinks).toHaveCount(0);
  });

  test('cross-link hrefs do not point to current page', async ({ page }) => {
    await page.goto(PAGE);
    const crossLinkSection = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10');
    const links = crossLinkSection.locator('a');
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).not.toContain('endgame-strategy');
    }
  });
});
