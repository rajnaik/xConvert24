import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

/**
 * Quiz Panel — 🏆 #1 Leaderboard link in header
 * A visible leaderboard link in the Quiz panel header area
 */

test.describe('Quiz Header Leaderboard Link — Positive', () => {
  test('🏆 #1 link exists and is visible in the Quiz panel header', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const link = page.locator('#quiz-lb-link');
    await expect(link).toBeVisible();
  });

  test('🏆 #1 link has correct href to /leaderboard/?game=word-quiz', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const link = page.locator('#quiz-lb-link');
    await expect(link).toHaveAttribute('href', '/leaderboard/?game=word-quiz');
  });

  test('🏆 #1 link contains trophy emoji and #1 text', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const link = page.locator('#quiz-lb-link');
    const text = await link.textContent();
    expect(text).toContain('🏆');
    expect(text).toContain('#1');
  });

  test('🏆 #1 link has amber pill styling', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const link = page.locator('#quiz-lb-link');
    await expect(link).toHaveClass(/rounded-lg/);
    await expect(link).toHaveClass(/bg-amber-600/);
    await expect(link).toHaveClass(/border-amber-500/);
    await expect(link).toHaveClass(/text-amber-300/);
  });
});

test.describe('Quiz Header Leaderboard Link — Negative', () => {
  test('no duplicate quiz-lb-link elements on the page', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const links = page.locator('#quiz-lb-link');
    await expect(links).toHaveCount(1);
  });

  test('no console errors related to quiz-lb-link on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(2000);
    const critical = errors.filter(e =>
      e.includes('quiz-lb-link') || e.includes('TypeError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });
});
