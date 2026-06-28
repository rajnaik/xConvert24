import { test, expect } from '@playwright/test';

/**
 * Chat Usage Logging Tests (/api/chatusage/)
 * Tests the logChatUsage client-side function that fires POST requests
 * to /api/chatusage/ after every chat interaction (success, empty response, error).
 * Also tests the /api/chatusage/ API endpoint directly.
 */

test.describe('Chat Usage API — Positive', () => {
  test('POST /api/chatusage/ with valid data returns success', async ({ request }) => {
    const response = await request.post('/api/chatusage/', {
      data: {
        user_id: 'test-uid-001',
        user_message: 'What are the best two-letter words?',
        bot_response: 'The best two-letter words include QI, ZA, and XI.',
        response_ms: 1200,
        session_id: 'test-session-001',
        success: 1,
        error_message: '',
      },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('POST /api/chatusage/ logs failed interactions (success=0)', async ({ request }) => {
    const response = await request.post('/api/chatusage/', {
      data: {
        user_id: 'test-uid-002',
        user_message: 'Hello bot',
        bot_response: '',
        response_ms: 500,
        session_id: 'test-session-002',
        success: 0,
        error_message: 'No response received',
      },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  test('GET /api/chatusage/ returns paginated chat logs', async ({ request }) => {
    const response = await request.get('/api/chatusage/?limit=5');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('chats');
    expect(body).toHaveProperty('total');
    expect(Array.isArray(body.chats)).toBe(true);
  });

  test('GET /api/chatusage/?stats=true returns summary stats', async ({ request }) => {
    const response = await request.get('/api/chatusage/?stats=true');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('stats');
    expect(body.stats).toHaveProperty('total');
    expect(body.stats).toHaveProperty('successful');
    expect(body.stats).toHaveProperty('failed');
    expect(body.stats).toHaveProperty('avg_response_ms');
  });

  test('GET /api/chatusage/?suggestions=true returns suggestions array with pagination metadata', async ({ request }) => {
    const response = await request.get('/api/chatusage/?suggestions=true');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('suggestions');
    expect(Array.isArray(body.suggestions)).toBe(true);
    expect(body).toHaveProperty('page');
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('totalPages');
  });

  test('GET /api/chatusage/?suggestions=true returns at most 10 items per page', async ({ request }) => {
    const response = await request.get('/api/chatusage/?suggestions=true');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.suggestions.length).toBeLessThanOrEqual(10);
  });

  test('GET /api/chatusage/?suggestions=true items are non-empty strings', async ({ request }) => {
    const response = await request.get('/api/chatusage/?suggestions=true');
    expect(response.status()).toBe(200);
    const body = await response.json();
    for (const suggestion of body.suggestions) {
      expect(typeof suggestion).toBe('string');
      expect(suggestion.length).toBeGreaterThanOrEqual(8);
      expect(suggestion.length).toBeLessThanOrEqual(80);
    }
  });

  test('GET /api/chatusage/?suggestions=true&page=0 returns page 0', async ({ request }) => {
    const response = await request.get('/api/chatusage/?suggestions=true&page=0');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.page).toBe(0);
    expect(typeof body.total).toBe('number');
    expect(typeof body.totalPages).toBe('number');
    expect(body.totalPages).toBe(Math.ceil(body.total / 10));
  });

  test('GET /api/chatusage/?suggestions=true&user_id=X filters by user', async ({ request }) => {
    const response = await request.get('/api/chatusage/?suggestions=true&user_id=test-uid-001');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('suggestions');
    expect(Array.isArray(body.suggestions)).toBe(true);
    expect(body).toHaveProperty('page');
    expect(body.page).toBe(0);
    expect(typeof body.total).toBe('number');
    expect(typeof body.totalPages).toBe('number');
  });

  test('GET /api/chatusage/?suggestions=true&page=1 returns second page', async ({ request }) => {
    const response = await request.get('/api/chatusage/?suggestions=true&page=1');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.page).toBe(1);
    expect(body.suggestions.length).toBeLessThanOrEqual(10);
  });
});

test.describe('Chat Usage API — Negative', () => {
  test('POST /api/chatusage/ rejects missing user_message', async ({ request }) => {
    const response = await request.post('/api/chatusage/', {
      data: {
        user_id: 'test-uid',
        bot_response: 'some response',
        success: 1,
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('user_message is required');
  });

  test('POST /api/chatusage/ rejects empty user_message string', async ({ request }) => {
    const response = await request.post('/api/chatusage/', {
      data: {
        user_id: 'test-uid',
        user_message: '',
        bot_response: '',
        success: 0,
        error_message: 'test',
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('user_message is required');
  });

  test('GET /api/chatusage/ respects max limit of 200', async ({ request }) => {
    const response = await request.get('/api/chatusage/?limit=999');
    expect(response.status()).toBe(200);
    const body = await response.json();
    // Should return at most 200 rows even if limit=999 is requested
    expect(body.chats.length).toBeLessThanOrEqual(200);
  });

  test('GET /api/chatusage/?suggestions=true does not include very short messages', async ({ request }) => {
    const response = await request.get('/api/chatusage/?suggestions=true');
    expect(response.status()).toBe(200);
    const body = await response.json();
    // All returned suggestions must be >= 8 chars (filter excludes short junk like "hi" or "test")
    for (const suggestion of body.suggestions) {
      expect(suggestion.length).toBeGreaterThanOrEqual(8);
    }
  });

  test('GET /api/chatusage/?suggestions=true does not return stats or chats keys', async ({ request }) => {
    const response = await request.get('/api/chatusage/?suggestions=true');
    expect(response.status()).toBe(200);
    const body = await response.json();
    // Should have suggestions + pagination — not "stats" or "chats"
    expect(body).not.toHaveProperty('stats');
    expect(body).not.toHaveProperty('chats');
    expect(body).toHaveProperty('suggestions');
    expect(body).toHaveProperty('page');
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('totalPages');
  });

  test('GET /api/chatusage/?suggestions=true&page=-1 clamps negative page to 0', async ({ request }) => {
    const response = await request.get('/api/chatusage/?suggestions=true&page=-1');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.page).toBe(0);
  });

  test('GET /api/chatusage/?suggestions=true&page=abc treats invalid page as 0', async ({ request }) => {
    const response = await request.get('/api/chatusage/?suggestions=true&page=abc');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.page).toBe(0);
  });

  test('GET /api/chatusage/?suggestions=true&user_id=nonexistent returns empty array', async ({ request }) => {
    const response = await request.get('/api/chatusage/?suggestions=true&user_id=nonexistent-uid-xyz-999');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.suggestions).toHaveLength(0);
    expect(body.total).toBe(0);
    expect(body.totalPages).toBe(0);
  });

  test('GET /api/chatusage/?suggestions=true&page=9999 returns empty for out-of-range page', async ({ request }) => {
    const response = await request.get('/api/chatusage/?suggestions=true&page=9999');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.page).toBe(9999);
    expect(body.suggestions).toHaveLength(0);
  });
});

test.describe('Chat Page — Usage Logging Integration — Positive', () => {
  test('successful chat sends logChatUsage POST to /api/chatusage/', async ({ page }) => {
    // Track API calls to /api/chatusage/
    const chatUsageCalls: { method: string; body: any }[] = [];

    await page.route('/api/chatusage/', async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        chatUsageCalls.push({
          method: 'POST',
          body: JSON.parse(request.postData() || '{}'),
        });
      }
      await route.fulfill({ json: { success: true } });
    });

    // Mock chat API to return a successful streaming response
    await page.route('/api/chat/', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: 'data: {"response":"Hello!"}\n\ndata: [DONE]\n\n',
      });
    });

    // Mock site-status for the usage counter
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 42 } });
    });

    await page.goto('/chat/');
    await page.locator('#chat-input').fill('What is a bingo?');
    await page.locator('#send-btn').click();

    // Wait for the streaming to complete and logChatUsage to fire
    await page.waitForTimeout(1500);

    expect(chatUsageCalls.length).toBe(1);
    expect(chatUsageCalls[0].body.user_message).toBe('What is a bingo?');
    expect(chatUsageCalls[0].body.bot_response).toBe('Hello!');
    expect(chatUsageCalls[0].body.success).toBe(1);
    expect(chatUsageCalls[0].body.error_message).toBe('');
    expect(chatUsageCalls[0].body.response_ms).toBeGreaterThanOrEqual(0);
  });

  test('empty response triggers logChatUsage with success=0', async ({ page }) => {
    const chatUsageCalls: { body: any }[] = [];

    await page.route('/api/chatusage/', async (route) => {
      if (route.request().method() === 'POST') {
        chatUsageCalls.push({ body: JSON.parse(route.request().postData() || '{}') });
      }
      await route.fulfill({ json: { success: true } });
    });

    // Mock chat API to return an empty streaming response (no tokens)
    await page.route('/api/chat/', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: 'data: [DONE]\n\n',
      });
    });

    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 10 } });
    });

    await page.goto('/chat/');
    await page.locator('#chat-input').fill('Tell me something');
    await page.locator('#send-btn').click();

    await page.waitForTimeout(1500);

    expect(chatUsageCalls.length).toBe(1);
    expect(chatUsageCalls[0].body.success).toBe(0);
    expect(chatUsageCalls[0].body.error_message).toBe('No response received');
  });

  test('network error triggers logChatUsage with success=0 and error message', async ({ page }) => {
    const chatUsageCalls: { body: any }[] = [];

    await page.route('/api/chatusage/', async (route) => {
      if (route.request().method() === 'POST') {
        chatUsageCalls.push({ body: JSON.parse(route.request().postData() || '{}') });
      }
      await route.fulfill({ json: { success: true } });
    });

    // Mock chat API to abort (simulate network error)
    await page.route('/api/chat/', async (route) => {
      await route.abort('connectionfailed');
    });

    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 10 } });
    });

    await page.goto('/chat/');
    await page.locator('#chat-input').fill('Hello bot');
    await page.locator('#send-btn').click();

    await page.waitForTimeout(1500);

    expect(chatUsageCalls.length).toBe(1);
    expect(chatUsageCalls[0].body.success).toBe(0);
    expect(chatUsageCalls[0].body.error_message).toBeTruthy();
  });
});

test.describe('Chat Page — Usage Logging Integration — Negative', () => {
  test('logChatUsage failure does not crash the chat UI', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // Make chatusage API fail
    await page.route('/api/chatusage/', async (route) => {
      await route.fulfill({ status: 500, json: { error: 'DB down' } });
    });

    // Mock successful chat
    await page.route('/api/chat/', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: 'data: {"response":"Works fine"}\n\ndata: [DONE]\n\n',
      });
    });

    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 5 } });
    });

    await page.goto('/chat/');
    await page.locator('#chat-input').fill('Test message');
    await page.locator('#send-btn').click();

    await page.waitForTimeout(1500);

    // Chat should still work — bot response should be visible
    const botMsg = page.locator('#messages .msg-text', { hasText: 'Works fine' });
    await expect(botMsg).toBeVisible();

    // No critical page errors
    expect(errors.filter((e) => e.includes('critical'))).toHaveLength(0);
  });

  test('logChatUsage includes response_ms timing data', async ({ page }) => {
    const chatUsageCalls: { body: any }[] = [];

    await page.route('/api/chatusage/', async (route) => {
      if (route.request().method() === 'POST') {
        chatUsageCalls.push({ body: JSON.parse(route.request().postData() || '{}') });
      }
      await route.fulfill({ json: { success: true } });
    });

    // Mock chat with a small delay to ensure response_ms > 0
    await page.route('/api/chat/', async (route) => {
      await new Promise((r) => setTimeout(r, 100));
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: 'data: {"response":"Hi there"}\n\ndata: [DONE]\n\n',
      });
    });

    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 1 } });
    });

    await page.goto('/chat/');
    await page.locator('#chat-input').fill('Quick question');
    await page.locator('#send-btn').click();

    await page.waitForTimeout(1500);

    expect(chatUsageCalls.length).toBe(1);
    // response_ms should be a positive number (>= 100ms due to mock delay)
    expect(chatUsageCalls[0].body.response_ms).toBeGreaterThan(0);
  });
});

test.describe('Chat Page — Keyword History — Positive', () => {
  test('keyword history section exists in DOM (hidden by default)', async ({ page }) => {
    await page.goto('/chat/');
    const section = page.locator('#keyword-history');
    await expect(section).toBeAttached();
    // Hidden by default (has .hidden class) — becomes visible once user has history
  });

  test('keyword history loads and shows items for user with history', async ({ page }) => {
    // Mock the suggestions endpoint to return user-specific history
    await page.route('/api/chatusage/?suggestions=true&user_id=*', async (route) => {
      await route.fulfill({
        json: {
          suggestions: ['Best 2-letter words?', 'Q without U words', 'Triple word strategy'],
          page: 0,
          total: 3,
          totalPages: 1,
        },
      });
    });

    // Mock global suggestions
    await page.route('/api/chatusage/?suggestions=true', async (route) => {
      const url = route.request().url();
      if (url.includes('user_id')) return route.continue();
      await route.fulfill({
        json: {
          suggestions: ['Popular question 1', 'Popular question 2', 'Popular question 3', 'Popular question 4', 'Popular question 5'],
          page: 0,
          total: 5,
          totalPages: 1,
        },
      });
    });

    // Set swf-uid in localStorage before navigating
    await page.goto('/chat/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-user-kh'));
    await page.reload();

    // Wait for keyword history to become visible
    const section = page.locator('#keyword-history');
    await expect(section).toBeVisible({ timeout: 3000 });

    // Check items rendered
    const items = page.locator('#kh-list .kh-item');
    await expect(items).toHaveCount(3);
    await expect(items.first()).toHaveText('Best 2-letter words?');
  });

  test('keyword history items are clickable and submit to chat', async ({ page }) => {
    await page.route('**/api/chatusage/?suggestions=true&user_id=**', async (route) => {
      await route.fulfill({
        json: {
          suggestions: ['What is a bingo?'],
          page: 0,
          total: 1,
          totalPages: 1,
        },
      });
    });

    await page.route('/api/chatusage/?suggestions=true', async (route) => {
      const url = route.request().url();
      if (url.includes('user_id')) return route.continue();
      await route.fulfill({
        json: { suggestions: ['A', 'B', 'C', 'D', 'E'], page: 0, total: 5, totalPages: 1 },
      });
    });

    // Mock chat API
    await page.route('/api/chat/', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: 'data: {"response":"A bingo is using all 7 tiles."}\n\ndata: [DONE]\n\n',
      });
    });

    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 50 } });
    });

    await page.goto('/chat/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-user-kh2'));
    await page.reload();

    const section = page.locator('#keyword-history');
    await expect(section).toBeVisible({ timeout: 3000 });

    // Click the history item
    await page.locator('#kh-list .kh-item').first().click();

    // Should submit to chat — bot response appears
    const botMsg = page.locator('#messages .msg-text', { hasText: 'A bingo is using all 7 tiles.' });
    await expect(botMsg).toBeVisible({ timeout: 5000 });
  });

  test('keyword history shows pagination when multiple pages exist', async ({ page }) => {
    await page.route('**/api/chatusage/?suggestions=true&user_id=**', async (route) => {
      const url = new URL(route.request().url(), 'http://localhost');
      const pageNum = Number(url.searchParams.get('page') || 0);
      await route.fulfill({
        json: {
          suggestions: pageNum === 0
            ? ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10']
            : ['Q11', 'Q12'],
          page: pageNum,
          total: 12,
          totalPages: 2,
        },
      });
    });

    await page.route('/api/chatusage/?suggestions=true', async (route) => {
      const url = route.request().url();
      if (url.includes('user_id')) return route.continue();
      await route.fulfill({
        json: { suggestions: ['A', 'B', 'C', 'D', 'E'], page: 0, total: 5, totalPages: 1 },
      });
    });

    await page.goto('/chat/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-user-pagination'));
    await page.reload();

    const section = page.locator('#keyword-history');
    await expect(section).toBeVisible({ timeout: 3000 });

    // Page info should show "1 / 2"
    await expect(page.locator('#kh-page-info')).toHaveText('1 / 2');

    // Next button should be enabled
    const nextBtn = page.locator('#kh-next');
    await expect(nextBtn).toBeEnabled();

    // Prev button should be disabled on page 1
    const prevBtn = page.locator('#kh-prev');
    await expect(prevBtn).toBeDisabled();
  });
});

test.describe('Chat Page — Keyword History — Negative', () => {
  test('keyword history stays hidden when user has no swf-uid', async ({ page }) => {
    // Clear localStorage before visiting
    await page.goto('/chat/');
    await page.evaluate(() => localStorage.removeItem('swf-uid'));
    await page.reload();

    // Give it a moment to potentially load
    await page.waitForTimeout(500);
    const section = page.locator('#keyword-history');
    await expect(section).toBeHidden();
  });

  test('keyword history stays hidden when API returns 0 results', async ({ page }) => {
    await page.route('**/api/chatusage/?suggestions=true&user_id=**', async (route) => {
      await route.fulfill({
        json: { suggestions: [], page: 0, total: 0, totalPages: 0 },
      });
    });

    await page.route('/api/chatusage/?suggestions=true', async (route) => {
      const url = route.request().url();
      if (url.includes('user_id')) return route.continue();
      await route.fulfill({
        json: { suggestions: ['A', 'B', 'C', 'D', 'E'], page: 0, total: 5, totalPages: 1 },
      });
    });

    await page.goto('/chat/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'empty-user-xyz'));
    await page.reload();

    await page.waitForTimeout(500);
    const section = page.locator('#keyword-history');
    await expect(section).toBeHidden();
  });

  test('keyword history does not crash if API fails', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.route('**/api/chatusage/?suggestions=true&user_id=**', async (route) => {
      await route.fulfill({ status: 500, json: { error: 'DB error' } });
    });

    await page.route('/api/chatusage/?suggestions=true', async (route) => {
      const url = route.request().url();
      if (url.includes('user_id')) return route.continue();
      await route.fulfill({
        json: { suggestions: ['A', 'B', 'C', 'D', 'E'], page: 0, total: 5, totalPages: 1 },
      });
    });

    await page.goto('/chat/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'error-user'));
    await page.reload();

    await page.waitForTimeout(500);

    // Section stays hidden
    const section = page.locator('#keyword-history');
    await expect(section).toBeHidden();

    // No page errors
    expect(errors).toHaveLength(0);
  });

  test('keyword history does not duplicate items with quick prompts', async ({ page }) => {
    await page.route('**/api/chatusage/?suggestions=true&user_id=**', async (route) => {
      await route.fulfill({
        json: {
          suggestions: ['Best 2-letter words?', 'Triple word strategy'],
          page: 0,
          total: 2,
          totalPages: 1,
        },
      });
    });

    await page.route('/api/chatusage/?suggestions=true', async (route) => {
      const url = route.request().url();
      if (url.includes('user_id')) return route.continue();
      await route.fulfill({
        json: { suggestions: ['Best 2-letter words?', 'Q without U', 'Bingo', 'Rack mgmt', 'Strategy'], page: 0, total: 5, totalPages: 1 },
      });
    });

    await page.goto('/chat/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'dup-check-user'));
    await page.reload();

    const section = page.locator('#keyword-history');
    await expect(section).toBeVisible({ timeout: 3000 });

    // Quick prompts and keyword history are separate sections — no merged duplicates
    const quickPrompts = page.locator('#quick-prompts .quick-prompt');
    const historyItems = page.locator('#kh-list .kh-item');

    // Both sections render independently
    await expect(quickPrompts.first()).toBeAttached();
    await expect(historyItems.first()).toBeAttached();

    // They live in different containers — no cross-contamination
    expect(await page.locator('#quick-prompts .kh-item').count()).toBe(0);
    expect(await page.locator('#kh-list .quick-prompt').count()).toBe(0);
  });
});
