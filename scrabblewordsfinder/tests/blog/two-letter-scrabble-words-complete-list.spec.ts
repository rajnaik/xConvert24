import { test, expect } from '@playwright/test';

const PAGE = '/blog/two-letter-scrabble-words-complete-list/';

test.describe('Two-Letter Scrabble Words Complete List — Related Articles — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('related articles section exists', async ({ page }) => {
    await page.goto(PAGE);
    const heading = page.locator('text=Related Articles');
    await expect(heading).toBeVisible();
  });

  test('link to all-2-letter-scrabble-words is present with correct href', async ({ page }) => {
    await page.goto(PAGE);
    const link = page.locator('a[href="/blog/all-2-letter-scrabble-words/"]');
    await expect(link).toBeVisible();
  });

  test('link to all-2-letter-scrabble-words has correct label text', async ({ page }) => {
    await page.goto(PAGE);
    const link = page.locator('a[href="/blog/all-2-letter-scrabble-words/"]');
    await expect(link).toContainText('All 2-Letter Scrabble Words');
  });

  test('link to best-two-letter-words-scrabble is still present', async ({ page }) => {
    await page.goto(PAGE);
    const link = page.locator('a[href="/blog/best-two-letter-words-scrabble/"]');
    await expect(link).toBeVisible();
  });
});

test.describe('Two-Letter Scrabble Words Complete List — Related Articles — Negative', () => {

  test('no duplicate links to all-2-letter-scrabble-words', async ({ page }) => {
    await page.goto(PAGE);
    const links = page.locator('a[href="/blog/all-2-letter-scrabble-words/"]');
    await expect(links).toHaveCount(1);
  });

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('related article links do not have empty href', async ({ page }) => {
    await page.goto(PAGE);
    const section = page.locator('aside').filter({ hasText: 'Related Articles' });
    const links = section.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href?.trim().length).toBeGreaterThan(0);
    }
  });

  test('page does not self-link in related articles', async ({ page }) => {
    await page.goto(PAGE);
    const section = page.locator('aside').filter({ hasText: 'Related Articles' });
    const selfLink = section.locator('a[href="/blog/two-letter-scrabble-words-complete-list/"]');
    await expect(selfLink).toHaveCount(0);
  });
});
