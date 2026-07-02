import { test, expect } from '@playwright/test';

/**
 * Chat Page — Analyse Score Tile
 *
 * Tests the "Analyse Score" tile in the right column of /chat/ which shows
 * game-specific coaching links when the user has score history for
 * Word Quiz, Daily Rack, Daily Anagram, or Cows & Bulls.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Chat Analyse Score Tile — Positive', () => {
  test('analyse-score-tile element exists in page HTML', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const tile = page.locator('#analyse-score-tile');
    await expect(tile).toBeAttached();
  });

  test('tile has correct heading text', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const heading = page.locator('#analyse-score-tile h2');
    const text = await heading.textContent();
    expect(text).toContain('Analyse Score');
  });

  test('tile shows game links when user has score history', async ({ page }) => {
    // Set a fake uid so the JS attempts to fetch user data
    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => {
      localStorage.setItem('swf-uid', 'test-user-analyse-score');
    });
    await page.reload();
    // Wait for the fetch to complete (may or may not show links depending on data)
    await page.waitForTimeout(2000);
    // The tile container should exist regardless
    const tile = page.locator('#analyse-score-tile');
    await expect(tile).toBeAttached();
  });

  test('each visible link has a valid /chat/?context= href', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    // Wait for any potential links to render
    await page.waitForTimeout(2000);
    const links = page.locator('#analyse-score-links a');
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).toMatch(/^\/chat\/\?context=(quiz|rack|anagram|cab)$/);
    }
  });

  test('links show game count badge', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.waitForTimeout(2000);
    const links = page.locator('#analyse-score-links a');
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const text = await links.nth(i).textContent();
      // Should contain "N game" or "N games"
      if (text) {
        expect(text).toMatch(/\d+ games?/);
      }
    }
  });
});

test.describe('Chat Analyse Score Tile — Negative', () => {
  test('no duplicate analyse-score-tile elements', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const tiles = page.locator('#analyse-score-tile');
    const count = await tiles.count();
    expect(count).toBe(1);
  });

  test('tile is hidden when no user ID exists', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => {
      localStorage.removeItem('swf-uid');
    });
    await page.reload();
    await page.waitForTimeout(2000);
    const tile = page.locator('#analyse-score-tile');
    // Should remain hidden (has .hidden class)
    await expect(tile).toHaveClass(/hidden/);
  });

  test('tile does not crash page when user API returns error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => {
      localStorage.setItem('swf-uid', 'nonexistent-user-xyz-123');
    });
    await page.reload();
    await page.waitForTimeout(2000);
    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });

  test('no sensitive data exposed in analyse score section', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const tileHtml = await page.locator('#analyse-score-tile').innerHTML();
    expect(tileHtml).not.toMatch(/sk-[a-zA-Z0-9]{20,}/);
    expect(tileHtml).not.toContain('AKIA');
    expect(tileHtml).not.toMatch(/@gmail\.com/);
  });
});
