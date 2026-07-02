import { test, expect } from '@playwright/test';

/**
 * Welcome Banner — Layout.astro
 *
 * Tests the welcome banner that appears above the Header navigation
 * when a user has an assigned avatar (swf-avatar + swf-display-name in localStorage).
 * - Banner visibility based on localStorage state
 * - Correct avatar image and display name rendering
 * - ? info button toggling the explanation bubble
 * - Bubble close behaviour (button + outside click)
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Welcome Banner — Positive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.evaluate(() => {
      localStorage.setItem('swf-uid', 'pw-test-welcome-banner');
      localStorage.setItem('swf-avatar', '7');
      localStorage.setItem('swf-display-name', 'Cosmic Penguin');
    });
    await page.reload();
  });

  test('welcome banner is visible when avatar is assigned', async ({ page }) => {
    const banner = page.locator('#welcome-banner');
    await expect(banner).toBeVisible();
  });

  test('displays correct avatar image src', async ({ page }) => {
    const avatarImg = page.locator('#welcome-avatar');
    await expect(avatarImg).toBeVisible();
    await expect(avatarImg).toHaveAttribute('src', '/avatars/avatar-7.svg');
  });

  test('displays correct display name', async ({ page }) => {
    const name = page.locator('#welcome-name');
    await expect(name).toHaveText('Cosmic Penguin');
  });

  test('shows welcome message text', async ({ page }) => {
    const banner = page.locator('#welcome-banner');
    await expect(banner).toContainText('Welcome to the world of Scrabble');
  });

  test('? info button is visible', async ({ page }) => {
    const infoBtn = page.locator('#welcome-info-btn');
    await expect(infoBtn).toBeVisible();
    await expect(infoBtn).toHaveText('?');
  });

  test('? button is inline with the welcome name text', async ({ page }) => {
    // After the layout change, the ? button lives inside the same <p> as the welcome text
    const btnInsideParagraph = page.locator('#welcome-banner p:has(#welcome-name) > #welcome-info-btn');
    await expect(btnInsideParagraph).toBeVisible();
  });

  test('? button has accessible aria-label', async ({ page }) => {
    const infoBtn = page.locator('#welcome-info-btn');
    await expect(infoBtn).toHaveAttribute('aria-label', 'How did I get this name and avatar?');
  });

  test('clicking ? button reveals info bubble', async ({ page }) => {
    const bubble = page.locator('#welcome-info-bubble');
    await expect(bubble).toBeHidden();

    await page.locator('#welcome-info-btn').click();
    await expect(bubble).toBeVisible();
  });

  test('info bubble explains name assignment', async ({ page }) => {
    await page.locator('#welcome-info-btn').click();
    const bubble = page.locator('#welcome-info-bubble');
    await expect(bubble).toContainText('avatar and name were assigned automatically');
    await expect(bubble).toContainText('random animal avatar');
    await expect(bubble).toContainText('random adjective');
  });

  test('Got it button closes the bubble', async ({ page }) => {
    await page.locator('#welcome-info-btn').click();
    const bubble = page.locator('#welcome-info-bubble');
    await expect(bubble).toBeVisible();

    await page.locator('#welcome-info-close').click();
    await expect(bubble).toBeHidden();
  });

  test('clicking outside closes the bubble', async ({ page }) => {
    await page.locator('#welcome-info-btn').click();
    const bubble = page.locator('#welcome-info-bubble');
    await expect(bubble).toBeVisible();

    // Click on the body outside the bubble
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await expect(bubble).toBeHidden();
  });

  test('banner appears above the Header navigation', async ({ page }) => {
    const banner = page.locator('#welcome-banner');
    const header = page.locator('header.mx-auto').first();

    const bannerBox = await banner.boundingBox();
    const headerBox = await header.boundingBox();

    expect(bannerBox).not.toBeNull();
    expect(headerBox).not.toBeNull();
    expect(bannerBox!.y).toBeLessThan(headerBox!.y);
  });

  test('banner has compact top padding (5px)', async ({ page }) => {
    const banner = page.locator('#welcome-banner');
    const paddingTop = await banner.evaluate(el => getComputedStyle(el).paddingTop);
    expect(paddingTop).toBe('5px');
  });
});

test.describe('Welcome Banner — Negative', () => {
  test('banner is hidden when no avatar is set', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.evaluate(() => {
      localStorage.removeItem('swf-avatar');
      localStorage.removeItem('swf-display-name');
    });
    await page.reload();

    const banner = page.locator('#welcome-banner');
    await expect(banner).toBeHidden();
  });

  test('banner is hidden when only avatar is set (no display name)', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.evaluate(() => {
      localStorage.setItem('swf-avatar', '3');
      localStorage.removeItem('swf-display-name');
    });
    await page.reload();

    const banner = page.locator('#welcome-banner');
    await expect(banner).toBeHidden();
  });

  test('banner is hidden when only display name is set (no avatar)', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.evaluate(() => {
      localStorage.removeItem('swf-avatar');
      localStorage.setItem('swf-display-name', 'Lonely Player');
    });
    await page.reload();

    const banner = page.locator('#welcome-banner');
    await expect(banner).toBeHidden();
  });

  test('banner does not appear on admin pages', async ({ page }) => {
    await page.goto(`${BASE}/admin/`);
    await page.evaluate(() => {
      localStorage.setItem('swf-avatar', '5');
      localStorage.setItem('swf-display-name', 'Admin User');
    });
    await page.reload();

    const banner = page.locator('#welcome-banner');
    await expect(banner).toHaveCount(0);
  });

  test('no duplicate welcome banners on page', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.evaluate(() => {
      localStorage.setItem('swf-avatar', '12');
      localStorage.setItem('swf-display-name', 'Azure Dolphin');
    });
    await page.reload();

    const banners = page.locator('#welcome-banner');
    await expect(banners).toHaveCount(1);
  });

  test('welcome banner does not cause page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(`${BASE}/`);
    await page.evaluate(() => {
      localStorage.setItem('swf-avatar', '25');
      localStorage.setItem('swf-display-name', 'Bold Flamingo');
    });
    await page.reload();
    await page.waitForTimeout(1000);

    expect(errors.filter(e => e.toLowerCase().includes('welcome') || e.toLowerCase().includes('avatar'))).toHaveLength(0);
  });

  test('info bubble starts hidden and does not auto-open', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.evaluate(() => {
      localStorage.setItem('swf-avatar', '10');
      localStorage.setItem('swf-display-name', 'Silver Tiger');
    });
    await page.reload();

    const bubble = page.locator('#welcome-info-bubble');
    await expect(bubble).toBeHidden();
  });
});
