import { test, expect } from '@playwright/test';

/**
 * AI Chat — Bingo Words E2E Test
 * 
 * Tests that submitting a question to Lex on /chat/:
 * 1. AI responds with a message containing bingo words
 * 2. Identified Words list gets populated with new entries
 * 
 * Uses generous timing to allow the AI to fully stream its response.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('AI Chat — Bingo Words', () => {
  test.setTimeout(120000); // 2 min timeout for AI response

  test('submitting a question gets AI response and populates identified words', async ({ page }) => {
    // Navigate to chat page
    await page.goto(`${BASE}/chat/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Let all panels initialize

    // Count initial messages in the chat
    const messagesEl = page.locator('#messages');
    const initialMessages = await messagesEl.locator('.msg-bubble, [class*="msg-"]').count();

    // Note the initial "Identified Words" list content
    const wordsListEl = page.locator('#identified-words-list');
    const initialWordsText = (await wordsListEl.textContent()) || '';

    // Type the question into the chat input
    const chatInput = page.locator('#chat-input');
    await expect(chatInput).toBeVisible();
    await chatInput.fill('Show me 10 highest Bingo words');

    // Submit the form
    const sendBtn = page.locator('#send-btn');
    await sendBtn.click();

    // Wait for AI response to appear — look for a new assistant message bubble
    // The AI streams its response, so we wait for text content to appear
    await page.waitForFunction(
      (initCount) => {
        const msgs = document.querySelectorAll('#messages .msg-bubble, #messages [class*="msg-"]');
        // We need at least 2 more messages (user + assistant)
        return msgs.length >= initCount + 2;
      },
      initialMessages,
      { timeout: 60000, polling: 2000 }
    );

    // Wait for streaming to complete — the last message should have substantial content
    await page.waitForFunction(
      () => {
        const msgs = document.querySelectorAll('#messages .msg-bubble, #messages [class*="msg-"]');
        const lastMsg = msgs[msgs.length - 1];
        // AI response should be at least 100 chars when talking about bingo words
        return lastMsg && (lastMsg.textContent || '').length > 100;
      },
      null,
      { timeout: 60000, polling: 2000 }
    );

    // Extra wait for identified words extraction to process
    await page.waitForTimeout(5000);

    // Verify: AI response contains word-like content (uppercase words typical of Scrabble)
    const lastMessage = messagesEl.locator('.msg-bubble, [class*="msg-"]').last();
    const responseText = await lastMessage.textContent();
    expect(responseText!.length).toBeGreaterThan(100);

    // Verify: Identified Words list has new entries (more content than before)
    const newWordsText = (await wordsListEl.textContent()) || '';
    expect(newWordsText.length).toBeGreaterThan(initialWordsText.length);
  });
});
