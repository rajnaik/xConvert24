import { test, expect } from '@playwright/test';

const PAGE = '/blog/two-letter-words-complete-strategy/';

test.describe('Two-Letter Words Complete Strategy — Structure — Positive', () => {

  test('page loads with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('h1 heading is visible', async ({ page }) => {
    await page.goto(PAGE);
    const h1 = page.locator('h1', { hasText: 'Two-Letter Words Complete Strategy' });
    await expect(h1).toBeVisible();
  });

  test('breadcrumb nav with Blog link and Strategy category', async ({ page }) => {
    await page.goto(PAGE);
    const blogLink = page.locator('nav a[href="/blog/"]');
    await expect(blogLink).toBeVisible();
    const categorySpan = page.locator('nav span', { hasText: 'Strategy' });
    await expect(categorySpan).toBeVisible();
  });

  test('all 6 section headings are visible', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('h2', { hasText: 'Parallel Play Scoring — The Hidden Power' })).toBeVisible();
    await expect(page.locator('h2', { hasText: 'The Complete Tier List' })).toBeVisible();
    await expect(page.locator('h2', { hasText: /Vowel Dumps/ })).toBeVisible();
    await expect(page.locator('h2', { hasText: 'Premium Square Targeting' })).toBeVisible();
    await expect(page.locator('h2', { hasText: 'Blocking and Defensive 2-Letter Plays' })).toBeVisible();
    await expect(page.locator('h2', { hasText: 'Training Your Parallel Play Vision' })).toBeVisible();
  });

  test('tier list table exists with 5 rows', async ({ page }) => {
    await page.goto(PAGE);
    const tableRows = page.locator('table tbody tr');
    await expect(tableRows).toHaveCount(5);
  });

  test('tier list table contains Power tier with QI', async ({ page }) => {
    await page.goto(PAGE);
    const powerRow = page.locator('table tbody tr', { hasText: 'Power' });
    await expect(powerRow).toBeVisible();
    await expect(powerRow).toContainText('QI');
  });

  test('premium square stat strip shows scoring values', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('text=31 pts')).toBeVisible();
    await expect(page.getByText('ZA on TLS', { exact: true })).toBeVisible();
  });

  test('CTA block links to word finder', async ({ page }) => {
    await page.goto(PAGE);
    const ctaLink = page.locator('a', { hasText: 'Open Word Finder →' });
    await expect(ctaLink).toBeVisible();
    await expect(ctaLink).toHaveAttribute('href', '/');
  });
});

test.describe('Two-Letter Words Complete Strategy — Cross-Links — Positive', () => {

  test('dig deeper section exists with links', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('text=Dig Deeper')).toBeVisible();
  });

  test('dig deeper links to highest-scoring-2-letter-plays', async ({ page }) => {
    await page.goto(PAGE);
    const link = page.locator('a[href="/blog/highest-scoring-2-letter-plays/"]').first();
    await expect(link).toBeVisible();
  });

  test('dig deeper links to two-letter-scrabble-words-complete-list', async ({ page }) => {
    await page.goto(PAGE);
    const link = page.locator('a[href="/blog/two-letter-scrabble-words-complete-list/"]');
    await expect(link).toBeVisible();
  });

  test('related articles section has 3 links', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside');
    await expect(aside.locator('a')).toHaveCount(3);
  });

  test('related articles include best-two-letter-words-scrabble', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside');
    const link = aside.locator('a[href="/blog/best-two-letter-words-scrabble/"]');
    await expect(link).toBeVisible();
  });

  test('related articles include rare-two-letter-scrabble-words', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside');
    const link = aside.locator('a[href="/blog/rare-two-letter-scrabble-words/"]');
    await expect(link).toBeVisible();
  });
});

test.describe('Two-Letter Words Complete Strategy — Schema — Positive', () => {

  test('Article schema is present with correct headline', async ({ page }) => {
    await page.goto(PAGE);
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    let foundArticle = false;
    for (let i = 0; i < count; i++) {
      const text = await schemas.nth(i).textContent();
      if (text && text.includes('"@type":"Article"')) {
        foundArticle = true;
        expect(text).toContain('Two-Letter Words Complete Strategy');
      }
    }
    expect(foundArticle).toBe(true);
  });

  test('FAQPage schema is present with 3 questions', async ({ page }) => {
    await page.goto(PAGE);
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    let foundFAQ = false;
    for (let i = 0; i < count; i++) {
      const text = await schemas.nth(i).textContent();
      if (text && text.includes('"@type":"FAQPage"')) {
        foundFAQ = true;
        const parsed = JSON.parse(text);
        expect(parsed.mainEntity).toHaveLength(3);
      }
    }
    expect(foundFAQ).toBe(true);
  });
});

test.describe('Two-Letter Words Complete Strategy — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate h1 headings', async ({ page }) => {
    await page.goto(PAGE);
    const h1s = page.locator('h1');
    await expect(h1s).toHaveCount(1);
  });

  test('no self-referencing links', async ({ page }) => {
    await page.goto(PAGE);
    const selfLink = page.locator('article a[href="/blog/two-letter-words-complete-strategy/"]');
    await expect(selfLink).toHaveCount(0);
  });

  test('no empty href links in content', async ({ page }) => {
    await page.goto(PAGE);
    const allLinks = page.locator('article a');
    const count = await allLinks.count();
    for (let i = 0; i < count; i++) {
      const href = await allLinks.nth(i).getAttribute('href');
      expect(href?.trim().length).toBeGreaterThan(0);
    }
  });

  test('all internal links have trailing slash', async ({ page }) => {
    await page.goto(PAGE);
    const internalLinks = page.locator('article a[href^="/"]');
    const count = await internalLinks.count();
    for (let i = 0; i < count; i++) {
      const href = await internalLinks.nth(i).getAttribute('href');
      if (href && !href.includes('#') && !href.match(/\.\w+$/)) {
        expect(href).toMatch(/\/$/);
      }
    }
  });
});
