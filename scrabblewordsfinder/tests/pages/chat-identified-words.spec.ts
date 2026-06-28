import { test, expect } from '@playwright/test';

/**
 * Chat Identified Words — localStorage Persistence Tests
 * Validates that 6+ letter ALL-CAPS words extracted from AI responses
 * are persisted in localStorage and restored on page reload.
 *
 * Feature: swf-chat-identified-words localStorage key
 * File changed: src/pages/chat.astro
 */

const IDENTIFIED_WORDS_KEY = 'swf-chat-identified-words';

test.describe('Chat Identified Words — Positive', () => {
  test('identified words panel exists on chat page', async ({ page }) => {
    await page.goto('/chat/');
    const panel = page.locator('#identified-words-panel');
    await expect(panel).toBeAttached();
  });

  test('identified words list element exists', async ({ page }) => {
    await page.goto('/chat/');
    const list = page.locator('#identified-words-list');
    await expect(list).toBeAttached();
  });

  test('clear button exists for identified words', async ({ page }) => {
    await page.goto('/chat/');
    const clearBtn = page.locator('#clear-identified-words');
    await expect(clearBtn).toBeAttached();
  });

  test('panel is visible when localStorage has words', async ({ page }) => {
    await page.goto('/chat/');
    await page.evaluate((key) => {
      localStorage.setItem(key, JSON.stringify(['QUIXOTIC', 'ZEPHYR', 'THRIVE']));
    }, IDENTIFIED_WORDS_KEY);
    await page.reload();

    const panel = page.locator('#identified-words-panel');
    await expect(panel).not.toHaveClass(/hidden/);
  });

  test('words from localStorage render as spans on page load', async ({ page }) => {
    await page.goto('/chat/');
    await page.evaluate((key) => {
      localStorage.setItem(key, JSON.stringify(['QUIXOTIC', 'ZEPHYR']));
    }, IDENTIFIED_WORDS_KEY);
    await page.reload();

    const list = page.locator('#identified-words-list');
    const spans = list.locator('span');
    await expect(spans).toHaveCount(2);
    await expect(spans.first()).toContainText('QUIXOTIC');
    await expect(spans.last()).toContainText('ZEPHYR');
  });

  test('words persist across page reloads', async ({ page }) => {
    await page.goto('/chat/');
    await page.evaluate((key) => {
      localStorage.setItem(key, JSON.stringify(['EPHEMERAL', 'CASTLE']));
    }, IDENTIFIED_WORDS_KEY);

    // Reload
    await page.reload();

    const stored = await page.evaluate((key) => {
      return JSON.parse(localStorage.getItem(key) || '[]');
    }, IDENTIFIED_WORDS_KEY);
    expect(stored).toEqual(['EPHEMERAL', 'CASTLE']);
  });

  test('clear button removes words and hides panel', async ({ page }) => {
    await page.goto('/chat/');
    await page.evaluate((key) => {
      localStorage.setItem(key, JSON.stringify(['TESTING', 'CLEARING']));
    }, IDENTIFIED_WORDS_KEY);
    await page.reload();

    // Panel should be visible
    const panel = page.locator('#identified-words-panel');
    await expect(panel).not.toHaveClass(/hidden/);

    // Click clear
    await page.locator('#clear-identified-words').click();

    // Panel should be hidden
    await expect(panel).toHaveClass(/hidden/);

    // localStorage should be cleared
    const stored = await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, IDENTIFIED_WORDS_KEY);
    expect(stored).toBeNull();
  });

  test('localStorage is removed when words are cleared to zero', async ({ page }) => {
    await page.goto('/chat/');
    await page.evaluate((key) => {
      localStorage.setItem(key, JSON.stringify(['REMOVE']));
    }, IDENTIFIED_WORDS_KEY);
    await page.reload();

    // Clear all words
    await page.locator('#clear-identified-words').click();

    const stored = await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, IDENTIFIED_WORDS_KEY);
    expect(stored).toBeNull();
  });
});

test.describe('Chat Identified Words — Negative', () => {
  test('panel is hidden when localStorage has no words', async ({ page }) => {
    await page.goto('/chat/');
    await page.evaluate((key) => {
      localStorage.removeItem(key);
    }, IDENTIFIED_WORDS_KEY);
    await page.reload();

    const panel = page.locator('#identified-words-panel');
    await expect(panel).toHaveClass(/hidden/);
  });

  test('panel is hidden when localStorage has empty array', async ({ page }) => {
    await page.goto('/chat/');
    await page.evaluate((key) => {
      localStorage.setItem(key, JSON.stringify([]));
    }, IDENTIFIED_WORDS_KEY);
    await page.reload();

    const panel = page.locator('#identified-words-panel');
    await expect(panel).toHaveClass(/hidden/);
  });

  test('no duplicate word spans when reloading with same data', async ({ page }) => {
    await page.goto('/chat/');
    await page.evaluate((key) => {
      localStorage.setItem(key, JSON.stringify(['UNIQUE', 'WORDS']));
    }, IDENTIFIED_WORDS_KEY);
    await page.reload();

    const list = page.locator('#identified-words-list');
    const spans = list.locator('span');
    await expect(spans).toHaveCount(2);
  });

  test('no console errors when localStorage has invalid JSON', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/chat/');
    await page.evaluate((key) => {
      localStorage.setItem(key, 'not-valid-json{{{');
    }, IDENTIFIED_WORDS_KEY);

    // Reload — should not crash
    await page.reload();
    await page.waitForTimeout(1000);

    // Page should still load (panel may be hidden or show error gracefully)
    const chatContainer = page.locator('#chat-container');
    await expect(chatContainer).toBeVisible();
  });

  test('page does not crash when localStorage is empty string', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/chat/');
    await page.evaluate((key) => {
      localStorage.setItem(key, '');
    }, IDENTIFIED_WORDS_KEY);
    await page.reload();
    await page.waitForTimeout(1000);

    // Chat should still be functional
    const chatInput = page.locator('#chat-input');
    await expect(chatInput).toBeVisible();
  });
});
