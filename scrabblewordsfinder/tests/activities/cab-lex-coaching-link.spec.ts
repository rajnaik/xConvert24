import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

/**
 * CaB — Lex AI Coaching Button
 * The "Lex" element in the CaB panel header opens an AI coaching experience.
 * It was changed from an anchor link to a button (#LexCandB) that triggers
 * inline behaviour rather than navigating away.
 */

test.describe('CaB Lex Coaching Button — Positive', () => {
  test('Lex coaching button is visible in the CaB panel header', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const lexBtn = page.locator('#LexCandB');
    await expect(lexBtn).toBeVisible();
  });

  test('Lex button is a button element with correct type', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const lexBtn = page.locator('#LexCandB');
    await expect(lexBtn).toHaveAttribute('type', 'button');
  });

  test('Lex button contains the Lex avatar image', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const lexImg = page.locator('#LexCandB img[alt="Lex"]');
    await expect(lexImg).toBeVisible();
  });

  test('Lex button has descriptive title for accessibility', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const lexBtn = page.locator('#LexCandB');
    await expect(lexBtn).toHaveAttribute('title', 'Get AI coaching on your Cows and Bulls skills');
  });

  test('Lex button and history button coexist in the same flex container', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-lex-coexist');
    });

    // Provide history data so the history button becomes visible
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

    // Both the Lex button and the history button wrap should be in the same flex container
    const flexContainer = page.locator('#cab .flex.items-center.gap-2').last();
    const lexBtn = flexContainer.locator('#LexCandB');
    const historyWrap = flexContainer.locator('#cab-history-btn-wrap');

    await expect(lexBtn).toBeVisible();
    await expect(historyWrap).toBeAttached();
  });
});

test.describe('CaB Lex Coaching Button — Negative', () => {
  test('no duplicate Lex coaching buttons exist in the CaB panel', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const lexBtns = page.locator('#LexCandB');
    await expect(lexBtns).toHaveCount(1);
  });

  test('Lex button does not cause JavaScript errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(ACTIVITIES_URL);
    await page.locator('#LexCandB').waitFor({ state: 'visible' });

    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });

  test('Lex avatar image has non-empty alt text for accessibility', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const lexImg = page.locator('#LexCandB img');
    const alt = await lexImg.getAttribute('alt');
    expect(alt).toBeTruthy();
    expect(alt!.trim().length).toBeGreaterThan(0);
  });

  test('Lex button is not an anchor — no href attribute', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const lexBtn = page.locator('#LexCandB');
    const href = await lexBtn.getAttribute('href');
    expect(href).toBeNull();
  });
});
