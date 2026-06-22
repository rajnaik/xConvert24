import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

/**
 * CaB (Cows and Bulls) — Timer Toggle & Start Button Tests
 * Tests the timer toggle switch, countdown option buttons, and start button UI.
 */

test.describe('CaB Timer Toggle — Positive', () => {
  test('timer toggle switch is visible in setup', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const toggle = page.locator('#cab-timer-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('role', 'switch');
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  test('timer toggle label text is correct', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const label = page.locator('label[for="cab-timer-toggle"]');
    await expect(label).toBeVisible();
    await expect(label).toContainText('Play with timer');
  });

  test('timer countdown options are hidden by default', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const options = page.locator('#cab-timer-options');
    await expect(options).toBeHidden();
  });

  test('five timer duration buttons exist with correct values', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const timerBtns = page.locator('.cab-timer-btn');
    await expect(timerBtns).toHaveCount(5);

    // Verify each expected duration value
    await expect(page.locator('[data-timer="30"]')).toHaveText('30s');
    await expect(page.locator('[data-timer="45"]')).toHaveText('45s');
    await expect(page.locator('[data-timer="60"]')).toHaveText('60s');
    await expect(page.locator('[data-timer="75"]')).toHaveText('75s');
    await expect(page.locator('[data-timer="90"]')).toHaveText('90s');
  });

  test('start button wrapper is hidden by default', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const startWrap = page.locator('#cab-start-wrap');
    await expect(startWrap).toBeHidden();
  });

  test('start button is disabled by default', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const startBtn = page.locator('#cab-start-btn');
    await expect(startBtn).toBeDisabled();
  });

  test('start hint text is present', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const hint = page.locator('#cab-start-hint');
    await expect(hint).toContainText('Select a timer and word length to start');
  });
});

test.describe('CaB Timer Toggle — Negative', () => {
  test('timer options container has no duplicate timer buttons', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    // Each data-timer value should appear exactly once
    for (const val of ['30', '45', '60', '75', '90']) {
      const btns = page.locator(`[data-timer="${val}"]`);
      await expect(btns).toHaveCount(1);
    }
  });

  test('timer toggle does not break word length buttons', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    // Word length buttons should still be visible and clickable
    const lenBtns = page.locator('.cab-len-btn');
    await expect(lenBtns).toHaveCount(4);

    // All length buttons should be visible
    for (let i = 0; i < 4; i++) {
      await expect(lenBtns.nth(i)).toBeVisible();
    }
  });

  test('no console errors from timer UI on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(1000);

    // Filter for timer-related errors
    const timerErrors = errors.filter(
      (e) => e.includes('timer') || e.includes('cab-timer') || e.includes('cab-start')
    );
    expect(timerErrors).toHaveLength(0);
  });

  test('timer knob element exists inside toggle', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const knob = page.locator('#cab-timer-knob');
    await expect(knob).toBeAttached();

    // Knob should be a child of the toggle button
    const parent = page.locator('#cab-timer-toggle #cab-timer-knob');
    await expect(parent).toBeAttached();
  });
});
