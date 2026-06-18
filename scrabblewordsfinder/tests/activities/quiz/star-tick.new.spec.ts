import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'https://scrabblewordsfinder-staging.xconvert.workers.dev';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── Star Tick Elements — Positive ────────────────────────────────────────

test.describe('Star Tick Elements — Positive', () => {
  test('each game panel has a static .star-tick element', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const games = ['wotd', 'quiz', 'wordbench', 'rack', 'anagram', 'sixty'];
    for (const game of games) {
      const tick = page.locator(`.star-tick[data-game="${game}"]`);
      await expect(tick).toHaveCount(1);
    }
  });

  test('star-tick elements start hidden', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const games = ['wotd', 'quiz', 'wordbench', 'rack', 'anagram', 'sixty'];
    for (const game of games) {
      const tick = page.locator(`.star-tick[data-game="${game}"]`);
      await expect(tick).toHaveClass(/hidden/);
    }
  });

  test('star-tick elements contain ✅ text', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const tick = page.locator('.star-tick[data-game="quiz"]');
    const text = await tick.textContent();
    expect(text).toContain('✅');
  });
});

// ── Star Tick Elements — Negative ────────────────────────────────────────

test.describe('Star Tick Elements — Negative', () => {
  test('no duplicate star-tick elements per game', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const games = ['wotd', 'quiz', 'wordbench', 'rack', 'anagram', 'sixty'];
    for (const game of games) {
      const ticks = page.locator(`.star-tick[data-game="${game}"]`);
      await expect(ticks).toHaveCount(1);
    }
  });

  test('star-tick is sibling of star-indicator (same parent)', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    // Quiz tick should be inside the same h2 as the star-indicator
    const quizIndicator = page.locator('.star-indicator[data-game="quiz"]');
    const quizTick = page.locator('.star-tick[data-game="quiz"]');
    const indicatorParent = await quizIndicator.evaluate(el => el.parentElement?.tagName);
    const tickParent = await quizTick.evaluate(el => el.parentElement?.tagName);
    expect(indicatorParent).toBe(tickParent);
  });
});
