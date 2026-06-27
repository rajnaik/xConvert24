import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'https://www.scrabblewordsfinder.com';

// ── Critical CSS — Positive ────────────────────────────────────────────────

test.describe('Critical CSS — Positive', () => {
  test('inline critical style tag exists in head', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const inlineStyle = page.locator('head > style');
    await expect(inlineStyle.first()).toBeAttached();
  });

  test('body background matches critical CSS value', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    // #0a0a0f = rgb(10, 10, 15)
    expect(bg).toBe('rgb(10, 10, 15)');
  });

  test('body text color matches critical CSS value', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const color = await page.evaluate(() => getComputedStyle(document.body).color);
    // #e5e7eb = rgb(229, 231, 235)
    expect(color).toBe('rgb(229, 231, 235)');
  });

  test('body margin is zero from critical CSS', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const margin = await page.evaluate(() => getComputedStyle(document.body).margin);
    expect(margin).toBe('0px');
  });
});

// ── Critical CSS — Negative ────────────────────────────────────────────────

test.describe('Critical CSS — Negative', () => {
  test('no flash of white background on initial load', async ({ page }) => {
    // Navigate and immediately check background — should never be white
    await page.goto(`${BASE_URL}/`);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).not.toBe('rgb(255, 255, 255)');
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('critical CSS applies on blog pages too', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/`);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    // Should be dark, not white
    expect(bg).not.toBe('rgb(255, 255, 255)');
  });
});
