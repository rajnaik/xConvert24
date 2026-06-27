import { test, expect } from '@playwright/test';

/**
 * Tests for structured data (Article + FAQPage JSON-LD) and page structure on the
 * "Scrabble Rating System Explained" blog post.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';
const PAGE_URL = `${BASE}/blog/scrabble-rating-system-explained/`;

test.describe('Blog Rating System Schema — Positive', () => {
  test('page loads successfully', async ({ page }) => {
    const response = await page.goto(PAGE_URL);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('Article schema is present with correct headline', async ({ page }) => {
    await page.goto(PAGE_URL);
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    let foundArticle = false;
    for (let i = 0; i < count; i++) {
      const text = await schemas.nth(i).textContent();
      if (text?.includes('"@type":"Article"') || text?.includes('"@type": "Article"')) {
        foundArticle = true;
        expect(text).toContain('Scrabble Rating System Explained');
        expect(text).toContain('datePublished');
        expect(text).toContain('ScrabbleWordsFinder.com');
        expect(text).toContain('/blog/scrabble-rating-system-explained/');
      }
    }
    expect(foundArticle).toBe(true);
  });

  test('FAQPage schema is present with 4 questions', async ({ page }) => {
    await page.goto(PAGE_URL);
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    let faqData: any = null;
    for (let i = 0; i < count; i++) {
      const text = await schemas.nth(i).textContent();
      if (text?.includes('FAQPage')) {
        faqData = JSON.parse(text!);
        break;
      }
    }
    expect(faqData).not.toBeNull();
    expect(faqData['@type']).toBe('FAQPage');
    expect(faqData.mainEntity).toHaveLength(4);
  });

  test('FAQ questions cover expected topics', async ({ page }) => {
    await page.goto(PAGE_URL);
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    let questions: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await schemas.nth(i).textContent();
      if (text?.includes('FAQPage')) {
        const data = JSON.parse(text!);
        questions = data.mainEntity.map((q: any) => q.name);
        break;
      }
    }
    expect(questions).toContain('How is a Scrabble tournament rating calculated?');
    expect(questions).toContain('What is a good Scrabble rating?');
    expect(questions).toContain('How do divisions work in Scrabble tournaments?');
    expect(questions).toContain('How quickly can you improve your Scrabble rating?');
  });

  test('breadcrumb nav links back to blog index', async ({ page }) => {
    await page.goto(PAGE_URL);
    const blogLink = page.locator('nav a[href="/blog/"]');
    await expect(blogLink).toBeVisible();
    await expect(blogLink).toContainText('Blog');
  });

  test('h1 contains expected title text', async ({ page }) => {
    await page.goto(PAGE_URL);
    await expect(page.locator('h1').first()).toContainText('Scrabble Rating System Explained');
  });
});

test.describe('Blog Rating System Schema — Negative', () => {
  test('no duplicate FAQPage schemas on the page', async ({ page }) => {
    await page.goto(PAGE_URL);
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    let faqCount = 0;
    for (let i = 0; i < count; i++) {
      const text = await schemas.nth(i).textContent();
      if (text?.includes('FAQPage')) faqCount++;
    }
    expect(faqCount).toBe(1);
  });

  test('Article schema mainEntityOfPage has correct trailing-slash URL', async ({ page }) => {
    await page.goto(PAGE_URL);
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    let found = false;
    for (let i = 0; i < count; i++) {
      const text = await schemas.nth(i).textContent();
      if (text?.includes('"@type":"Article"') || text?.includes('"@type": "Article"')) {
        const data = JSON.parse(text!);
        if (data.mainEntityOfPage?.['@id']) {
          expect(data.mainEntityOfPage['@id']).toMatch(/\/$/);
          found = true;
        }
      }
    }
    expect(found).toBe(true);
  });

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE_URL);
    await page.waitForTimeout(1500);
    expect(errors.filter(e => !e.includes('net::') && !e.includes('adsbygoogle'))).toHaveLength(0);
  });
});
