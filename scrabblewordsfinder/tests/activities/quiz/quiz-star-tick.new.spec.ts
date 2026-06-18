import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'https://scrabblewordsfinder-staging.xconvert.workers.dev';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── Quiz Star Tick Indicator — Positive ──────────────────────────────────

test.describe('Quiz Star Tick Indicator — Positive', () => {
  test('star-tick element exists in Quiz panel header with data-game="quiz"', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const tick = page.locator('.star-tick[data-game="quiz"]');
    await expect(tick).toHaveCount(1);
  });

  test('star-tick is hidden by default (star not yet earned)', async ({ page }) => {
    // Clear stars so nothing is pre-earned
    await page.addInitScript(() => {
      const key = 'swf-stars-earned-' + new Date().toISOString().split('T')[0];
      localStorage.removeItem(key);
    });
    await page.goto(ACTIVITIES_URL);
    const tick = page.locator('.star-tick[data-game="quiz"]');
    await expect(tick).toHaveClass(/hidden/);
  });

  test('star-tick contains the ✅ checkmark text', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const tick = page.locator('.star-tick[data-game="quiz"]');
    await expect(tick).toHaveText('✅');
  });

  test('star-tick is adjacent to star-indicator in the Quiz heading', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    // The star-tick should be the next sibling of the star-indicator
    const indicator = page.locator('.star-indicator[data-game="quiz"]');
    await expect(indicator).toHaveCount(1);
    const tick = page.locator('.star-indicator[data-game="quiz"] + .star-tick[data-game="quiz"]');
    await expect(tick).toHaveCount(1);
  });
});

// ── Quiz Star Tick Indicator — Negative ──────────────────────────────────

test.describe('Quiz Star Tick Indicator — Negative', () => {
  test('no duplicate star-tick elements for quiz game', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const ticks = page.locator('.star-tick[data-game="quiz"]');
    await expect(ticks).toHaveCount(1);
  });

  test('star-tick does not become visible without earning the star', async ({ page }) => {
    await page.addInitScript(() => {
      const key = 'swf-stars-earned-' + new Date().toISOString().split('T')[0];
      localStorage.removeItem(key);
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(1000);
    const tick = page.locator('.star-tick[data-game="quiz"]');
    // Should still have the hidden class
    await expect(tick).toHaveClass(/hidden/);
  });

  test('no JS errors on page load with star-tick element present', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(2000);
    expect(errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'))).toHaveLength(0);
  });

  test('StarBar event handler does not create duplicate tick when pre-existing star-tick exists', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    // Simulate earning the quiz star by dispatching the event
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('swf-star-earned', { detail: { game: 'quiz' } }));
    });
    await page.waitForTimeout(500);
    // Should still only have 1 star-tick element (the pre-existing one prevents duplication)
    const ticks = page.locator('.star-tick[data-game="quiz"]');
    await expect(ticks).toHaveCount(1);
  });
});
