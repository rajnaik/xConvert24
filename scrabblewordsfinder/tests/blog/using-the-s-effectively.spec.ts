import { test, expect } from '@playwright/test';

const PAGE = '/blog/using-the-s-effectively/';

test.describe('Using the S Effectively — Hero Card — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('hero card is visible with Hidden Gem badge', async ({ page }) => {
    await page.goto(PAGE);
    const badge = page.locator('text=Hidden Gem');
    await expect(badge).toBeVisible();
  });

  test('hero card displays 1 POINT TILE, 10 POINT VALUE headline', async ({ page }) => {
    await page.goto(PAGE);
    const headline = page.locator('text=1 POINT TILE, 10 POINT VALUE');
    await expect(headline).toBeVisible();
  });

  test('hero card displays stats subtitle', async ({ page }) => {
    await page.goto(PAGE);
    const subtitle = page.locator('text=Only 4 in the bag');
    await expect(subtitle).toBeVisible();
  });

  test('hero card has gradient background styling', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('.not-prose.my-8.p-6.rounded-2xl.border-2');
    await expect(heroCard).toHaveClass(/bg-gradient-to-r/);
  });

  test('hero card contains strategic advice paragraph', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('.not-prose.my-8.p-6.rounded-2xl.border-2');
    const text = await heroCard.textContent();
    expect(text).toContain('Never waste an S for a measly 2-3 extra points');
  });
});

test.describe('Using the S Effectively — Hero Card — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate hero cards on page', async ({ page }) => {
    await page.goto(PAGE);
    const heroCards = page.locator('.not-prose.my-8.p-6.rounded-2xl.border-2');
    await expect(heroCards).toHaveCount(1);
  });

  test('hero card does not contain NaN or undefined values', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('.not-prose.my-8.p-6.rounded-2xl.border-2');
    const text = await heroCard.textContent();
    expect(text).not.toContain('NaN');
    expect(text).not.toContain('undefined');
  });

  test('hero card badge does not overflow container', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('.not-prose.my-8.p-6.rounded-2xl.border-2');
    await expect(heroCard).toHaveCSS('overflow', 'hidden');
  });
});
