import { test, expect } from '@playwright/test';

/**
 * Useful Links — Structured Data (JSON-LD) Tests
 * Verifies the CollectionPage and FAQPage schemas added to
 * /blog/useful-links/ for rich snippet eligibility.
 */

test.describe('Useful Links — Structured Data — Positive', () => {

  test('page has CollectionPage JSON-LD schema', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const collection = scripts.find(s => s.includes('CollectionPage'));
    expect(collection).toBeTruthy();
  });

  test('CollectionPage schema has correct @type', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const collection = scripts.find(s => s.includes('CollectionPage'));
    const parsed = JSON.parse(collection!);
    expect(parsed['@type']).toBe('CollectionPage');
  });

  test('CollectionPage schema has correct URL', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const collection = scripts.find(s => s.includes('CollectionPage'));
    const parsed = JSON.parse(collection!);
    expect(parsed.url).toContain('/blog/useful-links/');
  });

  test('CollectionPage schema has isPartOf with WebSite', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const collection = scripts.find(s => s.includes('CollectionPage'));
    const parsed = JSON.parse(collection!);
    expect(parsed.isPartOf).toBeTruthy();
    expect(parsed.isPartOf['@type']).toBe('WebSite');
    expect(parsed.isPartOf.name).toContain('ScrabbleWordsFinder');
  });

  test('CollectionPage schema has ItemList mainEntity with 5 items', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const collection = scripts.find(s => s.includes('CollectionPage'));
    const parsed = JSON.parse(collection!);
    expect(parsed.mainEntity).toBeTruthy();
    expect(parsed.mainEntity['@type']).toBe('ItemList');
    expect(parsed.mainEntity.itemListElement).toHaveLength(5);
  });

  test('CollectionPage ItemList items have sequential positions', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const collection = scripts.find(s => s.includes('CollectionPage'));
    const parsed = JSON.parse(collection!);
    const items = parsed.mainEntity.itemListElement;
    for (let i = 0; i < items.length; i++) {
      expect(items[i].position).toBe(i + 1);
      expect(items[i]['@type']).toBe('ListItem');
      expect(items[i].name).toBeTruthy();
      expect(items[i].url).toContain('scrabblewordsfinder.com/blog/');
    }
  });

  test('page has FAQPage JSON-LD schema', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faq = scripts.find(s => s.includes('FAQPage'));
    expect(faq).toBeTruthy();
  });

  test('FAQPage schema has exactly 3 questions', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faq = scripts.find(s => s.includes('FAQPage'));
    const parsed = JSON.parse(faq!);
    expect(parsed['@type']).toBe('FAQPage');
    expect(parsed.mainEntity).toHaveLength(3);
  });

  test('FAQPage questions have proper Question/Answer types', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faq = scripts.find(s => s.includes('FAQPage'));
    const parsed = JSON.parse(faq!);
    for (const item of parsed.mainEntity) {
      expect(item['@type']).toBe('Question');
      expect(item.name).toBeTruthy();
      expect(item.acceptedAnswer['@type']).toBe('Answer');
      expect(item.acceptedAnswer.text).toBeTruthy();
      expect(item.acceptedAnswer.text.length).toBeGreaterThan(20);
    }
  });
});

test.describe('Useful Links — Structured Data — Negative', () => {

  test('no duplicate CollectionPage schemas on the page', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const collectionSchemas = scripts.filter(s => s.includes('CollectionPage'));
    expect(collectionSchemas).toHaveLength(1);
  });

  test('no duplicate FAQPage schemas on the page', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faqSchemas = scripts.filter(s => s.includes('FAQPage'));
    expect(faqSchemas).toHaveLength(1);
  });

  test('CollectionPage schema is valid JSON (no parse error)', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const collection = scripts.find(s => s.includes('CollectionPage'));
    expect(() => JSON.parse(collection!)).not.toThrow();
  });

  test('FAQPage schema is valid JSON (no parse error)', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const faq = scripts.find(s => s.includes('FAQPage'));
    expect(() => JSON.parse(faq!)).not.toThrow();
  });

  test('CollectionPage does not have empty name or description', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const scripts = await page.locator('script[type="application/ld+json"]').allTextContents();
    const collection = scripts.find(s => s.includes('CollectionPage'));
    const parsed = JSON.parse(collection!);
    expect(parsed.name.length).toBeGreaterThan(0);
    expect(parsed.description.length).toBeGreaterThan(0);
  });

  test('FAQPage answers are not empty strings', async ({ page }) => {
    await page.goto('/blog/useful-links/');
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
    await page.goto('/blog/useful-links/');
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });
});
