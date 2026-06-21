import { test, expect } from '@playwright/test';

/**
 * MWB "Import All Word Lists" Button Tests
 * Tests the single import button that appears in the saved words panel
 * when no words are saved (empty state on the homepage solver).
 */

test.describe('MWB Import All Button — Positive', () => {
  test('import all button is visible when no words are saved', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('scbAchievements', JSON.stringify([]));
    });

    await page.goto('/');
    await page.waitForSelector('#saved-words-list', { timeout: 8000 });

    const btn = page.locator('#mwb-import-all-btn');
    await expect(btn).toBeVisible();
    await expect(btn).toContainText('Import All Word Lists');
  });

  test('empty state shows correct descriptive text', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('scbAchievements', JSON.stringify([]));
    });

    await page.goto('/');
    await page.waitForSelector('#saved-words-list', { timeout: 8000 });

    await expect(page.locator('#saved-words-list')).toContainText('No words saved yet!');
    await expect(page.locator('#saved-words-list')).toContainText('Import all essential Scrabble word lists in one click');
  });

  test('clicking import all button shows loading state', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('scbAchievements', JSON.stringify([]));
    });

    await page.goto('/');
    await page.waitForSelector('#saved-words-list', { timeout: 8000 });

    const btn = page.locator('#mwb-import-all-btn');
    await btn.click();

    // Button should become disabled and show loading text
    await expect(btn).toHaveAttribute('disabled', 'true');
    await expect(btn).toContainText('Loading dictionary');
  });

  test('import all imports words and shows success message', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('scbAchievements', JSON.stringify([]));
    });

    await page.goto('/');
    await page.waitForSelector('#saved-words-list', { timeout: 8000 });

    const btn = page.locator('#mwb-import-all-btn');
    await btn.click();

    // Wait for import to complete (dictionary fetch + processing)
    await expect(btn).toContainText(/Imported \d+ words/, { timeout: 15000 });

    // Verify words were saved to localStorage
    const count = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('scbAchievements') || '[]').length;
    });
    expect(count).toBeGreaterThan(50); // Should import hundreds of words
  });

  test('imported words have correct categories', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('scbAchievements', JSON.stringify([]));
    });

    await page.goto('/');
    await page.waitForSelector('#saved-words-list', { timeout: 8000 });

    await page.locator('#mwb-import-all-btn').click();
    await expect(page.locator('#mwb-import-all-btn')).toContainText(/Imported/, { timeout: 15000 });

    const categories = await page.evaluate(() => {
      const items = JSON.parse(localStorage.getItem('scbAchievements') || '[]');
      return [...new Set(items.map((i: any) => i.category))];
    });

    // Should include all expected categories
    expect(categories).toContain('two-letter');
    expect(categories).toContain('three-letter');
    expect(categories).toContain('q-without-u');
    expect(categories).toContain('rare-letters');
  });

  test('import all button is not shown when words already exist', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('scbAchievements', JSON.stringify([
        { word: 'ALPHA', meaning: 'First letter', category: 'manual', dateAdded: new Date().toISOString() }
      ]));
    });

    await page.goto('/');
    await page.waitForSelector('#saved-words-list', { timeout: 8000 });

    await expect(page.locator('#mwb-import-all-btn')).not.toBeAttached();
  });
});

test.describe('MWB Import All Button — Negative', () => {
  test('no JS errors when import all button is clicked', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('scbAchievements', JSON.stringify([]));
    });

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    await page.waitForSelector('#saved-words-list', { timeout: 8000 });

    await page.locator('#mwb-import-all-btn').click();
    await page.waitForTimeout(3000);

    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });

  test('import all button does not create duplicate words on double click', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('scbAchievements', JSON.stringify([]));
    });

    await page.goto('/');
    await page.waitForSelector('#saved-words-list', { timeout: 8000 });

    const btn = page.locator('#mwb-import-all-btn');
    // Double-click rapidly
    await btn.dblclick();

    // Wait for import to finish
    await expect(btn).toContainText(/Imported|Failed/, { timeout: 15000 });

    // Check for duplicates in localStorage
    const duplicates = await page.evaluate(() => {
      const items = JSON.parse(localStorage.getItem('scbAchievements') || '[]');
      const words = items.map((i: any) => i.word);
      const unique = new Set(words);
      return words.length - unique.size;
    });
    expect(duplicates).toBe(0);
  });

  test('old individual import buttons are not in the saved words panel', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('scbAchievements', JSON.stringify([]));
    });

    await page.goto('/');
    await page.waitForSelector('#saved-words-list', { timeout: 8000 });

    // Old buttons used .import-section-btn class inside #saved-words-list
    const oldButtons = page.locator('#saved-words-list .import-section-btn');
    await expect(oldButtons).toHaveCount(0);
  });

  test('import button is disabled during loading to prevent re-clicks', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('scbAchievements', JSON.stringify([]));
    });

    await page.goto('/');
    await page.waitForSelector('#saved-words-list', { timeout: 8000 });

    const btn = page.locator('#mwb-import-all-btn');
    await btn.click();

    // Immediately after click, should be disabled
    await expect(btn).toBeDisabled();
  });
});
