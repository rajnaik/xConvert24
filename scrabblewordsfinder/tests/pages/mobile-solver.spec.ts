import { test, expect, Page } from '@playwright/test';

/**
 * Mobile Solver Tests
 * Verifies the word solver works correctly on a mobile viewport (Pixel 7).
 * Converted from quick/solver tests to catch mobile-specific regressions.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

/** Wait for dictionary to finish loading */
async function waitForDict(page: Page) {
  await page.waitForSelector('#high-scoring-panel:not(.hidden)', { timeout: 15000 });
}

/** Fill solver and wait for results */
async function solveAndWait(page: Page, tiles: string) {
  await page.locator('#text-solver').fill(tiles);
  await page.waitForSelector('#results [data-achieve-word]', { timeout: 8000 });
}

test.describe('Mobile Solver — Instant Search — Positive', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('typing tiles produces results on mobile', async ({ page }) => {
    await page.goto(BASE + '/');
    await waitForDict(page);
    await solveAndWait(page, 'CAT');
    await expect(page.locator('#results')).toContainText('words found');
  });

  test('results update when tiles change on mobile', async ({ page }) => {
    await page.goto(BASE + '/');
    await waitForDict(page);
    await solveAndWait(page, 'QUARTZ');
    const first = await page.locator('#results').textContent();
    await page.locator('#clear-text-solver').click();
    await page.waitForTimeout(50);
    await solveAndWait(page, 'HELLO');
    const second = await page.locator('#results').textContent();
    expect(second).not.toBe(first);
  });

  test('word cards show point scores on mobile', async ({ page }) => {
    await page.goto(BASE + '/');
    await waitForDict(page);
    await solveAndWait(page, 'QUARTZ');
    const cards = page.locator('#results [data-achieve-word]');
    expect(await cards.count()).toBeGreaterThan(0);
    await expect(cards.first()).toContainText('pts');
  });
});

test.describe('Mobile Solver — Clear & Sync — Positive', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('clear button resets solver and rack on mobile', async ({ page }) => {
    await page.goto(BASE + '/');
    await waitForDict(page);
    await solveAndWait(page, 'CAT');
    await page.locator('#clear-text-solver').click();
    expect(await page.locator('#text-solver').inputValue()).toBe('');
    const rackTiles = page.locator('#tile-rack .rack-tile');
    await page.waitForTimeout(100);
    for (let i = 0; i < 7; i++) {
      expect((await rackTiles.nth(i).textContent())?.trim()).toBe('');
    }
  });

  test('text-solver syncs to tile rack on mobile', async ({ page }) => {
    await page.goto(BASE + '/');
    await page.locator('#text-solver').fill('HELLO');
    await expect(page.locator('#tile-rack .rack-tile').first()).not.toHaveText('', { timeout: 2000 });
    const rackTiles = page.locator('#tile-rack .rack-tile');
    await expect(rackTiles.nth(0)).toContainText('H');
    await expect(rackTiles.nth(4)).toContainText('O');
  });

  test('blank tile (?) shows star on mobile', async ({ page }) => {
    await page.goto(BASE + '/');
    await page.locator('#text-solver').fill('AB?');
    await expect(page.locator('#tile-rack .rack-tile').nth(2)).toContainText('★', { timeout: 2000 });
  });

  test('text-solver auto-uppercases input on mobile', async ({ page }) => {
    await page.goto(BASE + '/');
    await page.locator('#text-solver').fill('hello');
    expect(await page.locator('#text-solver').inputValue()).toBe('HELLO');
  });
});

test.describe('Mobile Solver — Filters — Positive', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('min length filter works on mobile', async ({ page }) => {
    await page.goto(BASE + '/');
    await waitForDict(page);
    await page.locator('#min-len').selectOption('4');
    await solveAndWait(page, 'CATERS');
    const cards = page.locator('#results [data-achieve-word]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(count, 5); i++) {
      expect((await cards.nth(i).getAttribute('data-achieve-word'))!.length).toBeGreaterThanOrEqual(4);
    }
  });

  test('contains filter works on mobile', async ({ page }) => {
    await page.goto(BASE + '/');
    await waitForDict(page);
    await page.locator('#contains').fill('AT');
    await solveAndWait(page, 'CATERS');
    const cards = page.locator('#results [data-achieve-word]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(count, 5); i++) {
      expect((await cards.nth(i).getAttribute('data-achieve-word'))!.toLowerCase()).toContain('at');
    }
  });

  test('starts-with filter works on mobile', async ({ page }) => {
    await page.goto(BASE + '/');
    await waitForDict(page);
    await page.locator('#starts-with').fill('CA');
    await solveAndWait(page, 'CATERS');
    const cards = page.locator('#results [data-achieve-word]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(count, 5); i++) {
      expect((await cards.nth(i).getAttribute('data-achieve-word'))!.toLowerCase().startsWith('ca')).toBe(true);
    }
  });

  test('sort by score works on mobile', async ({ page }) => {
    await page.goto(BASE + '/');
    await waitForDict(page);
    await page.locator('#sort-by').selectOption('score');
    await solveAndWait(page, 'QUARTZ');
    const cards = page.locator('#results [data-achieve-word]');
    const s1 = parseInt((await cards.first().locator('text=/\\d+ pts/').textContent())?.replace(' pts', '') || '0');
    const s2 = parseInt((await cards.nth(1).locator('text=/\\d+ pts/').textContent())?.replace(' pts', '') || '0');
    expect(s1).toBeGreaterThanOrEqual(s2);
  });
});

test.describe('Mobile Solver — Negative', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('no console errors when solving on mobile', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(BASE + '/');
    await waitForDict(page);
    await solveAndWait(page, 'CASTERS');
    expect(errors.filter(e => !e.includes('adsbygoogle'))).toHaveLength(0);
  });

  test('solver handles single character without crashing on mobile', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(BASE + '/');
    await waitForDict(page);
    await page.locator('#text-solver').fill('A');
    await page.waitForTimeout(200);
    expect(await page.locator('#results').textContent()).not.toContain('undefined');
    expect(errors.filter(e => !e.includes('adsbygoogle'))).toHaveLength(0);
  });

  test('rack tiles never exceed 7 on mobile', async ({ page }) => {
    await page.goto(BASE + '/');
    await page.locator('#text-solver').fill('ABCDEFGHIJKLMNO');
    await expect(page.locator('#tile-rack .rack-tile').first()).not.toHaveText('', { timeout: 2000 });
    expect(await page.locator('#tile-rack .rack-tile').count()).toBe(7);
  });

  test('results area does not overflow horizontally on mobile', async ({ page }) => {
    await page.goto(BASE + '/');
    await waitForDict(page);
    await solveAndWait(page, 'QUARTZ');
    const results = page.locator('#results');
    const isOverflowing = await results.evaluate(el => el.scrollWidth > el.clientWidth);
    expect(isOverflowing).toBeFalsy();
  });
});
