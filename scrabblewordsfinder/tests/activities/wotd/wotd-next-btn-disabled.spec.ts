import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── WOTD Next Button Disabled at Today — Positive ────────────────────────

test.describe('WOTD Next Button Disabled at Today — Positive', () => {
  test('next button exists in the WOTD panel', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-next', { timeout: 8000 });
    await expect(page.locator('#wotd-next')).toBeVisible();
  });

  test('next button is disabled on initial load (today)', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });
    // Wait for API response to populate and updateNextBtnState to fire
    await page.waitForTimeout(2000);

    const nextBtn = page.locator('#wotd-next');
    await expect(nextBtn).toBeDisabled();
  });

  test('next button has visual disabled styling on today', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });
    await page.waitForTimeout(2000);

    const nextBtn = page.locator('#wotd-next');
    await expect(nextBtn).toHaveClass(/opacity-30/);
    await expect(nextBtn).toHaveClass(/cursor-not-allowed/);
  });

  test('next button becomes enabled after navigating to previous day', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });
    await page.waitForTimeout(2000);

    // Navigate to previous day
    await page.locator('#wotd-prev').click();
    await page.waitForTimeout(1500);

    const nextBtn = page.locator('#wotd-next');
    await expect(nextBtn).toBeEnabled();
    await expect(nextBtn).not.toHaveClass(/opacity-30/);
  });

  test('clicking next from yesterday navigates back to today and disables button', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });
    await page.waitForTimeout(2000);

    // Go back one day
    await page.locator('#wotd-prev').click();
    await page.waitForTimeout(1500);

    // Now click next to return to today
    await page.locator('#wotd-next').click();
    await page.waitForTimeout(1500);

    const nextBtn = page.locator('#wotd-next');
    await expect(nextBtn).toBeDisabled();
    await expect(nextBtn).toHaveClass(/opacity-30/);
  });
});

// ── WOTD Next Button Disabled at Today — Negative ────────────────────────

test.describe('WOTD Next Button Disabled at Today — Negative', () => {
  test('clicking disabled next button does not navigate forward', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });
    await page.waitForTimeout(2000);

    // Record the current word
    const wordBefore = await page.locator('#wotd-word').textContent();

    // Click next (disabled — should do nothing)
    await page.locator('#wotd-next').click({ force: true });
    await page.waitForTimeout(1000);

    const wordAfter = await page.locator('#wotd-word').textContent();
    expect(wordAfter).toBe(wordBefore);
  });

  test('no JS errors when clicking disabled next button', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });
    await page.waitForTimeout(2000);

    // Force click the disabled button multiple times
    await page.locator('#wotd-next').click({ force: true });
    await page.locator('#wotd-next').click({ force: true });
    await page.locator('#wotd-next').click({ force: true });
    await page.waitForTimeout(500);

    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });

  test('prev button remains functional when next is disabled', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });
    await page.waitForTimeout(2000);

    // Next is disabled at today
    await expect(page.locator('#wotd-next')).toBeDisabled();

    // Prev should still work
    const prevBtn = page.locator('#wotd-prev');
    await expect(prevBtn).toBeEnabled();
    await prevBtn.click();
    await page.waitForTimeout(1500);

    // After going back, next should be re-enabled
    await expect(page.locator('#wotd-next')).toBeEnabled();
  });

  test('rapid prev/next clicking does not crash or navigate past today', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#wotd-word', { timeout: 8000 });
    await page.waitForTimeout(2000);

    // Go back 3 days rapidly
    await page.locator('#wotd-prev').click();
    await page.waitForTimeout(300);
    await page.locator('#wotd-prev').click();
    await page.waitForTimeout(300);
    await page.locator('#wotd-prev').click();
    await page.waitForTimeout(1000);

    // Now click next 5 times (should stop at today)
    for (let i = 0; i < 5; i++) {
      await page.locator('#wotd-next').click({ force: true });
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(1000);

    // Should end up at today with next disabled
    await expect(page.locator('#wotd-next')).toBeDisabled();
    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError')
    );
    expect(critical).toHaveLength(0);
  });
});
