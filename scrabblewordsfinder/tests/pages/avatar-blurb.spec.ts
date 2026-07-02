import { test, expect } from '@playwright/test';

/**
 * Avatar System Blurb — Settings & Guide Pages
 * Tests that the avatar/display name explanation section exists on both pages.
 */

test.describe('Avatar Blurb — Settings Page Positive', () => {
  test('Settings page has Avatar & Display Name section', async ({ page }) => {
    await page.goto('/settings/');
    await expect(page.locator('text=Your Avatar & Display Name')).toBeVisible();
  });

  test('Settings avatar section mentions 50 avatars', async ({ page }) => {
    await page.goto('/settings/');
    await expect(page.locator('text=50 unique avatars')).toBeVisible();
  });

  test('Settings avatar section mentions display name', async ({ page }) => {
    await page.goto('/settings/');
    await expect(page.locator('strong:has-text("Display name")')).toBeVisible();
  });

  test('Settings avatar section mentions anonymous', async ({ page }) => {
    await page.goto('/settings/');
    const section = page.locator('text=Still anonymous');
    await expect(section).toBeVisible();
  });
});

test.describe('Avatar Blurb — Guide Page Positive', () => {
  test('Guide page has Avatars & Display Names heading', async ({ page }) => {
    await page.goto('/guide/');
    await expect(page.locator('h2:has-text("Avatars & Display Names")')).toBeVisible();
  });

  test('Guide avatar section mentions 50 avatars', async ({ page }) => {
    await page.goto('/guide/');
    await expect(page.locator('text=50 avatars to choose from')).toBeVisible();
  });

  test('Guide avatar section links to settings', async ({ page }) => {
    await page.goto('/guide/');
    const section = page.locator('text=Avatars & Display Names').locator('..').locator('..');
    const link = page.locator('a[href="/settings/"]');
    await expect(link.first()).toBeVisible();
  });

  test('Guide avatar section mentions UUID restore', async ({ page }) => {
    await page.goto('/guide/');
    await expect(page.locator('text=Relink your UUID on a new device and they restore automatically')).toBeVisible();
  });
});

test.describe('Avatar Blurb — Negative', () => {
  test('Settings page does not duplicate the avatar section', async ({ page }) => {
    await page.goto('/settings/');
    const sections = page.locator('text=Your Avatar & Display Name');
    await expect(sections).toHaveCount(1);
  });

  test('Guide page does not duplicate the avatar section', async ({ page }) => {
    await page.goto('/guide/');
    const headings = page.locator('h2:has-text("Avatars & Display Names")');
    await expect(headings).toHaveCount(1);
  });
});
