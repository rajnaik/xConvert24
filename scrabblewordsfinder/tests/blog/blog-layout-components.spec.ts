import { test, expect } from '@playwright/test';

/**
 * BlogLayout Component Integration Tests
 * Verifies that BlogLayout renders correctly with imported components:
 * - Header component
 * - CookieConsent component
 * - VERSION constant from package.json
 */

const BLOG_PAGE = '/blog/what-is-scrabble/';

test.describe('BlogLayout Components — Positive', () => {
  test('blog page renders without errors after component imports', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    const response = await page.goto(BLOG_PAGE);
    expect(response?.status()).toBe(200);
    expect(errors).toHaveLength(0);
  });

  test('blog page header with logo is visible', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const logo = page.locator('#site-logo');
    await expect(logo).toBeAttached();
    await expect(logo).toHaveAttribute('src', /logo-options\/option-\d+\.svg/);
  });

  test('cookie consent banner element exists in DOM', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    // CookieConsent renders a hidden banner initially (shown based on consent state)
    const cookieBanner = page.locator('#cookie-banner');
    await expect(cookieBanner).toBeAttached();
  });

  test('blog page has correct canonical URL', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', /scrabblewordsfinder\.com\/blog\/what-is-scrabble/);
  });

  test('blog page has banner image with rotation support', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const bannerImg = page.locator('#blog-banner-img');
    await expect(bannerImg).toBeAttached();
    await expect(bannerImg).toHaveAttribute('src', /banner-options\/banner-\d+\.svg/);
  });

  test('version stamp is visible in bottom-right corner on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(BLOG_PAGE);
    const versionStamp = page.locator('.fixed.bottom-2.right-2 a[href="/releases/"]');
    await expect(versionStamp).toBeVisible();
    await expect(versionStamp).toContainText(/v\d+\.\d+/);
  });

  test('footer contains version link to releases page', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const footerVersionLink = page.locator('footer a[href="/releases/"]');
    await expect(footerVersionLink).toBeVisible();
    await expect(footerVersionLink).toContainText(/v\d+\.\d+/);
  });
});

test.describe('BlogLayout Components — Negative', () => {
  test('no JavaScript errors on blog page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(BLOG_PAGE);
    await page.waitForLoadState('networkidle');
    expect(errors, `Page errors: ${errors.join('; ')}`).toHaveLength(0);
  });

  test('no broken images on blog page', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    await page.waitForLoadState('networkidle');

    const brokenImages = await page.locator('img').evaluateAll(imgs =>
      imgs
        .filter(img => img.complete && img.naturalWidth === 0 && img.getAttribute('src'))
        .map(img => img.getAttribute('src'))
    );
    expect(brokenImages, `Broken images: ${brokenImages.join(', ')}`).toHaveLength(0);
  });

  test('no duplicate cookie consent banners on blog page', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const bannerCount = await page.locator('#cookie-banner').count();
    expect(bannerCount, 'Should have exactly one cookie banner').toBeLessThanOrEqual(1);
  });

  test('no duplicate site headers on blog page', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    // The main site header contains the logo — ensure only one exists
    const siteHeaders = page.locator('header #site-logo');
    const count = await siteHeaders.count();
    expect(count, 'Should have exactly one site header with logo').toBe(1);
  });

  test('version stamp is hidden on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(BLOG_PAGE);
    const versionStamp = page.locator('.fixed.bottom-2.right-2');
    await expect(versionStamp).toBeHidden();
  });

  test('no duplicate version links in footer', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const footerVersionLinks = page.locator('footer a[href="/releases/"]');
    const count = await footerVersionLinks.count();
    expect(count, 'Should have exactly one version link in footer').toBe(1);
  });
});
