import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── Anagram Submit data-track — Positive ─────────────────────────────────
test.describe('Anagram Submit data-track — Positive', () => {
  test('submit button has a data-track attribute after panel renders', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const submitBtn = page.locator('#anagram-submit');
    // Wait for the panel to be interactive (tiles rendered)
    await expect(submitBtn).toBeVisible({ timeout: 10000 });
    const dataTrack = await submitBtn.getAttribute('data-track');
    expect(dataTrack).not.toBeNull();
    expect(dataTrack).not.toBe('');
  });

  test('data-track value starts with Guess- prefix', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const submitBtn = page.locator('#anagram-submit');
    await expect(submitBtn).toBeVisible({ timeout: 10000 });
    const dataTrack = await submitBtn.getAttribute('data-track');
    expect(dataTrack).toMatch(/^Guess-[A-Z]+$/);
  });
});

// ── Anagram Submit data-track — Negative ─────────────────────────────────
test.describe('Anagram Submit data-track — Negative', () => {
  test('data-track does not contain lowercase letters (scrambled is uppercase)', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const submitBtn = page.locator('#anagram-submit');
    await expect(submitBtn).toBeVisible({ timeout: 10000 });
    const dataTrack = await submitBtn.getAttribute('data-track');
    // After the "Guess-" prefix, the scrambled word should be all uppercase
    const scrambledPart = dataTrack?.replace('Guess-', '') || '';
    expect(scrambledPart).toBe(scrambledPart.toUpperCase());
    expect(scrambledPart.length).toBeGreaterThan(0);
  });

  test('data-track is not set to a static value (changes with the daily puzzle)', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const submitBtn = page.locator('#anagram-submit');
    await expect(submitBtn).toBeVisible({ timeout: 10000 });
    const dataTrack = await submitBtn.getAttribute('data-track');
    // Should not be a hardcoded placeholder — must include actual letters
    expect(dataTrack).not.toBe('Guess-');
    expect(dataTrack).not.toBe('Guess-undefined');
    expect(dataTrack).not.toBe('Guess-null');
  });
});
