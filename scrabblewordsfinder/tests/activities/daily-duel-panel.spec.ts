import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── Daily Duel Panel — Hidden (Phase 2 Multiplayer) ────────────────────────────
// The DailyDuelPanel was removed from activities.astro on July 2, 2026.
// It is planned for Phase 2 multiplayer. These tests verify it is NOT rendered.

test.describe('Daily Duel Panel — Positive (hidden state)', () => {
  test('Daily Duel panel is NOT visible on activities page', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const heading = page.locator('h2', { hasText: 'Daily Duel' });
    await expect(heading).toHaveCount(0);
  });

  test('activities page loads without errors when Daily Duel is hidden', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('other activity panels are still visible', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    // Verify key panels are still rendered
    const wotdHeading = page.locator('h2', { hasText: 'Word of the Day' });
    await expect(wotdHeading).toBeVisible();
  });

  test('activities page grid renders correctly without Daily Duel', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    // The grid should still have panels — just not the Duel panel
    const gridPanels = page.locator('.grid.grid-cols-1 > *');
    const count = await gridPanels.count();
    // Should have panels (StarBar, WOTD, Quiz, WordBench, Rack, Anagram, 60s, CaB = 8)
    expect(count).toBeGreaterThanOrEqual(7);
  });
});

test.describe('Daily Duel Panel — Negative (hidden state)', () => {
  test('no Daily Duel input field exists', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const input = page.locator('#dd-input');
    await expect(input).toHaveCount(0);
  });

  test('no Daily Duel submit button exists', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const submitBtn = page.locator('#dd-submit');
    await expect(submitBtn).toHaveCount(0);
  });

  test('no Daily Duel star indicator rendered', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const starIndicator = page.locator('.star-indicator[data-game="duel"]');
    await expect(starIndicator).toHaveCount(0);
  });

  test('no orphan Daily Duel elements on the page', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    // Check for any leftover dd-* prefixed IDs
    const ddContent = page.locator('#dd-content');
    const ddTiles = page.locator('#dd-tiles');
    const ddTop = page.locator('#dd-top');
    expect(await ddContent.count()).toBe(0);
    expect(await ddTiles.count()).toBe(0);
    expect(await ddTop.count()).toBe(0);
  });
});
