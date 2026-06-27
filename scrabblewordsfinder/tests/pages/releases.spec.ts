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
    expect(count).toBeGreaterThanOrEqual(10);
  });

  test('each release article has a version heading', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const headings = page.locator('article h2');
    const count = await headings.count();
    expect(count).toBeGreaterThanOrEqual(10);
    const firstText = await headings.first().textContent();
    expect(firstText).toMatch(/v\d+\.\d+\.\d+/);
  });

  test('v1.12.1 release entry is present and is the latest', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const firstArticle = page.locator('article').first();
    const heading = firstArticle.locator('h2');
    await expect(heading).toContainText('v1.12.1');
    await expect(heading).toContainText('June 27, 2026');
  });

  test('v1.12.1 lists all feature items', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const firstArticle = page.locator('article').first();
    const items = firstArticle.locator('ul li');
    const count = await items.count();
    expect(count).toBe(7);
    const content = await firstArticle.textContent();
    expect(content).toContain('Cheat Sheets section');
    expect(content).toContain('Constants API improved');
    expect(content).toContain('Guide page expanded');
    expect(content).toContain('Blog index updates');
    expect(content).toContain('Tournament Calendar 2026');
    expect(content).toContain('Layout & Header refinements');
    expect(content).toContain('New tests');
  });

  test('v1.12.1 mentions key technical details', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const firstArticle = page.locator('article').first();
    const content = await firstArticle.textContent();
    expect(content).toContain('SOWPODS');
    expect(content).toContain('TWL');
    expect(content).toContain('stat grids');
    expect(content).toContain('anchor navigation');
    expect(content).toContain('vowel dump words');
  });

  test('v1.12.1 has emerald border styling', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const firstArticle = page.locator('article').first();
    await expect(firstArticle).toHaveClass(/border-emerald-500/);
  });

  test('v1.12.0 release entry is present as second entry', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const secondArticle = page.locator('article').nth(1);
    const heading = secondArticle.locator('h2');
    await expect(heading).toContainText('v1.12.0');
    await expect(heading).toContainText('June 26, 2026');
  });

  test('v1.12.0 lists all constants system features', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const secondArticle = page.locator('article').nth(1);
    const items = secondArticle.locator('ul li');
    const count = await items.count();
    expect(count).toBe(11);
    const content = await secondArticle.textContent();
    expect(content).toContain('Constants system');
    expect(content).toContain('Admin Content page');
    expect(content).toContain('NewsFlash panel');
    expect(content).toContain('Dynamic tagline');
    expect(content).toContain('Layout refactor');
    expect(content).toContain('MyBag missed days');
    expect(content).toContain('Privacy page enhanced');
    expect(content).toContain('Guide page updated');
    expect(content).toContain('Blog post expanded');
    expect(content).toContain('Migrations 0037');
    expect(content).toContain('New tests');
  });

  test('v1.12.0 mentions key technical details', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const secondArticle = page.locator('article').nth(1);
    const content = await secondArticle.textContent();
    expect(content).toContain('KV cache');
    expect(content).toContain('DB fallback');
    expect(content).toContain('CRUD');
    expect(content).toContain('multi-line support');
    expect(content).toContain('Foreign Words Valid in Scrabble');
  });

  test('v1.11.5 release entry is present as third entry', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const thirdArticle = page.locator('article').nth(2);
    const heading = thirdArticle.locator('h2');
    await expect(heading).toContainText('v1.11.5');
    await expect(heading).toContainText('June 23, 2026');
  });

  test('v1.11.5 lists all AdSense features', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const thirdArticle = page.locator('article').nth(2);
    const items = thirdArticle.locator('ul li');
    const count = await items.count();
    expect(count).toBe(6);
    const content = await thirdArticle.textContent();
    expect(content).toContain('Google AdSense integration');
    expect(content).toContain('AdSense admin toggle');
    expect(content).toContain('KV caching for ad status');
    expect(content).toContain('AdUnit component');
    expect(content).toContain('Migration 0036');
    expect(content).toContain('New tests');
  });

  test('v1.11.5 mentions ad format types', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const thirdArticle = page.locator('article').nth(2);
    const content = await thirdArticle.textContent();
    expect(content).toContain('responsive');
    expect(content).toContain('skyscraper');
    expect(content).toContain('banner');
    expect(content).toContain('rectangle');
  });

  test('v1.11.5 contains code reference for adsense column', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const thirdArticle = page.locator('article').nth(2);
    const codeElements = thirdArticle.locator('code');
    const count = await codeElements.count();
    expect(count).toBe(1);
    await expect(codeElements.first()).toContainText('adsense');
  });

  test('v1.11.4 release entry is present as fourth entry', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const fourthArticle = page.locator('article').nth(3);
    const heading = fourthArticle.locator('h2');
    await expect(heading).toContainText('v1.11.4');
    await expect(heading).toContainText('June 23, 2026');
  });

  test('v1.11.4 lists all key features', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const fourthArticle = page.locator('article').nth(3);
    const items = fourthArticle.locator('ul li');
    const count = await items.count();
    expect(count).toBe(7);
    const content = await fourthArticle.textContent();
    expect(content).toContain('Blog batch 12');
    expect(content).toContain('StitchBlogs pipeline');
    expect(content).toContain('20 new inbound links');
    expect(content).toContain('Admin users page');
    expect(content).toContain('Admin clicks');
    expect(content).toContain('stitch-slugs.py');
    expect(content).toContain('558 posts');
  });

  test('v1.11.4 contains code references for stitch scripts', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const fourthArticle = page.locator('article').nth(3);
    const codeElements = fourthArticle.locator('code');
    const count = await codeElements.count();
    expect(count).toBe(2);
    await expect(codeElements.nth(0)).toContainText('stitch-slugs.py');
    await expect(codeElements.nth(1)).toContainText('stitch-inject.py');
  });

  test('v1.11.4 mentions Is X a Scrabble Word posts', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const fourthArticle = page.locator('article').nth(3);
    const content = await fourthArticle.textContent();
    expect(content).toContain('LI');
    expect(content).toContain('NA');
    expect(content).toContain('NU');
    expect(content).toContain('PO');
    expect(content).toContain('SH');
    expect(content).toContain('TI');
  });

  test('v1.11.4 mentions prefix guides', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const fourthArticle = page.locator('article').nth(3);
    const content = await fourthArticle.textContent();
    expect(content).toContain('BI');
    expect(content).toContain('MONO');
    expect(content).toContain('POLY');
    expect(content).toContain('TRI');
  });

  test('v1.11.3 release entry is present as fifth entry', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const fifthArticle = page.locator('article').nth(4);
    const heading = fifthArticle.locator('h2');
    await expect(heading).toContainText('v1.11.3');
    await expect(heading).toContainText('June 23, 2026');
  });

  test('v1.11.3 lists all key features', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const fifthArticle = page.locator('article').nth(4);
    const items = fifthArticle.locator('ul li');
    const count = await items.count();
    expect(count).toBe(9);
    const content = await fifthArticle.textContent();
    expect(content).toContain('BlogCrossLinks component');
    expect(content).toContain('Blog gate system');
    expect(content).toContain('New category landing pages');
    expect(content).toContain('Is X a Scrabble Word?');
    expect(content).toContain('Inbound link injection');
    expect(content).toContain('Zero orphaned pages');
    expect(content).toContain('Orphan checker script');
    expect(content).toContain('Bulk SEO fix script');
    expect(content).toContain('New tests');
  });

  test('v1.11.2 release entry is present as sixth entry', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const sixthArticle = page.locator('article').nth(5);
    const heading = sixthArticle.locator('h2');
    await expect(heading).toContainText('v1.11.2');
    await expect(heading).toContainText('June 23, 2026');
  });

  test('v1.11.1 release entry is present as seventh entry', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const seventhArticle = page.locator('article').nth(6);
    const heading = seventhArticle.locator('h2');
    await expect(heading).toContainText('v1.11.1');
    await expect(heading).toContainText('June 23, 2026');
  });

  test('v1.11.0 release entry is present as eighth entry', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const eighthArticle = page.locator('article').nth(7);
    const heading = eighthArticle.locator('h2');
    await expect(heading).toContainText('v1.11.0');
    await expect(heading).toContainText('June 22, 2026');
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
    expect(errors.filter(e => !e.includes('net::') && !e.includes('adsbygoogle'))).toHaveLength(0);
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

  test('v1.12.1 does not expose internal admin details', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const firstArticle = page.locator('article').first();
    const content = await firstArticle.textContent();
    expect(content).not.toContain('click tracking');
    expect(content).not.toContain('session tracking');
    expect(content).not.toContain('heartbeat');
    expect(content).not.toContain('visitor monitor');
    expect(content).not.toContain('real-time visitor');
    expect(content).not.toContain('IP address');
    expect(content).not.toContain('UUID tracking');
  });

  test('v1.12.1 has no empty list items', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const firstArticle = page.locator('article').first();
    const items = firstArticle.locator('ul li');
    const count = await items.count();
    for (let i = 0; i < count; i++) {
      const text = await items.nth(i).textContent();
      expect(text!.trim().length).toBeGreaterThan(5);
    }
  });

  test('v1.12.1 date is not in the future', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const firstHeading = page.locator('article h2').first();
    const text = await firstHeading.textContent();
    const match = text?.match(/(\w+ \d+, \d{4})/);
    expect(match).not.toBeNull();
    const releaseDate = new Date(match![1]);
    expect(releaseDate.getTime()).toBeLessThanOrEqual(Date.now());
  });

  test('v1.12.0 does not expose internal admin details', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const secondArticle = page.locator('article').nth(1);
    const content = await secondArticle.textContent();
    expect(content).not.toContain('click tracking');
    expect(content).not.toContain('session tracking');
    expect(content).not.toContain('heartbeat');
    expect(content).not.toContain('visitor monitor');
    expect(content).not.toContain('real-time visitor');
    expect(content).not.toContain('IP address');
    expect(content).not.toContain('UUID tracking');
  });

  test('v1.11.5 does not expose internal admin details', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const thirdArticle = page.locator('article').nth(2);
    const content = await thirdArticle.textContent();
    expect(content).not.toContain('click tracking');
    expect(content).not.toContain('session tracking');
    expect(content).not.toContain('heartbeat');
    expect(content).not.toContain('visitor monitor');
    expect(content).not.toContain('real-time visitor');
    expect(content).not.toContain('IP address');
    expect(content).not.toContain('UUID tracking');
  });

  test('v1.11.4 does not expose internal admin details', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const fourthArticle = page.locator('article').nth(3);
    const content = await fourthArticle.textContent();
    expect(content).not.toContain('click tracking');
    expect(content).not.toContain('session tracking');
    expect(content).not.toContain('heartbeat');
    expect(content).not.toContain('visitor monitor');
    expect(content).not.toContain('real-time visitor');
    expect(content).not.toContain('IP address');
    expect(content).not.toContain('UUID tracking');
  });

  test('v1.11.3 does not expose internal admin details', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const fifthArticle = page.locator('article').nth(4);
    const content = await fifthArticle.textContent();
    expect(content).not.toContain('Live Sessions admin');
    expect(content).not.toContain('Heartbeat API');
    expect(content).not.toContain('Admin Useful Links');
    expect(content).not.toContain('visitor monitor');
    expect(content).not.toContain('real-time visitor');
  });
});
