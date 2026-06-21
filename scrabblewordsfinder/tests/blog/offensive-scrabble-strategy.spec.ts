import { test, expect } from '@playwright/test';

const PAGE = '/blog/offensive-scrabble-strategy/';

test.describe('Offensive Scrabble Strategy — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('hero card with ATTACK MODE badge is visible', async ({ page }) => {
    await page.goto(PAGE);
    const badge = page.locator('text=👑 ATTACK MODE');
    await expect(badge).toBeVisible();
  });

  test('hero card shows 400+ POINTS PER GAME heading', async ({ page }) => {
    await page.goto(PAGE);
    const heading = page.locator('text=400+ POINTS PER GAME');
    await expect(heading).toBeVisible();
  });

  test('stat strip displays all 4 stats', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10');
    await expect(statStrip).toBeVisible();
    await expect(statStrip).toContainText('Triple Word squares');
    await expect(statStrip).toContainText('30+');
    await expect(statStrip).toContainText('50 pts');
    await expect(statStrip).toContainText('4-5');
  });

  test('strategy tips section has 5 purple cards', async ({ page }) => {
    await page.goto(PAGE);
    const strategyCards = page.locator('.border-purple-500\\/30.bg-purple-950\\/20');
    await expect(strategyCards).toHaveCount(5);
  });

  test('Offensive Equation insight callout is visible', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('text=The Offensive Equation');
    await expect(callout).toBeVisible();
  });

  test('Dig Deeper cross-links section exists', async ({ page }) => {
    await page.goto(PAGE);
    const crossLinks = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10');
    await expect(crossLinks).toBeVisible();
    await expect(crossLinks).toContainText('Dig Deeper');
  });

  test('Related Articles aside is visible with links', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    await expect(aside).toBeVisible();
    const links = aside.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('CTA box with word finder link is visible', async ({ page }) => {
    await page.goto(PAGE);
    const cta = page.locator('.bg-gradient-to-r.from-blue-900\\/20').filter({ hasText: 'high-scoring plays' });
    await expect(cta).toBeVisible();
    const ctaLink = cta.locator('a[href="/"]');
    await expect(ctaLink).toContainText('Open Word Finder');
  });
});

test.describe('Offensive Scrabble Strategy — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate hero cards', async ({ page }) => {
    await page.goto(PAGE);
    const heroCards = page.locator('text=400+ POINTS PER GAME');
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

  test('cross-link hrefs do not point to current page', async ({ page }) => {
    await page.goto(PAGE);
    const crossLinkSection = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10');
    const links = crossLinkSection.locator('a');
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).not.toContain('offensive-scrabble-strategy');
    }
  });
});
