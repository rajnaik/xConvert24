import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── Daily Anagram Panel Layout — Positive ───────────────────────────────
test.describe('Daily Anagram Panel Layout — Positive', () => {
  test('anagram panel is visible on the activities page', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const panel = page.locator('.star-indicator[data-game="anagram"]').locator('xpath=ancestor::div[contains(@class,"rounded-xl")]');
    await expect(panel).toBeVisible();
  });

  test('anagram panel does not span two columns (single column layout)', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const panel = page.locator('.star-indicator[data-game="anagram"]').locator('xpath=ancestor::div[contains(@class,"rounded-xl")]');
    const classes = await panel.getAttribute('class');
    expect(classes).not.toContain('col-span-2');
  });
});

// ── Daily Anagram Panel Layout — Negative ───────────────────────────────
test.describe('Daily Anagram Panel Layout — Negative', () => {
  test('anagram panel has no duplicate instances on the page', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const panels = page.locator('.star-indicator[data-game="anagram"]');
    await expect(panels).toHaveCount(1);
  });

  test('anagram panel does not overflow its grid cell on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ACTIVITIES_URL);
    const panel = page.locator('.star-indicator[data-game="anagram"]').locator('xpath=ancestor::div[contains(@class,"rounded-xl")]');
    await expect(panel).toBeVisible();
    const box = await panel.boundingBox();
    expect(box).not.toBeNull();
    // Panel should not exceed viewport width
    expect(box!.width).toBeLessThanOrEqual(375);
  });
});
