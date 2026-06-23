import { test, expect } from '@playwright/test';

const PAGE = '/blog/how-blank-tiles-work/';

test.describe('How Blank Tiles Work — Related Articles — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('related articles section is visible', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    await expect(aside).toBeVisible();
  });

  test('best-scrabble-words-with-blank link is present in related articles', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    const link = aside.locator('a[href="/blog/best-scrabble-words-with-blank/"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText('Best Scrabble Words With Blank Tiles');
  });

  test('tile-strategy link is present in related articles', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    const link = aside.locator('a[href="/blog/scrabble-tile-strategy-letters-scoring/"]');
    await expect(link).toBeVisible();
  });

  test('beginner-scrabble-strategy link is present in related articles', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    const link = aside.locator('a[href="/blog/beginner-scrabble-strategy/"]');
    await expect(link).toBeVisible();
  });

  test('scoring-guide link is present in related articles', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    const link = aside.locator('a[href="/blog/scrabble-scoring-guide/"]');
    await expect(link).toBeVisible();
  });

  test('related articles contains exactly 4 links', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    const links = aside.locator('a');
    await expect(links).toHaveCount(4);
  });
});

test.describe('How Blank Tiles Work — Related Articles — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate best-scrabble-words-with-blank links', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    const links = aside.locator('a[href="/blog/best-scrabble-words-with-blank/"]');
    await expect(links).toHaveCount(1);
  });

  test('related articles links do not have empty href', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    const links = aside.locator('a');
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href?.trim().length).toBeGreaterThan(0);
    }
  });

  test('no duplicate related articles sections on page', async ({ page }) => {
    await page.goto(PAGE);
    const asides = page.locator('aside').filter({ hasText: 'Related Articles' });
    await expect(asides).toHaveCount(1);
  });

  test('page does not link to itself in related articles', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    const selfLink = aside.locator(`a[href="${PAGE}"], a[href="/blog/how-blank-tiles-work/"]`);
    await expect(selfLink).toHaveCount(0);
  });
});
