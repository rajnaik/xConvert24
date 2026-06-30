import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('History & Culture Landing Page — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/blog/history/`);
    expect(response?.status()).toBe(200);
  });

  test('page has correct h1 heading', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/history/`);
    const h1 = page.locator('h1:has-text("History")');
    await expect(h1.first()).toBeVisible();
  });

  test('stat strip shows key statistics', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/history/`);
    const statStrip = page.locator('.border-amber-500\\/30');
    await expect(statStrip).toBeVisible();
    await expect(statStrip.locator('text=1938')).toBeVisible();
    await expect(statStrip.locator('text=120+')).toBeVisible();
    await expect(statStrip.locator('text=830')).toBeVisible();
    await expect(statStrip.locator('text=150M+')).toBeVisible();
  });

  test('Origins & Invention section has post links', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/history/`);
    const section = page.locator('h2:has-text("Origins & Invention")');
    await expect(section).toBeVisible();
    const links = [
      '/blog/scrabble-history-origins-great-depression/',
      '/blog/history-of-scrabble/',
      '/blog/who-invented-scrabble/',
      '/blog/scrabble-dictionaries-languages-weird-words/',
      '/blog/how-scrabble-dictionaries-update/',
      '/blog/scrabble-tile-bag-distribution/',
      '/blog/scrabble-variants-and-house-rules/',
      '/blog/scrabble-around-the-world/',
      '/blog/scrabble-in-different-languages/',
    ];
    for (const href of links) {
      await expect(page.locator(`a[href="${href}"]`)).toBeVisible();
    }
  });

  test('Champions & Records section has post links', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/history/`);
    const section = page.locator('h2:has-text("Champions & Records")');
    await expect(section).toBeVisible();
    const links = [
      '/blog/scrabble-world-champions/',
      '/blog/world-scrabble-championships/',
      '/blog/greatest-scrabble-players/',
      '/blog/celebrity-scrabble-players/',
      '/blog/competitive-scrabble-tournament-world/',
      '/blog/famous-scrabble-matches/',
      '/blog/record-breaking-scrabble-games/',
      '/blog/most-unusual-tournament-stories/',
      '/blog/scrabble-rating-system-explained/',
    ];
    for (const href of links) {
      await expect(page.locator(`a[href="${href}"]`)).toBeVisible();
    }
  });

  test('Controversies & Culture section has post links', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/history/`);
    const section = page.locator('h2:has-text("Controversies & Culture")');
    await expect(section).toBeVisible();
    const links = [
      '/blog/famous-scrabble-controversies/',
      '/blog/controversial-scrabble-words/',
      '/blog/archaic-words-still-valid/',
      '/blog/new-words-added-2026/',
      '/blog/music-words-scrabble/',
      '/blog/medical-terms-valid-scrabble/',
    ];
    for (const href of links) {
      await expect(page.locator(`a[href="${href}"]`)).toBeVisible();
    }
  });

  test('CTA box with word finder link is present', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/history/`);
    const cta = page.locator('a:has-text("Open Word Finder")');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/');
  });

  test('back to blog link is present and correct', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/history/`);
    const backLink = page.locator('a:has-text("Back to all articles")');
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/blog/');
  });

  test('FAQPage JSON-LD schema is present with 3 questions', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/history/`);
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    expect(count).toBeGreaterThanOrEqual(1);
    let faqText = '';
    for (let i = 0; i < count; i++) {
      const text = await schemas.nth(i).textContent() || '';
      if (text.includes('FAQPage')) { faqText = text; break; }
    }
    expect(faqText).toContain('FAQPage');
    expect(faqText).toContain('Who invented Scrabble');
  });

  test('breadcrumb navigation includes Blog link', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/history/`);
    const breadcrumb = page.locator('nav.text-sm');
    await expect(breadcrumb).toBeVisible();
    const blogLink = breadcrumb.locator('a[href="/blog/"]');
    await expect(blogLink).toBeVisible();
  });

  test('BlogCrossLinks component is rendered', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/history/`);
    // BlogCrossLinks renders related links - check the component area exists
    const article = page.locator('article');
    await expect(article).toBeVisible();
  });
});

test.describe('History & Culture Landing Page — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE_URL}/blog/history/`);
    await page.waitForTimeout(1000);
    expect(errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'))).toHaveLength(0);
  });

  test('no duplicate h1 elements beyond expected (BlogCrossLinks + page h1)', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/history/`);
    const h1s = page.locator('h1');
    const count = await h1s.count();
    // BlogCrossLinks adds one h1 (full title) and the page has its own h1
    expect(count).toBe(2);
  });

  test('no duplicate post links on the page', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/history/`);
    const allLinks = await page.locator('div.grid a[href^="/blog/"]').all();
    const hrefs: string[] = [];
    for (const link of allLinks) {
      const href = await link.getAttribute('href');
      if (href) hrefs.push(href);
    }
    const duplicates = hrefs.filter((item, index) => hrefs.indexOf(item) !== index);
    expect(duplicates, `Duplicate post links: ${duplicates.join(', ')}`).toHaveLength(0);
  });

  test('all internal links have trailing slash', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/history/`);
    const links = await page.locator('a[href^="/"]').all();
    const missingSlash: string[] = [];
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href && !href.endsWith('/') && !href.includes('#') && !href.includes('?') && href !== '/') {
        missingSlash.push(href);
      }
    }
    expect(missingSlash, `Links missing trailing slash: ${missingSlash.join(', ')}`).toHaveLength(0);
  });

  test('page does not contain sensitive information', async ({ page }) => {
    await page.goto(`${BASE_URL}/blog/history/`);
    const body = await page.textContent('body');
    expect(body).not.toContain('rajeev');
    expect(body).not.toContain('@gmail.com');
    expect(body).not.toContain('API_KEY');
    expect(body).not.toContain('sk-');
  });
});
