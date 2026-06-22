import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('WOTD Archive Index — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(`${BASE}/blog/wotd/`);
    expect(response?.status()).toBe(200);
  });

  test('page has correct h1 heading', async ({ page }) => {
    await page.goto(`${BASE}/blog/wotd/`);
    const h1 = page.locator('article h1');
    await expect(h1).toContainText('Word of the Day Archive');
  });

  test('breadcrumb navigation has Blog link', async ({ page }) => {
    await page.goto(`${BASE}/blog/wotd/`);
    const breadcrumb = page.locator('nav.text-sm');
    await expect(breadcrumb).toBeVisible();
    const blogLink = breadcrumb.locator('a[href="/blog/"]');
    await expect(blogLink).toBeVisible();
  });

  test('revealed months section shows month cards with checkmark', async ({ page }) => {
    await page.goto(`${BASE}/blog/wotd/`);
    // Revealed cards have the ✓ Revealed label
    const revealedCards = page.locator('a.p-4.rounded-xl:has-text("Revealed")');
    const count = await revealedCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('revealed month cards link to /blog/wotd/YYYY-MM/ format', async ({ page }) => {
    await page.goto(`${BASE}/blog/wotd/`);
    const revealedCards = page.locator('a.p-4.rounded-xl:has-text("Revealed")');
    const first = revealedCards.first();
    const href = await first.getAttribute('href');
    expect(href).toMatch(/^\/blog\/wotd\/\d{4}-\d{2}\/$/);
  });

  test('current month is shown in the revealed section (not "Coming Soon")', async ({ page }) => {
    await page.goto(`${BASE}/blog/wotd/`);
    const now = new Date();
    const currentMonthName = now.toLocaleString('en-US', { month: 'long' });
    const currentYear = now.getFullYear();

    // Current month should be in the revealed section (purple border cards)
    const revealedSection = page.locator('a.border-purple-500\\/30');
    const allText = await revealedSection.allTextContents();
    const hasCurrentMonth = allText.some(t => t.includes(currentMonthName) && t.includes(String(currentYear)));
    expect(hasCurrentMonth).toBe(true);
  });

  test('future months section does NOT include the current month', async ({ page }) => {
    await page.goto(`${BASE}/blog/wotd/`);
    const now = new Date();
    const currentMonthName = now.toLocaleString('en-US', { month: 'long' });
    const currentYear = now.getFullYear();

    // "Coming Soon" cards use gray border styling
    const futureCards = page.locator('a.border-gray-700');
    const count = await futureCards.count();

    if (count > 0) {
      const futureTexts = await futureCards.allTextContents();
      // Current month should NOT appear in the future/locked section
      const currentMonthInFuture = futureTexts.some(t => t.includes(currentMonthName) && t.includes(String(currentYear)));
      expect(currentMonthInFuture).toBe(false);
    }
  });

  test('"See today\'s Word of the Day" CTA links to /activities/', async ({ page }) => {
    await page.goto(`${BASE}/blog/wotd/`);
    const ctaLink = page.locator('a:has-text("Open Activities")');
    await expect(ctaLink).toBeVisible();
    await expect(ctaLink).toHaveAttribute('href', '/activities/');
  });

  test('back to blog link is present at bottom', async ({ page }) => {
    await page.goto(`${BASE}/blog/wotd/`);
    const backLink = page.locator('a:has-text("Back to all articles")');
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/blog/');
  });

  test('year headings are displayed for revealed months', async ({ page }) => {
    await page.goto(`${BASE}/blog/wotd/`);
    const yearHeadings = page.locator('article h2.border-l-4.border-blue-400');
    const count = await yearHeadings.count();
    expect(count).toBeGreaterThan(0);
    // Year headings should contain 4-digit year
    const firstText = await yearHeadings.first().textContent();
    expect(firstText).toMatch(/\d{4}/);
  });
});

test.describe('WOTD Archive Index — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/blog/wotd/`);
    await page.waitForTimeout(1000);
    expect(errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'))).toHaveLength(0);
  });

  test('no duplicate h1 elements', async ({ page }) => {
    await page.goto(`${BASE}/blog/wotd/`);
    const h1Count = await page.locator('article h1').count();
    expect(h1Count).toBe(1);
  });

  test('no month card appears in both revealed and future sections', async ({ page }) => {
    await page.goto(`${BASE}/blog/wotd/`);
    const revealedCards = page.locator('a.border-purple-500\\/30');
    const futureCards = page.locator('a.border-gray-700');

    const revealedHrefs = await revealedCards.evaluateAll(els => els.map(el => el.getAttribute('href')));
    const futureHrefs = await futureCards.evaluateAll(els => els.map(el => el.getAttribute('href')));

    const overlap = revealedHrefs.filter(h => futureHrefs.includes(h));
    expect(overlap).toHaveLength(0);
  });

  test('future months are strictly after current month', async ({ page }) => {
    await page.goto(`${BASE}/blog/wotd/`);
    const futureCards = page.locator('a.border-gray-700');
    const count = await futureCards.count();

    if (count > 0) {
      const now = new Date();
      const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const hrefs = await futureCards.evaluateAll(els => els.map(el => el.getAttribute('href')));
      for (const href of hrefs) {
        // Extract YYYY-MM from /blog/wotd/YYYY-MM/
        const match = href?.match(/\/blog\/wotd\/(\d{4}-\d{2})\//);
        if (match) {
          expect(match[1] > currentYM, `Future month ${match[1]} should be after current ${currentYM}`).toBe(true);
        }
      }
    }
  });

  test('no broken internal links', async ({ page }) => {
    await page.goto(`${BASE}/blog/wotd/`);
    const links = await page.locator('article a[href]').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href && !href.startsWith('http')) {
        expect(href?.startsWith('/'), `Link "${href}" should start with /`).toBe(true);
      }
    }
  });

  test('"Coming Soon" heading only appears when future months exist', async ({ page }) => {
    await page.goto(`${BASE}/blog/wotd/`);
    const comingSoonHeading = page.locator('h2:has-text("Coming Soon")');
    const futureCards = page.locator('a.border-gray-700');
    const futureCount = await futureCards.count();

    if (futureCount === 0) {
      await expect(comingSoonHeading).not.toBeVisible();
    } else {
      await expect(comingSoonHeading).toBeVisible();
    }
  });
});
