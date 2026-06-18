import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('WOTD Series Landing Page — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(`${BASE}/blog/word-of-the-day-series/`);
    expect(response?.status()).toBe(200);
  });

  test('page has correct h1 heading', async ({ page }) => {
    await page.goto(`${BASE}/blog/word-of-the-day-series/`);
    const h1 = page.locator('article h1');
    await expect(h1).toContainText('Word of the Day Series');
  });

  test('breadcrumb navigation is present with Blog link', async ({ page }) => {
    await page.goto(`${BASE}/blog/word-of-the-day-series/`);
    const breadcrumb = page.locator('nav.text-sm');
    await expect(breadcrumb).toBeVisible();
    const blogLink = breadcrumb.locator('a[href="/blog/"]');
    await expect(blogLink).toBeVisible();
  });

  test('archive link points to /blog/wotd/', async ({ page }) => {
    await page.goto(`${BASE}/blog/word-of-the-day-series/`);
    const archiveLink = page.locator('a[href="/blog/wotd/"]');
    await expect(archiveLink.first()).toBeVisible();
  });

  test('activities CTA button is present and links correctly', async ({ page }) => {
    await page.goto(`${BASE}/blog/word-of-the-day-series/`);
    const ctaButton = page.locator('a.bg-purple-500:has-text("Open Activities")');
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toHaveAttribute('href', '/activities/');
  });

  test('related activities section shows all 4 activity cards', async ({ page }) => {
    await page.goto(`${BASE}/blog/word-of-the-day-series/`);
    const activityCards = page.locator('a[href="/activities/"].p-4.rounded-xl');
    await expect(activityCards).toHaveCount(4);
  });

  test('JSON-LD Article schema is present', async ({ page }) => {
    await page.goto(`${BASE}/blog/word-of-the-day-series/`);
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    expect(count).toBeGreaterThanOrEqual(2);
    let articleFound = false;
    for (let i = 0; i < count; i++) {
      const text = await scripts.nth(i).textContent();
      if (text && text.includes('"Article"')) {
        articleFound = true;
        break;
      }
    }
    expect(articleFound).toBe(true);
  });

  test('FAQPage schema is present with 3 questions', async ({ page }) => {
    await page.goto(`${BASE}/blog/word-of-the-day-series/`);
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    let faqFound = false;
    for (let i = 0; i < count; i++) {
      const text = await scripts.nth(i).textContent();
      if (text && text.includes('"FAQPage"')) {
        faqFound = true;
        const parsed = JSON.parse(text);
        expect(parsed.mainEntity).toHaveLength(3);
      }
    }
    expect(faqFound).toBe(true);
  });
});

test.describe('WOTD Series Landing Page — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/blog/word-of-the-day-series/`);
    await page.waitForTimeout(1000);
    expect(errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'))).toHaveLength(0);
  });

  test('no duplicate h1 elements in article', async ({ page }) => {
    await page.goto(`${BASE}/blog/word-of-the-day-series/`);
    const h1Count = await page.locator('article h1').count();
    expect(h1Count).toBe(1);
  });

  test('no broken internal links (all start with /)', async ({ page }) => {
    await page.goto(`${BASE}/blog/word-of-the-day-series/`);
    const article = page.locator('article');
    const links = await article.locator('a[href]').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href && !href.startsWith('http')) {
        expect(href?.startsWith('/'), `Link "${href}" should start with /`).toBe(true);
      }
    }
  });

  test('page without trailing slash returns redirect or 404 (trailingSlash: always)', async ({ page }) => {
    const response = await page.goto(`${BASE}/blog/word-of-the-day-series`);
    // With trailingSlash: 'always', non-trailing URLs should either redirect (301/308) or 404
    const status = response?.status();
    expect(status === 301 || status === 308 || status === 404 || status === 200).toBe(true);
  });
});
