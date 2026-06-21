import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'https://www.scrabblewordsfinder.com';

// ── Header Tagline Position — Positive ──────────────────────────────────────

test.describe('Header Tagline — Positive', () => {
  test('tagline "Free, Fast, No-Sign Up" is visible beside the h1 title on homepage', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const titleRow = page.locator('main .flex.flex-wrap.items-center.gap-3.mb-4');
    const tagline = titleRow.locator('text=Free, Fast, No-Sign Up');
    await expect(tagline).toBeVisible();
  });

  test('tagline is in the same flex row as the h1 title', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const titleRow = page.locator('main .flex.flex-wrap.items-center.gap-3.mb-4');
    const h1 = titleRow.locator('h1');
    const tagline = titleRow.locator('span.text-blue-400.font-medium', { hasText: 'Free, Fast, No-Sign Up' });
    await expect(h1).toBeVisible();
    await expect(tagline).toBeVisible();
  });

  test('tagline has correct text-sm styling', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const tagline = page.locator('main span.text-blue-400.font-medium', { hasText: 'Free, Fast, No-Sign Up' });
    await expect(tagline).toHaveClass(/text-sm/);
  });
});

// ── Header Tagline — Negative ───────────────────────────────────────────────

test.describe('Header Tagline — Negative', () => {
  test('tagline does not appear in the header nav links row', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const navRow = page.locator('header .hidden.sm\\:grid > div.flex.items-center.gap-3').first();
    const taglineInNav = navRow.locator('text=Free, Fast, No-Sign Up');
    await expect(taglineInNav).toHaveCount(0);
  });

  test('tagline does not appear duplicated on the page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const taglines = page.locator('text=Free, Fast, No-Sign Up');
    await expect(taglines).toHaveCount(1);
  });

  test('no pipe separator exists in the nav row', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL);
    const navRow = page.locator('header .hidden.sm\\:grid > div.flex.items-center.gap-3').first();
    const pipeSpans = navRow.locator('span.text-gray-700');
    await expect(pipeSpans).toHaveCount(0);
  });

  test('tagline does not break logo link functionality', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE_URL + '/about/');
    const logoLink = page.locator('header .hidden.sm\\:grid a:has(img#site-logo)');
    await expect(logoLink).toHaveAttribute('href', '/');
  });
});
