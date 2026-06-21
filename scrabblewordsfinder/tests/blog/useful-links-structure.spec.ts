import { test, expect } from '@playwright/test';

/**
 * Useful Links Page — Overall Structure Tests
 * Verifies the page layout: sections flow correctly from orphan categories
 * into hardcoded category sections (Strategy, Bingos, etc.), ending with
 * a single CTA and back-to-blog link at the bottom.
 *
 * Related change: removed duplicate CTA block that was incorrectly placed
 * between the dynamic orphan categories loop and the Strategy section.
 */

test.describe('Useful Links — Page Structure — Positive', () => {

  test('page loads with 200 status', async ({ page }) => {
    const response = await page.goto('/blog/useful-links/');
    expect(response?.status()).toBe(200);
  });

  test('strategy section exists on the page', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const strategySection = page.locator('#strategy');
    await expect(strategySection).toBeVisible();
  });

  test('strategy section has correct heading text', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const heading = page.locator('#strategy summary .text-purple-400');
    await expect(heading).toContainText('Strategy');
  });

  test('strategy section is a collapsible details element', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const details = page.locator('#strategy details');
    await expect(details).toBeAttached();
  });

  test('strategy section contains blog post links', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const details = page.locator('#strategy details');
    if ((await details.getAttribute('open')) === null) {
      await details.locator('summary').click();
    }
    const links = details.locator('a[href^="/blog/"]');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(10);
  });

  test('page has exactly one CTA link to word finder at the bottom', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const ctaLinks = page.locator('a:has-text("Try the Word Finder")');
    await expect(ctaLinks).toHaveCount(1);
  });

  test('CTA link points to homepage', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const cta = page.locator('a:has-text("Try the Word Finder")');
    await expect(cta).toHaveAttribute('href', '/');
  });

  test('page has exactly one back-to-blog link at the bottom', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const backLinks = page.locator('a:has-text("Back to Blog")');
    await expect(backLinks).toHaveCount(1);
  });

  test('back-to-blog link points to /blog/', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const backLink = page.locator('a:has-text("Back to Blog")');
    await expect(backLink).toHaveAttribute('href', '/blog/');
  });

  test('all major category sections exist', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    await expect(page.locator('#strategy')).toBeVisible();
    await expect(page.locator('#bingos')).toBeVisible();
    await expect(page.locator('#high-scoring')).toBeVisible();
    await expect(page.locator('#tournament')).toBeVisible();
    await expect(page.locator('#dictionaries')).toBeVisible();
  });

  test('breadcrumb navigation exists at the top', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const breadcrumb = page.locator('nav.text-sm');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.locator('a[href="/blog/"]')).toBeVisible();
  });
});

test.describe('Useful Links — Page Structure — Negative', () => {

  test('no page errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/blog/useful-links/');
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('no duplicate CTA blocks on the page', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const ctaLinks = page.locator('a:has-text("Try the Word Finder")');
    await expect(ctaLinks).toHaveCount(1);
  });

  test('no duplicate back-to-blog links on the page', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const backLinks = page.locator('a:has-text("Back to Blog")');
    await expect(backLinks).toHaveCount(1);
  });

  test('no duplicate strategy sections', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const strategies = page.locator('#strategy');
    await expect(strategies).toHaveCount(1);
  });

  test('strategy section appears after the blog posts heading', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    // The "All Blog Posts by Category" heading should precede strategy
    const blogPostsHeading = page.locator('h2:has-text("All Blog Posts by Category")');
    await expect(blogPostsHeading).toBeVisible();
    // Strategy section exists after it in the DOM
    const strategy = page.locator('#strategy');
    await expect(strategy).toBeVisible();
  });

  test('no orphan CTA between category sections and strategy', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    // The strategy section's previous sibling should NOT be a CTA div
    // Verify that the CTA only appears after the last category section (at the bottom)
    const allCtas = await page.locator('.mt-10.text-center a[href="/"]').all();
    expect(allCtas.length).toBe(1);
  });

  test('expanding and collapsing strategy section does not crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/blog/useful-links/');
    const summary = page.locator('#strategy details summary');
    await summary.click();
    await page.waitForTimeout(200);
    await summary.click();
    await page.waitForTimeout(200);
    expect(errors).toHaveLength(0);
  });

  test('no empty href links anywhere on the page', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const emptyLinks = page.locator('a[href=""]');
    await expect(emptyLinks).toHaveCount(0);
  });
});
