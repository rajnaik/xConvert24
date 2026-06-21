import { test, expect } from '@playwright/test';

const PAGE = '/blog/how-to-improve-at-scrabble-fast/';

test.describe('How to Improve at Scrabble Fast — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('h1 heading displays correct title', async ({ page }) => {
    await page.goto(PAGE);
    const h1 = page.locator('article h1');
    await expect(h1).toContainText('How to Improve at Scrabble Fast');
  });

  test('breadcrumb links to Strategy category', async ({ page }) => {
    await page.goto(PAGE);
    const breadcrumb = page.locator('nav a[href="/blog/strategy/"]');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb).toContainText('Strategy');
  });

  test('read time shows 8 min', async ({ page }) => {
    await page.goto(PAGE);
    const readTime = page.locator('text=8 min read');
    await expect(readTime).toBeVisible();
  });

  test('hero target card shows +50 to +100 points', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('text=+50 TO +100 POINTS');
    await expect(heroCard).toBeVisible();
  });

  test('all 10 technique headings are present', async ({ page }) => {
    await page.goto(PAGE);
    const headings = [
      '1. Memorise All Two-Letter Words',
      '2. Learn the Power Three-Letter Words',
      '3. Practice Rack Management',
      '4. Study the Board, Not Just Your Rack',
      '5. Learn Hook Words',
      '6. Play for Bingos (7-Letter Words)',
      '7. Use Premium Squares Strategically',
      '8. Analyse Your Games Afterwards',
      '9. Know When to Exchange Tiles',
      '10. Use a Word Finder as a Learning Tool',
    ];
    for (const heading of headings) {
      await expect(page.locator(`h2:has-text("${heading}")`)).toBeVisible();
    }
  });

  test('TWL stat strip shows 127 two-letter words', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('text=127');
    await expect(statStrip.first()).toBeVisible();
  });

  test('bingo stat strip shows +50 bonus and SATINE stem', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('text=SATINE').first()).toBeVisible();
    await expect(page.locator('text=Bonus points per bingo')).toBeVisible();
  });

  test('golden ratio callout mentions 3 vowels and 4 consonants', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('text=The Golden Ratio');
    await expect(callout).toBeVisible();
    const parent = page.locator('.border-green-500\\/30').filter({ hasText: 'Golden Ratio' });
    await expect(parent).toContainText('3 vowels and 4 consonants');
  });

  test('related articles section has 3 links', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside');
    await expect(aside).toBeVisible();
    const links = aside.locator('a');
    await expect(links).toHaveCount(3);
  });

  test('CTA box with Word Finder link is visible', async ({ page }) => {
    await page.goto(PAGE);
    const cta = page.locator('a:has-text("Open Word Finder")');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/');
  });

  test('FAQPage schema is present in page source', async ({ page }) => {
    await page.goto(PAGE);
    const schema = page.locator('script[type="application/ld+json"]');
    const allSchemas = await schema.allTextContents();
    const hasFAQ = allSchemas.some(s => s.includes('FAQPage'));
    expect(hasFAQ).toBe(true);
  });

  test('Article schema is present in page source', async ({ page }) => {
    await page.goto(PAGE);
    const schema = page.locator('script[type="application/ld+json"]');
    const allSchemas = await schema.allTextContents();
    const hasArticle = allSchemas.some(s => s.includes('"@type":"Article"') || s.includes('"@type": "Article"'));
    expect(hasArticle).toBe(true);
  });

  test('Dig Deeper sections link to related blog posts', async ({ page }) => {
    await page.goto(PAGE);
    const twoLetterLink = page.locator('a[href="/blog/best-two-letter-words-scrabble/"]');
    await expect(twoLetterLink).toBeVisible();
    const threeLetterLink = page.locator('a[href="/blog/best-three-letter-scrabble-words/"]');
    await expect(threeLetterLink).toBeVisible();
  });
});

test.describe('How to Improve at Scrabble Fast — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate h1 headings in article', async ({ page }) => {
    await page.goto(PAGE);
    const h1s = page.locator('article h1');
    await expect(h1s).toHaveCount(1);
  });

  test('no duplicate hero target cards', async ({ page }) => {
    await page.goto(PAGE);
    const heroCards = page.locator('text=+50 TO +100 POINTS');
    await expect(heroCards).toHaveCount(1);
  });

  test('no duplicate CTA boxes', async ({ page }) => {
    await page.goto(PAGE);
    const ctas = page.locator('a:has-text("Open Word Finder")');
    await expect(ctas).toHaveCount(1);
  });

  test('breadcrumb does not link to old Beginner Guides category', async ({ page }) => {
    await page.goto(PAGE);
    const nav = page.locator('nav').first();
    const oldLink = nav.locator('a[href="/blog/beginner-guides/"]');
    await expect(oldLink).toHaveCount(0);
  });

  test('page does not link to itself', async ({ page }) => {
    await page.goto(PAGE);
    const selfLinks = page.locator(`a[href="${PAGE}"]`);
    await expect(selfLinks).toHaveCount(0);
  });

  test('FAQPage schema has exactly 3 questions', async ({ page }) => {
    await page.goto(PAGE);
    const schemas = page.locator('script[type="application/ld+json"]');
    const allSchemas = await schemas.allTextContents();
    const faqSchema = allSchemas.find(s => s.includes('FAQPage'));
    expect(faqSchema).toBeDefined();
    const parsed = JSON.parse(faqSchema!);
    expect(parsed.mainEntity).toHaveLength(3);
  });

  test('no broken internal links (href starts with /blog/ that return 404)', async ({ page }) => {
    await page.goto(PAGE);
    const blogLinks = await page.locator('a[href^="/blog/"]').all();
    // Check a sample of internal blog links (first 3)
    const linksToCheck = blogLinks.slice(0, 3);
    for (const link of linksToCheck) {
      const href = await link.getAttribute('href');
      if (href) {
        const resp = await page.request.get(href);
        expect(resp.status(), `Link ${href} should not 404`).not.toBe(404);
      }
    }
  });
});
