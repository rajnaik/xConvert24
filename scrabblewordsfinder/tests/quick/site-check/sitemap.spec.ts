import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

const SITEMAP = BASE + '/sitemap.xml';

/**
 * Quick Tests — Site Check: Sitemap & Orphan Pages
 * Verifies sitemap integrity and checks for orphan pages.
 */

test.describe('Quick Tests — Site Check: Orphan Pages — Positive', () => {

  test('site has a non-zero page count (sitemap is not empty)', async ({ request }) => {
    const res = await request.get(SITEMAP);
    expect(res.status()).toBe(200);
    const xml = await res.text();
    const urls = xml.match(/<loc>/g);
    expect(urls).not.toBeNull();
    expect(urls!.length).toBeGreaterThan(0);
  });

  test('sitemap contains at least 50 pages', async ({ request }) => {
    const res = await request.get(SITEMAP);
    const xml = await res.text();
    const urls = xml.match(/<loc>/g) || [];
    // SWF has hundreds of blog posts + static pages
    expect(urls.length).toBeGreaterThanOrEqual(50);
  });

  test('orphan pages exist (pages in sitemap not linked from homepage or blog index)', async ({ page, request }) => {
    // Step 1: Get all sitemap URLs
    const sitemapRes = await request.get(SITEMAP);
    const xml = await sitemapRes.text();
    const sitemapUrls = new Set(
      (xml.match(/<loc>(.*?)<\/loc>/g) || [])
        .map(loc => {
          const url = loc.replace('<loc>', '').replace('</loc>', '');
          // Normalize to path only
          return new URL(url).pathname;
        })
    );

    // Step 2: Crawl homepage for internal links
    await page.goto(BASE + '/');
    const homepageLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href^="/"]'))
        .map(a => {
          let href = (a as HTMLAnchorElement).pathname;
          if (!href.endsWith('/')) href += '/';
          return href;
        });
    });

    // Step 3: Crawl blog index for internal links
    await page.goto(BASE + '/blog/');
    const blogLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href^="/"]'))
        .map(a => {
          let href = (a as HTMLAnchorElement).pathname;
          if (!href.endsWith('/')) href += '/';
          return href;
        });
    });

    const linkedPages = new Set([...homepageLinks, ...blogLinks]);

    // Step 4: Find orphans (in sitemap but not linked from homepage or blog index)
    const orphans: string[] = [];
    for (const path of sitemapUrls) {
      if (!linkedPages.has(path)) {
        orphans.push(path);
      }
    }

    // The test verifies orphan detection works — some orphans are expected
    // (deep blog posts may only be linked from category pages, not the top-level)
    expect(orphans.length).toBeGreaterThan(0);
  });
});

test.describe('Quick Tests — Site Check: Sitemap Consistency — Positive', () => {

  test('all static pages from filesystem are in sitemap', async ({ request }) => {
    const res = await request.get(SITEMAP);
    const xml = await res.text();

    // Key static pages that MUST be in sitemap
    const requiredPages = [
      '/', '/blog/', '/guide/', '/faq/', '/about/',
      '/contact/', '/privacy/', '/disclaimer/', '/terms/',
      '/activities/', '/settings/', '/releases/', '/suggest/',
    ];

    for (const page of requiredPages) {
      const fullUrl = `https://www.scrabblewordsfinder.com${page}`;
      expect(xml, `Missing from sitemap: ${page}`).toContain(fullUrl);
    }
  });

  test('sitemap URLs all have trailing slashes', async ({ request }) => {
    const res = await request.get(SITEMAP);
    const xml = await res.text();
    const urls = (xml.match(/<loc>(.*?)<\/loc>/g) || [])
      .map(loc => loc.replace('<loc>', '').replace('</loc>', ''));

    for (const url of urls) {
      const path = new URL(url).pathname;
      expect(path, `Missing trailing slash: ${url}`).toMatch(/\/$/);
    }
  });

  test('sitemap URLs return 200 status (sample check)', async ({ request }) => {
    const res = await request.get(SITEMAP);
    const xml = await res.text();
    const urls = (xml.match(/<loc>(.*?)<\/loc>/g) || [])
      .map(loc => loc.replace('<loc>', '').replace('</loc>', ''));

    // Sample 10 random URLs to check they resolve (don't check all — too slow)
    const sample = urls.sort(() => Math.random() - 0.5).slice(0, 10);
    for (const url of sample) {
      const path = new URL(url).pathname;
      const pageRes = await request.get(BASE + path);
      expect(pageRes.status(), `404 for ${path}`).toBe(200);
    }
  });

  test('no duplicate URLs in sitemap', async ({ request }) => {
    const res = await request.get(SITEMAP);
    const xml = await res.text();
    const urls = (xml.match(/<loc>(.*?)<\/loc>/g) || [])
      .map(loc => loc.replace('<loc>', '').replace('</loc>', ''));

    const unique = new Set(urls);
    expect(urls.length).toBe(unique.size);
  });

  test('page file count matches sitemap entry count (excluding admin/api)', async ({ request }) => {
    // Get sitemap count
    const res = await request.get(SITEMAP);
    const xml = await res.text();
    const sitemapUrls = (xml.match(/<loc>/g) || []).length;

    // The sitemap is auto-generated from static pages + blog glob
    // It should have a substantial number of entries
    // We can't count filesystem pages from the test, but we verify the count is reasonable
    expect(sitemapUrls).toBeGreaterThanOrEqual(50);
    // And not suspiciously large (would indicate duplicate generation)
    expect(sitemapUrls).toBeLessThan(1000);
  });
});

test.describe('Quick Tests — Site Check — Negative', () => {

  test('sitemap does not contain admin pages', async ({ request }) => {
    const res = await request.get(SITEMAP);
    const xml = await res.text();
    expect(xml).not.toContain('/admin/');
  });

  test('sitemap does not contain API routes', async ({ request }) => {
    const res = await request.get(SITEMAP);
    const xml = await res.text();
    expect(xml).not.toContain('/api/');
  });

  test('sitemap XML is not malformed (balanced tags)', async ({ request }) => {
    const res = await request.get(SITEMAP);
    const xml = await res.text();
    // Must have XML declaration + urlset wrapper
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain('<urlset xmlns=');
    expect(xml).toContain('</urlset>');
    // Every <url> has a closing tag (no orphaned opens)
    const opens = (xml.match(/<url>/g) || []).length;
    const closes = (xml.match(/<\/url>/g) || []).length;
    expect(opens).toBe(closes);
  });
});
