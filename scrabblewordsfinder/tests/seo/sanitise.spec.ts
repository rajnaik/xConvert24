import { test, expect } from '@playwright/test';

/**
 * Sanitise Tests — checks all public pages for sensitive info and policy violations.
 * Run after every staging deploy or manually via "Sanitise SWF".
 */

const PUBLIC_PAGES = [
  '/',
  '/guide',
  '/about',
  '/privacy',
  '/contact',
  '/disclaimer',
  '/terms',
  '/suggest',
  '/settings',
  '/blog',
];

const FORBIDDEN_PATTERNS = [
  /no ads/i,
  /ad-free/i,
  /never.*ads/i,
  /won't.*advertis/i,
  /will not.*advertis/i,
  /Google Analytics/i,
  /\bGA4\b/,
  /@gmail\.com/i,
  /password\s*[:=]/i,
  /api[_-]?key\s*[:=]/i,
  /API_KEY/,
  /sk-[a-zA-Z0-9]{20,}/,  // OpenAI-style keys
  /AKIA[A-Z0-9]{16}/,      // AWS access keys
  /rajeev/i,               // Employee name
];

test.describe('Sanitise — Sensitive Content Scan', () => {
  for (const page of PUBLIC_PAGES) {
    test(`${page} — no sensitive content`, async ({ page: p }) => {
      await p.goto(page);
      const bodyText = await p.locator('body').innerText();

      for (const pattern of FORBIDDEN_PATTERNS) {
        const match = bodyText.match(pattern);
        expect(match, `Found forbidden pattern "${pattern}" on ${page}: "${match?.[0]}"`).toBeNull();
      }
    });
  }
});

test.describe('Sanitise — No Exposed Admin URLs in Public Pages', () => {
  for (const page of PUBLIC_PAGES) {
    test(`${page} — no admin links visible`, async ({ page: p }) => {
      await p.goto(page);
      const adminLinks = await p.locator('a[href*="/admin"]').count();
      expect(adminLinks, `Found admin link on public page ${page}`).toBe(0);
    });
  }
});

test.describe('Sanitise — No Database IDs or Config Exposed', () => {
  for (const page of PUBLIC_PAGES) {
    test(`${page} — no DB IDs or wrangler config`, async ({ page: p }) => {
      await p.goto(page);
      const bodyText = await p.locator('body').innerText();

      // D1 database IDs
      expect(bodyText).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
      // Wrangler config references
      expect(bodyText).not.toContain('wrangler.jsonc');
      expect(bodyText).not.toContain('BUGS_DB');
    });
  }
});

test.describe('Sanitise — Data Management Compliance', () => {
  test('privacy page mentions anonymous click tracking', async ({ page }) => {
    await page.goto('/privacy');
    const text = await page.locator('body').innerText();
    expect(text).toContain('anonymous');
    expect(text).toContain('click');
  });

  test('privacy page does NOT claim zero tracking', async ({ page }) => {
    await page.goto('/privacy');
    const text = await page.locator('body').innerText();
    expect(text.toLowerCase()).not.toContain('no tracking');
    expect(text.toLowerCase()).not.toContain('zero tracking');
  });

  test('privacy page does NOT claim no cookies', async ({ page }) => {
    await page.goto('/privacy');
    const text = await page.locator('body').innerText();
    expect(text.toLowerCase()).not.toMatch(/no cookies(?! preference)/);
  });

  test('privacy page states data is never sold', async ({ page }) => {
    await page.goto('/privacy');
    const text = await page.locator('body').innerText();
    expect(text.toLowerCase()).toContain('never sell');
  });

  test('guide page has data management section', async ({ page }) => {
    await page.goto('/guide');
    const text = await page.locator('body').innerText();
    expect(text).toContain('Nuke');
    expect(text).toContain('Download');
    expect(text).toContain('Relink');
  });

  test('cookie consent banner loads on homepage', async ({ page }) => {
    // Clear cookies to trigger banner
    await page.context().clearCookies();
    await page.goto('/');
    const banner = page.locator('#cookie-banner');
    await expect(banner).toBeVisible();
  });
});
