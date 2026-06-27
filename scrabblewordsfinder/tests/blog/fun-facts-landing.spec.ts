import { test, expect } from '@playwright/test';

test.describe('Fun Facts & Statistics Landing Page — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto('/blog/fun-facts/');
    expect(response?.status()).toBe(200);
  });

  test('page has correct h1 heading', async ({ page }) => {
    await page.goto('/blog/fun-facts/');
    const h1 = page.getByRole('heading', { name: 'Fun Facts & Statistics', level: 1 });
    await expect(h1).toBeVisible();
  });

  test('breadcrumb navigation shows Blog link and category', async ({ page }) => {
    await page.goto('/blog/fun-facts/');
    const breadcrumb = page.locator('nav.text-sm');
    await expect(breadcrumb).toBeVisible();
    const blogLink = breadcrumb.locator('a[href="/blog/"]');
    await expect(blogLink).toBeVisible();
    await expect(breadcrumb.locator('text=Fun Facts & Statistics')).toBeVisible();
  });

  test('stat strip shows 4 key numbers', async ({ page }) => {
    await page.goto('/blog/fun-facts/');
    const statStrip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    await expect(statStrip).toBeVisible();
    await expect(statStrip.locator('text=100')).toBeVisible();
    await expect(statStrip.locator('text=1,778')).toBeVisible();
    await expect(statStrip.locator('text=13.3%')).toBeVisible();
    await expect(statStrip.locator('text=350–450')).toBeVisible();
  });

  test('Records & Scores section heading is visible', async ({ page }) => {
    await page.goto('/blog/fun-facts/');
    const heading = page.locator('h2:has-text("Records & Scores")');
    await expect(heading).toBeVisible();
  });

  test('Records & Scores section has 4 article links', async ({ page }) => {
    await page.goto('/blog/fun-facts/');
    const expectedLinks = [
      '/blog/maximum-possible-scrabble-score/',
      '/blog/highest-possible-scrabble-score/',
      '/blog/average-winning-score/',
      '/blog/average-game-length/',
    ];
    for (const href of expectedLinks) {
      await expect(page.locator(`a[href="${href}"]`)).toBeVisible();
    }
  });

  test('Tile Distribution & Probability section heading is visible', async ({ page }) => {
    await page.goto('/blog/fun-facts/');
    const heading = page.locator('h2:has-text("Tile Distribution & Probability")');
    await expect(heading).toBeVisible();
  });

  test('Tile Distribution section has Did You Know callout', async ({ page }) => {
    await page.goto('/blog/fun-facts/');
    const callout = page.locator('text=Did You Know?');
    await expect(callout).toBeVisible();
    await expect(page.locator('text=12 E tiles')).toBeVisible();
  });

  test('Tile Distribution section has all 12 article links', async ({ page }) => {
    await page.goto('/blog/fun-facts/');
    const expectedLinks = [
      '/blog/tile-distribution-explained/',
      '/blog/scrabble-tile-bag-distribution/',
      '/blog/scrabble-tile-distribution/',
      '/blog/letter-frequency-in-scrabble/',
      '/blog/letter-frequency-scrabble/',
      '/blog/probability-of-drawing-blank/',
      '/blog/probability-of-drawing-blank-tiles/',
      '/blog/probability-of-drawing-q/',
      '/blog/bingo-frequency-by-dictionary/',
      '/blog/most-valuable-tile/',
      '/blog/least-valuable-tile/',
      '/blog/most-surprising-valid-words/',
    ];
    for (const href of expectedLinks) {
      await expect(page.locator(`a[href="${href}"]`)).toBeVisible();
    }
  });

  test('Weird & Wonderful section heading is visible', async ({ page }) => {
    await page.goto('/blog/fun-facts/');
    const heading = page.locator('h2:has-text("Weird & Wonderful")');
    await expect(heading).toBeVisible();
  });

  test('Weird & Wonderful section has Fun Fact callout about OXYPHENBUTAZONE', async ({ page }) => {
    await page.goto('/blog/fun-facts/');
    const callout = page.locator('text=Fun Fact').first();
    await expect(callout).toBeVisible();
    await expect(page.locator('text=OXYPHENBUTAZONE')).toBeVisible();
    await expect(page.locator('text=1,778 points')).toBeVisible();
  });

  test('Weird & Wonderful section has 2 article links', async ({ page }) => {
    await page.goto('/blog/fun-facts/');
    const expectedLinks = [
      '/blog/weird-scrabble-facts/',
      '/blog/scrabble-by-the-numbers/',
    ];
    for (const href of expectedLinks) {
      await expect(page.locator(`a[href="${href}"]`)).toBeVisible();
    }
  });

  test('Dig Deeper cross-links section is present with 3 links', async ({ page }) => {
    await page.goto('/blog/fun-facts/');
    const digDeeper = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10');
    await expect(digDeeper).toBeVisible();
    await expect(digDeeper.locator('text=Dig Deeper')).toBeVisible();
    const crossLinks = [
      '/blog/high-scoring/',
      '/blog/bingos/',
      '/blog/strategy/',
    ];
    for (const href of crossLinks) {
      await expect(digDeeper.locator(`a[href="${href}"]`)).toBeVisible();
    }
  });

  test('Related Categories aside section is visible with 3 category links', async ({ page }) => {
    await page.goto('/blog/fun-facts/');
    await expect(page.locator('h3:has-text("Related Categories")')).toBeVisible();
    const relatedLinks = [
      '/blog/high-scoring/',
      '/blog/dictionaries/',
      '/blog/tournament/',
    ];
    for (const href of relatedLinks) {
      const asideLink = page.locator(`aside a[href="${href}"]`);
      await expect(asideLink).toBeVisible();
    }
  });

  test('CTA box with word finder link is present', async ({ page }) => {
    await page.goto('/blog/fun-facts/');
    const cta = page.locator('text=Try our free Scrabble Word Finder');
    await expect(cta).toBeVisible();
    const ctaLink = page.locator('a:has-text("Open Word Finder")');
    await expect(ctaLink).toBeVisible();
    await expect(ctaLink).toHaveAttribute('href', '/');
  });

  test('back to blog link is present and correct', async ({ page }) => {
    await page.goto('/blog/fun-facts/');
    const backLink = page.locator('a:has-text("Back to all articles")');
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/blog/');
  });
});

test.describe('Fun Facts & Statistics Landing Page — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/blog/fun-facts/');
    await page.waitForTimeout(1000);
    expect(errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'))).toHaveLength(0);
  });

  test('no duplicate h1 elements in main content', async ({ page }) => {
    await page.goto('/blog/fun-facts/');
    const h1s = page.locator('.max-w-3xl h1');
    const count = await h1s.count();
    expect(count).toBe(1);
  });

  test('all internal links have trailing slash', async ({ page }) => {
    await page.goto('/blog/fun-facts/');
    const links = await page.locator('a[href^="/"]').all();
    const missingSlash: string[] = [];
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href && !href.endsWith('/') && !href.includes('#') && !href.includes('?') && !href.match(/\.\w+$/)) {
        missingSlash.push(href);
      }
    }
    expect(missingSlash, `Links missing trailing slash: ${missingSlash.join(', ')}`).toHaveLength(0);
  });

  test('no empty href attributes on any link', async ({ page }) => {
    await page.goto('/blog/fun-facts/');
    const links = await page.locator('a[href]').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      expect(href?.trim().length, 'Link href should not be empty').toBeGreaterThan(0);
    }
  });

  test('no duplicate article links on the page', async ({ page }) => {
    await page.goto('/blog/fun-facts/');
    const allLinks = await page.locator('.max-w-3xl a[href^="/blog/"]').all();
    const hrefs: string[] = [];
    for (const link of allLinks) {
      const href = await link.getAttribute('href');
      if (href && href !== '/blog/' && !href.includes('fun-facts')) {
        hrefs.push(href);
      }
    }
    const duplicates = hrefs.filter((item, index) => hrefs.indexOf(item) !== index);
    // Allowed: cross-link sections may repeat links from the main grid (e.g. /blog/high-scoring/)
    // Only flag truly unexpected duplicates within the same grid section
    const mainGridLinks = await page.locator('.grid.grid-cols-1 a[href^="/blog/"]').all();
    const gridHrefs: string[] = [];
    for (const link of mainGridLinks) {
      const href = await link.getAttribute('href');
      if (href) gridHrefs.push(href);
    }
    const gridDuplicates = gridHrefs.filter((item, index) => gridHrefs.indexOf(item) !== index);
    expect(gridDuplicates, `Duplicate grid links: ${gridDuplicates.join(', ')}`).toHaveLength(0);
  });

  test('page does not contain broken image references', async ({ page }) => {
    await page.goto('/blog/fun-facts/');
    const images = await page.locator('img').all();
    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src) {
        expect(src.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
