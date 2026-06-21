import { test, expect } from '@playwright/test';

const PAGE = '/blog/tournament-level-strategy/';

test.describe('Tournament Level Strategy — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('hero card is visible with Tournament Grade badge', async ({ page }) => {
    await page.goto(PAGE);
    const badge = page.locator('text=Tournament Grade');
    await expect(badge).toBeVisible();
  });

  test('hero card displays BEYOND WORDS WIN UNDER PRESSURE headline', async ({ page }) => {
    await page.goto(PAGE);
    const headline = page.locator('text=BEYOND WORDS');
    await expect(headline).toBeVisible();
  });

  test('hero card displays clock time subtitle', async ({ page }) => {
    await page.goto(PAGE);
    const subtitle = page.locator('text=25 min clock');
    await expect(subtitle).toBeVisible();
  });

  test('hero card has gradient background styling', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('.border-2.border-amber-500\\/50');
    await expect(heroCard).toHaveClass(/bg-gradient-to-r/);
  });

  test('Clock Management heading is visible', async ({ page }) => {
    await page.goto(PAGE);
    const heading = page.locator('h2', { hasText: 'Clock Management' });
    await expect(heading).toBeVisible();
  });
});

test.describe('Tournament Level Strategy — Negative', () => {

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
