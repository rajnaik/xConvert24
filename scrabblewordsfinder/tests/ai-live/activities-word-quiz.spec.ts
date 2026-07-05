import { test, expect } from '@playwright/test';

/**
 * AI Live Test — Activities Word Quiz
 * 
 * Tests:
 * 1. Go to /activities/
 * 2. Click "3" from word count picker
 * 3. Select 30 seconds from timer dropdown
 * 4. Click "Start Quiz"
 * 5. Pick a random answer option, click "OK →" (x3 rounds)
 * 6. Verify game ends with "Play Again", "Track" and "Quiz History" visible
 */

const BASE = process.env.SWF_TEST_URL || 'https://www.scrabblewordsfinder.com';

test.describe('AI Live — Activities Word Quiz', () => {
  test.setTimeout(90000);

  test('complete a 3-word quiz and verify end screen buttons', async ({ page }) => {
    // Step 1: Go to activities page
    await page.goto(`${BASE}/activities/`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(4000);

    // Step 2: Click "3" from word count picker
    const threeBtn = page.locator('#quiz-count-picker button[data-count="3"]');
    await expect(threeBtn).toBeVisible({ timeout: 10000 });
    await threeBtn.click();
    await page.waitForTimeout(500);

    // Step 3: Select 30 seconds from timer dropdown
    const timerSelect = page.locator('#quiz-timer-select');
    await timerSelect.selectOption('30');
    await page.waitForTimeout(500);

    // Step 4: Click "Start Quiz"
    const startBtn = page.locator('#quiz-start-btn');
    await startBtn.click();
    await page.waitForTimeout(2000); // Wait for first question to load

    // Step 5: Answer 3 questions
    for (let round = 0; round < 3; round++) {
      // Wait for quiz options to appear
      const options = page.locator('#quiz-options button');
      await expect(options.first()).toBeVisible({ timeout: 10000 });

      // Pick a random option
      const count = await options.count();
      const randomIndex = Math.floor(Math.random() * count);
      await options.nth(randomIndex).click();

      // Wait for the modal to appear with "OK →"
      const okBtn = page.locator('#quiz-modal-ok');
      await expect(okBtn).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(500); // Brief pause before clicking
      await okBtn.click();

      // Wait for next question or end screen
      await page.waitForTimeout(1500);
    }

    // Step 6: Verify quiz complete screen
    await page.waitForTimeout(2000);

    // Verify "Play Again" button
    const playAgainBtn = page.locator('#quiz-retry-btn');
    await expect(playAgainBtn).toBeVisible({ timeout: 10000 });

    // Verify "Track" button
    const trackBtn = page.locator('#quiz-track-btn');
    await expect(trackBtn).toBeVisible();

    // Verify "Quiz History" link exists in the complete section
    const historyLink = page.locator('#quiz-complete a[href="/quiz-history/"]');
    await expect(historyLink).toBeVisible();
  });
});
