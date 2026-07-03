import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'https://www.scrabblewordsfinder.com';
const PAGE = `${BASE}/blog/shortest-words-with-j/`;

test.describe('Shortest Words With J — Positive', () => {
  test('page loads with correct h1', async ({ page }) => {
    await page.goto(PAGE);
    const h1 = page.locator('article h1');
    await expect(h1).toContainText('Shortest Words With J');
  });

  test('stat strip displays J tile facts', async ({ page }) => {
    await page.goto(PAGE);
    const article = page.locator('article');
    await expect(article.locator('text=Points (J tile)')).toBeVisible();
    await expect(article.locator('p:has-text("2-letter J word")')).toBeVisible();
    await expect(article.locator('p:has-text("3-letter J words")')).toBeVisible();
  });

  test('JO hero card is visible with essential badge', async ({ page }) => {
    await page.goto(PAGE);
    const article = page.locator('article');
    await expect(article.getByText('Essential')).toBeVisible();
    await expect(article.getByText('9 points')).toBeVisible();
    await expect(article.getByText('SOWPODS + TWL')).toBeVisible();
  });

  test('word table has header and at least 10 rows', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table');
    await expect(table).toBeVisible();
    const headers = table.locator('thead th');
    await expect(headers.nth(0)).toContainText('Word');
    await expect(headers.nth(1)).toContainText('Score');
    await expect(headers.nth(2)).toContainText('Meaning');
    const rows = table.locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(10);
  });

  test('FAQPage schema is present with 3 questions', async ({ page }) => {
    await page.goto(PAGE);
    const schemas = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      return Array.from(scripts).map(s => JSON.parse(s.textContent || '{}'));
    });
    const faq = schemas.find(s => s['@type'] === 'FAQPage');
    expect(faq).toBeTruthy();
    expect(faq.mainEntity).toHaveLength(3);
  });

  test('related articles section has links with trailing slashes', async ({ page }) => {
    await page.goto(PAGE);
    const related = page.locator('aside').filter({ hasText: 'Related Articles' });
    await expect(related).toBeVisible();
    const links = related.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).toMatch(/\/$/);
    }
  });

  test('CTA word finder link is present', async ({ page }) => {
    await page.goto(PAGE);
    const cta = page.locator('a').filter({ hasText: 'Open Word Finder' });
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute('href');
    expect(href).toBe('/');
  });
});

test.describe('Shortest Words With J — Negative', () => {
  test('no duplicate h1 in article', async ({ page }) => {
    await page.goto(PAGE);
    const h1s = page.locator('article h1');
    const count = await h1s.count();
    expect(count).toBe(1);
  });

  test('no broken internal links (all have trailing slash)', async ({ page }) => {
    await page.goto(PAGE);
    const internalLinks = page.locator('article a[href^="/blog/"]');
    const count = await internalLinks.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const href = await internalLinks.nth(i).getAttribute('href');
      expect(href, `Internal link "${href}" missing trailing slash`).toMatch(/\/$/);
    }
  });

  test('no page errors during load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    expect(errors).toHaveLength(0);
  });

  test('Article schema has trailing slash in mainEntityOfPage', async ({ page }) => {
    await page.goto(PAGE);
    const schemas = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      return Array.from(scripts).map(s => JSON.parse(s.textContent || '{}'));
    });
    const article = schemas.find(s => s['@type'] === 'Article');
    expect(article).toBeTruthy();
    expect(article.mainEntityOfPage['@id']).toMatch(/\/$/);
  });
});
