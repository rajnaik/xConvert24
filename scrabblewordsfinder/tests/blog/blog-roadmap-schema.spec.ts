import { test, expect } from '@playwright/test';

/**
 * Tests for structured data (Article + FAQPage JSON-LD) on the
 * "Roadmap to Being a Pro Player" blog post.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';
const PAGE_URL = `${BASE}/blog/roadmap-to-being-a-pro-player/`;

test.describe('Blog Roadmap Schema — Positive', () => {
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
        expect(text).toContain('Roadmap to Being a Pro Scrabble Player');
        expect(text).toContain('datePublished');
        expect(text).toContain('ScrabbleWordsFinder.com');
        expect(text).toContain('/blog/roadmap-to-being-a-pro-player/');
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
    expect(questions).toContain('What is the best order to memorise Scrabble word lists?');
    expect(questions).toContain('How can a Scrabble word finder help me become a better player?');
    expect(questions).toContain('Does playing Scrabble improve cognitive function?');
    expect(questions).toContain('What separates a club player from a tournament pro in Scrabble?');
  });
});

test.describe('Blog Roadmap Schema — Negative', () => {
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

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE_URL);
    await page.waitForTimeout(1500);
    expect(errors.filter(e => !e.includes('net::') && !e.includes('adsbygoogle'))).toHaveLength(0);
  });
});
