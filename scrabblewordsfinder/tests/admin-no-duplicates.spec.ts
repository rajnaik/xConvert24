import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'https://www.scrabblewordsfinder.com';

test.describe('Admin Dashboard — No Duplicate Tiles', () => {
  test('each admin tile href appears exactly once', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);

    // Get all tile links (cards linking to /admin/*)
    const links = await page.locator('a[href^="/admin/"]').all();
    const hrefs: string[] = [];

    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href && href !== '/admin' && href !== '/admin/') {
        hrefs.push(href);
      }
    }

    // Check for duplicates
    const seen = new Set<string>();
    const duplicates: string[] = [];

    for (const href of hrefs) {
      if (seen.has(href)) {
        duplicates.push(href);
      }
      seen.add(href);
    }

    expect(duplicates, `Duplicate tiles found: ${duplicates.join(', ')}`).toHaveLength(0);
  });

  test('Saved Words tile exists and links to /admin/saved-words', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    const savedWordsLink = page.locator('a[href="/admin/saved-words"]');
    await expect(savedWordsLink).toBeVisible();
    await expect(savedWordsLink).toHaveCount(1);
  });

  test('Emails tile exists exactly once', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    const emailsLinks = page.locator('a[href="/admin/emails"]');
    await expect(emailsLinks).toHaveCount(1);
  });
});
