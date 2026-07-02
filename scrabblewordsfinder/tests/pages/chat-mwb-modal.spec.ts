import { test, expect } from '@playwright/test';

/**
 * Chat Page — MWB Modal Open/Close Behaviour
 *
 * The "Memorise with Memory WordBench" element was changed from a navigation link
 * to a button that opens an inline modal (#mwb-modal).
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Chat Page — MWB Modal Button (Positive)', () => {
  test('mwb-modal-open button is visible on the chat page', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const btn = page.locator('#mwb-modal-open');
    await expect(btn).toBeVisible();
  });

  test('mwb-modal-open is a button element (not a link)', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const btn = page.locator('#mwb-modal-open');
    const tagName = await btn.evaluate(el => el.tagName.toLowerCase());
    expect(tagName).toBe('button');
  });

  test('clicking mwb-modal-open shows the MWB modal', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const modal = page.locator('#mwb-modal');
    // Modal should be hidden initially
    await expect(modal).toHaveClass(/hidden/);
    // Click the open button
    await page.locator('#mwb-modal-open').click();
    // Modal should become visible (hidden class removed)
    await expect(modal).not.toHaveClass(/hidden/);
  });

  test('MWB modal has a close button that hides the modal', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.locator('#mwb-modal-open').click();
    const modal = page.locator('#mwb-modal');
    await expect(modal).not.toHaveClass(/hidden/);
    // Click close button
    await page.locator('#mwb-modal-close').click();
    await expect(modal).toHaveClass(/hidden/);
  });

  test('MWB modal closes when clicking the backdrop', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.locator('#mwb-modal-open').click();
    const modal = page.locator('#mwb-modal');
    await expect(modal).not.toHaveClass(/hidden/);
    // Click the backdrop
    await page.locator('#mwb-modal-backdrop').click({ position: { x: 10, y: 10 } });
    await expect(modal).toHaveClass(/hidden/);
  });
});

test.describe('Chat Page — MWB Modal Button (Negative)', () => {
  test('mwb-modal-open button does not navigate away from chat page', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.locator('#mwb-modal-open').click();
    // URL should remain on /chat/ (no navigation)
    expect(page.url()).toContain('/chat/');
  });

  test('no duplicate mwb-modal-open buttons exist', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const count = await page.locator('#mwb-modal-open').count();
    expect(count).toBe(1);
  });

  test('no duplicate mwb-modal overlays exist', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const count = await page.locator('#mwb-modal').count();
    expect(count).toBe(1);
  });

  test('clicking mwb-modal-open does not cause page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/chat/`);
    await page.locator('#mwb-modal-open').click();
    await page.waitForTimeout(1000);
    expect(errors.filter(e => !e.includes('net::') && !e.includes('Failed to fetch') && !e.includes('adsbygoogle'))).toHaveLength(0);
  });
});
