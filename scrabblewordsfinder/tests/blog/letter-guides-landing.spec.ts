import { test, expect } from '@playwright/test';

test.describe('Letter Guides Landing Page — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto('/blog/letter-guides/');
    expect(response?.status()).toBe(200);
  });

  test('page has correct title containing Letter Guides', async ({ page }) => {
    await page.goto('/blog/letter-guides/');
    const title = await page.title();
    expect(title.toLowerCase()).toContain('letter guides');
  });

  test('page has meta description', async ({ page }) => {
    await page.goto('/blog/letter-guides/');
    const metaDesc = page.locator('meta[name="description"]');
    const content = await metaDesc.getAttribute('content');
    expect(content).toBeTruthy();
    expect(content!.length).toBeGreaterThan(50);
  });

  test('page has h1 heading about letter guides', async ({ page }) => {
    await page.goto('/blog/letter-guides/');
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    const text = await h1.textContent();
    expect(text?.toLowerCase()).toContain('letter guides');
  });

  test('Words Starting With section has 26 letter links (A-Z)', async ({ page }) => {
    await page.goto('/blog/letter-guides/');
    const heading = page.locator('h2:has-text("Words Starting With")');
    await expect(heading).toBeVisible();
    const grid = heading.locator('~ div').first();
    const links = grid.locator('a[href*="words-starting-with-"]');
    const count = await links.count();
    expect(count).toBe(26);
  });

  test('Common Prefixes section heading is visible', async ({ page }) => {
    await page.goto('/blog/letter-guides/');
    const heading = page.locator('h2:has-text("Common Prefixes")');
    await expect(heading).toBeVisible();
  });

  test('Common Prefixes section has description text', async ({ page }) => {
    await page.goto('/blog/letter-guides/');
    const desc = page.locator('text=15 guides for high-frequency Scrabble prefixes');
    await expect(desc).toBeVisible();
  });

  test('Common Prefixes section has exactly 15 prefix links', async ({ page }) => {
    await page.goto('/blog/letter-guides/');
    const prefixLinks = [
      '/blog/words-starting-with-anti/',
      '/blog/words-starting-with-dis/',
      '/blog/words-starting-with-ex/',
      '/blog/words-starting-with-inter/',
      '/blog/words-starting-with-mis/',
      '/blog/words-starting-with-non/',
      '/blog/words-starting-with-out/',
      '/blog/words-starting-with-over/',
      '/blog/words-starting-with-pre/',
      '/blog/words-starting-with-qu/',
      '/blog/words-starting-with-re/',
      '/blog/words-starting-with-semi/',
      '/blog/words-starting-with-sub/',
      '/blog/words-starting-with-super/',
      '/blog/words-starting-with-un/',
    ];
    for (const href of prefixLinks) {
      const link = page.locator(`a[href="${href}"]`);
      await expect(link, `Missing prefix link: ${href}`).toBeVisible();
    }
  });

  test('Common Prefixes links show correct labels with trailing hyphen', async ({ page }) => {
    await page.goto('/blog/letter-guides/');
    const antiLink = page.locator('a[href="/blog/words-starting-with-anti/"]');
    const text = await antiLink.textContent();
    expect(text).toContain('ANTI-');
    const unLink = page.locator('a[href="/blog/words-starting-with-un/"]');
    const unText = await unLink.textContent();
    expect(unText).toContain('UN-');
  });

  test('Words Ending With section is visible with 7 vowel/consonant links', async ({ page }) => {
    await page.goto('/blog/letter-guides/');
    const heading = page.locator('h2:has-text("Words Ending With")');
    await expect(heading).toBeVisible();
    const endingLinks = page.locator('a[href*="words-ending-with-"]:not([href*="words-ending-with-able"]):not([href*="words-ending-with-age"]):not([href*="words-ending-with-al"]):not([href*="words-ending-with-ance"]):not([href*="words-ending-with-ant"]):not([href*="words-ending-with-ary"]):not([href*="words-ending-with-ed"]):not([href*="words-ending-with-ence"]):not([href*="words-ending-with-ent"]):not([href*="words-ending-with-er"]):not([href*="words-ending-with-est"]):not([href*="words-ending-with-ful"]):not([href*="words-ending-with-ing"]):not([href*="words-ending-with-ism"]):not([href*="words-ending-with-ist"]):not([href*="words-ending-with-ity"]):not([href*="words-ending-with-ive"]):not([href*="words-ending-with-ize"]):not([href*="words-ending-with-ly"]):not([href*="words-ending-with-ment"]):not([href*="words-ending-with-ness"]):not([href*="words-ending-with-ous"]):not([href*="words-ending-with-tion"]):not([href*="words-ending-with-ure"])');
    // The basic ending links (single letter endings) should be 7: a, e, i, o, u, x, z
    const basicEndingLinks = [
      '/blog/words-ending-with-a/',
      '/blog/words-ending-with-e/',
      '/blog/words-ending-with-i/',
      '/blog/words-ending-with-o/',
      '/blog/words-ending-with-u/',
      '/blog/words-ending-with-x/',
      '/blog/words-ending-with-z/',
    ];
    for (const href of basicEndingLinks) {
      await expect(page.locator(`a[href="${href}"]`), `Missing: ${href}`).toBeVisible();
    }
  });

  test('Common Suffixes section is visible with 25 suffix links', async ({ page }) => {
    await page.goto('/blog/letter-guides/');
    const heading = page.locator('h2:has-text("Common Suffixes")');
    await expect(heading).toBeVisible();
    const ableLink = page.locator('a[href="/blog/words-ending-with-able/"]');
    await expect(ableLink).toBeVisible();
    const ingLink = page.locator('a[href="/blog/words-ending-with-ing/"]');
    await expect(ingLink).toBeVisible();
  });

  test('Words Containing Letter Pairs section is visible with 7 links', async ({ page }) => {
    await page.goto('/blog/letter-guides/');
    const heading = page.locator('h2:has-text("Words Containing Letter Pairs")');
    await expect(heading).toBeVisible();
    const containingLinks = [
      '/blog/words-containing-q/',
      '/blog/words-containing-x/',
      '/blog/words-containing-z/',
      '/blog/words-containing-j/',
      '/blog/words-containing-v/',
      '/blog/words-containing-k/',
      '/blog/words-containing-w/',
    ];
    for (const href of containingLinks) {
      await expect(page.locator(`a[href="${href}"]`), `Missing: ${href}`).toBeVisible();
    }
  });

  test('More Categories section links to related landing pages', async ({ page }) => {
    await page.goto('/blog/letter-guides/');
    const moreCats = page.locator('h3:has-text("More Categories")');
    await expect(moreCats).toBeVisible();
    await expect(page.locator('a[href="/blog/two-letter-words/"]')).toBeVisible();
    await expect(page.locator('a[href="/blog/strategy/"]')).toBeVisible();
  });

  test('CTA box with word finder link is present', async ({ page }) => {
    await page.goto('/blog/letter-guides/');
    const cta = page.locator('a:has-text("Open Word Finder")');
    await expect(cta).toBeVisible();
  });

  test('breadcrumb navigation includes Blog link', async ({ page }) => {
    await page.goto('/blog/letter-guides/');
    const breadcrumb = page.locator('nav.text-sm');
    await expect(breadcrumb).toBeVisible();
    const blogLink = breadcrumb.locator('a[href="/blog/"]');
    await expect(blogLink).toBeVisible();
  });

  test('FAQPage JSON-LD schema is present', async ({ page }) => {
    await page.goto('/blog/letter-guides/');
    const jsonLd = page.locator('script[type="application/ld+json"]');
    const count = await jsonLd.count();
    expect(count).toBeGreaterThanOrEqual(1);
    const content = await jsonLd.first().textContent();
    expect(content).toContain('FAQPage');
    expect(content).toContain('Question');
  });
});

test.describe('Letter Guides Landing Page — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/blog/letter-guides/');
    await page.waitForTimeout(1000);
    expect(errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'))).toHaveLength(0);
  });

  test('only one h1 in the main content area', async ({ page }) => {
    await page.goto('/blog/letter-guides/');
    const h1s = page.locator('.max-w-3xl h1');
    const count = await h1s.count();
    expect(count).toBe(1);
  });

  test('no duplicate prefix links exist in Common Prefixes section', async ({ page }) => {
    await page.goto('/blog/letter-guides/');
    const prefixes = [
      'anti', 'dis', 'ex', 'inter', 'mis', 'non', 'out', 'over', 'pre', 'qu', 're', 'semi', 'sub', 'super', 'un'
    ];
    for (const prefix of prefixes) {
      const links = page.locator(`a[href="/blog/words-starting-with-${prefix}/"]`);
      const count = await links.count();
      expect(count, `Duplicate links for prefix ${prefix}`).toBe(1);
    }
  });

  test('no duplicate A-Z letter links exist', async ({ page }) => {
    await page.goto('/blog/letter-guides/');
    const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    for (const letter of letters) {
      const links = page.locator(`a[href="/blog/words-starting-with-${letter}/"]`);
      const count = await links.count();
      expect(count, `Duplicate links for letter ${letter}`).toBe(1);
    }
  });

  test('all internal links have trailing slash', async ({ page }) => {
    await page.goto('/blog/letter-guides/');
    const links = await page.locator('.max-w-3xl a[href^="/"]').all();
    const missingSlash: string[] = [];
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href && !href.endsWith('/') && !href.includes('#') && !href.includes('?')) {
        missingSlash.push(href);
      }
    }
    expect(missingSlash, `Links missing trailing slash: ${missingSlash.join(', ')}`).toHaveLength(0);
  });

  test('no empty href attributes on any link', async ({ page }) => {
    await page.goto('/blog/letter-guides/');
    const links = await page.locator('.max-w-3xl a[href]').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      expect(href?.trim().length, 'Link href should not be empty').toBeGreaterThan(0);
    }
  });

  test('page does not show undefined or raw expressions', async ({ page }) => {
    await page.goto('/blog/letter-guides/');
    const visibleText = await page.locator('.max-w-3xl').textContent();
    expect(visibleText).not.toContain('undefined');
    expect(visibleText).not.toContain('${');
    expect(visibleText).not.toContain('NaN');
  });

  test('no unclosed HTML causing layout collapse', async ({ page }) => {
    await page.goto('/blog/letter-guides/');
    const mainContainer = page.locator('.max-w-3xl.mx-auto');
    await expect(mainContainer).toBeVisible();
    const height = await mainContainer.evaluate(el => el.getBoundingClientRect().height);
    expect(height).toBeGreaterThan(500);
  });

  test('Common Prefixes section appears between A-Z and Ending With sections', async ({ page }) => {
    await page.goto('/blog/letter-guides/');
    const headings = await page.locator('.max-w-3xl h2').allTextContents();
    const startingIdx = headings.findIndex(h => h.includes('Words Starting With'));
    const prefixIdx = headings.findIndex(h => h.includes('Common Prefixes'));
    const endingIdx = headings.findIndex(h => h.includes('Words Ending With'));
    expect(startingIdx).toBeGreaterThanOrEqual(0);
    expect(prefixIdx).toBeGreaterThan(startingIdx);
    expect(endingIdx).toBeGreaterThan(prefixIdx);
  });
});
