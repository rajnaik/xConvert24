import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'https://scrabblewordsfinder-staging.xconvert.workers.dev';

test.describe('Dictionary Loading — Positive', () => {
  test('dictionary files return 200', async ({ page }) => {
    const sowRes = await page.request.get(`${BASE_URL}/data/sowpods-2-7.json`);
    expect(sowRes.status()).toBe(200);

    const twlRes = await page.request.get(`${BASE_URL}/data/twl06-2-7.json`);
    expect(twlRes.status()).toBe(200);

    const longRes = await page.request.get(`${BASE_URL}/data/sowpods-8-15.json`);
    expect(longRes.status()).toBe(200);
  });

  test('dictionary loads and solver finds words', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(5000);

    const textSolver = page.locator('#text-solver');
    await textSolver.fill('TESTING');
    await page.waitForTimeout(500);
    const results = page.locator('#results');
    const text = await results.textContent();
    expect(text).not.toContain('No words found');
    expect(text).not.toContain('Loading dictionary');
  });

  test('solver finds 8+ letter words from long tiles', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(5000);

    const textSolver = page.locator('#text-solver');
    await textSolver.fill('ARRESTEDERNING');
    await page.waitForTimeout(800);

    const results = page.locator('#results');
    const text = await results.textContent();
    expect(text?.toLowerCase()).toContain('arresting');
  });

  test('Solve button works as fallback', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(5000);

    const textSolver = page.locator('#text-solver');
    await textSolver.fill('QUIZZING');
    await page.locator('#text-solve-btn').click();
    await page.waitForTimeout(500);

    const results = page.locator('#results');
    const text = await results.textContent();
    expect(text).not.toContain('No words found');
  });

  test('Find Words button works as fallback', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(5000);

    const textSolver = page.locator('#text-solver');
    await textSolver.fill('SCRABBLE');
    await page.locator('#solve-btn').click();
    await page.waitForTimeout(500);

    const results = page.locator('#results');
    const text = await results.textContent();
    expect(text).not.toContain('No words found');
  });
});

test.describe('Dictionary Loading — Negative', () => {
  test('shows helpful message when tiles too short', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(3000);

    const textSolver = page.locator('#text-solver');
    await textSolver.fill('A');
    await page.locator('#text-solve-btn').click();
    await page.waitForTimeout(300);

    const results = page.locator('#results');
    const text = await results.textContent();
    expect(text).not.toContain('undefined');
  });

  test('no crash with nonsense characters', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(5000);

    const textSolver = page.locator('#text-solver');
    await textSolver.fill('ZZZZZZZ');
    await page.waitForTimeout(500);

    const results = page.locator('#results');
    const text = await results.textContent();
    expect(text).not.toContain('undefined');
  });
});
