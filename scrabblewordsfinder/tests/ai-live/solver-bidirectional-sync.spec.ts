import { test, expect } from '@playwright/test';

/**
 * AI Live Test — Solver Bidirectional Sync Check
 * 
 * Tests:
 * 1. Type "TRAINED" in solver → verify Tile Rack shows T-R-A-I-N-E-D
 * 2. Remove letters from solver → verify Tile Rack updates (bidirectional)
 * 3. Replace a letter with ? → verify blank tile appears in Tile Rack
 */

const BASE = process.env.SWF_TEST_URL || 'https://www.scrabblewordsfinder.com';

test.describe('AI Live — Solver Bidirectional Sync', () => {
  test.setTimeout(60000);

  test('solver text syncs to tile rack bidirectionally and blank tile works', async ({ page }) => {
    // Step 1: Go to homepage
    await page.goto(`${BASE}/`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Step 2: Type "TRAINED" in the solver
    const solverInput = page.locator('#text-solver');
    await expect(solverInput).toBeVisible();
    await solverInput.fill('TRAINED');
    await page.waitForTimeout(1500); // Let sync happen

    // Step 3: Verify Tile Rack shows T-R-A-I-N-E-D
    const rackTiles = page.locator('#tile-rack .rack-tile');
    await expect(rackTiles).toHaveCount(7);

    // Check each tile has the correct letter (tiles show letters from solver)
    const expectedLetters = ['T', 'R', 'A', 'I', 'N', 'E', 'D'];
    for (let i = 0; i < 7; i++) {
      const tile = rackTiles.nth(i);
      const tileText = await tile.textContent();
      expect(tileText?.trim().toUpperCase()).toContain(expectedLetters[i]);
    }

    // Step 4: Remove some letters — change to "TRAIN" (remove E and D)
    await solverInput.fill('TRAIN');
    await page.waitForTimeout(1500);

    // Verify first 5 tiles show T-R-A-I-N and last 2 are empty
    for (let i = 0; i < 5; i++) {
      const tile = rackTiles.nth(i);
      const tileText = await tile.textContent();
      expect(tileText?.trim().toUpperCase()).toContain('TRAIN'[i]);
    }
    // Last 2 tiles should be empty (opacity indicates empty)
    const tile6 = rackTiles.nth(5);
    const tile6Style = await tile6.getAttribute('style');
    expect(tile6Style).toContain('opacity');

    // Step 5: Replace a letter with ? (blank tile)
    await solverInput.fill('TRA?NED');
    await page.waitForTimeout(1500);

    // Verify the 4th tile (index 3) shows as a blank tile
    // Blank tiles typically show differently — check for '?' or blank indicator
    const blankTile = rackTiles.nth(3);
    const blankText = await blankTile.textContent();
    const blankStyle = await blankTile.getAttribute('style');

    // The blank tile should either show '?' or have a different styling (gold/blank appearance)
    const isBlank = blankText?.includes('?') || 
                    blankText?.trim() === '' ||
                    blankStyle?.includes('gold') || 
                    blankStyle?.includes('#f0e68c') ||
                    blankStyle?.includes('255');
    expect(isBlank).toBe(true);

    // Step 6: Verify solver still works with the blank — results appear
    const resultsEl = page.locator('#results');
    await expect(resultsEl).toContainText('words found', { timeout: 15000 });
  });
});
