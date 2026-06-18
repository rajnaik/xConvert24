import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'https://www.scrabblewordsfinder.com';

test.describe('Tile Rack — Positive', () => {
  test('typing in text input shows tiles on rack', async ({ page }) => {
    await page.goto(`${BASE_URL}/tools/scrabble`);
    await page.fill('#tiles', 'HELLO');
    const rackTiles = page.locator('#rack-tiles .rack-tile');
    await expect(rackTiles).toHaveCount(5);
  });

  test('rack shows correct letters matching input', async ({ page }) => {
    await page.goto(`${BASE_URL}/tools/scrabble`);
    await page.fill('#tiles', 'CAT');
    const tiles = page.locator('#rack-tiles .rack-tile');
    await expect(tiles.nth(0)).toHaveAttribute('data-letter', 'C');
    await expect(tiles.nth(1)).toHaveAttribute('data-letter', 'A');
    await expect(tiles.nth(2)).toHaveAttribute('data-letter', 'T');
  });

  test('clicking a rack tile removes it from text input', async ({ page }) => {
    await page.goto(`${BASE_URL}/tools/scrabble`);
    await page.fill('#tiles', 'HELLO');
    // Click the first tile (H)
    await page.locator('#rack-tiles .rack-tile').first().click();
    const input = page.locator('#tiles');
    await expect(input).toHaveValue('ELLO');
  });

  test('rack shows max 7 tiles even with longer input', async ({ page }) => {
    await page.goto(`${BASE_URL}/tools/scrabble`);
    await page.fill('#tiles', 'ABCDEFGHIJ');
    const rackTiles = page.locator('#rack-tiles .rack-tile');
    await expect(rackTiles).toHaveCount(7);
  });
});

test.describe('Tile Rack — Negative', () => {
  test('empty input shows 7 empty slots', async ({ page }) => {
    await page.goto(`${BASE_URL}/tools/scrabble`);
    await page.fill('#tiles', '');
    const emptySlots = page.locator('#rack-tiles .rack-slot');
    await expect(emptySlots).toHaveCount(7);
  });

  test('rack tiles have no duplicates when removing middle tile', async ({ page }) => {
    await page.goto(`${BASE_URL}/tools/scrabble`);
    await page.fill('#tiles', 'ABC');
    // Click middle tile (B, index 1)
    await page.locator('#rack-tiles .rack-tile').nth(1).click();
    const input = page.locator('#tiles');
    await expect(input).toHaveValue('AC');
    const tiles = page.locator('#rack-tiles .rack-tile');
    await expect(tiles).toHaveCount(2);
  });
});
