import { test, expect } from '@playwright/test';

const PAGE = '/blog/scrabble-tournament-calendar-2026/';

test.describe('Scrabble Tournament Calendar 2026 — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('all four quarterly sections are visible', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('text=Q1 (Jan–Mar)')).toBeVisible();
    await expect(page.locator('text=Q2 (Apr–Jun)')).toBeVisible();
    await expect(page.locator('text=Q3 (Jul–Sep)')).toBeVisible();
    await expect(page.locator('text=Q4 (Oct–Dec)')).toBeVisible();
  });

  test('Q1 section contains bullet list items', async ({ page }) => {
    await page.goto(PAGE);
    const q1Section = page.locator('.border-cyan-500\\/30');
    const bullets = q1Section.locator('li');
    const count = await bullets.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('Q3 section contains specific tournament links', async ({ page }) => {
    await page.goto(PAGE);
    const q3Section = page.locator('.border-amber-500\\/30');
    const spcLink = q3Section.locator('a[href*="scrabbleplayers.org"]');
    await expect(spcLink.first()).toBeVisible();
  });

  test('external links open in new tab with noopener', async ({ page }) => {
    await page.goto(PAGE);
    const quarterContainer = page.locator('.space-y-4').first();
    const externalLinks = quarterContainer.locator('a[target="_blank"]');
    const count = await externalLinks.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(count, 5); i++) {
      const rel = await externalLinks.nth(i).getAttribute('rel');
      expect(rel).toContain('noopener');
    }
  });

  test('Q2 section links to NASPA and Collins Coalition', async ({ page }) => {
    await page.goto(PAGE);
    const q2Section = page.locator('.border-green-500\\/30');
    await expect(q2Section.locator('a[href*="scrabbleplayers.org"]')).toBeVisible();
    await expect(q2Section.locator('a[href*="cocoscrabble.org"]')).toBeVisible();
  });

  test('Q4 section links to WESPA and ABSP', async ({ page }) => {
    await page.goto(PAGE);
    const q4Section = page.locator('.border-purple-500\\/30');
    await expect(q4Section.locator('a[href*="wespa.org"]')).toBeVisible();
    await expect(q4Section.locator('a[href*="absp.org.uk"]')).toBeVisible();
  });
});

test.describe('Scrabble Tournament Calendar 2026 — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate quarterly sections', async ({ page }) => {
    await page.goto(PAGE);
    const q1 = page.locator('text=Q1 (Jan–Mar)');
    const q2 = page.locator('text=Q2 (Apr–Jun)');
    const q3 = page.locator('text=Q3 (Jul–Sep)');
    const q4 = page.locator('text=Q4 (Oct–Dec)');
    await expect(q1).toHaveCount(1);
    await expect(q2).toHaveCount(1);
    await expect(q3).toHaveCount(1);
    await expect(q4).toHaveCount(1);
  });

  test('quarterly sections do not contain broken text or undefined', async ({ page }) => {
    await page.goto(PAGE);
    const sections = page.locator('.space-y-4 > div');
    const count = await sections.count();
    for (let i = 0; i < count; i++) {
      const text = await sections.nth(i).textContent();
      expect(text).not.toContain('undefined');
      expect(text).not.toContain('NaN');
    }
  });

  test('no external links with empty href', async ({ page }) => {
    await page.goto(PAGE);
    const emptyLinks = page.locator('.space-y-4 a[href=""]');
    await expect(emptyLinks).toHaveCount(0);
  });
});
