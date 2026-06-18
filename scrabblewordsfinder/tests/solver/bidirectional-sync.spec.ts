import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'https://www.scrabblewordsfinder.com';

test.describe('Bidirectional Sync (Word Solver ↔ Tile Rack) — Positive', () => {
  test('typing in Word Solver updates tile rack boxes', async ({ page }) => {
    await page.goto(BASE_URL);
    const wordSolver = page.locator('#text-solver');
    await wordSolver.fill('CATS');
    // Tile boxes should show C, A, T, S
    const tileBoxes = page.locator('.tile-box');
    await expect(tileBoxes.nth(0)).toHaveValue('C');
    await expect(tileBoxes.nth(1)).toHaveValue('A');
    await expect(tileBoxes.nth(2)).toHaveValue('T');
    await expect(tileBoxes.nth(3)).toHaveValue('S');
  });

  test('typing in tile rack boxes updates Word Solver', async ({ page }) => {
    await page.goto(BASE_URL);
    const tileBoxes = page.locator('.tile-box');
    // Type letters into individual tile boxes
    await tileBoxes.nth(0).fill('H');
    await tileBoxes.nth(1).fill('E');
    await tileBoxes.nth(2).fill('L');
    await tileBoxes.nth(3).fill('P');
    const wordSolver = page.locator('#text-solver');
    await expect(wordSolver).toHaveValue('HELP');
  });

  test('clearing Word Solver clears tile rack', async ({ page }) => {
    await page.goto(BASE_URL);
    const wordSolver = page.locator('#text-solver');
    await wordSolver.fill('DOG');
    await wordSolver.fill('');
    const tileBoxes = page.locator('.tile-box');
    await expect(tileBoxes.nth(0)).toHaveValue('');
    await expect(tileBoxes.nth(1)).toHaveValue('');
    await expect(tileBoxes.nth(2)).toHaveValue('');
  });

  test('? in Word Solver leaves tile box empty (blank tile)', async ({ page }) => {
    await page.goto(BASE_URL);
    const wordSolver = page.locator('#text-solver');
    await wordSolver.fill('A?B');
    const tileBoxes = page.locator('.tile-box');
    await expect(tileBoxes.nth(0)).toHaveValue('A');
    await expect(tileBoxes.nth(1)).toHaveValue('');
    await expect(tileBoxes.nth(2)).toHaveValue('B');
  });

  test('empty tile box between letters shows ? in Word Solver', async ({ page }) => {
    await page.goto(BASE_URL);
    const tileBoxes = page.locator('.tile-box');
    // Fill boxes 0, 2, 3 — leave box 1 empty
    await tileBoxes.nth(0).fill('A');
    await tileBoxes.nth(2).fill('E');
    await tileBoxes.nth(3).fill('S');
    const wordSolver = page.locator('#text-solver');
    // Should show A?ES (empty slot between A and E becomes ?)
    await expect(wordSolver).toHaveValue('A?ES');
  });
});

test.describe('Bidirectional Sync (Word Solver ↔ Tile Rack) — Negative', () => {
  test('does not crash with all ? characters', async ({ page }) => {
    await page.goto(BASE_URL);
    const wordSolver = page.locator('#text-solver');
    await wordSolver.fill('???');
    // All tile boxes should be empty, no crash
    const tileBoxes = page.locator('.tile-box');
    await expect(tileBoxes.nth(0)).toHaveValue('');
    await expect(tileBoxes.nth(1)).toHaveValue('');
    await expect(tileBoxes.nth(2)).toHaveValue('');
    // Word Solver should still show ???
    await expect(wordSolver).toHaveValue('???');
  });

  test('no ghost characters after rapid typing and clearing', async ({ page }) => {
    await page.goto(BASE_URL);
    const wordSolver = page.locator('#text-solver');
    // Rapid fill/clear cycle
    await wordSolver.fill('ABCDEFG');
    await wordSolver.fill('');
    await wordSolver.fill('XYZ');
    const tileBoxes = page.locator('.tile-box');
    await expect(tileBoxes.nth(0)).toHaveValue('X');
    await expect(tileBoxes.nth(1)).toHaveValue('Y');
    await expect(tileBoxes.nth(2)).toHaveValue('Z');
    await expect(tileBoxes.nth(3)).toHaveValue('');
  });

  test('special characters ignored — no page crash', async ({ page }) => {
    await page.goto(BASE_URL);
    const wordSolver = page.locator('#text-solver');
    await wordSolver.fill('AB3');
    // No crash and no page error
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
  });
});
