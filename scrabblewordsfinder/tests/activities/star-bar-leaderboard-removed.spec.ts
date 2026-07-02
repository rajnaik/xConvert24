import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── StarBar Leaderboard Link Removed — Positive ──────────────────────────
// The leaderboard link was removed from StarBar on July 2, 2026.
// These tests confirm the remaining items still render correctly after the removal.

test.describe('StarBar Leaderboard Removed — Positive', () => {
  test('WOTD star icon is still visible after leaderboard removal', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#sb-wotd')).toBeVisible();
  });

  test('Quiz star icon is still visible after leaderboard removal', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#sb-quiz')).toBeVisible();
  });
});

// ── StarBar Leaderboard Link Removed — Negative ──────────────────────────
// Regression prevention: ensure the leaderboard link does not reappear.

test.describe('StarBar Leaderboard Removed — Negative', () => {
  test('no leaderboard link exists in the star bar', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const leaderboardLink = page.locator('#star-bar a[href="/leaderboard/"]');
    await expect(leaderboardLink).toHaveCount(0);
  });

  test('no element with "Board" label text exists in star bar icons row', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    // The old leaderboard had a span with text "Board" — ensure it is gone
    const boardLabels = page.locator('#star-bar').locator('span').filter({ hasText: /^Board$/ });
    await expect(boardLabels).toHaveCount(0);
  });

  test('no Diamond Hunt icon link exists in star bar icons row', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    // The .no-underline diamond hunt icon was removed from the stars row
    const huntIcon = page.locator('#star-bar a.no-underline[href="/diamond-hunt/"]');
    await expect(huntIcon).toHaveCount(0);
  });

  test('no "Hunt" label text exists in star bar icons row', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const huntLabels = page.locator('#star-bar').locator('span').filter({ hasText: /^Hunt$/ });
    await expect(huntLabels).toHaveCount(0);
  });
});
