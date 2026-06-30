import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('WOTD FAQ Schema — Positive', () => {

  test('FAQPage JSON-LD script is present on page', async ({ page }) => {
    await page.goto(`${BASE}/blog/wotd/`);
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    let found = false;
    for (let i = 0; i < count; i++) {
      const content = await scripts.nth(i).textContent();
      if (content && content.includes('"FAQPage"')) {
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  test('FAQPage schema contains exactly 3 questions', async ({ page }) => {
    await page.goto(`${BASE}/blog/wotd/`);
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
    expect(faqData.mainEntity).toHaveLength(3);
  });

  test('FAQPage schema has valid Question/Answer structure', async ({ page }) => {
    await page.goto(`${BASE}/blog/wotd/`);
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
    expect(faqData['@context']).toBe('https://schema.org');
    expect(faqData['@type']).toBe('FAQPage');
    for (const entity of faqData.mainEntity) {
      expect(entity['@type']).toBe('Question');
      expect(entity.name).toBeTruthy();
      expect(entity.acceptedAnswer['@type']).toBe('Answer');
      expect(entity.acceptedAnswer.text).toBeTruthy();
    }
  });

});

test.describe('WOTD FAQ Schema — Negative', () => {

  test('no duplicate FAQPage schemas on the page', async ({ page }) => {
    await page.goto(`${BASE}/blog/wotd/`);
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

  test('FAQ answers are not empty strings', async ({ page }) => {
    await page.goto(`${BASE}/blog/wotd/`);
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
      expect(entity.acceptedAnswer.text.length).toBeGreaterThan(10);
      expect(entity.name.length).toBeGreaterThan(5);
    }
  });

});
