import { test, expect } from '@playwright/test';

/**
 * Saved Words / Achievements System Tests
 * Tests clicking words to save, the saved words panel, edit modal,
 * download functionality, and server sync.
 */

test.describe('Saved Words — Click to Save', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear localStorage for clean state
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    // Wait for dictionary
    await expect(page.locator('#two-letter-words')).not.toContainText('Loading', { timeout: 15000 });
  });

  test('clicking a result word saves it (shows crown)', async ({ page }) => {
    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#text-solve-btn').click();
    await expect(page.locator('#results')).toContainText('words found');

    // Click first result word
    const firstWord = page.locator('#results [data-achieve-word]').first();
    await firstWord.click();

    // Should show crown emoji (achievement tiara)
    await expect(firstWord.locator('.achievement-tiara')).toBeAttached();
    // Should have emerald ring class
    await expect(firstWord).toHaveClass(/ring-emerald-500/);
  });

  test('clicking saved word again removes it', async ({ page }) => {
    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#text-solve-btn').click();
    await expect(page.locator('#results')).toContainText('words found');

    const firstWord = page.locator('#results [data-achieve-word]').first();
    // Save
    await firstWord.click();
    await expect(firstWord).toHaveClass(/ring-emerald-500/);
    // Unsave
    await firstWord.click();
    await expect(firstWord).not.toHaveClass(/ring-emerald-500/);
  });

  test('saved words appear in the saved words panel', async ({ page }) => {
    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#text-solve-btn').click();
    await expect(page.locator('#results')).toContainText('words found');

    // Click a word
    await page.locator('#results [data-achieve-word]').first().click();

    // Saved panel should no longer show "No saved words yet"
    await expect(page.locator('#saved-empty')).not.toBeVisible();
    // Count should be > 0
    const count = await page.locator('#saved-count').textContent();
    expect(parseInt(count || '0')).toBeGreaterThan(0);
  });

  test('saved words persist in localStorage', async ({ page }) => {
    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#text-solve-btn').click();
    await expect(page.locator('#results')).toContainText('words found');

    await page.locator('#results [data-achieve-word]').first().click();

    const achievements = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('scbAchievements') || '[]');
    });
    expect(achievements.length).toBeGreaterThan(0);
    expect(achievements[0].word).toBeTruthy();
  });

  test('clicking word copies to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#text-solve-btn').click();
    await expect(page.locator('#results')).toContainText('words found');

    const firstWord = page.locator('#results [data-achieve-word]').first();
    const wordText = await firstWord.getAttribute('data-achieve-word');
    await firstWord.click();

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard.toLowerCase()).toBe(wordText?.toUpperCase().toLowerCase());
  });
});

test.describe('Saved Words — Download', () => {
  test('download button is greyed out when no saved words', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    const downloadBtn = page.locator('#download-saved-btn');
    await expect(downloadBtn).toHaveClass(/opacity-30/);
  });

  test('download button activates when words are saved', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('scbAchievements', JSON.stringify([
        { word: 'test', meaning: '' }
      ]));
    });
    await page.reload();
    const downloadBtn = page.locator('#download-saved-btn');
    await expect(downloadBtn).toHaveClass(/opacity-100/);
  });

  test('clicking download produces a JSON file', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('swf-uid', 'test-uid-12345');
      localStorage.setItem('scbAchievements', JSON.stringify([
        { word: 'quiz', meaning: '(noun) a test' }
      ]));
    });
    await page.reload();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#download-saved-btn').click(),
    ]);

    const filename = download.suggestedFilename();
    expect(filename).toMatch(/scrabble-words.*\.json$/);

    const path = await download.path();
    const fs = await import('fs');
    const content = JSON.parse(fs.readFileSync(path!, 'utf-8'));
    expect(content.version).toBeDefined();
    expect(content.achievements || content.savedWords).toBeTruthy();
  });
});

test.describe('Saved Words — Reference Panel Clicks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.locator('#two-letter-words')).not.toContainText('Loading', { timeout: 15000 });
  });

  test('clicking a two-letter word saves it', async ({ page }) => {
    const word = page.locator('#two-letter-words [data-achieve-word]').first();
    await word.click();
    await expect(word).toHaveClass(/ring-emerald-500|bg-emerald/);

    const achievements = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('scbAchievements') || '[]');
    });
    expect(achievements.length).toBeGreaterThan(0);
  });

  test('clicking a Q-without-U word saves it', async ({ page }) => {
    const word = page.locator('#q-without-u [data-achieve-word]').first();
    await word.click();

    const achievements = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('scbAchievements') || '[]');
    });
    expect(achievements.length).toBeGreaterThan(0);
  });

  test('clicking rare letter tab word saves it', async ({ page }) => {
    // Click Z tab
    await page.locator('.rare-tab[data-rare="z"]').click();
    await page.waitForTimeout(300);
    const word = page.locator('#rare-letter-results [data-achieve-word]').first();
    await word.click();

    const achievements = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('scbAchievements') || '[]');
    });
    expect(achievements.length).toBeGreaterThan(0);
  });
});
