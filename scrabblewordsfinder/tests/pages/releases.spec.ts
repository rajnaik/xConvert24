import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'https://www.scrabblewordsfinder.com';

test.describe('Releases Page — Positive', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    await expect(page).toHaveTitle(/Release Notes/);
  });

  test('displays current version badge', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const versionBadge = page.locator('main p span.font-mono').first();
    await expect(versionBadge).toBeVisible();
    const text = await versionBadge.textContent();
    expect(text).toMatch(/^v\d+\.\d+\.\d+$/);
  });

  test('has release articles with version headings', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const articles = page.locator('article');
    const count = await articles.count();
    expect(count).toBeGreaterThanOrEqual(8);
  });

  test('each release article has a version heading', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const headings = page.locator('article h2');
    const count = await headings.count();
    expect(count).toBeGreaterThanOrEqual(8);
    const firstText = await headings.first().textContent();
    expect(firstText).toMatch(/v\d+\.\d+\.\d+/);
  });

  test('v1.10.0 release entry is present and is the latest', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const firstArticle = page.locator('article').first();
    const heading = firstArticle.locator('h2');
    await expect(heading).toContainText('v1.10.0');
    await expect(heading).toContainText('June 21, 2026');
  });

  test('v1.10.0 lists all key features', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const firstArticle = page.locator('article').first();
    const items = firstArticle.locator('ul li');
    const count = await items.count();
    expect(count).toBe(14);
    // Verify key feature items are listed
    const content = await firstArticle.textContent();
    expect(content).toContain('Useful Links page');
    expect(content).toContain('Admin improvements');
    expect(content).toContain('Flash Card UX');
    expect(content).toContain('Fullscreen speed slider');
    expect(content).toContain('80+ new Playwright tests');
  });

  test('release items have feature bullet points', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const listItems = page.locator('article ul li');
    const count = await listItems.count();
    expect(count).toBeGreaterThan(20);
  });

  test('back to solver link is visible at top and bottom', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const backLinks = page.locator('a[href="/"]');
    const count = await backLinks.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('tech stack link is present', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const techLink = page.locator('a[href="/tech-stack/"]');
    await expect(techLink).toBeVisible();
  });

  test('FAQPage JSON-LD schema is present', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const schema = page.locator('script[type="application/ld+json"]');
    const content = await schema.textContent();
    expect(content).toContain('"FAQPage"');
    expect(content).toContain('How often is ScrabbleWordsFinder updated');
  });
});

test.describe('Releases Page — Negative', () => {
  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/releases/`);
    await page.waitForTimeout(1000);
    expect(errors.filter(e => !e.includes('net::'))).toHaveLength(0);
  });

  test('no duplicate release articles for same version', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const headings = page.locator('article h2');
    const count = await headings.count();
    const versions: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await headings.nth(i).textContent();
      const match = text?.match(/v\d+\.\d+\.\d+/);
      if (match) versions.push(match[0]);
    }
    const unique = new Set(versions);
    expect(unique.size).toBe(versions.length);
  });

  test('page does not expose sensitive information', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const content = await page.content();
    expect(content).not.toContain('sk-');
    expect(content).not.toContain('AKIA');
    expect(content).not.toContain('@gmail.com');
    expect(content).not.toContain('G-XDDRM8BN29');
  });

  test('version badge does not show undefined or NaN', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const versionBadge = page.locator('main p span.font-mono').first();
    const text = await versionBadge.textContent();
    expect(text).not.toContain('undefined');
    expect(text).not.toContain('NaN');
    expect(text).not.toContain('null');
  });

  test('v1.10.0 does not expose internal admin details', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const firstArticle = page.locator('article').first();
    const content = await firstArticle.textContent();
    // Removed internal-facing items should not appear
    expect(content).not.toContain('Live Sessions admin');
    expect(content).not.toContain('Heartbeat API');
    expect(content).not.toContain('Admin Useful Links');
  });

  test('v1.10.0 has no empty list items', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const firstArticle = page.locator('article').first();
    const items = firstArticle.locator('ul li');
    const count = await items.count();
    for (let i = 0; i < count; i++) {
      const text = await items.nth(i).textContent();
      expect(text!.trim().length).toBeGreaterThan(5);
    }
  });

  test('v1.10.0 date is not in the future', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const firstHeading = page.locator('article h2').first();
    const text = await firstHeading.textContent();
    const match = text?.match(/(\w+ \d+, \d{4})/);
    expect(match).not.toBeNull();
    const releaseDate = new Date(match![1]);
    expect(releaseDate.getTime()).toBeLessThanOrEqual(Date.now());
  });
});
