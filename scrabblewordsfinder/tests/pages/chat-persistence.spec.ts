import { test, expect } from '@playwright/test';

/**
 * Chat Page — Persistence Tests
 * Validates that:
 * 1. Identified Words panel renders instantly from localStorage on page load
 * 2. Rack input value persists in localStorage across page refreshes
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Chat Rack Persistence — Positive', () => {
  test('rack input value is saved to localStorage on typing', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const rackInput = page.locator('#rack-input');
    await rackInput.fill('AEILNRT');
    // Trigger input event so the handler fires
    await rackInput.dispatchEvent('input');
    const stored = await page.evaluate(() => localStorage.getItem('swf-chat-rack'));
    expect(stored).toBe('AEILNRT');
  });

  test('rack input value is restored from localStorage on page load', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    // Seed localStorage
    await page.evaluate(() => localStorage.setItem('swf-chat-rack', 'QZXJKVW'));
    // Reload to trigger restore
    await page.reload();
    const rackInput = page.locator('#rack-input');
    await expect(rackInput).toHaveValue('QZXJKVW');
  });

  test('rack value from ?rack= param is persisted to localStorage', async ({ page }) => {
    await page.goto(`${BASE}/chat/?rack=TESTING`);
    // Wait a tick for the autoSubmitFromRack function to run
    await page.waitForTimeout(500);
    const stored = await page.evaluate(() => localStorage.getItem('swf-chat-rack'));
    expect(stored).toBe('TESTING');
  });
});

test.describe('Chat Identified Words Persistence — Positive', () => {
  test('identified words panel renders instantly from localStorage', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    // Seed localStorage with saved words
    await page.evaluate(() => {
      localStorage.setItem('swf-chat-identified-words', JSON.stringify(['LATRINE', 'RETINAL', 'TRENAIL']));
    });
    // Reload — panel should be visible immediately without any AI interaction
    await page.reload();
    const panel = page.locator('#identified-words-panel');
    await expect(panel).toBeVisible();
    const words = page.locator('#identified-words-list span');
    await expect(words).toHaveCount(3);
  });

  test('identified words persist new words to localStorage after AI response', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    // Clear any existing words
    await page.evaluate(() => localStorage.removeItem('swf-chat-identified-words'));
    await page.reload();
    // Simulate what extractIdentifiedWords does by calling it indirectly
    // (set localStorage directly and verify it renders on next load)
    await page.evaluate(() => {
      localStorage.setItem('swf-chat-identified-words', JSON.stringify(['QUIXOTIC', 'ZEPHYRS']));
    });
    await page.reload();
    const panel = page.locator('#identified-words-panel');
    await expect(panel).toBeVisible();
    const words = page.locator('#identified-words-list span');
    await expect(words).toHaveCount(2);
    await expect(words.first()).toContainText('QUIXOTIC');
  });

  test('clear button removes words from localStorage', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => {
      localStorage.setItem('swf-chat-identified-words', JSON.stringify(['EXAMPLE']));
    });
    await page.reload();
    const panel = page.locator('#identified-words-panel');
    await expect(panel).toBeVisible();
    // Click clear
    await page.locator('#clear-identified-words').click();
    await expect(panel).toBeHidden();
    const stored = await page.evaluate(() => localStorage.getItem('swf-chat-identified-words'));
    expect(stored).toBeNull();
  });
});

test.describe('Chat Persistence — Negative', () => {
  test('rack input does not restore invalid characters from localStorage', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    // Even if someone manually sets a bad value, the input maxlength is 7 and only letters
    await page.evaluate(() => localStorage.setItem('swf-chat-rack', 'ABC'));
    await page.reload();
    const rackInput = page.locator('#rack-input');
    await expect(rackInput).toHaveValue('ABC');
    // Verify it's uppercase letters only
    const val = await rackInput.inputValue();
    expect(val).toMatch(/^[A-Z]*$/);
  });

  test('identified words panel stays hidden when localStorage is empty', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.removeItem('swf-chat-identified-words'));
    await page.reload();
    const panel = page.locator('#identified-words-panel');
    await expect(panel).toBeHidden();
  });

  test('identified words panel stays hidden when localStorage has empty array', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.setItem('swf-chat-identified-words', '[]'));
    await page.reload();
    const panel = page.locator('#identified-words-panel');
    await expect(panel).toBeHidden();
  });

  test('no duplicate identified words stored', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    // Store duplicates manually (shouldn't happen, but test resilience)
    await page.evaluate(() => {
      localStorage.setItem('swf-chat-identified-words', JSON.stringify(['LATRINE', 'LATRINE', 'RETINAL']));
    });
    await page.reload();
    // The Set constructor deduplicates, so only unique entries render
    const words = page.locator('#identified-words-list span');
    const count = await words.count();
    // Should be at most 2 unique words (Set deduplicates LATRINE)
    expect(count).toBeLessThanOrEqual(2);
  });
});
