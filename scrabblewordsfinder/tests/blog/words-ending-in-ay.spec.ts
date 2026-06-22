import { test, expect } from '@playwright/test';

const PAGE = '/blog/words-ending-in-ay/';

test.describe('Words Ending in AY — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('top AY-ending words table is visible', async ({ page }) => {
    await page.goto(PAGE);
    const heading = page.locator('h2', { hasText: 'Top AY-Ending Words by Score' });
    await expect(heading).toBeVisible();
  });

  test('score table has 14 word rows', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table').filter({ hasText: 'HIGHWAY' });
    const rows = table.locator('tbody tr');
    await expect(rows).toHaveCount(14);
  });

  test('table includes expected high-scoring words', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table').filter({ hasText: 'HIGHWAY' });
    const text = await table.textContent();
    expect(text).toContain('HIGHWAY');
    expect(text).toContain('HALFWAY');
    expect(text).toContain('JAY');
    expect(text).toContain('PLAY');
  });

  test('table has correct column headers', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table').filter({ hasText: 'HIGHWAY' });
    const headers = table.locator('thead th');
    await expect(headers).toHaveCount(4);
    await expect(headers.nth(0)).toHaveText('Word');
    await expect(headers.nth(1)).toHaveText('Length');
    await expect(headers.nth(2)).toHaveText('Points');
    await expect(headers.nth(3)).toHaveText('Notes');
  });

  test('insight box is visible with bingo content', async ({ page }) => {
    await page.goto(PAGE);
    const insight = page.locator('text=💡 Insight');
    await expect(insight).toBeVisible();
    const box = page.locator('.bg-blue-950\\/20');
    const text = await box.textContent();
    expect(text).toContain('bingo potential');
    expect(text).toContain('HIGHWAY');
  });

  test('HIGHWAY shows score of 20', async ({ page }) => {
    await page.goto(PAGE);
    const row = page.locator('tr', { hasText: 'HIGHWAY' });
    const pointCell = row.locator('td.text-blue-400');
    await expect(pointCell).toHaveText('20');
  });
});

test.describe('Words Ending in AY — Negative', () => {

  test('no page errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate score tables on page', async ({ page }) => {
    await page.goto(PAGE);
    const tables = page.locator('table').filter({ hasText: 'HIGHWAY' });
    await expect(tables).toHaveCount(1);
  });

  test('no duplicate insight boxes', async ({ page }) => {
    await page.goto(PAGE);
    const insights = page.locator('.bg-blue-950\\/20');
    await expect(insights).toHaveCount(1);
  });

  test('table cells are not empty', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table').filter({ hasText: 'HIGHWAY' });
    const cells = table.locator('tbody td');
    const count = await cells.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const text = await cells.nth(i).textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('insight box text is not empty', async ({ page }) => {
    await page.goto(PAGE);
    const box = page.locator('.bg-blue-950\\/20 .text-gray-300');
    const text = await box.textContent();
    expect(text?.trim().length).toBeGreaterThan(20);
  });
});
