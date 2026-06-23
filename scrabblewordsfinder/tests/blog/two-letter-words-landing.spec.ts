import { test, expect } from '@playwright/test';

test.describe('Two-Letter Words Landing Page — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto('/blog/two-letter-words/');
    expect(response?.status()).toBe(200);
  });

  test('page has correct title containing two-letter', async ({ page }) => {
    await page.goto('/blog/two-letter-words/');
    const title = await page.title();
    expect(title.toLowerCase()).toContain('two-letter');
  });

  test('page has meta description', async ({ page }) => {
    await page.goto('/blog/two-letter-words/');
    const metaDesc = page.locator('meta[name="description"]');
    const content = await metaDesc.getAttribute('content');
    expect(content).toBeTruthy();
    expect(content!.length).toBeGreaterThan(50);
  });

  test('Is AA a Scrabble Word link is visible with correct href', async ({ page }) => {
    await page.goto('/blog/two-letter-words/');
    const link = page.locator('a[href="/blog/is-aa-a-scrabble-word/"]');
    await expect(link).toBeVisible();
    const text = await link.textContent();
    expect(text).toContain('Is AA a Scrabble Word?');
  });

  test('Is JO a Scrabble Word link is visible with correct href', async ({ page }) => {
    await page.goto('/blog/two-letter-words/');
    const link = page.locator('a[href="/blog/is-jo-a-scrabble-word/"]');
    await expect(link).toBeVisible();
    const text = await link.textContent();
    expect(text).toContain('Is JO a Scrabble Word?');
  });

  test('Is OX a Scrabble Word link is visible with correct href', async ({ page }) => {
    await page.goto('/blog/two-letter-words/');
    const link = page.locator('a[href="/blog/is-ox-a-scrabble-word/"]');
    await expect(link).toBeVisible();
    const text = await link.textContent();
    expect(text).toContain('Is OX a Scrabble Word?');
  });

  test('Is XI a Scrabble Word link is visible with correct href', async ({ page }) => {
    await page.goto('/blog/two-letter-words/');
    const link = page.locator('a[href="/blog/is-xi-a-scrabble-word/"]');
    await expect(link).toBeVisible();
    const text = await link.textContent();
    expect(text).toContain('Is XI a Scrabble Word?');
  });

  test('Is XU a Scrabble Word link is visible with correct href', async ({ page }) => {
    await page.goto('/blog/two-letter-words/');
    const link = page.locator('a[href="/blog/is-xu-a-scrabble-word/"]');
    await expect(link).toBeVisible();
    const text = await link.textContent();
    expect(text).toContain('Is XU a Scrabble Word?');
  });

  test('all 5 new word cards have description text', async ({ page }) => {
    await page.goto('/blog/two-letter-words/');
    const newLinks = [
      '/blog/is-aa-a-scrabble-word/',
      '/blog/is-jo-a-scrabble-word/',
      '/blog/is-ox-a-scrabble-word/',
      '/blog/is-xi-a-scrabble-word/',
      '/blog/is-xu-a-scrabble-word/',
    ];
    for (const href of newLinks) {
      const link = page.locator(`a[href="${href}"]`);
      const description = link.locator('p.text-sm');
      const text = await description.textContent();
      expect(text!.length, `Description missing for ${href}`).toBeGreaterThan(20);
    }
  });
});

test.describe('Two-Letter Words Landing Page — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/blog/two-letter-words/');
    await page.waitForTimeout(1000);
    expect(errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'))).toHaveLength(0);
  });

  test('no duplicate links for any Is-X-a-Scrabble-Word card', async ({ page }) => {
    await page.goto('/blog/two-letter-words/');
    const newLinks = [
      '/blog/is-aa-a-scrabble-word/',
      '/blog/is-jo-a-scrabble-word/',
      '/blog/is-ox-a-scrabble-word/',
      '/blog/is-xi-a-scrabble-word/',
      '/blog/is-xu-a-scrabble-word/',
    ];
    for (const href of newLinks) {
      const links = page.locator(`a[href="${href}"]`);
      const count = await links.count();
      expect(count, `Duplicate links found for ${href}`).toBe(1);
    }
  });

  test('all new word card links have trailing slash', async ({ page }) => {
    await page.goto('/blog/two-letter-words/');
    const newLinks = [
      '/blog/is-aa-a-scrabble-word/',
      '/blog/is-jo-a-scrabble-word/',
      '/blog/is-ox-a-scrabble-word/',
      '/blog/is-xi-a-scrabble-word/',
      '/blog/is-xu-a-scrabble-word/',
    ];
    for (const href of newLinks) {
      const link = page.locator(`a[href="${href}"]`);
      const actualHref = await link.getAttribute('href');
      expect(actualHref, `Link ${href} must end with /`).toMatch(/\/$/);
    }
  });

  test('page does not show undefined or raw Astro expressions in visible content', async ({ page }) => {
    await page.goto('/blog/two-letter-words/');
    // Check only visible headings and paragraphs, not inline scripts
    const headings = await page.locator('h1, h2, h3, p').allTextContents();
    const visibleText = headings.join(' ');
    expect(visibleText).not.toContain('undefined');
    expect(visibleText).not.toContain('${');
  });

  test('no empty href attributes on any link', async ({ page }) => {
    await page.goto('/blog/two-letter-words/');
    const links = await page.locator('a[href]').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      expect(href?.trim().length, 'Link href should not be empty').toBeGreaterThan(0);
    }
  });
});
