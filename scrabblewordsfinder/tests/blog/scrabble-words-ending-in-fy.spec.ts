import { test, expect } from '@playwright/test';

const PAGE = '/blog/scrabble-words-ending-in-fy/';

test.describe('Scrabble Words Ending in -FY — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('related articles aside is visible with correct heading', async ({ page }) => {
    await page.goto(PAGE);
    const heading = page.locator('aside h3', { hasText: 'Related Articles' });
    await expect(heading).toBeVisible();
  });

  test('related articles contains link to -TY words', async ({ page }) => {
    await page.goto(PAGE);
    const link = page.locator('aside a[href="/blog/scrabble-words-ending-in-ty/"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText('Scrabble Words Ending in -TY');
  });

  test('related articles contains all expected links', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    const links = aside.locator('a');
    await expect(links).toHaveCount(5);
    await expect(aside.locator('a[href="/blog/scrabble-words-ending-in-ry/"]')).toBeVisible();
    await expect(aside.locator('a[href="/blog/scrabble-words-ending-in-gy/"]')).toBeVisible();
    await expect(aside.locator('a[href="/blog/scrabble-words-ending-in-ing/"]')).toBeVisible();
    await expect(aside.locator('a[href="/blog/scrabble-words-ending-in-ous/"]')).toBeVisible();
    await expect(aside.locator('a[href="/blog/scrabble-words-ending-in-ty/"]')).toBeVisible();
  });

  test('all related links have trailing slashes', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    const links = aside.locator('a');
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).toMatch(/\/$/);
    }
  });
});

test.describe('Scrabble Words Ending in -FY — Negative', () => {

  test('no page errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('related articles does NOT contain old -IZE link', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    const izeLink = aside.locator('a[href="/blog/scrabble-words-ending-in-ize/"]');
    await expect(izeLink).toHaveCount(0);
  });

  test('no duplicate related article links', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    const links = aside.locator('a');
    const count = await links.count();
    const hrefs: string[] = [];
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      hrefs.push(href || '');
    }
    const unique = new Set(hrefs);
    expect(unique.size).toBe(hrefs.length);
  });

  test('related article links are not empty', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    const links = aside.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const text = await links.nth(i).textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });
});
