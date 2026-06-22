import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

/**
 * CaB History Icon — Position & Layout Tests
 * After the refactor, the history button is an icon-only button in the header row
 * (next to the h2 title), not a standalone button below the description.
 */

test.describe('CaB History Icon Position — Positive', () => {
  test('history icon is inside the header flex container', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-icon-pos');
    });

    await page.route('**/api/cab/?user_id=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          rounds: [{ id: 1, solved: 1, attempts: 3, startDatetime: '2026-06-20', word: 'TEST', length: 4 }],
          count: 1,
        }),
      });
    });

    await page.goto(ACTIVITIES_URL);

    // The history button wrapper should be a sibling of the h2 inside the header row
    const headerRow = page.locator('#cab > div.flex.items-center.justify-between').first();
    await expect(headerRow).toBeVisible();

    // h2 and history button wrapper are both direct children of that header
    const h2 = headerRow.locator('h2');
    const historyWrap = headerRow.locator('#cab-history-btn-wrap');
    await expect(h2).toBeVisible();
    await expect(historyWrap).toBeAttached();
  });

  test('history icon has correct title attribute for accessibility', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-icon-title');
    });

    await page.route('**/api/cab/?user_id=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          rounds: [{ id: 1, solved: 1, attempts: 3, startDatetime: '2026-06-20', word: 'WORD', length: 4 }],
          count: 1,
        }),
      });
    });

    await page.goto(ACTIVITIES_URL);

    const btn = page.locator('#cab-history-btn');
    await expect(btn).toBeVisible({ timeout: 5000 });
    await expect(btn).toHaveAttribute('title', 'View history');
  });

  test('history icon contains an SVG clock icon', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-icon-svg');
    });

    await page.route('**/api/cab/?user_id=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          rounds: [{ id: 1, solved: 1, attempts: 2, startDatetime: '2026-06-20', word: 'PLAY', length: 4 }],
          count: 1,
        }),
      });
    });

    await page.goto(ACTIVITIES_URL);

    const svg = page.locator('#cab-history-btn svg');
    await expect(svg).toBeVisible({ timeout: 5000 });
    await expect(svg).toHaveClass(/w-4 h-4/);
  });
});

test.describe('CaB History Icon Position — Negative', () => {
  test('no duplicate history buttons exist in the panel', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-no-dup');
    });

    await page.route('**/api/cab/?user_id=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          rounds: [{ id: 1, solved: 1, attempts: 3, startDatetime: '2026-06-20', word: 'TEST', length: 4 }],
          count: 1,
        }),
      });
    });

    await page.goto(ACTIVITIES_URL);

    // There should be exactly one element with id cab-history-btn
    const btns = page.locator('#cab-history-btn');
    await expect(btns).toHaveCount(1);

    // And exactly one wrapper
    const wraps = page.locator('#cab-history-btn-wrap');
    await expect(wraps).toHaveCount(1);
  });

  test('history button does not contain text label (icon-only)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-no-text');
    });

    await page.route('**/api/cab/?user_id=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          rounds: [{ id: 1, solved: 1, attempts: 3, startDatetime: '2026-06-20', word: 'ABCD', length: 4 }],
          count: 1,
        }),
      });
    });

    await page.goto(ACTIVITIES_URL);

    const btn = page.locator('#cab-history-btn');
    await expect(btn).toBeVisible({ timeout: 5000 });

    // Button should NOT have visible text "History" — it's icon-only now
    const text = await btn.innerText();
    expect(text.trim()).toBe('');
  });
});
