import { test, expect } from '@playwright/test';

const PAGE = '/blog/probability-based-play/';

test.describe('Probability-Based Play — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('hero card is visible with The Numbers Game badge', async ({ page }) => {
    await page.goto(PAGE);
    const badge = page.locator('text=The Numbers Game');
    await expect(badge).toBeVisible();
  });

  test('hero card displays PLAY THE ODDS NOT THE WORDS headline', async ({ page }) => {
    await page.goto(PAGE);
    const headline = page.locator('text=PLAY THE ODDS, NOT THE WORDS');
    await expect(headline).toBeVisible();
  });

  test('hero card displays tile count subtitle', async ({ page }) => {
    await page.goto(PAGE);
    const subtitle = page.locator('text=100 tiles · Known distribution · Calculable probabilities');
    await expect(subtitle).toBeVisible();
  });

  test('hero card description mentions expected value', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('.border-2.border-amber-500\\/50');
    await expect(heroCard).toBeVisible();
    await expect(heroCard).toContainText('expected value');
  });

  test('hero card has gradient background styling', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('.border-2.border-amber-500\\/50');
    await expect(heroCard).toHaveClass(/bg-gradient-to-r/);
  });

  test('Tile Tracking Fundamentals section heading is visible', async ({ page }) => {
    await page.goto(PAGE);
    const heading = page.locator('h2', { hasText: 'Tile Tracking Fundamentals' });
    await expect(heading).toBeVisible();
  });

  test('Expected Value Calculations section heading is visible', async ({ page }) => {
    await page.goto(PAGE);
    const heading = page.locator('h2', { hasText: 'Expected Value Calculations' });
    await expect(heading).toBeVisible();
  });

  test('stat strip displays tile distribution numbers', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    await expect(statStrip).toBeVisible();
    await expect(statStrip).toContainText('100');
    await expect(statStrip).toContainText('12');
  });

  test('breadcrumb links to blog and shows Strategy category', async ({ page }) => {
    await page.goto(PAGE);
    const blogLink = page.locator('nav a[href="/blog/"]');
    await expect(blogLink).toBeVisible();
    const strategy = page.locator('nav:has(a[href="/blog/"]) >> text=Strategy');
    await expect(strategy).toBeVisible();
  });

  test('article meta shows publication date and read time', async ({ page }) => {
    await page.goto(PAGE);
    const time = page.locator('time[datetime="2026-06-14"]');
    await expect(time).toBeVisible();
    const readTime = page.locator('text=8 min read');
    await expect(readTime).toBeVisible();
  });
});

test.describe('Probability-Based Play — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate hero cards on page', async ({ page }) => {
    await page.goto(PAGE);
    const heroCards = page.locator('.border-2.border-amber-500\\/50');
    await expect(heroCards).toHaveCount(1);
  });

  test('no duplicate The Numbers Game badges', async ({ page }) => {
    await page.goto(PAGE);
    const badges = page.locator('text=The Numbers Game');
    await expect(badges).toHaveCount(1);
  });

  test('hero card does not contain NaN or undefined values', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('.border-2.border-amber-500\\/50');
    const text = await heroCard.textContent();
    expect(text).not.toContain('NaN');
    expect(text).not.toContain('undefined');
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
});
