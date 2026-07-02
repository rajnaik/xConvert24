import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('CaB Lex Coach Button — Fix Validation', () => {
  test('no JavaScript errors on activities page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/activities/`);
    await page.waitForTimeout(2000);
    const critical = errors.filter(e => !e.includes('net::') && !e.includes('Failed to fetch'));
    expect(critical).toHaveLength(0);
  });

  test('LexCandB button click opens the CaB Lex modal', async ({ page }) => {
    await page.goto(`${BASE}/activities/`);
    const btn = page.locator('#LexCandB');
    await expect(btn).toBeVisible();
    await btn.click();
    const modal = page.locator('#cab-lex-modal');
    await expect(modal).toBeVisible();
  });

  test('CaB Lex modal can be closed', async ({ page }) => {
    await page.goto(`${BASE}/activities/`);
    await page.locator('#LexCandB').click();
    await expect(page.locator('#cab-lex-modal')).toBeVisible();
    await page.locator('#cab-lex-close').click();
    await expect(page.locator('#cab-lex-modal')).toBeHidden();
  });

  test('CaB Lex modal has input field and messages area', async ({ page }) => {
    await page.goto(`${BASE}/activities/`);
    await page.locator('#LexCandB').click();
    await expect(page.locator('#cab-lex-input')).toBeVisible();
    await expect(page.locator('#cab-lex-messages')).toBeVisible();
  });
});
