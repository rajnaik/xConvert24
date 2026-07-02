import { test, expect } from '@playwright/test';

/**
 * Chat Page — Anagram Context Auto-Submit Tests
 *
 * The ?context=anagram query param is added to /chat/ links from the Daily
 * Anagram "Ask Lex" button. When present, the page auto-builds a coaching
 * prompt from the user's anagram history and submits it automatically.
 *
 * Tests cover:
 * - URL is cleaned immediately on load (replaceState to /chat/)
 * - No UID: a first-timer prompt is built and auto-submitted
 * - With history data: stats + attempt distribution + recent plays included
 * - No crash when API fails (graceful fallback message)
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

// ─── Positive — base behaviour (no UID / first-timer path) ─────────────────

test.describe('Chat Anagram Context (?context=anagram) — Positive', () => {
  test('visiting /chat/?context=anagram does not leave ?context=anagram in the URL', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=anagram`);
    await page.waitForTimeout(800);
    expect(page.url()).not.toContain('context=anagram');
    expect(page.url()).toMatch(/\/chat\/$/);
  });

  test('visiting /chat/?context=anagram auto-submits a coaching prompt (user message appears)', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=anagram`);
    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });
    const messagesText = await page.locator('#messages').textContent();
    expect(messagesText).toContain('Daily Anagram');
  });

  test('first-timer prompt includes coaching request phrasing', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=anagram`);
    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });
    const messagesText = await page.locator('#messages').textContent();
    expect(messagesText).toContain('coaching');
  });

  test('first-timer prompt includes welcome / strategy explanation request', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=anagram`);
    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });
    const messagesText = await page.locator('#messages').textContent();
    expect(messagesText).toContain('welcome me');
  });

  test('first-timer prompt auto-submits and creates a user message bubble', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=anagram`);
    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });
    expect(await userBubble.count()).toBeGreaterThanOrEqual(1);
  });

  test('submitted auto-prompt contains ScrabbleWordsFinder.com reference', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=anagram`);
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
    expect(value).not.toContain('DAILY ANAGRAM');
    expect(value).not.toContain('COACHING REQUEST');
  });
});

// ─── Positive — Lex icon link on the activities page ───────────────────────

test.describe('Daily Anagram — Lex Icon Link (Positive)', () => {
  test('Lex icon link is visible on the activities page', async ({ page }) => {
    await page.goto(`${BASE}/activities/`);
    const lexLink = page.locator('a[href="/chat/?context=anagram"]');
    await expect(lexLink).toBeVisible();
  });

  test('Lex icon link points to /chat/?context=anagram', async ({ page }) => {
    await page.goto(`${BASE}/activities/`);
    const lexLink = page.locator('a[href="/chat/?context=anagram"]');
    const href = await lexLink.getAttribute('href');
    expect(href).toBe('/chat/?context=anagram');
  });

  test('Lex icon link contains the Lex avatar image', async ({ page }) => {
    await page.goto(`${BASE}/activities/`);
    const lexLink = page.locator('a[href="/chat/?context=anagram"]');
    const img = lexLink.locator('img[alt="Lex"]');
    await expect(img).toBeAttached();
  });

  test('Lex icon link has "Lex" label text', async ({ page }) => {
    await page.goto(`${BASE}/activities/`);
    const lexLink = page.locator('a[href="/chat/?context=anagram"]');
    await expect(lexLink).toContainText('Lex');
  });
});

// ─── Negative — base behaviour ─────────────────────────────────────────────

test.describe('Chat Anagram Context (?context=anagram) — Negative', () => {
  test('no JavaScript errors when ?context=anagram is used with no UID', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.removeItem('swf-uid'));
    await page.goto(`${BASE}/chat/?context=anagram`);
    await page.waitForTimeout(1500);

    const critical = errors.filter(e => !e.includes('net::') && !e.includes('Failed to fetch'));
    expect(critical).toHaveLength(0);
  });

  test('no duplicate chat-container elements after anagram context auto-submit', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=anagram`);
    await page.waitForTimeout(1000);
    await expect(page.locator('#chat-container')).toHaveCount(1);
  });

  test('chat input is cleared after auto-submit fires', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=anagram`);
    await page.waitForTimeout(1500);
    const value = await page.locator('#chat-input').inputValue();
    expect(value).not.toContain('DAILY ANAGRAM — COACHING REQUEST');
  });

  test('anagram context does not break normal chat functionality afterwards', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=anagram`);
    await page.waitForTimeout(1500);
    const input = page.locator('#chat-input');
    await input.fill('What are the best 5-letter words in Scrabble?');
    await expect(input).toHaveValue('What are the best 5-letter words in Scrabble?');
    await expect(page.locator('#send-btn')).toBeVisible();
  });

  test('anagram context does not expose sensitive data in the page', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=anagram`);
    await page.waitForTimeout(1000);
    const body = await page.textContent('body');
    expect(body).not.toMatch(/sk-[a-zA-Z0-9]{20,}/);
    expect(body).not.toContain('AKIA');
    expect(body).not.toMatch(/api[_-]?key/i);
  });

  test('anagram context does not persist ?context=anagram across reload', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=anagram`);
    await page.waitForTimeout(800);
    await page.reload();
    await page.waitForTimeout(1000);
    const value = await page.locator('#chat-input').inputValue();
    expect(value).not.toContain('DAILY ANAGRAM');
  });

  test('no duplicate Lex links on the activities page', async ({ page }) => {
    await page.goto(`${BASE}/activities/`);
    const lexLinks = page.locator('a[href="/chat/?context=anagram"]');
    await expect(lexLinks).toHaveCount(1);
  });
});

// ─── Positive — with history data ──────────────────────────────────────────

test.describe('Chat Anagram Context — With History Stats (Positive)', () => {
  test('prompt includes anagram stats section when history API returns data', async ({ page }) => {
    await page.route('**/api/anagram-history/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          history: [
            { date: '2026-06-28', attempts: 2, solved: 1, guesses: '[]', time_taken: 45, created_at: '2026-06-28T10:00:00' },
            { date: '2026-06-27', attempts: 4, solved: 1, guesses: '[]', time_taken: 120, created_at: '2026-06-27T10:00:00' },
            { date: '2026-06-26', attempts: 5, solved: 0, guesses: '[]', time_taken: 180, created_at: '2026-06-26T10:00:00' },
          ],
          puzzles: {
            '2026-06-28': { word: 'CASTLE', scrambled: 'TCLSAE', hint: 'A fortified building' },
            '2026-06-27': { word: 'BRIGHT', scrambled: 'TRGHIB', hint: 'Full of light' },
            '2026-06-26': { word: 'PLANET', scrambled: 'TNALEP', hint: 'Orbits a star' },
          },
          stats: { totalGames: 3, totalSolved: 2, avgAttempts: 3, streak: 2, solveRate: 67 },
        }),
      });
    });

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-anagram-uid'));
    await page.goto(`${BASE}/chat/?context=anagram`);

    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });

    const messagesText = await page.locator('#messages').textContent();
    expect(messagesText).toContain('ANAGRAM STATS');
  });

  test('prompt includes total puzzles played count', async ({ page }) => {
    await page.route('**/api/anagram-history/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          history: [
            { date: '2026-06-28', attempts: 2, solved: 1, guesses: '[]', time_taken: 45, created_at: '2026-06-28T10:00:00' },
            { date: '2026-06-27', attempts: 3, solved: 1, guesses: '[]', time_taken: 90, created_at: '2026-06-27T10:00:00' },
          ],
          puzzles: {},
          stats: { totalGames: 2, totalSolved: 2, avgAttempts: 2.5, streak: 2, solveRate: 100 },
        }),
      });
    });

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-anagram-uid'));
    await page.goto(`${BASE}/chat/?context=anagram`);

    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });

    const messagesText = await page.locator('#messages').textContent();
    expect(messagesText).toContain('Total puzzles played: 2');
  });

  test('prompt includes attempt distribution section', async ({ page }) => {
    await page.route('**/api/anagram-history/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          history: [
            { date: '2026-06-28', attempts: 1, solved: 1, guesses: '[]', time_taken: 10, created_at: '2026-06-28T10:00:00' },
          ],
          puzzles: {},
          stats: { totalGames: 1, totalSolved: 1, avgAttempts: 1, streak: 1, solveRate: 100 },
        }),
      });
    });

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-anagram-uid'));
    await page.goto(`${BASE}/chat/?context=anagram`);

    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });

    const messagesText = await page.locator('#messages').textContent();
    expect(messagesText).toContain('ATTEMPT DISTRIBUTION');
  });

  test('prompt includes recent plays section', async ({ page }) => {
    await page.route('**/api/anagram-history/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          history: [
            { date: '2026-06-28', attempts: 2, solved: 1, guesses: '[]', time_taken: 45, created_at: '2026-06-28T10:00:00' },
          ],
          puzzles: { '2026-06-28': { word: 'CASTLE', scrambled: 'TCLSAE', hint: 'A fortified building' } },
          stats: { totalGames: 1, totalSolved: 1, avgAttempts: 2, streak: 1, solveRate: 100 },
        }),
      });
    });

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-anagram-uid'));
    await page.goto(`${BASE}/chat/?context=anagram`);

    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });

    const messagesText = await page.locator('#messages').textContent();
    expect(messagesText).toContain('RECENT PLAYS');
  });

  test('prompt fetches today puzzle from /api/daily-anagram/ when not in history puzzles', async ({ page }) => {
    await page.route('**/api/anagram-history/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ history: [], puzzles: {}, stats: { totalGames: 0, totalSolved: 0, avgAttempts: 0, streak: 0, solveRate: 0 } }),
      });
    });
    await page.route('**/api/daily-anagram/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ word: 'CASTLE', scrambled: 'TCLSAE', hint: 'A fortified building', word_length: 6 }),
      });
    });

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-anagram-uid-2'));
    await page.goto(`${BASE}/chat/?context=anagram`);

    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });

    const messagesText = await page.locator('#messages').textContent();
    expect(messagesText).toContain('Daily Anagram');
  });
});

// ─── Negative — API error fallback ─────────────────────────────────────────

test.describe('Chat Anagram Context — API Error Fallback (Negative)', () => {
  test('graceful fallback message sent when anagram-history API returns 500', async ({ page }) => {
    await page.route('**/api/anagram-history/**', async route => {
      await route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'fail-anagram-uid'));
    await page.goto(`${BASE}/chat/?context=anagram`);

    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });

    const messagesText = await page.locator('#messages').textContent();
    expect(messagesText).toContain('Daily Anagram');
  });

  test('no JavaScript errors when anagram-history API fails', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('**/api/anagram-history/**', async route => {
      await route.fulfill({ status: 500, body: 'Error' });
    });

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'fail-anagram-uid'));
    await page.goto(`${BASE}/chat/?context=anagram`);
    await page.waitForTimeout(2000);

    const critical = errors.filter(e => !e.includes('net::') && !e.includes('Failed to fetch'));
    expect(critical).toHaveLength(0);
  });

  test('page auto-submits even when anagram-history API fails (does not hang)', async ({ page }) => {
    await page.route('**/api/anagram-history/**', async route => {
      await route.fulfill({ status: 500, body: 'Error' });
    });

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'fail-anagram-uid'));
    await page.goto(`${BASE}/chat/?context=anagram`);

    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });
    expect(await userBubble.count()).toBeGreaterThanOrEqual(1);
  });

  test('URL is cleaned even when anagram-history API fails', async ({ page }) => {
    await page.route('**/api/anagram-history/**', async route => {
      await route.fulfill({ status: 500, body: 'Error' });
    });

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'fail-anagram-uid'));
    await page.goto(`${BASE}/chat/?context=anagram`);
    await page.waitForTimeout(800);

    expect(page.url()).not.toContain('context=anagram');
  });

  test('fallback message does not contain internal error details', async ({ page }) => {
    await page.route('**/api/anagram-history/**', async route => {
      await route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-uid', 'fail-anagram-uid'));
    await page.goto(`${BASE}/chat/?context=anagram`);

    const userBubble = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userBubble.first().waitFor({ state: 'attached', timeout: 8000 });

    const messagesText = await page.locator('#messages').textContent();
    expect(messagesText).not.toContain('Internal Server Error');
    expect(messagesText).not.toContain('500');
  });
});
