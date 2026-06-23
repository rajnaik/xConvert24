import { test, expect } from '@playwright/test';

const PAGE = '/blog/scrabble-word-checker-tools/';

test.describe('Scrabble Word Checker Tools — Card Links — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('card grid contains 5 clickable link cards', async ({ page }) => {
    await page.goto(PAGE);
    const cards = page.locator('.not-prose.grid a');
    await expect(cards).toHaveCount(5);
  });

  test('Collins card links to correct external URL', async ({ page }) => {
    await page.goto(PAGE);
    const collins = page.locator('a[href="https://www.collinsdictionary.com/"]');
    await expect(collins).toBeVisible();
    await expect(collins).toHaveAttribute('target', '_blank');
    await expect(collins).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('Merriam-Webster card links to correct external URL', async ({ page }) => {
    await page.goto(PAGE);
    const mw = page.locator('a[href="https://scrabble.merriam-webster.com/"]');
    await expect(mw).toBeVisible();
    await expect(mw).toHaveAttribute('target', '_blank');
  });

  test('ScrabbleWordsFinder card links to homepage', async ({ page }) => {
    await page.goto(PAGE);
    const swf = page.locator('.not-prose.grid a[href="/"]');
    await expect(swf).toBeVisible();
  });

  test('WordFinder card links to correct external URL', async ({ page }) => {
    await page.goto(PAGE);
    const wf = page.locator('a[href="https://wordfinder.yourdictionary.com/scrabble-dictionary/"]');
    await expect(wf).toBeVisible();
    await expect(wf).toHaveAttribute('target', '_blank');
  });

  test('NASPA card links to correct external URL', async ({ page }) => {
    await page.goto(PAGE);
    const naspa = page.locator('a[href="https://scrabbleplayers.org/"]');
    await expect(naspa).toBeVisible();
    await expect(naspa).toHaveAttribute('target', '_blank');
  });

  test('each card displays a favicon image', async ({ page }) => {
    await page.goto(PAGE);
    const favicons = page.locator('.not-prose.grid a img');
    await expect(favicons).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      const src = await favicons.nth(i).getAttribute('src');
      expect(src).toBeTruthy();
    }
  });

  test('each card has an external arrow indicator', async ({ page }) => {
    await page.goto(PAGE);
    const arrows = page.locator('.not-prose.grid a span:has-text("↗")');
    await expect(arrows).toHaveCount(5);
  });
});

test.describe('Scrabble Word Checker Tools — Card Links — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('first card grid uses anchor tags not divs', async ({ page }) => {
    await page.goto(PAGE);
    // The first .not-prose.grid should contain only <a> link cards, no plain <div> cards
    const firstGrid = page.locator('.not-prose.grid').first();
    const divCards = firstGrid.locator('> div.p-4');
    const linkCards = firstGrid.locator('> a');
    await expect(divCards).toHaveCount(0);
    await expect(linkCards).toHaveCount(5);
  });

  test('no duplicate href values in card grid', async ({ page }) => {
    await page.goto(PAGE);
    const cards = page.locator('.not-prose.grid a');
    const count = await cards.count();
    const hrefs: string[] = [];
    for (let i = 0; i < count; i++) {
      const href = await cards.nth(i).getAttribute('href');
      hrefs.push(href || '');
    }
    const uniqueHrefs = new Set(hrefs);
    expect(uniqueHrefs.size).toBe(hrefs.length);
  });

  test('external links all have rel noopener noreferrer', async ({ page }) => {
    await page.goto(PAGE);
    const externalCards = page.locator('.not-prose.grid a[target="_blank"]');
    const count = await externalCards.count();
    expect(count).toBe(4); // 4 external, 1 internal (/)
    for (let i = 0; i < count; i++) {
      const rel = await externalCards.nth(i).getAttribute('rel');
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
    }
  });

  test('all favicon images have loading=lazy attribute', async ({ page }) => {
    await page.goto(PAGE);
    const favicons = page.locator('.not-prose.grid a img');
    const count = await favicons.count();
    for (let i = 0; i < count; i++) {
      const loading = await favicons.nth(i).getAttribute('loading');
      expect(loading).toBe('lazy');
    }
  });
});
