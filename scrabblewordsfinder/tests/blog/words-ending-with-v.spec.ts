import { test, expect } from '@playwright/test';

const PAGE = '/blog/words-ending-with-v/';

test.describe('Words Ending With V — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('page has Article JSON-LD schema', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const article = scripts.find(s => s.includes('"Article"') || s.includes('"BlogPosting"'));
    expect(article).toBeTruthy();
  });

  test('page has FAQPage JSON-LD schema', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faq = scripts.find(s => s.includes('FAQPage'));
    expect(faq).toBeTruthy();
  });

  test('FAQPage schema has exactly 3 questions', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faq = scripts.find(s => s.includes('FAQPage'));
    const parsed = JSON.parse(faq!);
    expect(parsed.mainEntity).toHaveLength(3);
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

  test('first question mentions words ending in V', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faq = scripts.find(s => s.includes('FAQPage'));
    const parsed = JSON.parse(faq!);
    expect(parsed.mainEntity[0].name.toLowerCase()).toContain('end');
    expect(parsed.mainEntity[0].name).toContain('V');
  });

  test('FAQPage schema has @context set to schema.org', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faq = scripts.find(s => s.includes('FAQPage'));
    const parsed = JSON.parse(faq!);
    expect(parsed['@context']).toBe('https://schema.org');
  });
});

test.describe('Words Ending With V — Negative', () => {

  test('no duplicate FAQPage schemas on the page', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faqSchemas = scripts.filter(s => s.includes('FAQPage'));
    expect(faqSchemas).toHaveLength(1);
  });

  test('FAQPage schema is valid JSON (no parse error)', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faq = scripts.find(s => s.includes('FAQPage'));
    expect(faq).toBeTruthy();
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
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('FAQPage questions do not have duplicate names', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faq = scripts.find(s => s.includes('FAQPage'));
    const parsed = JSON.parse(faq!);
    const names = parsed.mainEntity.map((q: any) => q.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });
});
