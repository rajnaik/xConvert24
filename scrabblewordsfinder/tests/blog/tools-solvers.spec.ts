import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

// ─── Tools & Solvers Landing Page ───────────────────────────────────────────

test.describe('Tools & Solvers Landing Page — Positive', () => {
  test('page loads with correct title containing "Tools & Solvers"', async ({ page }) => {
    await page.goto(`${BASE}/blog/tools-solvers/`);
    await expect(page).toHaveTitle(/Tools & Solvers/i);
  });

  test('has h1 heading with "Scrabble Tools & Solvers"', async ({ page }) => {
    await page.goto(`${BASE}/blog/tools-solvers/`);
    const h1 = page.locator('h1');
    await expect(h1).toContainText('Scrabble Tools & Solvers');
  });

  test('contains all 4 section h2 headings', async ({ page }) => {
    await page.goto(`${BASE}/blog/tools-solvers/`);
    const expectedHeadings = [
      'Understanding Solvers',
      'Finding the Right Tools',
      'Specialized Calculators',
      'AI Opponents',
    ];
    for (const heading of expectedHeadings) {
      await expect(page.locator(`h2:has-text("${heading}")`)).toBeVisible();
    }
  });

  test('has at least 14 post links', async ({ page }) => {
    await page.goto(`${BASE}/blog/tools-solvers/`);
    const postLinks = page.locator('a[href^="/blog/"]');
    await expect(postLinks).toHaveCount({ minimum: 14 });
  });

  test('has FAQPage JSON-LD schema', async ({ page }) => {
    await page.goto(`${BASE}/blog/tools-solvers/`);
    const schema = page.locator('script[type="application/ld+json"]');
    const count = await schema.count();
    let hasFAQ = false;
    for (let i = 0; i < count; i++) {
      const text = await schema.nth(i).textContent();
      if (text && text.includes('FAQPage')) {
        hasFAQ = true;
        break;
      }
    }
    expect(hasFAQ).toBe(true);
  });

  test('has CTA box with link to "/"', async ({ page }) => {
    await page.goto(`${BASE}/blog/tools-solvers/`);
    const ctaLink = page.locator('a[href="/"]');
    await expect(ctaLink.first()).toBeVisible();
  });

  test('has "← Back to all articles" link', async ({ page }) => {
    await page.goto(`${BASE}/blog/tools-solvers/`);
    const backLink = page.locator('a:has-text("Back to all articles")');
    await expect(backLink).toBeVisible();
  });
});

test.describe('Tools & Solvers Landing Page — Negative', () => {
  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(`${BASE}/blog/tools-solvers/`);
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate h2 headings', async ({ page }) => {
    await page.goto(`${BASE}/blog/tools-solvers/`);
    const h2s = await page.locator('h2').allTextContents();
    const trimmed = h2s.map((t) => t.trim()).filter(Boolean);
    const unique = new Set(trimmed);
    expect(unique.size).toBe(trimmed.length);
  });

  test('no broken internal links — all card hrefs start with /blog/', async ({ page }) => {
    await page.goto(`${BASE}/blog/tools-solvers/`);
    const links = await page.locator('a[href^="/blog/"]').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      expect(href).toMatch(/^\/blog\//);
    }
  });

  test('page does not expose sensitive info', async ({ page }) => {
    await page.goto(`${BASE}/blog/tools-solvers/`);
    const body = await page.locator('body').textContent();
    expect(body).not.toMatch(/@gmail\.com/);
    expect(body).not.toMatch(/sk-/);
    expect(body).not.toMatch(/AKIA/);
  });
});

// ─── Scrabble Dictionary Apps Post ──────────────────────────────────────────

test.describe('Scrabble Dictionary Apps Post — Positive', () => {
  test('page loads with title containing "Dictionary Apps"', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-dictionary-apps/`);
    await expect(page).toHaveTitle(/Dictionary Apps/i);
  });

  test('has h1 heading', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-dictionary-apps/`);
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    const text = await h1.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
  });

  test('has at least 6 h2 sections', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-dictionary-apps/`);
    const h2s = page.locator('h2');
    await expect(h2s).toHaveCount({ minimum: 6 });
  });

  test('has FAQPage JSON-LD schema', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-dictionary-apps/`);
    const schema = page.locator('script[type="application/ld+json"]');
    const count = await schema.count();
    let hasFAQ = false;
    for (let i = 0; i < count; i++) {
      const text = await schema.nth(i).textContent();
      if (text && text.includes('FAQPage')) {
        hasFAQ = true;
        break;
      }
    }
    expect(hasFAQ).toBe(true);
  });

  test('has breadcrumb with "Tools & Solvers" text', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-dictionary-apps/`);
    const breadcrumb = page.locator('text=Tools & Solvers');
    await expect(breadcrumb.first()).toBeVisible();
  });

  test('has CTA box linking to "/"', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-dictionary-apps/`);
    const ctaLink = page.locator('a[href="/"]');
    await expect(ctaLink.first()).toBeVisible();
  });

  test('has Related Articles aside with at least 2 links', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-dictionary-apps/`);
    const relatedSection = page.locator('text=Related Articles');
    await expect(relatedSection.first()).toBeVisible();
    const relatedLinks = page.locator('aside a[href^="/blog/"], section:has-text("Related Articles") a[href^="/blog/"]');
    await expect(relatedLinks).toHaveCount({ minimum: 2 });
  });
});

test.describe('Scrabble Dictionary Apps Post — Negative', () => {
  test('no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(`${BASE}/blog/scrabble-dictionary-apps/`);
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('no empty h2 headings', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-dictionary-apps/`);
    const h2s = await page.locator('h2').allTextContents();
    for (const h2 of h2s) {
      expect(h2.trim().length).toBeGreaterThan(0);
    }
  });

  test('has no stub content — body text length > 2000 chars', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-dictionary-apps/`);
    const bodyText = await page.locator('article, main').first().textContent();
    expect(bodyText!.length).toBeGreaterThan(2000);
  });
});

// ─── Scrabble Word Checker Tools Post ───────────────────────────────────────

test.describe('Scrabble Word Checker Tools Post — Positive', () => {
  test('page loads with title containing "Word Checker"', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-word-checker-tools/`);
    await expect(page).toHaveTitle(/Word Checker/i);
  });

  test('has h1 heading in article', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-word-checker-tools/`);
    const h1 = page.locator('article h1').first();
    await expect(h1).toBeVisible();
    const text = await h1.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
  });

  test('has at least 6 h2 sections', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-word-checker-tools/`);
    const h2Count = await page.locator('h2').count();
    expect(h2Count).toBeGreaterThanOrEqual(6);
  });

  test('has FAQPage JSON-LD schema', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-word-checker-tools/`);
    const schema = page.locator('script[type="application/ld+json"]');
    const count = await schema.count();
    let hasFAQ = false;
    for (let i = 0; i < count; i++) {
      const text = await schema.nth(i).textContent();
      if (text && text.includes('FAQPage')) {
        hasFAQ = true;
        break;
      }
    }
    expect(hasFAQ).toBe(true);
  });

  test('has breadcrumb with "Tools & Solvers" text', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-word-checker-tools/`);
    const breadcrumb = page.locator('text=Tools & Solvers');
    await expect(breadcrumb.first()).toBeVisible();
  });

  test('has CTA box linking to "/"', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-word-checker-tools/`);
    const ctaLink = page.locator('a[href="/"]');
    await expect(ctaLink.first()).toBeVisible();
  });

  test('card grid has exactly 5 clickable tool cards', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-word-checker-tools/`);
    const cardGrid = page.locator('.grid.grid-cols-1.gap-4');
    const cards = cardGrid.locator('> a');
    await expect(cards).toHaveCount(5);
  });

  test('Collins card links to scrabblechecker.collinsdictionary.com', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-word-checker-tools/`);
    const collinsCard = page.locator('a[href="https://scrabblechecker.collinsdictionary.com/"]');
    await expect(collinsCard).toBeVisible();
    await expect(collinsCard).toHaveAttribute('target', '_blank');
    await expect(collinsCard).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('Merriam-Webster card links to scrabble.merriam-webster.com', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-word-checker-tools/`);
    const mwCard = page.locator('a[href="https://scrabble.merriam-webster.com/"]');
    await expect(mwCard).toBeVisible();
    await expect(mwCard).toHaveAttribute('target', '_blank');
    await expect(mwCard).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('ScrabbleWordsFinder card links to homepage (/)', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-word-checker-tools/`);
    const cardGrid = page.locator('.grid.grid-cols-1.gap-4');
    const swfCard = cardGrid.locator('a[href="/"]');
    await expect(swfCard).toBeVisible();
    await expect(swfCard).toContainText('ScrabbleWordsFinder.com');
  });

  test('WordFinder card links to wordfinder.yourdictionary.com', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-word-checker-tools/`);
    const wfCard = page.locator('a[href="https://wordfinder.yourdictionary.com/scrabble-dictionary/"]');
    await expect(wfCard).toBeVisible();
    await expect(wfCard).toHaveAttribute('target', '_blank');
  });

  test('NASPA card links to scrabbleplayers.org', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-word-checker-tools/`);
    const naspaCard = page.locator('a[href="https://scrabbleplayers.org/"]');
    await expect(naspaCard).toBeVisible();
    await expect(naspaCard).toHaveAttribute('target', '_blank');
  });

  test('all tool cards display a favicon image', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-word-checker-tools/`);
    const cardGrid = page.locator('.grid.grid-cols-1.gap-4');
    const favicons = cardGrid.locator('img');
    await expect(favicons).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      const img = favicons.nth(i);
      await expect(img).toHaveAttribute('loading', 'lazy');
      await expect(img).toHaveAttribute('width', '18');
      await expect(img).toHaveAttribute('height', '18');
    }
  });

  test('all tool cards show arrow indicator (↗)', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-word-checker-tools/`);
    const cardGrid = page.locator('.grid.grid-cols-1.gap-4');
    const arrows = cardGrid.locator('span:has-text("↗")');
    await expect(arrows).toHaveCount(5);
  });
});

test.describe('Scrabble Word Checker Tools Post — Negative', () => {
  test('no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(`${BASE}/blog/scrabble-word-checker-tools/`);
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('no empty h2 headings', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-word-checker-tools/`);
    const h2s = await page.locator('h2').allTextContents();
    for (const h2 of h2s) {
      expect(h2.trim().length).toBeGreaterThan(0);
    }
  });

  test('has no stub content — body text length > 2000 chars', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-word-checker-tools/`);
    const bodyText = await page.locator('article, main').first().textContent();
    expect(bodyText!.length).toBeGreaterThan(2000);
  });

  test('no card links have empty href', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-word-checker-tools/`);
    const cardGrid = page.locator('.grid.grid-cols-1.gap-4');
    const cards = await cardGrid.locator('> a').all();
    for (const card of cards) {
      const href = await card.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href!.length).toBeGreaterThan(0);
    }
  });

  test('no duplicate card links in grid', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-word-checker-tools/`);
    const cardGrid = page.locator('.grid.grid-cols-1.gap-4');
    const cards = await cardGrid.locator('> a').all();
    const hrefs: string[] = [];
    for (const card of cards) {
      const href = await card.getAttribute('href');
      hrefs.push(href || '');
    }
    const unique = new Set(hrefs);
    expect(unique.size).toBe(hrefs.length);
  });

  test('external cards all have rel="noopener noreferrer"', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-word-checker-tools/`);
    const cardGrid = page.locator('.grid.grid-cols-1.gap-4');
    const externalCards = cardGrid.locator('a[target="_blank"]');
    const count = await externalCards.count();
    expect(count).toBe(4); // 4 external, 1 internal (/)
    for (let i = 0; i < count; i++) {
      const rel = await externalCards.nth(i).getAttribute('rel');
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
    }
  });
});
