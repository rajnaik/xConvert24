import { test, expect } from '@playwright/test';

/**
 * Chat Page — Keyword Logging via Ask Lex
 * Tests that when a user sends a message via the "Ask Lex" button (rack tiles),
 * the rack letters are passed as the `keyword` field to the /api/chatusage/ POST,
 * and the pendingKeyword is reset after logging so subsequent manual messages
 * don't carry a stale keyword.
 */

test.describe('Chat Keyword Logging — Positive', () => {
  test('Ask Lex sends keyword (rack letters) in chatusage POST', async ({ page }) => {
    let capturedBody: any = null;

    // Mock heartbeat + site-status
    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 5 } });
    });
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 5 } });
    });

    // Mock chat streaming endpoint
    await page.route('/api/chat/', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: 'data: {"response":"QUARTZ scores 24 points."}\n\ndata: [DONE]\n\n',
      });
    });

    // Intercept chatusage POST to capture the body
    await page.route('**/api/chatusage/', async (route) => {
      if (route.request().method() === 'POST') {
        capturedBody = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({ json: { success: true } });
      } else {
        await route.fulfill({ json: { suggestions: [], page: 0, totalPages: 0, total: 0 } });
      }
    });

    await page.goto('/chat/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'keyword-test-user'));
    await page.evaluate(() => sessionStorage.setItem('swf-session', 'test-session-1'));

    // Type rack letters and click Ask Lex
    const rackInput = page.locator('#rack-input');
    await rackInput.fill('QUARTZB');
    await page.locator('#ask-lex-btn').click();

    // Wait for streaming to finish and chatusage log to fire
    await page.waitForTimeout(2000);

    // Verify the keyword field was sent
    expect(capturedBody).not.toBeNull();
    expect(capturedBody.keyword).toBe('QUARTZB');
    expect(capturedBody.success).toBe(1);
  });

  test('keyword field is included on successful response', async ({ page }) => {
    let capturedBody: any = null;

    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 2 } });
    });
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 2 } });
    });
    await page.route('/api/chat/', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: 'data: {"response":"ZONE is a strong play."}\n\ndata: [DONE]\n\n',
      });
    });
    await page.route('**/api/chatusage/', async (route) => {
      if (route.request().method() === 'POST') {
        capturedBody = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({ json: { success: true } });
      } else {
        await route.fulfill({ json: { suggestions: [], page: 0, totalPages: 0, total: 0 } });
      }
    });

    await page.goto('/chat/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'keyword-user-2'));
    await page.evaluate(() => sessionStorage.setItem('swf-session', 'sess-2'));

    const rackInput = page.locator('#rack-input');
    await rackInput.fill('ZONE');
    await page.locator('#ask-lex-btn').click();
    await page.waitForTimeout(2000);

    expect(capturedBody).not.toBeNull();
    expect(capturedBody.keyword).toBe('ZONE');
    expect(capturedBody.user_message).toContain('ZONE');
  });

  test('keyword resets after Ask Lex — subsequent manual message has empty keyword', async ({ page }) => {
    const capturedBodies: any[] = [];

    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 3 } });
    });
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 3 } });
    });
    await page.route('/api/chat/', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: 'data: {"response":"Here is your answer."}\n\ndata: [DONE]\n\n',
      });
    });
    await page.route('**/api/chatusage/', async (route) => {
      if (route.request().method() === 'POST') {
        capturedBodies.push(JSON.parse(route.request().postData() || '{}'));
        await route.fulfill({ json: { success: true } });
      } else {
        await route.fulfill({ json: { suggestions: [], page: 0, totalPages: 0, total: 0 } });
      }
    });

    await page.goto('/chat/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'reset-test-user'));
    await page.evaluate(() => sessionStorage.setItem('swf-session', 'sess-reset'));

    // First: Ask Lex with rack letters
    const rackInput = page.locator('#rack-input');
    await rackInput.fill('ABCDEFG');
    await page.locator('#ask-lex-btn').click();
    await page.waitForTimeout(2500);

    // Second: Manual message (type directly in chat input)
    const chatInput = page.locator('#chat-input');
    await chatInput.fill('What is the best two-letter word?');
    await page.locator('#send-btn').click();
    await page.waitForTimeout(2500);

    // First call should have the rack keyword
    expect(capturedBodies.length).toBeGreaterThanOrEqual(2);
    expect(capturedBodies[0].keyword).toBe('ABCDEFG');

    // Second call should have empty keyword (reset after first use)
    expect(capturedBodies[1].keyword).toBe('');
  });
});

test.describe('Chat Keyword Logging — Negative', () => {
  test('manual chat message (no Ask Lex) sends empty keyword', async ({ page }) => {
    let capturedBody: any = null;

    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 1 } });
    });
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 1 } });
    });
    await page.route('/api/chat/', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: 'data: {"response":"Manual response."}\n\ndata: [DONE]\n\n',
      });
    });
    await page.route('**/api/chatusage/', async (route) => {
      if (route.request().method() === 'POST') {
        capturedBody = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({ json: { success: true } });
      } else {
        await route.fulfill({ json: { suggestions: [], page: 0, totalPages: 0, total: 0 } });
      }
    });

    await page.goto('/chat/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'manual-user'));
    await page.evaluate(() => sessionStorage.setItem('swf-session', 'sess-manual'));

    // Type directly in chat input (not via Ask Lex)
    const chatInput = page.locator('#chat-input');
    await chatInput.fill('Tell me about triple word squares');
    await page.locator('#send-btn').click();
    await page.waitForTimeout(2000);

    expect(capturedBody).not.toBeNull();
    expect(capturedBody.keyword).toBe('');
  });

  test('keyword logging does not crash on network error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 0 } });
    });
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 0 } });
    });
    await page.route('/api/chat/', async (route) => {
      await route.abort('connectionfailed');
    });
    // chatusage should still be called (fire-and-forget) with error info
    let capturedBody: any = null;
    await page.route('**/api/chatusage/', async (route) => {
      if (route.request().method() === 'POST') {
        capturedBody = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({ json: { success: true } });
      } else {
        await route.fulfill({ json: { suggestions: [], page: 0, totalPages: 0, total: 0 } });
      }
    });

    await page.goto('/chat/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'err-user'));
    await page.evaluate(() => sessionStorage.setItem('swf-session', 'sess-err'));

    const rackInput = page.locator('#rack-input');
    await rackInput.fill('XYZWVUT');
    await page.locator('#ask-lex-btn').click();
    await page.waitForTimeout(2000);

    // No fatal crash
    expect(errors.filter((e) => e.includes('critical'))).toHaveLength(0);

    // Keyword still logged even on error path
    expect(capturedBody).not.toBeNull();
    expect(capturedBody.keyword).toBe('XYZWVUT');
    expect(capturedBody.success).toBe(0);
  });

  test('keyword is not duplicated across consecutive Ask Lex calls', async ({ page }) => {
    const capturedBodies: any[] = [];

    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 4 } });
    });
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 4 } });
    });
    await page.route('/api/chat/', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: 'data: {"response":"Good word!"}\n\ndata: [DONE]\n\n',
      });
    });
    await page.route('**/api/chatusage/', async (route) => {
      if (route.request().method() === 'POST') {
        capturedBodies.push(JSON.parse(route.request().postData() || '{}'));
        await route.fulfill({ json: { success: true } });
      } else {
        await route.fulfill({ json: { suggestions: [], page: 0, totalPages: 0, total: 0 } });
      }
    });

    await page.goto('/chat/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'dedup-user'));
    await page.evaluate(() => sessionStorage.setItem('swf-session', 'sess-dedup'));

    // First Ask Lex
    const rackInput = page.locator('#rack-input');
    await rackInput.fill('ABC');
    await page.locator('#ask-lex-btn').click();
    await page.waitForTimeout(2500);

    // Second Ask Lex with different letters
    await rackInput.fill('XYZ');
    await page.locator('#ask-lex-btn').click();
    await page.waitForTimeout(2500);

    expect(capturedBodies.length).toBeGreaterThanOrEqual(2);
    // First should have ABC, second should have XYZ (not ABC again)
    expect(capturedBodies[0].keyword).toBe('ABC');
    expect(capturedBodies[1].keyword).toBe('XYZ');
  });
});
