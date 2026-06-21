import { test, expect } from '@playwright/test';

const PAGE = '/blog/defensive-scrabble-strategy/';

test.describe('Defensive Scrabble Strategy — Dead-End Letter Badges — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('dead-end letter badges section exists with dead end text', async ({ page }) => {
    await page.goto(PAGE);
    const deadEndText = page.locator('.text-green-400:has-text("dead end")').first();
    await expect(deadEndText).toBeVisible();
  });

  test('dead-end tile V is visible with 4 pts label', async ({ page }) => {
    await page.goto(PAGE);
    const tileV = page.locator('span.font-black:text-is("V")');
    await expect(tileV).toBeVisible();
    const badge = tileV.locator('..').locator('.text-green-400');
    await expect(badge).toContainText('4 pts — dead end');
  });

  test('dead-end tile W is visible with 4 pts label', async ({ page }) => {
    await page.goto(PAGE);
    const tileW = page.locator('span.font-black:text-is("W")');
    await expect(tileW).toBeVisible();
    const badge = tileW.locator('..').locator('.text-green-400');
    await expect(badge).toContainText('4 pts — dead end');
  });

  test('dead-end tile C is visible with 3 pts label', async ({ page }) => {
    await page.goto(PAGE);
    const tileC = page.locator('span.font-black:text-is("C")');
    await expect(tileC).toBeVisible();
    const badge = tileC.locator('..').locator('.text-green-400');
    await expect(badge).toContainText('3 pts — dead end');
  });

  test('hookable tile badges show E, S, D, R letters', async ({ page }) => {
    await page.goto(PAGE);
    for (const letter of ['E', 'S', 'D', 'R']) {
      const tile = page.locator(`span.font-black:text-is("${letter}")`);
      await expect(tile).toBeVisible();
      const label = tile.locator('..').locator('.text-red-400');
      await expect(label).toContainText('hookable');
    }
  });

  test('dead-end vs hookable comparison cards are visible', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('p.text-green-400:has-text("Dead-End Endings")')).toBeVisible();
    await expect(page.locator('p.text-red-400:has-text("Hookable Endings")')).toBeVisible();
  });
});

test.describe('Defensive Scrabble Strategy — Dead-End Letter Badges — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate Dead-End Endings cards', async ({ page }) => {
    await page.goto(PAGE);
    const cards = page.locator('p.text-green-400:has-text("Dead-End Endings")');
    await expect(cards).toHaveCount(1);
  });

  test('no duplicate Hookable Endings cards', async ({ page }) => {
    await page.goto(PAGE);
    const cards = page.locator('p.text-red-400:has-text("Hookable Endings")');
    await expect(cards).toHaveCount(1);
  });

  test('page does not link to itself', async ({ page }) => {
    await page.goto(PAGE);
    const selfLinks = page.locator(`a[href="${PAGE}"]`);
    await expect(selfLinks).toHaveCount(0);
  });

  test('exactly 3 dead-end badge labels exist', async ({ page }) => {
    await page.goto(PAGE);
    // Only the inner text spans with class text-green-400 and text-xs in the badge section
    const deadEndLabels = page.locator('span.text-green-400.text-xs');
    const count = await deadEndLabels.count();
    expect(count).toBe(3);
  });

  test('exactly 4 hookable badge labels exist', async ({ page }) => {
    await page.goto(PAGE);
    // Only the inner text spans with class text-red-400 and text-xs in the badge section
    const hookableLabels = page.locator('span.text-red-400.text-xs');
    const count = await hookableLabels.count();
    expect(count).toBe(4);
  });
});
