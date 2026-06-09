import { test, expect } from '@playwright/test';

/**
 * Scrabble Solver Feature Tests
 * Tests the download saved words button, high-scoring words table,
 * hint bubble, and related blog links.
 */

test.describe('Scrabble Solver: Download Saved Words', () => {
  test('download button exists in saved words panel', async ({ page }) => {
    await page.goto('/tools/scrabble');
    const downloadBtn = page.locator('#download-saved-btn');
    await expect(downloadBtn).toBeAttached();
  });

  test('download button is greyed out when no saved words', async ({ page }) => {
    await page.goto('/tools/scrabble');
    // Clear any existing saved words
    await page.evaluate(() => localStorage.removeItem('scbWords'));
    await page.reload();
    const downloadBtn = page.locator('#download-saved-btn');
    await expect(downloadBtn).toHaveClass(/opacity-30/);
  });

  test('download button activates when words are saved', async ({ page }) => {
    await page.goto('/tools/scrabble');
    // Inject a saved word into localStorage
    await page.evaluate(() => {
      localStorage.setItem('scbWords', JSON.stringify([
        { word: 'TEST', score: 4, star: 3, comment: '', datetime: '' }
      ]));
    });
    await page.reload();
    const downloadBtn = page.locator('#download-saved-btn');
    await expect(downloadBtn).toHaveClass(/opacity-100/);
  });

  test('clicking download triggers a file download with correct structure', async ({ page }) => {
    await page.goto('/tools/scrabble');
    // Set up UID and saved words
    await page.evaluate(() => {
      localStorage.setItem('xconvert24-uid', 'test-user-12345678');
      localStorage.setItem('scbWords', JSON.stringify([
        { word: 'QUIZ', score: 22, star: 5, comment: 'great word', datetime: '2026-06-09T10:00:00' }
      ]));
    });
    await page.reload();

    // Listen for download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#download-saved-btn').click(),
    ]);

    // Verify filename pattern
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/^scrabble-words-test-use.*\.json$/);

    // Read and verify content
    const path = await download.path();
    const fs = await import('fs');
    const content = JSON.parse(fs.readFileSync(path!, 'utf-8'));
    expect(content.version).toBe(1);
    expect(content.userId).toBe('test-user-12345678');
    expect(content.savedWords).toHaveLength(1);
    expect(content.savedWords[0].word).toBe('QUIZ');
    expect(content.exportedAt).toBeTruthy();
  });
});

test.describe('Scrabble Solver: High-Scoring Words Table', () => {
  test('high-scoring words table appears after dictionary loads', async ({ page }) => {
    await page.goto('/tools/scrabble');
    // Wait for dictionary to load and table to render
    const table = page.locator('#results table');
    await expect(table).toBeVisible({ timeout: 10000 });
  });

  test('table has 4 rows (2-letter through 5-letter)', async ({ page }) => {
    await page.goto('/tools/scrabble');
    const table = page.locator('#results table');
    await expect(table).toBeVisible({ timeout: 10000 });
    const rows = table.locator('tbody tr');
    await expect(rows).toHaveCount(4);
  });

  test('table shows word lengths in correct order', async ({ page }) => {
    await page.goto('/tools/scrabble');
    const table = page.locator('#results table');
    await expect(table).toBeVisible({ timeout: 10000 });
    const labels = await table.locator('tbody td:first-child').allTextContents();
    expect(labels).toEqual(['2-letter', '3-letter', '4-letter', '5-letter']);
  });

  test('high-scoring words disappear after search', async ({ page }) => {
    await page.goto('/tools/scrabble');
    const table = page.locator('#results table');
    await expect(table).toBeVisible({ timeout: 10000 });

    // Perform a search
    await page.fill('#tiles', 'AERTBLS');
    await page.click('#solve-btn');

    // Table should be replaced by results
    await expect(table).not.toBeVisible({ timeout: 5000 });
    // Results should show found words
    const results = page.locator('#results');
    await expect(results).toContainText('words found');
  });
});

test.describe('Scrabble Solver: Hint Bubble', () => {
  test('hint bubble appears after 1 second on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/tools/scrabble');
    const bubble = page.locator('#hint-bubble');
    await expect(bubble).toBeAttached();

    // Wait for it to appear (1s delay + animation)
    await page.waitForTimeout(1500);
    await expect(bubble).toHaveClass(/opacity-100/);
  });

  test('hint bubble disappears on input focus', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/tools/scrabble');
    const bubble = page.locator('#hint-bubble');

    // Wait for bubble to appear
    await page.waitForTimeout(1500);
    await expect(bubble).toHaveClass(/opacity-100/);

    // Focus the input
    await page.click('#tiles');

    // Bubble should fade/hide
    await page.waitForTimeout(500);
    await expect(bubble).toHaveClass(/opacity-0|hidden/);
  });
});

test.describe('Scrabble Solver: Related Blog Links', () => {
  test('scrabble page has Related Articles section', async ({ page }) => {
    await page.goto('/tools/scrabble');
    const section = page.locator('text=Related Articles');
    await expect(section).toBeAttached();
  });

  test('links to all 4 scrabble blog posts', async ({ page }) => {
    await page.goto('/tools/scrabble');
    const blogs = [
      '/blog/scrabble-history-origins-great-depression',
      '/blog/scrabble-tile-strategy-letters-scoring',
      '/blog/scrabble-dictionaries-languages-weird-words',
      '/blog/competitive-scrabble-tournament-world',
    ];
    for (const href of blogs) {
      const link = page.locator(`a[href="${href}"]`);
      await expect(link, `Should have link to ${href}`).toBeAttached();
    }
  });
});

test.describe('Scrabble Solver: Bug Report & Suggest Links', () => {
  test('has bug report link pointing to report-bug with tool name', async ({ page }) => {
    await page.goto('/tools/scrabble');
    const bugLink = page.locator('a[href*="/report-bug?tool="]');
    await expect(bugLink).toBeAttached();
    const href = await bugLink.getAttribute('href');
    expect(href).toContain('Free+Scrabble+Word+Finder');
  });

  test('has suggest feature link', async ({ page }) => {
    await page.goto('/tools/scrabble');
    const suggestLink = page.locator('a[href*="/suggest?title="]');
    await expect(suggestLink).toBeAttached();
  });
});
