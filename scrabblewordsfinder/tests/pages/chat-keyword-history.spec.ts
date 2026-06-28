import { test, expect } from '@playwright/test';

/**
 * Chat Page — Keyword History (Your Recent Questions)
 * Tests the paginated history of a user's own past chat questions.
 * The section is hidden when no user ID or no history exists,
 * and shows paginated keyword buttons when data is available.
 */

test.describe('Chat Keyword History — Positive', () => {
  test('keyword history container exists in DOM', async ({ page }) => {
    await page.goto('/chat/');
    const container = page.locator('#keyword-history');
    await expect(container).toBeAttached();
  });

  test('heading says "Your Recent Questions"', async ({ page }) => {
    await page.goto('/chat/');
    const heading = page.locator('#keyword-history h2');
    await expect(heading).toHaveText('Your Recent Questions');
  });

  test('pagination buttons exist (prev and next)', async ({ page }) => {
    await page.goto('/chat/');
    await expect(page.locator('#kh-prev')).toBeAttached();
    await expect(page.locator('#kh-next')).toBeAttached();
  });

  test('page info span exists', async ({ page }) => {
    await page.goto('/chat/');
    await expect(page.locator('#kh-page-info')).toBeAttached();
  });

  test('kh-list container exists for keyword buttons', async ({ page }) => {
    await page.goto('/chat/');
    await expect(page.locator('#kh-list')).toBeAttached();
  });

  test('section becomes visible when user has history', async ({ page }) => {
    // Set a user ID in localStorage before navigating
    await page.goto('/chat/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-user-123'));

    // Mock the API to return suggestions
    await page.route('/api/chatusage/?suggestions=true&user_id=test-user-123&page=0', async (route) => {
      await route.fulfill({
        json: {
          suggestions: ['Best 2-letter words', 'Q without U', 'Rack management tips'],
          page: 0,
          totalPages: 2,
          total: 10,
        },
      });
    });
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 5 } });
    });
    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 5 } });
    });

    await page.reload();
    await page.waitForTimeout(1000);

    const container = page.locator('#keyword-history');
    await expect(container).not.toHaveClass(/hidden/);
  });

  test('keyword history renders suggestion buttons', async ({ page }) => {
    await page.goto('/chat/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-user-456'));

    await page.route('/api/chatusage/?suggestions=true&user_id=test-user-456&page=0', async (route) => {
      await route.fulfill({
        json: {
          suggestions: ['Triple word strategy', 'What is a bingo?', 'Hook words'],
          page: 0,
          totalPages: 1,
          total: 3,
        },
      });
    });
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 10 } });
    });
    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 10 } });
    });

    await page.reload();
    await page.waitForTimeout(1000);

    const buttons = page.locator('#kh-list .kh-item');
    await expect(buttons).toHaveCount(3);
    await expect(buttons.nth(0)).toHaveText('Triple word strategy');
    await expect(buttons.nth(1)).toHaveText('What is a bingo?');
    await expect(buttons.nth(2)).toHaveText('Hook words');
  });

  test('page info displays correct pagination text', async ({ page }) => {
    await page.goto('/chat/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-user-789'));

    await page.route('/api/chatusage/?suggestions=true&user_id=test-user-789&page=0', async (route) => {
      await route.fulfill({
        json: { suggestions: ['Word 1', 'Word 2'], page: 0, totalPages: 3, total: 15 },
      });
    });
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 1 } });
    });
    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 1 } });
    });

    await page.reload();
    await page.waitForTimeout(1000);

    await expect(page.locator('#kh-page-info')).toHaveText('1 / 3');
  });

  test('next button navigates to page 2', async ({ page }) => {
    await page.goto('/chat/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-nav-user'));

    await page.route('/api/chatusage/?suggestions=true&user_id=test-nav-user&page=0', async (route) => {
      await route.fulfill({
        json: { suggestions: ['Page 1 item'], page: 0, totalPages: 2, total: 10 },
      });
    });
    await page.route('/api/chatusage/?suggestions=true&user_id=test-nav-user&page=1', async (route) => {
      await route.fulfill({
        json: { suggestions: ['Page 2 item'], page: 1, totalPages: 2, total: 10 },
      });
    });
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 1 } });
    });
    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 1 } });
    });

    await page.reload();
    await page.waitForTimeout(1000);

    // Verify initial state
    await expect(page.locator('#kh-page-info')).toHaveText('1 / 2');
    await expect(page.locator('#kh-next')).not.toBeDisabled();

    // Click next
    await page.locator('#kh-next').click();
    await page.waitForTimeout(500);

    await expect(page.locator('#kh-page-info')).toHaveText('2 / 2');
    await expect(page.locator('#kh-list .kh-item').nth(0)).toHaveText('Page 2 item');
  });

  test('clicking a keyword history item fills chat input', async ({ page }) => {
    await page.goto('/chat/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-click-user'));

    await page.route('/api/chatusage/?suggestions=true&user_id=test-click-user&page=0', async (route) => {
      await route.fulfill({
        json: { suggestions: ['Best opening moves'], page: 0, totalPages: 1, total: 1 },
      });
    });
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 1 } });
    });
    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 1 } });
    });
    // Mock the chat send API to prevent actual sending
    await page.route('/api/chat/', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: 'data: {"response":"Here are the best opening moves..."}\n\ndata: [DONE]\n\n',
      });
    });
    await page.route('**/api/chatusage/', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ json: { success: true } });
        return;
      }
      // GET with suggestions already handled above
      await route.fulfill({
        json: { suggestions: ['Best opening moves'], page: 0, totalPages: 1, total: 1 },
      });
    });

    await page.reload();
    await page.waitForTimeout(1000);

    // Click the history keyword
    await page.locator('#kh-list .kh-item').first().click();
    await page.waitForTimeout(1500);

    // The chat should have triggered (bot response appears in chat)
    const botMsg = page.locator('#messages .msg-text', { hasText: 'Here are the best opening moves' });
    await expect(botMsg).toBeVisible();
  });
});

test.describe('Chat Keyword History — Negative', () => {
  test('section is hidden when no user ID exists', async ({ page }) => {
    await page.goto('/chat/');
    await page.evaluate(() => localStorage.removeItem('swf-uid'));

    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 0 } });
    });
    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 0 } });
    });

    await page.reload();
    await page.waitForTimeout(500);

    const container = page.locator('#keyword-history');
    await expect(container).toHaveClass(/hidden/);
  });

  test('section is hidden when API returns 0 total suggestions', async ({ page }) => {
    await page.goto('/chat/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'empty-user'));

    await page.route('/api/chatusage/?suggestions=true&user_id=empty-user&page=0', async (route) => {
      await route.fulfill({
        json: { suggestions: [], page: 0, totalPages: 0, total: 0 },
      });
    });
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 0 } });
    });
    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 0 } });
    });

    await page.reload();
    await page.waitForTimeout(1000);

    await expect(page.locator('#keyword-history')).toHaveClass(/hidden/);
  });

  test('section hides gracefully when API fails', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/chat/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'fail-user'));

    await page.route('/api/chatusage/?suggestions=true&user_id=fail-user&page=0', async (route) => {
      await route.abort('connectionfailed');
    });
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 0 } });
    });
    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 0 } });
    });

    await page.reload();
    await page.waitForTimeout(1000);

    await expect(page.locator('#keyword-history')).toHaveClass(/hidden/);
    expect(errors.filter((e) => e.includes('critical'))).toHaveLength(0);
  });

  test('prev button is disabled on first page', async ({ page }) => {
    await page.goto('/chat/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'page-test-user'));

    await page.route('/api/chatusage/?suggestions=true&user_id=page-test-user&page=0', async (route) => {
      await route.fulfill({
        json: { suggestions: ['Item A'], page: 0, totalPages: 2, total: 5 },
      });
    });
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 1 } });
    });
    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 1 } });
    });

    await page.reload();
    await page.waitForTimeout(1000);

    await expect(page.locator('#kh-prev')).toBeDisabled();
  });

  test('next button is disabled on last page', async ({ page }) => {
    await page.goto('/chat/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'last-page-user'));

    await page.route('/api/chatusage/?suggestions=true&user_id=last-page-user&page=0', async (route) => {
      await route.fulfill({
        json: { suggestions: ['Only item'], page: 0, totalPages: 1, total: 1 },
      });
    });
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 1 } });
    });
    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 1 } });
    });

    await page.reload();
    await page.waitForTimeout(1000);

    await expect(page.locator('#kh-next')).toBeDisabled();
  });

  test('no duplicate keyword-history containers', async ({ page }) => {
    await page.goto('/chat/');
    await expect(page.locator('#keyword-history')).toHaveCount(1);
  });

  test('keyword history panel starts parallel to chat (no top margin offset)', async ({ page }) => {
    await page.goto('/chat/');
    const container = page.locator('#keyword-history');
    const cls = await container.getAttribute('class');
    expect(cls).not.toContain('mt-[190px]');
  });

  test('XSS content in suggestions is escaped', async ({ page }) => {
    await page.goto('/chat/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'xss-test-user'));

    await page.route('/api/chatusage/?suggestions=true&user_id=xss-test-user&page=0', async (route) => {
      await route.fulfill({
        json: {
          suggestions: ['<script>alert("xss")</script>', '<img onerror=alert(1) src=x>'],
          page: 0,
          totalPages: 1,
          total: 2,
        },
      });
    });
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 1 } });
    });
    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 1 } });
    });

    await page.reload();
    await page.waitForTimeout(1000);

    // The buttons should contain escaped text, not execute scripts
    const firstBtn = page.locator('#kh-list .kh-item').first();
    await expect(firstBtn).toBeVisible();
    // The text content should show escaped HTML, not execute it
    const textContent = await firstBtn.textContent();
    expect(textContent).toContain('<script>');
    // No actual script tags should be in the DOM inside kh-list
    const scriptTags = await page.locator('#kh-list script').count();
    expect(scriptTags).toBe(0);
  });
});
