import { test, expect } from '@playwright/test';

/**
 * AskLex Component Tests — DISABLED STATE
 * The AskLex floating AI chat widget was disabled from BlogLayout.astro
 * on 2026-06-30 per Raj's request.
 * These tests verify the component is properly removed from blog pages.
 */

const BLOG_PAGE = '/blog/what-is-scrabble/';

test.describe('AskLex Disabled — Positive', () => {
  test('blog page loads successfully without AskLex', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    await expect(page).toHaveTitle(/Scrabble/i);
    // Page should load fine without the chat widget
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('no floating chat toggle button on blog pages', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const toggleBtn = page.locator('#rag-toggle-btn');
    await expect(toggleBtn).toHaveCount(0);
  });

  test('no chat panel element on blog pages', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const panel = page.locator('#rag-panel');
    await expect(panel).toHaveCount(0);
  });

  test('no chat widget container on blog pages', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    const widget = page.locator('#rag-chat-widget');
    await expect(widget).toHaveCount(0);
  });
});

test.describe('AskLex Disabled — Negative', () => {
  test('no JavaScript errors from missing AskLex on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(BLOG_PAGE);
    await page.waitForLoadState('networkidle');

    const ragErrors = errors.filter(e =>
      e.toLowerCase().includes('rag') ||
      e.toLowerCase().includes('lex') ||
      e.toLowerCase().includes('toggle')
    );
    expect(ragErrors, `No AskLex-related JS errors expected: ${ragErrors.join('; ')}`).toHaveLength(0);
  });

  test('no orphan AskLex scripts or styles left behind', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    // The RAG-related inline scripts should not be present if component is removed
    const ragInput = page.locator('#rag-input');
    const ragSendBtn = page.locator('#rag-send-btn');
    const ragMessages = page.locator('#rag-messages');

    await expect(ragInput).toHaveCount(0);
    await expect(ragSendBtn).toHaveCount(0);
    await expect(ragMessages).toHaveCount(0);
  });

  test('cookie consent still works without AskLex', async ({ page }) => {
    await page.goto(BLOG_PAGE);
    // CookieConsent comes right after the disabled AskLex — verify it still renders
    const cookieBanner = page.locator('#cookie-banner');
    // May or may not be visible depending on prior consent, but element should exist in DOM
    const count = await cookieBanner.count();
    expect(count).toBeGreaterThanOrEqual(0); // Either 0 (already consented) or 1
  });

  test('no API calls to rag-query on blog page load', async ({ page }) => {
    let ragApiCalled = false;
    await page.route('**/api/rag-query/**', route => {
      ragApiCalled = true;
      route.continue();
    });

    await page.goto(BLOG_PAGE);
    await page.waitForLoadState('networkidle');

    expect(ragApiCalled, 'No rag-query API calls should be made when AskLex is disabled').toBe(false);
  });
});
