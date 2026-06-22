import { test, expect } from '@playwright/test';

const PAGE = '/blog/bird-names-accepted-in-scrabble/';

test.describe('Bird Names Accepted in Scrabble — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('h1 title is present and correct', async ({ page }) => {
    await page.goto(PAGE);
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('Bird Names Accepted in Scrabble');
  });

  test('intro paragraph mentions birdwatchers', async ({ page }) => {
    await page.goto(PAGE);
    const intro = page.locator('article p').first();
    await expect(intro).toContainText('Birdwatchers');
  });

  test('stat strip container is visible', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    await expect(statStrip).toBeVisible();
  });

  test('stat strip shows 150+ Bird Words', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    await expect(statStrip).toContainText('150+');
    await expect(statStrip).toContainText('Bird Words');
  });

  test('stat strip shows 14 as Top Score (HAWK)', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    await expect(statStrip).toContainText('14');
    await expect(statStrip).toContainText('Top Score (HAWK)');
  });

  test('stat strip shows 13 for JAY / FINCH', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    await expect(statStrip).toContainText('13');
    await expect(statStrip).toContainText('JAY / FINCH');
  });

  test('stat strip shows 3-6 Letter Range', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    await expect(statStrip).toContainText('3-6');
    await expect(statStrip).toContainText('Letter Range');
  });

  test('stat strip contains exactly 4 stat items', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    const statItems = statStrip.locator('.text-2xl.font-bold.text-amber-400');
    await expect(statItems).toHaveCount(4);
  });

  test('top scoring bird words section heading is visible', async ({ page }) => {
    await page.goto(PAGE);
    const h2 = page.locator('h2', { hasText: 'Top Scoring Bird Words' });
    await expect(h2).toBeVisible();
  });

  test('bird words table is present and visible', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
  });

  test('bird words table has correct headers', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table').first();
    await expect(table.locator('th')).toHaveCount(4);
    await expect(table.locator('th').nth(0)).toContainText('Word');
    await expect(table.locator('th').nth(1)).toContainText('Points');
    await expect(table.locator('th').nth(2)).toContainText('Letters');
    await expect(table.locator('th').nth(3)).toContainText('Notes');
  });

  test('bird words table contains 13 rows of data', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table').first();
    const rows = table.locator('tbody tr');
    await expect(rows).toHaveCount(13);
  });

  test('HAWK is first word in table with 14 points', async ({ page }) => {
    await page.goto(PAGE);
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toContainText('HAWK');
    await expect(firstRow).toContainText('14');
  });

  test('table includes all expected bird names', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table').first();
    const expectedBirds = ['HAWK', 'FINCH', 'JAY', 'SWIFT', 'OSPREY', 'HERON', 'RAVEN', 'WREN', 'ROBIN', 'CRANE', 'OWL', 'EAGLE', 'EMU'];
    for (const bird of expectedBirds) {
      await expect(table).toContainText(bird);
    }
  });
});

test.describe('Bird Names Accepted in Scrabble — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate stat strip containers on the page', async ({ page }) => {
    await page.goto(PAGE);
    const statStrips = page.locator('.border-amber-500\\/30.bg-amber-950\\/10');
    const count = await statStrips.count();
    expect(count).toBe(1);
  });

  test('stat strip does not contain empty stat values', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    const values = statStrip.locator('.text-2xl.font-bold.text-amber-400');
    const count = await values.count();
    for (let i = 0; i < count; i++) {
      const text = await values.nth(i).textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('stat strip labels are not empty', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    const labels = statStrip.locator('.text-xs.text-gray-400');
    const count = await labels.count();
    expect(count).toBe(4);
    for (let i = 0; i < count; i++) {
      const text = await labels.nth(i).textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('table rows have no empty word cells', async ({ page }) => {
    await page.goto(PAGE);
    const wordCells = page.locator('table tbody tr td.font-mono.text-blue-300');
    const count = await wordCells.count();
    expect(count).toBe(13);
    for (let i = 0; i < count; i++) {
      const text = await wordCells.nth(i).textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('table rows have no empty points cells', async ({ page }) => {
    await page.goto(PAGE);
    const pointsCells = page.locator('table tbody tr td.text-amber-400.font-bold');
    const count = await pointsCells.count();
    expect(count).toBe(13);
    for (let i = 0; i < count; i++) {
      const text = await pointsCells.nth(i).textContent();
      const num = parseInt(text?.trim() || '0');
      expect(num).toBeGreaterThan(0);
    }
  });

  test('no duplicate h1 tags on the page', async ({ page }) => {
    await page.goto(PAGE);
    const h1s = page.locator('h1');
    await expect(h1s).toHaveCount(1);
  });

  test('table points are in descending order', async ({ page }) => {
    await page.goto(PAGE);
    const pointsCells = page.locator('table tbody tr td.text-amber-400.font-bold');
    const count = await pointsCells.count();
    const scores: number[] = [];
    for (let i = 0; i < count; i++) {
      const text = await pointsCells.nth(i).textContent();
      scores.push(parseInt(text?.trim() || '0'));
    }
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
  });
});
