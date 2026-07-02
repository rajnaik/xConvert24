import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

/**
 * Quiz — Leaderboard Rank Link in Result Panel
 * After a quiz ends, a leaderboard rank link (🏆 #N) appears linking to /leaderboard/?game=word-quiz
 */

test.describe('Quiz Leaderboard Rank Link — Positive', () => {
  test('leaderboard rank container exists in quiz result panel and is initially hidden', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const rankDiv = page.locator('#quiz-lb-rank');
    await expect(rankDiv).toBeAttached();
    await expect(rankDiv).toHaveClass(/hidden/);
  });

  test('leaderboard rank link has correct href to /leaderboard/?game=word-quiz', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const link = page.locator('#quiz-lb-rank-link');
    await expect(link).toHaveAttribute('href', '/leaderboard/?game=word-quiz');
  });

  test('leaderboard rank link contains trophy emoji and rank text span', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const link = page.locator('#quiz-lb-rank-link');
    const linkText = await link.textContent();
    expect(linkText).toContain('🏆');
    const rankText = page.locator('#quiz-lb-rank-text');
    await expect(rankText).toBeAttached();
  });

  test('leaderboard rank link has purple pill styling', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const link = page.locator('#quiz-lb-rank-link');
    await expect(link).toHaveClass(/rounded-full/);
    await expect(link).toHaveClass(/bg-purple-900/);
    await expect(link).toHaveClass(/border-purple-500/);
    await expect(link).toHaveClass(/text-purple-300/);
  });
});

test.describe('Quiz Leaderboard Rank Link — Negative', () => {
  test('no duplicate leaderboard rank elements in quiz result panel', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const rankDivs = page.locator('#quiz-lb-rank');
    await expect(rankDivs).toHaveCount(1);
  });

  test('leaderboard rank link does not appear outside the quiz-complete panel', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const inResult = page.locator('#quiz-complete #quiz-lb-rank');
    const total = page.locator('#quiz-lb-rank');
    const inResultCount = await inResult.count();
    const totalCount = await total.count();
    expect(totalCount).toBe(inResultCount);
  });

  test('no console errors related to quiz leaderboard rank on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(2000);
    const critical = errors.filter(e =>
      e.includes('quiz-lb-rank') || e.includes('TypeError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });

  test('leaderboard rank default text is Loading... before data arrives', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const rankText = page.locator('#quiz-lb-rank-text');
    const text = await rankText.textContent();
    expect(text).toBe('Loading...');
  });
});
