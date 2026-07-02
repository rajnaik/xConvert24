import { test, expect } from '@playwright/test';

/**
 * Admin Dashboard — Avatars Card Tests
 * Tests the Avatars tile on /admin/:
 * - Card structure, link, and content
 * - Stats grid (Users, Avatars, Multi-Visit)
 * - No duplicates or page errors
 */

test.describe('Admin Dashboard — Avatars Card Positive', () => {
  test('has Avatars card linking to /admin/avatars/', async ({ page }) => {
    await page.goto('/admin/');
    const card = page.locator('a[href="/admin/avatars/"]');
    await expect(card).toBeVisible();
    await expect(card.locator('h2')).toContainText('Avatars');
  });

  test('Avatars card shows description text', async ({ page }) => {
    await page.goto('/admin/');
    const card = page.locator('a[href="/admin/avatars/"]');
    await expect(card).toContainText('Manage user avatars, display names, and profile data');
  });

  test('Avatars card has stats grid with 3 columns', async ({ page }) => {
    await page.goto('/admin/');
    const statsGrid = page.locator('#avatars-admin-stats');
    await expect(statsGrid).toBeVisible();
    await expect(statsGrid).toHaveClass(/grid-cols-3/);
  });

  test('Avatars card shows Users stat placeholder', async ({ page }) => {
    await page.goto('/admin/');
    await expect(page.locator('#avatars-a-total')).toBeAttached();
    await expect(page.locator('#avatars-a-total')).toHaveText('-');
  });

  test('Avatars card shows Avatars count', async ({ page }) => {
    await page.goto('/admin/');
    await expect(page.locator('#avatars-a-avatars')).toBeAttached();
    await expect(page.locator('#avatars-a-avatars')).toHaveText('50');
  });

  test('Avatars card shows Multi-Visit stat placeholder', async ({ page }) => {
    await page.goto('/admin/');
    await expect(page.locator('#avatars-a-returning')).toBeAttached();
    await expect(page.locator('#avatars-a-returning')).toHaveText('-');
  });

  test('Avatars card has teal border styling', async ({ page }) => {
    await page.goto('/admin/');
    const card = page.locator('a[href="/admin/avatars/"]');
    await expect(card).toHaveClass(/border-teal-800/);
    await expect(card).toHaveClass(/hover:border-teal-700/);
  });
});

test.describe('Admin Dashboard — Avatars Card Negative', () => {
  test('no duplicate Avatars cards exist on the page', async ({ page }) => {
    await page.goto('/admin/');
    const cards = page.locator('a[href="/admin/avatars/"]');
    await expect(cards).toHaveCount(1);
  });

  test('Avatars card does not cause page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/admin/');
    await expect(page.locator('a[href="/admin/avatars/"]')).toBeVisible();
    expect(errors.filter(e => e.toLowerCase().includes('avatar'))).toHaveLength(0);
  });

  test('Avatars stats IDs are unique (no collision with other cards)', async ({ page }) => {
    await page.goto('/admin/');
    await expect(page.locator('#avatars-a-total')).toHaveCount(1);
    await expect(page.locator('#avatars-a-avatars')).toHaveCount(1);
    await expect(page.locator('#avatars-a-returning')).toHaveCount(1);
  });
});
