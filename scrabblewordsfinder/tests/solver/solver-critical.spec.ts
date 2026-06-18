import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'https://www.scrabblewordsfinder.com';

test.describe('Solver Critical Tests', () => {
  test('A?R?STS should find ARRESTS', async ({ page }) => {
    await page.goto(BASE_URL);
    // Wait for dictionary to load
    await page.waitForTimeout(2000);
    const wordSolver = page.locator('#text-solver');
    await wordSolver.fill('A?R?STS');
    // Wait for debounce solve
    await page.waitForTimeout(600);
    const results = page.locator('#results');
    await expect(results).toContainText('arrests');
  });

  test('ARRESTEDERNING should find ARRESTING', async ({ page }) => {
    await page.goto(BASE_URL);
    // Wait for long dictionary (8-15 letters) to lazy-load
    await page.waitForTimeout(5000);
    const wordSolver = page.locator('#text-solver');
    await wordSolver.fill('ARRESTEDERNING');
    // Wait for debounce solve
    await page.waitForTimeout(600);
    const results = page.locator('#results');
    await expect(results).toContainText('arresting');
  });
});
