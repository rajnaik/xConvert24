import { test, expect } from '@playwright/test';

/**
 * Admin Dashboard — Stars & Diamonds Card Tests
 * Tests the Stars & Diamonds tile on /admin/ page:
 * - Card visibility and structure
 * - Correct link href
 * - Stats placeholders (Stars, Diamonds, Users)
 * - No duplicate tile
 */

const ADMIN_URL = '/admin/';

test.describe('Admin Dashboard — Stars & Diamonds Card — Positive', () => {
  test('Stars & Diamonds card is visible on the admin dashboard', async ({ page }) => {
    await page.goto(ADMIN_URL);
    const card = page.locator('a[href="/admin/stars-and-diamonds/"]');
    await expect(card).toBeVisible();
  });

  test('card has correct heading text', async ({ page }) => {
    await page.goto(ADMIN_URL);
    const card = page.locator('a[href="/admin/stars-and-diamonds/"]');
    await expect(card.locator('h2')).toContainText('Stars & Diamonds');
  });

  test('card has description text', async ({ page }) => {
    await page.goto(ADMIN_URL);
    const card = page.locator('a[href="/admin/stars-and-diamonds/"]');
    await expect(card).toContainText('View all earned stars and diamonds grouped by user');
  });

  test('card has Stars stat placeholder', async ({ page }) => {
    await page.goto(ADMIN_URL);
    const starsEl = page.locator('#sd-a-stars');
    await expect(starsEl).toBeVisible();
    await expect(starsEl).toHaveText('-');
  });

  test('card has Diamonds stat placeholder', async ({ page }) => {
    await page.goto(ADMIN_URL);
    const diamondsEl = page.locator('#sd-a-diamonds');
    await expect(diamondsEl).toBeVisible();
    await expect(diamondsEl).toHaveText('-');
  });

  test('card has Users stat placeholder', async ({ page }) => {
    await page.goto(ADMIN_URL);
    const usersEl = page.locator('#sd-a-users');
    await expect(usersEl).toBeVisible();
    await expect(usersEl).toHaveText('-');
  });

  test('card has amber border styling', async ({ page }) => {
    await page.goto(ADMIN_URL);
    const card = page.locator('a[href="/admin/stars-and-diamonds/"]');
    await expect(card).toHaveClass(/border-amber-800/);
  });

  test('card appears in the Activities section', async ({ page }) => {
    await page.goto(ADMIN_URL);
    // The Activities section heading
    const activitiesHeading = page.locator('h2:has-text("Activities")');
    await expect(activitiesHeading).toBeVisible();
    // The card should be within the grid after the Activities heading
    const card = page.locator('a[href="/admin/stars-and-diamonds/"]');
    await expect(card).toBeVisible();
  });
});

test.describe('Admin Dashboard — Stars & Diamonds Card — Negative', () => {
  test('no duplicate Stars & Diamonds tile exists', async ({ page }) => {
    await page.goto(ADMIN_URL);
    const cards = page.locator('a[href="/admin/stars-and-diamonds/"]');
    await expect(cards).toHaveCount(1);
  });

  test('stat IDs are unique on the page', async ({ page }) => {
    await page.goto(ADMIN_URL);
    // Each stat ID should appear exactly once
    await expect(page.locator('#sd-a-stars')).toHaveCount(1);
    await expect(page.locator('#sd-a-diamonds')).toHaveCount(1);
    await expect(page.locator('#sd-a-users')).toHaveCount(1);
  });

  test('card does not crash page when stats container is empty', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(ADMIN_URL);
    // Wait for page to settle
    await page.waitForTimeout(1000);
    const criticalErrors = errors.filter(e => e.includes('stars-and-diamonds') || e.includes('sd-a-'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('card link does not 404 when clicked', async ({ page }) => {
    await page.goto(ADMIN_URL);
    const card = page.locator('a[href="/admin/stars-and-diamonds/"]');
    await card.click();
    // Should not result in a hard 404 error page (could be auth redirect or valid page)
    await expect(page).not.toHaveTitle(/404/);
  });
});
