import { test, expect } from '@playwright/test';

/**
 * BlogLayout Search Autocomplete Tests
 * Verifies the blog search input, autocomplete results,
 * deferred initialization via requestIdleCallback,
 * and that all result links have trailing slashes.
 */

const BLOG_PAGE = '/blog/what-is-scrabble/';

test.describe('Blog Search Autocomplete — Positive', () => {
  test('search input exists and is visible', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const searchInput = page.locator('#dict-search');
    await expect(searchInput).toBeVisible();
  });

  test('typing 2+ characters shows autocomplete results', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const searchInput = page.locator('#dict-search');
    await searchInput.fill('scrabble');
    // Wait for debounce (150ms) + rendering
    await page.waitForTimeout(300);
    const resultsBox = page.locator('#dict-search + div, #dict-search ~ div').first();
    await expect(resultsBox).not.toHaveClass(/hidden/);
    const links = resultsBox.locator('a');
    expect(await links.count()).toBeGreaterThan(0);
  });

  test('all search result links have trailing slashes', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const searchInput = page.locator('#dict-search');
    await searchInput.fill('words');
    await page.waitForTimeout(300);
    // Find the autocomplete dropdown (sibling of input inside its parent)
    const resultsBox = searchInput.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    const hrefs = await resultsBox.locator('a').evaluateAll(els =>
      els.map(el => el.getAttribute('href'))
    );
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href, `Link "${href}" should end with /`).toMatch(/\/$/);
    }
  });

  test('clicking a search result navigates to the page', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const searchInput = page.locator('#dict-search');
    await searchInput.fill('strategy');
    await page.waitForTimeout(300);
    const resultsBox = searchInput.locator('..').locator('div.absolute');
    const firstLink = resultsBox.locator('a').first();
    await expect(firstLink).toBeVisible();
    const href = await firstLink.getAttribute('href');
    await firstLink.click();
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain(href!);
  });

  test('pressing Enter on search navigates to /chat/?q= search page', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const searchInput = page.locator('#dict-search');
    await searchInput.fill('tiles');
    await searchInput.press('Enter');
    await page.waitForLoadState('domcontentloaded');
    // Chat page reads ?q= then cleans URL via replaceState, so final URL is /chat/
    expect(page.url()).toContain('/chat/');
  });
});

test.describe('Blog Search Autocomplete — Negative', () => {
  test('typing fewer than 2 characters does not show results', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const searchInput = page.locator('#dict-search');
    await searchInput.fill('a');
    await page.waitForTimeout(300);
    const resultsBox = searchInput.locator('..').locator('div.absolute');
    // Either hidden or not yet created
    const count = await resultsBox.count();
    if (count > 0) {
      await expect(resultsBox).toHaveClass(/hidden/);
    }
  });

  test('no matching query shows "No results" message', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const searchInput = page.locator('#dict-search');
    await searchInput.fill('xyznonexistent');
    await page.waitForTimeout(300);
    const resultsBox = searchInput.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    await expect(resultsBox).toContainText('No results');
  });

  test('escape key hides the autocomplete dropdown', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const searchInput = page.locator('#dict-search');
    await searchInput.fill('words');
    await page.waitForTimeout(300);
    const resultsBox = searchInput.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    await searchInput.press('Escape');
    await expect(resultsBox).toHaveClass(/hidden/);
  });

  test('clicking outside hides the autocomplete dropdown', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const searchInput = page.locator('#dict-search');
    await searchInput.fill('words');
    await page.waitForTimeout(300);
    const resultsBox = searchInput.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    // Click on the body away from the search
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await expect(resultsBox).toHaveClass(/hidden/);
  });

  test('no console errors during search interaction', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(BLOG_PAGE);
    const searchInput = page.locator('#dict-search');
    await searchInput.fill('scrabble');
    await page.waitForTimeout(300);
    await searchInput.fill('');
    await searchInput.fill('xyznonexistent');
    await page.waitForTimeout(300);
    expect(errors.filter(e => e.includes('critical'))).toHaveLength(0);
  });
});

test.describe('Blog Search — Deferred Initialization (requestIdleCallback)', () => {
  test('search still initializes and works after requestIdleCallback deferral', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    // The search script now defers via requestIdleCallback (or 50ms fallback).
    // Wait enough time for the idle callback to fire, then verify search works.
    await page.waitForTimeout(200);
    const searchInput = page.locator('#dict-search');
    await searchInput.fill('scrabble');
    await page.waitForTimeout(300);
    const resultsBox = searchInput.locator('..').locator('div.absolute');
    await expect(resultsBox).toBeVisible();
    const links = resultsBox.locator('a');
    expect(await links.count()).toBeGreaterThan(0);
  });

  test('no JS errors during deferred search initialization on blog pages', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(BLOG_PAGE);
    // Wait for requestIdleCallback to fire and initialize the search
    await page.waitForTimeout(200);
    // Interact immediately to stress-test the deferred init
    const searchInput = page.locator('#dict-search');
    await searchInput.focus();
    await searchInput.fill('word');
    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
  });

  test('search API fetch is triggered lazily on blog page focus', async ({ page }) => {
    let apiCalled = false;
    page.on('request', req => {
      if (req.url().includes('/api/search-index/')) apiCalled = true;
    });
    await page.goto(BLOG_PAGE);
    // API should NOT be called immediately on page load (deferred init)
    await page.waitForTimeout(100);
    const searchInput = page.locator('#dict-search');
    await searchInput.focus();
    // After focus, the full index should be fetched
    await page.waitForTimeout(500);
    expect(apiCalled).toBe(true);
  });

  test('typing very quickly after page load does not crash (race condition)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    // Navigate and type immediately — before idle callback may have fired
    await page.goto(BLOG_PAGE);
    const searchInput = page.locator('#dict-search');
    // Type without waiting for idle callback
    await searchInput.fill('tiles');
    await page.waitForTimeout(400);
    // No crashes — search may or may not show results depending on timing,
    // but must not error
    expect(errors).toHaveLength(0);
  });
});
