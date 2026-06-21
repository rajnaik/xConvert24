import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── 📌 Pin Icon Visibility — Positive ────────────────────────────────────
// The pin (📌) icon (.panel-focus-btn) must be visible ONLY on mobile (≤480px).

test.describe('Pin Icon Visibility — Positive', () => {
  test('pin icon is visible on small mobile viewport (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn', { state: 'attached' });
    await expect(page.locator('.panel-focus-btn').first()).toBeVisible();
  });

  test('pin icon is visible at max mobile breakpoint (480px)', async ({ page }) => {
    await page.setViewportSize({ width: 480, height: 844 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn', { state: 'attached' });
    await expect(page.locator('.panel-focus-btn').first()).toBeVisible();
  });
});

// ── 📌 Pin Icon Visibility — Negative ────────────────────────────────────
// Any viewport wider than 480px must NOT see the pin icon.

test.describe('Pin Icon Visibility — Negative', () => {
  test('pin icon is not visible at 481px (just above breakpoint)', async ({ page }) => {
    await page.setViewportSize({ width: 481, height: 800 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn', { state: 'attached' });
    await expect(page.locator('.panel-focus-btn').first()).not.toBeVisible();
  });

  test('pin icon is not visible on tablet viewport (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn', { state: 'attached' });
    await expect(page.locator('.panel-focus-btn').first()).not.toBeVisible();
  });

  test('pin icon is not visible on desktop viewport (1280px)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn', { state: 'attached' });
    await expect(page.locator('.panel-focus-btn').first()).not.toBeVisible();
  });

  test('pin icon is not visible on large desktop viewport (1920px)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn', { state: 'attached' });
    await expect(page.locator('.panel-focus-btn').first()).not.toBeVisible();
  });
});
