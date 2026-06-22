import { test, expect } from '@playwright/test';

/**
 * Useful Links — Games & Activities Section Tests
 * Covers the #games-activities section including the newly added
 * "Word of the Day" and "Daily Rack Challenge" link cards.
 */

test.describe('Useful Links — Games & Activities — Positive', () => {

  test('games & activities section is visible on the page', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const section = page.locator('#games-activities');
    await expect(section).toBeVisible();
  });

  test('section has the correct heading text', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const heading = page.locator('#games-activities h2');
    await expect(heading).toContainText('Games & Activities');
  });

  test('section contains 6 link cards', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const cards = page.locator('#games-activities .grid a');
    await expect(cards).toHaveCount(6);
  });

  test('Activities Hub link is present with correct href', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const link = page.locator('#games-activities a:has-text("Activities Hub")');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/activities/');
  });

  test('60-Second Challenge link is present with correct href', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const link = page.locator('#games-activities a:has-text("60-Second Challenge")');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/sixty-seconds/');
  });

  test('Anagram link is present with correct href', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const link = page.locator('#games-activities a', { has: page.locator('p', { hasText: /^Anagram$/ }) });
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    expect(href).toBe('/activities/#anagram');
  });

  test('Anagram card has updated description text', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const link = page.locator('#games-activities a', { has: page.locator('p', { hasText: /^Anagram$/ }) });
    await expect(link).toContainText('Daily anagram challenge & history');
  });

  test('Quiz History link is present with correct href', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const link = page.locator('#games-activities a:has-text("Quiz History")');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/quiz-history/');
  });

  test('Word of the Day link is present and visible', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const link = page.locator('#games-activities a:has-text("Word of the Day")');
    await expect(link).toBeVisible();
  });

  test('Word of the Day card has correct description', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const link = page.locator('#games-activities a:has-text("Word of the Day")');
    await expect(link).toContainText('Daily curated word with definition & score');
  });

  test('Word of the Day link points to activities page', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const link = page.locator('#games-activities a:has-text("Word of the Day")');
    const href = await link.getAttribute('href');
    expect(href).toContain('/activities/');
  });

  test('Daily Rack Challenge link is present and visible', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const link = page.locator('#games-activities a:has-text("Daily Rack Challenge")');
    await expect(link).toBeVisible();
  });

  test('Daily Rack Challenge card has correct description', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const link = page.locator('#games-activities a:has-text("Daily Rack Challenge")');
    await expect(link).toContainText('Find the highest-scoring word from today\'s rack');
  });

  test('Daily Rack Challenge link points to activities page', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const link = page.locator('#games-activities a:has-text("Daily Rack Challenge")');
    const href = await link.getAttribute('href');
    expect(href).toContain('/activities/');
  });
});

test.describe('Useful Links — Games & Activities — Negative', () => {

  test('no duplicate Word of the Day cards', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const wotdCards = page.locator('#games-activities a:has-text("Word of the Day")');
    await expect(wotdCards).toHaveCount(1);
  });

  test('no duplicate Daily Rack Challenge cards', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const drcCards = page.locator('#games-activities a:has-text("Daily Rack Challenge")');
    await expect(drcCards).toHaveCount(1);
  });

  test('all activity links have non-empty href', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const links = await page.locator('#games-activities .grid a').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      expect(href?.trim().length).toBeGreaterThan(0);
    }
  });

  test('no page errors when loading the section', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/blog/useful-links/');
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('Word of the Day card has the book emoji icon', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const link = page.locator('#games-activities a:has-text("Word of the Day")');
    await expect(link).toContainText('📖');
  });

  test('Daily Rack Challenge card has the dice emoji icon', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const link = page.locator('#games-activities a:has-text("Daily Rack Challenge")');
    await expect(link).toContainText('🎲');
  });

  test('Anagram card has the letter emoji icon', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const link = page.locator('#games-activities a', { has: page.locator('p', { hasText: /^Anagram$/ }) });
    await expect(link).toContainText('🔤');
  });

  test('all activity cards have consistent grid layout', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const grid = page.locator('#games-activities .grid');
    const classes = await grid.getAttribute('class');
    expect(classes).toContain('sm:grid-cols-2');
  });

  test('no link to old /anagram-history/ route exists', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const oldLink = page.locator('#games-activities a[href="/anagram-history/"]');
    await expect(oldLink).toHaveCount(0);
  });

  test('Anagram card does not use the old "Anagram History" title', async ({ page }) => {
    await page.goto('/blog/useful-links/');
    const oldTitle = page.locator('#games-activities a:has-text("Anagram History")');
    await expect(oldTitle).toHaveCount(0);
  });
});
