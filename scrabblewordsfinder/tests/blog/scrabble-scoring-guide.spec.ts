import { test, expect } from '@playwright/test';

const PAGE = '/blog/scrabble-scoring-guide/';

test.describe('Scrabble Scoring Guide — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('related articles section is visible with heading', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside.border-t');
    await expect(aside).toBeVisible();
    await expect(aside).toContainText('Related Articles');
  });

  test('related articles section contains 3 links', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside.border-t');
    const links = aside.locator('a');
    await expect(links).toHaveCount(3);
  });

  test('related articles links point to correct blog posts', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside.border-t');
    await expect(aside.locator('a[href="/blog/understanding-premium-squares/"]')).toBeVisible();
    await expect(aside.locator('a[href="/blog/scrabble-rules-explained/"]')).toBeVisible();
    await expect(aside.locator('a[href="/blog/scrabble-tile-strategy-letters-scoring/"]')).toBeVisible();
  });

  test('related articles arrows use blue-400 color class', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside.border-t');
    const arrows = aside.locator('span.text-blue-400');
    await expect(arrows).toHaveCount(3);
  });

  test('CTA box is visible with word finder link', async ({ page }) => {
    await page.goto(PAGE);
    const cta = page.locator('div.bg-gradient-to-r.from-blue-900\\/20.to-indigo-900\\/20');
    await expect(cta).toBeVisible();
    await expect(cta.locator('a[href="/"]')).toContainText('Open Word Finder');
  });

  test('CTA button uses blue-600 background styling', async ({ page }) => {
    await page.goto(PAGE);
    const ctaButton = page.locator('a.bg-blue-600[href="/"]');
    await expect(ctaButton).toBeVisible();
  });

  test('CTA box has shadow-sm class applied', async ({ page }) => {
    await page.goto(PAGE);
    const cta = page.locator('div.shadow-sm.bg-gradient-to-r.from-blue-900\\/20.to-indigo-900\\/20');
    await expect(cta).toBeVisible();
  });

  test('back to all articles link is present', async ({ page }) => {
    await page.goto(PAGE);
    const backLink = page.getByRole('link', { name: '← Back to all articles' });
    await expect(backLink).toBeVisible();
  });
});

test.describe('Scrabble Scoring Guide — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate related articles sections', async ({ page }) => {
    await page.goto(PAGE);
    const asides = page.locator('aside.border-t');
    await expect(asides).toHaveCount(1);
  });

  test('no duplicate CTA boxes on the page', async ({ page }) => {
    await page.goto(PAGE);
    const ctas = page.locator('div.bg-gradient-to-r.from-blue-900\\/20.to-indigo-900\\/20');
    await expect(ctas).toHaveCount(1);
  });

  test('related articles links are not broken (no empty href)', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside.border-t');
    const links = aside.locator('a');
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).toMatch(/^\/blog\/.+\/$/);
    }
  });

  test('CTA button text is not empty', async ({ page }) => {
    await page.goto(PAGE);
    const ctaButton = page.locator('a.bg-blue-600[href="/"]');
    const text = await ctaButton.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });
});
