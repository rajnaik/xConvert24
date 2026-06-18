import { test, expect } from '@playwright/test';

/**
 * Dead Link Checker — Crawls key pages and verifies every internal link returns 200.
 *
 * Strategy:
 * 1. Start from seed pages (homepage, blog index, activities, guide, etc.)
 * 2. Collect all unique internal links from those pages
 * 3. Verify each link returns HTTP 200
 *
 * Skips:
 * - External links (http:// to other domains)
 * - Admin pages (require auth)
 * - API endpoints (require POST or specific params)
 * - Anchor-only links (#section)
 * - mailto: and tel: links
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

// Seed pages to crawl for links
const SEED_PAGES = [
  '/',
  '/blog/',
  '/activities/',
  '/guide/',
  '/about/',
  '/contact/',
  '/suggest/',
  '/privacy/',
  '/terms/',
  '/disclaimer/',
  '/settings/',
  '/releases/',
  '/roadmap/',
  '/faq/',
  '/achievements/',
  '/blog/beginner-guides/',
  '/blog/strategy/',
  '/blog/two-letter-words/',
  '/blog/three-letter-words/',
  '/blog/bingos/',
  '/blog/high-scoring/',
  '/blog/tournament/',
  '/blog/letter-guides/',
  '/blog/dictionaries/',
  '/blog/word-of-the-day-series/',
];

// Patterns to skip
const SKIP_PATTERNS = [
  /^\/admin/,       // Auth-protected
  /^\/api\//,       // API endpoints
  /^mailto:/,       // Email links
  /^tel:/,          // Phone links
  /^javascript:/,   // JS links
  /^#/,             // Anchor-only
];

function shouldSkip(href: string): boolean {
  if (!href || href === '') return true;
  if (href.startsWith('http://') || href.startsWith('https://')) {
    // Only follow links on the same domain
    try {
      const url = new URL(href);
      const baseUrl = new URL(BASE);
      if (url.hostname !== baseUrl.hostname) return true;
    } catch {
      return true;
    }
  }
  return SKIP_PATTERNS.some(pattern => pattern.test(href));
}

function normalizeHref(href: string): string {
  // Strip the base URL if it's a full URL on our domain
  try {
    const url = new URL(href, BASE);
    const baseUrl = new URL(BASE);
    if (url.hostname === baseUrl.hostname) {
      return url.pathname + url.search;
    }
  } catch {
    // Not a valid URL, return as-is
  }
  // Remove hash
  return href.split('#')[0];
}

test.describe('Dead Link Checker — All Internal Links @CheckLinkHealth', () => {

  test('all internal links from seed pages return 200', async ({ page, request }) => {
    test.setTimeout(300_000); // 5 minute timeout for full crawl

    const allLinks = new Set<string>();
    const failedLinks: { link: string; status: number; foundOn: string }[] = [];

    // Phase 1: Crawl seed pages and collect links
    for (const seedPage of SEED_PAGES) {
      const url = `${BASE}${seedPage}`;
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null);

      if (!response || response.status() !== 200) {
        // Seed page itself is broken — record it
        failedLinks.push({ link: seedPage, status: response?.status() || 0, foundOn: 'SEED' });
        continue;
      }

      // Collect all <a href="..."> from the page
      const hrefs = await page.locator('a[href]').evaluateAll(
        (elements) => elements.map(el => el.getAttribute('href') || '')
      );

      for (const href of hrefs) {
        if (shouldSkip(href)) continue;
        const normalized = normalizeHref(href);
        if (normalized && normalized.startsWith('/')) {
          allLinks.add(normalized);
        }
      }
    }

    // Phase 2: Check each unique link returns 200
    // Use request context for speed (no page rendering needed)
    const linksArray = Array.from(allLinks);

    // Process in batches of 10 for performance
    const BATCH_SIZE = 10;
    for (let i = 0; i < linksArray.length; i += BATCH_SIZE) {
      const batch = linksArray.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(async (link) => {
          try {
            const resp = await request.get(`${BASE}${link}`, { timeout: 10000 });
            return { link, status: resp.status() };
          } catch {
            return { link, status: 0 };
          }
        })
      );

      for (const { link, status } of results) {
        if (status !== 200) {
          // Find which seed page(s) had this link
          failedLinks.push({ link, status, foundOn: 'crawled' });
        }
      }
    }

    // Report
    if (failedLinks.length > 0) {
      const report = failedLinks
        .map(f => `  ${f.status} — ${f.link} (found on: ${f.foundOn})`)
        .join('\n');
      expect(failedLinks, `Dead links found (${failedLinks.length}):\n${report}`).toHaveLength(0);
    }
  });

  test('no seed page returns a non-200 status', async ({ request }) => {
    test.setTimeout(60_000);
    const failures: { page: string; status: number }[] = [];

    for (const seedPage of SEED_PAGES) {
      try {
        const resp = await request.get(`${BASE}${seedPage}`, { timeout: 10000 });
        if (resp.status() !== 200) {
          failures.push({ page: seedPage, status: resp.status() });
        }
      } catch {
        failures.push({ page: seedPage, status: 0 });
      }
    }

    if (failures.length > 0) {
      const report = failures.map(f => `  ${f.status} — ${f.page}`).join('\n');
      expect(failures, `Seed pages with non-200 status:\n${report}`).toHaveLength(0);
    }
  });
});
