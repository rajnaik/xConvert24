import { test, expect } from '@playwright/test';

/**
 * Lex Solver Chat Input — Chat input area inside the Lex Solver modal.
 * Allows users to ask Lex questions about Scrabble strategy, definitions, tips.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Lex Solver Chat Input — Positive', () => {
  test('chat form exists inside the Lex Solver modal', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.locator('#ask-lex-tile').click();
    await page.locator('#lex-solver-modal').waitFor({ state: 'visible' });

    const form = page.locator('#lex-solver-chat-form');
    await expect(form).toBeVisible();
  });

  test('chat textarea is visible with correct placeholder', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.locator('#ask-lex-tile').click();
    await page.locator('#lex-solver-modal').waitFor({ state: 'visible' });

    const textarea = page.locator('#lex-solver-chat-input');
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveAttribute('placeholder', 'Ask Lex anything about Scrabble...');
  });

  test('chat textarea accepts text input', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.locator('#ask-lex-tile').click();
    await page.locator('#lex-solver-modal').waitFor({ state: 'visible' });

    const textarea = page.locator('#lex-solver-chat-input');
    await textarea.fill('What is the best opening word?');
    await expect(textarea).toHaveValue('What is the best opening word?');
  });

  test('send button is visible with correct title', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.locator('#ask-lex-tile').click();
    await page.locator('#lex-solver-modal').waitFor({ state: 'visible' });

    const sendBtn = page.locator('#lex-solver-chat-send');
    await expect(sendBtn).toBeVisible();
    await expect(sendBtn).toHaveAttribute('title', 'Send message');
  });

  test('helper text is displayed below the form', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.locator('#ask-lex-tile').click();
    await page.locator('#lex-solver-modal').waitFor({ state: 'visible' });

    const helperText = page.locator('#lex-solver-chat-form + p');
    await expect(helperText).toBeVisible();
    await expect(helperText).toContainText('Ask about strategy, word definitions, tips');
  });

  test('textarea has autocomplete off', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.locator('#ask-lex-tile').click();
    await page.locator('#lex-solver-modal').waitFor({ state: 'visible' });

    const textarea = page.locator('#lex-solver-chat-input');
    await expect(textarea).toHaveAttribute('autocomplete', 'off');
  });
});

test.describe('Lex Solver Chat Input — Negative', () => {
  test('no duplicate chat forms in the modal', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.locator('#ask-lex-tile').click();
    await page.locator('#lex-solver-modal').waitFor({ state: 'visible' });

    const forms = page.locator('#lex-solver-chat-form');
    await expect(forms).toHaveCount(1);
  });

  test('no duplicate chat textareas in the modal', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.locator('#ask-lex-tile').click();
    await page.locator('#lex-solver-modal').waitFor({ state: 'visible' });

    const textareas = page.locator('#lex-solver-chat-input');
    await expect(textareas).toHaveCount(1);
  });

  test('chat input does not cause JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(`${BASE}/`);
    await page.locator('#ask-lex-tile').click();
    await page.locator('#lex-solver-modal').waitFor({ state: 'visible' });

    const textarea = page.locator('#lex-solver-chat-input');
    await textarea.fill('test message');
    await page.locator('#lex-solver-chat-send').click();

    // Allow any async handlers to fire
    await page.waitForTimeout(500);

    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });

  test('form submit does not navigate away from the page', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.locator('#ask-lex-tile').click();
    await page.locator('#lex-solver-modal').waitFor({ state: 'visible' });

    const textarea = page.locator('#lex-solver-chat-input');
    await textarea.fill('What words can I make with QUARTZ?');
    await page.locator('#lex-solver-chat-send').click();

    // Wait a moment then confirm we're still on the homepage
    await page.waitForTimeout(500);
    expect(page.url()).toContain(BASE);
  });
});
