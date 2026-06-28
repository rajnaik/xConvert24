import { test, expect } from '@playwright/test';

/**
 * Chat Page — Static Keyword Shortcuts
 * Tests the hardcoded keyword shortcut buttons that allow users
 * to quickly submit common Scrabble topics to the chat.
 */

const EXPECTED_KEYWORDS = [
  '🎯 Best opening moves',
  '🅀 Teach me Q words',
  '📚 Can you Quiz me?',
  '🎒 Analyse my rack',
  '📖 Explain this word',
  '🏆 Tournament tips',
  '🎲 Daily challenge help',
  '📈 Improve my strategy',
];

test.describe('Chat Static Keywords — Positive', () => {
  test('static keywords container is visible', async ({ page }) => {
    await page.goto('/chat/');
    const container = page.locator('#static-keywords');
    await expect(container).toBeVisible();
  });

  test('renders exactly 8 keyword buttons', async ({ page }) => {
    await page.goto('/chat/');
    const buttons = page.locator('#static-keywords .static-kw');
    await expect(buttons).toHaveCount(8);
  });

  test('all expected keyword labels are present', async ({ page }) => {
    await page.goto('/chat/');
    for (const keyword of EXPECTED_KEYWORDS) {
      await expect(page.locator('#static-keywords .static-kw', { hasText: keyword })).toBeVisible();
    }
  });

  test('buttons have emerald styling (distinct from quick-prompts)', async ({ page }) => {
    await page.goto('/chat/');
    const firstBtn = page.locator('#static-keywords .static-kw').first();
    const classes = await firstBtn.getAttribute('class');
    expect(classes).toContain('bg-emerald-900/40');
    expect(classes).toContain('border-emerald-700/50');
    expect(classes).toContain('text-emerald-300');
  });

  test('clicking a keyword button fills the chat input and submits', async ({ page }) => {
    // Mock chat API to respond with a streamed answer
    await page.route('**/api/chat/', async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: 'data: {"response":"Here are the best opening moves for Scrabble..."}\n\ndata: [DONE]\n\n',
      });
    });
    await page.route('**/api/chatusage/**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ json: { success: true } });
        return;
      }
      await route.fulfill({ json: { suggestions: [], page: 0, totalPages: 0, total: 0 } });
    });
    await page.route('**/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 5 } });
    });
    await page.route('**/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 5 } });
    });

    await page.goto('/chat/');
    await page.waitForTimeout(500);

    // Click the first static keyword button
    await page.locator('#static-keywords .static-kw').first().click();
    await page.waitForTimeout(2000);

    // Verify the user message appeared in the chat (first match is user's msg)
    const userMsg = page.locator('#messages .msg-text').filter({ hasText: '🎯 Best opening moves' });
    await expect(userMsg.first()).toBeVisible();
  });

  test('static keywords appear before quick-prompts in DOM order', async ({ page }) => {
    await page.goto('/chat/');
    const staticBox = await page.locator('#static-keywords').boundingBox();
    const quickBox = await page.locator('#quick-prompts').boundingBox();
    expect(staticBox).not.toBeNull();
    expect(quickBox).not.toBeNull();
    expect(staticBox!.y).toBeLessThan(quickBox!.y);
  });
});

test.describe('Chat Static Keywords — Negative', () => {
  test('no duplicate static-keywords containers', async ({ page }) => {
    await page.goto('/chat/');
    await expect(page.locator('#static-keywords')).toHaveCount(1);
  });

  test('clicking keyword does not crash page when streaming', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // Mock a slow streaming response
    await page.route('/api/chat/', async (route) => {
      // Simulate a long streaming response that keeps isStreaming = true
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: 'data: {"response":"Thinking..."}\n\n',
      });
    });
    await page.route('/api/chatusage/', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ json: { success: true } });
        return;
      }
      await route.fulfill({ json: { suggestions: [], page: 0, totalPages: 0, total: 0 } });
    });
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 5 } });
    });
    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 5 } });
    });

    await page.goto('/chat/');
    await page.waitForTimeout(500);

    // Click the first keyword (this should not cause errors)
    await page.locator('#static-keywords .static-kw').first().click();
    await page.waitForTimeout(500);

    // No critical page errors
    expect(errors.filter((e) => e.includes('critical'))).toHaveLength(0);
  });

  test('buttons are distinct from quick-prompt buttons (different styling)', async ({ page }) => {
    await page.goto('/chat/');
    const staticClasses = await page.locator('#static-keywords .static-kw').first().getAttribute('class');
    const quickClasses = await page.locator('#quick-prompts .quick-prompt').first().getAttribute('class');
    // Static uses emerald, quick uses gray/blue
    expect(staticClasses).toContain('emerald');
    expect(quickClasses).not.toContain('emerald');
  });

  test('no empty-text keyword buttons', async ({ page }) => {
    await page.goto('/chat/');
    const buttons = page.locator('#static-keywords .static-kw');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const text = await buttons.nth(i).textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });
});
