import { test, expect } from '@playwright/test';

const PAGE = '/blog/rack-leave-calculators/';

test.describe('Rack Leave Calculators — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('hero card displays LEAVE VALUE IMPACT title', async ({ page }) => {
    await page.goto(PAGE);
    const headline = page.locator('text=LEAVE VALUE IMPACT');
    await expect(headline).toBeVisible();
  });

  test('hero card shows best 2-tile leave stat (ST)', async ({ page }) => {
    await page.goto(PAGE);
    const stat = page.locator('text=Best 2-tile leave (ST)');
    await expect(stat).toBeVisible();
  });

  test('hero card shows worst 2-tile leave stat (QV)', async ({ page }) => {
    await page.goto(PAGE);
    const stat = page.locator('text=Worst 2-tile leave (QV)');
    await expect(stat).toBeVisible();
  });

  test('hero card has rounded-2xl border styling', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('.border-2.border-amber-500\\/50');
    await expect(heroCard).toBeVisible();
  });
});

test.describe('Rack Leave Calculators — Negative', () => {

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
