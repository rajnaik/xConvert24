import { test, expect } from '@playwright/test';

const PAGE = '/blog/bingo-frequency-by-dictionary/';

test.describe('Bingo Frequency by Dictionary — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('page has correct h1 heading', async ({ page }) => {
    await page.goto(PAGE);
    const h1 = page.getByRole('heading', { name: /Bingo Frequency by Dictionary/, level: 1 });
    await expect(h1).toBeVisible();
  });

  test('hero card displays 40% MORE BINGOS stat', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('.border-2.border-amber-500\\/50');
    await expect(heroCard).toBeVisible();
    await expect(heroCard.locator('text=40% MORE BINGOS')).toBeVisible();
    await expect(heroCard.locator('text=Key Stat')).toBeVisible();
  });

  test('dictionary size stat strip shows SOWPODS and TWL totals', async ({ page }) => {
    await page.goto(PAGE);
    const statStrips = page.locator('.border-amber-500\\/30.bg-amber-950\\/10');
    const firstStrip = statStrips.first();
    await expect(firstStrip).toBeVisible();
    await expect(firstStrip.locator('text=~280,000')).toBeVisible();
    await expect(firstStrip.locator('text=~190,000')).toBeVisible();
    await expect(firstStrip.locator('text=SOWPODS Total Words')).toBeVisible();
  });

  test('word length comparison table is visible with bingo row highlighted', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table').first();
    await expect(table).toBeVisible();
    await expect(table.locator('text=7 letters (bingos)')).toBeVisible();
    await expect(table.locator('text=~35,000')).toBeVisible();
    await expect(table.locator('text=~24,000')).toBeVisible();
  });

  test('Why the Gap Widens insight callout is present', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('.border-blue-500\\/30.bg-blue-950\\/20').first();
    await expect(callout).toBeVisible();
    await expect(callout.locator('text=Why the Gap Widens')).toBeVisible();
  });

  test('SOWPODS vs TWL comparison cards show bingo odds', async ({ page }) => {
    await page.goto(PAGE);
    const sowpodsCard = page.locator('.border-green-500\\/30.bg-green-950\\/10').first();
    const twlCard = page.locator('.border-red-500\\/30.bg-red-950\\/10').first();
    await expect(sowpodsCard).toBeVisible();
    await expect(sowpodsCard.locator('text=SOWPODS Bingo Odds')).toBeVisible();
    await expect(twlCard).toBeVisible();
    await expect(twlCard.locator('text=TWL Bingo Odds')).toBeVisible();
  });

  test('bingo stem table shows SATINE, RETINA, SALINE with counts', async ({ page }) => {
    await page.goto(PAGE);
    const tables = page.locator('table');
    const stemTable = tables.nth(1);
    await expect(stemTable).toBeVisible();
    await expect(stemTable.locator('text=SATINE')).toBeVisible();
    await expect(stemTable.locator('text=RETINA')).toBeVisible();
    await expect(stemTable.locator('text=SALINE')).toBeVisible();
  });

  test('pill badges show top stem bingo counts', async ({ page }) => {
    await page.goto(PAGE);
    const pillSection = page.locator('.flex.flex-wrap.items-center.justify-center.gap-3');
    await expect(pillSection).toBeVisible();
    await expect(pillSection.locator('text=SATINE')).toBeVisible();
    await expect(pillSection.locator('text=72 bingos')).toBeVisible();
    await expect(pillSection.locator('text=RETAIN')).toBeVisible();
  });

  test('Dig Deeper cross-links section has internal links', async ({ page }) => {
    await page.goto(PAGE);
    const digDeeper = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10');
    await expect(digDeeper).toBeVisible();
    await expect(digDeeper.locator('text=Dig Deeper')).toBeVisible();
    await expect(digDeeper.locator('a[href="/blog/sowpods-vs-twl-which-to-use/"]')).toBeVisible();
    await expect(digDeeper.locator('a[href="/blog/bingo-stem-strategy/"]')).toBeVisible();
  });

  test('purple strategy tiles show strategic implications', async ({ page }) => {
    await page.goto(PAGE);
    const purpleTiles = page.locator('.border-purple-500\\/30.bg-purple-950\\/20');
    expect(await purpleTiles.count()).toBeGreaterThanOrEqual(4);
    await expect(page.locator('text=SOWPODS players can play more aggressively:')).toBeVisible();
    await expect(page.locator('text=TWL players need tighter rack discipline:')).toBeVisible();
  });

  test('green study advice callout shows Which Should You Study', async ({ page }) => {
    await page.goto(PAGE);
    const greenCallout = page.locator('.border-green-500\\/30.bg-green-950\\/10').last();
    await expect(greenCallout).toBeVisible();
    await expect(greenCallout.locator('text=Which Should You Study?')).toBeVisible();
    await expect(greenCallout.locator('text=both dictionaries')).toBeVisible();
  });

  test('related articles section has 3 links', async ({ page }) => {
    await page.goto(PAGE);
    const relatedSection = page.locator('aside');
    await expect(relatedSection).toBeVisible();
    await expect(relatedSection.locator('text=Related Articles')).toBeVisible();
    const relatedLinks = relatedSection.locator('a[href^="/blog/"]');
    expect(await relatedLinks.count()).toBe(3);
  });

  test('related articles link to correct pages', async ({ page }) => {
    await page.goto(PAGE);
    const relatedSection = page.locator('aside');
    await expect(relatedSection.locator('a[href="/blog/official-scrabble-dictionary-guide/"]')).toBeVisible();
    await expect(relatedSection.locator('a[href="/blog/bingo-probability/"]')).toBeVisible();
    await expect(relatedSection.locator('a[href="/blog/collins-official-dictionary/"]')).toBeVisible();
  });

  test('CTA box with Word Finder link is present', async ({ page }) => {
    await page.goto(PAGE);
    const cta = page.locator('.bg-gradient-to-r.from-blue-900\\/20');
    await expect(cta).toBeVisible();
    await expect(cta.locator('text=Find your highest-scoring bingos')).toBeVisible();
    const ctaLink = cta.locator('a[href="/"]');
    await expect(ctaLink).toBeVisible();
    await expect(ctaLink).toContainText('Open Word Finder');
  });

  test('back to all articles link is present', async ({ page }) => {
    await page.goto(PAGE);
    const backLink = page.locator('a:has-text("Back to all articles")');
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/blog/');
  });

  test('breadcrumb navigation includes Blog and Bingos links', async ({ page }) => {
    await page.goto(PAGE);
    const breadcrumb = page.locator('nav.text-sm');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.locator('a[href="/blog/"]')).toBeVisible();
    await expect(breadcrumb.locator('a[href="/blog/bingos/"]')).toBeVisible();
  });

  test('FAQPage structured data exists with 3 questions', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').all();
    let faqSchema: any = null;
    for (const script of scripts) {
      const text = await script.textContent();
      if (text && text.includes('FAQPage')) {
        faqSchema = JSON.parse(text);
        break;
      }
    }
    expect(faqSchema).not.toBeNull();
    expect(faqSchema['@type']).toBe('FAQPage');
    expect(faqSchema.mainEntity).toHaveLength(3);
  });

  test('Article structured data exists with correct headline', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').all();
    let articleSchema: any = null;
    for (const script of scripts) {
      const text = await script.textContent();
      if (text && text.includes('"Article"')) {
        articleSchema = JSON.parse(text);
        break;
      }
    }
    expect(articleSchema).not.toBeNull();
    expect(articleSchema['@type']).toBe('Article');
    expect(articleSchema.headline).toContain('Bingo Frequency by Dictionary');
  });
});

test.describe('Bingo Frequency by Dictionary — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate h1 elements', async ({ page }) => {
    await page.goto(PAGE);
    const h1s = page.locator('article h1');
    expect(await h1s.count()).toBe(1);
  });

  test('no duplicate hero cards', async ({ page }) => {
    await page.goto(PAGE);
    const heroCards = page.locator('.border-2.border-amber-500\\/50');
    expect(await heroCards.count()).toBe(1);
  });

  test('no duplicate FAQPage schemas', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').all();
    let faqCount = 0;
    for (const script of scripts) {
      const text = await script.textContent();
      if (text && text.includes('FAQPage')) faqCount++;
    }
    expect(faqCount).toBe(1);
  });

  test('page does not link to itself in related articles', async ({ page }) => {
    await page.goto(PAGE);
    const selfLinks = page.locator(`aside a[href="${PAGE}"], aside a[href="/blog/bingo-frequency-by-dictionary/"]`);
    expect(await selfLinks.count()).toBe(0);
  });

  test('all internal links have trailing slash', async ({ page }) => {
    await page.goto(PAGE);
    const links = await page.locator('a[href^="/"]').all();
    const missingSlash: string[] = [];
    for (const link of links) {
      const href = await link.getAttribute('href');
      if (href && !href.endsWith('/') && !href.includes('#') && !href.includes('?') && href !== '/') {
        missingSlash.push(href);
      }
    }
    expect(missingSlash, `Links missing trailing slash: ${missingSlash.join(', ')}`).toHaveLength(0);
  });

  test('no empty href attributes on any link', async ({ page }) => {
    await page.goto(PAGE);
    const links = await page.locator('a[href]').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      expect(href?.trim().length, 'Link href should not be empty').toBeGreaterThan(0);
    }
  });

  test('FAQ answers are not empty', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = await page.locator('script[type="application/ld+json"]').all();
    for (const script of scripts) {
      const text = await script.textContent();
      if (text && text.includes('FAQPage')) {
        const schema = JSON.parse(text);
        for (const entity of schema.mainEntity) {
          expect(entity.acceptedAnswer.text.length).toBeGreaterThan(20);
        }
      }
    }
  });

  test('CTA link does not 404 (points to homepage)', async ({ page }) => {
    await page.goto(PAGE);
    const ctaLink = page.locator('.bg-gradient-to-r.from-blue-900\\/20 a[href="/"]');
    const href = await ctaLink.getAttribute('href');
    expect(href).toBe('/');
  });

  test('no duplicate related articles aside sections', async ({ page }) => {
    await page.goto(PAGE);
    const asides = page.locator('aside');
    expect(await asides.count()).toBe(1);
  });
});
