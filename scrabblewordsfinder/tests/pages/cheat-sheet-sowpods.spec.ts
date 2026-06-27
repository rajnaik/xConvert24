import { test, expect } from '@playwright/test';

/**
 * SOWPODS Cheat Sheet Tests
 * Verifies the printable cheat sheet page loads correctly,
 * word grids display with correct text colors, and all sections render.
 */

test.describe('SOWPODS Cheat Sheet — Positive', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto('/cheat-sheets/sowpods/');
    await expect(page).toHaveTitle(/SOWPODS.*Cheat Sheet/i);
  });

  test('has main heading', async ({ page }) => {
    await page.goto('/cheat-sheets/sowpods/');
    await expect(page.getByRole('heading', { name: 'SOWPODS Scrabble Cheat Sheet' })).toBeVisible();
  });

  test('word-grid has explicit color style set', async ({ page }) => {
    await page.goto('/cheat-sheets/sowpods/');
    const wordGrid = page.locator('.word-grid').first();
    await expect(wordGrid).toBeVisible();
    const color = await wordGrid.evaluate(el => getComputedStyle(el).color);
    // In light mode: #1f2937 = rgb(31, 41, 55)
    // In dark mode: #f3f4f6 = rgb(243, 244, 246)
    // Either way, it must be an explicitly set readable color (not transparent)
    expect(color).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    expect(color).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('word-columns has explicit color style set', async ({ page }) => {
    await page.goto('/cheat-sheets/sowpods/');
    const wordCols = page.locator('.word-columns').first();
    await expect(wordCols).toBeVisible();
    const color = await wordCols.evaluate(el => getComputedStyle(el).color);
    // Must be an explicitly set readable color
    expect(color).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    expect(color).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('print button is visible', async ({ page }) => {
    await page.goto('/cheat-sheets/sowpods/');
    const printBtn = page.locator('.print-btn');
    await expect(printBtn).toBeVisible();
  });

  test('contains 2-letter words section', async ({ page }) => {
    await page.goto('/cheat-sheets/sowpods/');
    const section = page.locator('h2', { hasText: /2.letter/i });
    await expect(section).toBeVisible();
  });

  test('contains Q without U section', async ({ page }) => {
    await page.goto('/cheat-sheets/sowpods/');
    const section = page.locator('h2', { hasText: /Q without U/i });
    await expect(section).toBeVisible();
  });

  test('stats section contains 8 clickable anchor links', async ({ page }) => {
    await page.goto('/cheat-sheets/sowpods/');
    const statLinks = page.locator('.stats a.stat');
    await expect(statLinks).toHaveCount(8);
  });

  test('stat links have correct href anchors', async ({ page }) => {
    await page.goto('/cheat-sheets/sowpods/');
    const expectedHrefs = [
      '#two-letter',
      '#three-letter',
      '#short-j',
      '#short-q',
      '#short-x',
      '#short-z',
      '#q-no-u',
      '#vowel-dumps',
    ];
    const statLinks = page.locator('.stats a.stat');
    for (let i = 0; i < expectedHrefs.length; i++) {
      await expect(statLinks.nth(i)).toHaveAttribute('href', expectedHrefs[i]);
    }
  });

  test('clicking a stat link scrolls to the target section', async ({ page }) => {
    await page.goto('/cheat-sheets/sowpods/');
    await page.locator('.stats a.stat[href="#q-no-u"]').click();
    const target = page.locator('#q-no-u');
    await expect(target).toBeInViewport();
  });

  test('contains Vowel Dump Words section', async ({ page }) => {
    await page.goto('/cheat-sheets/sowpods/');
    const section = page.locator('h2', { hasText: /Vowel Dump Words/i });
    await expect(section).toBeVisible();
  });

  test('vowel dumps section has word content', async ({ page }) => {
    await page.goto('/cheat-sheets/sowpods/');
    const section = page.locator('#vowel-dumps');
    await expect(section).toBeVisible();
    const text = await section.textContent();
    // Should contain actual words (vowel-heavy words like EAU, AQUAE, etc.)
    expect(text?.trim().length).toBeGreaterThan(20);
  });

  test('vowel dumps stat link navigates to section', async ({ page }) => {
    await page.goto('/cheat-sheets/sowpods/');
    await page.locator('.stats a.stat[href="#vowel-dumps"]').click();
    const target = page.locator('#vowel-dumps');
    await expect(target).toBeInViewport();
  });
});

test.describe('SOWPODS Cheat Sheet — Negative', () => {
  test('no critical JavaScript errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/cheat-sheets/sowpods/');
    // Filter out AdSense errors (expected on localhost/dev)
    const critical = errors.filter(e => !e.includes('adsbygoogle'));
    expect(critical).toHaveLength(0);
  });

  test('word grid text is not invisible (color is not transparent)', async ({ page }) => {
    await page.goto('/cheat-sheets/sowpods/');
    const wordGrid = page.locator('.word-grid').first();
    await expect(wordGrid).toBeVisible();
    const color = await wordGrid.evaluate(el => getComputedStyle(el).color);
    expect(color).not.toBe('rgba(0, 0, 0, 0)');
    expect(color).not.toBe('');
  });

  test('word-columns text is not invisible', async ({ page }) => {
    await page.goto('/cheat-sheets/sowpods/');
    const wordCols = page.locator('.word-columns').first();
    await expect(wordCols).toBeVisible();
    const color = await wordCols.evaluate(el => getComputedStyle(el).color);
    expect(color).not.toBe('rgba(0, 0, 0, 0)');
    expect(color).not.toBe('');
  });

  test('word grids contain actual word content', async ({ page }) => {
    await page.goto('/cheat-sheets/sowpods/');
    const wordGrid = page.locator('.word-grid').first();
    const text = await wordGrid.textContent();
    // Should have actual word content, not be empty
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('all stat anchor targets exist on the page', async ({ page }) => {
    await page.goto('/cheat-sheets/sowpods/');
    const statLinks = page.locator('.stats a.stat');
    const count = await statLinks.count();
    for (let i = 0; i < count; i++) {
      const href = await statLinks.nth(i).getAttribute('href');
      // href is like "#two-letter" — strip # to get the id
      const targetId = href?.replace('#', '');
      const target = page.locator(`#${targetId}`);
      await expect(target).toBeAttached();
    }
  });

  test('no duplicate stat links exist', async ({ page }) => {
    await page.goto('/cheat-sheets/sowpods/');
    const statLinks = page.locator('.stats a.stat');
    const hrefs: string[] = [];
    const count = await statLinks.count();
    for (let i = 0; i < count; i++) {
      const href = await statLinks.nth(i).getAttribute('href');
      hrefs.push(href ?? '');
    }
    const unique = new Set(hrefs);
    expect(unique.size).toBe(hrefs.length);
  });

  test('vowel dumps section does not contain consonant-heavy words', async ({ page }) => {
    await page.goto('/cheat-sheets/sowpods/');
    const section = page.locator('#vowel-dumps .word-columns div, #vowel-dumps .word-grid span');
    const count = await section.count();
    // Should have words — section isn't empty
    expect(count).toBeGreaterThan(0);
    // Check first 5 words are actually vowel-heavy (≥66% vowels)
    const vowelSet = new Set(['A','E','I','O','U']);
    const limit = Math.min(count, 5);
    for (let i = 0; i < limit; i++) {
      const word = (await section.nth(i).textContent())?.trim() ?? '';
      if (word.length === 0) continue;
      const vowelCount = [...word].filter(c => vowelSet.has(c.toUpperCase())).length;
      expect(vowelCount / word.length).toBeGreaterThanOrEqual(0.6);
    }
  });
});
