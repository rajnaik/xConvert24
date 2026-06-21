import { test, expect } from '@playwright/test';

const PAGES = [
  { slug: '/blog/maximizing-blank-tiles/', hero: 'THE ULTIMATE WILDCARD', badge: '🃏 Power Tile' },
  { slug: '/blog/hooking-existing-words/', hero: 'ONE TILE, TWO WORDS', badge: '🪝 Double Score' },
  { slug: '/blog/common-strategic-errors/', hero: '50-100 POINTS LEAKED PER GAME', badge: '⚠️ Fix These First' },
  { slug: '/blog/position-vs-points/', hero: "SCORE ISN'T EVERYTHING", badge: '⚖️ The Balance' },
  { slug: '/blog/risk-management-scrabble/', hero: 'KNOW THE MATH, TAKE THE RISK', badge: '🎲 Calculated Gamble' },
  { slug: '/blog/probability-based-play/', hero: 'PLAY THE ODDS, NOT THE WORDS', badge: '📊 The Numbers Game' },
];

for (const { slug, hero, badge } of PAGES) {
  const name = slug.replace('/blog/', '').replace('/', '');

  test.describe(`${name} — Positive`, () => {

    test('page loads with 200 status', async ({ page }) => {
      const response = await page.goto(slug);
      expect(response?.status()).toBe(200);
    });

    test('hero card is visible with correct heading', async ({ page }) => {
      await page.goto(slug);
      const heading = page.locator(`text=${hero}`);
      await expect(heading).toBeVisible();
    });

    test('hero card badge is visible', async ({ page }) => {
      await page.goto(slug);
      const badgeEl = page.locator(`text=${badge}`);
      await expect(badgeEl).toBeVisible();
    });

    test('strategy tips section has 5 purple cards', async ({ page }) => {
      await page.goto(slug);
      const cards = page.locator('.border-purple-500\\/30.bg-purple-950\\/20');
      await expect(cards).toHaveCount(5);
    });

    test('CTA box with updated styling is visible', async ({ page }) => {
      await page.goto(slug);
      const cta = page.locator('.bg-gradient-to-r.from-blue-900\\/20.to-indigo-900\\/20');
      await expect(cta).toBeVisible();
      const ctaLink = cta.locator('a[href="/"]');
      await expect(ctaLink).toContainText('Open Word Finder');
    });

    test('Related Articles aside is visible', async ({ page }) => {
      await page.goto(slug);
      const aside = page.locator('aside').filter({ hasText: 'Related Articles' });
      await expect(aside).toBeVisible();
      const links = aside.locator('a');
      const count = await links.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });

    test('Dig Deeper cross-links section exists', async ({ page }) => {
      await page.goto(slug);
      const crossLinks = page.locator('.border-indigo-500\\/30.bg-indigo-950\\/10');
      await expect(crossLinks).toBeVisible();
    });
  });

  test.describe(`${name} — Negative`, () => {

    test('no console errors on page load', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', err => errors.push(err.message));
      await page.goto(slug);
      await page.waitForLoadState('domcontentloaded');
      expect(errors).toHaveLength(0);
    });

    test('no duplicate hero cards', async ({ page }) => {
      await page.goto(slug);
      const heroes = page.locator('.rounded-2xl.border-2.border-amber-500\\/50');
      await expect(heroes).toHaveCount(1);
    });

    test('no duplicate CTA boxes', async ({ page }) => {
      await page.goto(slug);
      const ctas = page.locator('.bg-gradient-to-r.from-blue-900\\/20.to-indigo-900\\/20');
      await expect(ctas).toHaveCount(1);
    });

    test('page does not link to itself', async ({ page }) => {
      await page.goto(slug);
      const selfLinks = page.locator(`a[href="${slug}"]`);
      await expect(selfLinks).toHaveCount(0);
    });
  });
}
