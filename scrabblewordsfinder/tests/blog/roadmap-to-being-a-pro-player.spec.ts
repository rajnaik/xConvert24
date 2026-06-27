import { test, expect } from '@playwright/test';

const PAGE = '/blog/roadmap-to-being-a-pro-player/';

test.describe('Roadmap to Being a Pro Player — Structured Data — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
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
    expect(parsed.headline).toContain('Roadmap to Being a Pro Scrabble Player');
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

  test('Article schema has datePublished and mainEntityOfPage', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const article = scripts.find(s => s.includes('"Article"'));
    const parsed = JSON.parse(article!);
    expect(parsed.mainEntityOfPage?.['@id']).toContain('/blog/roadmap-to-being-a-pro-player/');
    expect(parsed.datePublished).toBeTruthy();
    expect(parsed.mainEntityOfPage['@type']).toBe('WebPage');
  });

  test('page has FAQPage JSON-LD schema', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faq = scripts.find(s => s.includes('FAQPage'));
    expect(faq).toBeTruthy();
  });

  test('FAQPage schema has exactly 4 questions', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faq = scripts.find(s => s.includes('FAQPage'));
    const parsed = JSON.parse(faq!);
    expect(parsed['@type']).toBe('FAQPage');
    expect(parsed.mainEntity).toHaveLength(4);
  });

  test('FAQPage questions have proper Question/Answer types', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faq = scripts.find(s => s.includes('FAQPage'));
    const parsed = JSON.parse(faq!);
    for (const item of parsed.mainEntity) {
      expect(item['@type']).toBe('Question');
      expect(item.name).toBeTruthy();
      expect(item.acceptedAnswer['@type']).toBe('Answer');
      expect(item.acceptedAnswer.text.length).toBeGreaterThan(20);
    }
  });

  test('FAQ includes question about memorising word lists', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faq = scripts.find(s => s.includes('FAQPage'));
    const parsed = JSON.parse(faq!);
    const wordListQ = parsed.mainEntity.find((q: any) => q.name.includes('memorise Scrabble word lists'));
    expect(wordListQ).toBeTruthy();
    expect(wordListQ.acceptedAnswer.text).toContain('two-letter words');
  });

  test('FAQ includes question about cognitive function', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faq = scripts.find(s => s.includes('FAQPage'));
    const parsed = JSON.parse(faq!);
    const cogQ = parsed.mainEntity.find((q: any) => q.name.includes('cognitive function'));
    expect(cogQ).toBeTruthy();
    expect(cogQ.acceptedAnswer.text).toContain('working memory');
  });
});

test.describe('Roadmap to Being a Pro Player — Layout — Positive', () => {

  test('page has canonical link from Layout', async ({ page }) => {
    await page.goto(PAGE);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain('/blog/roadmap-to-being-a-pro-player/');
    expect(canonical).toContain('scrabblewordsfinder.com');
  });

  test('page has meta description from Layout', async ({ page }) => {
    await page.goto(PAGE);
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).toBeTruthy();
    expect(desc!.length).toBeGreaterThan(50);
  });

  test('page has meta keywords from Layout', async ({ page }) => {
    await page.goto(PAGE);
    const kw = await page.locator('meta[name="keywords"]').getAttribute('content');
    expect(kw).toBeTruthy();
    expect(kw!.length).toBeGreaterThan(10);
  });
});

test.describe('Roadmap to Being a Pro Player — Structured Data — Negative', () => {

  test('no more than two Article schemas on the page', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const articleSchemas = scripts.filter(s => s.includes('"Article"'));
    // Layout injects one Article schema, page has its own inline — 2 is expected
    expect(articleSchemas.length).toBeLessThanOrEqual(2);
    expect(articleSchemas.length).toBeGreaterThanOrEqual(1);
  });

  test('no duplicate FAQPage schemas on the page', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faqSchemas = scripts.filter(s => s.includes('FAQPage'));
    expect(faqSchemas).toHaveLength(1);
  });

  test('Article schema is valid JSON (no parse error)', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const article = scripts.find(s => s.includes('"Article"'));
    expect(() => JSON.parse(article!)).not.toThrow();
  });

  test('FAQPage schema is valid JSON (no parse error)', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faq = scripts.find(s => s.includes('FAQPage'));
    expect(() => JSON.parse(faq!)).not.toThrow();
  });

  test('FAQPage answers are not empty strings', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faq = scripts.find(s => s.includes('FAQPage'));
    const parsed = JSON.parse(faq!);
    for (const item of parsed.mainEntity) {
      expect(item.acceptedAnswer.text.trim().length).toBeGreaterThan(0);
      expect(item.name.trim().length).toBeGreaterThan(0);
    }
  });

  test('no page errors when structured data scripts render', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForTimeout(500);
    const critical = errors.filter(e => !e.includes('adsbygoogle'));
    expect(critical).toHaveLength(0);
  });
});
