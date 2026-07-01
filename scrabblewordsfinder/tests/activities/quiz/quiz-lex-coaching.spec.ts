import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;
const CHAT_QUIZ_URL = `${BASE_URL}/chat/?context=quiz`;

// ── Quiz Lex Coaching Link — Positive ───────────────────────────────────────

test.describe('Quiz Lex Coaching Link — Positive', () => {
  test('Lex link in quiz panel navigates to /chat/?context=quiz', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const lexLink = page.locator('a[href="/chat/?context=quiz"]');
    await expect(lexLink).toBeVisible();
    await expect(lexLink).toHaveAttribute('href', '/chat/?context=quiz');
  });

  test('Lex link has coaching-specific title attribute', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const lexLink = page.locator('a[href="/chat/?context=quiz"]');
    await expect(lexLink).toHaveAttribute('title', 'Get AI coaching on your quiz performance');
  });

  test('chat page loads successfully with ?context=quiz param', async ({ page }) => {
    const response = await page.goto(CHAT_QUIZ_URL);
    expect(response?.status()).toBe(200);
    // Chat container should be present
    await expect(page.locator('#chat-container')).toBeVisible();
  });

  test('chat page auto-submits a message when ?context=quiz is present', async ({ page }) => {
    await page.goto(CHAT_QUIZ_URL);
    // Wait for the auto-submit to trigger (500ms delay + fetch time)
    // The user message bubble should appear in the messages area
    await page.waitForTimeout(2000);
    // At least one user message should appear (either coaching request or fallback)
    const userMessages = page.locator('#messages .justify-end');
    await expect(userMessages).toHaveCount(1, { timeout: 5000 });
  });

  test('quiz coaching request message contains quiz-related text', async ({ page }) => {
    await page.goto(CHAT_QUIZ_URL);
    await page.waitForTimeout(2000);
    // The submitted message should be quiz-related
    const userBubble = page.locator('#messages .justify-end .msg-text').first();
    const text = await userBubble.textContent();
    // Either it has quiz stats data OR the fallback message about quiz
    expect(
      text?.includes('Quiz') || text?.includes('quiz') || text?.includes('Word Quiz')
    ).toBe(true);
  });
});

// ── Quiz Lex Coaching Link — Negative ───────────────────────────────────────

test.describe('Quiz Lex Coaching Link — Negative', () => {
  test('chat page without ?context=quiz does NOT auto-submit quiz message', async ({ page }) => {
    await page.goto(`${BASE_URL}/chat/`);
    await page.waitForTimeout(1500);
    // No auto-submitted user messages should appear (only the welcome bot message)
    const userMessages = page.locator('#messages .justify-end');
    await expect(userMessages).toHaveCount(0);
  });

  test('no duplicate quiz coaching links on activities page', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const quizLexLinks = page.locator('a[href="/chat/?context=quiz"]');
    await expect(quizLexLinks).toHaveCount(1);
  });

  test('no JS errors on chat page with ?context=quiz', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(CHAT_QUIZ_URL);
    await page.waitForTimeout(3000);
    expect(errors.filter(e =>
      e.toLowerCase().includes('uncaught') ||
      e.toLowerCase().includes('typeerror') ||
      e.toLowerCase().includes('referenceerror')
    )).toHaveLength(0);
  });

  test('URL is cleaned to /chat/ after quiz context is processed', async ({ page }) => {
    await page.goto(CHAT_QUIZ_URL);
    await page.waitForTimeout(1000);
    // The URL should be cleaned to just /chat/ (replaceState removes the param)
    expect(page.url()).toBe(`${BASE_URL}/chat/`);
  });
});
