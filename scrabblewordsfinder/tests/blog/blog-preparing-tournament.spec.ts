import { test, expect } from '@playwright/test';

/**
 * Tests for the "Preparing for Your First Scrabble Tournament" blog post.
 * Updated after full FVT content treatment — page now has Article + FAQPage schemas,
 * rich visual blocks, stat strip, cross-links, and complete tournament prep content.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';
const PAGE_URL = `${BASE}/blog/preparing-for-first-tournament/`;

test.describe('Blog Preparing for First Tournament — Positive', () => {
  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE_URL);
    expect(response?.status()).toBe(200);
  });

  test('page title contains updated headline with Complete Guide', async ({ page }) => {
    await page.goto(PAGE_URL);
    const title = await page.title();
    expect(title).toContain('Preparing for Your First Scrabble Tournament');
    expect(title).toContain('Complete Guide');
  });

  test('h1 heading is visible and correct', async ({ page }) => {
    await page.goto(PAGE_URL);
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('Preparing for Your First Scrabble Tournament');
  });

  test('Article JSON-LD schema present with correct data', async ({ page }) => {
    await page.goto(PAGE_URL);
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    let foundArticle = false;
    for (let i = 0; i < count; i++) {
      const text = await schemas.nth(i).textContent();
      if (text?.includes('"Article"')) {
        foundArticle = true;
        expect(text).toContain('Preparing for Your First Scrabble Tournament');
        expect(text).toContain('datePublished');
        expect(text).toContain('ScrabbleWordsFinder.com');
        expect(text).toContain('/blog/preparing-for-first-tournament/');
      }
    }
    expect(foundArticle).toBe(true);
  });

  test('FAQPage JSON-LD schema present with 4 questions', async ({ page }) => {
    await page.goto(PAGE_URL);
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    let faqData: any = null;
    for (let i = 0; i < count; i++) {
      const text = await schemas.nth(i).textContent();
      if (text?.includes('"FAQPage"')) {
        faqData = JSON.parse(text!);
        break;
      }
    }
    expect(faqData).not.toBeNull();
    expect(faqData.mainEntity.length).toBe(4);
  });

  test('meta description contains tournament prep keywords', async ({ page }) => {
    await page.goto(PAGE_URL);
    const metaDesc = page.locator('meta[name="description"]');
    const content = await metaDesc.getAttribute('content');
    expect(content).toContain('first rated Scrabble event');
    expect(content).toContain('clock management');
    expect(content!.length).toBeGreaterThan(100);
  });

  test('breadcrumb shows Blog link and Tournament category', async ({ page }) => {
    await page.goto(PAGE_URL);
    const breadcrumb = page.locator('nav').filter({ hasText: 'Blog' }).first();
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.locator('a[href="/blog/"]')).toBeAttached();
    const text = await breadcrumb.textContent();
    expect(text).toContain('Tournament');
  });

  test('stat strip displays key tournament facts', async ({ page }) => {
    await page.goto(PAGE_URL);
    const body = await page.textContent('body');
    expect(body).toContain('25 min');
    expect(body).toContain('127');
  });

  test('study priority section exists', async ({ page }) => {
    await page.goto(PAGE_URL);
    const body = await page.textContent('body');
    expect(body).toContain('Study Priority Order');
  });

  test('related articles aside exists in DOM', async ({ page }) => {
    await page.goto(PAGE_URL);
    const aside = page.locator('article aside').filter({ hasText: 'Related Articles' });
    await expect(aside).toBeAttached();
    const links = aside.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('CTA box with Open Word Finder exists in DOM', async ({ page }) => {
    await page.goto(PAGE_URL);
    const cta = page.locator('a:has-text("Open Word Finder")');
    await expect(cta.first()).toBeAttached();
    const href = await cta.first().getAttribute('href');
    expect(href).toBe('/');
  });

  test('back to blog link exists in DOM', async ({ page }) => {
    await page.goto(PAGE_URL);
    const backLink = page.locator('a:has-text("Back to all articles")');
    await expect(backLink).toBeAttached();
  });
});

test.describe('Blog Preparing for First Tournament — Negative', () => {
  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE_URL);
    await page.waitForTimeout(2000);
    expect(errors.filter(e => !e.includes('net::') && !e.includes('adsbygoogle'))).toHaveLength(0);
  });

  test('no duplicate h1 headings in article', async ({ page }) => {
    await page.goto(PAGE_URL);
    const h1s = page.locator('article h1, .prose h1');
    const count = await h1s.count();
    expect(count).toBeLessThanOrEqual(1);
  });

  test('FAQ schema answers are not empty', async ({ page }) => {
    await page.goto(PAGE_URL);
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    for (let i = 0; i < count; i++) {
      const text = await schemas.nth(i).textContent();
      if (text?.includes('"FAQPage"')) {
        const data = JSON.parse(text!);
        for (const q of data.mainEntity) {
          expect(q.acceptedAnswer.text.length).toBeGreaterThan(20);
        }
      }
    }
  });

  test('internal blog links have trailing slashes', async ({ page }) => {
    await page.goto(PAGE_URL);
    const links = page.locator('a[href^="/blog/"]');
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href, `Link ${href} should end with /`).toMatch(/\/$/);
    }
  });

  test('page does not contain sensitive data', async ({ page }) => {
    await page.goto(PAGE_URL);
    const html = await page.content();
    expect(html).not.toContain('sk-');
    expect(html).not.toContain('AKIA');
    expect(html).not.toMatch(/@gmail\.com/);
  });

  test('Article schema canonical URL has trailing slash', async ({ page }) => {
    await page.goto(PAGE_URL);
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    let found = false;
    for (let i = 0; i < count; i++) {
      const text = await schemas.nth(i).textContent();
      if (text?.includes('"Article"')) {
        expect(text).toContain('https://www.scrabblewordsfinder.com/blog/preparing-for-first-tournament/');
        found = true;
      }
    }
    expect(found).toBe(true);
  });
});
