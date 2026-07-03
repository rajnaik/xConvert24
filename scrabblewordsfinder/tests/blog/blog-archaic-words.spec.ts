import { test, expect } from '@playwright/test';

/**
 * Tests for the "Archaic Words Still Valid in Scrabble" blog post.
 * After FVT upgrade — page now uses Layout, blogGate, FAQPage schema,
 * word table, strategy cards, cross-links, and rich visual blocks.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';
const PAGE_URL = `${BASE}/blog/archaic-words-still-valid/`;

test.describe('Blog Archaic Words Still Valid — Positive', () => {
  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE_URL);
    expect(response?.status()).toBe(200);
  });

  test('page title contains archaic words headline', async ({ page }) => {
    await page.goto(PAGE_URL);
    const title = await page.title();
    expect(title).toContain('Archaic Words Still Valid in Scrabble');
    expect(title).toContain('Hidden Gems');
  });

  test('h1 heading is visible and correct', async ({ page }) => {
    await page.goto(PAGE_URL);
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('Archaic Words Still Valid in Scrabble');
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
        expect(text).toContain('Archaic Words Still Valid in Scrabble');
        expect(text).toContain('datePublished');
        expect(text).toContain('ScrabbleWordsFinder.com');
        expect(text).toContain('/blog/archaic-words-still-valid/');
      }
    }
    expect(foundArticle).toBe(true);
  });

  test('FAQPage JSON-LD schema present with 3 questions', async ({ page }) => {
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
    expect(faqData.mainEntity.length).toBe(3);
  });

  test('breadcrumb shows Blog link and Dictionaries category', async ({ page }) => {
    await page.goto(PAGE_URL);
    const breadcrumb = page.locator('nav').filter({ hasText: 'Blog' }).first();
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.locator('a[href="/blog/"]')).toBeAttached();
    const text = await breadcrumb.textContent();
    expect(text).toContain('Dictionaries');
  });

  test('word table with archaic pronouns and verbs is visible', async ({ page }) => {
    await page.goto(PAGE_URL);
    const table = page.locator('table').first();
    await expect(table).toBeAttached();
    const tableText = await table.textContent();
    expect(tableText).toContain('THOU');
    expect(tableText).toContain('HATH');
    expect(tableText).toContain('DOTH');
    expect(tableText).toContain('YE');
  });

  test('archaic nouns grid section exists with entries', async ({ page }) => {
    await page.goto(PAGE_URL);
    const body = await page.textContent('body');
    expect(body).toContain('SWAIN');
    expect(body).toContain('KNAVE');
    expect(body).toContain('WIGHT');
    expect(body).toContain('LIEGE');
  });

  test('strategy section with play recommendations exists', async ({ page }) => {
    await page.goto(PAGE_URL);
    const body = await page.textContent('body');
    expect(body).toContain('Tight board positions');
    expect(body).toContain('Bluff-proof plays');
    expect(body).toContain('Hook creation');
  });

  test('SOWPODS vs TWL dictionary comparison section exists', async ({ page }) => {
    await page.goto(PAGE_URL);
    const body = await page.textContent('body');
    expect(body).toContain('Both Dictionaries');
    expect(body).toContain('SOWPODS Only');
  });

  test('related articles aside exists with links', async ({ page }) => {
    await page.goto(PAGE_URL);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    await expect(aside).toBeAttached();
    const links = aside.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('CTA box with Open Word Finder exists', async ({ page }) => {
    await page.goto(PAGE_URL);
    const cta = page.locator('a:has-text("Open Word Finder")');
    await expect(cta.first()).toBeAttached();
    const href = await cta.first().getAttribute('href');
    expect(href).toBe('/');
  });

  test('back to blog link exists', async ({ page }) => {
    await page.goto(PAGE_URL);
    const backLink = page.locator('a:has-text("Back to all articles")');
    await expect(backLink).toBeAttached();
  });
});

test.describe('Blog Archaic Words Still Valid — Negative', () => {
  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE_URL);
    await page.waitForTimeout(2000);
    expect(errors.filter(e => !e.includes('net::') && !e.includes('adsbygoogle'))).toHaveLength(0);
  });

  test('article h1 heading contains correct title text', async ({ page }) => {
    await page.goto(PAGE_URL);
    // BlogCrossLinks renders h1 + the page may have its own — both contain the title
    const articleH1 = page.locator('article h1');
    const count = await articleH1.count();
    expect(count).toBeGreaterThanOrEqual(1);
    await expect(articleH1.first()).toContainText('Archaic Words Still Valid in Scrabble');
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
        expect(text).toContain('https://www.scrabblewordsfinder.com/blog/archaic-words-still-valid/');
        found = true;
      }
    }
    expect(found).toBe(true);
  });
});
