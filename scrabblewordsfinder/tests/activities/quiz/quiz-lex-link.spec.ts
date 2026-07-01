import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// Scoped locator: the Lex link inside the Quiz Panel (has title attribute)
const QUIZ_LEX_SELECTOR = 'a[href="/chat/?context=quiz"][title="Get AI coaching on your quiz performance"]';

// ── Quiz Lex Link — Positive ───────────────────────────────────────

test.describe('Quiz Lex Link — Positive', () => {
  test('Lex link is visible in the quiz panel header', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const lexLink = page.locator(QUIZ_LEX_SELECTOR);
    await expect(lexLink).toBeVisible();
  });

  test('Lex link has correct href to /chat/?context=quiz', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const lexLink = page.locator(QUIZ_LEX_SELECTOR);
    await expect(lexLink).toHaveAttribute('href', '/chat/?context=quiz');
  });

  test('Lex link has avatar image and Lex text', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const lexLink = page.locator(QUIZ_LEX_SELECTOR);
    // Avatar image should exist with correct src and alt
    const avatar = lexLink.locator('img[src="/lex-avatar-32.png"]');
    await expect(avatar).toBeVisible();
    await expect(avatar).toHaveAttribute('alt', 'Lex');
    await expect(avatar).toHaveAttribute('width', '16');
    await expect(avatar).toHaveAttribute('height', '16');
    // Text should still say "Lex"
    const content = await lexLink.textContent();
    expect(content).toContain('Lex');
  });

  test('Lex link has descriptive title attribute', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const lexLink = page.locator(QUIZ_LEX_SELECTOR);
    await expect(lexLink).toHaveAttribute('title', 'Get AI coaching on your quiz performance');
  });
});

// ── Quiz Lex Link — Negative ───────────────────────────────────────

test.describe('Quiz Lex Link — Negative', () => {
  test('only one Lex link with quiz-specific title in the quiz panel', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const lexLinks = page.locator(QUIZ_LEX_SELECTOR);
    await expect(lexLinks).toHaveCount(1);
  });

  test('Lex link does not break quiz history button placement', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const historyBtn = page.locator('#quiz-history-btn');
    // History button should still exist in the DOM (hidden initially)
    await expect(historyBtn).toHaveCount(1);
  });

  test('no JS errors on activities page after Lex link added', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(2000);
    expect(errors.filter(e =>
      e.toLowerCase().includes('uncaught') ||
      e.toLowerCase().includes('typeerror')
    )).toHaveLength(0);
  });
});
