import { test, expect } from '@playwright/test';

/**
 * Tile Scores Display & Highlighting Tests
 * Tests the visual scrabble tiles section, hover effects,
 * and tile highlighting when words are clicked.
 */

test.describe('Tile Scores Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays all 26 letter tiles', async ({ page }) => {
    const tiles = page.locator('#tile-scores .scrabble-tile');
    await expect(tiles).toHaveCount(26);
  });

  test('each tile shows letter and point value', async ({ page }) => {
    // Check a specific tile — Q should show 10
    const qTile = page.locator('#tile-scores .scrabble-tile[data-letter="Q"]');
    await expect(qTile).toContainText('Q');
    await expect(qTile).toContainText('10');
  });

  test('A tile shows score 1', async ({ page }) => {
    const aTile = page.locator('#tile-scores .scrabble-tile[data-letter="A"]');
    await expect(aTile).toContainText('1');
  });

  test('Z tile shows score 10', async ({ page }) => {
    const zTile = page.locator('#tile-scores .scrabble-tile[data-letter="Z"]');
    await expect(zTile).toContainText('10');
  });
});

test.describe('Tile Highlighting on Word Click', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#two-letter-words')).not.toContainText('Loading', { timeout: 15000 });
  });

  test('clicking a result word highlights used tiles', async ({ page }) => {
    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#text-solve-btn').click();
    await expect(page.locator('#results')).toContainText('words found');

    // Click a word
    const firstWord = page.locator('#results [data-achieve-word]').first();
    const wordText = await firstWord.getAttribute('data-achieve-word') || '';
    await firstWord.click();

    // Check that at least one tile is highlighted
    const highlightedTiles = page.locator('.scrabble-tile.tile-highlighted');
    const count = await highlightedTiles.count();
    expect(count).toBeGreaterThan(0);
  });

  test('tile scores heading updates with word score', async ({ page }) => {
    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#text-solve-btn').click();
    await expect(page.locator('#results')).toContainText('words found');

    await page.locator('#results [data-achieve-word]').first().click();

    const heading = page.locator('#tile-scores-heading');
    await expect(heading).toContainText('pts');
  });

  test('highlighted tiles have outline style', async ({ page }) => {
    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#text-solve-btn').click();
    await expect(page.locator('#results')).toContainText('words found');

    await page.locator('#results [data-achieve-word]').first().click();

    const highlightedTile = page.locator('.scrabble-tile.tile-highlighted').first();
    const outline = await highlightedTile.evaluate(el => el.style.outline);
    expect(outline).toContain('solid');
  });
});

test.describe('Reference Panels', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#two-letter-words')).not.toContainText('Loading', { timeout: 15000 });
  });

  test('two-letter words panel is populated', async ({ page }) => {
    const panel = page.locator('#two-letter-words');
    await expect(panel).toContainText('words total');
    const words = panel.locator('[data-achieve-word]');
    const count = await words.count();
    expect(count).toBeGreaterThan(50); // SOWPODS has 100+ two-letter words
  });

  test('three-letter words panel shows top 30', async ({ page }) => {
    const panel = page.locator('#three-letter-words');
    await expect(panel).toContainText('Top 30');
    const words = panel.locator('[data-achieve-word]');
    const count = await words.count();
    expect(count).toBe(30);
  });

  test('Q without U panel is populated', async ({ page }) => {
    const panel = page.locator('#q-without-u');
    const words = panel.locator('[data-achieve-word]');
    const count = await words.count();
    expect(count).toBeGreaterThan(0);
  });

  test('rare letter tabs switch content', async ({ page }) => {
    // Default is Q
    const results = page.locator('#rare-letter-results');
    await expect(results).toContainText('Q');

    // Switch to Z
    await page.locator('.rare-tab[data-rare="z"]').click();
    await expect(results).toContainText('"Z"');

    // Switch to X
    await page.locator('.rare-tab[data-rare="x"]').click();
    await expect(results).toContainText('"X"');

    // Switch to J
    await page.locator('.rare-tab[data-rare="j"]').click();
    await expect(results).toContainText('"J"');
  });

  test('rare letter tabs show top 40 words', async ({ page }) => {
    await page.locator('.rare-tab[data-rare="z"]').click();
    await page.waitForTimeout(300);
    const results = page.locator('#rare-letter-results');
    await expect(results).toContainText('Top 40');
  });

  test('active tab has distinct styling', async ({ page }) => {
    const qTab = page.locator('.rare-tab[data-rare="q"]');
    await expect(qTab).toHaveClass(/purple/); // Default active tab
    const zTab = page.locator('.rare-tab[data-rare="z"]');
    await zTab.click();
    await expect(zTab).toHaveClass(/red/);
  });
});

test.describe('Quick Nav Icons', () => {
  test('quick nav links point to correct sections', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="#section-probability"]')).toBeAttached();
    await expect(page.locator('a[href="#section-rack-leave"]')).toBeAttached();
    await expect(page.locator('a[href="#section-best-opening"]')).toBeAttached();
  });

  test('clicking quick nav scrolls to section', async ({ page }) => {
    await page.goto('/');
    await page.locator('a[href="#section-probability"]').click();
    // The section should be in viewport
    const isVisible = await page.locator('#section-probability').isVisible();
    expect(isVisible).toBeTruthy();
  });
});
