import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'https://www.scrabblewordsfinder.com';

test.describe('Badges Progression Guide Blog — Positive', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-badges-progression-guide/`);
    await expect(page).toHaveTitle(/Badges/i);
  });

  test('displays h1 heading with badges/progression content', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-badges-progression-guide/`);
    const heading = page.locator('article h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Badge');
  });

  test('has breadcrumb with Blog link', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-badges-progression-guide/`);
    const breadcrumb = page.locator('nav a[href="/blog/"]');
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb).toContainText('Blog');
  });

  test('has article meta with date and read time', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-badges-progression-guide/`);
    const time = page.locator('time[datetime="2026-06-29"]');
    await expect(time).toBeVisible();
    const readTime = page.locator('text=min read');
    await expect(readTime).toBeVisible();
  });

  test('has FAQPage JSON-LD schema', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-badges-progression-guide/`);
    const schema = page.locator('script[type="application/ld+json"]');
    const allSchemas = await schema.allTextContents();
    const hasFaq = allSchemas.some(s => s.includes('FAQPage'));
    expect(hasFaq).toBe(true);
  });

  test('has Article JSON-LD schema', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-badges-progression-guide/`);
    const schema = page.locator('script[type="application/ld+json"]');
    const allSchemas = await schema.allTextContents();
    const hasArticle = allSchemas.some(s => s.includes('"Article"'));
    expect(hasArticle).toBe(true);
  });

  test('displays all 5 achievement tiers in table', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-badges-progression-guide/`);
    const table = page.locator('article table', { hasText: 'Score Range' });
    await expect(table).toBeVisible();
    await expect(page.locator('article').locator('text=Rising Star').first()).toBeVisible();
    await expect(page.locator('article').locator('text=Word Builder').first()).toBeVisible();
    await expect(page.locator('article').locator('text=Hot Streak').first()).toBeVisible();
    await expect(page.locator('article').locator('text=Triple Threat').first()).toBeVisible();
    await expect(page.locator('article').locator('text=Scrabble Legend').first()).toBeVisible();
  });

  test('lists all 7 daily activities', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-badges-progression-guide/`);
    await expect(page.locator('article').locator('text=Word of the Day').first()).toBeVisible();
    await expect(page.locator('article').locator('text=Word Quiz').first()).toBeVisible();
    await expect(page.locator('article').locator('text=Memory WordBench').first()).toBeVisible();
    await expect(page.locator('article').locator('text=Daily Rack Challenge').first()).toBeVisible();
    await expect(page.locator('article').locator('text=Daily Anagram').first()).toBeVisible();
    await expect(page.locator('article').locator('text=60-Second Challenge').first()).toBeVisible();
    await expect(page.locator('article').locator('text=Cows and Bulls').first()).toBeVisible();
  });

  test('has CTA box linking to activities page', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-badges-progression-guide/`);
    const cta = page.locator('a[href="/activities/"]', { hasText: 'Open Activities' });
    await expect(cta).toBeVisible();
  });

  test('has back to blog link', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-badges-progression-guide/`);
    const backLink = page.locator('article a[href="/blog/"]', { hasText: 'Back to all articles' });
    await expect(backLink).toBeVisible();
  });

  test('has related articles section with links', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-badges-progression-guide/`);
    const aside = page.locator('article aside', { hasText: 'Related Articles' });
    await expect(aside).toBeVisible();
    const relatedLinks = aside.locator('a');
    expect(await relatedLinks.count()).toBeGreaterThanOrEqual(2);
  });

  test('has cross-link blocks with dig deeper sections', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-badges-progression-guide/`);
    const crossLinks = page.locator('text=Dig Deeper').or(page.locator('text=Related Guides'));
    expect(await crossLinks.count()).toBeGreaterThanOrEqual(1);
  });

  test('Dig Deeper section has link to /badges/ page', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-badges-progression-guide/`);
    const digDeeper = page.locator('.not-prose', { hasText: 'Dig Deeper' });
    const badgesLink = digDeeper.locator('a[href="/badges/"]');
    await expect(badgesLink).toBeVisible();
    await expect(badgesLink).toContainText('Diamond Badges');
  });

  test('Dig Deeper badges link mentions all 7 tiers', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-badges-progression-guide/`);
    const digDeeper = page.locator('.not-prose', { hasText: 'Dig Deeper' });
    const badgesLink = digDeeper.locator('a[href="/badges/"]');
    await expect(badgesLink).toContainText('Word Maker');
    await expect(badgesLink).toContainText('Lex Legend');
  });
});

test.describe('Badges Progression Guide Blog — Negative', () => {
  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/blog/scrabble-badges-progression-guide/`);
    await page.waitForTimeout(1000);
    expect(errors.filter(e => !e.includes('net::'))).toHaveLength(0);
  });

  test('does not expose sensitive information', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-badges-progression-guide/`);
    const content = await page.locator('article').textContent() || '';
    expect(content).not.toContain('sk-');
    expect(content).not.toContain('AKIA');
    expect(content).not.toContain('@gmail.com');
    expect(content).not.toContain('rajeev');
  });

  test('no duplicate h1 headings', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-badges-progression-guide/`);
    const h1s = page.locator('article h1');
    expect(await h1s.count()).toBe(1);
  });

  test('no duplicate /badges/ link in Dig Deeper section', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-badges-progression-guide/`);
    const digDeeper = page.locator('.not-prose', { hasText: 'Dig Deeper' });
    const badgesLinks = digDeeper.locator('a[href="/badges/"]');
    expect(await badgesLinks.count()).toBe(1);
  });

  test('no broken internal links', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-badges-progression-guide/`);
    const links = page.locator('article a[href^="/"]');
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).not.toContain('undefined');
      expect(href).not.toContain('null');
      expect(href).toMatch(/\/$/); // trailing slash
    }
  });

  test('table has correct number of tier rows', async ({ page }) => {
    await page.goto(`${BASE}/blog/scrabble-badges-progression-guide/`);
    const tierTable = page.locator('article table', { hasText: 'Score Range' });
    const rows = tierTable.locator('tbody tr');
    expect(await rows.count()).toBe(5);
  });
});

test.describe('Blog Index — Badges Tile — Positive', () => {
  test('badges tile exists in blog index activities section', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    const badgesTile = page.locator('a[href="/blog/scrabble-badges-progression-guide/"]');
    await expect(badgesTile).toBeVisible();
    await expect(badgesTile).toContainText('Badges');
  });
});

test.describe('Blog Index — Badges Tile — Negative', () => {
  test('only one badges tile exists', async ({ page }) => {
    await page.goto(`${BASE}/blog/`);
    const tiles = page.locator('a[href="/blog/scrabble-badges-progression-guide/"]');
    expect(await tiles.count()).toBe(1);
  });
});

test.describe('Useful Links — MyBag Badge Link — Positive', () => {
  test('MyBag badges link exists in player tools section', async ({ page }) => {
    await page.goto(`${BASE}/blog/useful-links/`);
    const mybagLink = page.locator('a[href="/mybag/"]', { hasText: 'Badges' });
    await expect(mybagLink).toBeVisible();
  });
});

test.describe('Useful Links — MyBag Badge Link — Negative', () => {
  test('MyBag link does not have broken href', async ({ page }) => {
    await page.goto(`${BASE}/blog/useful-links/`);
    const mybagLink = page.locator('a[href="/mybag/"]').first();
    const href = await mybagLink.getAttribute('href');
    expect(href).toBe('/mybag/');
    expect(href).not.toContain('undefined');
  });
});
