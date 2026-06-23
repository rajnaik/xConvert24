import { test, expect } from '@playwright/test';

const PAGE = '/blog/setup-moves-scrabble/';

test.describe('Setup Moves Scrabble — Related Articles — Positive', () => {

  test('Related Articles aside is visible', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    await expect(aside).toBeVisible();
  });

  test('Related Articles contains 3 links', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    const links = aside.locator('a');
    await expect(links).toHaveCount(3);
  });

  test('Related Articles links have correct hrefs', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    await expect(aside.locator('a[href="/blog/opening-moves-guide/"]')).toBeVisible();
    await expect(aside.locator('a[href="/blog/hotspots-and-dead-zones/"]')).toBeVisible();
    await expect(aside.locator('a[href="/blog/midgame-strategy/"]')).toBeVisible();
  });

  test('Related Articles links show descriptive text', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    await expect(aside).toContainText('Opening Moves Guide');
    await expect(aside).toContainText('Hotspots and Dead Zones');
    await expect(aside).toContainText('Midgame Strategy');
  });
});

test.describe('Setup Moves Scrabble — CTA Box — Positive', () => {

  test('CTA box with Word Finder promo is visible', async ({ page }) => {
    await page.goto(PAGE);
    const cta = page.locator('.bg-gradient-to-r.from-blue-900\\/20').filter({ hasText: 'Scrabble Word Finder' });
    await expect(cta).toBeVisible();
  });

  test('CTA box contains Open Word Finder link pointing to homepage', async ({ page }) => {
    await page.goto(PAGE);
    const ctaLink = page.locator('a').filter({ hasText: 'Open Word Finder' });
    await expect(ctaLink).toBeVisible();
    await expect(ctaLink).toHaveAttribute('href', '/');
  });
});

test.describe('Setup Moves Scrabble — Back Link — Positive', () => {

  test('Back to all articles link is visible', async ({ page }) => {
    await page.goto(PAGE);
    const backLink = page.locator('a').filter({ hasText: 'Back to all articles' });
    await expect(backLink).toBeVisible();
  });

  test('Back to all articles links to /blog/', async ({ page }) => {
    await page.goto(PAGE);
    const backLink = page.locator('a').filter({ hasText: 'Back to all articles' });
    await expect(backLink).toHaveAttribute('href', '/blog/');
  });
});

test.describe('Setup Moves Scrabble — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate Related Articles sections', async ({ page }) => {
    await page.goto(PAGE);
    const asides = page.locator('aside').filter({ hasText: 'Related Articles' });
    await expect(asides).toHaveCount(1);
  });

  test('no duplicate CTA boxes', async ({ page }) => {
    await page.goto(PAGE);
    const ctas = page.locator('.bg-gradient-to-r.from-blue-900\\/20');
    await expect(ctas).toHaveCount(1);
  });

  test('Related Articles does not link to the current page', async ({ page }) => {
    await page.goto(PAGE);
    const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
    const selfLinks = aside.locator(`a[href="${PAGE}"]`);
    await expect(selfLinks).toHaveCount(0);
  });
});
