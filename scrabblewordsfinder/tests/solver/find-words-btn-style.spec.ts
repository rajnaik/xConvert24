import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Find Words Button Style — Positive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/`);
  });

  test('Find Words button is visible with correct text', async ({ page }) => {
    const btn = page.locator('#text-solve-btn');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveText('Find Words');
  });

  test('Find Words button has purple border styling', async ({ page }) => {
    const btn = page.locator('#text-solve-btn');
    await expect(btn).toHaveClass(/border-2/);
    await expect(btn).toHaveClass(/border-purple-500/);
  });

  test('Find Words button has green text color', async ({ page }) => {
    const btn = page.locator('#text-solve-btn');
    await expect(btn).toHaveClass(/text-green-400/);
  });

  test('Find Words button does not have old blue background', async ({ page }) => {
    const btn = page.locator('#text-solve-btn');
    await expect(btn).not.toHaveClass(/bg-blue-500/);
  });
});

test.describe('Find Words Button Style — Negative', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/`);
  });

  test('no duplicate Find Words buttons exist', async ({ page }) => {
    const btns = page.locator('#text-solve-btn');
    await expect(btns).toHaveCount(1);
  });

  test('button does not cause page error on click', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    const btn = page.locator('#text-solve-btn');
    await btn.click();
    await page.waitForTimeout(500);

    expect(errors.filter(e => e.includes('critical'))).toHaveLength(0);
  });
});
