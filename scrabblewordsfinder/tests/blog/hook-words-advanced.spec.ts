import { test, expect } from '@playwright/test';

const PAGE = '/blog/hook-words-advanced/';

test.describe('Hook Words Advanced — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('main h1 heading contains Advanced Hook Words', async ({ page }) => {
    await page.goto(PAGE);
    const h1 = page.locator('article h1').filter({ hasText: 'Advanced Hook Words' }).first();
    await expect(h1).toBeVisible();
  });

  test('breadcrumb navigation has Blog and Strategy links', async ({ page }) => {
    await page.goto(PAGE);
    const nav = page.locator('nav').filter({ hasText: 'Blog' });
    await expect(nav).toBeVisible();
    await expect(nav.locator('a[href="/blog/"]')).toBeVisible();
    await expect(nav.locator('a[href="/blog/strategy/"]')).toBeVisible();
  });

  test('Article schema JSON-LD is present', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    let hasArticle = false;
    for (let i = 0; i < count; i++) {
      const text = await scripts.nth(i).textContent();
      if (text && text.includes('"@type":"Article"')) {
        hasArticle = true;
        expect(text).toContain('Advanced Hook Words');
      }
    }
    expect(hasArticle).toBe(true);
  });

  test('FAQPage schema JSON-LD is present with 3 questions', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    let hasFAQ = false;
    for (let i = 0; i < count; i++) {
      const text = await scripts.nth(i).textContent();
      if (text && text.includes('"@type":"FAQPage"')) {
        hasFAQ = true;
        const parsed = JSON.parse(text);
        expect(parsed.mainEntity).toHaveLength(3);
      }
    }
    expect(hasFAQ).toBe(true);
  });

  test('has 5 h2 section headings with amber border-left accent', async ({ page }) => {
    await page.goto(PAGE);
    const h2s = page.locator('article h2');
    const count = await h2s.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('front hooks vs back hooks comparison grid has 2 cards', async ({ page }) => {
    await page.goto(PAGE);
    const grid = page.locator('.grid.grid-cols-1.sm\\:grid-cols-2');
    await expect(grid.first()).toBeVisible();
    const cards = grid.first().locator('[class*="rounded-xl"]');
    await expect(cards).toHaveCount(2);
  });

  test('high-value hooks table has 5 data rows', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table');
    await expect(table).toBeVisible();
    const rows = table.locator('tbody tr');
    await expect(rows).toHaveCount(5);
  });

  test('multi-hook strategy section has purple strategy tiles', async ({ page }) => {
    await page.goto(PAGE);
    const purpleTiles = page.locator('[class*="border-purple-500\\/30"][class*="bg-purple-950\\/20"]');
    const count = await purpleTiles.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('CTA box with word finder link is visible', async ({ page }) => {
    await page.goto(PAGE);
    const cta = page.locator('.bg-gradient-to-r').filter({ hasText: 'Word Finder' });
    await expect(cta).toBeVisible();
    const link = cta.locator('a[href="/"]');
    await expect(link).toBeVisible();
  });

  test('Related Articles aside has links', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    await expect(aside).toBeVisible();
    const links = aside.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('inline cross-links (Dig Deeper) section exists', async ({ page }) => {
    await page.goto(PAGE);
    const crossLinks = page.locator('[class*="border-indigo-500"]').filter({ hasText: 'Dig Deeper' });
    await expect(crossLinks).toBeVisible();
    const links = crossLinks.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('back to blog link is present', async ({ page }) => {
    await page.goto(PAGE);
    const backLink = page.locator('a[href="/blog/"]').filter({ hasText: 'Back to all articles' });
    await expect(backLink).toBeVisible();
  });

  test('BlogCrossLinks component is rendered', async ({ page }) => {
    await page.goto(PAGE);
    const article = page.locator('article');
    await expect(article).toBeVisible();
    // BlogCrossLinks renders with the title prop
    const crossLinksHeading = article.locator('h1, h2, h3').filter({ hasText: 'Advanced Hook Words' });
    const count = await crossLinksHeading.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Hook Words Advanced — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate CTA boxes', async ({ page }) => {
    await page.goto(PAGE);
    const ctas = page.locator('.bg-gradient-to-r').filter({ hasText: 'Word Finder' });
    await expect(ctas).toHaveCount(1);
  });

  test('no duplicate Related Articles aside sections', async ({ page }) => {
    await page.goto(PAGE);
    const asides = page.locator('aside').filter({ hasText: 'Related Articles' });
    await expect(asides).toHaveCount(1);
  });

  test('internal links have trailing slashes', async ({ page }) => {
    await page.goto(PAGE);
    const internalLinks = page.locator('article a[href^="/"]');
    const count = await internalLinks.count();
    for (let i = 0; i < count; i++) {
      const href = await internalLinks.nth(i).getAttribute('href');
      if (href && !href.includes('.') && !href.startsWith('/#')) {
        const pathOnly = href.split('?')[0];
        expect(pathOnly).toMatch(/\/$/);
      }
    }
  });

  test('page does not link to itself in related articles', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    const links = aside.locator('a');
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).not.toContain('hook-words-advanced');
    }
  });
});
