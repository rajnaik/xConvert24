import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

const EXPECTED_TILES = [
  { href: '/blog/word-of-the-day-archive/', label: 'WOTD Archive', emoji: '📅' },
  { href: '/blog/tournament/', label: 'Tournament', emoji: '🏆' },
  { href: '/blog/strategy/', label: 'Strategy', emoji: '🧠' },
  { href: '/blog/high-scoring-words/', label: 'High Scores', emoji: '💎' },
  { href: '/blog/bingos/', label: 'Bingos', emoji: '🎯' },
  { href: '/blog/dictionaries/', label: 'Dictionaries', emoji: '📚' },
];

// ── Quick Link Tiles — Positive ──────────────────────────────────

test.describe('Quick Link Tiles — Positive', () => {
  test('quick-link-tiles container is visible on activities page', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#quick-link-tiles')).toBeVisible();
  });

  test('Explore More heading is displayed', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const heading = page.locator('h2', { hasText: 'Explore More' });
    await expect(heading).toBeVisible();
  });

  test('all 6 quick link tiles are rendered', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const tiles = page.locator('#quick-link-tiles > a');
    await expect(tiles).toHaveCount(6);
  });

  test('each tile links to the correct href', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    for (const tile of EXPECTED_TILES) {
      const link = page.locator(`#quick-link-tiles a[href="${tile.href}"]`);
      await expect(link).toBeAttached();
    }
  });

  test('each tile displays its label text', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    for (const tile of EXPECTED_TILES) {
      const link = page.locator(`#quick-link-tiles a[href="${tile.href}"]`);
      await expect(link).toContainText(tile.label);
    }
  });

  test('each tile displays its emoji icon', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    for (const tile of EXPECTED_TILES) {
      const link = page.locator(`#quick-link-tiles a[href="${tile.href}"]`);
      await expect(link).toContainText(tile.emoji);
    }
  });

  test('tiles are inside a responsive grid layout', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const grid = page.locator('#quick-link-tiles');
    const classAttr = await grid.getAttribute('class');
    expect(classAttr).toContain('grid');
    expect(classAttr).toContain('grid-cols-3');
  });
});

// ── Quick Link Tiles — Negative ──────────────────────────────────

test.describe('Quick Link Tiles — Negative', () => {
  test('no duplicate quick-link-tiles containers exist', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const count = await page.locator('#quick-link-tiles').count();
    expect(count).toBe(1);
  });

  test('no duplicate tile links within the container', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const hrefs: string[] = [];
    const tiles = page.locator('#quick-link-tiles > a');
    const count = await tiles.count();
    for (let i = 0; i < count; i++) {
      const href = await tiles.nth(i).getAttribute('href');
      hrefs.push(href || '');
    }
    const unique = new Set(hrefs);
    expect(unique.size).toBe(hrefs.length);
  });

  test('no tile has an empty href', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const tiles = page.locator('#quick-link-tiles > a');
    const count = await tiles.count();
    for (let i = 0; i < count; i++) {
      const href = await tiles.nth(i).getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).not.toBe('#');
    }
  });

  test('no JavaScript errors when quick link tiles render', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#quick-link-tiles');

    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('tiles do not link to external URLs', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const tiles = page.locator('#quick-link-tiles > a');
    const count = await tiles.count();
    for (let i = 0; i < count; i++) {
      const href = await tiles.nth(i).getAttribute('href');
      expect(href).toMatch(/^\//); // all internal paths start with /
    }
  });

  test('stats tile is not rendered (replaced by dictionaries)', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const statsTile = page.locator('#quick-link-tiles a[href="/stats/"]');
    await expect(statsTile).toHaveCount(0);
  });

  test('dictionaries tile links to /blog/dictionaries/', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const dictTile = page.locator('#quick-link-tiles a[href="/blog/dictionaries/"]');
    await expect(dictTile).toBeVisible();
    await expect(dictTile).toContainText('Dictionaries');
  });

  test('stats header link is not rendered (removed)', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const statsHeaderLink = page.locator('a[href="/stats/"]');
    await expect(statsHeaderLink).toHaveCount(0);
  });
});
