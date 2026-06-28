import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Cookie Consent Privacy Link — Positive', () => {
  test('privacy link exists in cookie banner with correct href', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const link = page.locator('#cookie-banner a[href="/privacy/"]');
    await expect(link).toBeAttached();
    await expect(link).toHaveText('Read our privacy policy');
  });

  test('privacy link has permanent underline class', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const link = page.locator('#cookie-banner a[href="/privacy/"]');
    await expect(link).toHaveClass(/\bunderline\b/);
  });
});

test.describe('Cookie Consent Privacy Link — Negative', () => {
  test('no duplicate privacy links in cookie banner', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const links = page.locator('#cookie-banner a[href="/privacy/"]');
    await expect(links).toHaveCount(1);
  });

  test('privacy link does not have hover:underline class (always visible underline)', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const link = page.locator('#cookie-banner a[href="/privacy/"]');
    const classAttr = await link.getAttribute('class');
    expect(classAttr).not.toContain('hover:underline');
  });
});
