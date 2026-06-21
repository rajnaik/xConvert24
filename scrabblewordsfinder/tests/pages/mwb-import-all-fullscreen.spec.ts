import { test, expect } from '@playwright/test';

/**
 * Memory WordBench — Import All Button & Fullscreen Removal Regression
 * Tests the "Import All Word Lists" button and confirms the fullscreen button
 * was removed without leaving orphan elements or JS errors.
 */

test.describe('MWB Import All Button — Positive', () => {
  test('import all button is visible when no words saved', async ({ page }) => {
    await page.goto('/');
    // Clear any existing achievements to trigger empty state
    await page.evaluate(() => localStorage.removeItem('scbAchievements'));
    await page.reload();
    const btn = page.locator('#mwb-import-all-btn');
    await expect(btn).toBeVisible();
  });

  test('import all button has correct label text', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('scbAchievements'));
    await page.reload();
    const btn = page.locator('#mwb-import-all-btn');
    await expect(btn).toContainText('Import All Word Lists');
  });

  test('import all description text is present', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('scbAchievements'));
    await page.reload();
    const desc = page.locator('#saved-words-list');
    await expect(desc).toContainText('2-letter');
    await expect(desc).toContainText('Q-without-U');
  });
});

test.describe('MWB Import All Button — Negative', () => {
  test('no old individual import buttons exist', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('scbAchievements'));
    await page.reload();
    // The old buttons had data-section attributes like "two-letter-words", "three-letter-words"
    const oldBtns = page.locator('#saved-words-list .import-section-btn');
    await expect(oldBtns).toHaveCount(0);
  });

  test('import all button does not appear when words are already saved', async ({ page }) => {
    await page.goto('/');
    // Seed with a word so the empty state doesn't show
    await page.evaluate(() => {
      const data = [{ word: 'ZA', meaning: 'a type of pizza', category: 'two-letter', dateAdded: new Date().toISOString() }];
      localStorage.setItem('scbAchievements', JSON.stringify(data));
    });
    await page.reload();
    const btn = page.locator('#mwb-import-all-btn');
    await expect(btn).toHaveCount(0);
  });
});

test.describe('MWB Fullscreen Button Removed — Positive', () => {
  test('fullscreen button no longer exists in MWB header', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('#mwb-fullscreen-btn');
    await expect(btn).toHaveCount(0);
  });

  test('MWB toolbar still has download button after fullscreen removal', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('#download-saved-btn');
    await expect(btn).toBeAttached();
  });
});

test.describe('MWB Fullscreen Button Removed — Negative', () => {
  test('no orphan fullscreen aria-label remains in toolbar', async ({ page }) => {
    await page.goto('/');
    const orphan = page.locator('[aria-label="Full screen"]');
    await expect(orphan).toHaveCount(0);
  });

  test('no JavaScript errors from missing fullscreen button references', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    await page.waitForTimeout(500);

    const criticalErrors = errors.filter(e =>
      e.includes('fullscreen') || e.includes('Cannot read properties of null')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
