import { test, expect } from '@playwright/test';

/**
 * FAQ Page Tests
 * Covers the /faq/ page: expandable items, links, structured data, and edge cases.
 */

test.describe('FAQ Page — Positive', () => {
  test('loads with correct title', async ({ page }) => {
    await page.goto('/faq/');
    await expect(page).toHaveTitle(/FAQ/);
  });

  test('has main heading', async ({ page }) => {
    await page.goto('/faq/');
    await expect(page.locator('h1')).toHaveText('Frequently Asked Questions');
  });

  test('has 11 expandable FAQ items', async ({ page }) => {
    await page.goto('/faq/');
    const items = page.locator('details');
    await expect(items).toHaveCount(11);
  });

  test('FAQ items are expandable on click', async ({ page }) => {
    await page.goto('/faq/');
    const firstItem = page.locator('details').first();
    // Initially closed
    await expect(firstItem).not.toHaveAttribute('open', '');
    // Click to expand
    await firstItem.locator('summary').click();
    await expect(firstItem).toHaveAttribute('open', '');
  });

  test('bug report link points to /contact/?subject=bug @CheckLinkHealth', async ({ page }) => {
    await page.goto('/faq/');
    const bugLink = page.locator('a[href="/contact/?subject=bug"]');
    await expect(bugLink).toBeAttached();
    await expect(bugLink).toHaveText('Contact page');
  });

  test('Contact Us CTA button is present and links to /contact/', async ({ page }) => {
    await page.goto('/faq/');
    const cta = page.locator('a[href="/contact/"]');
    await expect(cta).toBeVisible();
    await expect(cta).toContainText('Contact Us');
  });

  test('has back-to-solver link', async ({ page }) => {
    await page.goto('/faq/');
    const backLink = page.locator('a[href="/"]');
    await expect(backLink.first()).toBeAttached();
  });

  test('has FAQPage structured data (JSON-LD)', async ({ page }) => {
    await page.goto('/faq/');
    const jsonLd = page.locator('script[type="application/ld+json"]');
    await expect(jsonLd).toBeAttached();
    const content = await jsonLd.textContent();
    expect(content).toContain('"@type":"FAQPage"');
    expect(content).toContain('"mainEntity"');
  });
});

test.describe('FAQ Page — Negative', () => {
  test('no duplicate FAQ questions', async ({ page }) => {
    await page.goto('/faq/');
    const summaries = page.locator('details summary');
    const count = await summaries.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await summaries.nth(i).textContent();
      texts.push(text?.replace('▼', '').trim() || '');
    }
    const unique = new Set(texts);
    expect(unique.size).toBe(texts.length);
  });

  test('no JavaScript errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/faq/');
    expect(errors).toHaveLength(0);
  });

  test('does not have stale /contact?subject=bug link (without trailing slash) @CheckLinkHealth', async ({ page }) => {
    await page.goto('/faq/');
    const staleLink = page.locator('a[href="/contact?subject=bug"]');
    await expect(staleLink).toHaveCount(0);
  });

  test('all internal links have valid href format @CheckLinkHealth', async ({ page }) => {
    await page.goto('/faq/');
    const links = page.locator('a[href^="/"]');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      // Internal links should not be empty or just "#"
      expect(href).toBeTruthy();
      expect(href).not.toBe('#');
    }
  });
});
