import { test, expect } from '@playwright/test';

const PAGE = '/blog/two-letter-words-complete-strategy/';

test.describe('Two-Letter Words Complete Strategy — High-Value Section — Positive', () => {

  test('page loads with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('high-value two-letter words heading exists', async ({ page }) => {
    await page.goto(PAGE);
    const heading = page.locator('h2', { hasText: 'The High-Value Two-Letter Words' });
    await expect(heading).toBeVisible();
  });

  test('word badges display all 8 high-value words', async ({ page }) => {
    await page.goto(PAGE);
    const expectedWords = ['QI', 'ZA', 'ZO', 'XI', 'XU', 'JO', 'KA', 'KI'];
    for (const word of expectedWords) {
      const badge = page.locator('span.text-white.font-bold', { hasText: new RegExp(`^${word}$`) });
      await expect(badge).toBeVisible();
    }
  });

  test('word badges show point values', async ({ page }) => {
    await page.goto(PAGE);
    const pointBadges = page.locator('span.text-amber-400.text-xs');
    const count = await pointBadges.count();
    expect(count).toBeGreaterThanOrEqual(8);
  });

  test('QI explanation card is visible with content', async ({ page }) => {
    await page.goto(PAGE);
    const card = page.locator('span.text-purple-400', { hasText: 'QI (11 pts):' });
    await expect(card).toBeVisible();
  });

  test('ZA explanation card is visible with content', async ({ page }) => {
    await page.goto(PAGE);
    const card = page.locator('span.text-purple-400', { hasText: 'ZA (11 pts):' });
    await expect(card).toBeVisible();
  });

  test('XI and XU explanation card is visible', async ({ page }) => {
    await page.goto(PAGE);
    const card = page.locator('span.text-purple-400', { hasText: 'XI and XU (9 pts each):' });
    await expect(card).toBeVisible();
  });

  test('JO explanation card is visible', async ({ page }) => {
    await page.goto(PAGE);
    const card = page.locator('span.text-purple-400', { hasText: 'JO (9 pts):' });
    await expect(card).toBeVisible();
  });
});

test.describe('Two-Letter Words Complete Strategy — Cross-Links — Positive', () => {

  test('dig deeper section exists', async ({ page }) => {
    await page.goto(PAGE);
    const heading = page.locator('text=Dig Deeper');
    await expect(heading).toBeVisible();
  });

  test('cross-link to two-letter-words hub has correct href', async ({ page }) => {
    await page.goto(PAGE);
    const section = page.locator('div').filter({ hasText: /Dig Deeper/ }).last();
    const link = section.locator('a[href="/blog/two-letter-words/"]');
    await expect(link).toBeVisible();
  });

  test('cross-link to best-two-letter-words-scrabble has correct href', async ({ page }) => {
    await page.goto(PAGE);
    const section = page.locator('div').filter({ hasText: /Dig Deeper/ }).last();
    const link = section.locator('a[href="/blog/best-two-letter-words-scrabble/"]');
    await expect(link).toBeVisible();
  });

  test('cross-link labels contain descriptive text', async ({ page }) => {
    await page.goto(PAGE);
    const section = page.locator('div').filter({ hasText: /Dig Deeper/ }).last();
    const hubLink = section.locator('a[href="/blog/two-letter-words/"]');
    await expect(hubLink).toContainText('Two-Letter Words Hub');
    const bestLink = section.locator('a[href="/blog/best-two-letter-words-scrabble/"]');
    await expect(bestLink).toContainText('Best Two-Letter Words');
  });
});

test.describe('Two-Letter Words Complete Strategy — High-Value Section — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate high-value heading', async ({ page }) => {
    await page.goto(PAGE);
    const headings = page.locator('h2', { hasText: 'The High-Value Two-Letter Words' });
    await expect(headings).toHaveCount(1);
  });

  test('no duplicate QI badges', async ({ page }) => {
    await page.goto(PAGE);
    const qiBadges = page.locator('span.text-white.font-bold', { hasText: /^QI$/ });
    await expect(qiBadges).toHaveCount(1);
  });

  test('cross-links do not self-reference this page', async ({ page }) => {
    await page.goto(PAGE);
    const selfLink = page.locator('a[href="/blog/two-letter-words-complete-strategy/"]');
    await expect(selfLink).toHaveCount(0);
  });

  test('cross-links are not broken (no empty href)', async ({ page }) => {
    await page.goto(PAGE);
    const section = page.locator('div').filter({ hasText: 'Dig Deeper' }).last();
    const links = section.locator('a');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href?.trim().length).toBeGreaterThan(0);
    }
  });
});
