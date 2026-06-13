import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'https://www.scrabblewordsfinder.com';

test.describe('Wildcard (?) Solver — Positive', () => {
  test('ARR?STS finds ARRESTS', async ({ page }) => {
    await page.goto(BASE_URL);
    const wordSolver = page.locator('#text-solver');
    await wordSolver.fill('ARR?STS');
    await page.waitForTimeout(500);
    const results = page.locator('#results');
    await expect(results).toContainText('arrests');
  });

  test('? as single wildcard finds words', async ({ page }) => {
    await page.goto(BASE_URL);
    const wordSolver = page.locator('#text-solver');
    await wordSolver.fill('CA?');
    await page.waitForTimeout(500);
    const results = page.locator('#results');
    await expect(results).toContainText('cat');
  });

  test('multiple ? wildcards work', async ({ page }) => {
    await page.goto(BASE_URL);
    const wordSolver = page.locator('#text-solver');
    await wordSolver.fill('??AT');
    await page.waitForTimeout(500);
    const results = page.locator('#results');
    await expect(results).not.toContainText('No words found');
  });

  test('tile rack empty slot treated as wildcard', async ({ page }) => {
    await page.goto(BASE_URL);
    const tileBoxes = page.locator('.tile-box');
    await tileBoxes.nth(0).fill('A');
    await tileBoxes.nth(1).fill('R');
    await tileBoxes.nth(2).fill('R');
    await tileBoxes.nth(4).fill('S');
    await tileBoxes.nth(5).fill('T');
    await tileBoxes.nth(6).fill('S');
    await page.waitForTimeout(500);
    const results = page.locator('#results');
    await expect(results).toContainText('arrests');
  });

  test('Word Solver shows ? for empty tile rack slot', async ({ page }) => {
    await page.goto(BASE_URL);
    const tileBoxes = page.locator('.tile-box');
    await tileBoxes.nth(0).fill('C');
    await tileBoxes.nth(2).fill('T');
    const wordSolver = page.locator('#text-solver');
    await expect(wordSolver).toHaveValue('C?T');
  });

  test('long words (8+ letters) found after dictionary loads', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(4000);
    const wordSolver = page.locator('#text-solver');
    await wordSolver.fill('ARRESTING');
    await page.waitForTimeout(500);
    const results = page.locator('#results');
    await expect(results).toContainText('arresting');
  });

  test('wildcard with long word input finds long words', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(4000);
    const wordSolver = page.locator('#text-solver');
    await wordSolver.fill('ARREST?NG');
    await page.waitForTimeout(500);
    const results = page.locator('#results');
    await expect(results).toContainText('arresting');
  });
});

test.describe('Wildcard (?) Solver — Negative', () => {
  test('all wildcards still returns results', async ({ page }) => {
    await page.goto(BASE_URL);
    const wordSolver = page.locator('#text-solver');
    await wordSolver.fill('??');
    await page.waitForTimeout(500);
    const results = page.locator('#results');
    await expect(results).not.toContainText('No words found');
  });

  test('no page errors during wildcard search', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(BASE_URL);
    const wordSolver = page.locator('#text-solver');
    await wordSolver.fill('?????');
    await page.waitForTimeout(600);
    expect(errors).toHaveLength(0);
  });

  test('single ? does not trigger search', async ({ page }) => {
    await page.goto(BASE_URL);
    const wordSolver = page.locator('#text-solver');
    await wordSolver.fill('?');
    await page.waitForTimeout(500);
    const results = page.locator('#results');
    await expect(results).toContainText('Enter at least 2 tiles');
  });
});
