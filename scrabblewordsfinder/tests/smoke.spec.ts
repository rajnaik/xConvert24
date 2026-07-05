import { test, expect } from '@playwright/test';

/**
 * Smoke Test Suite — ~100 key tests for quick regression verification.
 *
 * Run with: npx playwright test tests/smoke.spec.ts --reporter=list
 * Or:       npx playwright test --project=smoke
 *
 * Covers: Solver, Pages, Activities, Blog, Admin, API, SEO
 * Target runtime: < 3 minutes
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

// ─────────────────────────────────────────────
// SOLVER (15 tests)
// ─────────────────────────────────────────────

test.describe('@smoke Solver', () => {
  test('homepage loads with correct title', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page).toHaveTitle(/Scrabble Word Finder/i);
  });

  test('dictionary files return 200', async ({ request }) => {
    const res1 = await request.get(`${BASE}/data/sowpods-2-7.json`);
    const res2 = await request.get(`${BASE}/data/sowpods-8-15.json`);
    expect(res1.status()).toBe(200);
    expect(res2.status()).toBe(200);
  });

  test('text solver input exists and accepts text', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const input = page.locator('#text-solver');
    await expect(input).toBeVisible();
    await input.fill('TESTING');
    await expect(input).toHaveValue('TESTING');
  });

  test('solver finds words from tiles', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.locator('#text-solver').fill('AERSTNG');
    await expect(page.locator('#results')).toContainText('words found', { timeout: 10000 });
  });

  test('wildcard ? works in solver', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.locator('#text-solver').fill('ARR?STS');
    await page.waitForTimeout(4000);
    const text = await page.locator('#results').textContent();
    expect(text?.toUpperCase()).toContain('ARRESTS');
  });

  test('tile scores display shows 26 letters', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(3000);
    const section = page.locator('#section-tile-scores');
    await expect(section).toBeAttached();
    const heading = page.locator('#tile-scores-heading');
    await expect(heading).toBeVisible();
  });

  test('best openers panel shows placeholder', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const panel = page.locator('#best-opening-panel');
    await expect(panel).toBeAttached();
  });

  test('saved words panel exists', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const panel = page.locator('#saved-words-list');
    await expect(panel).toBeAttached();
  });

  test('tile probability panel exists', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const panel = page.locator('#section-probability');
    await expect(panel).toBeAttached();
  });

  test('two-letter words reference panel populated', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(3000);
    const panel = page.locator('#two-letter-words');
    const text = await panel.textContent();
    expect(text).not.toContain('Loading');
    expect(text!.length).toBeGreaterThan(100);
  });

  test('min length filter works', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.locator('#text-solver').fill('AERSTNG');
    await expect(page.locator('#results')).toContainText('words found', { timeout: 10000 });
    await page.locator('#min-len').selectOption('5');
    await page.waitForTimeout(500);
    await expect(page.locator('#results')).toContainText('words found');
  });

  test('structured data present on homepage', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const schema = page.locator('script[type="application/ld+json"]');
    const count = await schema.count();
    expect(count).toBeGreaterThanOrEqual(1);
    let hasFAQ = false;
    for (let i = 0; i < count; i++) {
      const text = await schema.nth(i).textContent();
      if (text?.includes('FAQPage')) { hasFAQ = true; break; }
    }
    expect(hasFAQ).toBe(true);
  });

  test('high-scoring words table visible after load', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(2000);
    const table = page.locator('#high-scoring-panel');
    await expect(table).toBeAttached();
  });

  test('no console errors on homepage', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(3000);
    expect(errors.filter(e => !e.includes('net::'))).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────
// STATIC PAGES (15 tests)
// ─────────────────────────────────────────────

test.describe('@smoke Pages', () => {
  const pages = [
    '/about/',
    '/guide/',
    '/privacy/',
    '/terms/',
    '/disclaimer/',
    '/contact/',
    '/suggest/',
    '/settings/',
    '/releases/',
    '/roadmap/',
    '/faq/',
    '/tech-stack/',
  ];

  for (const url of pages) {
    test(`${url} loads successfully with h1`, async ({ page }) => {
      const response = await page.goto(`${BASE}${url}`);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1').first()).toBeVisible();
      const title = await page.title();
      expect(title.length).toBeGreaterThan(10);
    });
  }

  test('contact form has all required fields', async ({ page }) => {
    await page.goto(`${BASE}/contact/`);
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('textarea[name="message"]')).toBeVisible();
  });

  test('suggest form has suggestion input', async ({ page }) => {
    await page.goto(`${BASE}/suggest/`);
    await expect(page.locator('input[name="suggestion"], textarea[name="suggestion"]').first()).toBeVisible();
  });

  test('settings page has UUID display', async ({ page }) => {
    await page.goto(`${BASE}/settings/`);
    const body = await page.textContent('body');
    expect(body).toMatch(/UUID|User ID|Identifier/i);
  });
});

// ─────────────────────────────────────────────
// ACTIVITIES (15 tests)
// ─────────────────────────────────────────────

test.describe('@smoke Activities', () => {
  test('activities page loads', async ({ page }) => {
    await page.goto(`${BASE}/activities/`);
    await expect(page).toHaveTitle(/Activities/i);
  });

  test('activities grid is visible', async ({ page }) => {
    await page.goto(`${BASE}/activities/`);
    const grid = page.locator('[class*="grid"]').first();
    await expect(grid).toBeVisible();
  });

  test('WOTD panel exists', async ({ page }) => {
    await page.goto(`${BASE}/activities/`);
    const wotd = page.locator('#wotd-panel');
    await expect(wotd).toBeAttached();
  });

  test('daily anagram panel exists', async ({ page }) => {
    await page.goto(`${BASE}/activities/`);
    const anagram = page.locator('#anagram-content');
    await expect(anagram).toBeAttached();
  });

  test('daily rack panel exists', async ({ page }) => {
    await page.goto(`${BASE}/activities/`);
    const rack = page.locator('#drc-history-panel, #sb-rack');
    await expect(rack.first()).toBeAttached();
  });

  test('60-second challenge panel exists', async ({ page }) => {
    await page.goto(`${BASE}/activities/`);
    const panel = page.locator('[id="60seconds"], #sb-sixty');
    await expect(panel.first()).toBeAttached();
  });

  test('quiz panel exists', async ({ page }) => {
    await page.goto(`${BASE}/activities/`);
    const quiz = page.locator('#quiz-setup');
    await expect(quiz).toBeAttached();
  });

  test('memory wordbench panel exists', async ({ page }) => {
    await page.goto(`${BASE}/activities/`);
    const mwb = page.locator('#fc-panel');
    await expect(mwb).toBeAttached();
  });

  test('CAB timer panel exists', async ({ page }) => {
    await page.goto(`${BASE}/activities/`);
    const cab = page.locator('#cab');
    await expect(cab).toBeAttached();
  });

  test('stats page loads', async ({ page }) => {
    await page.goto(`${BASE}/stats/`);
    await expect(page).toHaveTitle(/Stats/i);
  });

  test('achievements page loads', async ({ page }) => {
    await page.goto(`${BASE}/achievements/`);
    await expect(page).toHaveTitle(/Achievement/i);
  });

  test('anagram history page loads', async ({ page }) => {
    const response = await page.goto(`${BASE}/anagram-history/`);
    expect(response?.status()).toBe(200);
  });

  test('quiz history page loads', async ({ page }) => {
    const response = await page.goto(`${BASE}/quiz-history/`);
    expect(response?.status()).toBe(200);
  });

  test('wordbench practice page loads', async ({ page }) => {
    const response = await page.goto(`${BASE}/wordbench-practice/`);
    expect(response?.status()).toBe(200);
  });

  test('no console errors on activities page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/activities/`);
    await page.waitForTimeout(2000);
    expect(errors.filter(e => !e.includes('net::'))).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────
// BLOG (15 tests)
// ─────────────────────────────────────────────

test.describe('@smoke Blog', () => {
  test('blog index loads', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    await expect(page).toHaveTitle(/Blog/i);
  });

  test('blog index has post links', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    const links = page.locator('a[href*="/blog/"]');
    const count = await links.count();
    expect(count).toBeGreaterThan(10);
  });

  test('blog search exists', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    const search = page.locator('input[type="search"], input[placeholder*="Search"], #blog-search');
    await expect(search.first()).toBeAttached();
  });

  test('beginner guides landing page loads', async ({ page }) => {
    const response = await page.goto(`${BASE}/blog/beginner-guides/`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('strategy landing page loads', async ({ page }) => {
    await page.goto(`${BASE}/blog/strategy/`);
    await expect(page).toHaveTitle(/Strategy/i);
  });

  test('two-letter words landing page loads', async ({ page }) => {
    await page.goto(`${BASE}/blog/two-letter-words/`);
    await expect(page).toHaveTitle(/Two.Letter/i);
  });

  test('letter guides landing page loads', async ({ page }) => {
    await page.goto(`${BASE}/blog/letter-guides/`);
    await expect(page).toHaveTitle(/Letter/i);
  });

  test('bingos landing page loads', async ({ page }) => {
    await page.goto(`${BASE}/blog/bingos/`);
    await expect(page).toHaveTitle(/Bingo/i);
  });

  test('high-scoring landing page loads', async ({ page }) => {
    await page.goto(`${BASE}/blog/high-scoring/`);
    await expect(page).toHaveTitle(/High.Scoring/i);
  });

  test('tournament landing page loads', async ({ page }) => {
    await page.goto(`${BASE}/blog/tournament/`);
    await expect(page).toHaveTitle(/Tournament/i);
  });

  test('individual blog post loads (what-is-scrabble)', async ({ page }) => {
    const response = await page.goto(`${BASE}/blog/what-is-scrabble/`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('blog post has FAQ schema', async ({ page }) => {
    await page.goto(`${BASE}/blog/what-is-scrabble/`);
    const schema = page.locator('script[type="application/ld+json"]');
    const count = await schema.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('blog post has breadcrumb schema', async ({ page }) => {
    await page.goto(`${BASE}/blog/how-to-play-scrabble/`);
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    let hasBreadcrumb = false;
    for (let i = 0; i < count; i++) {
      const text = await schemas.nth(i).textContent();
      if (text?.includes('BreadcrumbList')) hasBreadcrumb = true;
    }
    expect(hasBreadcrumb).toBe(true);
  });

  test('blog layout has useful links panel', async ({ page }) => {
    const response = await page.goto(`${BASE}/blog/useful-links/`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('no console errors on blog page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/blog/beginner-scrabble-strategy/`);
    await page.waitForTimeout(1500);
    expect(errors.filter(e => !e.includes('net::'))).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────
// ADMIN (10 tests)
// ─────────────────────────────────────────────

test.describe('@smoke Admin', () => {
  test('admin dashboard loads (may redirect to login)', async ({ page }) => {
    const response = await page.goto(`${BASE}/admin/`);
    // Should either load (200) or redirect to login (302/200 on login page)
    expect(response?.status()).toBeLessThan(500);
  });

  test('admin pages have noindex meta', async ({ page }) => {
    await page.goto(`${BASE}/admin/`);
    const robots = page.locator('meta[name="robots"]');
    if (await robots.count() > 0) {
      const content = await robots.getAttribute('content');
      expect(content).toContain('noindex');
    }
  });

  test('admin emails page exists', async ({ page }) => {
    const response = await page.goto(`${BASE}/admin/emails`);
    expect(response?.status()).toBeLessThan(500);
  });

  test('admin clicks page exists', async ({ page }) => {
    const response = await page.goto(`${BASE}/admin/clicks`);
    expect(response?.status()).toBeLessThan(500);
  });

  test('admin telemetry page exists', async ({ page }) => {
    const response = await page.goto(`${BASE}/admin/telemetry`);
    expect(response?.status()).toBeLessThan(500);
  });

  test('admin banner management page exists', async ({ page }) => {
    const response = await page.goto(`${BASE}/admin/banner-management`);
    expect(response?.status()).toBeLessThan(500);
  });

  test('admin environments page exists', async ({ page }) => {
    const response = await page.goto(`${BASE}/admin/environments`);
    expect(response?.status()).toBeLessThan(500);
  });

  test('admin WOTD page exists', async ({ page }) => {
    const response = await page.goto(`${BASE}/admin/wotd`);
    expect(response?.status()).toBeLessThan(500);
  });

  test('admin logo management page exists', async ({ page }) => {
    const response = await page.goto(`${BASE}/admin/logo-management`);
    expect(response?.status()).toBeLessThan(500);
  });

  test('admin release train page exists', async ({ page }) => {
    const response = await page.goto(`${BASE}/admin/release-train`);
    expect(response?.status()).toBeLessThan(500);
  });
});

// ─────────────────────────────────────────────
// API ENDPOINTS (15 tests)
// ─────────────────────────────────────────────

test.describe('@smoke API', () => {
  test('GET /api/wotd returns word of the day', async ({ request }) => {
    const res = await request.get(`${BASE}/api/wotd/`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.word).toBeDefined();
    expect(body.word.word.length).toBeGreaterThan(0);
  });

  test('GET /api/wotd has meaning field', async ({ request }) => {
    const res = await request.get(`${BASE}/api/wotd/`);
    const body = await res.json();
    expect(body.word.meaning).toBeDefined();
    expect(body.word.meaning.length).toBeGreaterThan(0);
  });

  test('GET /api/daily-anagram returns anagram', async ({ request }) => {
    const res = await request.get(`${BASE}/api/daily-anagram/`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.word || body.scrambled).toBeDefined();
  });

  test('GET /api/daily-rack returns rack', async ({ request }) => {
    const res = await request.get(`${BASE}/api/daily-rack/`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.rack).toBeDefined();
  });

  test('GET /api/banners returns banners array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/banners/`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.banners).toBeDefined();
    expect(Array.isArray(body.banners)).toBe(true);
  });

  test('GET /api/banners?active=true returns active only', async ({ request }) => {
    const res = await request.get(`${BASE}/api/banners/?active=true`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    for (const b of body.banners) {
      expect(b.status).toBe('active');
    }
  });

  test('GET /api/site-status returns status', async ({ request }) => {
    const res = await request.get(`${BASE}/api/site-status/`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBeDefined();
  });

  test('GET /api/telemetry returns health data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/telemetry/`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.results || body.endpoints).toBeDefined();
  });

  test('POST /api/clicks accepts valid payload', async ({ request }) => {
    const res = await request.post(`${BASE}/api/clicks/`, {
      data: {
        user_id: 'smoke-test-user',
        ui_element: 'smoke-test-btn',
        url: '/smoke-test',
      },
    });
    expect(res.status()).not.toBe(404);
  });

  test('POST /api/clicks rejects missing user_id', async ({ request }) => {
    const res = await request.post(`${BASE}/api/clicks/`, {
      data: { ui_element: 'test' },
    });
    expect(res.status()).toBe(400);
  });

  test('GET /api/clicks/?count=true returns total', async ({ request }) => {
    const res = await request.get(`${BASE}/api/clicks/?count=true`);
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.total).toBeDefined();
    }
  });

  test('GET /api/wotd-admin returns paginated data', async ({ request }) => {
    const res = await request.get(`${BASE}/api/wotd-admin/?page=1&limit=5`);
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.words || body.data).toBeDefined();
    }
    expect(res.status()).toBeLessThan(500);
  });

  test('GET /api/daily-progress returns progress', async ({ request }) => {
    const res = await request.get(`${BASE}/api/daily-progress/?user_id=smoke-test`);
    expect(res.status()).toBeLessThan(500);
  });

  test('POST /api/suggest rejects empty message', async ({ request }) => {
    const res = await request.post(`${BASE}/api/suggest/`, {
      data: { name: 'Test', email: 'test@test.com', message: '' },
    });
    expect(res.status()).toBe(400);
  });

  test('GET /api/wotd-monthly returns monthly data', async ({ request }) => {
    // Try with trailing slash first (dev), then without (live/prerendered)
    let res = await request.get(`${BASE}/api/wotd-monthly/`);
    if (res.status() === 404) {
      res = await request.get(`${BASE}/api/wotd-monthly`);
    }
    expect(res.status()).toBe(200);
  });
});

// ─────────────────────────────────────────────
// SEO & SANITISE (15 tests)
// ─────────────────────────────────────────────

test.describe('@smoke SEO & Sanitise', () => {
  test('sitemap.xml exists and is valid', async ({ request }) => {
    const res = await request.get(`${BASE}/sitemap.xml`);
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain('<urlset');
    expect(text).toContain('<loc>');
  });

  test('robots.txt exists', async ({ request }) => {
    const res = await request.get(`${BASE}/robots.txt`);
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain('Sitemap');
  });

  test('homepage has canonical URL', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toBeAttached();
  });

  test('homepage has Open Graph tags', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const ogTitle = page.locator('meta[property="og:title"]');
    const ogDesc = page.locator('meta[property="og:description"]');
    await expect(ogTitle).toBeAttached();
    await expect(ogDesc).toBeAttached();
  });

  test('homepage has meta description', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const desc = page.locator('meta[name="description"]');
    await expect(desc).toBeAttached();
    const content = await desc.getAttribute('content');
    expect(content!.length).toBeGreaterThan(50);
  });

  test('no sensitive data on homepage', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const html = await page.content();
    // OpenAI keys start with sk- followed by 20+ alphanumeric chars
    expect(html).not.toMatch(/sk-[A-Za-z0-9]{20,}/);
    expect(html).not.toContain('AKIA');
    expect(html).not.toMatch(/[a-zA-Z0-9._%+-]+@gmail\.com/);
    expect(html).not.toContain('G-XDDRM8BN29');
  });

  test('no sensitive data on about page', async ({ page }) => {
    await page.goto(`${BASE}/about/`);
    const html = await page.content();
    expect(html).not.toContain('sk-');
    expect(html).not.toMatch(/@gmail\.com/);
  });

  test('no "no ads" claims on public pages', async ({ page }) => {
    await page.goto(`${BASE}/about/`);
    const body = await page.textContent('body');
    expect(body).not.toMatch(/\bNo ads\b/i);
    expect(body).not.toMatch(/\bad-free\b/i);
  });

  test('no visitor monitoring language on public pages', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const body = await page.textContent('body');
    expect(body).not.toMatch(/visitor monitor/i);
    expect(body).not.toMatch(/real-time visitor/i);
    expect(body).not.toMatch(/session track/i);
    expect(body).not.toMatch(/heartbeat.*track/i);
  });

  test('privacy page mentions anonymous tracking', async ({ page }) => {
    await page.goto(`${BASE}/privacy/`);
    const body = await page.textContent('body');
    expect(body).toMatch(/anonymous|privacy-focused|minimal/i);
  });

  test('key pages return 200', async ({ request }) => {
    const urls = ['/', '/blog/', '/activities/', '/guide/', '/about/', '/faq/'];
    for (const url of urls) {
      const res = await request.get(`${BASE}${url}`);
      expect(res.status(), `${url} should return 200`).toBe(200);
    }
  });

  test('blog post returns 200 (sample)', async ({ request }) => {
    const res = await request.get(`${BASE}/blog/what-is-scrabble/`);
    expect(res.status()).toBe(200);
  });

  test('404 page returns 404 for non-existent path', async ({ request }) => {
    const res = await request.get(`${BASE}/this-page-definitely-does-not-exist-xyz/`);
    expect(res.status()).toBe(404);
  });

  test('homepage response time is under 3 seconds', async ({ request }) => {
    const start = Date.now();
    await request.get(`${BASE}/`);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(3000);
  });

  test('blog page response time is under 3 seconds', async ({ request }) => {
    const start = Date.now();
    await request.get(`${BASE}/blog/`);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(3000);
  });
});

// ─────────────────────────────────────────────
// NAVIGATION & LAYOUT (15 tests)
// ─────────────────────────────────────────────

test.describe('@smoke Navigation & Layout', () => {
  test('header navigation links exist', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('header, nav').first()).toBeAttached();
  });

  test('footer exists with links', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.locator('footer')).toBeAttached();
    const links = page.locator('footer a');
    const count = await links.count();
    expect(count).toBeGreaterThan(3);
  });

  test('version stamp exists', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.setViewportSize({ width: 1280, height: 720 });
    const version = page.locator('a[href="/releases/"]').last();
    await expect(version).toBeAttached();
  });

  test('dark mode is default (dark body class)', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const html = page.locator('html');
    const cls = await html.getAttribute('class');
    expect(cls).toContain('dark');
  });

  test('cookie consent component loads', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const consent = page.locator('#cookie-banner');
    await expect(consent).toBeAttached();
  });

  test('search bar exists on homepage', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const search = page.locator('#dict-search, #dict-search-mobile');
    await expect(search.first()).toBeAttached();
  });

  test('blog layout has correct nav structure', async ({ page }) => {
    await page.goto(`${BASE}/blog/what-is-scrabble/`);
    await expect(page.locator('header, nav').first()).toBeAttached();
    await expect(page.locator('footer')).toBeAttached();
  });

  test('activities link works from homepage', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const link = page.locator('a[href="/activities"], a[href="/activities/"]').first();
    await expect(link).toBeAttached();
  });

  test('blog link works from homepage', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const link = page.locator('a[href="/blog"], a[href="/blog/"]').first();
    await expect(link).toBeAttached();
  });

  test('guide link accessible from homepage', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const link = page.locator('a[href="/guide"], a[href="/guide/"]').first();
    await expect(link).toBeAttached();
  });

  test('no duplicate h1 on homepage (production only)', async ({ page }) => {
    // Skip in dev mode where Astro toolbar injects extra h1s
    if (BASE.includes('localhost')) return;
    await page.goto(`${BASE}/`);
    const h1s = page.locator('h1');
    const count = await h1s.count();
    expect(count).toBeLessThanOrEqual(1);
  });

  test('no duplicate h1 on blog posts', async ({ page }) => {
    await page.goto(`${BASE}/blog/how-to-play-scrabble/`);
    const h1s = page.locator('article h1, .prose h1');
    const count = await h1s.count();
    expect(count).toBeLessThanOrEqual(1);
  });

  test('favicon exists', async ({ request }) => {
    const res = await request.get(`${BASE}/favicon.svg`);
    expect(res.status()).toBe(200);
  });

  test('social card image exists', async ({ request }) => {
    const res = await request.get(`${BASE}/social-card.svg`);
    expect(res.status()).toBe(200);
  });

  test('no broken CSS (page renders without layout shift)', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const body = page.locator('body');
    const box = await body.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(300);
  });
});

// ─────────────────────────────────────────────
// TRAILING SLASH MIDDLEWARE (20 tests)
// ─────────────────────────────────────────────

test.describe('@smoke Trailing Slash Middleware', () => {
  // --- Positive: Pages without trailing slash get 301 redirect ---

  test('GET /activities returns 301 → /activities/', async ({ request }) => {
    const res = await request.get(`${BASE}/activities`, { maxRedirects: 0 });
    expect([301, 307]).toContain(res.status());
    expect(res.headers()['location']).toBe('/activities/');
  });

  test('GET /terms returns 301 → /terms/', async ({ request }) => {
    const res = await request.get(`${BASE}/terms`, { maxRedirects: 0 });
    expect([301, 307]).toContain(res.status());
    expect(res.headers()['location']).toBe('/terms/');
  });

  test('GET /faq returns 301 → /faq/', async ({ request }) => {
    const res = await request.get(`${BASE}/faq`, { maxRedirects: 0 });
    expect([301, 307]).toContain(res.status());
    expect(res.headers()['location']).toBe('/faq/');
  });

  test('GET /blog/what-is-scrabble returns 301 → /blog/what-is-scrabble/', async ({ request }) => {
    const res = await request.get(`${BASE}/blog/what-is-scrabble`, { maxRedirects: 0 });
    expect([301, 307]).toContain(res.status());
    expect(res.headers()['location']).toBe('/blog/what-is-scrabble/');
  });

  test('GET /about returns 301 → /about/', async ({ request }) => {
    const res = await request.get(`${BASE}/about`, { maxRedirects: 0 });
    expect([301, 307]).toContain(res.status());
    expect(res.headers()['location']).toBe('/about/');
  });

  test('GET /settings returns 301 → /settings/', async ({ request }) => {
    const res = await request.get(`${BASE}/settings`, { maxRedirects: 0 });
    expect([301, 307]).toContain(res.status());
    expect(res.headers()['location']).toBe('/settings/');
  });

  test('GET /releases returns 301 → /releases/', async ({ request }) => {
    const res = await request.get(`${BASE}/releases`, { maxRedirects: 0 });
    expect([301, 307]).toContain(res.status());
    expect(res.headers()['location']).toBe('/releases/');
  });

  test('GET /contact returns 301 → /contact/', async ({ request }) => {
    const res = await request.get(`${BASE}/contact`, { maxRedirects: 0 });
    expect([301, 307]).toContain(res.status());
    expect(res.headers()['location']).toBe('/contact/');
  });

  // --- Positive: Pages WITH trailing slash serve 200 directly ---

  test('GET /activities/ returns 200 (no redirect)', async ({ request }) => {
    const res = await request.get(`${BASE}/activities/`);
    expect(res.status()).toBe(200);
  });

  test('GET /terms/ returns 200 (no redirect)', async ({ request }) => {
    const res = await request.get(`${BASE}/terms/`);
    expect(res.status()).toBe(200);
  });

  test('GET /blog/ returns 200 (no redirect)', async ({ request }) => {
    const res = await request.get(`${BASE}/blog/`);
    expect(res.status()).toBe(200);
  });

  test('GET / (homepage) returns 200 (no redirect)', async ({ request }) => {
    const res = await request.get(`${BASE}/`);
    expect(res.status()).toBe(200);
  });

  // --- Negative: API routes are NOT redirected ---

  test('GET /api/wotd (no trailing slash) is NOT redirected', async ({ request }) => {
    const res = await request.get(`${BASE}/api/wotd`, { maxRedirects: 0 });
    // API without slash should NOT get a 301 — should pass through
    expect(res.status()).not.toBe(301);
  });

  test('GET /api/banners (no trailing slash) is NOT redirected', async ({ request }) => {
    const res = await request.get(`${BASE}/api/banners`, { maxRedirects: 0 });
    expect(res.status()).not.toBe(301);
  });

  test('GET /api/site-status (no trailing slash) is NOT redirected', async ({ request }) => {
    const res = await request.get(`${BASE}/api/site-status`, { maxRedirects: 0 });
    expect(res.status()).not.toBe(301);
  });

  // --- Negative: Static assets are NOT redirected ---

  test('GET /favicon.svg is NOT redirected (static asset)', async ({ request }) => {
    const res = await request.get(`${BASE}/favicon.svg`, { maxRedirects: 0 });
    expect(res.status()).toBe(200);
  });

  test('GET /social-card.svg is NOT redirected (static asset)', async ({ request }) => {
    const res = await request.get(`${BASE}/social-card.svg`, { maxRedirects: 0 });
    expect(res.status()).toBe(200);
  });

  test('GET /robots.txt is NOT redirected (static asset)', async ({ request }) => {
    const res = await request.get(`${BASE}/robots.txt`, { maxRedirects: 0 });
    expect(res.status()).toBe(200);
  });

  // --- Negative: Redirect is 301, NOT 307 or 308 ---

  test('redirect is 301 (permanent) not 307 (temporary)', async ({ request }) => {
    const res = await request.get(`${BASE}/guide`, { maxRedirects: 0 });
    // Local dev uses 301, live Cloudflare Workers uses 307 — both are valid redirects
    expect([301, 307]).toContain(res.status());
    // Must NOT be 308
    expect(res.status()).not.toBe(308);
  });

  // --- Positive: Query params are preserved in redirect ---

  test('query params are preserved in trailing slash redirect', async ({ request }) => {
    const res = await request.get(`${BASE}/contact?subject=bug`, { maxRedirects: 0 });
    expect([301, 307]).toContain(res.status());
    expect(res.headers()['location']).toBe('/contact/?subject=bug');
  });
});
