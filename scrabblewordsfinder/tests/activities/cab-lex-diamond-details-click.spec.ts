import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

/**
 * CaB — Diamond Hunt Details Button Click Behaviour
 * When the user clicks "💎 Diamond Hunt - Details", Lex AI should receive
 * a prompt asking it to explain the Diamond Hunt and Badges system.
 * The user message bubble should show a friendly shortened text.
 */

test.describe('CaB Diamond Hunt Details Click — Positive', () => {
  test('clicking Diamond Hunt Details adds a user message to the chat', async ({ page }) => {
    // Mock the /api/chat/ to avoid real AI calls
    await page.route('**/api/chat/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'data: {"response":"Diamond Hunt is a feature"}\ndata: [DONE]\n'
      });
    });

    await page.goto(ACTIVITIES_URL);

    // Open Lex modal
    await page.locator('#LexCandB').click();
    await page.locator('#cab-lex-modal').waitFor({ state: 'visible' });

    // Click diamond details button
    await page.locator('#cab-lex-diamond-btn').click();

    // Should show the shortened user message
    const userMsg = page.locator('#cab-lex-messages .lex-msg-user p');
    await expect(userMsg.first()).toContainText('Diamond Hunt');
  });

  test('clicking Diamond Hunt Details triggers a fetch to /api/chat/', async ({ page }) => {
    let chatCalled = false;
    await page.route('**/api/chat/', async (route) => {
      chatCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'data: {"response":"Here is the info"}\ndata: [DONE]\n'
      });
    });

    // Block auto-coach fetch to prevent interference
    await page.route('**/api/cab/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ rounds: [], count: 0 }) });
    });

    await page.goto(ACTIVITIES_URL);

    await page.locator('#LexCandB').click();
    await page.locator('#cab-lex-modal').waitFor({ state: 'visible' });

    // Wait for auto-coach to potentially fire (or not), then click diamond
    await page.waitForTimeout(500);
    await page.locator('#cab-lex-diamond-btn').click();

    // Wait for the fetch to be made
    await page.waitForTimeout(1000);
    expect(chatCalled).toBe(true);
  });
});

test.describe('CaB Diamond Hunt Details Click — Negative', () => {
  test('clicking Diamond Hunt Details does not cause JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('**/api/chat/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'data: {"response":"Info"}\ndata: [DONE]\n'
      });
    });
    await page.route('**/api/cab/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ rounds: [], count: 0 }) });
    });

    await page.goto(ACTIVITIES_URL);
    await page.locator('#LexCandB').click();
    await page.locator('#cab-lex-modal').waitFor({ state: 'visible' });
    await page.waitForTimeout(300);
    await page.locator('#cab-lex-diamond-btn').click();
    await page.waitForTimeout(1000);

    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });

  test('Diamond Hunt Details button does not fire when AI is streaming', async ({ page }) => {
    let chatCallCount = 0;
    await page.route('**/api/chat/', async (route) => {
      chatCallCount++;
      // Simulate slow streaming response
      await new Promise(r => setTimeout(r, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'data: {"response":"Slow response"}\ndata: [DONE]\n'
      });
    });
    await page.route('**/api/cab/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ rounds: [{ word: 'HELLO', length: 5, solved: true, attempts: 3 }], count: 1 }) });
    });

    await page.goto(ACTIVITIES_URL);
    await page.locator('#LexCandB').click();
    await page.locator('#cab-lex-modal').waitFor({ state: 'visible' });

    // Auto-coach fires (because rounds > 0), wait for it to start streaming
    await page.waitForTimeout(800);

    // Try clicking diamond while streaming — should be ignored
    await page.locator('#cab-lex-diamond-btn').click();
    await page.waitForTimeout(300);

    // Only 1 chat call should have been made (from auto-coach), not 2
    expect(chatCallCount).toBe(1);
  });
});
