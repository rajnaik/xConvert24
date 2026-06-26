import { test, expect } from '@playwright/test';

const PAGE = '/blog/foreign-words-valid-in-scrabble/';

test.describe('Foreign Words Valid in Scrabble — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('page title contains updated headline', async ({ page }) => {
    await page.goto(PAGE);
    const title = await page.title();
    expect(title).toContain('Foreign Words Valid in Scrabble');
    expect(title).toContain('Borrowed Gems That Score Big');
  });

  test('meta description mentions foreign loanwords', async ({ page }) => {
    await page.goto(PAGE);
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).toContain('foreign loanwords legal in English Scrabble');
  });

  test('meta keywords include relevant terms', async ({ page }) => {
    await page.goto(PAGE);
    const keywords = await page.locator('meta[name="keywords"]').getAttribute('content');
    expect(keywords).toContain('foreign words scrabble');
    expect(keywords).toContain('loanwords scrabble');
    expect(keywords).toContain('QI scrabble');
  });

  test('Article JSON-LD schema is present with correct headline', async ({ page }) => {
    await page.goto(PAGE);
    const content = await page.content();
    expect(content).toContain('"@type":"Article"');
    expect(content).toContain('Borrowed Gems That Score Big');
  });

  test('Article schema has datePublished and dateModified', async ({ page }) => {
    await page.goto(PAGE);
    const content = await page.content();
    expect(content).toContain('"datePublished":"2026-06-15"');
    expect(content).toContain('"dateModified":"2026-06-25"');
  });

  test('Article schema references correct canonical URL', async ({ page }) => {
    await page.goto(PAGE);
    const content = await page.content();
    expect(content).toContain('scrabblewordsfinder.com/blog/foreign-words-valid-in-scrabble');
  });

  test('FAQPage schema has 4 questions', async ({ page }) => {
    await page.goto(PAGE);
    const content = await page.content();
    expect(content).toContain('"@type":"FAQPage"');
    expect(content).toContain('Are foreign words allowed in Scrabble?');
    expect(content).toContain('What high-scoring foreign-origin words work in Scrabble?');
    expect(content).toContain('How do foreign words enter the Scrabble dictionary?');
    expect(content).toContain('Is QI a foreign word?');
  });

  test('loanwords table displays key words with scores', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
    await expect(table.locator('text=QI')).toBeVisible();
    await expect(table.locator('text=PIZZA')).toBeVisible();
    await expect(table.locator('text=FJORD')).toBeVisible();
  });

  test('language cluster cards are displayed', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('text=Japanese').first()).toBeVisible();
    await expect(page.locator('text=Hebrew / Yiddish').first()).toBeVisible();
    await expect(page.locator('text=Hindi / Sanskrit / Urdu').first()).toBeVisible();
    await expect(page.locator('text=Arabic').first()).toBeVisible();
  });

  test('breadcrumb links to blog and dictionaries category', async ({ page }) => {
    await page.goto(PAGE);
    const blogLink = page.locator('nav a[href="/blog/"]');
    await expect(blogLink).toBeVisible();
    const categoryLink = page.locator('nav a[href="/blog/dictionaries/"]');
    await expect(categoryLink).toBeVisible();
  });

  test('article has multiple h2 content sections', async ({ page }) => {
    await page.goto(PAGE);
    const h2s = page.locator('article h2');
    const count = await h2s.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('CTA box links to word finder homepage', async ({ page }) => {
    await page.goto(PAGE);
    const cta = page.locator('a:has-text("Open Word Finder")');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/');
  });
});

test.describe('Foreign Words Valid in Scrabble — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate h1 elements within article content', async ({ page }) => {
    await page.goto(PAGE);
    const h1s = page.locator('article h1');
    const count = await h1s.count();
    expect(count).toBeLessThanOrEqual(1);
  });

  test('page does not link to itself in navigation', async ({ page }) => {
    await page.goto(PAGE);
    const selfLinks = page.locator(`a[href="${PAGE}"], a[href="/blog/foreign-words-valid-in-scrabble"]`);
    const count = await selfLinks.count();
    expect(count).toBe(0);
  });

  test('old thin description is not present', async ({ page }) => {
    await page.goto(PAGE);
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).not.toContain('TOFU, EMOJI, MANGA and more');
  });

  test('old generic keywords are not present', async ({ page }) => {
    await page.goto(PAGE);
    const keywords = await page.locator('meta[name="keywords"]').getAttribute('content');
    expect(keywords).not.toBe('scrabble, foreign, words, valid, in, scrabble');
  });
});
