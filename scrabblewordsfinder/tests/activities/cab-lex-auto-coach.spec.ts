import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

/**
 * CaB — Auto-Coach on First Lex Open
 * When the user opens the Lex AI modal for the first time AND they have
 * game history (score), coaching should auto-trigger without requiring
 * the user to click "Coach me on my games".
 */

test.describe('CaB Auto-Coach on First Open — Positive', () => {
  test('auto-coaches on first open when user has game history', async ({ page }) => {
    let chatCalled = false;
    let chatBody = '';

    // Set up a mock UID in localStorage before navigating
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-user-auto-coach');
    });

    // Mock CaB API to return game history
    await page.route('**/api/cab/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          rounds: [
            { word: 'HELLO', length: 5, solved: true, attempts: 3, timer_duration: 120, split_time: 45 },
            { word: 'WORLD', length: 5, solved: false, attempts: 8, timer_duration: 120 }
          ],
          count: 2
        })
      });
    });

    // Mock chat API
    await page.route('**/api/chat/', async (route, request) => {
      chatCalled = true;
      chatBody = await request.postData() || '';
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'data: {"response":"Great job on HELLO!"}\ndata: [DONE]\n'
      });
    });

    await page.goto(ACTIVITIES_URL);

    // Open Lex modal — should auto-trigger coaching
    await page.locator('#LexCandB').click();
    await page.locator('#cab-lex-modal').waitFor({ state: 'visible' });

    // Wait for the auto-coach fetch chain to complete
    await page.waitForTimeout(2000);

    expect(chatCalled).toBe(true);
    expect(chatBody).toContain('COACHING REQUEST');
  });

  test('auto-coach does NOT trigger on second open', async ({ page }) => {
    let chatCallCount = 0;

    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-user-second-open');
    });

    await page.route('**/api/cab/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          rounds: [{ word: 'TEST', length: 4, solved: true, attempts: 4 }],
          count: 1
        })
      });
    });

    await page.route('**/api/chat/', async (route) => {
      chatCallCount++;
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'data: {"response":"Coaching response"}\ndata: [DONE]\n'
      });
    });

    await page.goto(ACTIVITIES_URL);

    // First open — auto-coach fires
    await page.locator('#LexCandB').click();
    await page.locator('#cab-lex-modal').waitFor({ state: 'visible' });
    await page.waitForTimeout(2000);

    // Close modal
    await page.locator('#cab-lex-close').click();
    await page.locator('#cab-lex-modal').waitFor({ state: 'hidden' });

    // Second open — should NOT auto-coach again
    await page.locator('#LexCandB').click();
    await page.locator('#cab-lex-modal').waitFor({ state: 'visible' });
    await page.waitForTimeout(1000);

    // Only 1 chat call total (from first open)
    expect(chatCallCount).toBe(1);
  });
});

test.describe('CaB Auto-Coach on First Open — Negative', () => {
  test('does NOT auto-coach when user has no game history', async ({ page }) => {
    let chatCalled = false;

    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-user-no-history');
    });

    await page.route('**/api/cab/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ rounds: [], count: 0 })
      });
    });

    await page.route('**/api/chat/', async (route) => {
      chatCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'data: {"response":"tips"}\ndata: [DONE]\n'
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.locator('#LexCandB').click();
    await page.locator('#cab-lex-modal').waitFor({ state: 'visible' });
    await page.waitForTimeout(1500);

    // No game history = no auto-coach
    expect(chatCalled).toBe(false);
  });

  test('does NOT auto-coach when CaB API returns no rounds (empty history)', async ({ page }) => {
    let chatCalled = false;

    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-user-empty-rounds');
    });

    // Return empty rounds from the CaB API
    await page.route('**/api/cab/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ rounds: [], count: 0 })
      });
    });

    await page.route('**/api/chat/', async (route) => {
      chatCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'data: {"response":"tips"}\ndata: [DONE]\n'
      });
    });

    await page.goto(ACTIVITIES_URL);
    await page.locator('#LexCandB').click();
    await page.locator('#cab-lex-modal').waitFor({ state: 'visible' });
    await page.waitForTimeout(1500);

    // Empty rounds = no auto-coach (the code checks rounds.length === 0)
    expect(chatCalled).toBe(false);
  });
});
