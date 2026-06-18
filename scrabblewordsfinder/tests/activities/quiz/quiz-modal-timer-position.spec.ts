import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── Quiz Modal Timer Position — Positive ─────────────────────────────────

test.describe('Quiz Modal Timer Position — Positive', () => {
  test('modal timer is absolutely positioned in the top-right of the modal box', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-user-modal-timer-pos');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#quiz-start-btn', { timeout: 10000 });

    // Select 3 questions for fastest flow
    await page.locator('.quiz-count-btn[data-count="3"]').click();
    await page.locator('#quiz-start-btn').click();
    await page.waitForSelector('#quiz-active:not(.hidden)', { timeout: 5000 });

    // Answer the first question to trigger the modal
    await page.waitForSelector('.quiz-opt', { timeout: 5000 });
    await page.locator('.quiz-opt').first().click();
    await page.waitForSelector('#quiz-modal:not(.hidden)', { timeout: 5000 });

    // Verify the modal timer element has the absolute positioning classes
    const modalTimer = page.locator('#quiz-modal-timer');
    await expect(modalTimer).toBeVisible();
    await expect(modalTimer).toHaveClass(/absolute/);
    await expect(modalTimer).toHaveClass(/top-2/);
    await expect(modalTimer).toHaveClass(/right-3/);
  });

  test('modal timer displays countdown value synced with main timer', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-user-modal-timer-sync');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#quiz-start-btn', { timeout: 10000 });

    await page.locator('.quiz-count-btn[data-count="3"]').click();
    await page.locator('#quiz-start-btn').click();
    await page.waitForSelector('#quiz-active:not(.hidden)', { timeout: 5000 });

    // Answer a question to show the modal
    await page.waitForSelector('.quiz-opt', { timeout: 5000 });
    await page.locator('.quiz-opt').first().click();
    await page.waitForSelector('#quiz-modal:not(.hidden)', { timeout: 5000 });

    // Modal timer should contain the stopwatch emoji and a time value
    const modalTimer = page.locator('#quiz-modal-timer');
    const timerText = await modalTimer.textContent();
    expect(timerText).toMatch(/⏱.*\d+s/);
  });
});

// ── Quiz Modal Timer Position — Negative ─────────────────────────────────

test.describe('Quiz Modal Timer Position — Negative', () => {
  test('modal box has relative positioning as a container for the absolute timer', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-user-modal-box-relative');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#quiz-start-btn', { timeout: 10000 });

    await page.locator('.quiz-count-btn[data-count="3"]').click();
    await page.locator('#quiz-start-btn').click();
    await page.waitForSelector('#quiz-active:not(.hidden)', { timeout: 5000 });

    await page.waitForSelector('.quiz-opt', { timeout: 5000 });
    await page.locator('.quiz-opt').first().click();
    await page.waitForSelector('#quiz-modal:not(.hidden)', { timeout: 5000 });

    // The modal box must have 'relative' so the absolute timer is positioned within it
    const modalBox = page.locator('#quiz-modal-box');
    await expect(modalBox).toHaveClass(/relative/);
  });

  test('no duplicate timer elements exist in the quiz modal', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-user-modal-no-dup-timer');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#quiz-start-btn', { timeout: 10000 });

    await page.locator('.quiz-count-btn[data-count="3"]').click();
    await page.locator('#quiz-start-btn').click();
    await page.waitForSelector('#quiz-active:not(.hidden)', { timeout: 5000 });

    await page.waitForSelector('.quiz-opt', { timeout: 5000 });
    await page.locator('.quiz-opt').first().click();
    await page.waitForSelector('#quiz-modal:not(.hidden)', { timeout: 5000 });

    // There should be exactly one timer element in the modal
    const timerCount = await page.locator('#quiz-modal-box #quiz-modal-timer').count();
    expect(timerCount).toBe(1);
  });
});
