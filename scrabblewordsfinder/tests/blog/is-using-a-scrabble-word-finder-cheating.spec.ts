import { test, expect } from '@playwright/test';

const PAGE = '/blog/is-using-a-scrabble-word-finder-cheating/';

test.describe('Is Using a Word Finder Cheating — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('h1 heading is visible with correct text', async ({ page }) => {
    await page.goto(PAGE);
    const h1 = page.locator('article h1');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('Is Using a Scrabble Word Finder Cheating');
  });

  test('article meta shows date and read time', async ({ page }) => {
    await page.goto(PAGE);
    const time = page.locator('time[datetime="2026-06-21"]');
    await expect(time).toBeVisible();
    const readTime = page.locator('text=7 min read');
    await expect(readTime).toBeVisible();
  });

  test('hero verdict card is visible', async ({ page }) => {
    await page.goto(PAGE);
    const hero = page.locator('.border-amber-500\\/50:has-text("IT DEPENDS ON CONTEXT")');
    await expect(hero).toBeVisible();
  });

  test('comparison cards show cheating vs not-cheating', async ({ page }) => {
    await page.goto(PAGE);
    const cheatingCards = page.locator('.border-red-500\\/30:has-text("Cheating")');
    const notCheatingCards = page.locator('.border-green-500\\/30:has-text("Not Cheating")');
    await expect(cheatingCards).toHaveCount(2);
    await expect(notCheatingCards).toHaveCount(2);
  });

  test('numbered steps for pro usage are present', async ({ page }) => {
    await page.goto(PAGE);
    const stepsBlock = page.locator('.border-purple-500\\/30:has-text("How Pros Use Word Finders")');
    await expect(stepsBlock).toBeVisible();
    const steps = stepsBlock.locator('.rounded-full');
    await expect(steps).toHaveCount(4);
  });

  test('chess parallel insight callout is visible', async ({ page }) => {
    await page.goto(PAGE);
    const insight = page.locator('.border-blue-500\\/30:has-text("Chess Parallel")');
    await expect(insight).toBeVisible();
  });

  test('inline cross-links Dig Deeper block exists', async ({ page }) => {
    await page.goto(PAGE);
    const crossLinks = page.locator('.border-indigo-500\\/30:has-text("Dig Deeper")');
    await expect(crossLinks).toBeVisible();
  });

  test('Related Articles aside has 3 links', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside:has-text("Related Articles")');
    await expect(aside).toBeVisible();
    const links = aside.locator('a');
    await expect(links).toHaveCount(3);
  });

  test('CTA box with Word Finder link is present', async ({ page }) => {
    await page.goto(PAGE);
    const cta = page.locator('a:has-text("Open Word Finder")');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/');
  });

  test('back to blog link is present', async ({ page }) => {
    await page.goto(PAGE);
    const backLink = page.locator('a:has-text("Back to all articles")');
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/blog/');
  });
});

test.describe('Is Using a Word Finder Cheating — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate h1 headings', async ({ page }) => {
    await page.goto(PAGE);
    const h1s = page.locator('article h1');
    await expect(h1s).toHaveCount(1);
  });

  test('no duplicate hero verdict cards', async ({ page }) => {
    await page.goto(PAGE);
    const heroes = page.locator('.border-amber-500\\/50:has-text("IT DEPENDS ON CONTEXT")');
    await expect(heroes).toHaveCount(1);
  });

  test('no self-referencing links in Related Articles', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside:has-text("Related Articles")');
    const selfLinks = aside.locator(`a[href="${PAGE}"]`);
    await expect(selfLinks).toHaveCount(0);
  });

  test('cross-link hrefs are not empty', async ({ page }) => {
    await page.goto(PAGE);
    const crossBlock = page.locator('.border-indigo-500\\/30').first();
    const links = crossBlock.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).toBeTruthy();
      expect(href!.length).toBeGreaterThan(1);
    }
  });

  test('no broken JSON-LD script tags', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    expect(count).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < count; i++) {
      const content = await scripts.nth(i).textContent();
      expect(() => JSON.parse(content!)).not.toThrow();
    }
  });
});
