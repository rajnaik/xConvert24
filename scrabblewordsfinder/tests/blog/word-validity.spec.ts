import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';

/**
 * Tests for the Word Validity landing page (/blog/word-validity/).
 * This page is a category hub with a grid of word cards linking to
 * individual "Is X a Scrabble Word?" blog posts.
 *
 * Last updated: June 30, 2026 — expanded grid to 86+ word cards
 * including ETH, QAT, and "Is Using a Word Finder Cheating?" article.
 */

test.describe('Word Validity Landing Page — Positive', () => {

  test('page loads with 200 status', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/blog/word-validity/`);
    expect(response?.status()).toBe(200);
  });

  test('h1 heading is visible with correct text', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/word-validity/`);
    const h1 = page.getByRole('heading', { name: 'Word Validity', level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('Is It a Scrabble Word?');
  });

  test('intro paragraph describes the guides', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/word-validity/`);
    const intro = page.locator('p.text-lg').first();
    await expect(intro).toBeVisible();
    await expect(intro).toContainText('Scrabble word');
  });

  test('word card grid is visible with 4/6/8 responsive columns', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/word-validity/`);
    const grid = page.locator('.grid.grid-cols-4');
    await expect(grid).toBeVisible();
    const classes = await grid.getAttribute('class');
    expect(classes).toContain('sm:grid-cols-6');
    expect(classes).toContain('md:grid-cols-8');
  });

  test('grid contains at least 80 word cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/word-validity/`);
    const grid = page.locator('.grid.grid-cols-4');
    const cards = grid.locator('a');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(80);
  });

  test('newly added word AA card is present', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/word-validity/`);
    const aaLink = page.locator('a[href="/blog/is-aa-a-scrabble-word/"]');
    await expect(aaLink).toBeVisible();
    await expect(aaLink).toContainText('AA');
  });

  test('newly added word QI card is present', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/word-validity/`);
    const qiLink = page.locator('a[href="/blog/is-qi-a-scrabble-word/"]');
    await expect(qiLink).toBeVisible();
    await expect(qiLink).toContainText('QI');
  });

  test('three-letter word ETH card is present', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/word-validity/`);
    const ethLink = page.locator('a[href="/blog/is-eth-a-scrabble-word/"]');
    await expect(ethLink).toBeVisible();
    await expect(ethLink).toContainText('ETH');
  });

  test('three-letter word QAT card is present', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/word-validity/`);
    const qatLink = page.locator('a[href="/blog/is-qat-a-scrabble-word/"]');
    await expect(qatLink).toBeVisible();
    await expect(qatLink).toContainText('QAT');
  });

  test('"Is Using a Word Finder Cheating?" article card is present', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/word-validity/`);
    const cheatingLink = page.locator('a[href="/blog/is-using-a-scrabble-word-finder-cheating/"]');
    await expect(cheatingLink).toBeVisible();
    await expect(cheatingLink).toContainText('Is Using a Word Finder Cheating?');
  });

  test('word cards have violet hover styling', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/word-validity/`);
    const firstCard = page.locator('.grid.grid-cols-4 a').first();
    const classes = await firstCard.getAttribute('class');
    expect(classes).toContain('hover:border-violet-700');
    expect(classes).toContain('hover:bg-violet-900/10');
  });

  test('word card text uses group-hover violet color', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/word-validity/`);
    const firstSpan = page.locator('.grid.grid-cols-4 a span').first();
    const classes = await firstSpan.getAttribute('class');
    expect(classes).toContain('group-hover:text-violet-400');
  });

  test('More Categories section is present with links', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/word-validity/`);
    const moreCategories = page.locator('h3:has-text("More Categories")');
    await expect(moreCategories).toBeVisible();
    await expect(page.locator('a[href="/blog/two-letter-words/"]')).toBeVisible();
    await expect(page.locator('a[href="/blog/beginner-guides/"]')).toBeVisible();
  });

  test('CTA box links to the word finder', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/word-validity/`);
    const ctaLink = page.locator('a:has-text("Open Word Finder")');
    await expect(ctaLink).toBeVisible();
    const href = await ctaLink.getAttribute('href');
    expect(href).toBe('/');
  });

  test('FAQPage structured data is present', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/word-validity/`);
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    expect(count).toBeGreaterThan(0);
    const allText = await schemas.evaluateAll(
      (els) => els.map(el => el.textContent || '')
    );
    const hasFAQ = allText.some(t => t.includes('FAQPage'));
    expect(hasFAQ, 'No FAQPage schema found in any JSON-LD script').toBe(true);
  });

  test('breadcrumb navigation is present with Blog link', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/word-validity/`);
    const breadcrumb = page.locator('nav.text-sm');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.locator('a[href="/blog/"]')).toBeVisible();
    await expect(breadcrumb).toContainText('Word Validity');
  });
});

test.describe('Word Validity Landing Page — Negative', () => {

  test('no duplicate word cards in the grid', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/word-validity/`);
    const grid = page.locator('.grid.grid-cols-4');
    const hrefs = await grid.locator('a').evaluateAll(
      (els) => els.map(el => el.getAttribute('href'))
    );
    const unique = new Set(hrefs);
    expect(unique.size, `Found ${hrefs.length - unique.size} duplicate cards`).toBe(hrefs.length);
  });

  test('all word card hrefs have trailing slash', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/word-validity/`);
    const grid = page.locator('.grid.grid-cols-4');
    const hrefs = await grid.locator('a').evaluateAll(
      (els) => els.map(el => el.getAttribute('href'))
    );
    const missingSlash = hrefs.filter(h => h && !h.endsWith('/'));
    expect(missingSlash, `Missing trailing slash: ${missingSlash.join(', ')}`).toHaveLength(0);
  });

  test('no word cards have empty or null href', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/word-validity/`);
    const grid = page.locator('.grid.grid-cols-4');
    const hrefs = await grid.locator('a').evaluateAll(
      (els) => els.map(el => el.getAttribute('href'))
    );
    const empty = hrefs.filter(h => !h || h.trim() === '');
    expect(empty).toHaveLength(0);
  });

  test('no word cards have empty label text', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/word-validity/`);
    const grid = page.locator('.grid.grid-cols-4');
    const texts = await grid.locator('a span').evaluateAll(
      (els) => els.map(el => (el.textContent || '').trim())
    );
    const empty = texts.filter(t => t === '');
    expect(empty, 'Found cards with empty label text').toHaveLength(0);
  });

  test('page does not have console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE_URL}/blog/word-validity/`);
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('only one h1 heading exists in the main content', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/word-validity/`);
    const h1Count = await page.locator('.max-w-3xl h1').count();
    expect(h1Count).toBe(1);
  });
});
