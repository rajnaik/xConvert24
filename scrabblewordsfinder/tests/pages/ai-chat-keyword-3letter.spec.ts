import { test, expect } from '@playwright/test';

/**
 * AI_Tests — Chat /chat/ keyword: "Highest-scoring 3-letter 10 words"
 *
 * Verifies that entering this keyword in the Lex chat returns the correct
 * top 10 highest-scoring 3-letter words with their point values.
 *
 * Expected results (from SOWPODS dictionary database):
 * 1. ZZZ (30 points) - Representation of snoring or sleep.
 * 2. ZIZ (21 points) - A giant bird in Jewish mythology.
 * 3. ZUZ (21 points) - An ancient Hebrew silver coin.
 * 4. JIZ (19 points) - A variant of Jeez, an expression of surprise.
 * 5. ZAX (19 points) - A type of medieval sword.
 * 6. ZEX (19 points) - A type of chemical compound.
 * 7. ZEK (16 points) - A variant of Zek, a term for a prisoner.
 * 8. FEZ (15 points) - A type of hat.
 * 9. FIZ (15 points) - A type of fizzy drink.
 * 10. WIZ (15 points) - A type of magician or wizard.
 *
 * Note: The AI streams responses via Workers AI. The database provides
 * dictionary enrichment data (deterministic), and the AI presents it
 * in natural language (non-deterministic formatting). Tests validate
 * that the expected words and scores are present in the response.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';
const QUERY = 'Highest-scoring 3-letter 10 words';

// Words that MUST appear — these are the top 7 which are unique by score tier
// (no ties at their tier, so the DB always returns them in top 10)
const MUST_HAVE_WORDS = ['ZZZ', 'ZIZ', 'ZUZ', 'JIZ', 'ZAX', 'ZEX', 'ZEK'];

// Words at 15 points — the DB/AI may include any 3 of these (PYX/FEZ/FIZ/WIZ/ZHO)
// At minimum FEZ and FIZ are always in the DB top 10
const FIFTEEN_PT_WORDS = ['FEZ', 'FIZ', 'PYX', 'WIZ', 'ZHO'];

// All valid words that could appear in the top 10 response
const ALL_VALID_WORDS = [...MUST_HAVE_WORDS, ...FIFTEEN_PT_WORDS];

/**
 * Helper: submit query and wait for full AI response to finish streaming.
 * Returns the text content of the bot's response message.
 */
async function submitAndWaitForResponse(page: any): Promise<string> {
  const input = page.locator('#chat-input');
  await input.fill(QUERY);
  await page.locator('#send-btn').click();

  // Wait for the send button to become disabled (streaming started)
  await page.waitForFunction(() => {
    const btn = document.querySelector('#send-btn') as HTMLButtonElement;
    return btn && btn.disabled === true;
  }, { timeout: 5000 }).catch(() => {});

  // Wait for the send button to become re-enabled (streaming finished)
  await page.waitForFunction(() => {
    const btn = document.querySelector('#send-btn') as HTMLButtonElement;
    return btn && btn.disabled === false;
  }, { timeout: 45000 });

  // Small buffer to let final DOM update settle
  await page.waitForTimeout(500);

  // Get the last bot message text
  const botMessages = page.locator('#messages .msg-text');
  const count = await botMessages.count();
  return (await botMessages.nth(count - 1).textContent()) || '';
}

test.describe('AI_Tests — Chat Keyword: Highest-scoring 3-letter words', () => {

  test.describe('Positive Tests', () => {

    test('response contains the top 7 uniquely-ranked words (ZZZ through ZEK)', async ({ page }) => {
      test.setTimeout(60000);
      await page.goto(`${BASE}/chat/`);

      const responseText = await submitAndWaitForResponse(page);

      // These 7 words occupy unique score tiers (30, 21, 21, 19, 19, 19, 16)
      // and always appear in the DB top 10 query result
      for (const word of MUST_HAVE_WORDS) {
        expect(responseText, `Response must contain "${word}"`).toContain(word);
      }
    });

    test('response contains ZZZ as the highest-scoring word (30 points)', async ({ page }) => {
      test.setTimeout(60000);
      await page.goto(`${BASE}/chat/`);

      const responseText = await submitAndWaitForResponse(page);

      // ZZZ (30 points) is the indisputable #1 highest-scoring 3-letter word
      expect(responseText, 'ZZZ must appear').toContain('ZZZ');
      expect(responseText, '30 (the ZZZ score) must appear').toContain('30');
    });

    test('response contains at least 10 valid three-letter words', async ({ page }) => {
      test.setTimeout(60000);
      await page.goto(`${BASE}/chat/`);

      const responseText = await submitAndWaitForResponse(page);

      let foundCount = 0;
      for (const word of ALL_VALID_WORDS) {
        if (responseText.includes(word)) foundCount++;
      }
      expect(foundCount, 'Should find at least 10 valid 3-letter words in response').toBeGreaterThanOrEqual(10);
    });

    test('user message bubble appears after submitting keyword', async ({ page }) => {
      test.setTimeout(60000);
      await page.goto(`${BASE}/chat/`);

      const input = page.locator('#chat-input');
      await input.fill(QUERY);
      await page.locator('#send-btn').click();

      // User message should appear in the messages area
      const userBubble = page.locator('#messages').getByText(QUERY);
      await expect(userBubble).toBeVisible({ timeout: 5000 });
    });

    test('response includes all distinct point values (30, 21, 19, 16, 15)', async ({ page }) => {
      test.setTimeout(60000);
      await page.goto(`${BASE}/chat/`);

      const responseText = await submitAndWaitForResponse(page);

      // These 5 distinct score values must all appear
      expect(responseText, 'Must contain score 30 (ZZZ)').toContain('30');
      expect(responseText, 'Must contain score 21 (ZIZ/ZUZ)').toContain('21');
      expect(responseText, 'Must contain score 19 (JIZ/ZAX/ZEX)').toContain('19');
      expect(responseText, 'Must contain score 16 (ZEK)').toContain('16');
      expect(responseText, 'Must contain score 15 (FEZ/FIZ/PYX/WIZ)').toContain('15');
    });

  });

  test.describe('Negative Tests', () => {

    test('response does not include 4+ letter words in the top 10 list', async ({ page }) => {
      test.setTimeout(60000);
      await page.goto(`${BASE}/chat/`);

      const responseText = await submitAndWaitForResponse(page);

      // 4-letter words should NOT appear as entries in a 3-letter word list
      expect(responseText).not.toMatch(/\bJAZZ\b/);
      expect(responseText).not.toMatch(/\bFIZZ\b/);
      expect(responseText).not.toMatch(/\bZIZZ\b/);
      expect(responseText).not.toMatch(/\bZZZS\b/);
    });

    test('empty input does not trigger a chat submission', async ({ page }) => {
      await page.goto(`${BASE}/chat/`);

      // Try to send with empty input
      const input = page.locator('#chat-input');
      await input.fill('');
      await page.locator('#send-btn').click();

      // Wait a moment — no new message should appear beyond the welcome
      await page.waitForTimeout(1000);

      // Only the welcome message should be present (no user bubble, no bot response)
      const msgTexts = page.locator('#messages .msg-text');
      const count = await msgTexts.count();
      expect(count).toBe(0);
    });

    test('no console errors during chat interaction', async ({ page }) => {
      test.setTimeout(60000);
      const errors: string[] = [];
      page.on('pageerror', err => errors.push(err.message));

      await page.goto(`${BASE}/chat/`);
      await submitAndWaitForResponse(page);

      // Filter out known non-critical errors
      const criticalErrors = errors.filter(e =>
        !e.includes('net::') &&
        !e.includes('adsbygoogle') &&
        !e.includes('Failed to fetch')
      );
      expect(criticalErrors).toHaveLength(0);
    });

    test('response does not expose sensitive information', async ({ page }) => {
      test.setTimeout(60000);
      await page.goto(`${BASE}/chat/`);

      const responseText = await submitAndWaitForResponse(page);

      // No API keys, emails, or internal implementation details
      expect(responseText).not.toContain('sk-');
      expect(responseText).not.toContain('AKIA');
      expect(responseText).not.toContain('@gmail.com');
      expect(responseText).not.toContain('wrangler');
      expect(responseText).not.toContain('D1 database');
      expect(responseText).not.toContain('Workers AI');
    });

  });

});
