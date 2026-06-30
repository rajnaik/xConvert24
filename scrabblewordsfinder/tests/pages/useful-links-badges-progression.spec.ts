import { test, expect } from '@playwright/test';

/**
 * Useful Links Page — Badges & Progression Guide Link Card Tests
 * Verifies the new Badges & Progression Guide link added to the useful-links blog page.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Useful Links — Badges & Progression Guide Card — Positive', () => {
  test('badges progression guide link card is visible on useful-links page', async ({ page }) => {
    await page.goto(`${BASE}/blog/useful-links/`);
    const link = page.locator('a[href="/blog/scrabble-badges-progression-guide/"]');
    await expect(link).toBeVisible();
  });

  test('badges progression guide link has correct title text', async ({ page }) => {
    await page.goto(`${BASE}/blog/useful-links/`);
    const title = page.locator('a[href="/blog/scrabble-badges-progression-guide/"] p.text-sm');
    await expect(title).toHaveText('Badges & Progression Guide');
  });

  test('badges progression guide link has correct description', async ({ page }) => {
    await page.goto(`${BASE}/blog/useful-links/`);
    const desc = page.locator('a[href="/blog/scrabble-badges-progression-guide/"] p.text-xs');
    await expect(desc).toContainText('How tiered badges track your growth as a player');
  });

  test('badges progression guide link has book emoji icon', async ({ page }) => {
    await page.goto(`${BASE}/blog/useful-links/`);
    const emoji = page.locator('a[href="/blog/scrabble-badges-progression-guide/"] span.text-xl');
    await expect(emoji).toHaveText('📖');
  });
});

test.describe('Useful Links — Badges & Progression Guide Card — Negative', () => {
  test('no duplicate badges progression guide links on the page', async ({ page }) => {
    await page.goto(`${BASE}/blog/useful-links/`);
    const links = page.locator('a[href="/blog/scrabble-badges-progression-guide/"]');
    await expect(links).toHaveCount(1);
  });

  test('badges progression guide link does not cause page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/blog/useful-links/`);
    await page.locator('a[href="/blog/scrabble-badges-progression-guide/"]').scrollIntoViewIfNeeded();
    expect(errors).toHaveLength(0);
  });
});
