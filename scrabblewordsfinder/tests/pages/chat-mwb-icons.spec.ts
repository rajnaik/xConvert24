import { test, expect } from '@playwright/test';

/**
 * Chat Page — MWB (Memory WordBench) Import Icons on Identified Words
 *
 * Tests the per-word "Add to Memory WordBench" icon that appears next to each
 * identified word in the chat sidebar. Clicking the + icon imports the word
 * and shows a ✓ checkmark.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Chat MWB Icons — Positive', () => {
  test('identified words show + icon with correct title', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    // Seed identified words via localStorage so the panel renders them
    await page.evaluate(() => {
      localStorage.setItem('swf-chat-identified-words', JSON.stringify(['QUIXOTIC', 'ZEPHYRS']));
    });
    await page.reload();
    // Wait for identified words panel to be visible
    const panel = page.locator('#identified-words-panel');
    await panel.waitFor({ state: 'visible', timeout: 5000 });
    // Each word should have a .word-mwb-icon with title "Add to Memory WordBench"
    const icons = page.locator('.word-mwb-icon');
    const count = await icons.count();
    expect(count).toBe(2);
    // First icon should have the + title (not yet imported)
    await expect(icons.first()).toHaveAttribute('title', 'Add to Memory WordBench');
  });

  test('clicking + icon imports word to MWB and shows checkmark', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    // Seed identified words
    await page.evaluate(() => {
      localStorage.setItem('swf-chat-identified-words', JSON.stringify(['THRIVE']));
      localStorage.removeItem('scbAchievements');
    });
    await page.reload();
    const panel = page.locator('#identified-words-panel');
    await panel.waitFor({ state: 'visible', timeout: 5000 });

    const icon = page.locator('.word-mwb-icon[data-word="THRIVE"]');
    await expect(icon).toBeVisible();
    await icon.click();

    // Wait for the icon to change to "Added to WordBench" title (re-rendered)
    await expect(page.locator('.word-mwb-icon[data-word="THRIVE"][title="Added to WordBench"]'))
      .toBeVisible({ timeout: 10000 });

    // Verify word was saved to localStorage
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('scbAchievements') || '[]'));
    const found = saved.find((a: any) => a.word === 'THRIVE');
    expect(found).toBeDefined();
    expect(found.category).toBe('Lex AI');
  });

  test('imported icon has green styling and is not clickable', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => {
      localStorage.setItem('swf-chat-identified-words', JSON.stringify(['CASTLE']));
      localStorage.removeItem('scbAchievements');
    });
    await page.reload();
    const panel = page.locator('#identified-words-panel');
    await panel.waitFor({ state: 'visible', timeout: 5000 });

    // Click to import
    const icon = page.locator('.word-mwb-icon[data-word="CASTLE"]');
    await icon.click();
    // Wait for re-render with checkmark
    const importedIcon = page.locator('.word-mwb-icon[data-word="CASTLE"][title="Added to WordBench"]');
    await importedIcon.waitFor({ state: 'visible', timeout: 10000 });

    // Should have green styling, no cursor-pointer
    const classes = await importedIcon.getAttribute('class');
    expect(classes).toContain('bg-green-900/40');
    expect(classes).toContain('border-green-500/50');
    expect(classes).not.toContain('cursor-pointer');
  });
});

test.describe('Chat MWB Icons — Negative', () => {
  test('clicking imported icon does not duplicate the word in MWB', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    // Pre-seed a word already in MWB
    await page.evaluate(() => {
      localStorage.setItem('swf-chat-identified-words', JSON.stringify(['EPHEMERAL']));
      localStorage.removeItem('scbAchievements');
    });
    await page.reload();
    const panel = page.locator('#identified-words-panel');
    await panel.waitFor({ state: 'visible', timeout: 5000 });

    // Import the word
    const icon = page.locator('.word-mwb-icon[data-word="EPHEMERAL"]');
    await icon.click();
    await page.locator('.word-mwb-icon[data-word="EPHEMERAL"][title="Added to WordBench"]')
      .waitFor({ state: 'visible', timeout: 10000 });

    // Count saved entries
    const countBefore = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('scbAchievements') || '[]').filter((a: any) => a.word === 'EPHEMERAL').length
    );
    expect(countBefore).toBe(1);

    // Try clicking the now-imported icon again — should not add a duplicate
    await page.locator('.word-mwb-icon[data-word="EPHEMERAL"]').click();
    await page.waitForTimeout(500);

    const countAfter = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('scbAchievements') || '[]').filter((a: any) => a.word === 'EPHEMERAL').length
    );
    expect(countAfter).toBe(1);
  });

  test('no word-mwb-icon elements when identified words panel is empty', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => {
      localStorage.removeItem('swf-chat-identified-words');
    });
    await page.reload();
    await page.waitForTimeout(1000);
    const icons = page.locator('.word-mwb-icon');
    const count = await icons.count();
    expect(count).toBe(0);
  });
});
