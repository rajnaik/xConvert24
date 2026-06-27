import { test, expect, Page } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

/** Helper: fill solver and wait for rack to update (sync is immediate, no debounce) */
async function fillAndSync(page: Page, text: string) {
  await page.locator('#text-solver').fill(text);
  if (text.length > 0) {
    // Wait until first rack tile has content (sync is synchronous on input event)
    await expect(page.locator('#tile-rack .rack-tile').first()).not.toHaveText('', { timeout: 2000 });
  }
}

test.describe('Quick Tests — Solver: Bidirectional Sync — Positive', () => {

  test('typing in text-solver updates tile rack with matching letters', async ({ page }) => {
    await page.goto(BASE + '/');
    await fillAndSync(page, 'HELLO');
    const rackTiles = page.locator('#tile-rack .rack-tile');
    await expect(rackTiles.nth(0)).toContainText('H');
    await expect(rackTiles.nth(1)).toContainText('E');
    await expect(rackTiles.nth(2)).toContainText('L');
    await expect(rackTiles.nth(3)).toContainText('L');
    await expect(rackTiles.nth(4)).toContainText('O');
  });

  test('tile rack shows only first 7 letters when more are entered', async ({ page }) => {
    await page.goto(BASE + '/');
    await fillAndSync(page, 'ABCDEFGHIJ');
    const rackTiles = page.locator('#tile-rack .rack-tile');
    await expect(rackTiles.nth(0)).toContainText('A');
    await expect(rackTiles.nth(6)).toContainText('G');
    expect(await rackTiles.count()).toBe(7);
  });

  test('hidden #tiles input syncs with text-solver value', async ({ page }) => {
    await page.goto(BASE + '/');
    await fillAndSync(page, 'QUARTZ');
    expect(await page.locator('#tiles').inputValue()).toBe('QUARTZ');
  });

  test('entering ? in solver shows star tile (★) with score 0', async ({ page }) => {
    await page.goto(BASE + '/');
    await fillAndSync(page, 'AB?DE');
    const tile2 = page.locator('#tile-rack .rack-tile').nth(2);
    await expect(tile2).toContainText('★');
    await expect(tile2).toContainText('0');
  });

  test('clearing text-solver empties all rack tiles', async ({ page }) => {
    await page.goto(BASE + '/');
    await fillAndSync(page, 'TEST');
    await page.locator('#text-solver').fill('');
    // Wait for tiles to go empty (opacity change)
    await page.waitForTimeout(100);
    const rackTiles = page.locator('#tile-rack .rack-tile');
    for (let i = 0; i < 7; i++) {
      expect((await rackTiles.nth(i).textContent())?.trim()).toBe('');
    }
  });

  test('text-solver auto-uppercases input', async ({ page }) => {
    await page.goto(BASE + '/');
    await page.locator('#text-solver').fill('hello');
    expect(await page.locator('#text-solver').inputValue()).toBe('HELLO');
  });
});

test.describe('Quick Tests — Solver: Bidirectional Sync — Negative', () => {

  test('no console errors when typing in solver', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(BASE + '/');
    await page.locator('#text-solver').fill('XYZ?QJ');
    await page.waitForTimeout(200);
    expect(errors.filter(e => !e.includes('adsbygoogle'))).toHaveLength(0);
  });

  test('rack tiles do not exceed 7 even with max input', async ({ page }) => {
    await page.goto(BASE + '/');
    await fillAndSync(page, 'ABCDEFGHIJKLMNO');
    expect(await page.locator('#tile-rack .rack-tile').count()).toBe(7);
  });

  test('empty solver input does not crash or show undefined', async ({ page }) => {
    await page.goto(BASE + '/');
    await page.locator('#text-solver').fill('');
    await page.waitForTimeout(100);
    const rackTiles = page.locator('#tile-rack .rack-tile');
    for (let i = 0; i < 7; i++) {
      const text = await rackTiles.nth(i).textContent();
      expect(text).not.toContain('undefined');
      expect(text).not.toContain('NaN');
    }
  });
});
