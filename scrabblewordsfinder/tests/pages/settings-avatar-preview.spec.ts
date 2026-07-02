import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

/**
 * Settings Page — Dynamic Avatar Preview
 * Tests the new avatar preview card at the top of the Avatar & Display Name section.
 * Added July 2, 2026 after settings.astro gained a live preview with image, name, and Change button.
 */

test.describe('Settings — Avatar Preview — Positive', () => {
  test('avatar preview container is visible', async ({ page }) => {
    await page.goto(`${BASE}/settings/`);
    const preview = page.locator('#settings-avatar-preview');
    await expect(preview).toBeVisible();
  });

  test('avatar image element exists with correct alt text', async ({ page }) => {
    await page.goto(`${BASE}/settings/`);
    const img = page.locator('#settings-avatar-img');
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('alt', 'Your current avatar');
  });

  test('avatar image has a valid src pointing to an SVG', async ({ page }) => {
    await page.goto(`${BASE}/settings/`);
    const img = page.locator('#settings-avatar-img');
    const src = await img.getAttribute('src');
    expect(src).toMatch(/\/avatars\/avatar-\d+\.svg/);
  });

  test('avatar image has rounded styling', async ({ page }) => {
    await page.goto(`${BASE}/settings/`);
    const img = page.locator('#settings-avatar-img');
    await expect(img).toHaveClass(/rounded-full/);
  });

  test('display name element exists', async ({ page }) => {
    await page.goto(`${BASE}/settings/`);
    const name = page.locator('#settings-avatar-name');
    await expect(name).toBeVisible();
    const text = await name.textContent();
    expect(text).toBeTruthy();
  });

  test('avatar animal/description element exists', async ({ page }) => {
    await page.goto(`${BASE}/settings/`);
    const animal = page.locator('#settings-avatar-animal');
    await expect(animal).toBeVisible();
    const text = await animal.textContent();
    expect(text).toMatch(/Avatar #\d+/);
  });

  test('Change button links to /avatar-swap/', async ({ page }) => {
    await page.goto(`${BASE}/settings/`);
    const changeBtn = page.locator('#settings-avatar-preview a[href="/avatar-swap/"]');
    await expect(changeBtn).toBeVisible();
    await expect(changeBtn).toContainText('Change');
  });

  test('Change button has correct teal styling', async ({ page }) => {
    await page.goto(`${BASE}/settings/`);
    const changeBtn = page.locator('#settings-avatar-preview a[href="/avatar-swap/"]');
    await expect(changeBtn).toHaveClass(/text-teal-300/);
    await expect(changeBtn).toHaveClass(/bg-teal-900/);
  });

  test('preview container has dark background with teal border', async ({ page }) => {
    await page.goto(`${BASE}/settings/`);
    const preview = page.locator('#settings-avatar-preview');
    await expect(preview).toHaveClass(/bg-gray-900/);
    await expect(preview).toHaveClass(/border-teal-700/);
  });

  test('avatar preview appears before the description paragraph', async ({ page }) => {
    await page.goto(`${BASE}/settings/`);
    // Preview should come before the "Choose an avatar..." paragraph
    const previewBox = page.locator('#settings-avatar-preview');
    const descP = page.locator('text=Choose an avatar and display name');
    const previewBounds = await previewBox.boundingBox();
    const descBounds = await descP.boundingBox();
    expect(previewBounds).not.toBeNull();
    expect(descBounds).not.toBeNull();
    expect(previewBounds!.y).toBeLessThan(descBounds!.y);
  });
});

test.describe('Settings — Avatar Preview — Negative', () => {
  test('no duplicate avatar preview containers', async ({ page }) => {
    await page.goto(`${BASE}/settings/`);
    const previews = page.locator('#settings-avatar-preview');
    await expect(previews).toHaveCount(1);
  });

  test('no duplicate avatar images in the preview', async ({ page }) => {
    await page.goto(`${BASE}/settings/`);
    const imgs = page.locator('#settings-avatar-img');
    await expect(imgs).toHaveCount(1);
  });

  test('avatar preview does not cause console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/settings/`);
    await page.waitForTimeout(1500);
    const relevantErrors = errors.filter(e =>
      e.toLowerCase().includes('avatar') || e.toLowerCase().includes('settings-avatar')
    );
    expect(relevantErrors).toHaveLength(0);
  });

  test('avatar image does not return 404', async ({ page }) => {
    await page.goto(`${BASE}/settings/`);
    const img = page.locator('#settings-avatar-img');
    const src = await img.getAttribute('src');
    if (src) {
      const response = await page.request.get(`${BASE}${src}`);
      expect(response.status()).not.toBe(404);
    }
  });

  test('avatar preview renders correctly after page reload', async ({ page }) => {
    await page.goto(`${BASE}/settings/`);
    await page.reload();
    const preview = page.locator('#settings-avatar-preview');
    await expect(preview).toBeVisible();
    const img = page.locator('#settings-avatar-img');
    await expect(img).toBeVisible();
    const name = page.locator('#settings-avatar-name');
    await expect(name).toBeVisible();
  });

  test('Change button in preview does not duplicate the bottom link', async ({ page }) => {
    await page.goto(`${BASE}/settings/`);
    // There should be exactly 2 avatar-swap links: one in preview, one in the bullet list
    const allLinks = page.locator('a[href="/avatar-swap/"]');
    const count = await allLinks.count();
    expect(count).toBe(2);
  });
});
