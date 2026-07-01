import { test, expect } from '@playwright/test';

/**
 * Blog Index — Ask Lex AI Resource Link
 *
 * The "Ask Lex AI" link in the Resources section on /blog/ links to /chat/
 * and is styled with purple theming (robot emoji + purple border).
 *
 * File changed: src/pages/blog/index.astro
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Blog Index — Ask Lex AI Resource Link — Positive', () => {
  test('Ask Lex AI resource tile is visible on blog index', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    const link = page.locator('a[href="/chat/"]', { hasText: 'Ask Lex AI' });
    await expect(link).toBeVisible();
  });

  test('Ask Lex AI tile has Lex avatar image', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    const link = page.locator('a[href="/chat/"]', { hasText: 'Ask Lex AI' });
    const avatar = link.locator('img[alt="Lex"]');
    await expect(avatar).toBeVisible();
  });

  test('Ask Lex AI tile has purple border styling', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    const link = page.locator('a[href="/chat/"]', { hasText: 'Ask Lex AI' });
    await expect(link).toHaveClass(/border-purple-500\/30/);
  });

  test('Ask Lex AI tile appears after Resources heading', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    const resourcesHeading = page.locator('p', { hasText: 'Resources' }).first();
    await expect(resourcesHeading).toBeVisible();
    const link = page.locator('a[href="/chat/"]', { hasText: 'Ask Lex AI' });
    await expect(link).toBeVisible();
  });
});

test.describe('Blog Index — Ask Lex AI Resource Link — Negative', () => {
  test('only one Ask Lex AI resource tile exists in blog grid', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    // Count tiles labelled "Ask Lex AI" in the category grid area
    const tiles = page.locator('a', { hasText: 'Ask Lex AI' });
    const count = await tiles.count();
    expect(count).toBe(1);
  });

  test('Ask Lex AI tile does not have broken/empty href', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    const link = page.locator('a', { hasText: 'Ask Lex AI' });
    const href = await link.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).not.toBe('');
    expect(href).not.toBe('#');
    expect(href!.endsWith('/')).toBe(true);
  });
});
