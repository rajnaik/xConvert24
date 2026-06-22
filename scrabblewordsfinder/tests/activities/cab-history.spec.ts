import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

/**
 * CaB (Cows and Bulls) — History Feature Tests
 * Tests the history button, round list, and inspect drill-down.
 */

test.describe('CaB History — Positive', () => {
  test('history button is visible when user has 1+ rounds', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-history-user');
    });

    // Mock GET /api/cab?user_id=... to return 2 rounds
    await page.route('**/api/cab/?user_id=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          rounds: [
            { id: 10, solved: 1, attempts: 5, startDatetime: '2026-06-20 10:00:00', word: 'FLAME', length: 5 },
            { id: 9, solved: 0, attempts: 8, startDatetime: '2026-06-19 14:30:00', word: 'CRISP', length: 5 },
          ],
          count: 2,
        }),
      });
    });

    await page.goto(ACTIVITIES_URL);

    // History button should be visible
    const historyBtn = page.locator('#cab-history-btn');
    await expect(historyBtn).toBeVisible({ timeout: 5000 });
  });

  test('clicking history button shows the history panel with rounds', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-history-user');
    });

    await page.route('**/api/cab/?user_id=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          rounds: [
            { id: 10, solved: 1, attempts: 5, startDatetime: '2026-06-20 10:00:00', word: 'FLAME', length: 5 },
            { id: 9, solved: 0, attempts: 8, startDatetime: '2026-06-19 14:30:00', word: 'CRISP', length: 5 },
          ],
          count: 2,
        }),
      });
    });

    await page.goto(ACTIVITIES_URL);

    await page.locator('#cab-history-btn').click();

    // History panel should be visible
    const panel = page.locator('#cab-history-panel');
    await expect(panel).toBeVisible({ timeout: 3000 });

    // Should show "Your Rounds" heading
    await expect(panel.locator('h3')).toHaveText('Your Rounds');

    // Should show 2 round entries
    const rounds = panel.locator('#cab-history-list > div');
    await expect(rounds).toHaveCount(2);

    // First round shows FLAME
    await expect(rounds.first()).toContainText('FLAME');
    await expect(rounds.first()).toContainText('Solved');

    // Second round shows CRISP (failed)
    await expect(rounds.nth(1)).toContainText('CRISP');
    await expect(rounds.nth(1)).toContainText('Failed');
  });

  test('clicking inspect icon shows the round guesses', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-history-user');
    });

    // Mock history list
    await page.route('**/api/cab/?user_id=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          rounds: [
            { id: 10, solved: 1, attempts: 3, startDatetime: '2026-06-20 10:00:00', word: 'FLAME', length: 5 },
            { id: 9, solved: 1, attempts: 2, startDatetime: '2026-06-19 14:30:00', word: 'CRISP', length: 5 },
          ],
          count: 2,
        }),
      });
    });

    // Mock inspect endpoint for round 10
    await page.route('**/api/cab/?round=10', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          game: { id: 10, solved: 1, attempts: 3, startDatetime: '2026-06-20 10:00:00', word: 'FLAME', length: 5 },
          guesses: [
            { guess_number: 1, guess: 'CRANE', bulls: 1, cows: 1, feedback: '["miss","miss","cow","miss","bull"]' },
            { guess_number: 2, guess: 'FLAKE', bulls: 3, cows: 1, feedback: '["bull","bull","miss","miss","bull"]' },
            { guess_number: 3, guess: 'FLAME', bulls: 5, cows: 0, feedback: '["bull","bull","bull","bull","bull"]' },
          ],
        }),
      });
    });

    await page.goto(ACTIVITIES_URL);

    // Open history
    await page.locator('#cab-history-btn').click();
    await expect(page.locator('#cab-history-panel')).toBeVisible({ timeout: 3000 });

    // Click inspect on first round
    const inspectBtns = page.locator('#cab-history-list button[title="Inspect round"]');
    await inspectBtns.first().click();

    // Inspect panel should be visible
    const inspectPanel = page.locator('#cab-inspect-panel');
    await expect(inspectPanel).toBeVisible({ timeout: 3000 });

    // Should show round info
    await expect(page.locator('#cab-inspect-info')).toContainText('FLAME');
    await expect(page.locator('#cab-inspect-info')).toContainText('Solved');

    // Should show 3 guesses
    const guessRows = page.locator('#cab-inspect-guesses > div');
    await expect(guessRows).toHaveCount(3);

    // First guess should show CRANE
    await expect(guessRows.first()).toContainText('#1');
  });

  test('close button on inspect panel returns to history', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-history-user');
    });

    await page.route('**/api/cab/?user_id=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          rounds: [
            { id: 10, solved: 1, attempts: 3, startDatetime: '2026-06-20 10:00:00', word: 'FLAME', length: 5 },
            { id: 9, solved: 1, attempts: 2, startDatetime: '2026-06-19 14:30:00', word: 'CRISP', length: 5 },
          ],
          count: 2,
        }),
      });
    });

    await page.route('**/api/cab/?round=10', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          game: { id: 10, solved: 1, attempts: 3, startDatetime: '2026-06-20 10:00:00', word: 'FLAME', length: 5 },
          guesses: [
            { guess_number: 1, guess: 'CRANE', bulls: 1, cows: 1, feedback: '["miss","miss","cow","miss","bull"]' },
          ],
        }),
      });
    });

    await page.goto(ACTIVITIES_URL);

    await page.locator('#cab-history-btn').click();
    await page.locator('#cab-history-list button[title="Inspect round"]').first().click();
    await expect(page.locator('#cab-inspect-panel')).toBeVisible();

    // Click back button
    await page.locator('#cab-inspect-close').click();

    // Inspect panel hidden, history panel visible
    await expect(page.locator('#cab-inspect-panel')).toBeHidden();
    await expect(page.locator('#cab-history-panel')).toBeVisible();
  });
});

test.describe('CaB History — Negative', () => {
  test('history button is visible when user has exactly 1 round', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-one-round-user');
    });

    // Mock GET returns 1 round — threshold is now >= 1
    await page.route('**/api/cab/?user_id=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ rounds: [{ id: 1, solved: 1, attempts: 3, startDatetime: '2026-06-20', word: 'TEST', length: 4 }], count: 1 }),
      });
    });

    await page.goto(ACTIVITIES_URL);

    // History button should be visible with 1 round (threshold changed from 2 to 1)
    const historyBtn = page.locator('#cab-history-btn');
    await expect(historyBtn).toBeVisible({ timeout: 5000 });
  });

  test('history button is hidden when user has zero rounds', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-new-user');
    });

    // Mock GET returns 0 rounds
    await page.route('**/api/cab/?user_id=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ rounds: [], count: 0 }),
      });
    });

    await page.goto(ACTIVITIES_URL);

    // Wait a beat for the check to complete
    await page.waitForTimeout(1000);

    // History button should remain hidden with 0 rounds
    const historyBtnWrap = page.locator('#cab-history-btn-wrap');
    await expect(historyBtnWrap).toHaveClass(/hidden/);
  });

  test('history button is hidden when user has no uid', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('swf-uid');
    });

    await page.goto(ACTIVITIES_URL);

    await page.waitForTimeout(1000);

    // History button should remain hidden
    const historyBtnWrap = page.locator('#cab-history-btn-wrap');
    await expect(historyBtnWrap).toHaveClass(/hidden/);
  });

  test('history panel shows empty state when API returns no rounds', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-empty-user');
    });

    // First call returns count=2 (to show button), then actual load returns empty
    let callCount = 0;
    await page.route('**/api/cab/?user_id=*', async (route) => {
      callCount++;
      if (callCount === 1) {
        // Initial check — report 2 to show button
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ rounds: [{}, {}], count: 2 }),
        });
      } else {
        // On click — return empty
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ rounds: [], count: 0 }),
        });
      }
    });

    await page.goto(ACTIVITIES_URL);

    await page.locator('#cab-history-btn').click({ timeout: 5000 });

    // Empty message should show
    await expect(page.locator('#cab-history-empty')).toBeVisible({ timeout: 3000 });
  });

  test('inspect panel shows message when no guesses recorded', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-no-guesses-user');
    });

    await page.route('**/api/cab/?user_id=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          rounds: [{ id: 5, solved: 0, attempts: 0, startDatetime: '2026-06-20', word: 'HELLO', length: 5 }],
          count: 2,
        }),
      });
    });

    await page.route('**/api/cab/?round=5', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ game: { id: 5, solved: 0, attempts: 0, word: 'HELLO', length: 5 }, guesses: [] }),
      });
    });

    await page.goto(ACTIVITIES_URL);

    await page.locator('#cab-history-btn').click({ timeout: 5000 });
    await page.locator('#cab-history-list button[title="Inspect round"]').first().click();

    await expect(page.locator('#cab-inspect-guesses')).toContainText('No guesses recorded');
  });

  test('closing history panel restores the setup view', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-close-user');
    });

    await page.route('**/api/cab/?user_id=*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          rounds: [{ id: 1, solved: 1, attempts: 3, word: 'ABCD', length: 4 }, { id: 2, solved: 0, attempts: 5, word: 'EFGH', length: 4 }],
          count: 2,
        }),
      });
    });

    await page.goto(ACTIVITIES_URL);

    await page.locator('#cab-history-btn').click({ timeout: 5000 });
    await expect(page.locator('#cab-history-panel')).toBeVisible();

    // Close history
    await page.locator('#cab-history-close').click();

    // History panel hidden, setup visible
    await expect(page.locator('#cab-history-panel')).toBeHidden();
    await expect(page.locator('#cab-setup')).toBeVisible();
  });
});
