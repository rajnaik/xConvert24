import { test, expect } from '@playwright/test';

/**
 * Tests for the FAQPage JSON-LD structured data on the blog index page.
 * Added: June 30, 2026 — FAQPage schema with 3 questions covering
 * blog topics, free word finder, and article count.
 */

test.describe('Blog Index — FAQ Schema — Positive', () => {

  test('blog index page contains FAQPage JSON-LD schema', async ({ page }) => {
    await page.goto('/blog/');
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    let foundFAQ = false;
    for (let i = 0; i < count; i++) {
      const text = await schemas.nth(i).textContent();
      if (text?.includes('FAQPage')) {
        foundFAQ = true;
      }
    }
    expect(foundFAQ, 'FAQPage schema should be present on blog index').toBe(true);
  });

  test('FAQPage schema has exactly 3 questions', async ({ page }) => {
    await page.goto('/blog/');
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    let faqData: any = null;
    for (let i = 0; i < count; i++) {
      const text = await schemas.nth(i).textContent();
      if (text?.includes('FAQPage')) {
        faqData = JSON.parse(text!);
        break;
      }
    }
    expect(faqData).not.toBeNull();
    expect(faqData['@type']).toBe('FAQPage');
    expect(faqData.mainEntity).toHaveLength(3);
  });

  test('FAQPage schema has correct @context', async ({ page }) => {
    await page.goto('/blog/');
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    let faqData: any = null;
    for (let i = 0; i < count; i++) {
      const text = await schemas.nth(i).textContent();
      if (text?.includes('FAQPage')) {
        faqData = JSON.parse(text!);
        break;
      }
    }
    expect(faqData['@context']).toBe('https://schema.org');
  });

  test('FAQ questions cover expected topics', async ({ page }) => {
    await page.goto('/blog/');
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    let questions: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await schemas.nth(i).textContent();
      if (text?.includes('FAQPage')) {
        const data = JSON.parse(text!);
        questions = data.mainEntity.map((q: any) => q.name);
        break;
      }
    }
    expect(questions).toContain('What topics does the Scrabble blog cover?');
    expect(questions).toContain('Is the Scrabble word finder free to use?');
    expect(questions).toContain('How many articles are on the Scrabble blog?');
  });

  test('each FAQ entry has Question type and acceptedAnswer with Answer type', async ({ page }) => {
    await page.goto('/blog/');
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    let faqData: any = null;
    for (let i = 0; i < count; i++) {
      const text = await schemas.nth(i).textContent();
      if (text?.includes('FAQPage')) {
        faqData = JSON.parse(text!);
        break;
      }
    }
    for (const entity of faqData.mainEntity) {
      expect(entity['@type']).toBe('Question');
      expect(entity.acceptedAnswer['@type']).toBe('Answer');
      expect(entity.acceptedAnswer.text.length).toBeGreaterThan(10);
    }
  });

  test('FAQ answer about free word finder mentions no sign-up', async ({ page }) => {
    await page.goto('/blog/');
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    let faqData: any = null;
    for (let i = 0; i < count; i++) {
      const text = await schemas.nth(i).textContent();
      if (text?.includes('FAQPage')) {
        faqData = JSON.parse(text!);
        break;
      }
    }
    const freeQuestion = faqData.mainEntity.find((q: any) => q.name.includes('free'));
    expect(freeQuestion).toBeDefined();
    expect(freeQuestion.acceptedAnswer.text).toContain('no sign-up');
  });
});

test.describe('Blog Index — FAQ Schema — Negative', () => {

  test('no duplicate FAQPage schemas on blog index', async ({ page }) => {
    await page.goto('/blog/');
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    let faqCount = 0;
    for (let i = 0; i < count; i++) {
      const text = await schemas.nth(i).textContent();
      if (text?.includes('FAQPage')) {
        faqCount++;
      }
    }
    expect(faqCount, 'Should have exactly one FAQPage schema, not duplicates').toBe(1);
  });

  test('FAQ schema has no empty question names', async ({ page }) => {
    await page.goto('/blog/');
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    let faqData: any = null;
    for (let i = 0; i < count; i++) {
      const text = await schemas.nth(i).textContent();
      if (text?.includes('FAQPage')) {
        faqData = JSON.parse(text!);
        break;
      }
    }
    for (const entity of faqData.mainEntity) {
      expect(entity.name?.trim().length, 'Question name should not be empty').toBeGreaterThan(0);
    }
  });

  test('FAQ schema has no empty answer text', async ({ page }) => {
    await page.goto('/blog/');
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    let faqData: any = null;
    for (let i = 0; i < count; i++) {
      const text = await schemas.nth(i).textContent();
      if (text?.includes('FAQPage')) {
        faqData = JSON.parse(text!);
        break;
      }
    }
    for (const entity of faqData.mainEntity) {
      expect(entity.acceptedAnswer.text?.trim().length, 'Answer text should not be empty').toBeGreaterThan(0);
    }
  });

  test('FAQ schema JSON is valid (no parse errors)', async ({ page }) => {
    await page.goto('/blog/');
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    for (let i = 0; i < count; i++) {
      const text = await schemas.nth(i).textContent();
      if (text?.includes('FAQPage')) {
        expect(() => JSON.parse(text!)).not.toThrow();
      }
    }
  });
});
