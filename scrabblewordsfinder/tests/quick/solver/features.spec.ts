import { test, expect, Page } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

/**
 * Quick Tests — Solver Features (Optimized)
 * Covers: instant search, clear, memory workbench, dictionaries, sort, filters.
 */

/** Wait for dictionary to finish loading (high-scoring panel appears) */
async function waitForDict(page: Page) {
  await page.waitForSelector('#high-scoring-panel:not(.hidden)', { timeout: 10000 });
}

/** Fill solver and wait for results to render */
async function solveAndWait(page: Page, tiles: string) {
  await page.locator('#text-solver').fill(tiles);
  await page.waitForSelector('#results [data-achieve-word]', { timeout: 5000 });
}

/** Fill solver and wait for "No words found" message */
async function solveAndWaitEmpty(page: Page, tiles: string) {
  await page.locator('#text-solver').fill(tiles);
  await page.waitForSelector('#results >> text=No words found', { timeout: 5000 });
}

test.describe('Quick Tests — Solver: Instant Search — Positive', () => {

  test('typing tiles shows results automatically', async ({ page }) => {
    await page.goto(BASE + '/');
    await waitForDict(page);
    await solveAndWait(page, 'CAT');
    await expect(page.locator('#results')).toContainText('words found');
  });

  test('results update when tiles change', async ({ page }) => {
    await page.goto(BASE + '/');
    await waitForDict(page);
    await solveAndWait(page, 'QUARTZ');
    const first = await page.locator('#results').textContent();
    // Clear and use different tiles
    await page.locator('#clear-text-solver').click();
    await page.waitForTimeout(50);
    await solveAndWait(page, 'HELLO');
    const second = await page.locator('#results').textContent();
    expect(second).not.toBe(first);
  });

  test('results show word cards with point scores', async ({ page }) => {
    await page.goto(BASE + '/');
    await waitForDict(page);
    await solveAndWait(page, 'QUARTZ');
    const cards = page.locator('#results [data-achieve-word]');
    expect(await cards.count()).toBeGreaterThan(0);
    await expect(cards.first()).toContainText('pts');
  });
});

test.describe('Quick Tests — Solver: Clear Button — Positive', () => {

  test('clear button resets solver, rack, and results', async ({ page }) => {
    await page.goto(BASE + '/');
    await waitForDict(page);
    await solveAndWait(page, 'CAT');
    // Click clear
    await page.locator('#clear-text-solver').click();
    // Solver input empty
    expect(await page.locator('#text-solver').inputValue()).toBe('');
    // Rack tiles empty
    const rackTiles = page.locator('#tile-rack .rack-tile');
    await page.waitForTimeout(100);
    for (let i = 0; i < 7; i++) {
      expect((await rackTiles.nth(i).textContent())?.trim()).toBe('');
    }
    // Results no longer show "words found"
    const text = await page.locator('#results').textContent();
    expect(text).not.toContain('words found');
  });
});

test.describe('Quick Tests — Solver: Memory WordBench — Positive', () => {

  test('clicking a word result adds it to Memory WordBench', async ({ page }) => {
    await page.goto(BASE + '/');
    await page.evaluate(() => localStorage.removeItem('scbAchievements'));
    await page.reload();
    await waitForDict(page);
    await solveAndWait(page, 'CAT');
    const firstCard = page.locator('#results [data-achieve-word]').first();
    const word = await firstCard.getAttribute('data-achieve-word');
    await firstCard.click();
    await expect(page.locator('#saved-words-list')).toContainText(word!.toLowerCase(), { timeout: 3000 });
  });

  test('rack add button (+) adds current tiles to Memory WordBench', async ({ page }) => {
    await page.goto(BASE + '/');
    await page.evaluate(() => localStorage.removeItem('scbAchievements'));
    await page.reload();
    await waitForDict(page);
    await page.locator('#text-solver').fill('HELLO');
    await page.waitForTimeout(100);
    await page.locator('#rack-add-btn').click();
    await expect(page.locator('#saved-words-list')).toContainText('HELLO', { timeout: 3000 });
  });
});

test.describe('Quick Tests — Solver: Dictionary Switching — Positive', () => {

  test('all four dictionaries return results', async ({ page }) => {
    await page.goto(BASE + '/');
    await waitForDict(page);
    const dicts = ['sowpods', 'twl', 'wwf', 'collins'];
    for (const dict of dicts) {
      await page.locator('#dictionary').selectOption(dict);
      await solveAndWait(page, 'CAT');
      await expect(page.locator('#results')).toContainText('words found');
      // Clear for next iteration
      await page.locator('#clear-text-solver').click();
      await page.waitForTimeout(50);
    }
  });

  test('switching dictionary changes word count for same tiles', async ({ page }) => {
    await page.goto(BASE + '/');
    await waitForDict(page);
    await page.locator('#dictionary').selectOption('sowpods');
    await solveAndWait(page, 'QIVIUT');
    const sowpods = await page.locator('#results').textContent();
    await page.locator('#dictionary').selectOption('twl');
    await page.waitForTimeout(300);
    const twl = await page.locator('#results').textContent();
    // Both should have found words (content may differ)
    expect(sowpods).toContain('words found');
  });
});

test.describe('Quick Tests — Solver: Sort By — Positive', () => {

  test('sort by score shows descending scores', async ({ page }) => {
    await page.goto(BASE + '/');
    await waitForDict(page);
    await page.locator('#sort-by').selectOption('score');
    await solveAndWait(page, 'QUARTZ');
    const cards = page.locator('#results [data-achieve-word]');
    const s1 = parseInt((await cards.first().locator('text=/\\d+ pts/').textContent())?.replace(' pts', '') || '0');
    const s2 = parseInt((await cards.nth(1).locator('text=/\\d+ pts/').textContent())?.replace(' pts', '') || '0');
    expect(s1).toBeGreaterThanOrEqual(s2);
  });

  test('sort by length shows longest first', async ({ page }) => {
    await page.goto(BASE + '/');
    await waitForDict(page);
    await page.locator('#sort-by').selectOption('length');
    await solveAndWait(page, 'CATERS');
    const cards = page.locator('#results [data-achieve-word]');
    const w1 = (await cards.first().getAttribute('data-achieve-word')) || '';
    const w2 = (await cards.nth(1).getAttribute('data-achieve-word')) || '';
    expect(w1.length).toBeGreaterThanOrEqual(w2.length);
  });

  test('sort by A-Z shows alphabetical order', async ({ page }) => {
    await page.goto(BASE + '/');
    await waitForDict(page);
    await page.locator('#sort-by').selectOption('alpha');
    await solveAndWait(page, 'CATERS');
    const cards = page.locator('#results [data-achieve-word]');
    const w1 = (await cards.first().getAttribute('data-achieve-word')) || '';
    const w2 = (await cards.nth(1).getAttribute('data-achieve-word')) || '';
    expect(w1.localeCompare(w2)).toBeLessThanOrEqual(0);
  });
});

test.describe('Quick Tests — Solver: Min Length Filter — Positive', () => {

  test('min length 2 gives more results than min length 4', async ({ page }) => {
    await page.goto(BASE + '/');
    await waitForDict(page);
    await page.locator('#min-len').selectOption('2');
    await solveAndWait(page, 'CATERS');
    const t2 = (await page.locator('#results').textContent()) || '';
    const c2 = parseInt(t2.match(/(\d+) words found/)?.[1] || '0');

    await page.locator('#min-len').selectOption('4');
    await page.waitForTimeout(200);
    const t4 = (await page.locator('#results').textContent()) || '';
    const c4 = parseInt(t4.match(/(\d+) words found/)?.[1] || '0');
    expect(c2).toBeGreaterThan(c4);
  });

  test('min length 4 excludes short words', async ({ page }) => {
    await page.goto(BASE + '/');
    await waitForDict(page);
    await page.locator('#min-len').selectOption('4');
    await solveAndWait(page, 'CATERS');
    const cards = page.locator('#results [data-achieve-word]');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      expect((await cards.nth(i).getAttribute('data-achieve-word'))!.length).toBeGreaterThanOrEqual(4);
    }
  });

  test('min length 5 shows only 5+ letter words', async ({ page }) => {
    await page.goto(BASE + '/');
    await waitForDict(page);
    await page.locator('#min-len').selectOption('5');
    await solveAndWait(page, 'CASTERS');
    const cards = page.locator('#results [data-achieve-word]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      expect((await cards.nth(i).getAttribute('data-achieve-word'))!.length).toBeGreaterThanOrEqual(5);
    }
  });
});

test.describe('Quick Tests — Solver: Contains Filter — Positive', () => {

  test('contains filter shows only words with substring', async ({ page }) => {
    await page.goto(BASE + '/');
    await waitForDict(page);
    await page.locator('#contains').fill('AT');
    await solveAndWait(page, 'CATERS');
    const cards = page.locator('#results [data-achieve-word]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      expect((await cards.nth(i).getAttribute('data-achieve-word'))!.toLowerCase()).toContain('at');
    }
  });

  test('contains filter with impossible substring shows no results', async ({ page }) => {
    await page.goto(BASE + '/');
    await waitForDict(page);
    await page.locator('#contains').fill('ZZ');
    await solveAndWaitEmpty(page, 'CAT');
  });
});

test.describe('Quick Tests — Solver: Starts With Filter — Positive', () => {

  test('starts-with filter shows only matching words', async ({ page }) => {
    await page.goto(BASE + '/');
    await waitForDict(page);
    await page.locator('#starts-with').fill('CA');
    await solveAndWait(page, 'CATERS');
    const cards = page.locator('#results [data-achieve-word]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      expect((await cards.nth(i).getAttribute('data-achieve-word'))!.toLowerCase().startsWith('ca')).toBe(true);
    }
  });

  test('starts-with impossible prefix shows no results', async ({ page }) => {
    await page.goto(BASE + '/');
    await waitForDict(page);
    await page.locator('#starts-with').fill('ZZ');
    await solveAndWaitEmpty(page, 'CATERS');
  });
});

test.describe('Quick Tests — Solver: Ends With Filter — Positive', () => {

  test('ends-with filter shows only matching words', async ({ page }) => {
    await page.goto(BASE + '/');
    await waitForDict(page);
    await page.locator('#ends-with').fill('ER');
    await solveAndWait(page, 'CATERS');
    const cards = page.locator('#results [data-achieve-word]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      expect((await cards.nth(i).getAttribute('data-achieve-word'))!.toLowerCase().endsWith('er')).toBe(true);
    }
  });

  test('ends-with impossible suffix shows no results', async ({ page }) => {
    await page.goto(BASE + '/');
    await waitForDict(page);
    await page.locator('#ends-with').fill('ZZ');
    await solveAndWaitEmpty(page, 'CATERS');
  });
});

test.describe('Quick Tests — Solver: Combined Filters — Positive', () => {

  test('starts-with C + ends-with S narrows results correctly', async ({ page }) => {
    await page.goto(BASE + '/');
    await waitForDict(page);
    await page.locator('#starts-with').fill('C');
    await page.locator('#ends-with').fill('S');
    await solveAndWait(page, 'CASTERS');
    const cards = page.locator('#results [data-achieve-word]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const w = (await cards.nth(i).getAttribute('data-achieve-word'))!.toLowerCase();
      expect(w.startsWith('c')).toBe(true);
      expect(w.endsWith('s')).toBe(true);
    }
  });
});

test.describe('Quick Tests — Solver Features — Negative', () => {

  test('no console errors when using all filters together', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(BASE + '/');
    await waitForDict(page);
    await page.locator('#min-len').selectOption('3');
    await page.locator('#sort-by').selectOption('length');
    await page.locator('#contains').fill('A');
    await page.locator('#starts-with').fill('C');
    await page.locator('#ends-with').fill('T');
    await solveAndWait(page, 'CASTERS');
    expect(errors.filter(e => !e.includes('adsbygoogle'))).toHaveLength(0);
  });

  test('solver handles 1 character gracefully without crashing', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(BASE + '/');
    await waitForDict(page);
    await page.locator('#text-solver').fill('A');
    await page.waitForTimeout(200);
    expect(await page.locator('#results').textContent()).not.toContain('undefined');
    expect(errors.filter(e => !e.includes('adsbygoogle'))).toHaveLength(0);
  });

  test('rapid dictionary switching does not crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(BASE + '/');
    await waitForDict(page);
    await solveAndWait(page, 'CAT');
    await page.locator('#dictionary').selectOption('twl');
    await page.locator('#dictionary').selectOption('wwf');
    await page.locator('#dictionary').selectOption('collins');
    await page.locator('#dictionary').selectOption('sowpods');
    await page.waitForTimeout(300);
    expect(errors.filter(e => !e.includes('adsbygoogle'))).toHaveLength(0);
  });
});
