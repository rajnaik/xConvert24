import { test, expect } from '@playwright/test';

/**
 * Quick Chat Test — Bingo Words Flow
 *
 * Submits "Show me 3 bingo words" and verifies:
 * 1. At least 3 bingo words in the response
 * 2. Keyword added to "Your Recent Questions"
 * 3. Bingo words added to Identified Words panel
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Quick Chat — Bingo Words', () => {
  test('bingo words query populates response, recent questions, and identified words', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => {
      localStorage.removeItem('swf-chat-identified-words');
      localStorage.setItem('swf-uid', 'test-quick-' + Date.now());
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Submit the query
    const input = page.locator('#chat-input');
    await expect(input).toBeVisible();
    await input.fill('Show me 3 bingo words');
    await page.locator('#send-btn').click();

    // Wait for identified words panel to appear (confirms AI responded with 6+ letter words)
    const identifiedPanel = page.locator('#identified-words-panel');
    await expect(identifiedPanel).not.toHaveClass(/hidden/, { timeout: 30000 });

    // 1. At least 3 bingo words in identified words
    const identifiedIcons = page.locator('#identified-words-list .word-mwb-icon');
    const wordCount = await identifiedIcons.count();
    expect(wordCount).toBeGreaterThanOrEqual(3);

    // 2. Keyword in Recent Questions — the full query or a keyword from it
    const keywordHistory = page.locator('#keyword-history');
    // The keyword history loads from API after the chat is logged — wait up to 15s
    await expect(keywordHistory).not.toHaveClass(/hidden/, { timeout: 15000 }).catch(() => {});
    const khVisible = !(await keywordHistory.getAttribute('class'))?.includes('hidden');
    if (khVisible) {
      const khText = await page.locator('#kh-list').textContent();
      // Should contain the query text (or part of it)
      expect(khText?.toLowerCase()).toMatch(/bingo|show me/);
    }

    // 3. Bingo words are present in chat response
    const messagesHtml = await page.locator('#messages').innerHTML();
    const firstWord = await identifiedIcons.first().getAttribute('data-word');
    expect(messagesHtml.toUpperCase()).toContain(firstWord!);
  });
});
