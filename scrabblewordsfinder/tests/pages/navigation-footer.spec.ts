import { test, expect } from '@playwright/test';

/**
 * Navigation, Footer & Cross-Site Link Tests
 * Tests all navigation links, footer links, related article links,
 * and inter-page connectivity.
 */

test.describe('Main Navigation', () => {
  test('header has solver link', async ({ page }) => {
    await page.goto('/');
    const solverLink = page.locator('header a[href="/"]');
    await expect(solverLink).toBeAttached();
  });

  test('header has guide link', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header a[href="/guide/"]')).toBeAttached();
  });

  test('header has about link', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header a[href="/about/"]')).toBeAttached();
  });

  test('header has settings link', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header a[href="/settings/"]')).toBeAttached();
  });

  test('logo/brand links to home', async ({ page }) => {
    await page.goto('/about');
    const logo = page.locator('a').filter({ hasText: 'ScrabbleWordsFinder' }).first();
    const href = await logo.getAttribute('href');
    expect(href).toBe('/');
  });

  test('navigation is consistent across pages', async ({ page }) => {
    const pages = ['/', '/settings', '/suggest', '/contact', '/guide', '/about'];
    for (const path of pages) {
      await page.goto(path);
      await expect(page.locator('a[href="/"]').first()).toBeAttached();
    }
  });
});

test.describe('Footer Links', () => {
  test('homepage has footer icon links', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="/blog"]')).toBeAttached();
    await expect(page.locator('a[href="/guide"]')).toBeAttached();
    await expect(page.locator('a[href="/about"]')).toBeAttached();
    await expect(page.locator('a[href="/privacy"]')).toBeAttached();
    await expect(page.locator('a[href="/contact"]')).toBeAttached();
  });

  test('suggest page has full footer', async ({ page }) => {
    await page.goto('/suggest');
    const footer = page.locator('footer');
    await expect(footer.locator('a[href="/guide"]')).toBeAttached();
    await expect(footer.locator('a[href="/about"]')).toBeAttached();
    await expect(footer.locator('a[href="/privacy"]')).toBeAttached();
    await expect(footer.locator('a[href="/contact"]')).toBeAttached();
    await expect(footer.locator('a[href="/disclaimer"]')).toBeAttached();
    await expect(footer.locator('a[href="/terms"]')).toBeAttached();
    await expect(footer.locator('a[href="/suggest"]')).toBeAttached();
  });

  test('footer shows copyright', async ({ page }) => {
    await page.goto('/suggest');
    await expect(page.locator('footer')).toContainText('ScrabbleWordsFinder.com');
  });

  test('copyright year span exists with valid year', async ({ page }) => {
    await page.goto('/');
    const yearSpan = page.locator('#copyright-year');
    await expect(yearSpan).toBeAttached();
    const text = await yearSpan.textContent();
    expect(text).toMatch(/^\d{4}$/);
  });

  test('copyright year span is not empty', async ({ page }) => {
    await page.goto('/');
    const yearSpan = page.locator('#copyright-year');
    await expect(yearSpan).toBeAttached();
    const text = await yearSpan.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
  });
});

test.describe('Related Articles (Homepage)', () => {
  test('has Related Articles section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Related Articles')).toBeAttached();
  });

  test('has 4 blog post links', async ({ page }) => {
    await page.goto('/');
    const blogLinks = [
      '/blog/scrabble-history-origins-great-depression',
      '/blog/scrabble-tile-strategy-letters-scoring',
      '/blog/scrabble-dictionaries-languages-weird-words',
      '/blog/competitive-scrabble-tournament-world',
    ];
    for (const href of blogLinks) {
      await expect(page.locator(`a[href="${href}"]`)).toBeAttached();
    }
  });
});

test.describe('Version Stamp', () => {
  test('version stamp is present on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    const versionLink = page.locator('a[href="/releases"]');
    await expect(versionLink).toBeAttached();
    const text = await versionLink.textContent();
    expect(text).toMatch(/v\d/);
  });
});

test.describe('Admin Dot Link — Positive', () => {
  test('admin-dot element exists in DOM with trailing slash href', async ({ page }) => {
    await page.goto('/');
    const adminDot = page.locator('#admin-dot');
    await expect(adminDot).toBeAttached();
    await expect(adminDot).toHaveAttribute('href', '/admin/');
  });

  test('admin-dot is hidden by default (display:none)', async ({ page }) => {
    await page.goto('/');
    const adminDot = page.locator('#admin-dot');
    await expect(adminDot).toBeHidden();
  });
});

test.describe('Admin Dot Link — Negative', () => {
  test('admin-dot href does not lack trailing slash', async ({ page }) => {
    await page.goto('/');
    const adminDot = page.locator('#admin-dot');
    const href = await adminDot.getAttribute('href');
    expect(href).not.toBe('/admin');
    expect(href).toBe('/admin/');
  });

  test('no duplicate admin-dot elements', async ({ page }) => {
    await page.goto('/');
    const dots = page.locator('#admin-dot');
    await expect(dots).toHaveCount(1);
  });
});

test.describe('Cross-Page Navigation Flow', () => {
  test('can navigate from home to settings and back', async ({ page }) => {
    await page.goto('/');
    await page.locator('a[href="/settings"]').first().click();
    await expect(page).toHaveURL(/\/settings/);
    await page.locator('a[href="/"]').first().click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('can navigate from home to guide', async ({ page }) => {
    await page.goto('/');
    await page.locator('a[href="/guide"]').first().click();
    await expect(page).toHaveURL(/\/guide/);
  });

  test('can navigate from contact to suggest', async ({ page }) => {
    await page.goto('/contact');
    const suggestLink = page.locator('a[href="/suggest/"]').first();
    await suggestLink.click();
    await expect(page).toHaveURL(/\/suggest/);
  });

  test('suggest page links back to solver', async ({ page }) => {
    await page.goto('/suggest');
    const returnLink = page.locator('a[href="/"]').last();
    await expect(returnLink).toBeAttached();
  });
});
