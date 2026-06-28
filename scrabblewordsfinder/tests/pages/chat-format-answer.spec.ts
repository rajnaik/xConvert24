import { test, expect } from '@playwright/test';

/**
 * Chat Page — formatAnswer() Rich Rendering Tests
 *
 * Tests the FVT-style rich formatting of AI responses including:
 * - Numbered list rendering (steps cards)
 * - Bullet list rendering (bordered items)
 * - Bold/inline code formatting
 * - Link auto-detection (bare paths + markdown links)
 * - Regular paragraph rendering
 *
 * Uses page.route() to mock the /api/chat/ streaming response,
 * then verifies the rendered DOM matches expected formatting.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

/**
 * Helper: creates a mock SSE response body from a plain text AI answer.
 * Simulates the streaming format the chat API returns.
 */
function mockSSE(responseText: string): string {
  // Send the full response as a single token (simpler for testing)
  const chunk = JSON.stringify({ response: responseText });
  return `data: ${chunk}\n\ndata: [DONE]\n\n`;
}

test.describe('Chat formatAnswer — Positive', () => {
  test('numbered list renders as steps card with emerald styling', async ({ page }) => {
    // Mock the chat API to return a numbered list
    await page.route('**/api/chat/', async (route) => {
      const body = mockSSE('Here are the steps:\n\n1. First do this\n2. Then do that\n3. Finally finish');
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body,
      });
    });

    await page.goto(`${BASE}/chat/`);
    await page.waitForSelector('#chat-container');

    // Type and submit a message
    await page.fill('#chat-input', 'give me steps');
    await page.click('#send-btn');

    // Wait for the assistant message to render
    const assistantMsg = page.locator('.msg-text').last();
    await expect(assistantMsg).not.toBeEmpty({ timeout: 5000 });

    const html = await assistantMsg.innerHTML();
    // Should contain the steps wrapper with emerald border
    expect(html).toContain('border-emerald-500/30');
    // Dynamic category heading extracted from preceding text
    expect(html).toContain('Here are the steps');
    // Should contain numbered circles
    expect(html).toContain('>1</span>');
    expect(html).toContain('>2</span>');
    expect(html).toContain('>3</span>');
    // Should contain step content
    expect(html).toContain('First do this');
    expect(html).toContain('Then do that');
    expect(html).toContain('Finally finish');
  });

  test('bullet list renders with triangle markers', async ({ page }) => {
    await page.route('**/api/chat/', async (route) => {
      const body = mockSSE('Key points:\n\n- Point one here\n- Point two here\n- Point three here');
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body,
      });
    });

    await page.goto(`${BASE}/chat/`);
    await page.waitForSelector('#chat-container');
    await page.fill('#chat-input', 'list points');
    await page.click('#send-btn');

    const assistantMsg = page.locator('.msg-text').last();
    await expect(assistantMsg).not.toBeEmpty({ timeout: 5000 });

    const html = await assistantMsg.innerHTML();
    expect(html).toContain('▶');
    expect(html).toContain('border-emerald-500/20');
    expect(html).toContain('Point one here');
    expect(html).toContain('Point two here');
    expect(html).toContain('Point three here');
  });

  test('bold text renders with font-semibold', async ({ page }) => {
    await page.route('**/api/chat/', async (route) => {
      const body = mockSSE('This has **bold text** in it.');
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body,
      });
    });

    await page.goto(`${BASE}/chat/`);
    await page.waitForSelector('#chat-container');
    await page.fill('#chat-input', 'bold test');
    await page.click('#send-btn');

    const assistantMsg = page.locator('.msg-text').last();
    await expect(assistantMsg).not.toBeEmpty({ timeout: 5000 });

    const html = await assistantMsg.innerHTML();
    expect(html).toContain('text-white font-semibold');
    expect(html).toContain('bold text');
    expect(html).not.toContain('**');
  });

  test('inline code renders with mono font styling', async ({ page }) => {
    await page.route('**/api/chat/', async (route) => {
      const body = mockSSE('Use the `canMake()` function.');
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body,
      });
    });

    await page.goto(`${BASE}/chat/`);
    await page.waitForSelector('#chat-container');
    await page.fill('#chat-input', 'code test');
    await page.click('#send-btn');

    const assistantMsg = page.locator('.msg-text').last();
    await expect(assistantMsg).not.toBeEmpty({ timeout: 5000 });

    const html = await assistantMsg.innerHTML();
    expect(html).toContain('<code');
    expect(html).toContain('font-mono');
    expect(html).toContain('canMake()');
  });

  test('blog paths are auto-linkified with trailing slash', async ({ page }) => {
    await page.route('**/api/chat/', async (route) => {
      const body = mockSSE('Check out /blog/best-two-letter-words-scrabble for tips.');
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body,
      });
    });

    await page.goto(`${BASE}/chat/`);
    await page.waitForSelector('#chat-container');
    await page.fill('#chat-input', 'link test');
    await page.click('#send-btn');

    const assistantMsg = page.locator('.msg-text').last();
    await expect(assistantMsg).not.toBeEmpty({ timeout: 5000 });

    const html = await assistantMsg.innerHTML();
    expect(html).toContain('href="/blog/best-two-letter-words-scrabble/"');
    expect(html).toContain('text-blue-400');
  });

  test('markdown links render as clickable anchors', async ({ page }) => {
    // Use a non-blog internal path so bare-path linkifier doesn't conflict
    await page.route('**/api/chat/', async (route) => {
      const body = mockSSE('See [our settings page](/settings) for preferences.');
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body,
      });
    });

    await page.goto(`${BASE}/chat/`);
    await page.waitForSelector('#chat-container');
    await page.fill('#chat-input', 'markdown link');
    await page.click('#send-btn');

    const assistantMsg = page.locator('.msg-text').last();
    await expect(assistantMsg).not.toBeEmpty({ timeout: 5000 });

    const html = await assistantMsg.innerHTML();
    expect(html).toContain('href="/settings/"');
    expect(html).toContain('>our settings page</a>');
  });

  test('regular paragraph renders as p tag', async ({ page }) => {
    await page.route('**/api/chat/', async (route) => {
      const body = mockSSE('This is a simple paragraph with no special formatting.');
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body,
      });
    });

    await page.goto(`${BASE}/chat/`);
    await page.waitForSelector('#chat-container');
    await page.fill('#chat-input', 'para test');
    await page.click('#send-btn');

    const assistantMsg = page.locator('.msg-text').last();
    await expect(assistantMsg).not.toBeEmpty({ timeout: 5000 });

    const html = await assistantMsg.innerHTML();
    expect(html).toContain('text-sm text-gray-200 leading-relaxed');
    expect(html).toContain('This is a simple paragraph with no special formatting.');
  });
});

test.describe('Chat formatAnswer — Negative', () => {
  test('single numbered line does NOT trigger steps card', async ({ page }) => {
    await page.route('**/api/chat/', async (route) => {
      const body = mockSSE('1. Just one item here alone.');
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body,
      });
    });

    await page.goto(`${BASE}/chat/`);
    await page.waitForSelector('#chat-container');
    await page.fill('#chat-input', 'one item');
    await page.click('#send-btn');

    const assistantMsg = page.locator('.msg-text').last();
    await expect(assistantMsg).not.toBeEmpty({ timeout: 5000 });

    const html = await assistantMsg.innerHTML();
    // Should NOT render the steps card (needs >= 2 numbered lines)
    expect(html).not.toContain('border-emerald-500/30 bg-emerald-950/10');
  });

  test('single bullet line does NOT trigger bullet list', async ({ page }) => {
    await page.route('**/api/chat/', async (route) => {
      const body = mockSSE('- Just one bullet point.');
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body,
      });
    });

    await page.goto(`${BASE}/chat/`);
    await page.waitForSelector('#chat-container');
    await page.fill('#chat-input', 'one bullet');
    await page.click('#send-btn');

    const assistantMsg = page.locator('.msg-text').last();
    await expect(assistantMsg).not.toBeEmpty({ timeout: 5000 });

    const html = await assistantMsg.innerHTML();
    // Should NOT render the bullet list marker
    expect(html).not.toContain('▶');
  });

  test('HTML in AI response is escaped (no XSS)', async ({ page }) => {
    await page.route('**/api/chat/', async (route) => {
      const body = mockSSE('<script>alert("xss")</script>');
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body,
      });
    });

    await page.goto(`${BASE}/chat/`);
    await page.waitForSelector('#chat-container');
    await page.fill('#chat-input', 'xss test');
    await page.click('#send-btn');

    const assistantMsg = page.locator('.msg-text').last();
    await expect(assistantMsg).not.toBeEmpty({ timeout: 5000 });

    const html = await assistantMsg.innerHTML();
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  test('no page crash with empty API response', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('**/api/chat/', async (route) => {
      const body = 'data: [DONE]\n\n';
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body,
      });
    });

    await page.goto(`${BASE}/chat/`);
    await page.waitForSelector('#chat-container');
    await page.fill('#chat-input', 'empty response');
    await page.click('#send-btn');

    // Wait for response handling
    await page.waitForTimeout(2000);
    // No page crash
    expect(errors.filter(e => e.includes('formatAnswer'))).toHaveLength(0);
  });
});
