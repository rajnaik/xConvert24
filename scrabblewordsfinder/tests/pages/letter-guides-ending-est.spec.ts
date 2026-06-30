import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'https://www.scrabblewordsfinder.com';

test.describe('Letter Guides — Words Ending in EST Link — Positive', () => {
  test('EST link is present on letter-guides page', async ({ page }) => {
    await page.goto(`${BASE}/blog/letter-guides/`);
    const estLink = page.locator('a[href="/blog/words-ending-in-est/"]');
    await expect(estLink).toBeVisible();
    await expect(estLink).toContainText('...EST');
  });

  test('EST link has correct styling classes', async ({ page }) => {
    await page.goto(`${BASE}/blog/letter-guides/`);
    const estLink = page.locator('a[href="/blog/words-ending-in-est/"]');
    await expect(estLink).toHaveClass(/rounded-lg/);
    await expect(estLink).toHaveClass(/border/);
    await expect(estLink).toHaveClass(/group/);
  });
});

test.describe('Letter Guides — Words Ending in EST Link — Negative', () => {
  test('no duplicate EST link exists', async ({ page }) => {
    await page.goto(`${BASE}/blog/letter-guides/`);
    const estLinks = page.locator('a[href="/blog/words-ending-in-est/"]');
    const count = await estLinks.count();
    expect(count, `Expected exactly 1 EST link, found ${count}`).toBe(1);
  });

  test('EST link has trailing slash in href', async ({ page }) => {
    await page.goto(`${BASE}/blog/letter-guides/`);
    const estLink = page.locator('a[href="/blog/words-ending-in-est/"]');
    const href = await estLink.getAttribute('href');
    expect(href).toMatch(/\/$/);
  });
});
