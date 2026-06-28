import { test, expect, Page } from '@playwright/test';

/**
 * BlogAskAI Component Tests
 * Verifies the floating AI chat widget on blog pages:
 * - Toggle button visibility and interaction
 * - Panel open/close behaviour
 * - Form input and submission
 * - Error handling and rate limiting
 */

const BLOG_PAGE = '/blog/what-is-scrabble/';

/**
 * Dismiss the cookie consent banner so it doesn't block click targets.
 */
async function dismissCookieBanner(page: Page) {
  const acceptBtn = page.locator('#cookie-banner button', { hasText: 'Accept' });
  if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await acceptBtn.click();
    await page.locator('#cookie-banner').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
  }
}

test.describe('BlogAskAI — Positive', () => {
  test('floating AI chat toggle button is visible on blog pages', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const toggleBtn = page.locator('#rag-toggle-btn');
    await expect(toggleBtn).toBeVisible();
    await expect(toggleBtn).toHaveAttribute('aria-label', 'Ask AI about Scrabble');
  });

  test('chat panel opens when toggle button is clicked', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    await dismissCookieBanner(page);

    const panel = page.locator('#rag-panel');
    await expect(panel).toBeHidden();

    await page.locator('#rag-toggle-btn').click();
    await expect(panel).toBeVisible();
  });

  test('chat panel shows welcome message with AI avatar', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    await dismissCookieBanner(page);
    await page.locator('#rag-toggle-btn').click();

    const messages = page.locator('#rag-messages');
    await expect(messages).toContainText('Scrabble AI assistant');
  });

  test('chat panel header displays correct title', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    await dismissCookieBanner(page);
    await page.locator('#rag-toggle-btn').click();

    const header = page.locator('#rag-panel h3');
    await expect(header).toHaveText('Ask AI — Scrabble Expert');
  });

  test('input field accepts text and is focusable', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    await dismissCookieBanner(page);
    await page.locator('#rag-toggle-btn').click();

    const input = page.locator('#rag-input');
    await expect(input).toBeVisible();
    await input.fill('What are the best two-letter words?');
    await expect(input).toHaveValue('What are the best two-letter words?');
  });

  test('chat panel closes when toggle button is clicked again', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    await dismissCookieBanner(page);

    const panel = page.locator('#rag-panel');

    await page.locator('#rag-toggle-btn').click();
    await expect(panel).toBeVisible();

    await page.locator('#rag-toggle-btn').click();
    await expect(panel).toBeHidden();
  });

  test('chat panel closes on Escape key', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    await dismissCookieBanner(page);

    const panel = page.locator('#rag-panel');

    await page.locator('#rag-toggle-btn').click();
    await expect(panel).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
  });

  test('close icon toggles with chat icon when panel opens', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    await dismissCookieBanner(page);

    const chatIcon = page.locator('#rag-icon-chat');
    const closeIcon = page.locator('#rag-icon-close');

    await expect(chatIcon).toBeVisible();
    await expect(closeIcon).toBeHidden();

    await page.locator('#rag-toggle-btn').click();

    await expect(chatIcon).toBeHidden();
    await expect(closeIcon).toBeVisible();
  });

  test('submitting a question adds user message bubble', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    await dismissCookieBanner(page);
    await page.locator('#rag-toggle-btn').click();

    // Mock the API to avoid actual AI calls
    await page.route('**/api/rag-query/', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ answer: 'Two-letter words like QI and ZA are very useful.', sources: [{ slug: 'best-two-letter-words-scrabble', title: 'Best Two-Letter Words' }] })
      })
    );

    await page.locator('#rag-input').fill('What are good two-letter words?');
    await page.locator('#rag-send-btn').click();

    // User message should appear
    const userBubble = page.locator('#rag-messages .bg-blue-600');
    await expect(userBubble).toBeVisible();
    await expect(userBubble).toContainText('What are good two-letter words?');
  });

  test('AI response is displayed with sources', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    await dismissCookieBanner(page);
    await page.locator('#rag-toggle-btn').click();

    await page.route('**/api/rag-query/', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ answer: 'QI and ZA are essential two-letter words.', sources: [{ slug: 'best-two-letter-words-scrabble', title: 'Best Two-Letter Words' }] })
      })
    );

    await page.locator('#rag-input').fill('Tell me about two-letter words');
    await page.locator('#rag-send-btn').click();

    // Wait for AI response
    const aiResponse = page.locator('#rag-messages').getByText('QI and ZA are essential');
    await expect(aiResponse).toBeVisible({ timeout: 5000 });

    // Source link should be present and open in same window (no target attribute)
    const sourceLink = page.locator('#rag-messages a[href="/blog/best-two-letter-words-scrabble/"]');
    await expect(sourceLink).toBeVisible();
    await expect(sourceLink).toContainText('Best Two-Letter Words');
    await expect(sourceLink).not.toHaveAttribute('target', '_blank');
  });
});

test.describe('BlogAskAI — Negative', () => {
  test('no duplicate chat widgets on page', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const widgetCount = await page.locator('#rag-chat-widget').count();
    expect(widgetCount, 'Should have exactly one AI chat widget').toBe(1);
  });

  test('empty input does not submit a question', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    await dismissCookieBanner(page);
    await page.locator('#rag-toggle-btn').click();

    let apiCalled = false;
    await page.route('**/api/rag-query/', route => {
      apiCalled = true;
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ answer: 'test', sources: [] }) });
    });

    // Submit with empty input
    await page.locator('#rag-send-btn').click();
    // Give a moment to ensure no API call is made
    await page.waitForTimeout(500);
    expect(apiCalled, 'API should not be called with empty input').toBe(false);
  });

  test('handles API error gracefully without crashing', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(BLOG_PAGE);
    await dismissCookieBanner(page);
    await page.locator('#rag-toggle-btn').click();

    await page.route('**/api/rag-query/', route =>
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Internal server error' }) })
    );

    await page.locator('#rag-input').fill('Test question');
    await page.locator('#rag-send-btn').click();

    // Error message should appear
    const errorMsg = page.locator('#rag-messages').getByText("couldn't process");
    await expect(errorMsg).toBeVisible({ timeout: 5000 });

    // No page errors
    expect(errors).toHaveLength(0);
  });

  test('handles rate limit (429) with user-friendly message', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    await dismissCookieBanner(page);
    await page.locator('#rag-toggle-btn').click();

    await page.route('**/api/rag-query/', route =>
      route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ error: 'Rate limited' }) })
    );

    await page.locator('#rag-input').fill('Another question');
    await page.locator('#rag-send-btn').click();

    const limitMsg = page.locator('#rag-messages').getByText('question limit');
    await expect(limitMsg).toBeVisible({ timeout: 5000 });
  });

  test('no JavaScript errors from BlogAskAI on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(BLOG_PAGE);
    await page.waitForLoadState('networkidle');

    const ragErrors = errors.filter(e => e.toLowerCase().includes('rag') || e.toLowerCase().includes('toggle'));
    expect(ragErrors, `RAG-related errors: ${ragErrors.join('; ')}`).toHaveLength(0);
  });

  test('send button is disabled while waiting for AI response', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    await dismissCookieBanner(page);
    await page.locator('#rag-toggle-btn').click();

    // Use a delayed response to catch the disabled state
    await page.route('**/api/rag-query/', async route => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ answer: 'Delayed answer', sources: [] }) });
    });

    await page.locator('#rag-input').fill('Question');
    await page.locator('#rag-send-btn').click();

    // Button should be disabled while loading
    await expect(page.locator('#rag-send-btn')).toBeDisabled();
  });
});
