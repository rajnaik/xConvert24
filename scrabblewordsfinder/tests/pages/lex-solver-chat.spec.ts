import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';

/**
 * Lex Solver Modal — Chat Textbox
 * A free-form chat input was added to the Lex AI Solver modal
 * allowing users to ask general Scrabble questions.
 */

test.describe('Lex Solver Chat Input — Positive', () => {
  test('chat textarea is visible after opening Lex modal', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);

    // Open Lex solver modal
    const openBtn = page.locator('#ask-lex-tile');
    await openBtn.click();
    await page.locator('#lex-solver-modal').waitFor({ state: 'visible' });

    const chatInput = page.locator('#lex-solver-chat-input');
    await expect(chatInput).toBeVisible();
  });

  test('chat textarea has correct placeholder text', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.locator('#ask-lex-tile').click();
    await page.locator('#lex-solver-modal').waitFor({ state: 'visible' });

    const chatInput = page.locator('#lex-solver-chat-input');
    await expect(chatInput).toHaveAttribute('placeholder', 'Ask Lex anything about Scrabble...');
  });

  test('chat send button is visible and clickable', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.locator('#ask-lex-tile').click();
    await page.locator('#lex-solver-modal').waitFor({ state: 'visible' });

    const sendBtn = page.locator('#lex-solver-chat-send');
    await expect(sendBtn).toBeVisible();
    await expect(sendBtn).toHaveAttribute('title', 'Send message');
  });

  test('chat textarea accepts text input', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.locator('#ask-lex-tile').click();
    await page.locator('#lex-solver-modal').waitFor({ state: 'visible' });

    const chatInput = page.locator('#lex-solver-chat-input');
    await chatInput.fill('What are the best two-letter words?');
    await expect(chatInput).toHaveValue('What are the best two-letter words?');
  });
});

test.describe('Lex Solver Chat Input — Negative', () => {
  test('no duplicate chat textareas in the modal', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.locator('#ask-lex-tile').click();
    await page.locator('#lex-solver-modal').waitFor({ state: 'visible' });

    const chatInputs = page.locator('#lex-solver-chat-input');
    await expect(chatInputs).toHaveCount(1);
  });

  test('chat input does not cause JavaScript errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(`${BASE_URL}/`);
    await page.locator('#ask-lex-tile').click();
    await page.locator('#lex-solver-modal').waitFor({ state: 'visible' });

    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });
});
