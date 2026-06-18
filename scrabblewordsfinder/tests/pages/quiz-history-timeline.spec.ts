import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const QUIZ_HISTORY_URL = `${BASE_URL}/quiz-history/`;

/**
 * Quiz History — Track Timeline Feature
 * Tests the expandable per-question timeline that shows split times,
 * words, meanings, and correct/wrong indicators.
 */

// ── Positive Tests ────────────────────────────────────────────────────────

test.describe('Quiz History Timeline — Positive', () => {
  test('Track column header exists in the table', async ({ page }) => {
    await page.goto(QUIZ_HISTORY_URL);
    const trackHeader = page.locator('thead th', { hasText: 'Track' });
    await expect(trackHeader).toBeVisible();
  });

  test('track button appears for rows with detail data', async ({ page }) => {
    // Seed localStorage with a UID that has quiz history with details
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-timeline-user');
    });

    // Mock the API to return scores with details
    await page.route('**/api/quiz-scores/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          scores: [
            {
              id: 1,
              user_id: 'test-timeline-user',
              score: 2,
              total: 3,
              time_used: 25,
              timer_limit: 90,
              timed_out: 0,
              details: JSON.stringify([
                { word: 'QUIXOTIC', meaning: 'exceedingly idealistic', correct: true, split_time: 5 },
                { word: 'ZEPHYR', meaning: 'a gentle breeze', correct: false, split_time: 12 },
                { word: 'JINX', meaning: 'brings bad luck', correct: true, split_time: 8 },
              ]),
              created_at: '2026-06-18 10:00:00',
            },
          ],
        }),
      });
    });

    await page.goto(QUIZ_HISTORY_URL);
    await page.waitForSelector('#qh-content:not(.hidden)', { timeout: 5000 });

    const trackBtn = page.locator('[data-track-btn="0"]');
    await expect(trackBtn).toBeVisible();
  });

  test('clicking track button expands timeline with question details', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-timeline-user');
    });

    await page.route('**/api/quiz-scores/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          scores: [
            {
              id: 1,
              user_id: 'test-timeline-user',
              score: 2,
              total: 3,
              time_used: 25,
              timer_limit: 90,
              timed_out: 0,
              details: JSON.stringify([
                { word: 'QUIXOTIC', meaning: 'exceedingly idealistic', correct: true, split_time: 5 },
                { word: 'ZEPHYR', meaning: 'a gentle breeze', correct: false, split_time: 12 },
                { word: 'JINX', meaning: 'brings bad luck', correct: true, split_time: 8 },
              ]),
              created_at: '2026-06-18 10:00:00',
            },
          ],
        }),
      });
    });

    await page.goto(QUIZ_HISTORY_URL);
    await page.waitForSelector('#qh-content:not(.hidden)', { timeout: 5000 });

    // Click the track button
    await page.locator('[data-track-btn="0"]').click();

    // Timeline row should become visible
    const timelineRow = page.locator('#qh-timeline-0');
    await expect(timelineRow).toBeVisible();

    // Should show all 3 words
    await expect(timelineRow.locator('text=QUIXOTIC')).toBeVisible();
    await expect(timelineRow.locator('text=ZEPHYR')).toBeVisible();
    await expect(timelineRow.locator('text=JINX')).toBeVisible();
  });

  test('timeline shows split times for each question', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-timeline-user');
    });

    await page.route('**/api/quiz-scores/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          scores: [
            {
              id: 1,
              user_id: 'test-timeline-user',
              score: 1,
              total: 2,
              time_used: 17,
              timer_limit: 90,
              timed_out: 0,
              details: JSON.stringify([
                { word: 'AXIOM', meaning: 'a self-evident truth', correct: true, split_time: 7 },
                { word: 'FJORD', meaning: 'a narrow inlet', correct: false, split_time: 10 },
              ]),
              created_at: '2026-06-18 09:00:00',
            },
          ],
        }),
      });
    });

    await page.goto(QUIZ_HISTORY_URL);
    await page.waitForSelector('#qh-content:not(.hidden)', { timeout: 5000 });
    await page.locator('[data-track-btn="0"]').click();

    const timelineRow = page.locator('#qh-timeline-0');
    await expect(timelineRow.locator('text=7s')).toBeVisible();
    await expect(timelineRow.locator('text=10s')).toBeVisible();
  });

  test('clicking track button again closes the timeline (toggle)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-timeline-user');
    });

    await page.route('**/api/quiz-scores/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          scores: [
            {
              id: 1,
              user_id: 'test-timeline-user',
              score: 3,
              total: 3,
              time_used: 15,
              timer_limit: 90,
              timed_out: 0,
              details: JSON.stringify([
                { word: 'CAT', meaning: 'a small feline', correct: true, split_time: 3 },
                { word: 'DOG', meaning: 'a canine', correct: true, split_time: 5 },
                { word: 'OX', meaning: 'a bovine', correct: true, split_time: 7 },
              ]),
              created_at: '2026-06-18 08:00:00',
            },
          ],
        }),
      });
    });

    await page.goto(QUIZ_HISTORY_URL);
    await page.waitForSelector('#qh-content:not(.hidden)', { timeout: 5000 });

    const btn = page.locator('[data-track-btn="0"]');
    const timelineRow = page.locator('#qh-timeline-0');

    // Open
    await btn.click();
    await expect(timelineRow).toBeVisible();

    // Close
    await btn.click();
    await expect(timelineRow).toBeHidden();
  });
});

// ── Negative Tests ────────────────────────────────────────────────────────

test.describe('Quiz History Timeline — Negative', () => {
  test('rows without details show dash instead of track button', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-no-details-user');
    });

    await page.route('**/api/quiz-scores/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          scores: [
            {
              id: 1,
              user_id: 'test-no-details-user',
              score: 5,
              total: 5,
              time_used: 30,
              timer_limit: 90,
              timed_out: 0,
              details: '',
              created_at: '2026-06-18 10:00:00',
            },
          ],
        }),
      });
    });

    await page.goto(QUIZ_HISTORY_URL);
    await page.waitForSelector('#qh-content:not(.hidden)', { timeout: 5000 });

    // No track button should exist for this row
    const trackBtn = page.locator('[data-track-btn="0"]');
    await expect(trackBtn).toHaveCount(0);

    // Should show a dash placeholder
    const dash = page.locator('td:last-child span[title="No detail data"]');
    await expect(dash).toBeVisible();
  });

  test('only one timeline is open at a time (accordion behaviour)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-accordion-user');
    });

    await page.route('**/api/quiz-scores/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          scores: [
            {
              id: 1, user_id: 'test-accordion-user', score: 2, total: 3,
              time_used: 20, timer_limit: 90, timed_out: 0,
              details: JSON.stringify([{ word: 'A', meaning: 'first', correct: true, split_time: 3 }]),
              created_at: '2026-06-18 10:00:00',
            },
            {
              id: 2, user_id: 'test-accordion-user', score: 1, total: 3,
              time_used: 30, timer_limit: 90, timed_out: 0,
              details: JSON.stringify([{ word: 'B', meaning: 'second', correct: false, split_time: 8 }]),
              created_at: '2026-06-17 10:00:00',
            },
          ],
        }),
      });
    });

    await page.goto(QUIZ_HISTORY_URL);
    await page.waitForSelector('#qh-content:not(.hidden)', { timeout: 5000 });

    // Open first
    await page.locator('[data-track-btn="0"]').click();
    await expect(page.locator('#qh-timeline-0')).toBeVisible();

    // Open second — first should close
    await page.locator('[data-track-btn="1"]').click();
    await expect(page.locator('#qh-timeline-1')).toBeVisible();
    await expect(page.locator('#qh-timeline-0')).toBeHidden();
  });

  test('no JS errors when rendering timeline with missing meaning field', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-missing-meaning');
    });

    await page.route('**/api/quiz-scores/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          scores: [
            {
              id: 1, user_id: 'test-missing-meaning', score: 1, total: 2,
              time_used: 10, timer_limit: 90, timed_out: 0,
              details: JSON.stringify([
                { word: 'XYLOPHONE', correct: true, split_time: 4 },
                { word: 'QUAFF', meaning: null, correct: false, split_time: 6 },
              ]),
              created_at: '2026-06-18 10:00:00',
            },
          ],
        }),
      });
    });

    await page.goto(QUIZ_HISTORY_URL);
    await page.waitForSelector('#qh-content:not(.hidden)', { timeout: 5000 });
    await page.locator('[data-track-btn="0"]').click();
    await page.waitForSelector('#qh-timeline-0:not(.hidden)', { timeout: 3000 });

    // Should show fallback text instead of crashing
    await expect(page.locator('#qh-timeline-0')).toContainText('No definition available');
    expect(errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'))).toHaveLength(0);
  });

  test('no duplicate timeline rows are rendered', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-no-dup');
    });

    await page.route('**/api/quiz-scores/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          scores: [
            {
              id: 1, user_id: 'test-no-dup', score: 3, total: 3,
              time_used: 15, timer_limit: 90, timed_out: 0,
              details: JSON.stringify([{ word: 'ZAP', meaning: 'to strike', correct: true, split_time: 5 }]),
              created_at: '2026-06-18 10:00:00',
            },
          ],
        }),
      });
    });

    await page.goto(QUIZ_HISTORY_URL);
    await page.waitForSelector('#qh-content:not(.hidden)', { timeout: 5000 });

    // Only one timeline row should exist for row 0
    const timelineRows = page.locator('#qh-timeline-0');
    await expect(timelineRows).toHaveCount(1);
  });
});
