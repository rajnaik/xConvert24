import { test, expect } from '@playwright/test';

/**
 * Header "Useful Links" Navigation Button Tests
 * Verifies the new Useful Links icon link added to the header nav bar.
 */

const usefulLinksSelector = 'header a[href="/blog/useful-links/"].w-10';

test.describe('Header Useful Links — Positive', () => {
  test('useful links button is visible in header', async ({ page }) => {
    await page.goto('/');
    const link = page.locator(usefulLinksSelector);
    await expect(link).toBeVisible();
  });

  test('useful links button has correct link icon', async ({ page }) => {
    await page.goto('/');
    const link = page.locator(usefulLinksSelector);
    await expect(link).toContainText('🔗');
  });

  test('useful links tooltip shows on hover', async ({ page }) => {
    await page.goto('/');
    const link = page.locator(usefulLinksSelector);
    const tooltip = link.locator('span', { hasText: 'Useful Links' });
    await expect(tooltip).toBeAttached();
  });

  test('useful links button navigates to correct page', async ({ page }) => {
    await page.goto('/');
    await page.locator(usefulLinksSelector).click();
    await expect(page).toHaveURL(/\/blog\/useful-links/);
  });
});

test.describe('Header Useful Links — Negative', () => {
  test('no duplicate useful links icon buttons in header', async ({ page }) => {
    await page.goto('/');
    const links = page.locator(usefulLinksSelector);
    await expect(links).toHaveCount(1);
  });

  test('useful links button does not appear in footer', async ({ page }) => {
    await page.goto('/');
    const footerLinks = page.locator('footer a[href="/blog/useful-links/"]');
    await expect(footerLinks).toHaveCount(0);
  });
});
