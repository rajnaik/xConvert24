import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── Quiz Loading State — Positive ────────────────────────────────────────

test.describe('Quiz Loading State — Positive', () => {
  test('shows loading text in quiz-options when start is clicked', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('swf-uid');
      localStorage.setItem('swf-uid', 'test-user-loading-state');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#quiz-start-btn', { timeout: 10000 });

    // Select 3 questions
    await page.locator('.quiz-count-btn[data-count="3"]').click();

    // Intercept the API to slow it down so we can catch the loading state
    await page.route('**/api/quiz/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });
    await page.route('**/api/quiz-questions/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });

    await page.locator('#quiz-start-btn').click();

    // The quiz-active panel should be visible immediately
    await expect(page.locator('#quiz-active')).not.toHaveClass(/hidden/, { timeout: 3000 });

    // The word placeholder should show '...' initially
    const wordEl = page.locator('#quiz-current-word');
    await expect(wordEl).toBeVisible();
    const wordText = await wordEl.textContent();
    expect(wordText).toBe('...');

    // Loading message should appear in options area
    const optionsEl = page.locator('#quiz-options');
    await expect(optionsEl).toContainText('Loading questions');
  });

  test('timer shows the selected duration during loading', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('swf-uid');
      localStorage.setItem('swf-uid', 'test-user-loading-timer');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#quiz-start-btn', { timeout: 10000 });

    // Select timer duration (use the default or select a value)
    await page.locator('.quiz-count-btn[data-count="3"]').click();

    // Intercept to catch loading state
    await page.route('**/api/quiz/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });
    await page.route('**/api/quiz-questions/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });

    // Read the timer select value before starting
    const timerValue = await page.locator('#quiz-timer-select').inputValue();

    await page.locator('#quiz-start-btn').click();

    // Timer element should show the selected duration with 's' suffix
    const timerEl = page.locator('#quiz-timer');
    await expect(timerEl).toBeVisible({ timeout: 3000 });
    await expect(timerEl).toHaveText(`${timerValue}s`);
  });
});

// ── Quiz Loading State — Negative ────────────────────────────────────────

test.describe('Quiz Loading State — Negative', () => {
  test('quiz-setup is hidden after start is clicked (no double panels)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('swf-uid');
      localStorage.setItem('swf-uid', 'test-user-loading-no-double');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#quiz-start-btn', { timeout: 10000 });

    await page.locator('.quiz-count-btn[data-count="3"]').click();
    await page.locator('#quiz-start-btn').click();

    // Setup panel should be hidden
    await expect(page.locator('#quiz-setup')).toHaveClass(/hidden/, { timeout: 3000 });

    // Complete panel should also be hidden
    await expect(page.locator('#quiz-complete')).toHaveClass(/hidden/);

    // Active panel should be visible
    await expect(page.locator('#quiz-active')).not.toHaveClass(/hidden/);
  });

  test('no JS errors during quiz loading transition', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript(() => {
      localStorage.removeItem('swf-uid');
      localStorage.setItem('swf-uid', 'test-user-loading-noerr');
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#quiz-start-btn', { timeout: 10000 });

    await page.locator('.quiz-count-btn[data-count="3"]').click();
    await page.locator('#quiz-start-btn').click();

    // Wait for the active panel to show
    await expect(page.locator('#quiz-active')).not.toHaveClass(/hidden/, { timeout: 3000 });

    // Wait for questions to actually load (options will replace loading text)
    await page.waitForSelector('.quiz-opt', { timeout: 10000 });

    // No TypeError or ReferenceError during the transition
    expect(errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'))).toHaveLength(0);
  });
});
