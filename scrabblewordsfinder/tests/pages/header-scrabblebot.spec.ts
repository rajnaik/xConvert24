import { test, expect } from '@playwright/test';

/**
 * Header "Lex AI" Navigation Button Tests
 * Verifies the Lex AI (/chat/) icon link in the header nav bar.
 */

const lexAiSelector = 'header a[href="/chat/"].w-10';

test.describe('Header Lex AI — Positive', () => {
  test('lex ai button is visible in header', async ({ page }) => {
    await page.goto('/');
    const link = page.locator(lexAiSelector);
    await expect(link).toBeVisible();
  });

  test('lex ai button has avatar image instead of emoji', async ({ page }) => {
    await page.goto('/');
    const link = page.locator(lexAiSelector);
    const img = link.locator('img[src="/lex-avatar.webp"]');
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('alt', 'Lex AI');
    await expect(img).toHaveAttribute('width', '24');
    await expect(img).toHaveAttribute('height', '24');
  });

  test('lex ai tooltip shows on hover', async ({ page }) => {
    await page.goto('/');
    const link = page.locator(lexAiSelector);
    const tooltip = link.locator('span', { hasText: 'Lex AI' });
    await expect(tooltip).toBeAttached();
  });

  test('lex ai button navigates to /chat/', async ({ page }) => {
    await page.goto('/');
    await page.locator(lexAiSelector).click();
    await expect(page).toHaveURL(/\/chat\//);
  });
});

test.describe('Header Lex AI — Negative', () => {
  test('no duplicate lex ai icon buttons in header', async ({ page }) => {
    await page.goto('/');
    const links = page.locator(lexAiSelector);
    await expect(links).toHaveCount(1);
  });

  test('lex ai button does not appear in footer', async ({ page }) => {
    await page.goto('/');
    const footerLinks = page.locator('footer a[href="/chat/"]');
    await expect(footerLinks).toHaveCount(0);
  });
});
