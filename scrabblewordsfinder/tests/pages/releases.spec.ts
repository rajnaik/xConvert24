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

  // --- Last 2 versions only (per release-notes-testing rule) ---

  test('v1.16.0 release entry is present and is the latest', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const firstArticle = page.locator('article').first();
    const heading = firstArticle.locator('h2');
    await expect(heading).toContainText('v1.16.0');
    await expect(heading).toContainText('July 2, 2026');
  });

  test('v1.16.0 lists all feature items', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const firstArticle = page.locator('article').first();
    const items = firstArticle.locator('ul li');
    const count = await items.count();
    expect(count).toBe(14);
    const content = await firstArticle.textContent();
    expect(content).toContain('Player Avatars');
    expect(content).toContain('Welcome Banner');
    expect(content).toContain('Avatar Swap');
    expect(content).toContain('Avatar Collage');
    expect(content).toContain('Leaderboard');
    expect(content).toContain('60-Second Challenge leaderboard');
    expect(content).toContain('Daily Duel panel');
    expect(content).toContain('MyBag avatar display');
    expect(content).toContain('Settings avatar preview');
    expect(content).toContain('Admin avatars dashboard');
    expect(content).toContain('Blog');
    expect(content).toContain('Chat improvements');
    expect(content).toContain('UI polish');
    expect(content).toContain('Test suite');
  });

  test('v1.16.0 has teal border styling', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const firstArticle = page.locator('article').first();
    await expect(firstArticle).toHaveClass(/border-teal-500/);
  });

  test('v1.15.0 release entry is present as second entry', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const secondArticle = page.locator('article').nth(1);
    const heading = secondArticle.locator('h2');
    await expect(heading).toContainText('v1.15.0');
    await expect(heading).toContainText('July 2, 2026');
  });

  test('v1.15.0 lists key features', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const secondArticle = page.locator('article').nth(1);
    const items = secondArticle.locator('ul li');
    const count = await items.count();
    expect(count).toBe(11);
    const content = await secondArticle.textContent();
    expect(content).toContain('Lex Quick-Reference Word Lists');
    expect(content).toContain('EV Scoring Engine');
    expect(content).toContain('Lex Query Classifier');
    expect(content).toContain('Coaching Prompts library');
    expect(content).toContain('Training Modes module');
  });

  test('v1.15.0 has amber border styling', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const secondArticle = page.locator('article').nth(1);
    await expect(secondArticle).toHaveClass(/border-amber-500/);
  });

  // --- General structure tests ---

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
    const schemas = page.locator('script[type="application/ld+json"]');
    const count = await schemas.count();
    let hasFAQ = false;
    for (let i = 0; i < count; i++) {
      const content = await schemas.nth(i).textContent();
      if (content && content.includes('"FAQPage"')) {
        hasFAQ = true;
        expect(content).toContain('How often is ScrabbleWordsFinder updated');
        break;
      }
    }
    expect(hasFAQ).toBe(true);
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

  test('latest version does not expose internal admin details', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const firstArticle = page.locator('article').first();
    const content = await firstArticle.textContent();
    expect(content).not.toContain('click tracking');
    expect(content).not.toContain('session tracking');
    expect(content).not.toContain('heartbeat tracking');
    expect(content).not.toContain('visitor monitor');
    expect(content).not.toContain('real-time visitor');
    expect(content).not.toContain('IP address');
    expect(content).not.toContain('UUID tracking');
  });

  test('latest version has no empty list items', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const firstArticle = page.locator('article').first();
    const items = firstArticle.locator('ul li');
    const count = await items.count();
    for (let i = 0; i < count; i++) {
      const text = await items.nth(i).textContent();
      expect(text!.trim().length).toBeGreaterThan(5);
    }
  });

  test('latest version date is not in the future', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const firstHeading = page.locator('article h2').first();
    const text = await firstHeading.textContent();
    const match = text?.match(/(\w+ \d+, \d{4})/);
    expect(match).not.toBeNull();
    const releaseDate = new Date(match![1]);
    expect(releaseDate.getTime()).toBeLessThanOrEqual(Date.now());
  });

  test('second latest version does not expose internal admin details', async ({ page }) => {
    await page.goto(`${BASE}/releases/`);
    const secondArticle = page.locator('article').nth(1);
    const content = await secondArticle.textContent();
    expect(content).not.toContain('click tracking');
    expect(content).not.toContain('session tracking');
    expect(content).not.toContain('heartbeat tracking');
    expect(content).not.toContain('visitor monitor');
    expect(content).not.toContain('real-time visitor');
    expect(content).not.toContain('IP address');
    expect(content).not.toContain('UUID tracking');
  });
});
