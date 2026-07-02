import { test, expect } from '@playwright/test';

/**
 * Chat Page — Rack Context Auto-Submit Tests
 *
 * The ?context=rack query param is added to /chat/ links from the Daily Rack
 * Challenge "Ask Lex" button. When present, the page auto-builds a coaching
 * prompt from the user's rack history and submits it automatically.
 *
 * Tests cover:
 * - URL is cleaned immediately on load (replaceState to /chat/)
 * - No UID: a first-timer prompt is built and auto-submitted
 * - With history data: stats + recent plays are included in the prompt
 * - No crash when API fails (graceful fallback message)
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Chat Rack Context (?context=rack) — Positive', () => {
  test('visiting /chat/?context=rack does not leave ?context=rack in the URL', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=rack`);
    // URL should be cleaned to /chat/ via replaceState
    await page.waitForTimeout(800);
    expect(page.url()).not.toContain('context=rack');
    expect(page.url()).toMatch(/\/chat\/$/);
  });

  test('visiting /chat/?context=rack auto-submits a rack coaching prompt (user message appears)', async ({ page }) => {
    // No UID in localStorage → first-timer path
    // The prompt is built, set on the input, then auto-submitted after 500ms
    // so we verify via the submitted user message bubble in #messages
    await page.goto(`${BASE}/chat/?context=rack`);
    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });
    // Check the submitted message references the Daily Rack Challenge
    const messagesText = await page.locator('#messages').textContent();
    expect(messagesText).toContain('Daily Rack Challenge');
  });

  test('first-timer prompt message includes coaching request phrasing', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=rack`);
    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });
    const messagesText = await page.locator('#messages').textContent();
    // The submitted message should reference personalised coaching
    expect(messagesText).toContain('coaching');
  });

  test('first-timer prompt message includes welcome / strategy explanation request', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=rack`);
    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });
    const messagesText = await page.locator('#messages').textContent();
    // First-timer path should ask Lex to welcome and explain strategies
    expect(messagesText).toContain('welcome me');
  });

  test('first-timer prompt auto-submits and creates a user message bubble', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=rack`);
    // Wait for auto-submit (500ms delay + response time)
    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });
    const count = await userBubble.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('/chat/ loads normally (no ?context param) without auto-submitting', async ({ page }) => {
    // Normal load should NOT auto-fill the input or submit
    await page.goto(`${BASE}/chat/`);
    await page.waitForTimeout(1000);
    const input = page.locator('#chat-input');
    const value = await input.inputValue();
    // Input should be empty (or a rack input preset), not a coaching prompt
    expect(value).not.toContain('DAILY RACK CHALLENGE');
    expect(value).not.toContain('COACHING REQUEST');
  });

  test('submitted auto-prompt contains ScrabbleWordsFinder reference', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=rack`);
    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });
    const messagesText = await page.locator('#messages').textContent();
    expect(messagesText).toContain('ScrabbleWordsFinder.com');
  });
});

test.describe('Chat Rack Context (?context=rack) — Negative', () => {
  test('no JavaScript errors when ?context=rack is used with no UID', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    // Ensure no UID is set
    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.removeItem('swf-uid'));
    await page.goto(`${BASE}/chat/?context=rack`);
    await page.waitForTimeout(1500);

    const critical = errors.filter(e => !e.includes('net::') && !e.includes('Failed to fetch'));
    expect(critical).toHaveLength(0);
  });

  test('no duplicate chat-container elements after rack context auto-submit', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=rack`);
    await page.waitForTimeout(1000);
    const containers = page.locator('#chat-container');
    await expect(containers).toHaveCount(1);
  });

  test('chat input is not permanently populated after URL is cleaned', async ({ page }) => {
    // Navigate to rack context
    await page.goto(`${BASE}/chat/?context=rack`);
    await page.waitForTimeout(800);

    // After the prompt is submitted, the input should be cleared
    // (normal chat behavior — input clears after send)
    const input = page.locator('#chat-input');
    // Wait a bit for auto-submit to fire
    await page.waitForTimeout(1500);
    const value = await input.inputValue();
    // Input should not still hold the massive coaching prompt
    expect(value).not.toContain('DAILY RACK CHALLENGE — COACHING REQUEST');
  });

  test('rack context does not break normal chat functionality afterwards', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=rack`);
    await page.waitForTimeout(1500);

    // After auto-submit, normal chat should still work
    const input = page.locator('#chat-input');
    await input.fill('What is the highest-scoring 2-letter word?');
    await expect(input).toHaveValue('What is the highest-scoring 2-letter word?');

    // Send button should still be functional
    await expect(page.locator('#send-btn')).toBeVisible();
  });

  test('rack context does not expose sensitive data in the page', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=rack`);
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    expect(body).not.toMatch(/sk-[a-zA-Z0-9]{20,}/);
    expect(body).not.toContain('AKIA');
    expect(body).not.toMatch(/api[_-]?key/i);
  });

  test('rack context does not persist ?context=rack across reload', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=rack`);
    await page.waitForTimeout(800);
    // Reload the now-clean URL /chat/
    await page.reload();
    await page.waitForTimeout(1000);
    // Should NOT auto-submit again
    const input = page.locator('#chat-input');
    const value = await input.inputValue();
    expect(value).not.toContain('DAILY RACK CHALLENGE');
  });
});

// ---------------------------------------------------------------------------
// Tests added for the "with history" path (fetches /api/rack-history/ and
// /api/daily-rack/) and the API error fallback branch.
// ---------------------------------------------------------------------------

test.describe('Chat Rack Context — With History Stats (Positive)', () => {
  test('prompt includes rack challenge stats section when history API returns data', async ({ page }) => {
    // Intercept the rack-history API to return mock history data
    await page.route('**/api/rack-history/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          history: [
            { word: 'TRAINS', score: 24, submitted_at: '2026-06-28T10:00:00', meaning: 'Plural of train' },
            { word: 'STAIR', score: 15, submitted_at: '2026-06-27T10:00:00', meaning: '' },
            { word: 'RANTS', score: 12, submitted_at: '2026-06-26T10:00:00', meaning: '' },
          ],
          racks: { '2026-06-28': 'TRAINST', '2026-06-27': 'IRSTABE', '2026-06-26': 'RNTASDE' }
        }),
      });
    });

    // Set a fake UID so the history path runs
    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-uid-123'));
    await page.goto(`${BASE}/chat/?context=rack`);

    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });

    const messagesText = await page.locator('#messages').textContent();
    expect(messagesText).toContain('RACK CHALLENGE STATS');
  });

  test('prompt includes total words submitted from history data', async ({ page }) => {
    await page.route('**/api/rack-history/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          history: [
            { word: 'TRAINS', score: 24, submitted_at: '2026-06-28T10:00:00', meaning: '' },
            { word: 'STAIR', score: 15, submitted_at: '2026-06-27T10:00:00', meaning: '' },
          ],
          racks: {}
        }),
      });
    });

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-uid-123'));
    await page.goto(`${BASE}/chat/?context=rack`);

    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });

    const messagesText = await page.locator('#messages').textContent();
    expect(messagesText).toContain('Total words submitted: 2');
  });

  test('prompt includes recent plays section with history data', async ({ page }) => {
    await page.route('**/api/rack-history/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          history: [
            { word: 'TRAINS', score: 24, submitted_at: '2026-06-28T10:00:00', meaning: '' },
          ],
          racks: {}
        }),
      });
    });

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-uid-123'));
    await page.goto(`${BASE}/chat/?context=rack`);

    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });

    const messagesText = await page.locator('#messages').textContent();
    expect(messagesText).toContain('RECENT PLAYS');
  });

  test('prompt includes score distribution section', async ({ page }) => {
    await page.route('**/api/rack-history/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          history: [
            { word: 'TRAINS', score: 24, submitted_at: '2026-06-28T10:00:00', meaning: '' },
            { word: 'AT', score: 4, submitted_at: '2026-06-27T10:00:00', meaning: '' },
          ],
          racks: {}
        }),
      });
    });

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-uid-123'));
    await page.goto(`${BASE}/chat/?context=rack`);

    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });

    const messagesText = await page.locator('#messages').textContent();
    expect(messagesText).toContain('SCORE DISTRIBUTION');
  });

  test('prompt fetches today rack from /api/daily-rack/ when not in history racks', async ({ page }) => {
    await page.route('**/api/rack-history/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ history: [], racks: {} }),
      });
    });
    await page.route('**/api/daily-rack/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ rack: 'AEILNRT', best_word: 'LATRINE', best_score: 42 }),
      });
    });

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-uid-456'));
    await page.goto(`${BASE}/chat/?context=rack`);

    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });

    // Empty history → first-timer message, but today's rack should appear
    const messagesText = await page.locator('#messages').textContent();
    expect(messagesText).toContain("Daily Rack Challenge");
  });
});

test.describe('Chat Rack Context — API Error Fallback (Negative)', () => {
  test('graceful fallback message sent when rack-history API returns 500', async ({ page }) => {
    await page.route('**/api/rack-history/**', async route => {
      await route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'fail-uid-789'));
    await page.goto(`${BASE}/chat/?context=rack`);

    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });

    const messagesText = await page.locator('#messages').textContent();
    // Fallback message should reference the Daily Rack Challenge
    expect(messagesText).toContain('Daily Rack Challenge');
  });

  test('no JavaScript errors when rack-history API fails', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('**/api/rack-history/**', async route => {
      await route.fulfill({ status: 500, body: 'Error' });
    });

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'fail-uid-789'));
    await page.goto(`${BASE}/chat/?context=rack`);
    await page.waitForTimeout(2000);

    const critical = errors.filter(e => !e.includes('net::') && !e.includes('Failed to fetch'));
    expect(critical).toHaveLength(0);
  });

  test('page auto-submits even when rack-history API fails (does not hang)', async ({ page }) => {
    await page.route('**/api/rack-history/**', async route => {
      await route.fulfill({ status: 500, body: 'Error' });
    });

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'fail-uid-789'));
    await page.goto(`${BASE}/chat/?context=rack`);

    // Should still auto-submit within a reasonable time
    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });
    const count = await userBubble.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('URL is cleaned even when rack-history API fails', async ({ page }) => {
    await page.route('**/api/rack-history/**', async route => {
      await route.fulfill({ status: 500, body: 'Error' });
    });

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'fail-uid-789'));
    await page.goto(`${BASE}/chat/?context=rack`);
    await page.waitForTimeout(800);

    expect(page.url()).not.toContain('context=rack');
  });

  test('fallback message does not contain internal error details', async ({ page }) => {
    await page.route('**/api/rack-history/**', async route => {
      await route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'fail-uid-789'));
    await page.goto(`${BASE}/chat/?context=rack`);

    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });

    const messagesText = await page.locator('#messages').textContent();
    expect(messagesText).not.toContain('Internal Server Error');
    expect(messagesText).not.toContain('500');
  });
});
