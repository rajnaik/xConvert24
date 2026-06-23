import { test, expect } from '@playwright/test';

test.describe('Vocabulary Landing Page — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto('/blog/vocabulary/');
    expect(response?.status()).toBe(200);
  });

  test('page has correct title containing Vocabulary', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    const title = await page.title();
    expect(title.toLowerCase()).toContain('vocabulary');
  });

  test('page has meta description', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    const metaDesc = page.locator('meta[name="description"]');
    const content = await metaDesc.getAttribute('content');
    expect(content).toBeTruthy();
    expect(content!.length).toBeGreaterThan(50);
  });

  test('page has h1 heading about Vocabulary & Word Lists', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    const h1 = page.locator('.max-w-3xl h1').first();
    await expect(h1).toBeVisible();
    const text = await h1.textContent();
    expect(text?.toLowerCase()).toContain('vocabulary');
  });

  test('stat strip shows 80+ Guides, 15 Themed Lists, 280K SOWPODS Words', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    const statStrip = page.locator('.border-emerald-500\\/30.bg-emerald-950\\/10').first();
    await expect(statStrip).toBeVisible();
    const text = await statStrip.textContent();
    expect(text).toContain('80+');
    expect(text).toContain('Guides');
    expect(text).toContain('280K');
  });

  test('breadcrumb navigation includes Blog link', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    const breadcrumb = page.locator('nav.text-sm');
    await expect(breadcrumb).toBeVisible();
    const blogLink = breadcrumb.locator('a[href="/blog/"]');
    await expect(blogLink).toBeVisible();
  });

  // --- Section: Themed Word Lists ---
  test('section heading Themed Word Lists exists', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    const heading = page.locator('h2.border-l-4:has-text("Themed Word Lists")');
    await expect(heading).toBeVisible();
  });

  test('animal names link is visible under Themed Word Lists', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    await expect(page.locator('a[href="/blog/animal-names-scrabble/"]')).toBeVisible();
  });

  // --- Section: Valid & Invalid Words ---
  test('section heading Valid & Invalid Words exists', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    const heading = page.locator('h2.border-l-4:has-text("Valid & Invalid Words")');
    await expect(heading).toBeVisible();
  });

  // --- Section: Dictionaries & References (NEW) ---
  test('section heading Dictionaries & References exists', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    const heading = page.locator('h2.border-l-4:has-text("Dictionaries & References")');
    await expect(heading).toBeVisible();
  });

  test('official dictionary guide link is visible', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    await expect(page.locator('a[href="/blog/official-scrabble-dictionary-guide/"]')).toBeVisible();
  });

  test('SOWPODS vs TWL link is visible', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    await expect(page.locator('a[href="/blog/sowpods-vs-twl-which-to-use/"]')).toBeVisible();
  });

  test('how to challenge link is visible', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    await expect(page.locator('a[href="/blog/how-to-challenge-in-scrabble/"]')).toBeVisible();
  });

  // --- Section: High-Value Letter Words (NEW) ---
  test('section heading High-Value Letter Words exists', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    const heading = page.locator('h2.border-l-4:has-text("High-Value Letter Words")');
    await expect(heading).toBeVisible();
  });

  test('Q words without U link is visible', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    await expect(page.locator('a[href="/blog/q-words-without-u/"]')).toBeVisible();
  });

  test('words with X and Z link is visible', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    await expect(page.locator('a[href="/blog/scrabble-words-with-x-and-z/"]')).toBeVisible();
  });

  // --- Section: Learning & Improvement (NEW) ---
  test('section heading Learning & Improvement exists', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    const heading = page.locator('h2.border-l-4:has-text("Learning & Improvement")');
    await expect(heading).toBeVisible();
  });

  test('how to improve fast link is visible', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    await expect(page.locator('a[href="/blog/how-to-improve-at-scrabble-fast/"]')).toBeVisible();
  });

  test('cognitive benefits link is visible', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    await expect(page.locator('a[href="/blog/cognitive-benefits-of-scrabble/"]')).toBeVisible();
  });

  // --- Section: For Kids & Families (NEW) ---
  test('section heading For Kids & Families exists', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    const heading = page.locator('h2.border-l-4:has-text("For Kids & Families")');
    await expect(heading).toBeVisible();
  });

  test('teaching kids link is visible', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    await expect(page.locator('a[href="/blog/teaching-kids-scrabble/"]')).toBeVisible();
  });

  test('family night ideas link is visible', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    await expect(page.locator('a[href="/blog/family-scrabble-night-ideas/"]')).toBeVisible();
  });

  // --- Section: Rules & Setup (NEW) ---
  test('section heading Rules & Setup exists', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    const heading = page.locator('h2.border-l-4:has-text("Rules & Setup")');
    await expect(heading).toBeVisible();
  });

  test('board game rules link is visible', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    await expect(page.locator('a[href="/blog/scrabble-board-game-rules/"]')).toBeVisible();
  });

  test('tournament calendar 2026 link is visible', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    await expect(page.locator('a[href="/blog/scrabble-tournament-calendar-2026/"]')).toBeVisible();
  });

  // --- Section: Essential Word Groups (NEW) ---
  test('section heading Essential Word Groups exists', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    const heading = page.locator('h2.border-l-4:has-text("Essential Word Groups")');
    await expect(heading).toBeVisible();
  });

  test('two-letter words strategy link is visible', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    await expect(page.locator('a[href="/blog/two-letter-words-complete-strategy/"]')).toBeVisible();
  });

  test('best 7-letter words link is visible', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    await expect(page.locator('a[href="/blog/best-7-letter-scrabble-words/"]')).toBeVisible();
  });

  test('parallel plays link is visible', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    await expect(page.locator('a[href="/blog/scrabble-parallel-plays/"]')).toBeVisible();
  });

  // --- CTA and navigation ---
  test('CTA box with Word Finder link is present', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    const cta = page.locator('a:has-text("Open Word Finder")');
    await expect(cta).toBeVisible();
  });

  test('CTA text mentions vocabulary', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    const ctaSection = page.locator('.not-prose:has(a[href="/"])').last();
    const text = await ctaSection.textContent();
    expect(text?.toLowerCase()).toContain('vocabulary');
  });

  test('back to blog link is present', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    const backLink = page.locator('a:has-text("Back to all articles")');
    await expect(backLink).toBeVisible();
  });

  // --- Total section count ---
  test('page has 8 h2 section headings with border-l-4 styling', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    const sectionHeadings = page.locator('h2.border-l-4');
    const count = await sectionHeadings.count();
    expect(count).toBe(8);
  });
});

test.describe('Vocabulary Landing Page — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/blog/vocabulary/');
    await page.waitForTimeout(1000);
    expect(errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'))).toHaveLength(0);
  });

  test('only one h1 in the main content area', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    const h1s = page.locator('.max-w-3xl h1');
    const count = await h1s.count();
    expect(count).toBe(1);
  });

  test('no duplicate post links exist in the page', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    const links = await page.locator('.max-w-3xl a[href^="/blog/"]').all();
    const hrefs: string[] = [];
    const duplicates: string[] = [];
    for (const link of links) {
      const href = await link.getAttribute('href');
      // Skip nav links like /blog/ which appear in breadcrumb + back link
      if (href && href !== '/blog/') {
        if (hrefs.includes(href)) {
          duplicates.push(href);
        }
        hrefs.push(href);
      }
    }
    expect(duplicates, `Duplicate post links found: ${duplicates.join(', ')}`).toHaveLength(0);
  });

  test('all internal links have trailing slash', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
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
    await page.goto('/blog/vocabulary/');
    const links = await page.locator('.max-w-3xl a[href]').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      expect(href?.trim().length, 'Link href should not be empty').toBeGreaterThan(0);
    }
  });

  test('page does not show undefined or raw Astro expressions', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    const visibleText = await page.locator('.max-w-3xl').textContent();
    expect(visibleText).not.toContain('undefined');
    expect(visibleText).not.toContain('${');
  });

  test('no unclosed HTML tags causing layout collapse', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    const mainContainer = page.locator('.max-w-3xl.mx-auto');
    await expect(mainContainer).toBeVisible();
    const height = await mainContainer.evaluate(el => el.getBoundingClientRect().height);
    expect(height).toBeGreaterThan(500);
  });

  test('CTA link points to homepage', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    const ctaLink = page.locator('a:has-text("Open Word Finder")');
    const href = await ctaLink.getAttribute('href');
    expect(href).toBe('/');
  });

  test('back to blog link points to /blog/', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    const backLink = page.locator('a:has-text("Back to all articles")');
    const href = await backLink.getAttribute('href');
    expect(href).toBe('/blog/');
  });

  test('JSON-LD FAQPage schema is present', async ({ page }) => {
    await page.goto('/blog/vocabulary/');
    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const count = await jsonLdScripts.count();
    expect(count).toBeGreaterThanOrEqual(1);
    let foundFaq = false;
    for (let i = 0; i < count; i++) {
      const content = await jsonLdScripts.nth(i).textContent();
      if (content && content.includes('FAQPage')) {
        foundFaq = true;
        expect(content).toContain('mainEntity');
        break;
      }
    }
    expect(foundFaq, 'FAQPage schema not found in any JSON-LD script').toBe(true);
  });
});
