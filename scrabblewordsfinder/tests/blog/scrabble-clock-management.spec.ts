import { test, expect } from '@playwright/test';

const PAGE = '/blog/scrabble-clock-management/';

test.describe('Scrabble Clock Management — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('page title contains updated headline', async ({ page }) => {
    await page.goto(PAGE);
    const title = await page.title();
    expect(title).toContain('Scrabble Clock Management');
    expect(title).toContain('25-Minute Game');
  });

  test('meta description mentions tournament clock', async ({ page }) => {
    await page.goto(PAGE);
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).toBeTruthy();
    expect(desc!).toContain('tournament clock');
  });

  test('meta keywords include relevant terms', async ({ page }) => {
    await page.goto(PAGE);
    const kw = await page.locator('meta[name="keywords"]').getAttribute('content');
    expect(kw).toBeTruthy();
    expect(kw!).toContain('scrabble clock management');
    expect(kw!).toContain('tournament scrabble time');
  });

  test('page has Article JSON-LD schema', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const article = scripts.find(s => s.includes('"Article"'));
    expect(article).toBeTruthy();
  });

  test('Article schema has correct headline', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const article = scripts.find(s => s.includes('"Article"'));
    const parsed = JSON.parse(article!);
    expect(parsed['@type']).toBe('Article');
    expect(parsed.headline).toContain('Scrabble Clock Management');
    expect(parsed.headline).toContain('25-Minute Game');
  });

  test('Article schema has author and publisher', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const article = scripts.find(s => s.includes('"Article"'));
    const parsed = JSON.parse(article!);
    expect(parsed.author['@type']).toBe('Organization');
    expect(parsed.author.name).toContain('ScrabbleWordsFinder');
    expect(parsed.publisher['@type']).toBe('Organization');
    expect(parsed.publisher.logo['@type']).toBe('ImageObject');
  });

  test('Article schema mainEntityOfPage has trailing slash URL', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const article = scripts.find(s => s.includes('"Article"'));
    const parsed = JSON.parse(article!);
    expect(parsed.mainEntityOfPage?.['@id']).toContain('/blog/scrabble-clock-management/');
    expect(parsed.mainEntityOfPage['@type']).toBe('WebPage');
  });

  test('page has canonical link', async ({ page }) => {
    await page.goto(PAGE);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain('/blog/scrabble-clock-management/');
    expect(canonical).toContain('scrabblewordsfinder.com');
  });
});

test.describe('Scrabble Clock Management — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    const critical = errors.filter(e => !e.includes('adsbygoogle'));
    expect(critical).toHaveLength(0);
  });

  test('Article schema is valid JSON', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const article = scripts.find(s => s.includes('"Article"'));
    expect(article).toBeTruthy();
    expect(() => JSON.parse(article!)).not.toThrow();
  });

  test('no more than two Article schemas on the page', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const articleSchemas = scripts.filter(s => s.includes('"Article"'));
    expect(articleSchemas.length).toBeLessThanOrEqual(2);
    expect(articleSchemas.length).toBeGreaterThanOrEqual(1);
  });

  test('page does not link to itself in navigation', async ({ page }) => {
    await page.goto(PAGE);
    const navLinks = page.locator('nav a[href="/blog/scrabble-clock-management/"]');
    await expect(navLinks).toHaveCount(0);
  });

  test('meta description is not empty and has adequate length', async ({ page }) => {
    await page.goto(PAGE);
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).toBeTruthy();
    expect(desc!.length).toBeGreaterThan(100);
    expect(desc!.length).toBeLessThanOrEqual(170);
  });
});
