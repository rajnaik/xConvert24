import { test, expect } from '@playwright/test';

/**
 * Chat Page — Rack Hint Tests
 * The #rack-hint element was moved from inside the button row (as a hidden-on-mobile span)
 * to below it (as a <p> with mt-1.5), making it always visible on all viewports.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Chat Rack Hint — Positive', () => {
  test('rack hint is visible on the page', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const hint = page.locator('#rack-hint');
    await expect(hint).toBeVisible();
  });

  test('rack hint displays correct text', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const hint = page.locator('#rack-hint');
    await expect(hint).toHaveText("Enter your tiles and I'll find the best word");
  });

  test('rack hint is a <p> element', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const hint = page.locator('p#rack-hint');
    await expect(hint).toBeAttached();
  });

  test('rack hint has correct styling classes', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const hint = page.locator('#rack-hint');
    await expect(hint).toHaveClass(/text-xs/);
    await expect(hint).toHaveClass(/text-gray-500/);
    await expect(hint).toHaveClass(/mt-1\.5/);
  });

  test('rack hint is visible on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE}/chat/`);
    const hint = page.locator('#rack-hint');
    await expect(hint).toBeVisible();
  });
});

test.describe('Chat Rack Hint — Negative', () => {
  test('no duplicate rack-hint elements exist', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const hints = page.locator('#rack-hint');
    await expect(hints).toHaveCount(1);
  });

  test('rack hint is not a span element (old structure removed)', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const oldSpan = page.locator('span#rack-hint');
    await expect(oldSpan).toHaveCount(0);
  });

  test('rack hint does not have hidden class (always visible)', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const hint = page.locator('#rack-hint');
    const classes = await hint.getAttribute('class');
    expect(classes).not.toContain('hidden');
  });

  test('rack hint does not appear inside the button row', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    // The Ask Lex button's parent div should NOT contain the rack hint
    const buttonRow = page.locator('#ask-lex-btn').locator('..');
    const hintInRow = buttonRow.locator('#rack-hint');
    await expect(hintInRow).toHaveCount(0);
  });
});
