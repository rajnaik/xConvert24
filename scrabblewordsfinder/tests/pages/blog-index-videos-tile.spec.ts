import { test, expect } from '@playwright/test';

/**
 * Blog Index — Videos Category Tile
 *
 * Tests the new "Videos" navigation tile added to the blog index category grid.
 *
 * File changed: src/pages/blog/index.astro
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Blog Index — Videos Tile — Positive', () => {
  test('Videos tile is visible in the category grid', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    const tile = page.locator('a[href="/blog/how-to-play-scrabble-videos/"]');
    await expect(tile).toBeVisible();
  });

  test('Videos tile has correct icon and label', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    const tile = page.locator('a[href="/blog/how-to-play-scrabble-videos/"]');
    await expect(tile.locator('span').first()).toContainText('🎬');
    await expect(tile.locator('span').last()).toContainText('Videos');
  });

  test('Videos tile has red border styling', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    const tile = page.locator('a[href="/blog/how-to-play-scrabble-videos/"]');
    const classList = await tile.getAttribute('class');
    expect(classList).toContain('border-red-500/30');
    expect(classList).toContain('bg-red-950/20');
  });

  test('Videos tile href includes trailing slash', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    const tile = page.locator('a[href="/blog/how-to-play-scrabble-videos/"]');
    const href = await tile.getAttribute('href');
    expect(href).toBe('/blog/how-to-play-scrabble-videos/');
  });
});

test.describe('Blog Index — Videos Tile — Negative', () => {
  test('no duplicate Videos tiles in grid', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    const tiles = page.locator('a[href="/blog/how-to-play-scrabble-videos/"]');
    await expect(tiles).toHaveCount(1);
  });

  test('Videos tile does not have broken link text (no empty label)', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    const tile = page.locator('a[href="/blog/how-to-play-scrabble-videos/"]');
    const label = tile.locator('span.text-xs');
    const text = await label.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });
});
