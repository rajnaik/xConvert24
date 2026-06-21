import { test, expect } from '@playwright/test';

const PAGE = '/blog/what-is-scrabble/';

test.describe('What Is Scrabble — Tile Distribution Grid — Positive', () => {

  test('tile distribution section is visible on page', async ({ page }) => {
    await page.goto(PAGE);
    const section = page.locator('text=Tile Distribution — 100 Tiles in the Bag');
    await expect(section).toBeVisible();
  });

  test('tile distribution section has id="tile-distribution"', async ({ page }) => {
    await page.goto(PAGE);
    const section = page.locator('#tile-distribution');
    await expect(section).toBeVisible();
  });

  test('grid contains exactly 27 tile cells (A-Z + blank)', async ({ page }) => {
    await page.goto(PAGE);
    const grid = page.locator('#tile-distribution .scrabble-tiles');
    const tileCells = grid.locator('.scrabble-tile');
    await expect(tileCells).toHaveCount(27);
  });

  test('displays all 26 letters A through Z', async ({ page }) => {
    await page.goto(PAGE);
    const grid = page.locator('#tile-distribution .scrabble-tiles');
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (const letter of letters) {
      await expect(grid.locator(`.tile-letter:text-is("${letter}")`)).toBeVisible();
    }
  });

  test('shows blank tile represented by filled star symbol', async ({ page }) => {
    await page.goto(PAGE);
    const grid = page.locator('#tile-distribution .scrabble-tiles');
    const blankTile = grid.locator('.blank-tile');
    await expect(blankTile).toBeVisible();
    await expect(blankTile.locator('.tile-letter')).toContainText('★');
  });

  test('each tile cell shows score and count', async ({ page }) => {
    await page.goto(PAGE);
    const grid = page.locator('#tile-distribution .scrabble-tiles');
    // Check known tiles: E (score 1, ×12), Q (score 10, ×1), Z (score 10, ×1)
    const eCell = grid.locator('.scrabble-tile').filter({ has: page.locator('.tile-letter:text-is("E")') });
    await expect(eCell.locator('.tile-score')).toHaveText('1');
    await expect(eCell.locator('.tile-count')).toHaveText('×12');

    const qCell = grid.locator('.scrabble-tile').filter({ has: page.locator('.tile-letter:text-is("Q")') });
    await expect(qCell.locator('.tile-score')).toHaveText('10');
    await expect(qCell.locator('.tile-count')).toHaveText('×1');
  });

  test('blank tile has score of 0 and count of 2', async ({ page }) => {
    await page.goto(PAGE);
    const blankTile = page.locator('#tile-distribution .blank-tile');
    await expect(blankTile.locator('.tile-score')).toHaveText('0');
    await expect(blankTile.locator('.tile-count')).toHaveText('×2');
  });

  test('footer note mentions 100 tiles total', async ({ page }) => {
    await page.goto(PAGE);
    const section = page.locator('#tile-distribution');
    await expect(section.locator('p.text-xs')).toContainText('100 tiles total');
  });

  test('grid uses responsive columns and scrabble-tiles class', async ({ page }) => {
    await page.goto(PAGE);
    const grid = page.locator('#tile-distribution .scrabble-tiles');
    const gridClass = await grid.getAttribute('class');
    expect(gridClass).toContain('grid-cols-7');
    expect(gridClass).toContain('sm:grid-cols-9');
    expect(gridClass).toContain('scrabble-tiles');
  });
});

test.describe('What Is Scrabble — Tile Distribution Grid — Negative', () => {

  test('no duplicate tile distribution sections on page', async ({ page }) => {
    await page.goto(PAGE);
    const tileSections = page.locator('#tile-distribution');
    await expect(tileSections).toHaveCount(1);
  });

  test('no tile cell has empty letter display', async ({ page }) => {
    await page.goto(PAGE);
    const letters = page.locator('#tile-distribution .scrabble-tiles .tile-letter');
    const count = await letters.count();
    expect(count).toBe(27);
    for (let i = 0; i < count; i++) {
      const text = await letters.nth(i).textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('no tile cell has missing count indicator', async ({ page }) => {
    await page.goto(PAGE);
    const counts = page.locator('#tile-distribution .scrabble-tiles .tile-count');
    const count = await counts.count();
    expect(count).toBe(27);
    for (let i = 0; i < count; i++) {
      const text = await counts.nth(i).textContent();
      expect(text).toMatch(/×\d+/);
    }
  });

  test('no tile cell has missing score value', async ({ page }) => {
    await page.goto(PAGE);
    const scores = page.locator('#tile-distribution .scrabble-tiles .tile-score');
    const count = await scores.count();
    expect(count).toBe(27);
    for (let i = 0; i < count; i++) {
      const text = await scores.nth(i).textContent();
      expect(text).toMatch(/\d+/);
    }
  });

  test('no duplicate letters in the tile grid', async ({ page }) => {
    await page.goto(PAGE);
    const letters = page.locator('#tile-distribution .scrabble-tiles .tile-letter');
    const count = await letters.count();
    const seen = new Set<string>();
    for (let i = 0; i < count; i++) {
      const text = (await letters.nth(i).textContent())?.trim() ?? '';
      expect(seen.has(text)).toBe(false);
      seen.add(text);
    }
  });

  test('no console errors from tile distribution rendering', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });
});
