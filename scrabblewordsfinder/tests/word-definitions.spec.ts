import { test, expect } from '@playwright/test';

/**
 * Word Definitions & Tooltips Tests
 * Tests the click-to-define feature that fetches definitions
 * from the Free Dictionary API and displays tooltips.
 */

test.describe('Word Definitions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.locator('#two-letter-words')).not.toContainText('Loading', { timeout: 15000 });
  });

  test('clicking a result word shows definition tooltip', async ({ page }) => {
    // Mock the dictionary API
    await page.route('**/api.dictionaryapi.dev/**', route => {
      route.fulfill({
        json: [{
          meanings: [{
            partOfSpeech: 'noun',
            definitions: [{ definition: 'A type of board game word' }],
          }],
        }],
      });
    });

    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#text-solve-btn').click();
    await expect(page.locator('#results')).toContainText('words found');

    // Click a word to show definition
    const word = page.locator('#results [data-highlight-word]').first();
    await word.click();

    // Tooltip should appear
    const tooltip = page.locator('.word-def-tooltip');
    await expect(tooltip).toBeVisible({ timeout: 5000 });
    await expect(tooltip).toContainText('board game word');
  });

  test('definition tooltip shows part of speech', async ({ page }) => {
    await page.route('**/api.dictionaryapi.dev/**', route => {
      route.fulfill({
        json: [{
          meanings: [{
            partOfSpeech: 'verb',
            definitions: [{ definition: 'To move quickly' }],
          }],
        }],
      });
    });

    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#text-solve-btn').click();
    await expect(page.locator('#results')).toContainText('words found');

    await page.locator('#results [data-highlight-word]').first().click();
    const tooltip = page.locator('.word-def-tooltip');
    await expect(tooltip).toBeVisible({ timeout: 5000 });
    await expect(tooltip).toContainText('verb');
  });

  test('shows "No definition found" for unknown words', async ({ page }) => {
    await page.route('**/api.dictionaryapi.dev/**', route => {
      route.fulfill({ status: 404, json: {} });
    });

    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#text-solve-btn').click();
    await expect(page.locator('#results')).toContainText('words found');

    await page.locator('#results [data-highlight-word]').first().click();
    const tooltip = page.locator('.word-def-tooltip');
    await expect(tooltip).toBeVisible({ timeout: 5000 });
    await expect(tooltip).toContainText('No definition found');
  });

  test('tooltip auto-dismisses after time', async ({ page }) => {
    await page.route('**/api.dictionaryapi.dev/**', route => {
      route.fulfill({
        json: [{
          meanings: [{
            partOfSpeech: 'noun',
            definitions: [{ definition: 'Something' }],
          }],
        }],
      });
    });

    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#text-solve-btn').click();
    await expect(page.locator('#results')).toContainText('words found');

    await page.locator('#results [data-highlight-word]').first().click();
    const tooltip = page.locator('.word-def-tooltip');
    await expect(tooltip).toBeVisible({ timeout: 5000 });

    // Wait for auto-dismiss (8 seconds)
    await page.waitForTimeout(9000);
    await expect(tooltip).not.toBeAttached();
  });

  test('clicking same word again removes tooltip', async ({ page }) => {
    await page.route('**/api.dictionaryapi.dev/**', route => {
      route.fulfill({
        json: [{
          meanings: [{
            partOfSpeech: 'noun',
            definitions: [{ definition: 'Something' }],
          }],
        }],
      });
    });

    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#text-solve-btn').click();
    await expect(page.locator('#results')).toContainText('words found');

    const word = page.locator('#results [data-highlight-word]').first();
    await word.click();
    await expect(page.locator('.word-def-tooltip')).toBeVisible({ timeout: 5000 });

    // Click same word again
    await word.click();
    await expect(page.locator('.word-def-tooltip')).not.toBeAttached();
  });

  test('definitions work on reference panel words', async ({ page }) => {
    await page.route('**/api.dictionaryapi.dev/**', route => {
      route.fulfill({
        json: [{
          meanings: [{
            partOfSpeech: 'noun',
            definitions: [{ definition: 'Life force in Chinese philosophy' }],
          }],
        }],
      });
    });

    // Click a two-letter word in reference panel
    const refWord = page.locator('#two-letter-words [data-achieve-word]').first();
    await refWord.click();

    const tooltip = page.locator('.word-def-tooltip');
    await expect(tooltip).toBeVisible({ timeout: 5000 });
  });
});

test.describe('High-Scoring Words Table', () => {
  test('high-scoring panel appears after dictionary loads', async ({ page }) => {
    await page.goto('/');
    const panel = page.locator('#high-scoring-panel');
    await expect(panel).toBeVisible({ timeout: 15000 });
  });

  test('table shows 4 rows (2-letter through 5-letter)', async ({ page }) => {
    await page.goto('/');
    const panel = page.locator('#high-scoring-panel');
    await expect(panel).toBeVisible({ timeout: 15000 });
    const rows = panel.locator('tbody tr');
    await expect(rows).toHaveCount(4);
  });

  test('table shows correct length labels', async ({ page }) => {
    await page.goto('/');
    const panel = page.locator('#high-scoring-panel');
    await expect(panel).toBeVisible({ timeout: 15000 });
    const labels = await panel.locator('tbody td:first-child').allTextContents();
    expect(labels).toEqual(['2-letter', '3-letter', '4-letter', '5-letter']);
  });

  test('words in table are clickable to save', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    const panel = page.locator('#high-scoring-panel');
    await expect(panel).toBeVisible({ timeout: 15000 });

    const word = panel.locator('[data-achieve-word]').first();
    await word.click();

    const achievements = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('scbAchievements') || '[]');
    });
    expect(achievements.length).toBeGreaterThan(0);
  });
});
