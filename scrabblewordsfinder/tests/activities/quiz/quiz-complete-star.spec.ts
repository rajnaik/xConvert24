import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── Quiz Completion — Star Earned Tick — Positive ────────────────────────

test.describe('Quiz Completion Star Earned — Positive', () => {
  test('completing a full quiz round shows the star-tick ✅ indicator', async ({ page }) => {
    // Clear any previously earned stars so we start fresh
    await page.addInitScript(() => {
      const key = 'swf-stars-earned-' + new Date().toISOString().split('T')[0];
      localStorage.removeItem(key);
      localStorage.removeItem('swf-uid');
      localStorage.setItem('swf-uid', 'test-user-quiz-star');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#quiz-start-btn', { timeout: 10000 });

    // Select 3 questions (fastest quiz)
    await page.locator('.quiz-count-btn[data-count="3"]').click();

    // Start the quiz
    await page.locator('#quiz-start-btn').click();
    await page.waitForSelector('#quiz-active:not(.hidden)', { timeout: 5000 });

    // Answer all 3 questions by clicking any option + advancing via modal
    for (let i = 0; i < 3; i++) {
      // Wait for options to render
      await page.waitForSelector('.quiz-opt', { timeout: 5000 });
      // Click the first available option (don't care if correct — just need to complete)
      await page.locator('.quiz-opt').first().click();
      // Wait for the modal to appear
      await page.waitForSelector('#quiz-modal:not(.hidden)', { timeout: 5000 });
      // Click OK / See Results
      await page.locator('#quiz-modal-ok').click();
      // Small wait for transition
      await page.waitForTimeout(300);
    }

    // Quiz should now be complete
    await page.waitForSelector('#quiz-complete:not(.hidden)', { timeout: 5000 });

    // The star-tick for quiz should now be visible (hidden class removed)
    // The StarBar event handler fires on swf-star-earned event
    await page.waitForTimeout(500);

    // Verify the star indicator is lit up (opacity-100)
    const starIndicator = page.locator('.star-indicator[data-game="quiz"]');
    await expect(starIndicator).toHaveClass(/opacity-100/);
  });

  test('star indicator title changes to "⭐ Star earned!" after quiz completion', async ({ page }) => {
    await page.addInitScript(() => {
      const key = 'swf-stars-earned-' + new Date().toISOString().split('T')[0];
      localStorage.removeItem(key);
      localStorage.setItem('swf-uid', 'test-user-quiz-star-2');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#quiz-start-btn', { timeout: 10000 });

    // Select 3 questions
    await page.locator('.quiz-count-btn[data-count="3"]').click();
    await page.locator('#quiz-start-btn').click();
    await page.waitForSelector('#quiz-active:not(.hidden)', { timeout: 5000 });

    // Complete all 3 questions
    for (let i = 0; i < 3; i++) {
      await page.waitForSelector('.quiz-opt', { timeout: 5000 });
      await page.locator('.quiz-opt').first().click();
      await page.waitForSelector('#quiz-modal:not(.hidden)', { timeout: 5000 });
      await page.locator('#quiz-modal-ok').click();
      await page.waitForTimeout(300);
    }

    await page.waitForSelector('#quiz-complete:not(.hidden)', { timeout: 5000 });
    await page.waitForTimeout(500);

    // Star indicator title should reflect earned state
    const starIndicator = page.locator('.star-indicator[data-game="quiz"]');
    await expect(starIndicator).toHaveAttribute('title', '⭐ Star earned!');
  });
});

// ── Quiz Completion — Star Earned Tick — Negative ────────────────────────

test.describe('Quiz Completion Star Earned — Negative', () => {
  test('star-tick does NOT appear if quiz is not completed (only started)', async ({ page }) => {
    await page.addInitScript(() => {
      const key = 'swf-stars-earned-' + new Date().toISOString().split('T')[0];
      localStorage.removeItem(key);
      localStorage.setItem('swf-uid', 'test-user-quiz-no-star');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#quiz-start-btn', { timeout: 10000 });

    // Start quiz but don't complete it
    await page.locator('.quiz-count-btn[data-count="3"]').click();
    await page.locator('#quiz-start-btn').click();
    await page.waitForSelector('#quiz-active:not(.hidden)', { timeout: 5000 });

    // Answer only 1 question, then stop
    await page.waitForSelector('.quiz-opt', { timeout: 5000 });
    await page.locator('.quiz-opt').first().click();
    await page.waitForTimeout(500);

    // Star indicator should still be dimmed (star not earned — quiz not finished)
    const starIndicator = page.locator('.star-indicator[data-game="quiz"]');
    await expect(starIndicator).toHaveClass(/opacity-40/);
  });

  test('no JS errors during full quiz completion flow', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript(() => {
      const key = 'swf-stars-earned-' + new Date().toISOString().split('T')[0];
      localStorage.removeItem(key);
      localStorage.setItem('swf-uid', 'test-user-quiz-noerr');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#quiz-start-btn', { timeout: 10000 });

    await page.locator('.quiz-count-btn[data-count="3"]').click();
    await page.locator('#quiz-start-btn').click();
    await page.waitForSelector('#quiz-active:not(.hidden)', { timeout: 5000 });

    for (let i = 0; i < 3; i++) {
      await page.waitForSelector('.quiz-opt', { timeout: 5000 });
      await page.locator('.quiz-opt').first().click();
      await page.waitForSelector('#quiz-modal:not(.hidden)', { timeout: 5000 });
      await page.locator('#quiz-modal-ok').click();
      await page.waitForTimeout(300);
    }

    await page.waitForSelector('#quiz-complete:not(.hidden)', { timeout: 5000 });
    await page.waitForTimeout(500);

    // No TypeError or ReferenceError from __awardStar or star-tick logic
    expect(errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'))).toHaveLength(0);
  });
});
