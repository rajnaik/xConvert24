import { test, expect } from '@playwright/test';

const PAGE = '/blog/how-to-use-blank-tiles-strategically/';

test.describe('How to Use Blank Tiles Strategically — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('hero card is visible with Most Powerful Tile badge', async ({ page }) => {
    await page.goto(PAGE);
    const badge = page.locator('text=Most Powerful Tile');
    await expect(badge).toBeVisible();
  });

  test('hero card displays ZERO POINTS INFINITE POTENTIAL headline', async ({ page }) => {
    await page.goto(PAGE);
    const headline = page.locator('text=ZERO POINTS, INFINITE POTENTIAL');
    await expect(headline).toBeVisible();
  });

  test('hero card displays equity subtitle', async ({ page }) => {
    await page.goto(PAGE);
    const subtitle = page.locator('text=~25 pts equity');
    await expect(subtitle).toBeVisible();
  });

  test('hero card has gradient background styling', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('.border-2.border-amber-500\\/50');
    await expect(heroCard).toHaveClass(/bg-gradient-to-r/);
  });

  test('Why Blank Tiles Are So Valuable heading is visible', async ({ page }) => {
    await page.goto(PAGE);
    const heading = page.locator('h2', { hasText: 'Why Blank Tiles Are So Valuable' });
    await expect(heading).toBeVisible();
  });
});

test.describe('How to Use Blank Tiles Strategically — Negative', () => {

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
});
