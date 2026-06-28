import { test, expect } from '@playwright/test';

/**
 * Useful Links Page — Page Map Link Card Tests
 * Verifies the new Page Map link added to the useful-links blog page.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Useful Links — Page Map Card — Positive', () => {
  test('page map link card is visible on useful-links page', async ({ page }) => {
    await page.goto(`${BASE}/blog/useful-links/`);
    const link = page.locator('a[href="/pagemap/"]');
    await expect(link).toBeVisible();
  });

  test('page map link has correct title text', async ({ page }) => {
    await page.goto(`${BASE}/blog/useful-links/`);
    const title = page.locator('a[href="/pagemap/"] p.text-sm');
    await expect(title).toHaveText('Page Map');
  });

  test('page map link has correct description', async ({ page }) => {
    await page.goto(`${BASE}/blog/useful-links/`);
    const desc = page.locator('a[href="/pagemap/"] p.text-xs');
    await expect(desc).toContainText('Interactive graph of all 680+ pages');
  });

  test('page map link has map emoji icon', async ({ page }) => {
    await page.goto(`${BASE}/blog/useful-links/`);
    const emoji = page.locator('a[href="/pagemap/"] span.text-xl');
    await expect(emoji).toHaveText('🗺️');
  });
});

test.describe('Useful Links — Page Map Card — Negative', () => {
  test('no duplicate page map links on the page', async ({ page }) => {
    await page.goto(`${BASE}/blog/useful-links/`);
    const links = page.locator('a[href="/pagemap/"]');
    await expect(links).toHaveCount(1);
  });

  test('page map link does not cause page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/blog/useful-links/`);
    await page.locator('a[href="/pagemap/"]').scrollIntoViewIfNeeded();
    expect(errors).toHaveLength(0);
  });
});
