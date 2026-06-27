import { test, expect } from '@playwright/test';

/**
 * Homepage Keywords Meta Tag — Priority Keywords Test
 * Validates that the homepage meta keywords include the priority SEO terms
 * in the correct order (highest-value keywords first).
 */

test.describe('Homepage Keywords — Positive', () => {
  test('meta keywords tag exists with correct priority terms', async ({ page }) => {
    await page.goto('/');
    const keywords = await page.locator('meta[name="keywords"]').getAttribute('content');
    expect(keywords).toBeTruthy();
    // Priority keywords that should be present
    expect(keywords).toContain('scrabble word finder');
    expect(keywords).toContain('scrabble solver');
    expect(keywords).toContain('scrabble dictionary');
  });

  test('scrabble solver appears before free scrabble solver in keywords', async ({ page }) => {
    await page.goto('/');
    const keywords = await page.locator('meta[name="keywords"]').getAttribute('content');
    expect(keywords).toBeTruthy();
    const solverIndex = keywords!.indexOf('scrabble solver');
    const freeIndex = keywords!.indexOf('free scrabble solver');
    // "scrabble solver" should come before "free scrabble solver"
    expect(solverIndex).toBeLessThan(freeIndex);
  });

  test('keywords include all core brand terms', async ({ page }) => {
    await page.goto('/');
    const keywords = await page.locator('meta[name="keywords"]').getAttribute('content');
    expect(keywords).toContain('no signup word finder');
    expect(keywords).toContain('realtime word finder');
    expect(keywords).toContain('SOWPODS dictionary online');
  });
});

test.describe('Homepage Keywords — Negative', () => {
  test('keywords are not empty or whitespace-only', async ({ page }) => {
    await page.goto('/');
    const keywords = await page.locator('meta[name="keywords"]').getAttribute('content');
    expect(keywords).toBeTruthy();
    expect(keywords!.trim().length).toBeGreaterThan(50);
  });

  test('no duplicate "scrabble word finder" in keywords', async ({ page }) => {
    await page.goto('/');
    const keywords = await page.locator('meta[name="keywords"]').getAttribute('content');
    expect(keywords).toBeTruthy();
    // Count occurrences of the exact phrase
    const matches = keywords!.match(/scrabble word finder/g);
    expect(matches).toHaveLength(1);
  });
});
