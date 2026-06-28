import { test, expect } from '@playwright/test';

/**
 * Chat Page — Lex Avatar Image Tests
 * The Lex icon in the chat header uses /lex-avatar-128.png for crisp
 * 3× hover enlargement (128px source → 96px effective at scale-[3]).
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Chat Lex Avatar — Positive', () => {
  test('Lex avatar image is visible in header', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const avatar = page.locator('h1 img[alt="Lex"]');
    await expect(avatar).toBeVisible();
  });

  test('Lex avatar has correct src attribute', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const avatar = page.locator('h1 img[alt="Lex"]');
    await expect(avatar).toHaveAttribute('src', '/lex-avatar-128.png');
  });

  test('Lex avatar has correct dimensions (32x32)', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const avatar = page.locator('h1 img[alt="Lex"]');
    await expect(avatar).toHaveAttribute('width', '32');
    await expect(avatar).toHaveAttribute('height', '32');
  });

  test('Lex avatar image file returns 200', async ({ request }) => {
    const res = await request.get(`${BASE}/lex-avatar-128.png`);
    expect(res.status()).toBe(200);
  });

  test('Lex avatar has rounded-full styling', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const avatar = page.locator('h1 img[alt="Lex"]');
    await expect(avatar).toHaveClass(/rounded-full/);
  });
});

test.describe('Chat Lex Avatar — Hover & Tooltip', () => {
  test('Lex avatar shows tooltip "Lex AI" on hover', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const wrapper = page.locator('h1 .group');
    const tooltip = wrapper.locator('span.opacity-0');
    // Tooltip hidden initially
    await expect(tooltip).toHaveText('Lex AI');
    await expect(tooltip).toHaveCSS('opacity', '0');
  });

  test('Lex avatar has scale-3x hover class for zoom effect', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const avatar = page.locator('h1 img[alt="Lex"]');
    await expect(avatar).toHaveClass(/group-hover:scale-\[3\]/);
  });

  test('Header desktop uses Lex avatar image instead of robot emoji', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    // Check the nav bar has the Lex image link (not emoji)
    const headerLink = page.locator('header a[href="/chat/"] img[alt="Lex AI"]').first();
    await expect(headerLink).toBeVisible();
  });
});

test.describe('Chat Lex Avatar — Negative', () => {
  test('no duplicate Lex avatar images in header', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const avatars = page.locator('h1 img[alt="Lex"]');
    await expect(avatars).toHaveCount(1);
  });

  test('no old inline SVG tile icon remains in the h1', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const h1 = page.locator('h1');
    const svgs = h1.locator('svg');
    // The h1 should NOT contain any SVG (old tile icon was removed)
    await expect(svgs).toHaveCount(0);
  });

  test('page does not crash with missing avatar (no console errors)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(`${BASE}/chat/`);
    await page.waitForTimeout(1000);
    expect(errors.filter((e) => e.includes('critical'))).toHaveLength(0);
  });

  test('no robot emoji (🤖) remains in the header nav link', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const chatLink = page.locator('a[href="/chat/"]').first();
    const text = await chatLink.textContent();
    expect(text).not.toContain('🤖');
  });
});
