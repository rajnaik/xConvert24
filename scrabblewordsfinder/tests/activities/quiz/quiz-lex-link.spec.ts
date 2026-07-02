import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// Scoped locator: the Lex button inside the Quiz Panel (has title attribute)
const QUIZ_LEX_SELECTOR = 'button#LexQuiz[title="Get AI coaching on your quiz performance"]';

// ── Quiz Lex Button — Positive ───────────────────────────────────────

test.describe('Quiz Lex Button — Positive', () => {
  test('Lex button is visible in the quiz panel header', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const lexBtn = page.locator(QUIZ_LEX_SELECTOR);
    await expect(lexBtn).toBeVisible();
  });

  test('Lex button is a button element with type=button', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const lexBtn = page.locator(QUIZ_LEX_SELECTOR);
    await expect(lexBtn).toHaveAttribute('type', 'button');
  });

  test('Lex button has avatar image and Lex text', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const lexBtn = page.locator(QUIZ_LEX_SELECTOR);
    // Avatar image should exist with correct src and alt
    const avatar = lexBtn.locator('img[src="/lex-avatar-32.png"]');
    await expect(avatar).toBeVisible();
    await expect(avatar).toHaveAttribute('alt', 'Lex');
    await expect(avatar).toHaveAttribute('width', '16');
    await expect(avatar).toHaveAttribute('height', '16');
    // Text should still say "Lex Quiz Coach"
    const content = await lexBtn.textContent();
    expect(content).toContain('Lex Quiz Coach');
  });

  test('Lex button has descriptive title attribute', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const lexBtn = page.locator(QUIZ_LEX_SELECTOR);
    await expect(lexBtn).toHaveAttribute('title', 'Get AI coaching on your quiz performance');
  });
});

// ── Quiz Lex Button — Negative ───────────────────────────────────────

test.describe('Quiz Lex Button — Negative', () => {
  test('only one Lex button with quiz-specific title in the quiz panel', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const lexBtns = page.locator(QUIZ_LEX_SELECTOR);
    await expect(lexBtns).toHaveCount(1);
  });

  test('Lex button does not break quiz history button placement', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const historyBtn = page.locator('#quiz-history-btn');
    // History button should still exist in the DOM (hidden initially)
    await expect(historyBtn).toHaveCount(1);
  });

  test('no JS errors on activities page after Lex button click', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(1000);
    // Click the button — should not cause uncaught errors
    await page.locator(QUIZ_LEX_SELECTOR).click();
    await page.waitForTimeout(1000);
    expect(errors.filter(e =>
      e.toLowerCase().includes('uncaught') ||
      e.toLowerCase().includes('typeerror')
    )).toHaveLength(0);
  });
});
