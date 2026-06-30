import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'https://www.scrabblewordsfinder.com';

test.describe('Letter Guides — Double Letter Links — Positive', () => {
  test('page loads with letter guides heading', async ({ page }) => {
    await page.goto(`${BASE}/blog/letter-guides/`);
    await expect(page).toHaveTitle(/Letter Guides/i);
  });

  test('all double-letter strategy links are present', async ({ page }) => {
    await page.goto(`${BASE}/blog/letter-guides/`);

    const expectedLinks = [
      { href: '/blog/scrabble-words-with-double-b/', text: 'BB Strategy' },
      { href: '/blog/scrabble-words-with-double-c/', text: 'CC Strategy' },
      { href: '/blog/scrabble-words-with-double-d/', text: 'DD Strategy' },
      { href: '/blog/scrabble-words-with-double-e/', text: 'EE Strategy' },
      { href: '/blog/scrabble-words-with-double-f/', text: 'FF Strategy' },
      { href: '/blog/scrabble-words-with-double-g/', text: 'GG Strategy' },
      { href: '/blog/scrabble-words-with-double-l/', text: 'LL Strategy' },
      { href: '/blog/scrabble-words-with-double-m/', text: 'MM Strategy' },
      { href: '/blog/scrabble-words-with-double-n/', text: 'NN Strategy' },
      { href: '/blog/scrabble-words-with-double-o/', text: 'OO Strategy' },
      { href: '/blog/scrabble-words-with-double-p/', text: 'PP Strategy' },
      { href: '/blog/scrabble-words-with-double-r/', text: 'RR Strategy' },
      { href: '/blog/scrabble-words-with-double-s/', text: 'SS Strategy' },
      { href: '/blog/scrabble-words-with-double-t/', text: 'TT Strategy' },
      { href: '/blog/scrabble-words-with-double-z/', text: 'ZZ Strategy' },
      { href: '/blog/scrabble-words-with-double-letters-strategy/', text: 'Overview' },
    ];

    for (const link of expectedLinks) {
      const anchor = page.locator(`a[href="${link.href}"]`);
      await expect(anchor).toBeVisible();
      await expect(anchor).toContainText(link.text);
    }
  });

  test('double-letter links have correct styling and hover classes', async ({ page }) => {
    await page.goto(`${BASE}/blog/letter-guides/`);
    const firstLink = page.locator('a[href="/blog/scrabble-words-with-double-d/"]');
    await expect(firstLink).toHaveClass(/rounded-lg/);
    await expect(firstLink).toHaveClass(/border/);
    await expect(firstLink).toHaveClass(/group/);
  });
});

test.describe('Letter Guides — Double Letter Links — Negative', () => {
  test('no duplicate double-letter links exist', async ({ page }) => {
    await page.goto(`${BASE}/blog/letter-guides/`);

    const letters = ['b', 'c', 'd', 'e', 'f', 'g', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'z'];
    for (const letter of letters) {
      const links = page.locator(`a[href="/blog/scrabble-words-with-double-${letter}/"]`);
      const count = await links.count();
      expect(count, `Expected exactly 1 link for double-${letter}, found ${count}`).toBe(1);
    }
  });

  test('all double-letter links have trailing slashes', async ({ page }) => {
    await page.goto(`${BASE}/blog/letter-guides/`);
    const allDoubleLinks = page.locator('a[href*="scrabble-words-with-double-"]');
    const count = await allDoubleLinks.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const href = await allDoubleLinks.nth(i).getAttribute('href');
      expect(href, `Link "${href}" missing trailing slash`).toMatch(/\/$/);
    }
  });
});
