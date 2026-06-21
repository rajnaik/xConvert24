import { test, expect } from '@playwright/test';

const PAGE = '/blog/best-words-for-premium-squares/';

test.describe('Best Words for Premium Squares — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('h1 heading is visible with correct text', async ({ page }) => {
    await page.goto(PAGE);
    const h1 = page.locator('article h1');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('Best Words for Premium Squares');
  });

  test('breadcrumb nav links to Strategy category', async ({ page }) => {
    await page.goto(PAGE);
    const strategyLink = page.locator('nav a[href="/blog/strategy/"]');
    await expect(strategyLink).toBeVisible();
    await expect(strategyLink).toContainText('Strategy');
  });

  test('premium squares table has all four square types', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table');
    await expect(table).toBeVisible();
    await expect(table.locator('td:text-is("DLS")')).toBeVisible();
    await expect(table.locator('td:text-is("TLS")')).toBeVisible();
    await expect(table.locator('td:text-is("DWS")')).toBeVisible();
    await expect(table.locator('td:text-is("TWS")')).toBeVisible();
  });

  test('hero card about TWS + TLS combo is visible', async ({ page }) => {
    await page.goto(PAGE);
    const heroCard = page.locator('text=TWS + TLS COMBO');
    await expect(heroCard).toBeVisible();
  });

  test('stat strip shows multiplication factors', async ({ page }) => {
    await page.goto(PAGE);
    const statStrip = page.locator('.flex:has(.text-amber-400:text-is("×9"))');
    await expect(statStrip).toBeVisible();
  });

  test('scoring examples section shows at least 4 worked examples', async ({ page }) => {
    await page.goto(PAGE);
    const scoringSection = page.locator('text=Scoring Examples — The Math').locator('..');
    await expect(scoringSection).toBeVisible();
    const examples = scoringSection.locator('.text-amber-400.font-bold');
    expect(await examples.count()).toBeGreaterThanOrEqual(4);
  });

  test('DLS/TLS/DWS/TWS target strategy cards are visible', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('p:has-text("DLS Targets")')).toBeVisible();
    await expect(page.locator('p:has-text("TLS Targets")')).toBeVisible();
    await expect(page.locator('p:has-text("DWS Targets")')).toBeVisible();
    await expect(page.locator('p:has-text("TWS Targets")')).toBeVisible();
  });

  test('Dig Deeper cross-link section has internal links', async ({ page }) => {
    await page.goto(PAGE);
    const digDeeper = page.locator('text=Dig Deeper').locator('..');
    await expect(digDeeper).toBeVisible();
    await expect(digDeeper.locator('a[href="/blog/understanding-premium-squares/"]')).toBeVisible();
  });

  test('offensive vs defensive comparison cards exist', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('p:has-text("Offensive Plays")')).toBeVisible();
    await expect(page.locator('p:has-text("Risky Plays to Avoid")')).toBeVisible();
  });

  test('decision framework checklist shows 5 numbered steps', async ({ page }) => {
    await page.goto(PAGE);
    const checklist = page.locator('text=Decision Checklist').locator('..');
    await expect(checklist).toBeVisible();
    const steps = checklist.locator('.rounded-full');
    expect(await steps.count()).toBe(5);
  });

  test('related articles section has at least 3 links', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside:has-text("Related Articles")');
    await expect(aside).toBeVisible();
    const links = aside.locator('a');
    expect(await links.count()).toBeGreaterThanOrEqual(3);
  });

  test('CTA box links to word finder', async ({ page }) => {
    await page.goto(PAGE);
    const cta = page.locator('a:has-text("Open Word Finder")');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/');
  });
});

test.describe('Best Words for Premium Squares — Negative', () => {

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
    await expect(h1s).toHaveCount(1);
  });

  test('no duplicate premium squares tables', async ({ page }) => {
    await page.goto(PAGE);
    const tables = page.locator('table');
    await expect(tables).toHaveCount(1);
  });

  test('no duplicate hero cards', async ({ page }) => {
    await page.goto(PAGE);
    const heroCards = page.locator('text=TWS + TLS COMBO');
    await expect(heroCards).toHaveCount(1);
  });

  test('page does not link to itself', async ({ page }) => {
    await page.goto(PAGE);
    const selfLinks = page.locator(`a[href="${PAGE}"]`);
    await expect(selfLinks).toHaveCount(0);
  });

  test('internal links have valid hrefs', async ({ page }) => {
    await page.goto(PAGE);
    const internalLinks = page.locator('article a[href^="/"]');
    const count = await internalLinks.count();
    expect(count).toBeGreaterThan(0);
    // Verify links are non-empty
    for (let i = 0; i < Math.min(count, 5); i++) {
      const href = await internalLinks.nth(i).getAttribute('href');
      expect(href).toBeTruthy();
      expect(href!.length).toBeGreaterThanOrEqual(1);
    }
  });

  test('FAQPage schema exists in page source', async ({ page }) => {
    await page.goto(PAGE);
    const html = await page.content();
    expect(html).toContain('"@type":"FAQPage"');
  });

  test('Article schema exists in page source', async ({ page }) => {
    await page.goto(PAGE);
    const html = await page.content();
    expect(html).toContain('"@type":"Article"');
  });
});
