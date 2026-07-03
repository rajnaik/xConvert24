import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Bingo Racks to Memorise — Positive', () => {

  test('page loads successfully with correct title', async ({ page }) => {
    await page.goto(`${BASE}/blog/bingo-racks-to-memorise/`);
    await expect(page).toHaveTitle(/Bingo Racks to Memorise/);
  });

  test('Article JSON-LD schema is present with correct headline', async ({ page }) => {
    await page.goto(`${BASE}/blog/bingo-racks-to-memorise/`);
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    let articleData: any = null;
    for (let i = 0; i < count; i++) {
      const content = await scripts.nth(i).textContent();
      if (content && content.includes('"Article"')) {
        articleData = JSON.parse(content);
        break;
      }
    }
    expect(articleData).not.toBeNull();
    expect(articleData['@type']).toBe('Article');
    expect(articleData.headline).toContain('Bingo Racks to Memorise');
  });

  test('FAQPage JSON-LD schema is present with 3 questions', async ({ page }) => {
    await page.goto(`${BASE}/blog/bingo-racks-to-memorise/`);
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    let faqData: any = null;
    for (let i = 0; i < count; i++) {
      const content = await scripts.nth(i).textContent();
      if (content && content.includes('"FAQPage"')) {
        faqData = JSON.parse(content);
        break;
      }
    }
    expect(faqData).not.toBeNull();
    expect(faqData['@type']).toBe('FAQPage');
    expect(faqData.mainEntity).toHaveLength(3);
  });

  test('FAQPage questions reference SATIRE and bingo stems', async ({ page }) => {
    await page.goto(`${BASE}/blog/bingo-racks-to-memorise/`);
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    let faqData: any = null;
    for (let i = 0; i < count; i++) {
      const content = await scripts.nth(i).textContent();
      if (content && content.includes('"FAQPage"')) {
        faqData = JSON.parse(content);
        break;
      }
    }
    expect(faqData).not.toBeNull();
    const allText = JSON.stringify(faqData.mainEntity);
    expect(allText).toContain('SATIRE');
    expect(allText).toContain('bingo');
  });

  test('Article schema has publisher with logo', async ({ page }) => {
    await page.goto(`${BASE}/blog/bingo-racks-to-memorise/`);
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    let articleData: any = null;
    for (let i = 0; i < count; i++) {
      const content = await scripts.nth(i).textContent();
      if (content && content.includes('"Article"')) {
        articleData = JSON.parse(content);
        break;
      }
    }
    expect(articleData).not.toBeNull();
    expect(articleData.publisher.logo).toBeDefined();
    expect(articleData.publisher.logo['@type']).toBe('ImageObject');
    expect(articleData.publisher.logo.url).toContain('.png');
  });

});

test.describe('Bingo Racks to Memorise — Negative', () => {

  test('no duplicate FAQPage schemas on the page', async ({ page }) => {
    await page.goto(`${BASE}/blog/bingo-racks-to-memorise/`);
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    let faqCount = 0;
    for (let i = 0; i < count; i++) {
      const content = await scripts.nth(i).textContent();
      if (content && content.includes('"FAQPage"')) {
        faqCount++;
      }
    }
    expect(faqCount).toBe(1);
  });

  test('FAQ answers are not empty and have meaningful length', async ({ page }) => {
    await page.goto(`${BASE}/blog/bingo-racks-to-memorise/`);
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    let faqData: any = null;
    for (let i = 0; i < count; i++) {
      const content = await scripts.nth(i).textContent();
      if (content && content.includes('"FAQPage"')) {
        faqData = JSON.parse(content);
        break;
      }
    }
    expect(faqData).not.toBeNull();
    for (const entity of faqData.mainEntity) {
      expect(entity['@type']).toBe('Question');
      expect(entity.name.length).toBeGreaterThan(10);
      expect(entity.acceptedAnswer['@type']).toBe('Answer');
      expect(entity.acceptedAnswer.text.length).toBeGreaterThan(20);
    }
  });

  test('Article mainEntityOfPage URL has trailing slash', async ({ page }) => {
    await page.goto(`${BASE}/blog/bingo-racks-to-memorise/`);
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    let articleData: any = null;
    for (let i = 0; i < count; i++) {
      const content = await scripts.nth(i).textContent();
      if (content && content.includes('"Article"')) {
        articleData = JSON.parse(content);
        break;
      }
    }
    expect(articleData).not.toBeNull();
    expect(articleData.mainEntityOfPage['@id']).toMatch(/\/$/);
  });

  test('page does not expose sensitive information in visible text', async ({ page }) => {
    await page.goto(`${BASE}/blog/bingo-racks-to-memorise/`);
    const visibleText = await page.locator('body').innerText();
    expect(visibleText).not.toContain('rajeev');
    expect(visibleText).not.toContain('@gmail.com');
    expect(visibleText).not.toContain('API_KEY');
    expect(visibleText).not.toContain('sk-');
  });

});
