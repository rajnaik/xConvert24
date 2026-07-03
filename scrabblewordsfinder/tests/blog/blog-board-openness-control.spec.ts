import { test, expect } from '@playwright/test';

/**
 * Tests for the "Board Openness Control" blog post.
 * Covers: page structure, new sections (How to Open, Score Differential table),
 * inline cross-links, Related Articles aside, CTA box, and back link.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';
const PAGE_URL = `${BASE}/blog/board-openness-control/`;

test.describe('Blog Board Openness Control — Positive', () => {
  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE_URL);
    expect(response?.status()).toBe(200);
  });

  test('h1 contains expected title', async ({ page }) => {
    await page.goto(PAGE_URL);
    await expect(page.locator('h1').first()).toContainText('Board Openness Control');
  });

  test('has Article JSON-LD schema', async ({ page }) => {
    await page.goto(PAGE_URL);
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    let foundArticle = false;
    for (let i = 0; i < count; i++) {
      const text = await schemas.nth(i).textContent();
      if (text?.includes('"@type":"Article"') || text?.includes('"@type": "Article"')) {
        foundArticle = true;
        expect(text).toContain('Board Openness Control');
        expect(text).toContain('datePublished');
      }
    }
    expect(foundArticle).toBe(true);
  });

  test('has FAQPage JSON-LD schema with 3 questions', async ({ page }) => {
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
    expect(faqData.mainEntity).toHaveLength(3);
  });

  test('has "How to Open the Board" section heading', async ({ page }) => {
    await page.goto(PAGE_URL);
    const heading = page.locator('h2', { hasText: 'How to Open the Board' });
    await expect(heading).toBeVisible();
  });

  test('has "Decision Framework: Score Differential" section heading', async ({ page }) => {
    await page.goto(PAGE_URL);
    const heading = page.locator('h2', { hasText: 'Decision Framework' });
    await expect(heading).toBeVisible();
  });

  test('score differential table has 4 data rows', async ({ page }) => {
    await page.goto(PAGE_URL);
    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(4);
  });

  test('score differential table has correct headers', async ({ page }) => {
    await page.goto(PAGE_URL);
    const headers = page.locator('table thead th');
    await expect(headers.nth(0)).toContainText('Score Gap');
    await expect(headers.nth(1)).toContainText('If Ahead');
    await expect(headers.nth(2)).toContainText('If Behind');
  });

  test('Dig Deeper cross-link block is present with 2 links', async ({ page }) => {
    await page.goto(PAGE_URL);
    const digDeeper = page.locator('text=Dig Deeper');
    await expect(digDeeper).toBeVisible();
    const crossLinks = page.locator('a[href="/blog/defensive-scrabble-strategy/"], a[href="/blog/hotspots-and-dead-zones/"]');
    expect(await crossLinks.count()).toBeGreaterThanOrEqual(2);
  });

  test('Related Articles aside has 3 links', async ({ page }) => {
    await page.goto(PAGE_URL);
    const aside = page.locator('aside');
    await expect(aside.locator('h3')).toContainText('Related Articles');
    const links = aside.locator('a');
    await expect(links).toHaveCount(3);
  });

  test('Related Articles links have trailing slashes', async ({ page }) => {
    await page.goto(PAGE_URL);
    const aside = page.locator('aside');
    const links = aside.locator('a');
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).toMatch(/\/$/);
    }
  });

  test('CTA box links to homepage word finder', async ({ page }) => {
    await page.goto(PAGE_URL);
    const ctaLink = page.locator('a', { hasText: 'Open Word Finder' });
    await expect(ctaLink).toBeVisible();
    await expect(ctaLink).toHaveAttribute('href', '/');
  });

  test('back to blog link is present', async ({ page }) => {
    await page.goto(PAGE_URL);
    const backLink = page.locator('a', { hasText: 'Back to all articles' });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/blog/');
  });

  test('breadcrumb links to blog index and strategy category', async ({ page }) => {
    await page.goto(PAGE_URL);
    const blogLink = page.locator('nav a[href="/blog/"]');
    await expect(blogLink).toBeVisible();
    const strategyLink = page.locator('nav a[href="/blog/strategy/"]');
    await expect(strategyLink).toBeVisible();
  });
});

test.describe('Blog Board Openness Control — Negative', () => {
  test('no duplicate FAQPage schemas', async ({ page }) => {
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

  test('score differential table does not have empty cells', async ({ page }) => {
    await page.goto(PAGE_URL);
    const cells = page.locator('table tbody td');
    const count = await cells.count();
    for (let i = 0; i < count; i++) {
      const text = await cells.nth(i).textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('Related Articles links do not point to same page', async ({ page }) => {
    await page.goto(PAGE_URL);
    const aside = page.locator('aside');
    const links = aside.locator('a');
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).not.toContain('board-openness-control');
    }
  });
});
