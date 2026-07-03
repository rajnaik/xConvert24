import { test, expect } from '@playwright/test';

const PAGE = '/blog/shortest-words-with-j/';

test.describe('Shortest Words With J — Page Structure — Positive', () => {

  test('page loads with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('h1 contains updated title', async ({ page }) => {
    await page.goto(PAGE);
    const h1 = page.locator('h1');
    await expect(h1).toContainText('Shortest Words With J — Quick J Plays for Scrabble');
  });

  test('breadcrumb navigation is visible with Letter Guides link', async ({ page }) => {
    await page.goto(PAGE);
    const nav = page.locator('nav');
    await expect(nav).toContainText('Letter Guides');
    const link = nav.locator('a[href="/blog/letter-guides/"]');
    await expect(link).toBeVisible();
  });

  test('article metadata shows updated date and read time', async ({ page }) => {
    await page.goto(PAGE);
    const meta = page.locator('.not-prose.mb-8');
    await expect(meta).toContainText('July 2, 2026');
    await expect(meta).toContainText('6 min read');
  });
});

test.describe('Shortest Words With J — Stat Strip — Positive', () => {

  test('stat strip is visible with amber styling', async ({ page }) => {
    await page.goto(PAGE);
    const strip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    await expect(strip).toBeVisible();
  });

  test('stat strip shows 8 points for J tile', async ({ page }) => {
    await page.goto(PAGE);
    const strip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    await expect(strip).toContainText('8');
    await expect(strip).toContainText('Points (J tile)');
  });

  test('stat strip shows 1 J in the bag', async ({ page }) => {
    await page.goto(PAGE);
    const strip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    await expect(strip).toContainText('J in the bag');
  });

  test('stat strip shows 1 two-letter J word', async ({ page }) => {
    await page.goto(PAGE);
    const strip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    await expect(strip).toContainText('2-letter J word');
  });

  test('stat strip shows 20+ three-letter J words', async ({ page }) => {
    await page.goto(PAGE);
    const strip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    await expect(strip).toContainText('20+');
    await expect(strip).toContainText('3-letter J words');
  });
});

test.describe('Shortest Words With J — JO Hero Card — Positive', () => {

  test('JO hero card is visible with essential badge', async ({ page }) => {
    await page.goto(PAGE);
    const card = page.locator('.border-2.border-amber-500\\/50');
    await expect(card).toBeVisible();
    await expect(card).toContainText('Essential');
  });

  test('JO hero card shows word JO with score', async ({ page }) => {
    await page.goto(PAGE);
    const card = page.locator('.border-2.border-amber-500\\/50');
    await expect(card).toContainText('JO');
    await expect(card).toContainText('9 points');
    await expect(card).toContainText('2 letters');
  });

  test('JO hero card mentions SOWPODS + TWL validity', async ({ page }) => {
    await page.goto(PAGE);
    const card = page.locator('.border-2.border-amber-500\\/50');
    await expect(card).toContainText('SOWPODS + TWL');
  });
});

test.describe('Shortest Words With J — Word Table — Positive', () => {

  test('word table is visible with headers', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table');
    await expect(table).toBeVisible();
    await expect(table).toContainText('Word');
    await expect(table).toContainText('Score');
    await expect(table).toContainText('Meaning');
  });

  test('word table has 14 word entries', async ({ page }) => {
    await page.goto(PAGE);
    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(14);
  });

  test('word table includes JAW at 13 points', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table');
    await expect(table).toContainText('JAW');
    await expect(table).toContainText('13');
  });

  test('word table includes JET at 10 points', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table');
    await expect(table).toContainText('JET');
    await expect(table).toContainText('10');
  });
});

test.describe('Shortest Words With J — Scoring Pattern Insight — Positive', () => {

  test('scoring pattern callout is visible', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('.border-blue-500\\/30.bg-blue-950\\/20').first();
    await expect(callout).toBeVisible();
    await expect(callout).toContainText('Scoring Pattern');
  });

  test('scoring pattern mentions high-value consonant strategy', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('.border-blue-500\\/30.bg-blue-950\\/20').first();
    await expect(callout).toContainText('high-value consonant');
    await expect(callout).toContainText('JAW/JAY/JOW/JOY');
  });
});

test.describe('Shortest Words With J — Premium Square Strategy — Positive', () => {

  test('premium square strategy cards are visible', async ({ page }) => {
    await page.goto(PAGE);
    const greenCards = page.locator('.border-green-500\\/30.bg-green-950\\/10');
    await expect(greenCards).toHaveCount(2);
  });

  test('double letter card mentions J becomes 16 points', async ({ page }) => {
    await page.goto(PAGE);
    const greenCards = page.locator('.border-green-500\\/30.bg-green-950\\/10');
    await expect(greenCards.nth(0)).toContainText('Double Letter');
    await expect(greenCards.nth(0)).toContainText('16 points');
  });

  test('triple letter card mentions J becomes 24 points', async ({ page }) => {
    await page.goto(PAGE);
    const greenCards = page.locator('.border-green-500\\/30.bg-green-950\\/10');
    await expect(greenCards.nth(1)).toContainText('Triple Letter');
    await expect(greenCards.nth(1)).toContainText('24 points');
  });

  test('double word and parallel play amber cards are visible', async ({ page }) => {
    await page.goto(PAGE);
    // The amber cards inside the premium square grid (not the stat strip)
    const grid = page.locator('.grid.grid-cols-1.sm\\:grid-cols-2');
    const amberCards = grid.locator('.border-amber-500\\/30.bg-amber-950\\/10');
    await expect(amberCards).toHaveCount(2);
  });
});

test.describe('Shortest Words With J — When to Play Tips — Positive', () => {

  test('4 purple strategy tip cards are visible', async ({ page }) => {
    await page.goto(PAGE);
    const tips = page.locator('.border-purple-500\\/30.bg-purple-950\\/20');
    await expect(tips).toHaveCount(4);
  });

  test('strategy tips mention tight board scenario', async ({ page }) => {
    await page.goto(PAGE);
    const tips = page.locator('.border-purple-500\\/30.bg-purple-950\\/20');
    await expect(tips.nth(0)).toContainText('Tight board');
  });

  test('strategy tips mention late game scenario', async ({ page }) => {
    await page.goto(PAGE);
    const tips = page.locator('.border-purple-500\\/30.bg-purple-950\\/20');
    await expect(tips.nth(1)).toContainText('Late game');
  });

  test('strategy tips mention rack balance', async ({ page }) => {
    await page.goto(PAGE);
    const tips = page.locator('.border-purple-500\\/30.bg-purple-950\\/20');
    await expect(tips.nth(3)).toContainText('Rack balance');
  });
});

test.describe('Shortest Words With J — Cross-Links — Positive', () => {

  test('dig deeper block is visible', async ({ page }) => {
    await page.goto(PAGE);
    const block = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10').first();
    await expect(block).toBeVisible();
    await expect(block).toContainText('Dig Deeper');
  });

  test('cross-links contain 3 links to related posts', async ({ page }) => {
    await page.goto(PAGE);
    const block = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10').first();
    const links = block.locator('a');
    await expect(links).toHaveCount(3);
    await expect(links.nth(0)).toHaveAttribute('href', '/blog/best-j-words-scrabble/');
    await expect(links.nth(1)).toHaveAttribute('href', '/blog/shortest-words-with-x/');
    await expect(links.nth(2)).toHaveAttribute('href', '/blog/shortest-words-with-z/');
  });
});

test.describe('Shortest Words With J — SOWPODS Pill Badges — Positive', () => {

  test('SOWPODS-only word badges are visible', async ({ page }) => {
    await page.goto(PAGE);
    const badges = page.locator('.flex.flex-wrap.items-center.justify-center.gap-3 .inline-flex');
    await expect(badges).toHaveCount(5);
  });

  test('pill badges include JAI, JAK, JEE, JEW, JOE', async ({ page }) => {
    await page.goto(PAGE);
    const container = page.locator('.flex.flex-wrap.items-center.justify-center.gap-3');
    await expect(container).toContainText('JAI');
    await expect(container).toContainText('JAK');
    await expect(container).toContainText('JEE');
    await expect(container).toContainText('JEW');
    await expect(container).toContainText('JOE');
  });
});

test.describe('Shortest Words With J — Dictionary Warning — Positive', () => {

  test('dictionary check warning callout is visible', async ({ page }) => {
    await page.goto(PAGE);
    const warnings = page.locator('.border-amber-500\\/30.bg-amber-950\\/10');
    // The dictionary warning is the last amber callout (after stat strip)
    const dictionaryWarning = warnings.last();
    await expect(dictionaryWarning).toContainText('Dictionary Check');
  });

  test('dictionary warning mentions challenged off the board', async ({ page }) => {
    await page.goto(PAGE);
    const warnings = page.locator('.border-amber-500\\/30.bg-amber-950\\/10');
    const dictionaryWarning = warnings.last();
    await expect(dictionaryWarning).toContainText('challenged off the board');
  });
});

test.describe('Shortest Words With J — Related Articles & CTA — Positive', () => {

  test('related articles aside has 3 links', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside');
    const links = aside.locator('a');
    await expect(links).toHaveCount(3);
  });

  test('related articles links point to correct pages', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside');
    const links = aside.locator('a');
    await expect(links.nth(0)).toHaveAttribute('href', '/blog/best-j-words-scrabble/');
    await expect(links.nth(1)).toHaveAttribute('href', '/blog/high-scoring-short-words/');
    await expect(links.nth(2)).toHaveAttribute('href', '/blog/best-words-for-premium-squares/');
  });

  test('CTA box is visible with word finder link', async ({ page }) => {
    await page.goto(PAGE);
    const cta = page.locator('.border-blue-800.rounded-xl');
    await expect(cta).toBeVisible();
    await expect(cta).toContainText('Find every J word');
    const link = cta.locator('a[href="/"]');
    await expect(link).toContainText('Open Word Finder');
  });
});

test.describe('Shortest Words With J — Schema & SEO — Positive', () => {

  test('Article schema is present in page source', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    let hasArticle = false;
    for (let i = 0; i < count; i++) {
      const text = await scripts.nth(i).textContent();
      if (text?.includes('"@type":"Article"') || text?.includes('"@type": "Article"')) {
        hasArticle = true;
      }
    }
    expect(hasArticle).toBe(true);
  });

  test('FAQPage schema is present in page source', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    let hasFAQ = false;
    for (let i = 0; i < count; i++) {
      const text = await scripts.nth(i).textContent();
      if (text?.includes('"@type":"FAQPage"') || text?.includes('"@type": "FAQPage"')) {
        hasFAQ = true;
      }
    }
    expect(hasFAQ).toBe(true);
  });

  test('FAQPage schema has 3 questions', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    for (let i = 0; i < count; i++) {
      const text = await scripts.nth(i).textContent();
      if (text?.includes('FAQPage')) {
        const json = JSON.parse(text!);
        expect(json.mainEntity).toHaveLength(3);
        break;
      }
    }
  });
});

test.describe('Shortest Words With J — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate h1 elements in article', async ({ page }) => {
    await page.goto(PAGE);
    const h1s = page.locator('article h1');
    await expect(h1s).toHaveCount(1);
  });

  test('no duplicate JO hero cards', async ({ page }) => {
    await page.goto(PAGE);
    const heroCards = page.locator('.border-2.border-amber-500\\/50');
    await expect(heroCards).toHaveCount(1);
  });

  test('no duplicate word tables', async ({ page }) => {
    await page.goto(PAGE);
    const tables = page.locator('table');
    await expect(tables).toHaveCount(1);
  });

  test('word table cells are not empty', async ({ page }) => {
    await page.goto(PAGE);
    const cells = page.locator('table tbody td');
    const count = await cells.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const text = await cells.nth(i).textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('no duplicate cross-link sections', async ({ page }) => {
    await page.goto(PAGE);
    const crossLinks = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10');
    await expect(crossLinks).toHaveCount(1);
  });

  test('all internal links have trailing slashes', async ({ page }) => {
    await page.goto(PAGE);
    const internalLinks = page.locator('a[href^="/"]');
    const count = await internalLinks.count();
    for (let i = 0; i < count; i++) {
      const href = await internalLinks.nth(i).getAttribute('href');
      if (href && !href.includes('.') && !href.includes('#') && !href.includes('?')) {
        expect(href).toMatch(/\/$/);
      }
    }
  });

  test('related articles aside does not have duplicate links', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside');
    const links = aside.locator('a');
    const count = await links.count();
    const hrefs = new Set<string>();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(hrefs.has(href!)).toBe(false);
      hrefs.add(href!);
    }
  });
});
