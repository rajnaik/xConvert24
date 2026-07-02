import { test, expect } from '@playwright/test';

/**
 * Chat Page — Cows and Bulls Context Auto-Submit Tests
 *
 * The ?context=cab query param is added to /chat/ links from the Cows and
 * Bulls "Ask Lex" button. When present, the page auto-builds a coaching
 * prompt from the user's CaB game history and submits it automatically.
 *
 * Tests cover:
 * - URL is cleaned immediately on load (replaceState to /chat/)
 * - No UID: a first-timer prompt is built and auto-submitted
 * - With history data: stats + attempt distribution + recent games included
 * - No crash when API fails (graceful fallback message)
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

// ─── Positive — base behaviour (no UID / first-timer path) ─────────────────

test.describe('Chat CaB Context (?context=cab) — Positive', () => {
  test('visiting /chat/?context=cab does not leave ?context=cab in the URL', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=cab`);
    await page.waitForTimeout(800);
    expect(page.url()).not.toContain('context=cab');
    expect(page.url()).toMatch(/\/chat\/$/);
  });

  test('visiting /chat/?context=cab auto-submits a coaching prompt (user message appears)', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=cab`);
    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });
    const messagesText = await page.locator('#messages').textContent();
    expect(messagesText).toContain('Cows and Bulls');
  });

  test('first-timer prompt includes coaching request phrasing', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=cab`);
    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });
    const messagesText = await page.locator('#messages').textContent();
    expect(messagesText).toContain('coaching');
  });

  test('first-timer prompt includes welcome / strategy explanation request', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=cab`);
    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });
    const messagesText = await page.locator('#messages').textContent();
    expect(messagesText).toContain('welcome me');
  });

  test('first-timer prompt auto-submits and creates a user message bubble', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=cab`);
    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });
    expect(await userBubble.count()).toBeGreaterThanOrEqual(1);
  });

  test('submitted auto-prompt contains ScrabbleWordsFinder.com reference', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=cab`);
    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });
    const messagesText = await page.locator('#messages').textContent();
    expect(messagesText).toContain('ScrabbleWordsFinder.com');
  });

  test('/chat/ loads normally without auto-submitting (no ?context param)', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.waitForTimeout(1000);
    const input = page.locator('#chat-input');
    const value = await input.inputValue();
    expect(value).not.toContain('COWS AND BULLS');
    expect(value).not.toContain('COACHING REQUEST');
  });
});

// ─── Negative — base behaviour ─────────────────────────────────────────────

test.describe('Chat CaB Context (?context=cab) — Negative', () => {
  test('no JavaScript errors when ?context=cab is used with no UID', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.removeItem('swf-uid'));
    await page.goto(`${BASE}/chat/?context=cab`);
    await page.waitForTimeout(1500);

    const critical = errors.filter(e => !e.includes('net::') && !e.includes('Failed to fetch'));
    expect(critical).toHaveLength(0);
  });

  test('no duplicate chat-container elements after CaB context auto-submit', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=cab`);
    await page.waitForTimeout(1000);
    await expect(page.locator('#chat-container')).toHaveCount(1);
  });

  test('chat input is cleared after auto-submit fires', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=cab`);
    await page.waitForTimeout(1500);
    const value = await page.locator('#chat-input').inputValue();
    expect(value).not.toContain('COWS AND BULLS — COACHING REQUEST');
  });

  test('CaB context does not break normal chat functionality afterwards', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=cab`);
    await page.waitForTimeout(1500);
    const input = page.locator('#chat-input');
    await input.fill('What are the best opening words in Cows and Bulls?');
    await expect(input).toHaveValue('What are the best opening words in Cows and Bulls?');
    await expect(page.locator('#send-btn')).toBeVisible();
  });

  test('CaB context does not expose sensitive data in the page', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=cab`);
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    expect(body).not.toMatch(/sk-[a-zA-Z0-9]{20,}/);
    expect(body).not.toContain('AKIA');
    expect(body).not.toMatch(/api[_-]?key/i);
  });

  test('CaB context does not persist ?context=cab across reload', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=cab`);
    await page.waitForTimeout(800);
    await page.reload();
    await page.waitForTimeout(1000);
    const value = await page.locator('#chat-input').inputValue();
    expect(value).not.toContain('COWS AND BULLS');
  });
});

// ─── Positive — with history data ──────────────────────────────────────────

test.describe('Chat CaB Context — With History Stats (Positive)', () => {
  test('prompt includes CaB stats section when history API returns data', async ({ page }) => {
    await page.route('**/api/cab/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          rounds: [
            { solved: 1, attempts: 2, length: 4, startDatetime: '2026-07-01T10:00:00', split_time: 45 },
            { solved: 1, attempts: 4, length: 5, startDatetime: '2026-06-30T10:00:00', split_time: 120 },
            { solved: 0, attempts: 6, length: 4, startDatetime: '2026-06-29T10:00:00', split_time: null },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-cab-uid'));
    await page.goto(`${BASE}/chat/?context=cab`);

    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });

    const messagesText = await page.locator('#messages').textContent();
    expect(messagesText).toContain('COWS & BULLS STATS');
  });

  test('prompt includes total games played count', async ({ page }) => {
    await page.route('**/api/cab/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          rounds: [
            { solved: 1, attempts: 2, length: 4, startDatetime: '2026-07-01T10:00:00', split_time: 30 },
            { solved: 1, attempts: 3, length: 5, startDatetime: '2026-06-30T10:00:00', split_time: 60 },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-cab-uid'));
    await page.goto(`${BASE}/chat/?context=cab`);

    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });

    const messagesText = await page.locator('#messages').textContent();
    expect(messagesText).toContain('Total games played: 2');
  });

  test('prompt includes attempt distribution section', async ({ page }) => {
    await page.route('**/api/cab/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          rounds: [
            { solved: 1, attempts: 1, length: 4, startDatetime: '2026-07-01T10:00:00', split_time: 10 },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-cab-uid'));
    await page.goto(`${BASE}/chat/?context=cab`);

    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });

    const messagesText = await page.locator('#messages').textContent();
    expect(messagesText).toContain('ATTEMPT DISTRIBUTION');
  });

  test('prompt includes recent games section', async ({ page }) => {
    await page.route('**/api/cab/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          rounds: [
            { solved: 1, attempts: 3, length: 5, startDatetime: '2026-07-01T10:00:00', split_time: 90 },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-cab-uid'));
    await page.goto(`${BASE}/chat/?context=cab`);

    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });

    const messagesText = await page.locator('#messages').textContent();
    expect(messagesText).toContain('RECENT GAMES');
  });

  test('prompt includes actionable tips request at the end', async ({ page }) => {
    await page.route('**/api/cab/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          rounds: [
            { solved: 1, attempts: 2, length: 4, startDatetime: '2026-07-01T10:00:00', split_time: 40 },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-cab-uid'));
    await page.goto(`${BASE}/chat/?context=cab`);

    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });

    const messagesText = await page.locator('#messages').textContent();
    expect(messagesText).toContain('actionable tips');
  });
});

// ─── Negative — API error fallback ─────────────────────────────────────────

test.describe('Chat CaB Context — API Error Fallback (Negative)', () => {
  test('graceful fallback message sent when CaB API returns 500', async ({ page }) => {
    await page.route('**/api/cab/**', async route => {
      await route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'fail-cab-uid'));
    await page.goto(`${BASE}/chat/?context=cab`);

    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });

    const messagesText = await page.locator('#messages').textContent();
    expect(messagesText).toContain('Cows and Bulls');
  });

  test('no JavaScript errors when CaB API fails', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('**/api/cab/**', async route => {
      await route.fulfill({ status: 500, body: 'Error' });
    });

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'fail-cab-uid'));
    await page.goto(`${BASE}/chat/?context=cab`);
    await page.waitForTimeout(2000);

    const critical = errors.filter(e => !e.includes('net::') && !e.includes('Failed to fetch'));
    expect(critical).toHaveLength(0);
  });

  test('page auto-submits even when CaB API fails (does not hang)', async ({ page }) => {
    await page.route('**/api/cab/**', async route => {
      await route.fulfill({ status: 500, body: 'Error' });
    });

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'fail-cab-uid'));
    await page.goto(`${BASE}/chat/?context=cab`);

    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });
    expect(await userBubble.count()).toBeGreaterThanOrEqual(1);
  });

  test('URL is cleaned even when CaB API fails', async ({ page }) => {
    await page.route('**/api/cab/**', async route => {
      await route.fulfill({ status: 500, body: 'Error' });
    });

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'fail-cab-uid'));
    await page.goto(`${BASE}/chat/?context=cab`);
    await page.waitForTimeout(800);

    expect(page.url()).not.toContain('context=cab');
  });

  test('fallback message does not contain internal error details', async ({ page }) => {
    await page.route('**/api/cab/**', async route => {
      await route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'fail-cab-uid'));
    await page.goto(`${BASE}/chat/?context=cab`);

    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });

    const messagesText = await page.locator('#messages').textContent();
    expect(messagesText).not.toContain('Internal Server Error');
    expect(messagesText).not.toContain('500');
  });
});
