import { test, expect } from '@playwright/test';

/**
 * Tests for the Avatar Usage Count drill-down feature.
 * Clicking an avatar in the usage grid shows user IDs using that avatar.
 */

test.describe('Admin Avatars — Avatar Usage Drill-down — Positive', () => {

  test('avatar usage grid tiles are clickable (have cursor-pointer)', async ({ page }) => {
    await page.goto('/admin/avatars/');
    // Expand the panel first
    await page.click('#avatar-usage-toggle');
    await page.waitForSelector('#avatar-usage-grid [data-avatar-usage-id]', { timeout: 5000 });
    const tile = page.locator('#avatar-usage-grid [data-avatar-usage-id]').first();
    const classes = await tile.getAttribute('class');
    expect(classes).toContain('cursor-pointer');
  });

  test('clicking an avatar tile shows the users panel', async ({ page }) => {
    await page.goto('/admin/avatars/');
    await page.click('#avatar-usage-toggle');
    await page.waitForSelector('#avatar-usage-grid [data-avatar-usage-id]', { timeout: 5000 });
    // Click the first avatar tile
    await page.click('#avatar-usage-grid [data-avatar-usage-id]:first-child');
    const panel = page.locator('#avatar-users-panel');
    await expect(panel).toBeVisible();
  });

  test('users panel shows avatar image and title with count', async ({ page }) => {
    await page.goto('/admin/avatars/');
    await page.click('#avatar-usage-toggle');
    await page.waitForSelector('#avatar-usage-grid [data-avatar-usage-id]', { timeout: 5000 });
    await page.click('#avatar-usage-grid [data-avatar-usage-id]:first-child');
    const img = page.locator('#avatar-users-img');
    await expect(img).toBeVisible();
    const title = page.locator('#avatar-users-title');
    const text = await title.textContent();
    expect(text).toContain('Avatar');
    expect(text).toContain('user');
  });

  test('users panel has a close button', async ({ page }) => {
    await page.goto('/admin/avatars/');
    await page.click('#avatar-usage-toggle');
    await page.waitForSelector('#avatar-usage-grid [data-avatar-usage-id]', { timeout: 5000 });
    await page.click('#avatar-usage-grid [data-avatar-usage-id]:first-child');
    const closeBtn = page.locator('#avatar-users-close');
    await expect(closeBtn).toBeVisible();
  });

  test('each avatar tile has data-avatar-usage-id and data-avatar-count attributes', async ({ page }) => {
    await page.goto('/admin/avatars/');
    await page.click('#avatar-usage-toggle');
    await page.waitForSelector('#avatar-usage-grid [data-avatar-usage-id]', { timeout: 5000 });
    const tiles = await page.locator('#avatar-usage-grid [data-avatar-usage-id]').all();
    expect(tiles.length).toBeGreaterThan(0);
    for (const tile of tiles.slice(0, 5)) {
      const id = await tile.getAttribute('data-avatar-usage-id');
      const count = await tile.getAttribute('data-avatar-count');
      expect(id).toBeTruthy();
      expect(count).not.toBeNull();
    }
  });

  test('hint text mentions clicking avatar to see user IDs', async ({ page }) => {
    await page.goto('/admin/avatars/');
    const toggle = page.locator('#avatar-usage-toggle');
    const text = await toggle.textContent();
    expect(text).toContain('Click an avatar to see user IDs');
  });
});

test.describe('Admin Avatars — Avatar Usage Drill-down — Negative', () => {

  test('users panel is hidden by default', async ({ page }) => {
    await page.goto('/admin/avatars/');
    await page.click('#avatar-usage-toggle');
    const panel = page.locator('#avatar-users-panel');
    await expect(panel).toBeHidden();
  });

  test('close button hides the users panel', async ({ page }) => {
    await page.goto('/admin/avatars/');
    await page.click('#avatar-usage-toggle');
    await page.waitForSelector('#avatar-usage-grid [data-avatar-usage-id]', { timeout: 5000 });
    await page.click('#avatar-usage-grid [data-avatar-usage-id]:first-child');
    await expect(page.locator('#avatar-users-panel')).toBeVisible();
    await page.click('#avatar-users-close');
    await expect(page.locator('#avatar-users-panel')).toBeHidden();
  });

  test('no page errors when clicking avatar tiles', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/admin/avatars/');
    await page.click('#avatar-usage-toggle');
    await page.waitForSelector('#avatar-usage-grid [data-avatar-usage-id]', { timeout: 5000 });
    await page.click('#avatar-usage-grid [data-avatar-usage-id]:first-child');
    await page.waitForTimeout(1000);
    expect(errors.filter(e => e.includes('TypeError') || e.includes('Cannot read'))).toHaveLength(0);
  });

  test('clicking avatar with 0 users shows empty state message', async ({ page }) => {
    await page.goto('/admin/avatars/');
    await page.click('#avatar-usage-toggle');
    await page.waitForSelector('#avatar-usage-grid [data-avatar-usage-id]', { timeout: 5000 });
    // Find a tile with count 0
    const zeroTile = page.locator('#avatar-usage-grid [data-avatar-count="0"]').first();
    const exists = await zeroTile.count();
    if (exists > 0) {
      await zeroTile.click();
      const panel = page.locator('#avatar-users-panel');
      await expect(panel).toBeVisible();
      const listText = await page.locator('#avatar-users-list').textContent();
      expect(listText).toContain('No users');
    }
  });
});
