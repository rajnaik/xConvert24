import { test, expect } from '@playwright/test';

/**
 * Noindex Meta Tag Tests
 * Verifies the Layout `noindex` prop and automatic admin noindex behaviour:
 * - Admin pages automatically get <meta name="robots" content="noindex, nofollow">
 * - Pages with noindex={true} prop also get <meta name="robots" content="noindex, nofollow">
 * - Public pages (noindex=false, default) do NOT have the noindex meta tag
 */

const ADMIN_PAGES = [
  '/admin/',
  '/admin/emails/',
  '/admin/clicks/',
  '/admin/telemetry/',
  '/admin/environments/',
  '/admin/banner-management/',
];

const PUBLIC_PAGES = [
  '/',
  '/blog/',
  '/guide/',
  '/about/',
  '/privacy/',
  '/contact/',
  '/suggest/',
  '/settings/',
  '/terms/',
  '/disclaimer/',
];

/** Pages that explicitly pass noindex={true} via Layout prop */
const NOINDEX_PROP_PAGES = [
  '/achievements/',
  '/anagram-history/',
  '/profile-data/',
  '/quiz-history/',
  '/stats/',
  '/wordbench-practice/',
  '/workbench-data/',
];

test.describe('Noindex Meta — Positive (Admin Pages)', () => {
  for (const path of ADMIN_PAGES) {
    test(`${path} has noindex meta tag`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: 'commit' });
      // Skip if redirected to login (no auth session)
      if (page.url().includes('/api/auth/login') || (response && response.status() === 403)) {
        test.skip();
        return;
      }
      // Check page source directly for meta tag (more reliable for <head> content)
      const html = await page.content();
      expect(html).toContain('name="robots" content="noindex, nofollow"');
    });
  }
});

test.describe('Noindex Meta — Positive (Prop-Based noindex Pages)', () => {
  for (const path of NOINDEX_PROP_PAGES) {
    test(`${path} has noindex meta tag via Layout prop`, async ({ page }) => {
      await page.goto(path);
      const robots = page.locator('meta[name="robots"][content*="noindex"]');
      await expect(robots).toHaveCount(1);
      await expect(robots).toHaveAttribute('content', 'noindex, nofollow');
    });
  }
});

test.describe('Noindex Meta — Positive (Public Pages Have No noindex)', () => {
  for (const path of PUBLIC_PAGES) {
    test(`${path} does NOT have noindex meta tag`, async ({ page }) => {
      await page.goto(path);
      const robots = page.locator('meta[name="robots"][content*="noindex"]');
      await expect(robots).toHaveCount(0);
    });
  }
});

test.describe('Noindex Meta — Negative', () => {
  test('public homepage does not accidentally include robots noindex', async ({ page }) => {
    await page.goto('/');
    const html = await page.content();
    expect(html).not.toContain('name="robots" content="noindex');
  });

  test('multiple noindex meta tags are never rendered on admin pages', async ({ page }) => {
    await page.goto('/admin/');
    // Skip if redirected to login (no auth session on localhost)
    if (page.url().includes('/api/auth/login') || page.url().includes('/admin') === false) {
      test.skip();
      return;
    }
    const robotsTags = page.locator('meta[name="robots"]');
    // Should be exactly one, not duplicated
    const count = await robotsTags.count();
    expect(count).toBeLessThanOrEqual(1);
  });

  test('blog pages do not inherit noindex from Layout', async ({ page }) => {
    await page.goto('/blog/');
    const robots = page.locator('meta[name="robots"][content*="noindex"]');
    await expect(robots).toHaveCount(0);
  });

  test('prop-based noindex page does not render duplicate meta robots tags', async ({ page }) => {
    await page.goto('/stats/');
    const robotsTags = page.locator('meta[name="robots"]');
    const count = await robotsTags.count();
    expect(count).toBeLessThanOrEqual(1);
  });

  test('noindex prop does not affect other meta tags (description still present)', async ({ page }) => {
    await page.goto('/achievements/');
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveCount(1);
    const content = await description.getAttribute('content');
    expect(content).toBeTruthy();
    expect(content!.length).toBeGreaterThan(10);
  });
});
