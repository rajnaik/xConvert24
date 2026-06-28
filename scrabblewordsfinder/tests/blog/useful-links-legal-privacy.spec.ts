import { test, expect } from '@playwright/test';

/**
 * Useful Links Page — Legal & Privacy Section Tests
 * Tests the #legal-privacy section on /blog/useful-links/.
 *
 * Change: "ABC Extension Privacy" link (/privacy-abc/) was removed.
 * Section now contains exactly 3 links: Privacy Policy, Disclaimer, Terms of Use.
 */

test.describe('Useful Links — Legal & Privacy Section — Positive', () => {

  test('legal & privacy section exists and is visible', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const section = page.locator('#legal-privacy');
    await expect(section).toBeVisible();
  });

  test('section has correct heading text', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const heading = page.locator('#legal-privacy h2');
    await expect(heading).toContainText('Legal & Privacy');
  });

  test('section contains exactly 3 link cards', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const cards = page.locator('#legal-privacy .grid a');
    await expect(cards).toHaveCount(3);
  });

  test('Privacy Policy link is present with correct href', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const section = page.locator('#legal-privacy');
    const link = section.locator('a[href="/privacy/"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText('Privacy Policy');
  });

  test('Disclaimer link is present with correct href', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const section = page.locator('#legal-privacy');
    const link = section.locator('a[href="/disclaimer/"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText('Disclaimer');
  });

  test('Terms of Use link is present with correct href', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const section = page.locator('#legal-privacy');
    const link = section.locator('a[href="/terms/"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText('Terms of Use');
  });
});

test.describe('Useful Links — Legal & Privacy Section — Negative', () => {

  test('ABC Extension Privacy link is NOT present (removed)', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const section = page.locator('#legal-privacy');
    const abcLink = section.locator('a[href="/privacy-abc/"]');
    await expect(abcLink).toHaveCount(0);
  });

  test('no empty href links in the section', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const section = page.locator('#legal-privacy');
    const emptyLinks = section.locator('a[href=""]');
    await expect(emptyLinks).toHaveCount(0);
  });

  test('no page errors when section loads', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/blog/useful-links/');
    await page.locator('#legal-privacy').waitFor({ state: 'visible' });
    expect(errors).toHaveLength(0);
  });

  test('section does not contain duplicate links', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const section = page.locator('#legal-privacy');
    const privacyLinks = section.locator('a[href="/privacy/"]');
    const disclaimerLinks = section.locator('a[href="/disclaimer/"]');
    const termsLinks = section.locator('a[href="/terms/"]');
    await expect(privacyLinks).toHaveCount(1);
    await expect(disclaimerLinks).toHaveCount(1);
    await expect(termsLinks).toHaveCount(1);
  });
});
