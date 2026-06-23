import { test, expect } from '@playwright/test';

/**
 * Words Containing Landing Page — /blog/words-containing/
 * Tests the stat strip and letter pair grid sections added to the landing page.
 */

test.describe('Words Containing Landing — Stat Strip — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto('/blog/words-containing/');
    expect(response?.status()).toBe(200);
  });

  test('stat strip container is visible', async ({ page }) => {
    await page.goto('/blog/words-containing/');
    const strip = page.locator('.border-emerald-500\\/30');
    await expect(strip).toBeVisible();
  });

  test('stat strip shows 127 Guides', async ({ page }) => {
    await page.goto('/blog/words-containing/');
    const stat = page.locator('.border-emerald-500\\/30 .text-emerald-400:has-text("127")');
    await expect(stat).toBeVisible();
    const label = stat.locator('~ p');
    await expect(label).toContainText('Guides');
  });

  test('stat strip shows 26 Starting Letters', async ({ page }) => {
    await page.goto('/blog/words-containing/');
    const stat = page.locator('.border-emerald-500\\/30 .text-emerald-400:has-text("26")');
    await expect(stat).toBeVisible();
  });

  test('stat strip shows 12 Double Letters', async ({ page }) => {
    await page.goto('/blog/words-containing/');
    const stat = page.locator('.border-emerald-500\\/30 .text-emerald-400', { hasText: /^12$/ });
    await expect(stat).toBeVisible();
  });

  test('stat strip shows 8 Digraphs', async ({ page }) => {
    await page.goto('/blog/words-containing/');
    const stat = page.locator('.border-emerald-500\\/30 .text-emerald-400:has-text("8")');
    await expect(stat).toBeVisible();
  });

  test('stat strip has exactly 4 stat items', async ({ page }) => {
    await page.goto('/blog/words-containing/');
    const stats = page.locator('.border-emerald-500\\/30 .text-2xl.font-bold.text-emerald-400');
    await expect(stats).toHaveCount(4);
  });
});

test.describe('Words Containing Landing — Pairs Starting with A — Positive', () => {

  test('h2 heading "Pairs Starting with A" is visible', async ({ page }) => {
    await page.goto('/blog/words-containing/');
    const heading = page.locator('h2:has-text("Pairs Starting with A")');
    await expect(heading).toBeVisible();
  });

  test('heading has amber left border styling', async ({ page }) => {
    await page.goto('/blog/words-containing/');
    const heading = page.locator('h2.border-l-4.border-amber-400:has-text("Pairs Starting with A")');
    await expect(heading).toBeVisible();
  });

  test('grid contains link to AA pair', async ({ page }) => {
    await page.goto('/blog/words-containing/');
    const link = page.locator('a[href="/blog/words-containing-aa/"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText('AA');
  });

  test('grid contains link to AZ pair', async ({ page }) => {
    await page.goto('/blog/words-containing/');
    const link = page.locator('a[href="/blog/words-containing-az/"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText('AZ');
  });

  test('grid contains "All Five Vowels" special link', async ({ page }) => {
    await page.goto('/blog/words-containing/');
    const link = page.locator('a[href="/blog/words-containing-all-five-vowels/"]');
    await expect(link).toBeVisible();
    await expect(link).toContainText('All Five Vowels');
  });

  test('All Five Vowels link spans 2 columns', async ({ page }) => {
    await page.goto('/blog/words-containing/');
    const link = page.locator('a[href="/blog/words-containing-all-five-vowels/"]');
    await expect(link).toHaveClass(/col-span-2/);
  });

  test('grid has 27 total links (26 pairs + All Five Vowels)', async ({ page }) => {
    await page.goto('/blog/words-containing/');
    const heading = page.locator('h2:has-text("Pairs Starting with A")');
    const grid = heading.locator('~ div.grid').first();
    const links = grid.locator('a');
    await expect(links).toHaveCount(27);
  });

  test('grid uses responsive column layout', async ({ page }) => {
    await page.goto('/blog/words-containing/');
    const grid = page.locator('.grid.grid-cols-2.sm\\:grid-cols-3.md\\:grid-cols-4').first();
    await expect(grid).toBeVisible();
  });
});

test.describe('Words Containing Landing — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/blog/words-containing/');
    await page.waitForTimeout(500);
    expect(errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'))).toHaveLength(0);
  });

  test('no duplicate stat strip sections', async ({ page }) => {
    await page.goto('/blog/words-containing/');
    const strips = page.locator('.border-emerald-500\\/30');
    await expect(strips).toHaveCount(1);
  });

  test('no empty href attributes in the A-pairs grid', async ({ page }) => {
    await page.goto('/blog/words-containing/');
    const heading = page.locator('h2:has-text("Pairs Starting with A")');
    const grid = heading.locator('~ div.grid').first();
    const emptyLinks = grid.locator('a[href=""]');
    await expect(emptyLinks).toHaveCount(0);
  });

  test('all grid links have trailing slash', async ({ page }) => {
    await page.goto('/blog/words-containing/');
    const heading = page.locator('h2:has-text("Pairs Starting with A")');
    const grid = heading.locator('~ div.grid').first();
    const links = await grid.locator('a').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      expect(href?.endsWith('/'), `Link "${href}" should end with /`).toBe(true);
    }
  });

  test('no duplicate links in the A-pairs grid', async ({ page }) => {
    await page.goto('/blog/words-containing/');
    const heading = page.locator('h2:has-text("Pairs Starting with A")');
    const grid = heading.locator('~ div.grid').first();
    const links = await grid.locator('a').all();
    const hrefs: string[] = [];
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href) hrefs.push(href);
    }
    const duplicates = hrefs.filter((item, index) => hrefs.indexOf(item) !== index);
    expect(duplicates, `Duplicate links: ${duplicates.join(', ')}`).toHaveLength(0);
  });

  test('page does not show undefined or raw template expressions', async ({ page }) => {
    await page.goto('/blog/words-containing/');
    // Check visible text only (innerText ignores hidden elements and scripts)
    const visibleText = await page.locator('.max-w-3xl').first().innerText();
    expect(visibleText).not.toContain('${');
    expect(visibleText).not.toContain('NaN');
  });
});
