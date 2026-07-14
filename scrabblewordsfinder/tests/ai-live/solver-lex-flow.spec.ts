import { test, expect } from '@playwright/test';

/**
 * AI Live Test — Solver + Lex AI Flow
 * 
 * Full E2E flow:
 * 1. Go to homepage, type "TRAINED" in the solver
 * 2. Verify 234 words found
 * 3. Click "Ask Lex AI" — verify "TRAINED" appears in the Lex rack input
 * 4. Click "Find Words" in the Lex modal — verify top words appear
 * 5. Click "Learn with Lex AI" — navigates to /chat/ with rack context
 * 6. Verify the AI processes the rack word "TRAINED"
 */

const BASE = process.env.SWF_TEST_URL || 'https://www.scrabblewordsfinder.com';

test.describe('AI Live — Solver + Lex Flow', () => {
  test.setTimeout(120000); // 2 min for AI response

  test('solver finds words, Ask Lex populates rack, Learn with Lex sends to chat', async ({ page }) => {
    // Step 1: Go to homepage
    await page.goto(`${BASE}/`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Step 2: Type "TRAINED" in the solver
    const solverInput = page.locator('#text-solver');
    await expect(solverInput).toBeVisible();
    await solverInput.fill('TRAINED');

    // Wait for solver to process (debounced)
    await page.waitForTimeout(3000);

    // Step 3: Verify "234 words found" in results
    const resultsEl = page.locator('#results');
    await expect(resultsEl).toContainText('words found', { timeout: 15000 });
    const resultsText = await resultsEl.textContent();
    expect(resultsText).toContain('234');

    // Step 4: Verify top words appear in the results
    const expectedTopWords = [
      'ANTIRED',
      'DETRAIN',
      'TRAINED',
      'AIRNED',
      'AIRTED',
      'ARDENT',
      'DENARI',
      'DETAIN',
      'ENDART',
      'INDART',
    ];
    for (const word of expectedTopWords) {
      expect(resultsText?.toUpperCase()).toContain(word);
    }

    // Step 5: Click "Ask Lex AI" button
    const askLexBtn = page.locator('#ask-lex-tile');
    await expect(askLexBtn).toBeVisible();
    await askLexBtn.click();
    await page.waitForTimeout(2000);

    // Step 6: Verify "TRAINED" is in the Lex rack input
    const lexRackInput = page.locator('#lex-rack-input');
    await expect(lexRackInput).toBeVisible({ timeout: 5000 });
    const rackValue = await lexRackInput.inputValue();
    expect(rackValue.toUpperCase()).toContain('TRAINED');

    // Step 7: Click "Find Words" in the Lex solver modal
    const lexSolveBtn = page.locator('#lex-solve-btn');
    await expect(lexSolveBtn).toBeVisible();
    await lexSolveBtn.click();

    // Wait for Lex to respond with word analysis
    await page.waitForTimeout(5000);

    // Verify Lex response contains word suggestions
    const lexResponse = page.locator('#lex-solver-response');
    await expect(lexResponse).not.toBeEmpty({ timeout: 30000 });
    const lexText = await lexResponse.textContent();
    expect(lexText!.length).toBeGreaterThan(50);

    // Step 8: Click "Learn with Lex AI" to navigate to /chat/
    const learnLexLink = page.locator('#learn-lex-modal-link');
    await expect(learnLexLink).toBeVisible();
    await learnLexLink.click();

    // Wait for navigation to /chat/
    await page.waitForURL('**/chat/**', { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);

    // Step 9: Verify the AI is processing the rack word "TRAINED"
    // The chat should show "TRAINED" in the context or have a message about it
    const chatMessages = page.locator('#messages');
    await page.waitForFunction(
      () => {
        const el = document.getElementById('messages');
        return el && (el.textContent || '').length > 100;
      },
      null,
      { timeout: 90000, polling: 3000 }
    );

    const chatText = await chatMessages.textContent();
    expect(chatText?.toUpperCase()).toContain('TRAINED');
  });
});
