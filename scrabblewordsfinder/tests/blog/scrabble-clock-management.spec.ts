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

test.describe('Scrabble Clock Management — FVT Content', () => {

  test('FAQPage schema present with 4 questions', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faq = scripts.find(s => s.includes('"FAQPage"'));
    expect(faq).toBeTruthy();
    const parsed = JSON.parse(faq!);
    expect(parsed['@type']).toBe('FAQPage');
    expect(parsed.mainEntity).toHaveLength(4);
  });

  test('FAQPage questions have accepted answers', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faq = scripts.find(s => s.includes('"FAQPage"'));
    const parsed = JSON.parse(faq!);
    for (const q of parsed.mainEntity) {
      expect(q['@type']).toBe('Question');
      expect(q.name.length).toBeGreaterThan(10);
      expect(q.acceptedAnswer['@type']).toBe('Answer');
      expect(q.acceptedAnswer.text.length).toBeGreaterThan(20);
    }
  });

  test('h1 heading is present with correct text', async ({ page }) => {
    await page.goto(PAGE);
    const h1 = page.locator('article h1.text-3xl.mb-4');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('Scrabble Clock Management');
  });

  test('article has multiple h2 sections', async ({ page }) => {
    await page.goto(PAGE);
    const h2s = await page.locator('article h2').count();
    expect(h2s).toBeGreaterThanOrEqual(5);
  });

  test('hero card with clock mastery label is present', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('.border-amber-500\\/50');
    await expect(heroCard).toBeVisible();
    await expect(heroCard).toContainText('EVERY SECOND COUNTS');
  });

  test('stat strip shows key time values', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-amber-500\\/30').first();
    await expect(statStrip).toBeVisible();
    await expect(statStrip).toContainText('25 min');
    await expect(statStrip).toContainText('-10 pts');
  });

  test('breadcrumb links to blog index', async ({ page }) => {
    await page.goto(PAGE);
    const blogLink = page.locator('nav a[href="/blog/"]');
    await expect(blogLink).toBeVisible();
  });

  test('CTA box links to word finder', async ({ page }) => {
    await page.goto(PAGE);
    const cta = page.locator('a:has-text("Open Word Finder →")');
    await expect(cta).toBeVisible();
    expect(await cta.getAttribute('href')).toBe('/');
  });

  test('related articles aside has links', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('article aside');
    await expect(aside).toBeVisible();
    const links = await aside.locator('a').count();
    expect(links).toBeGreaterThanOrEqual(2);
  });

  test('back to blog link present', async ({ page }) => {
    await page.goto(PAGE);
    const backLink = page.locator('a:has-text("← Back to all articles")');
    await expect(backLink).toBeVisible();
    expect(await backLink.getAttribute('href')).toBe('/blog/');
  });

  test('cross-link blocks with Dig Deeper label present', async ({ page }) => {
    await page.goto(PAGE);
    const crossLinks = page.locator('text=Dig Deeper');
    const count = await crossLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('article datetime is set correctly', async ({ page }) => {
    await page.goto(PAGE);
    const time = page.locator('time[datetime="2026-06-15"]');
    await expect(time).toBeVisible();
    await expect(time).toContainText('June 15, 2026');
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

  test('FAQPage schema is valid JSON', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faq = scripts.find(s => s.includes('"FAQPage"'));
    expect(faq).toBeTruthy();
    expect(() => JSON.parse(faq!)).not.toThrow();
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

  test('article has exactly one visible h1 heading', async ({ page }) => {
    await page.goto(PAGE);
    const h1Count = await page.locator('article h1.text-3xl.mb-4').count();
    expect(h1Count).toBe(1);
  });

  test('all internal links have trailing slashes', async ({ page }) => {
    await page.goto(PAGE);
    const links = await page.locator('article a[href^="/blog/"]').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      expect(href).toMatch(/\/$/);
    }
  });
});
