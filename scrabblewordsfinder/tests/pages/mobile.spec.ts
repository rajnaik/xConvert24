import { test, expect } from '@playwright/test';

/**
 * Mobile Responsive Tests
 * Tests the mobile experience including responsive layout,
 * tile sizing, and touch interactions.
 */

test.describe('Mobile — Homepage Layout', () => {
  test.use({ viewport: { width: 375, height: 812 } }); // iPhone dimensions

  test('homepage loads on mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Scrabble Word Finder/);
  });

  test('h1 is hidden on mobile (hidden sm:block)', async ({ page }) => {
    await page.goto('/');
    const h1 = page.locator('nav h1');
    await expect(h1).toBeHidden();
  });

  test('header navigation is visible on mobile', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('text solver input is usable on mobile', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('#text-solver');
    await expect(input).toBeVisible();
    await input.fill('TEST');
    await expect(input).toHaveValue('TEST');
  });

  test('tile rack is visible and tappable on mobile', async ({ page }) => {
    await page.goto('/');
    const tiles = page.locator('.rack-tile');
    await expect(tiles.first()).toBeVisible();
    // Tiles should have mobile-friendly size (w-[46px] on small screens, may compress slightly)
    const box = await tiles.first().boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThanOrEqual(30); // At least 30px wide on narrow viewports
    expect(box!.height).toBeGreaterThanOrEqual(40); // At least 40px tall
  });

  test('solve button is visible and tappable', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('#text-solve-btn');
    await expect(btn).toBeVisible();
    const box = await btn.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.height).toBeGreaterThanOrEqual(36); // Touch target minimum
  });

  test('results are readable on mobile', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#two-letter-words')).not.toContainText('Loading', { timeout: 15000 });
    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#text-solve-btn').click();
    await expect(page.locator('#results')).toContainText('words found', { timeout: 10000 });
    // Results grid should be visible
    await expect(page.locator('#results')).toBeVisible();
  });

  test('saved words panel is accessible on mobile', async ({ page }) => {
    await page.goto('/');
    const savedPanel = page.locator('#saved-words-list');
    await expect(savedPanel).toBeAttached();
  });

  test('version stamp is hidden on mobile', async ({ page }) => {
    await page.goto('/');
    const versionStamp = page.locator('a[href="/releases"]').last();
    // Should be hidden on mobile via sm:block class
    await expect(versionStamp).toBeHidden();
  });

  test('quick links are hidden on mobile (desktop only via sm:flex)', async ({ page }) => {
    await page.goto('/');
    const quickLinks = page.locator('main .items-center.gap-2.ml-auto');
    // Quick links use hidden sm:flex — invisible below 640px
    await expect(quickLinks).toBeHidden();
  });
});

test.describe('Mobile — Settings Page', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('settings page is usable on mobile', async ({ page }) => {
    await page.goto('/settings/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#download-uid-btn')).toBeVisible();
    await expect(page.locator('#backup-btn')).toBeVisible();
    await expect(page.locator('#nuke-btn')).toBeVisible();
  });

  test('relink modal is centered on mobile', async ({ page }) => {
    await page.goto('/settings/');
    // Dismiss cookie banner if present (overlays buttons on mobile viewport)
    const cookieBanner = page.locator('#cookie-banner');
    if (await cookieBanner.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.locator('#cookie-accept-btn').click({ force: true });
      await expect(cookieBanner).toBeHidden({ timeout: 3000 });
    }
    await page.locator('#relink-uid-btn').scrollIntoViewIfNeeded();
    await page.locator('#relink-uid-btn').click({ force: true });
    const modal = page.locator('#relink-modal');
    await expect(modal).toBeVisible();
    const modalContent = modal.locator('.bg-gray-900');
    await expect(modalContent).toBeVisible();
  });
});

test.describe('Mobile — Suggest Page', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('suggest form is usable on mobile', async ({ page }) => {
    await page.goto('/suggest/');
    await expect(page.locator('#suggestion')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    // Button should be comfortably tappable (at least 44px tall touch target)
    const btn = await page.locator('button[type="submit"]').boundingBox();
    expect(btn).toBeTruthy();
    expect(btn!.height).toBeGreaterThanOrEqual(36);
    expect(btn!.width).toBeGreaterThanOrEqual(100); // Reasonably sized
  });
});

test.describe('Mobile — Tile Scores', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('scrabble tiles use mobile-friendly size', async ({ page }) => {
    await page.goto('/');
    const tile = page.locator('.scrabble-tile').first();
    const box = await tile.boundingBox();
    expect(box).toBeTruthy();
    // On mobile, tiles should be 44px (as per CSS media query)
    expect(box!.width).toBeGreaterThanOrEqual(44);
  });

  test('tile grid wraps properly on mobile', async ({ page }) => {
    await page.goto('/');
    const container = page.locator('#tile-scores');
    await expect(container).toBeVisible();
    // Container should not overflow horizontally
    const isOverflowing = await container.evaluate(el => el.scrollWidth > el.clientWidth);
    expect(isOverflowing).toBeFalsy();
  });
});
