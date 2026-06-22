import { test, expect } from '@playwright/test';

const PAGE = '/blog/scrabble-dictionary-apps/';

test.describe('Scrabble Dictionary Apps — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('page title contains updated headline', async ({ page }) => {
    await page.goto(PAGE);
    const title = await page.title();
    expect(title).toContain('Best Scrabble Dictionary Apps');
  });

  test('meta description is set with improved copy', async ({ page }) => {
    await page.goto(PAGE);
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).toContain('Compare the best Scrabble dictionary apps');
  });

  test('meta keywords include scrabble dictionary app', async ({ page }) => {
    await page.goto(PAGE);
    const keywords = await page.locator('meta[name="keywords"]').getAttribute('content');
    expect(keywords).toContain('scrabble dictionary app');
  });

  test('h1 heading displays full title', async ({ page }) => {
    await page.goto(PAGE);
    const h1 = page.locator('article h1');
    await expect(h1).toContainText('Best Scrabble Dictionary Apps');
  });

  test('article has FAQPage structured data', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    let hasFAQ = false;
    for (let i = 0; i < count; i++) {
      const content = await scripts.nth(i).textContent();
      if (content && content.includes('FAQPage')) { hasFAQ = true; break; }
    }
    expect(hasFAQ).toBe(true);
  });

  test('stat strip shows SOWPODS and TWL word counts', async ({ page }) => {
    await page.goto(PAGE);
    const body = await page.textContent('body');
    expect(body).toContain('279K+');
    expect(body).toContain('187K+');
  });

  test('feature comparison table is visible', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('CTA box with Word Finder link is present', async ({ page }) => {
    await page.goto(PAGE);
    const cta = page.locator('a:has-text("Open Word Finder")');
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute('href');
    expect(href).toBe('/');
  });

  test('breadcrumb links to blog index', async ({ page }) => {
    await page.goto(PAGE);
    const blogLink = page.locator('nav a[href="/blog/"]');
    await expect(blogLink).toBeVisible();
  });

  test('back to all articles link exists', async ({ page }) => {
    await page.goto(PAGE);
    const backLink = page.locator('a:has-text("Back to all articles")');
    await expect(backLink).toBeVisible();
  });
});

test.describe('Scrabble Dictionary Apps — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('page does not return 404 or 500', async ({ page }) => {
    const response = await page.goto(PAGE);
    const status = response?.status() ?? 0;
    expect(status).not.toBe(404);
    expect(status).not.toBe(500);
  });

  test('page does not contain old stub description text', async ({ page }) => {
    await page.goto(PAGE);
    const body = await page.textContent('body');
    expect(body).not.toContain('Top apps for checking word validity. Free and paid options for SOWPODS and TWL lookups.');
  });

  test('page does not link to itself in navigation', async ({ page }) => {
    await page.goto(PAGE);
    const selfLinks = page.locator(`a[href="${PAGE}"]`);
    const count = await selfLinks.count();
    // Allow zero or at most the blog breadcrumb/canonical — no excessive self-links
    expect(count).toBeLessThanOrEqual(1);
  });

  test('no duplicate h1 headings in article', async ({ page }) => {
    await page.goto(PAGE);
    const h1Count = await page.locator('article h1').count();
    expect(h1Count).toBe(1);
  });

  test('structured data JSON-LD is valid JSON', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const content = await scripts.nth(i).textContent();
      expect(() => JSON.parse(content || '')).not.toThrow();
    }
  });
});
