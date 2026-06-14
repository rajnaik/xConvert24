import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'https://scrabblewordsfinder-staging.xconvert.workers.dev';

test.describe('Tile Rack Blank Sync — Positive', () => {
  test('typing in tile rack with gaps should show ? for blanks in Word Solver', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    // Type A in box 0, skip box 1, type C in box 2
    const box0 = page.locator('.tile-box[data-idx="0"]');
    const box2 = page.locator('.tile-box[data-idx="2"]');
    const box3 = page.locator('.tile-box[data-idx="3"]');

    await box0.fill('A');
    // Skip box 1 (leave blank)
    await box2.fill('C');
    await box3.fill('D');

    const solver = page.locator('#text-solver');
    const value = await solver.inputValue();

    // Fixed behavior: empty boxes between filled ones become ?
    // So typing A, _, C, D in boxes 0, 1, 2, 3 → solver shows "A?CD"
    expect(value).toBe('A?CD');
  });

  test('Word Solver ? syncs to empty tile box', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    // Type in Word Solver with ? for blanks
    const solver = page.locator('#text-solver');
    await solver.fill('A?CD');
    await page.waitForTimeout(300);

    // Check tile rack: box 0 = A, box 1 = empty (? = blank), box 2 = C, box 3 = D
    const box0 = page.locator('.tile-box[data-idx="0"]');
    const box1 = page.locator('.tile-box[data-idx="1"]');
    const box2 = page.locator('.tile-box[data-idx="2"]');
    const box3 = page.locator('.tile-box[data-idx="3"]');

    await expect(box0).toHaveValue('A');
    await expect(box1).toHaveValue(''); // ? becomes empty tile box
    await expect(box2).toHaveValue('C');
    await expect(box3).toHaveValue('D');
  });
});

test.describe('Tile Rack Blank Sync — Negative', () => {
  test('empty tile rack does not crash Word Solver', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    // All boxes empty — Word Solver should be empty too
    const solver = page.locator('#text-solver');
    const value = await solver.inputValue();
    expect(value).toBe('');

    // No page errors
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('filling all 7 boxes does not overflow Word Solver', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    // Fill all 7 boxes
    for (let i = 0; i < 7; i++) {
      const box = page.locator(`.tile-box[data-idx="${i}"]`);
      await box.fill(String.fromCharCode(65 + i)); // A, B, C, D, E, F, G
    }

    const solver = page.locator('#text-solver');
    const value = await solver.inputValue();
    expect(value).toBe('ABCDEFG');
    expect(value.length).toBe(7);
  });
});
