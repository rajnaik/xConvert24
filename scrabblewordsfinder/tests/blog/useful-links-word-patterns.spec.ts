import { test, expect } from '@playwright/test';

/**
 * Useful Links Page — "Word Patterns & Efficiency" Orphan Category Tests
 * Verifies the new category added to the orphanCategories array renders correctly
 * with all 15 expected blog post links, proper structure, and no regressions.
 */

const CATEGORY_NAME = 'Word Patterns & Efficiency';
const EXPECTED_LINKS = [
  'words-ending-with-j',
  'useful-y-words',
  'useful-v-words',
  'useful-c-words',
  'useful-k-words',
  'words-using-only-consonants',
  'words-with-four-vowels-in-row',
  'words-rare-letter-combinations',
  'words-alternating-vowels-consonants',
  'words-from-bingo-stems',
  'short-words-high-point-values',
  'long-words-low-point-values',
  'words-worth-over-20-points',
  'words-ending-with-v',
  'words-ending-with-c',
];

test.describe('Useful Links — Word Patterns & Efficiency — Positive', () => {

  test('category section exists on the page', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const section = page.locator(`summary:has-text("${CATEGORY_NAME}")`);
    await expect(section).toBeVisible();
  });

  test('category displays the lightning bolt icon', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const summary = page.locator(`summary:has-text("${CATEGORY_NAME}")`);
    await expect(summary).toContainText('⚡');
  });

  test('category shows correct post count (15 posts)', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const summary = page.locator(`summary:has-text("${CATEGORY_NAME}")`);
    await expect(summary.locator('.text-xs.text-gray-500')).toContainText('15 posts');
  });

  test('section is a collapsible details element', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const details = page.locator(`details:has(summary:has-text("${CATEGORY_NAME}"))`);
    await expect(details).toBeAttached();
  });

  test('expanding the section reveals blog post links', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const details = page.locator(`details:has(summary:has-text("${CATEGORY_NAME}"))`);
    if ((await details.getAttribute('open')) === null) {
      await details.locator('summary').click();
    }
    const links = details.locator('a[href^="/blog/"]');
    const count = await links.count();
    expect(count).toBe(15);
  });

  test('contains link to words-ending-with-j', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const details = page.locator(`details:has(summary:has-text("${CATEGORY_NAME}"))`);
    if ((await details.getAttribute('open')) === null) {
      await details.locator('summary').click();
    }
    await expect(details.locator('a[href="/blog/words-ending-with-j/"]')).toBeAttached();
  });

  test('contains link to words-worth-over-20-points', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const details = page.locator(`details:has(summary:has-text("${CATEGORY_NAME}"))`);
    if ((await details.getAttribute('open')) === null) {
      await details.locator('summary').click();
    }
    await expect(details.locator('a[href="/blog/words-worth-over-20-points/"]')).toBeAttached();
  });

  test('all 15 expected links are present', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const details = page.locator(`details:has(summary:has-text("${CATEGORY_NAME}"))`);
    if ((await details.getAttribute('open')) === null) {
      await details.locator('summary').click();
    }
    for (const slug of EXPECTED_LINKS) {
      await expect(details.locator(`a[href="/blog/${slug}/"]`)).toBeAttached();
    }
  });

  test('links use grid layout with responsive columns', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const details = page.locator(`details:has(summary:has-text("${CATEGORY_NAME}"))`);
    if ((await details.getAttribute('open')) === null) {
      await details.locator('summary').click();
    }
    const grid = details.locator('.grid');
    await expect(grid).toBeAttached();
  });
});

test.describe('Useful Links — Word Patterns & Efficiency — Negative', () => {

  test('no page errors when expanding the category', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/blog/useful-links/');
    const details = page.locator(`details:has(summary:has-text("${CATEGORY_NAME}"))`);
    await details.locator('summary').click();
    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
  });

  test('category appears exactly once (no duplicates)', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const summaries = page.locator(`summary:has-text("${CATEGORY_NAME}")`);
    await expect(summaries).toHaveCount(1);
  });

  test('no links have empty href attributes', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const details = page.locator(`details:has(summary:has-text("${CATEGORY_NAME}"))`);
    if ((await details.getAttribute('open')) === null) {
      await details.locator('summary').click();
    }
    const emptyLinks = details.locator('a[href=""]');
    await expect(emptyLinks).toHaveCount(0);
  });

  test('no duplicate links within the category', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const details = page.locator(`details:has(summary:has-text("${CATEGORY_NAME}"))`);
    if ((await details.getAttribute('open')) === null) {
      await details.locator('summary').click();
    }
    const links = await details.locator('a[href^="/blog/"]').all();
    const hrefs: string[] = [];
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href) hrefs.push(href);
    }
    const duplicates = hrefs.filter((item, index) => hrefs.indexOf(item) !== index);
    expect(duplicates, `Duplicate links: ${duplicates.join(', ')}`).toHaveLength(0);
  });

  test('toggling open and closed does not crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/blog/useful-links/');
    const summary = page.locator(`summary:has-text("${CATEGORY_NAME}")`);
    await summary.click();
    await page.waitForTimeout(200);
    await summary.click();
    await page.waitForTimeout(200);
    await summary.click();
    await page.waitForTimeout(200);
    expect(errors).toHaveLength(0);
  });

  test('adding this category did not break other orphan sections', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    // Verify other existing orphan categories still render
    await expect(page.locator('summary:has-text("Words Containing (Two-Letter Combos)")')).toBeVisible();
    await expect(page.locator('summary:has-text("Word Lists & Vocabulary")')).toBeVisible();
    await expect(page.locator('summary:has-text("Strategy & Tactics")')).toBeVisible();
  });

  test('all links are internal paths starting with /blog/', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const details = page.locator(`details:has(summary:has-text("${CATEGORY_NAME}"))`);
    if ((await details.getAttribute('open')) === null) {
      await details.locator('summary').click();
    }
    const links = await details.locator('a').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      expect(href?.startsWith('/blog/'), `Link "${href}" should start with /blog/`).toBe(true);
    }
  });
});
