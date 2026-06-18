import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// Helper: complete a 3-question quiz to reach the complete screen
async function completeQuiz(page: any) {
  await page.addInitScript(() => {
    localStorage.setItem('swf-uid', 'test-user-timeline');
  });
  await page.goto(ACTIVITIES_URL);
  await page.waitForSelector('#quiz-start-btn', { timeout: 10000 });

  // Select 3 questions (fastest)
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
}

// ── Quiz Timeline Tracker — Positive ─────────────────────────────────────

test.describe('Quiz Timeline Tracker — Positive', () => {
  test('Track button exists on quiz complete screen', async ({ page }) => {
    await completeQuiz(page);
    const btn = page.locator('#quiz-track-btn');
    await expect(btn).toBeVisible();
    await expect(btn).toContainText('Track');
  });

  test('clicking Track button shows the timeline panel', async ({ page }) => {
    await completeQuiz(page);
    const panel = page.locator('#quiz-timeline-panel');
    await expect(panel).toBeHidden();

    await page.locator('#quiz-track-btn').click();
    await expect(panel).toBeVisible();
  });

  test('timeline panel contains the timeline bar', async ({ page }) => {
    await completeQuiz(page);
    await page.locator('#quiz-track-btn').click();

    const bar = page.locator('#quiz-timeline-bar');
    await expect(bar).toBeVisible();
  });

  test('timeline bar has green dots for each answered question', async ({ page }) => {
    await completeQuiz(page);
    await page.locator('#quiz-track-btn').click();

    const dots = page.locator('#quiz-timeline-bar .quiz-dot');
    await expect(dots).toHaveCount(3);
  });

  test('timeline details list shows one row per question', async ({ page }) => {
    await completeQuiz(page);
    await page.locator('#quiz-track-btn').click();

    const rows = page.locator('#quiz-timeline-details > div');
    await expect(rows).toHaveCount(3);
  });

  test('timeline duration label matches selected timer', async ({ page }) => {
    await completeQuiz(page);
    await page.locator('#quiz-track-btn').click();

    const durationLabel = page.locator('#quiz-timeline-duration');
    // Default timer is 90s
    await expect(durationLabel).toHaveText('90s');
  });

  test('close button hides the timeline panel', async ({ page }) => {
    await completeQuiz(page);
    await page.locator('#quiz-track-btn').click();

    const panel = page.locator('#quiz-timeline-panel');
    await expect(panel).toBeVisible();

    await page.locator('#quiz-timeline-close').click();
    await expect(panel).toBeHidden();
  });
});

// ── Quiz Timeline Tracker — Negative ─────────────────────────────────────

test.describe('Quiz Timeline Tracker — Negative', () => {
  test('timeline panel is hidden before Track is clicked', async ({ page }) => {
    await completeQuiz(page);
    const panel = page.locator('#quiz-timeline-panel');
    await expect(panel).toBeHidden();
  });

  test('clicking Track again toggles panel closed', async ({ page }) => {
    await completeQuiz(page);
    const panel = page.locator('#quiz-timeline-panel');

    await page.locator('#quiz-track-btn').click();
    await expect(panel).toBeVisible();

    await page.locator('#quiz-track-btn').click();
    await expect(panel).toBeHidden();
  });

  test('Play Again hides the timeline panel', async ({ page }) => {
    await completeQuiz(page);
    await page.locator('#quiz-track-btn').click();

    const panel = page.locator('#quiz-timeline-panel');
    await expect(panel).toBeVisible();

    await page.locator('#quiz-retry-btn').click();
    await expect(panel).toBeHidden();
  });

  test('no JS errors during timeline render', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await completeQuiz(page);
    await page.locator('#quiz-track-btn').click();
    await page.waitForTimeout(300);

    expect(errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'))).toHaveLength(0);
  });

  test('no duplicate Track buttons exist', async ({ page }) => {
    await completeQuiz(page);
    const btns = page.locator('#quiz-track-btn');
    await expect(btns).toHaveCount(1);
  });
});
