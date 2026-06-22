import { test, expect } from '@playwright/test';

const PAGE = '/blog/advanced-hook-strategy/';

test.describe('Advanced Hook Strategy — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('h1 heading is visible', async ({ page }) => {
    await page.goto(PAGE);
    const h1 = page.locator('article h1');
    await expect(h1).toContainText('Advanced Hook Strategy in Scrabble');
  });

  test('front and back hooks comparison grid has 2 cards', async ({ page }) => {
    await page.goto(PAGE);
    const hookGrid = page.locator('.border-green-500\\/30.bg-green-950\\/20');
    await expect(hookGrid).toHaveCount(2);
  });

  test('S-Hook rule of thumb callout is visible', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('text=The S-Hook Rule of Thumb');
    await expect(callout).toBeVisible();
  });

  test('parallel hooking numbered steps has 4 steps', async ({ page }) => {
    await page.goto(PAGE);
    const stepsContainer = page.locator('.border-purple-500\\/30.bg-purple-950\\/10');
    await expect(stepsContainer).toBeVisible();
    const steps = stepsContainer.locator('.bg-purple-600');
    await expect(steps).toHaveCount(4);
  });

  test('hook-blocking defense has 3 strategy tiles', async ({ page }) => {
    await page.goto(PAGE);
    const defenseTiles = page.locator('.border-purple-500\\/30.bg-purple-950\\/20.hover\\:border-purple-400');
    await expect(defenseTiles).toHaveCount(3);
  });

  test('surprising hooks amber callout is visible', async ({ page }) => {
    await page.goto(PAGE);
    const amberBox = page.locator('.border-amber-500\\/30.bg-amber-950\\/10');
    await expect(amberBox).toBeVisible();
    await expect(amberBox).toContainText('Surprising Hook Examples');
  });

  test('inline cross-links section exists with links', async ({ page }) => {
    await page.goto(PAGE);
    const crossLinks = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10');
    await expect(crossLinks).toBeVisible();
    await expect(crossLinks).toContainText('Related Strategy Reads');
    const links = crossLinks.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('CTA box with word finder link is visible', async ({ page }) => {
    await page.goto(PAGE);
    const cta = page.locator('.bg-gradient-to-r.from-blue-900\\/20').filter({ hasText: 'Find Hookable Words' });
    await expect(cta).toBeVisible();
    const ctaLink = cta.locator('a[href="/"]');
    await expect(ctaLink).toContainText('Try the Word Finder');
  });

  test('Related Articles aside is visible with links', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    await expect(aside).toBeVisible();
    const links = aside.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('back to blog link is present', async ({ page }) => {
    await page.goto(PAGE);
    const backLink = page.locator('a[href="/blog/"]').filter({ hasText: 'Back to Blog' });
    await expect(backLink).toBeVisible();
  });
});

test.describe('Advanced Hook Strategy — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate h1 headings in article', async ({ page }) => {
    await page.goto(PAGE);
    const h1s = page.locator('article h1');
    await expect(h1s).toHaveCount(1);
  });

  test('no duplicate CTA boxes', async ({ page }) => {
    await page.goto(PAGE);
    const ctas = page.locator('.bg-gradient-to-r.from-blue-900\\/20');
    await expect(ctas).toHaveCount(1);
  });

  test('page does not link to itself in cross-links', async ({ page }) => {
    await page.goto(PAGE);
    const crossLinkSection = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10');
    const links = crossLinkSection.locator('a');
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).not.toContain('advanced-hook-strategy');
    }
  });

  test('no duplicate Related Articles aside sections', async ({ page }) => {
    await page.goto(PAGE);
    const asides = page.locator('aside').filter({ hasText: 'Related Articles' });
    await expect(asides).toHaveCount(1);
  });
});
