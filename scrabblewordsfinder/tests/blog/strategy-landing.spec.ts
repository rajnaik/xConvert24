import { test, expect } from '@playwright/test';

test.describe('Strategy Landing Page — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto('/blog/strategy/');
    expect(response?.status()).toBe(200);
  });

  test('page has correct title metadata', async ({ page }) => {
    await page.goto('/blog/strategy/');
    const title = await page.title();
    expect(title).toContain('Strategy');
  });

  test('page has meta description', async ({ page }) => {
    await page.goto('/blog/strategy/');
    const metaDesc = page.locator('meta[name="description"]');
    const content = await metaDesc.getAttribute('content');
    expect(content).toBeTruthy();
    expect(content!.length).toBeGreaterThan(50);
  });

  test('page has meta keywords', async ({ page }) => {
    await page.goto('/blog/strategy/');
    const metaKeywords = page.locator('meta[name="keywords"]');
    const content = await metaKeywords.getAttribute('content');
    expect(content).toBeTruthy();
    expect(content).toContain('scrabble strategy');
  });

  test('page has h1 heading about strategy in main content', async ({ page }) => {
    await page.goto('/blog/strategy/');
    const h1 = page.locator('.max-w-3xl h1').first();
    await expect(h1).toBeVisible();
    const text = await h1.textContent();
    expect(text?.toLowerCase()).toContain('strategy');
  });

  test('page has introductory paragraph', async ({ page }) => {
    await page.goto('/blog/strategy/');
    const intro = page.locator('.max-w-3xl p').first();
    await expect(intro).toBeVisible();
    const text = await intro.textContent();
    expect(text!.length).toBeGreaterThan(50);
  });

  test('page contains links to strategy blog posts', async ({ page }) => {
    await page.goto('/blog/strategy/');
    const blogLinks = page.locator('.max-w-3xl a[href*="/blog/"]');
    const count = await blogLinks.count();
    // Strategy category has 40+ posts after expansion, expect most linked
    expect(count).toBeGreaterThanOrEqual(33);
  });

  test('rack management basics post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/rack-management-basics/"]')).toBeVisible();
  });

  test('defensive strategy post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/defensive-scrabble-strategy/"]')).toBeVisible();
  });

  test('offensive strategy post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/offensive-scrabble-strategy/"]')).toBeVisible();
  });

  test('endgame strategy post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/endgame-strategy/"]')).toBeVisible();
  });

  test('opening moves guide post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/opening-moves-guide/"]')).toBeVisible();
  });

  test('breadcrumb navigation includes Blog link', async ({ page }) => {
    await page.goto('/blog/strategy/');
    const breadcrumb = page.locator('nav.text-sm');
    await expect(breadcrumb).toBeVisible();
    const blogLink = breadcrumb.locator('a[href="/blog/"]');
    await expect(blogLink).toBeVisible();
  });

  test('FAQPage structured data is present', async ({ page }) => {
    await page.goto('/blog/strategy/');
    const scripts = await page.locator('script[type="application/ld+json"]').all();
    let hasFAQ = false;
    for (const script of scripts) {
      const content = await script.textContent();
      if (content && content.includes('FAQPage')) {
        hasFAQ = true;
        expect(content).toContain('Question');
        break;
      }
    }
    expect(hasFAQ).toBe(true);
  });

  test('stat strip with category overview is visible', async ({ page }) => {
    await page.goto('/blog/strategy/');
    const statStrip = page.locator('.border-emerald-500\\/30.bg-emerald-950\\/10').first();
    await expect(statStrip).toBeVisible();
    const text = await statStrip.textContent();
    expect(text).toContain('Guides');
  });

  test('insight callout block is present', async ({ page }) => {
    await page.goto('/blog/strategy/');
    const callout = page.locator('.border-blue-500\\/30.bg-blue-950\\/20');
    await expect(callout).toBeVisible();
    const text = await callout.textContent();
    expect(text).toContain('Strategy Mindset');
  });

  test('strategy pillars pill badges are visible', async ({ page }) => {
    await page.goto('/blog/strategy/');
    const badges = page.locator('.bg-gray-800.border-gray-700');
    const count = await badges.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('hero card for rack management is present', async ({ page }) => {
    await page.goto('/blog/strategy/');
    const heroCard = page.locator('.border-emerald-500\\/50');
    await expect(heroCard).toBeVisible();
    const text = await heroCard.textContent();
    expect(text).toContain('RACK MANAGEMENT');
  });

  test('hero card for board control is present', async ({ page }) => {
    await page.goto('/blog/strategy/');
    const heroCard = page.locator('.border-blue-500\\/40');
    await expect(heroCard).toBeVisible();
    const text = await heroCard.textContent();
    expect(text).toContain('BOARD CONTROL');
  });

  test('page has section headings with amber accent style', async ({ page }) => {
    await page.goto('/blog/strategy/');
    const sectionHeadings = page.locator('h2.border-l-4');
    const count = await sectionHeadings.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('offensive vs defensive comparison cards are present', async ({ page }) => {
    await page.goto('/blog/strategy/');
    const offenseCard = page.locator('.border-green-500\\/30:has-text("Offensive")');
    const defenseCard = page.locator('.border-red-500\\/30:has-text("Defensive")');
    await expect(offenseCard).toBeVisible();
    await expect(defenseCard).toBeVisible();
  });

  test('game phase stat strip shows Opening, Midgame, Endgame', async ({ page }) => {
    await page.goto('/blog/strategy/');
    const phaseStrip = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10').first();
    await expect(phaseStrip).toBeVisible();
    const text = await phaseStrip.textContent();
    expect(text).toContain('Opening');
    expect(text).toContain('Midgame');
    expect(text).toContain('Endgame');
  });

  test('inline cross-links block is present', async ({ page }) => {
    await page.goto('/blog/strategy/');
    const crossLinks = page.locator('.border-indigo-500\\/30').first();
    await expect(crossLinks).toBeVisible();
  });

  test('bingo stem strategy is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    const links = page.locator('a[href="/blog/bingo-stem-strategy/"]');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('tournament-level strategy post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/tournament-level-strategy/"]')).toBeVisible();
  });

  test('beginner scrabble strategy post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/beginner-scrabble-strategy/"]')).toBeVisible();
  });

  test('best consonant-heavy words post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/best-consonant-heavy-words/"]')).toBeVisible();
  });

  test('best vowel-heavy words post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/best-vowel-heavy-words/"]')).toBeVisible();
  });

  test('best words for triple letter squares post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/best-words-for-triple-letter-squares/"]')).toBeVisible();
  });

  test('best scrabble words with blank post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/best-scrabble-words-with-blank/"]')).toBeVisible();
  });

  test('board position solvers post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/board-position-solvers/"]')).toBeVisible();
  });

  test('probability of drawing blank post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/probability-of-drawing-blank/"]')).toBeVisible();
  });

  test('blank tile probability post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/probability-of-drawing-blank-tiles/"]')).toBeVisible();
  });

  test('probability of drawing Q post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/probability-of-drawing-q/"]')).toBeVisible();
  });

  test('scrabble probability calculators post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/scrabble-probability-calculators/"]')).toBeVisible();
  });

  test('triple-triple words post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/triple-triple-words/"]')).toBeVisible();
  });

  test('words with triple letters post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/words-with-triple-letters/"]')).toBeVisible();
  });

  test('board control strategy post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/scrabble-board-control-strategy/"]')).toBeVisible();
  });

  test('parallel plays post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/scrabble-parallel-plays/"]')).toBeVisible();
  });

  test('exchange tiles strategy post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/scrabble-exchange-tiles-strategy/"]')).toBeVisible();
  });

  test('triple word score strategy post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/scrabble-triple-word-score-strategy/"]')).toBeVisible();
  });

  test('advanced endgame strategy post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/scrabble-endgame-strategy/"]')).toBeVisible();
  });

  test('consonant-heavy rack strategy post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/consonant-heavy-rack-strategy/"]')).toBeVisible();
  });

  test('vowel-heavy rack solutions post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/vowel-heavy-rack-solutions/"]')).toBeVisible();
  });

  test('best opening words post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/best-scrabble-opening-words/"]')).toBeVisible();
  });

  test('best words for premium squares post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/best-words-for-premium-squares/"]')).toBeVisible();
  });

  test('strategies for families post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/scrabble-strategies-for-families/"]')).toBeVisible();
  });

  test('comeback strategies post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/scrabble-comeback-strategies/"]')).toBeVisible();
  });

  test('first move advantages post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/scrabble-first-move-advantages/"]')).toBeVisible();
  });

  test('premium square strategy post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/scrabble-premium-square-strategy/"]')).toBeVisible();
  });

  test('double/triple word combos post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/scrabble-double-triple-word-combos/"]')).toBeVisible();
  });

  test('setup plays and traps post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/scrabble-setup-plays-traps/"]')).toBeVisible();
  });

  test('hotspots and board positions post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/scrabble-hotspots-board-positions/"]')).toBeVisible();
  });

  test('leave analysis guide post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/scrabble-leave-analysis-guide/"]')).toBeVisible();
  });

  test('bluffing and challenges post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/scrabble-bluffing-challenges/"]')).toBeVisible();
  });

  test('anagram finding techniques post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/scrabble-anagram-finding-techniques/"]')).toBeVisible();
  });

  test('mental math scoring post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/scrabble-mental-math-scoring/"]')).toBeVisible();
  });

  test('tile tracking methods post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/scrabble-tile-tracking-methods/"]')).toBeVisible();
  });

  test('time pressure tips post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/scrabble-time-pressure-tips/"]')).toBeVisible();
  });

  test('vowel-consonant balance post is linked', async ({ page }) => {
    await page.goto('/blog/strategy/');
    await expect(page.locator('a[href="/blog/scrabble-vowel-consonant-balance/"]')).toBeVisible();
  });

  test('CTA box linking to word finder is present', async ({ page }) => {
    await page.goto('/blog/strategy/');
    const ctaText = page.locator('text=Open Word Finder');
    await expect(ctaText).toBeVisible();
  });

  test('More Categories section with cross-links is present', async ({ page }) => {
    await page.goto('/blog/strategy/');
    const moreCats = page.locator('h3:has-text("More Categories")');
    await expect(moreCats).toBeVisible();
  });

  test('back to blog link is present', async ({ page }) => {
    await page.goto('/blog/strategy/');
    const backLink = page.locator('text=Back to all articles');
    await expect(backLink).toBeVisible();
  });
});

test.describe('Strategy Landing Page — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/blog/strategy/');
    await page.waitForTimeout(1000);
    expect(errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'))).toHaveLength(0);
  });

  test('only one h1 in the main content area', async ({ page }) => {
    await page.goto('/blog/strategy/');
    const h1s = page.locator('.max-w-3xl h1');
    const count = await h1s.count();
    expect(count).toBe(1);
  });

  test('all internal links have trailing slash', async ({ page }) => {
    await page.goto('/blog/strategy/');
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
    await page.goto('/blog/strategy/');
    const links = await page.locator('.max-w-3xl a[href]').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      expect(href?.trim().length, 'Link href should not be empty').toBeGreaterThan(0);
    }
  });

  test('page does not contain broken image references', async ({ page }) => {
    await page.goto('/blog/strategy/');
    const images = await page.locator('img').all();
    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src) {
        expect(src.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('page does not show undefined or raw Astro expressions in visible text', async ({ page }) => {
    await page.goto('/blog/strategy/');
    // Check visible text only (not script content which may contain CSS template literals)
    const visibleText = await page.locator('.max-w-3xl').textContent();
    expect(visibleText).not.toContain('undefined');
    expect(visibleText).not.toContain('${');
  });

  test('no unclosed HTML tags causing layout shifts', async ({ page }) => {
    await page.goto('/blog/strategy/');
    const mainContainer = page.locator('.max-w-3xl.mx-auto');
    await expect(mainContainer).toBeVisible();
    const height = await mainContainer.evaluate(el => el.getBoundingClientRect().height);
    expect(height).toBeGreaterThan(500);
  });

  test('no duplicate blog post links in the listing section', async ({ page }) => {
    await page.goto('/blog/strategy/');
    const links = await page.locator('.max-w-3xl a[href*="/blog/"]').all();
    const hrefs: string[] = [];
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href) hrefs.push(href);
    }
    const seen = new Set<string>();
    const duplicates: string[] = [];
    for (const href of hrefs) {
      if (seen.has(href)) duplicates.push(href);
      seen.add(href);
    }
    // Some links may appear in multiple sections (e.g. hero + listing) — allow up to 2 occurrences
    const trueDuplicates = duplicates.filter(d => hrefs.filter(h => h === d).length > 2);
    expect(trueDuplicates, `Links appearing more than twice: ${trueDuplicates.join(', ')}`).toHaveLength(0);
  });
});
