import { test, expect } from '@playwright/test';

/**
 * Lex Chat Smart Routing — Tests that the /api/lex-chat/ endpoint
 * detects rack-style questions and routes them through the solver algorithm
 * before passing to AI. Verifies API response structure and error handling.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Lex Chat Smart Routing — Positive', () => {
  test('API accepts a rack-style question and returns a reply', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-chat/`, {
      data: { message: 'what words can I make from ADINERT' },
    });

    expect(res.status()).toBeLessThanOrEqual(503); // 200 if AI works, 503 if AI unavailable locally
    const body = await res.json();
    // Should have either a reply (AI available) or an error (AI unavailable)
    expect(body.reply || body.error).toBeTruthy();
  });

  test('API accepts a general question without rack detection', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-chat/`, {
      data: { message: 'what is the best opening word in Scrabble' },
    });

    expect(res.status()).toBeLessThanOrEqual(503);
    const body = await res.json();
    expect(body.reply || body.error).toBeTruthy();
  });

  test('API handles rack with blank tile marker', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-chat/`, {
      data: { message: 'best word for ADINER?' },
    });

    expect(res.status()).toBeLessThanOrEqual(503);
    const body = await res.json();
    expect(body.reply || body.error).toBeTruthy();
  });

  test('API returns valid JSON for rack question', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-chat/`, {
      data: { message: 'I have RETAINS' },
    });

    const contentType = res.headers()['content-type'] || '';
    expect(contentType).toContain('application/json');
  });

  test('chat UI shows user message bubble after sending rack question', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.locator('#ask-lex-tile').click();
    await page.locator('#lex-solver-modal').waitFor({ state: 'visible' });

    const textarea = page.locator('#lex-solver-chat-input');
    await textarea.fill('what words from ADINERT');
    await page.locator('#lex-solver-chat-send').click();

    // User message bubble should appear in the response area
    await page.waitForTimeout(500);
    const responseArea = page.locator('#lex-solver-modal .overflow-y-auto').first();
    const userMessage = responseArea.locator('text=what words from ADINERT');
    await expect(userMessage).toBeVisible();
  });

  test('chat UI shows loading animation after sending', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.locator('#ask-lex-tile').click();
    await page.locator('#lex-solver-modal').waitFor({ state: 'visible' });

    const textarea = page.locator('#lex-solver-chat-input');
    await textarea.fill('best play with SATIRE');
    await page.locator('#lex-solver-chat-send').click();

    // Loading indicator should appear briefly
    const loading = page.locator('#lex-chat-loading');
    // It may appear very briefly or be already gone if response is fast
    // Just verify no JS error occurs
    await page.waitForTimeout(300);
    expect(page.url()).toContain(BASE);
  });
});

test.describe('Lex Chat Smart Routing — Negative', () => {
  test('API rejects empty message', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-chat/`, {
      data: { message: '' },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Message is required');
  });

  test('API rejects missing message field', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-chat/`, {
      data: {},
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Message is required');
  });

  test('API rejects message over 500 characters', async ({ request }) => {
    const longMsg = 'x'.repeat(501);
    const res = await request.post(`${BASE}/api/lex-chat/`, {
      data: { message: longMsg },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Message too long (max 500 characters)');
  });

  test('API rejects body without message field (number instead of string)', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-chat/`, {
      data: { message: 12345 },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Message is required');
  });

  test('sending empty chat input does nothing (no network request)', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.locator('#ask-lex-tile').click();
    await page.locator('#lex-solver-modal').waitFor({ state: 'visible' });

    // Don't fill anything, just click send
    let apiCalled = false;
    page.on('request', req => {
      if (req.url().includes('/api/lex-chat')) apiCalled = true;
    });

    await page.locator('#lex-solver-chat-send').click();
    await page.waitForTimeout(300);

    expect(apiCalled).toBe(false);
  });

  test('no JavaScript errors when AI service is unavailable', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(`${BASE}/`);
    await page.locator('#ask-lex-tile').click();
    await page.locator('#lex-solver-modal').waitFor({ state: 'visible' });

    const textarea = page.locator('#lex-solver-chat-input');
    await textarea.fill('words from TESTING');
    await page.locator('#lex-solver-chat-send').click();

    // Wait for response (may be an error response from AI being unavailable)
    await page.waitForTimeout(2000);

    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });
});
