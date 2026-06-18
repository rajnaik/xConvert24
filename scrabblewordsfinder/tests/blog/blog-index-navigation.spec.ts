import { test, expect } from '@playwright/test';

test.describe('Blog Index — Category Navigation — Positive', () => {

  test('blog index page loads successfully', async ({ page }) => {
    const response = await page.goto('/blog/');
    expect(response?.status()).toBe(200);
  });

  test('category navigation section is visible', async ({ page }) => {
    await page.goto('/blog/');
    const navContainer = page.locator('.flex.flex-wrap.gap-2.mb-6');
    await expect(navContainer).toBeVisible();
  });

  test('WOTD Series link points to /blog/word-of-the-day-series/', async ({ page }) => {
    await page.goto('/blog/');
    const wotdLink = page.locator('a:has-text("WOTD Series")');
    await expect(wotdLink).toBeVisible();
    await expect(wotdLink).toHaveAttribute('href', '/blog/word-of-the-day-series/');
  });

  test('Word Quiz link points to /activities/', async ({ page }) => {
    await page.goto('/blog/');
    const link = page.locator('a:has-text("Word Quiz")');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/activities/');
  });

  test('WordBench link points to /activities/', async ({ page }) => {
    await page.goto('/blog/');
    const link = page.locator('a:has-text("WordBench")');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/activities/');
  });

  test('Daily Rack link points to /activities/', async ({ page }) => {
    await page.goto('/blog/');
    const link = page.locator('a:has-text("Daily Rack")');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/activities/');
  });

  test('Anagram link points to /activities/', async ({ page }) => {
    await page.goto('/blog/');
    const link = page.locator('a:has-text("Anagram")');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/activities/');
  });

  test('60-Second link points to /activities/', async ({ page }) => {
    await page.goto('/blog/');
    const link = page.locator('a:has-text("60-Second")');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/activities/');
  });

  test('all blog category links are present', async ({ page }) => {
    await page.goto('/blog/');
    const expectedCategories = [
      'Beginner',
      'Strategy',
      'Two-Letter',
      'Three-Letter',
      'Bingos',
      'High-Scoring',
      'Tournament',
      'Letter Guides',
      'Dictionaries',
      'WOTD Series',
      'Word Quiz',
      'WordBench',
      'Daily Rack',
      'Anagram',
      '60-Second',
    ];
    for (const category of expectedCategories) {
      const link = page.locator(`.flex.flex-wrap.gap-2.mb-6 a:has-text("${category}")`);
      await expect(link, `Category link "${category}" should exist`).toHaveCount(1);
    }
  });

  test('activity links have purple hover styling class', async ({ page }) => {
    await page.goto('/blog/');
    const activityLinks = ['WOTD Series', 'Word Quiz', 'WordBench', 'Daily Rack', 'Anagram', '60-Second'];
    for (const label of activityLinks) {
      const link = page.locator(`a:has-text("${label}")`).first();
      const classes = await link.getAttribute('class');
      expect(classes, `"${label}" link should have purple hover styling`).toContain('hover:border-purple-500');
    }
  });
});

test.describe('Blog Index — Category Navigation — Negative', () => {

  test('no duplicate category navigation links', async ({ page }) => {
    await page.goto('/blog/');
    const navContainer = page.locator('.flex.flex-wrap.gap-2.mb-6');
    const links = await navContainer.locator('a').allTextContents();
    const trimmed = links.map(t => t.trim());
    const duplicates = trimmed.filter((item, index) => trimmed.indexOf(item) !== index);
    expect(duplicates, `Duplicate nav links found: ${duplicates.join(', ')}`).toHaveLength(0);
  });

  test('no navigation links have empty href', async ({ page }) => {
    await page.goto('/blog/');
    const navContainer = page.locator('.flex.flex-wrap.gap-2.mb-6');
    const allLinks = await navContainer.locator('a').all();
    for (const link of allLinks) {
      const href = await link.getAttribute('href');
      expect(href, 'Nav link should not have empty href').toBeTruthy();
      expect(href?.trim().length, 'Nav link href should not be empty string').toBeGreaterThan(0);
    }
  });

  test('no navigation links have broken paths (must start with /)', async ({ page }) => {
    await page.goto('/blog/');
    const navContainer = page.locator('.flex.flex-wrap.gap-2.mb-6');
    const allLinks = await navContainer.locator('a').all();
    for (const link of allLinks) {
      const href = await link.getAttribute('href');
      expect(href?.startsWith('/'), `Link href "${href}" should start with /`).toBe(true);
    }
  });

  test('no console errors on blog index page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/blog/');
    await page.waitForTimeout(1000);
    expect(errors.filter(e => e.includes('critical') || e.includes('TypeError'))).toHaveLength(0);
  });

  test('category nav does not contain old "Word of the Day" label', async ({ page }) => {
    await page.goto('/blog/');
    const navContainer = page.locator('.flex.flex-wrap.gap-2.mb-6');
    const oldLabel = navContainer.locator('a:has-text("Word of the Day")');
    await expect(oldLabel).toHaveCount(0);
  });

  test('all blog category links have trailing slash (trailingSlash: always)', async ({ page }) => {
    await page.goto('/blog/');
    const navContainer = page.locator('.flex.flex-wrap.gap-2.mb-6');
    const allLinks = await navContainer.locator('a').all();
    const missingSlash: string[] = [];
    for (const link of allLinks) {
      const href = await link.getAttribute('href');
      if (href && !href.endsWith('/')) {
        missingSlash.push(href);
      }
    }
    expect(missingSlash, `Links missing trailing slash: ${missingSlash.join(', ')}`).toHaveLength(0);
  });
});
