import { test, expect } from '@playwright/test';

/**
 * BlogLayout Header Navigation Tests
 * Verifies the nav links in the blog layout header bar
 * (visible on all blog pages that use BlogLayout).
 */

const BLOG_PAGE = '/blog/what-is-scrabble/';

test.describe('BlogLayout Header Nav — Positive', () => {
  test('nav bar contains all expected links', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const nav = page.locator('.flex.items-center.gap-3.whitespace-nowrap').first();
    await expect(nav.locator('a[href="/blog/"]')).toBeAttached();
    await expect(nav.locator('a[href="/guide/"]')).toBeAttached();
    await expect(nav.locator('a[href="/about/"]')).toBeAttached();
    await expect(nav.locator('a[href="/privacy/"]')).toBeAttached();
    await expect(nav.locator('a[href="/contact/"]')).toBeAttached();
    await expect(nav.locator('a[href="/suggest/"]')).toBeAttached();
    await expect(nav.locator('a[href="/faq/"]')).toBeAttached();
    await expect(nav.locator('a[href="/activities/"]')).toBeAttached();
    await expect(nav.locator('a[href="/roadmap/"]')).toBeAttached();
  });

  test('FAQ link is visible in blog header nav', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const faqLink = page.locator('a[href="/faq/"]').first();
    await expect(faqLink).toBeVisible();
    await expect(faqLink).toContainText('FAQ');
  });

  test('Roadmap link is visible in blog header nav', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const roadmapLink = page.locator('a[href="/roadmap/"]').first();
    await expect(roadmapLink).toBeVisible();
    await expect(roadmapLink).toContainText('Roadmap');
  });

  test('FAQ link navigates to /faq/ page', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    await page.locator('a[href="/faq/"]').first().click();
    await expect(page).toHaveURL(/\/faq\//);
  });

  test('Roadmap link navigates to /roadmap/ page', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    await page.locator('a[href="/roadmap/"]').first().click();
    await expect(page).toHaveURL(/\/roadmap\//);
  });
});

test.describe('BlogLayout Header Nav — Negative', () => {
  test('header does not contain "Free, Fun, Fast & No Sign-up" tagline (removed from nav)', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const header = page.locator('header');
    const tagline = header.locator('text=Free, Fun, Fast & No Sign-up');
    await expect(tagline).toHaveCount(0);
  });

  test('no duplicate nav links in blog header', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const nav = page.locator('.flex.items-center.gap-3.whitespace-nowrap').first();
    const allLinks = await nav.locator('a').evaluateAll(els =>
      els.map(el => el.getAttribute('href'))
    );
    const duplicates = allLinks.filter((href, i) => allLinks.indexOf(href) !== i);
    expect(duplicates, `Duplicate nav links: ${duplicates.join(', ')}`).toHaveLength(0);
  });

  test('no nav links have empty or missing href', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const nav = page.locator('.flex.items-center.gap-3.whitespace-nowrap').first();
    const hrefs = await nav.locator('a').evaluateAll(els =>
      els.map(el => el.getAttribute('href'))
    );
    const emptyHrefs = hrefs.filter(h => !h || h.trim() === '' || h === '#');
    expect(emptyHrefs, 'Found links with empty/missing href').toHaveLength(0);
  });

  test('FAQ and Roadmap links do not 404', async ({ page }) => {
    const response1 = await page.goto('/faq/');
    expect(response1?.status()).not.toBe(404);
    const response2 = await page.goto('/roadmap/');
    expect(response2?.status()).not.toBe(404);
  });

  test('no console errors when clicking FAQ link from blog', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(BLOG_PAGE);
    await page.locator('a[href="/faq/"]').first().click();
    await page.waitForLoadState('domcontentloaded');
    expect(errors.filter(e => e.includes('critical'))).toHaveLength(0);
  });

  test('no console errors when clicking Roadmap link from blog', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(BLOG_PAGE);
    await page.locator('a[href="/roadmap/"]').first().click();
    await page.waitForLoadState('domcontentloaded');
    expect(errors.filter(e => e.includes('critical'))).toHaveLength(0);
  });
});
