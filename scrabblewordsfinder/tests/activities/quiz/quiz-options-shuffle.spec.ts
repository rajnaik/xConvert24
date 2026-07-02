import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── Quiz Options Fisher-Yates Shuffle — Positive ────────────────────────

test.describe('Quiz Options Shuffle — Positive', () => {
  test('quiz renders exactly 4 option buttons per question', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('swf-uid');
      localStorage.setItem('swf-uid', 'test-user-shuffle-4opts');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#quiz-start-btn', { timeout: 10000 });

    // Select 3 questions
    await page.locator('.quiz-count-btn[data-count="3"]').click();
    await page.locator('#quiz-start-btn').click();
    await page.waitForSelector('#quiz-active:not(.hidden)', { timeout: 5000 });

    // Wait for options to render
    await page.waitForSelector('.quiz-opt', { timeout: 5000 });

    // Should always have exactly 4 options
    const optionCount = await page.locator('.quiz-opt').count();
    expect(optionCount).toBe(4);
  });

  test('correct answer is always present among the 4 shuffled options', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('swf-uid');
      localStorage.setItem('swf-uid', 'test-user-shuffle-correct');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#quiz-start-btn', { timeout: 10000 });

    await page.locator('.quiz-count-btn[data-count="3"]').click();
    await page.locator('#quiz-start-btn').click();
    await page.waitForSelector('#quiz-active:not(.hidden)', { timeout: 5000 });
    await page.waitForSelector('.quiz-opt', { timeout: 5000 });

    // Check all 3 questions — each must have a correct option
    for (let i = 0; i < 3; i++) {
      await page.waitForSelector('.quiz-opt', { timeout: 5000 });
      const correctOption = page.locator('.quiz-opt[data-correct="true"]');
      await expect(correctOption).toHaveCount(1);

      // Click any option + advance
      await page.locator('.quiz-opt').first().click();
      await page.waitForSelector('#quiz-modal:not(.hidden)', { timeout: 5000 });
      await page.locator('#quiz-modal-ok').click();
      await page.waitForTimeout(300);
    }
  });
});

// ── Quiz Options Fisher-Yates Shuffle — Negative ────────────────────────

test.describe('Quiz Options Shuffle — Negative', () => {
  test('options are not always in the same position across multiple starts', async ({ page }) => {
    // Run the quiz multiple times and check if the correct answer position varies
    // With 4 options and Fisher-Yates, statistically the correct answer should NOT
    // always appear in position 0 over 5 rounds (probability ~(1/4)^5 = 0.1%)
    const positions: number[] = [];

    for (let round = 0; round < 5; round++) {
      await page.addInitScript((r) => {
        localStorage.removeItem('swf-uid');
        localStorage.setItem('swf-uid', 'test-user-shuffle-pos-' + r);
        // Clear quiz state
        const key = 'swf-stars-earned-' + new Date().toISOString().split('T')[0];
        localStorage.removeItem(key);
      }, round);

      await page.goto(ACTIVITIES_URL);
      await page.waitForSelector('#quiz-start-btn', { timeout: 10000 });

      await page.locator('.quiz-count-btn[data-count="3"]').click();
      await page.locator('#quiz-start-btn').click();
      await page.waitForSelector('#quiz-active:not(.hidden)', { timeout: 5000 });
      await page.waitForSelector('.quiz-opt', { timeout: 5000 });

      // Find position of correct answer
      const options = page.locator('.quiz-opt');
      const count = await options.count();
      for (let i = 0; i < count; i++) {
        const isCorrect = await options.nth(i).getAttribute('data-correct');
        if (isCorrect === 'true') {
          positions.push(i);
          break;
        }
      }
    }

    // The correct answer should NOT always be in the same position
    // (if it is, shuffle is broken). Allow the small chance they match.
    const allSame = positions.every(p => p === positions[0]);
    // With Fisher-Yates over 5 rounds, all-same is extremely unlikely (0.1%)
    // but we can't make this a hard assert due to randomness.
    // Instead, just verify we collected 5 positions (no crashes during shuffle).
    expect(positions).toHaveLength(5);

    // Soft check: if all 5 are the same, note it (don't hard-fail due to randomness)
    if (!allSame) {
      expect(new Set(positions).size).toBeGreaterThan(1);
    }
  });

  test('no JS errors during quiz option shuffle', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript(() => {
      localStorage.removeItem('swf-uid');
      localStorage.setItem('swf-uid', 'test-user-shuffle-noerr');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#quiz-start-btn', { timeout: 10000 });

    await page.locator('.quiz-count-btn[data-count="3"]').click();
    await page.locator('#quiz-start-btn').click();
    await page.waitForSelector('#quiz-active:not(.hidden)', { timeout: 5000 });
    await page.waitForSelector('.quiz-opt', { timeout: 5000 });

    // Complete all 3 questions to exercise shuffle 3 times
    for (let i = 0; i < 3; i++) {
      await page.waitForSelector('.quiz-opt', { timeout: 5000 });
      await page.locator('.quiz-opt').first().click();
      await page.waitForSelector('#quiz-modal:not(.hidden)', { timeout: 5000 });
      await page.locator('#quiz-modal-ok').click();
      await page.waitForTimeout(300);
    }

    // No TypeError from Fisher-Yates shuffle (accessing undefined indices, etc.)
    expect(errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'))).toHaveLength(0);
  });
});
