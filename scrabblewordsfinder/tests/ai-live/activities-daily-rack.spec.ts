import { test, expect } from '@playwright/test';

/**
 * AI Live Test — Activities Daily Rack Challenge
 * 
 * Tests:
 * 1. Go to /activities/ — copy the daily rack tiles
 * 2. Go to homepage solver — enter the rack, extract top 5 words from DOM
 * 3. Go back to /activities/ — submit each word into Daily Rack
 * 4. Verify words appear in "Your Words Today" section
 */

const BASE = process.env.SWF_TEST_URL || 'https://www.scrabblewordsfinder.com';
const TEST_USER_ID = '716fd02b-9d37-4a16-b2f1-4c1312ead857';

test.describe('AI Live — Activities Daily Rack', () => {
  test.setTimeout(90000);

  test('solve daily rack and submit words', async ({ page }) => {
    // Set user ID
    await page.goto(`${BASE}/activities/`);
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate((uid) => {
      localStorage.setItem('swf-uid', uid);
      localStorage.setItem('swf_user_id', uid);
    }, TEST_USER_ID);
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);

    // Step 1: Get the rack tiles text
    const rackTiles = page.locator('#drc-tiles');
    await expect(rackTiles).toBeVisible({ timeout: 10000 });
    // Extract letters from rack tiles using evaluate (tiles have letter spans)
    const rack = await page.evaluate(() => {
      const el = document.getElementById('drc-tiles');
      if (!el) return '';
      // Get all letter characters from the tile elements
      const letters = el.textContent?.replace(/[^A-Z]/g, '') || '';
      return letters.slice(0, 7);
    });
    expect(rack.length).toBeGreaterThanOrEqual(7);

    // Step 2: Go to homepage solver and enter the rack
    await page.goto(`${BASE}/`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    const solverInput = page.locator('#text-solver');
    await expect(solverInput).toBeVisible();
    await solverInput.fill(rack);

    // Trigger the solver — click the Find Words button
    const solveBtn = page.locator('#text-solve-btn');
    await solveBtn.click();

    // Wait for solver results
    const resultsEl = page.locator('#results');
    await expect(resultsEl).toContainText('words found', { timeout: 20000 });
    await page.waitForTimeout(3000);

    // Extract top 5 words from results using page.evaluate
    const topWords = await page.evaluate(() => {
      const resultsDiv = document.getElementById('results');
      if (!resultsDiv) return [];
      // The solver renders results as clickable spans/buttons with word text
      // Try multiple selectors
      const wordEls = resultsDiv.querySelectorAll('[data-word], .word-btn, span[class*="word"], button');
      if (wordEls.length > 0) {
        const words: string[] = [];
        wordEls.forEach(el => {
          const w = (el.getAttribute('data-word') || el.textContent || '').replace(/[^A-Z]/gi, '').toUpperCase();
          if (w.length >= 2 && w.length <= 7) words.push(w);
        });
        return [...new Set(words)].slice(0, 5);
      }
      // Fallback: parse all text for uppercase word sequences
      const text = resultsDiv.innerText || '';
      const lines = text.split('\n');
      const words: string[] = [];
      for (const line of lines) {
        const match = line.match(/^([A-Z]{2,7})/);
        if (match) words.push(match[1]);
      }
      return [...new Set(words)].slice(0, 5);
    });

    expect(topWords.length).toBeGreaterThanOrEqual(1);

    // Step 3: Go back to activities and submit words
    await page.goto(`${BASE}/activities/`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);

    const drcInput = page.locator('#drc-input');
    const drcSubmit = page.locator('#drc-submit');
    await expect(drcInput).toBeVisible({ timeout: 10000 });
    await expect(drcSubmit).toBeVisible();

    // Submit each word
    for (const word of topWords) {
      await drcInput.fill(word);
      await drcSubmit.click();
      await page.waitForTimeout(1500);
    }

    // Step 4: Verify words appear in "Your Words Today" section
    await page.waitForTimeout(2000);
    const yourWordsText = await page.locator('#drc-your-list').textContent();

    // At least one submitted word should appear
    let foundCount = 0;
    for (const word of topWords) {
      if (yourWordsText?.toUpperCase().includes(word)) {
        foundCount++;
      }
    }
    expect(foundCount).toBeGreaterThanOrEqual(1);
  });
});
