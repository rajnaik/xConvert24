import { test, expect } from '@playwright/test';

const PAGE = '/blog/managing-a-consonant-heavy-rack/';

test.describe('Managing a Consonant-Heavy Rack — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('h1 heading is correct', async ({ page }) => {
    await page.goto(PAGE);
    const h1 = page.locator('article h1');
    await expect(h1).toContainText('Managing a Consonant-Heavy Rack in Scrabble');
  });

  test('breadcrumb links to blog index', async ({ page }) => {
    await page.goto(PAGE);
    const blogLink = page.locator('nav a[href="/blog/"]');
    await expect(blogLink).toBeVisible();
  });

  test('article meta shows date and read time', async ({ page }) => {
    await page.goto(PAGE);
    const time = page.locator('time[datetime="2026-06-22"]');
    await expect(time).toBeVisible();
    const readTime = page.locator('text=8 min read');
    await expect(readTime).toBeVisible();
  });

  test('word finder link in meta section exists', async ({ page }) => {
    await page.goto(PAGE);
    const metaSection = page.locator('.not-prose.mb-8.flex');
    const finderLink = metaSection.locator('a[href="/"]').filter({ hasText: 'Word Finder' });
    await expect(finderLink).toBeVisible();
  });

  test('Y-as-Vowel Words h2 section exists', async ({ page }) => {
    await page.goto(PAGE);
    const h2 = page.locator('h2:has-text("Y-as-Vowel Words")');
    await expect(h2).toBeVisible();
  });

  test('5+ Letter Y-Words card is visible with word list', async ({ page }) => {
    await page.goto(PAGE);
    const card = page.locator('.border-purple-500\\/30.bg-purple-950\\/20').filter({ hasText: '5+ Letter Y-Words' });
    await expect(card).toBeVisible();
    await expect(card).toContainText('CRYPT');
    await expect(card).toContainText('GLYPH');
    await expect(card).toContainText('LYMPH');
  });

  test('3-4 Letter Y-Words card is visible with word list', async ({ page }) => {
    await page.goto(PAGE);
    const card = page.locator('.border-purple-500\\/30.bg-purple-950\\/20').filter({ hasText: '3-4 Letter Y-Words' });
    await expect(card).toBeVisible();
    await expect(card).toContainText('CRY');
    await expect(card).toContainText('SKY');
    await expect(card).toContainText('WHY');
  });

  test('RHYTHM stat strip is visible with scores', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.border-amber-500\\/30.bg-amber-950\\/10').first();
    await expect(statStrip).toBeVisible();
    await expect(statStrip).toContainText('RHYTHM');
    await expect(statStrip).toContainText('22 pts');
    await expect(statStrip).toContainText('GLYPH');
    await expect(statStrip).toContainText('14 pts');
    await expect(statStrip).toContainText('LYMPH');
    await expect(statStrip).toContainText('15 pts');
  });

  test('True Vowelless Words h2 section exists', async ({ page }) => {
    await page.goto(PAGE);
    const h2 = page.locator('h2:has-text("True Vowelless Words")');
    await expect(h2).toBeVisible();
  });

  test('Valid Vowelless Words SOWPODS card is visible', async ({ page }) => {
    await page.goto(PAGE);
    const card = page.locator('.border-cyan-500\\/30.bg-cyan-950\\/10').filter({ hasText: 'Valid Vowelless Words (SOWPODS)' });
    await expect(card).toBeVisible();
    await expect(card).toContainText('CWM');
    await expect(card).toContainText('CRWTH');
    await expect(card).toContainText('TSK');
    await expect(card).toContainText('PFFT');
  });

  test('CWM & CRWTH insight callout is visible', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('.border-blue-500\\/30.bg-blue-950\\/20').filter({ hasText: 'CWM & CRWTH' });
    await expect(callout).toBeVisible();
    await expect(callout).toContainText('Welsh-origin words');
    await expect(callout).toContainText('bowl-shaped valley');
  });

  test('Short Consonant Dumps h2 section exists', async ({ page }) => {
    await page.goto(PAGE);
    const h2 = page.locator('h2:has-text("Short Consonant Dumps")');
    await expect(h2).toBeVisible();
  });

  test('consonant dump strategy purple tiles are visible', async ({ page }) => {
    await page.goto(PAGE);
    const tiles = page.locator('.border-purple-500\\/30.bg-purple-950\\/20.hover\\:border-purple-400');
    const count = await tiles.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('3-letter dumps strategy tile mentions board vowels', async ({ page }) => {
    await page.goto(PAGE);
    const tile = page.locator('.border-purple-500\\/30.bg-purple-950\\/20').filter({ hasText: '3-letter dumps using board vowels' });
    await expect(tile).toBeVisible();
  });

  test('exchange threshold tile mentions 12 points', async ({ page }) => {
    await page.goto(PAGE);
    const tile = page.locator('.border-purple-500\\/30.bg-purple-950\\/20').filter({ hasText: 'Exchange threshold' });
    await expect(tile).toBeVisible();
    await expect(tile).toContainText('12 points');
  });

  test('Dig Deeper cross-links section exists', async ({ page }) => {
    await page.goto(PAGE);
    const crossLinks = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10').filter({ hasText: 'Dig Deeper' });
    await expect(crossLinks).toBeVisible();
    await expect(crossLinks).toContainText('Dig Deeper');
  });

  test('cross-links include related articles', async ({ page }) => {
    await page.goto(PAGE);
    const crossLinks = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10').filter({ hasText: 'Dig Deeper' });
    const links = crossLinks.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('Preventing Consonant Floods h2 section exists', async ({ page }) => {
    await page.goto(PAGE);
    const h2 = page.locator('h2:has-text("Preventing Consonant Floods")');
    await expect(h2).toBeVisible();
  });

  test('consonant-safe vs flood-risk comparison cards are visible', async ({ page }) => {
    await page.goto(PAGE);
    const safeCard = page.locator('.border-green-500\\/30').filter({ hasText: 'Consonant-Safe Leaves' });
    const riskCard = page.locator('.border-red-500\\/30').filter({ hasText: 'Flood-Risk Leaves' });
    await expect(safeCard).toBeVisible();
    await expect(riskCard).toBeVisible();
  });

  test('safe leaves card mentions ET, ER, EN patterns', async ({ page }) => {
    await page.goto(PAGE);
    const safeCard = page.locator('.border-green-500\\/30').filter({ hasText: 'Consonant-Safe Leaves' });
    await expect(safeCard).toContainText('ET');
    await expect(safeCard).toContainText('ER');
    await expect(safeCard).toContainText('EN');
  });

  test('lead paragraph mentions the BCKRTW example rack', async ({ page }) => {
    await page.goto(PAGE);
    const lead = page.locator('p.text-lg.leading-relaxed').first();
    await expect(lead).toContainText('B, C, K, N, R, T, W');
  });
});

test.describe('Managing a Consonant-Heavy Rack — Negative', () => {

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

  test('no duplicate CWM & CRWTH callouts', async ({ page }) => {
    await page.goto(PAGE);
    const callouts = page.locator('.border-blue-500\\/30.bg-blue-950\\/20').filter({ hasText: 'CWM & CRWTH' });
    await expect(callouts).toHaveCount(1);
  });

  test('no duplicate Dig Deeper blocks', async ({ page }) => {
    await page.goto(PAGE);
    const blocks = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10').filter({ hasText: 'Dig Deeper' });
    await expect(blocks).toHaveCount(1);
  });

  test('page does not link to itself', async ({ page }) => {
    await page.goto(PAGE);
    const selfLinks = page.locator(`a[href="${PAGE}"]`);
    await expect(selfLinks).toHaveCount(0);
  });

  test('JSON-LD structured data is present in page source', async ({ page }) => {
    await page.goto(PAGE);
    const scripts = page.locator('script[type="application/ld+json"]');
    const count = await scripts.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('no duplicate Y-as-Vowel heading sections', async ({ page }) => {
    await page.goto(PAGE);
    const h2s = page.locator('h2:has-text("Y-as-Vowel Words")');
    await expect(h2s).toHaveCount(1);
  });

  test('no duplicate True Vowelless Words heading sections', async ({ page }) => {
    await page.goto(PAGE);
    const h2s = page.locator('h2:has-text("True Vowelless Words")');
    await expect(h2s).toHaveCount(1);
  });

  test('cross-link hrefs do not point to current page', async ({ page }) => {
    await page.goto(PAGE);
    const crossLinkSection = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10');
    const links = crossLinkSection.locator('a');
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).not.toContain('managing-a-consonant-heavy-rack');
    }
  });

  test('comparison cards are not duplicated', async ({ page }) => {
    await page.goto(PAGE);
    const safeCards = page.locator('.border-green-500\\/30').filter({ hasText: 'Consonant-Safe Leaves' });
    await expect(safeCards).toHaveCount(1);
    const riskCards = page.locator('.border-red-500\\/30').filter({ hasText: 'Flood-Risk Leaves' });
    await expect(riskCards).toHaveCount(1);
  });
});
