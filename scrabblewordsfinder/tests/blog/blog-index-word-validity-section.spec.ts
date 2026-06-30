import { test, expect } from '@playwright/test';

/**
 * Tests for the Word Validity section on the Blog Index page.
 * Added June 30, 2026: a violet-themed h2 heading + responsive grid
 * of word cards linking to "is X a scrabble word" blog posts.
 */

const WORD_VALIDITY_HEADING = 'h2:has-text("Word Validity — Is It a Scrabble Word?")';
const WORD_VALIDITY_GRID = 'h2:has-text("Word Validity") + div.grid';

test.describe('Blog Index — Word Validity Section — Positive', () => {

  test('Word Validity h2 heading is visible on blog index', async ({ page }) => {
    await page.goto('/blog/');
    const heading = page.locator(WORD_VALIDITY_HEADING);
    await expect(heading).toBeVisible();
  });

  test('Word Validity heading has violet text color', async ({ page }) => {
    await page.goto('/blog/');
    const heading = page.locator(WORD_VALIDITY_HEADING);
    const classes = await heading.getAttribute('class');
    expect(classes).toContain('text-violet-400');
  });

  test('Word Validity heading contains check mark emoji', async ({ page }) => {
    await page.goto('/blog/');
    const heading = page.locator(WORD_VALIDITY_HEADING);
    const text = await heading.textContent();
    expect(text).toContain('✅');
  });

  test('Word Validity grid uses responsive columns (6/8/10)', async ({ page }) => {
    await page.goto('/blog/');
    const grid = page.locator(WORD_VALIDITY_GRID);
    await expect(grid).toBeVisible();
    const classes = await grid.getAttribute('class');
    expect(classes).toContain('grid-cols-6');
    expect(classes).toContain('sm:grid-cols-8');
    expect(classes).toContain('md:grid-cols-10');
  });

  test('Word Validity grid contains word cards', async ({ page }) => {
    await page.goto('/blog/');
    const grid = page.locator(WORD_VALIDITY_GRID);
    const cards = grid.locator('a.blog-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Word Validity cards link to /blog/is-*-a-scrabble-word/ pattern', async ({ page }) => {
    await page.goto('/blog/');
    const grid = page.locator(WORD_VALIDITY_GRID);
    const cards = await grid.locator('a.blog-card').all();
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards.slice(0, 5)) {
      const href = await card.getAttribute('href');
      expect(href).toMatch(/^\/blog\/is-[a-z]+-a-scrabble-word\/$/);
    }
  });

  test('Word Validity cards have violet hover border', async ({ page }) => {
    await page.goto('/blog/');
    const grid = page.locator(WORD_VALIDITY_GRID);
    const firstCard = grid.locator('a.blog-card').first();
    const classes = await firstCard.getAttribute('class');
    expect(classes).toContain('hover:border-violet-700');
  });

  test('Word Validity card text turns violet on hover (group-hover class)', async ({ page }) => {
    await page.goto('/blog/');
    const grid = page.locator(WORD_VALIDITY_GRID);
    const firstCardSpan = grid.locator('a.blog-card span').first();
    const classes = await firstCardSpan.getAttribute('class');
    expect(classes).toContain('group-hover:text-violet-400');
  });
});

test.describe('Blog Index — Word Validity Section — Negative', () => {

  test('no duplicate Word Validity headings on the page', async ({ page }) => {
    await page.goto('/blog/');
    const headings = page.locator(WORD_VALIDITY_HEADING);
    await expect(headings).toHaveCount(1);
  });

  test('all Word Validity card hrefs have trailing slash', async ({ page }) => {
    await page.goto('/blog/');
    const grid = page.locator(WORD_VALIDITY_GRID);
    const cards = await grid.locator('a.blog-card').all();
    const missingSlash: string[] = [];
    for (const card of cards) {
      const href = await card.getAttribute('href');
      if (href && !href.endsWith('/')) {
        missingSlash.push(href);
      }
    }
    expect(missingSlash, `Cards missing trailing slash: ${missingSlash.join(', ')}`).toHaveLength(0);
  });

  test('no Word Validity cards have empty href', async ({ page }) => {
    await page.goto('/blog/');
    const grid = page.locator(WORD_VALIDITY_GRID);
    const cards = await grid.locator('a.blog-card').all();
    for (const card of cards) {
      const href = await card.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href!.trim().length).toBeGreaterThan(0);
    }
  });

  test('no duplicate word cards in Word Validity grid', async ({ page }) => {
    await page.goto('/blog/');
    const grid = page.locator(WORD_VALIDITY_GRID);
    const hrefs = await grid.locator('a.blog-card').evaluateAll(
      (els) => els.map(el => el.getAttribute('href'))
    );
    const unique = new Set(hrefs);
    expect(unique.size, `Duplicate cards found: ${hrefs.length - unique.size} duplicates`).toBe(hrefs.length);
  });

  test('Word Validity grid does not appear inside the nav grid', async ({ page }) => {
    await page.goto('/blog/');
    // The nav grid is .grid.grid-cols-3 — Word Validity grid should NOT be nested inside it
    const navGrid = page.locator('.grid.grid-cols-3').first();
    const nestedValidity = navGrid.locator(WORD_VALIDITY_HEADING);
    await expect(nestedValidity).toHaveCount(0);
  });
});
