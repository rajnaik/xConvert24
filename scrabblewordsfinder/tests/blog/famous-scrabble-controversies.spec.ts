import { test, expect } from '@playwright/test';

const PAGE = '/blog/famous-scrabble-controversies/';

test.describe('Famous Scrabble Controversies — Positive', () => {

  test('page loads successfully with 200 status (blog gate allows published)', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('h1 title contains full heading text', async ({ page }) => {
    await page.goto(PAGE);
    const h1 = page.locator('article h1').first();
    await expect(h1).toContainText('Famous Scrabble Controversies');
    await expect(h1).toContainText('Cheating, Disputes, and Rule Changes');
  });

  test('BlogCrossLinks tool links visible (Word Finder + Dictionary)', async ({ page }) => {
    await page.goto(PAGE);
    const toolLinks = page.locator('a[title="Word Finder"], a[title="Dictionary"]');
    await expect(toolLinks).toHaveCount(2);
    await expect(page.locator('a[title="Word Finder"]')).toHaveAttribute('href', '/');
    await expect(page.locator('a[title="Dictionary"]')).toHaveAttribute('href', '/dictionary');
  });

  test('favourite button is visible and functional', async ({ page }) => {
    await page.goto(PAGE);
    const favBtn = page.locator('#blog-fav-btn');
    await expect(favBtn).toBeVisible();
    await expect(favBtn).toHaveAttribute('aria-label', 'Add to favourites');
  });

  test('controversy timeline hero shows 3 years (2005, 2012, 2020)', async ({ page }) => {
    await page.goto(PAGE);
    const hero = page.locator('.border-red-500\\/50');
    await expect(hero).toBeVisible();
    await expect(hero.locator('text=2005')).toBeVisible();
    await expect(hero.locator('text=2012')).toBeVisible();
    await expect(hero.locator('text=2020')).toBeVisible();
  });

  test('Blank Tile Scandal section with 3 purple cards', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('h2:has-text("Blank Tile Scandal")')).toBeVisible();
    await expect(page.locator('text=tile palming:')).toBeVisible();
    await expect(page.locator('text=The 2012 incident:')).toBeVisible();
    await expect(page.locator('text=The aftermath:')).toBeVisible();
  });

  test('amber warning callout about blanks is visible', async ({ page }) => {
    await page.goto(PAGE);
    const callout = page.locator('text=Why Blanks Matter So Much');
    await expect(callout).toBeVisible();
    await expect(page.locator('text=2 blank tiles out of 100 total')).toBeVisible();
  });

  test('Clock Disputes section with cyan cards visible', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('h2:has-text("Clock Disputes")')).toBeVisible();
    await expect(page.locator('text=Deliberate Stalling')).toBeVisible();
    await expect(page.locator('text=Clock Malfunctions')).toBeVisible();
    await expect(page.locator('text=Forgetting to Press')).toBeVisible();
    await expect(page.locator('text=The Solution')).toBeVisible();
  });

  test('Dictionary Wars section shows TWL and Collins comparison', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('h2:has-text("Dictionary Wars")')).toBeVisible();
    await expect(page.locator('text=TWL (Tournament Word List)')).toBeVisible();
    await expect(page.locator('text=Collins (SOWPODS)')).toBeVisible();
  });

  test('Offensive Words Removal section with pro/anti arguments', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('h2:has-text("Offensive Words Removal")')).toBeVisible();
    await expect(page.locator('text=The pro-removal argument:')).toBeVisible();
    await expect(page.locator('text=The anti-removal argument:')).toBeVisible();
    await expect(page.locator('text=The outcome:')).toBeVisible();
  });

  test('Challenge Rule section with numbered steps', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('h2:has-text("Challenge Rule Controversies")')).toBeVisible();
    await expect(page.locator('text=Bluffing with phoneys:')).toBeVisible();
    await expect(page.locator('text=Strategic challenging:')).toBeVisible();
  });

  test('rules table shows controversy-to-rule mappings', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table');
    await expect(table).toBeVisible();
    await expect(table.locator('text=Tile palming')).toBeVisible();
    await expect(table.locator('text=Offensive words')).toBeVisible();
    await expect(table.locator('text=Phoney bluffing')).toBeVisible();
  });

  test('Dig Deeper panel links to related posts', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('text=Dig Deeper')).toBeVisible();
    const digDeeper = page.locator('.border-indigo-500\\/30');
    await expect(digDeeper.locator('a[href="/blog/famous-scrabble-matches/"]')).toBeVisible();
    await expect(digDeeper.locator('a[href="/blog/celebrity-scrabble-players/"]')).toBeVisible();
  });

  test('Related Articles aside has 3 links', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside');
    await expect(aside).toBeVisible();
    await expect(aside.locator('a')).toHaveCount(3);
  });

  test('CTA box with Word Finder link is visible', async ({ page }) => {
    await page.goto(PAGE);
    const cta = page.locator('a:has-text("Open Word Finder")');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/');
  });

  test('breadcrumb shows Tournament & Competitive category', async ({ page }) => {
    await page.goto(PAGE);
    const nav = page.locator('nav.text-sm');
    await expect(nav.locator('a[href="/blog/"]')).toBeVisible();
    await expect(nav.locator('a[href="/blog/tournament/"]')).toBeVisible();
    await expect(nav).toContainText('Tournament & Competitive');
  });

  test('read time shows 8 min read', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('text=8 min read')).toBeVisible();
  });

  test('back to all articles link is present', async ({ page }) => {
    await page.goto(PAGE);
    const backLink = page.locator('a:has-text("Back to all articles")');
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/blog/');
  });
});

test.describe('Famous Scrabble Controversies — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate h1 elements in article', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('article h1')).toHaveCount(1);
  });

  test('no duplicate controversy timeline heroes', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('.border-red-500\\/50')).toHaveCount(1);
  });

  test('page does not link to itself', async ({ page }) => {
    await page.goto(PAGE);
    const selfLinks = page.locator(`a[href="${PAGE}"], a[href="/blog/famous-scrabble-controversies"]`);
    await expect(selfLinks).toHaveCount(0);
  });

  test('no duplicate BlogCrossLinks tool links', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('a[title="Word Finder"]')).toHaveCount(1);
    await expect(page.locator('a[title="Dictionary"]')).toHaveCount(1);
  });

  test('no duplicate favourite buttons', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('#blog-fav-btn')).toHaveCount(1);
  });

  test('FAQ and Article schema present in page HTML', async ({ page }) => {
    await page.goto(PAGE);
    const content = await page.content();
    expect(content).toContain('"@type":"FAQPage"');
    expect(content).toContain('"@type":"Article"');
    expect(content).toContain('What are the biggest controversies in Scrabble history?');
    expect(content).toContain('Has anyone been caught cheating at competitive Scrabble?');
    expect(content).toContain('Why did Scrabble remove offensive words from the dictionary?');
  });

  test('no broken internal links (all hrefs start with /)', async ({ page }) => {
    await page.goto(PAGE);
    const links = page.locator('article a[href^="/"]');
    const count = await links.count();
    expect(count).toBeGreaterThan(5);
  });
});
