import { test, expect } from '@playwright/test';

/**
 * Site Tagline — Tests for the #site-tagline element on the homepage.
 * Added after id="site-tagline" was added to the tagline span.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Site Tagline — Positive', () => {
  test('tagline element exists with correct id', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const tagline = page.locator('#site-tagline');
    await expect(tagline).toBeAttached();
  });

  test('tagline is visible and has text content', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const tagline = page.locator('#site-tagline');
    await expect(tagline).toBeVisible();
    const text = await tagline.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
  });
});

test.describe('Site Tagline — Negative', () => {
  test('no duplicate #site-tagline elements', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const count = await page.locator('#site-tagline').count();
    expect(count).toBe(1);
  });

  test('tagline does not contain sensitive data', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const text = await page.locator('#site-tagline').textContent();
    expect(text).not.toContain('sk-');
    expect(text).not.toContain('@gmail');
    expect(text).not.toContain('AKIA');
  });
});
