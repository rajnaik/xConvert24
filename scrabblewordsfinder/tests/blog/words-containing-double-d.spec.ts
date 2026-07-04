import { test, expect } from '@playwright/test';

const PAGE = '/blog/words-containing-double-d/';

test.describe('Words Containing Double D — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('h1 heading is visible with correct text', async ({ page }) => {
    await page.goto(PAGE);
    const h1 = page.locator('h1:has-text("Words Containing Double D")');
    await expect(h1.first()).toBeVisible();
  });

  test('breadcrumb nav links to Letter Guides category', async ({ page }) => {
    await page.goto(PAGE);
    const categoryLink = page.locator('nav a[href="/blog/letter-guides/"]');
    await expect(categoryLink).toBeVisible();
    await expect(categoryLink).toContainText('Letter Guides');
  });

  test('DD at a Glance stats card is visible with key figures', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('p:has-text("4 pts")')).toBeVisible();
    await expect(page.locator('p:has-text("200+")')).toBeVisible();
    await expect(page.locator('p:has-text("DD base value")')).toBeVisible();
  });

  test('top scoring DD words table has expected words', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table');
    await expect(table).toBeVisible();
    await expect(table.locator('td:text-is("WADDING")')).toBeVisible();
    await expect(table.locator('td:text-is("SHUDDER")')).toBeVisible();
    await expect(table.locator('td:text-is("LADDER")')).toBeVisible();
    await expect(table.locator('td:text-is("MIDDLE")')).toBeVisible();
  });

  test('short DD words pills section shows compact words', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('span.font-bold:text-is("ADD")')).toBeVisible();
    await expect(page.locator('span.font-bold:text-is("ODD")')).toBeVisible();
    await expect(page.locator('span.font-bold:text-is("BUDDY")')).toBeVisible();
  });

  test('DD strategy tips section has 4 tip cards', async ({ page }) => {
    await page.goto(PAGE);
    const tipCards = page.locator('span.text-purple-400.font-semibold');
    expect(await tipCards.count()).toBe(4);
  });

  test('DD pattern groups section shows 4 pattern categories', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('p:has-text("-DDLE Words")')).toBeVisible();
    await expect(page.locator('p:has-text("-DDY Words")')).toBeVisible();
    await expect(page.locator('p:has-text("-DDER Words")')).toBeVisible();
    await expect(page.locator('p:has-text("-DDED Words")')).toBeVisible();
  });

  test('Dig Deeper cross-link section has internal links', async ({ page }) => {
    await page.goto(PAGE);
    const digDeeper = page.locator('text=Dig Deeper').locator('..');
    await expect(digDeeper).toBeVisible();
    await expect(digDeeper.locator('a[href="/blog/words-containing-double-b/"]')).toBeVisible();
    await expect(digDeeper.locator('a[href="/blog/words-containing-double-n/"]')).toBeVisible();
  });

  test('related articles section has at least 3 links', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside:has-text("Related Articles")');
    await expect(aside).toBeVisible();
    const links = aside.locator('a');
    expect(await links.count()).toBeGreaterThanOrEqual(3);
  });

  test('CTA box links to word finder', async ({ page }) => {
    await page.goto(PAGE);
    const cta = page.locator('a:has-text("Open Word Finder")');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/');
  });

  test('back to blog link is present', async ({ page }) => {
    await page.goto(PAGE);
    const backLink = page.locator('a:has-text("Back to all articles")');
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/blog/');
  });
});

test.describe('Words Containing Double D — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate scoring tables', async ({ page }) => {
    await page.goto(PAGE);
    const tables = page.locator('table');
    await expect(tables).toHaveCount(1);
  });

  test('page does not link to itself', async ({ page }) => {
    await page.goto(PAGE);
    const selfLinks = page.locator(`a[href="${PAGE}"]`);
    await expect(selfLinks).toHaveCount(0);
  });

  test('all internal blog links have trailing slashes', async ({ page }) => {
    await page.goto(PAGE);
    const internalLinks = page.locator('article a[href^="/blog/"]');
    const count = await internalLinks.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const href = await internalLinks.nth(i).getAttribute('href');
      expect(href, `Link "${href}" missing trailing slash`).toMatch(/\/$/);
    }
  });

  test('FAQPage schema exists in page source', async ({ page }) => {
    await page.goto(PAGE);
    const html = await page.content();
    expect(html).toContain('"@type":"FAQPage"');
  });

  test('Article schema exists in page source', async ({ page }) => {
    await page.goto(PAGE);
    const html = await page.content();
    expect(html).toContain('"@type":"Article"');
  });

  test('FAQPage schema has at least 3 questions', async ({ page }) => {
    await page.goto(PAGE);
    const html = await page.content();
    const faqMatches = html.match(/"@type":"Question"/g);
    expect(faqMatches).not.toBeNull();
    expect(faqMatches!.length).toBeGreaterThanOrEqual(3);
  });
});
