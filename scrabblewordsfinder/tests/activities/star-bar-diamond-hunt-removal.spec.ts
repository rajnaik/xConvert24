import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

/**
 * StarBar Diamond Hunt Icon Button — REMOVED from stars row (July 2, 2026)
 * The purple "Hunt" icon button (with badge "121") was removed from the
 * StarBar stars row. The text-style Diamond Hunt link in the stats section remains.
 * These tests verify the removal is clean and no ghost elements linger.
 */

// ── StarBar Diamond Hunt Icon Removal — Positive ─────────────────────────────

test.describe('StarBar Diamond Hunt Icon Removal — Positive', () => {
  test('purple Hunt icon button is no longer in the stars row', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    // The old icon was an <a> with class .no-underline in the stars row
    const oldHuntIcon = page.locator('#star-bar .flex.items-end a.no-underline[href="/diamond-hunt/"]');
    await expect(oldHuntIcon).toHaveCount(0);
  });

  test('StarBar stats still show the Diamond Hunt text link', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const statsLink = page.locator('#sb-diamond-hunt-link');
    await expect(statsLink).toBeVisible();
    await expect(statsLink).toHaveAttribute('href', '/diamond-hunt/');
  });

  test('other StarBar star items still render correctly', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#sb-wotd')).toBeVisible();
    await expect(page.locator('#sb-quiz')).toBeVisible();
    await expect(page.locator('#sb-wordbench')).toBeVisible();
    await expect(page.locator('#sb-rack')).toBeVisible();
  });
});

// ── StarBar Diamond Hunt Icon Removal — Negative ─────────────────────────────

test.describe('StarBar Diamond Hunt Icon Removal — Negative', () => {
  test('no purple "Hunt" label remains in the stars row', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    // The old icon had a span with text "Hunt" in purple
    const huntLabel = page.locator('#star-bar .flex.items-end span.text-purple-400:has-text("Hunt")');
    await expect(huntLabel).toHaveCount(0);
  });

  test('no JavaScript errors after icon removal', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(ACTIVITIES_URL);
    await page.waitForLoadState('networkidle');

    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
