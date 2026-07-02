import { test, expect } from '@playwright/test';

/**
 * AI_Tests — Lex Solver "Find Words" + Chat Keyword (Live)
 *
 * Tests two end-to-end AI flows on the live site:
 *
 * 1. Lex Solver: Enter "TRAINED" in the rack input, click Find Words,
 *    verify the response lists specific anagram words with correct scores
 *    and identifies ANTIRED as the best play with a bingo bonus.
 *
 * 2. AI Chat Keyword: Navigate to /chat/, enter "Highest 3 letter words",
 *    verify the response contains the known top-scoring 3-letter words
 *    (ZZZ, ZIZ, ZUZ, JIZ, ZAX, ZEX, ZEK, FEZ, FIZ, PYX, WIZ, ZHO).
 *
 * PASS = Both responses contain the expected words and scores.
 * FAIL = Missing expected words/scores or no response within timeout.
 */

const LIVE_URL = 'https://www.scrabblewordsfinder.com';

// --- Test 1: Expected words from solving "TRAINED" ---
// 8-point words (all 7-letter anagrams = bingo candidates)
const EIGHT_PT_WORDS = ['ANTIRED', 'DETRAIN', 'TRAINED'];
// 7-point words (6-letter anagrams)
const SEVEN_PT_WORDS = ['AIRNED', 'AIRTED', 'ARDENT', 'DENARI', 'DETAIN', 'ENDART', 'INDART'];

// --- Test 2: Expected top 3-letter words ---
const TOP_3_LETTER_WORDS = ['ZZZ', 'ZIZ', 'ZUZ', 'JIZ', 'ZAX', 'ZEX', 'ZEK'];
const FIFTEEN_PT_3_LETTER = ['FEZ', 'FIZ', 'PYX', 'WIZ', 'ZHO'];

/**
 * Helper: Open Lex solver modal, enter rack, click Find Words,
 * and wait for the response to finish loading (button text reverts to "Ask Lex").
 */
async function solveRackAndWait(page: any, rack: string): Promise<string> {
  await page.goto(`${LIVE_URL}/`);
  await page.waitForTimeout(1000);

  // Open Lex solver modal
  await page.locator('#ask-lex-tile').click();
  await page.locator('#lex-solver-modal').waitFor({ state: 'visible', timeout: 10000 });

  // Enter rack
  const rackInput = page.locator('#lex-rack-input');
  await rackInput.fill(rack);

  // Click Find Words
  await page.locator('#lex-solve-btn').click();

  // Wait for the solve button text to change to "Thinking..." (request started)
  await page.waitForFunction(() => {
    const btn = document.querySelector('#lex-solve-btn');
    return btn && btn.textContent?.trim() === 'Thinking...';
  }, { timeout: 5000 }).catch(() => {});

  // Wait for the solve button text to revert to "Ask Lex" (response complete)
  await page.waitForFunction(() => {
    const btn = document.querySelector('#lex-solve-btn');
    return btn && btn.textContent?.trim() === 'Ask Lex';
  }, { timeout: 45000 });

  // Extra buffer for DOM render to settle
  await page.waitForTimeout(500);

  // Get the response area text content
  const responseArea = page.locator('#lex-solver-response');
  return (await responseArea.textContent()) || '';
}

/**
 * Helper: Go to /chat/, enter a query, wait for AI response.
 */
async function chatQueryAndWait(page: any, query: string): Promise<string> {
  await page.goto(`${LIVE_URL}/chat/`);
  await page.waitForTimeout(1000);

  const input = page.locator('#chat-input');
  await input.fill(query);
  await page.locator('#send-btn').click();

  // Wait for send button to disable (streaming started)
  await page.waitForFunction(() => {
    const btn = document.querySelector('#send-btn') as HTMLButtonElement;
    return btn && btn.disabled === true;
  }, { timeout: 5000 }).catch(() => {});

  // Wait for send button to re-enable (streaming finished)
  await page.waitForFunction(() => {
    const btn = document.querySelector('#send-btn') as HTMLButtonElement;
    return btn && btn.disabled === false;
  }, { timeout: 45000 });

  // Buffer for final DOM update
  await page.waitForTimeout(500);

  // Get the last bot message
  const botMessages = page.locator('#messages .msg-text');
  const count = await botMessages.count();
  return (await botMessages.nth(count - 1).textContent()) || '';
}

test.describe('AI_Tests — Lex Solver: TRAINED rack', () => {

  test.describe('Positive Tests', () => {

    test('response contains all 8-point words (ANTIRED, DETRAIN, TRAINED)', async ({ page }) => {
      test.setTimeout(60000);
      const responseText = await solveRackAndWait(page, 'TRAINED');

      for (const word of EIGHT_PT_WORDS) {
        expect(responseText, `Response must contain "${word}"`).toContain(word);
      }
    });

    test('response contains 7-point words (AIRNED, AIRTED, ARDENT, DENARI, DETAIN, ENDART, INDART)', async ({ page }) => {
      test.setTimeout(60000);
      const responseText = await solveRackAndWait(page, 'TRAINED');

      for (const word of SEVEN_PT_WORDS) {
        expect(responseText, `Response must contain "${word}"`).toContain(word);
      }
    });

    test('response identifies ANTIRED as best play for 8 points', async ({ page }) => {
      test.setTimeout(60000);
      const responseText = await solveRackAndWait(page, 'TRAINED');

      expect(responseText, 'Must mention ANTIRED as best play').toContain('ANTIRED');
      expect(responseText, 'Must mention 8 points').toContain('8');
      expect(responseText, 'Must mention best play').toMatch(/best play/i);
    });

    test('response mentions BINGO bonus for using all 7 tiles', async ({ page }) => {
      test.setTimeout(60000);
      const responseText = await solveRackAndWait(page, 'TRAINED');

      expect(responseText, 'Must mention BINGO').toMatch(/bingo/i);
      expect(responseText, 'Must mention 50 bonus').toContain('50');
    });

    test('response mentions total score of 58 (8 base + 50 bingo)', async ({ page }) => {
      test.setTimeout(60000);
      const responseText = await solveRackAndWait(page, 'TRAINED');

      expect(responseText, 'Must mention 58 total points').toContain('58');
    });

  });

  test.describe('Negative Tests', () => {

    test('no console errors during solver interaction', async ({ page }) => {
      test.setTimeout(60000);
      const errors: string[] = [];
      page.on('pageerror', err => errors.push(err.message));

      await solveRackAndWait(page, 'TRAINED');

      const criticalErrors = errors.filter(e =>
        e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
      );
      expect(criticalErrors).toHaveLength(0);
    });

    test('response does not expose internal implementation details', async ({ page }) => {
      test.setTimeout(60000);
      const responseText = await solveRackAndWait(page, 'TRAINED');

      expect(responseText).not.toContain('sk-');
      expect(responseText).not.toContain('AKIA');
      expect(responseText).not.toContain('@gmail.com');
      expect(responseText).not.toContain('Workers AI');
      expect(responseText).not.toContain('D1 database');
    });

  });

});

test.describe('AI_Tests — Chat Keyword: Highest 3-letter words', () => {

  test.describe('Positive Tests', () => {

    test('response contains top-tier words (ZZZ, ZIZ, ZUZ, JIZ, ZAX, ZEX, ZEK)', async ({ page }) => {
      test.setTimeout(60000);
      const responseText = await chatQueryAndWait(page, 'Highest 3 letter words');

      for (const word of TOP_3_LETTER_WORDS) {
        expect(responseText, `Response must contain "${word}"`).toContain(word);
      }
    });

    test('response contains ZZZ as highest at 30 points', async ({ page }) => {
      test.setTimeout(60000);
      const responseText = await chatQueryAndWait(page, 'Highest 3 letter words');

      expect(responseText, 'ZZZ must appear').toContain('ZZZ');
      expect(responseText, '30 (ZZZ score) must appear').toContain('30');
    });

    test('response contains at least 3 valid high-scoring 3-letter words total', async ({ page }) => {
      test.setTimeout(60000);
      const responseText = await chatQueryAndWait(page, 'Highest 3 letter words');

      const ALL_VALID = [...TOP_3_LETTER_WORDS, ...FIFTEEN_PT_3_LETTER];
      let foundCount = 0;
      for (const word of ALL_VALID) {
        if (responseText.includes(word)) foundCount++;
      }
      expect(foundCount, 'Should find at least 3 valid high-scoring 3-letter words in response').toBeGreaterThanOrEqual(3);
    });

    test('response includes point values (at minimum 30 and 21 for ZZZ and ZIZ/ZUZ)', async ({ page }) => {
      test.setTimeout(60000);
      const responseText = await chatQueryAndWait(page, 'Highest 3 letter words');

      // These are deterministic — ZZZ=30 and ZIZ/ZUZ=21 are always in the DB result
      expect(responseText, 'Must contain score 30 (ZZZ)').toContain('30');
      expect(responseText, 'Must contain score 21 (ZIZ/ZUZ)').toContain('21');
    });

    test('response mentions high-scoring letters like Z and J', async ({ page }) => {
      test.setTimeout(60000);
      const responseText = await chatQueryAndWait(page, 'Highest 3 letter words');

      // AI should mention why these words score highly
      const mentionsZ = responseText.toLowerCase().includes('z');
      const mentionsJ = responseText.toLowerCase().includes('j');
      expect(mentionsZ || mentionsJ, 'Should reference high-value letters Z or J').toBeTruthy();
    });

  });

  test.describe('Negative Tests', () => {

    test('response does not include 4+ letter words in the list', async ({ page }) => {
      test.setTimeout(60000);
      const responseText = await chatQueryAndWait(page, 'Highest 3 letter words');

      expect(responseText).not.toMatch(/\bJAZZ\b/);
      expect(responseText).not.toMatch(/\bFIZZ\b/);
      expect(responseText).not.toMatch(/\bZIZZ\b/);
    });

    test('no console errors during chat interaction', async ({ page }) => {
      test.setTimeout(60000);
      const errors: string[] = [];
      page.on('pageerror', err => errors.push(err.message));

      await chatQueryAndWait(page, 'Highest 3 letter words');

      const criticalErrors = errors.filter(e =>
        !e.includes('net::') &&
        !e.includes('adsbygoogle') &&
        !e.includes('Failed to fetch') &&
        (e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read'))
      );
      expect(criticalErrors).toHaveLength(0);
    });

    test('response does not expose sensitive information', async ({ page }) => {
      test.setTimeout(60000);
      const responseText = await chatQueryAndWait(page, 'Highest 3 letter words');

      expect(responseText).not.toContain('sk-');
      expect(responseText).not.toContain('AKIA');
      expect(responseText).not.toContain('@gmail.com');
      expect(responseText).not.toContain('wrangler');
    });

  });

});
