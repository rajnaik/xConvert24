import { test, expect } from '@playwright/test';

const PAGE = '/blog/celebrity-scrabble-players/';

test.describe('Celebrity Scrabble Players — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('h1 title contains full heading text', async ({ page }) => {
    await page.goto(PAGE);
    const h1 = page.locator('article h1').first();
    await expect(h1).toContainText('Celebrity Scrabble Players');
    await expect(h1).toContainText('Famous People Who Love the Game');
  });

  test('stats strip shows key numbers (150M+, 120+, 29, 1938)', async ({ page }) => {
    await page.goto(PAGE);
    const statsStrip = page.locator('.border-amber-500\\/30');
    await expect(statsStrip).toBeVisible();
    await expect(statsStrip.locator('text=150M+')).toBeVisible();
    await expect(statsStrip.locator('text=1938')).toBeVisible();
  });

  test('Hollywood section shows Keanu, Mel Gibson, Will Smith cards', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('h2:has-text("Hollywood")')).toBeVisible();
    await expect(page.locator('text=Keanu Reeves:')).toBeVisible();
    await expect(page.locator('text=Mel Gibson:')).toBeVisible();
    await expect(page.locator('text=Will Smith:')).toBeVisible();
  });

  test('Musicians section shows all 4 artist names', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('h2:has-text("Musicians and Wordsmiths")')).toBeVisible();
    await expect(page.getByText('🎵 Sting')).toBeVisible();
    await expect(page.getByText('🎵 Chris Martin (Coldplay)')).toBeVisible();
    await expect(page.getByText('🎵 Kylie Minogue')).toBeVisible();
    await expect(page.getByText('🎵 Moby')).toBeVisible();
  });

  test('Presidents section shows Nixon, Queen Elizabeth, Obama', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('h2:has-text("Presidents, Politicians")')).toBeVisible();
    await expect(page.locator('text=Richard Nixon')).toBeVisible();
    await expect(page.locator('text=Queen Elizabeth II:')).toBeVisible();
    await expect(page.locator('text=Barack Obama:')).toBeVisible();
  });

  test('Professional Gap insight callout is visible', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('text=The Professional Gap')).toBeVisible();
    await expect(page.locator('text=demolished by any serious competitive player')).toBeVisible();
  });

  test('Celebrity Charity Tournaments section with 3 numbered items', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('h2:has-text("Celebrity Charity Tournaments")')).toBeVisible();
    await expect(page.locator('text=Celebrity Scrabble fundraisers')).toBeVisible();
    await expect(page.locator('text=TV show appearances')).toBeVisible();
    await expect(page.locator('text=Social media challenges')).toBeVisible();
  });

  test('Dig Deeper panel links to related posts', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('text=Dig Deeper')).toBeVisible();
    const digDeeper = page.locator('.border-indigo-500\\/30');
    await expect(digDeeper.locator('a[href="/blog/famous-scrabble-matches/"]')).toBeVisible();
    await expect(digDeeper.locator('a[href="/blog/famous-scrabble-controversies/"]')).toBeVisible();
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

  test('read time shows 7 min read', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('text=7 min read')).toBeVisible();
  });
});

test.describe('Celebrity Scrabble Players — Negative', () => {

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

  test('no duplicate stats strips', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('.border-amber-500\\/30')).toHaveCount(1);
  });

  test('page does not link to itself', async ({ page }) => {
    await page.goto(PAGE);
    const selfLinks = page.locator(`a[href="${PAGE}"], a[href="/blog/celebrity-scrabble-players"]`);
    await expect(selfLinks).toHaveCount(0);
  });

  test('FAQ and Article schema present in page HTML', async ({ page }) => {
    await page.goto(PAGE);
    const content = await page.content();
    expect(content).toContain('"@type":"FAQPage"');
    expect(content).toContain('"@type":"Article"');
    expect(content).toContain('Which celebrities are known for playing Scrabble?');
  });
});
