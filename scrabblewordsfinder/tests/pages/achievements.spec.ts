import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'https://www.scrabblewordsfinder.com';

test.describe('Achievements Page — Positive', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto(`${BASE}/achievements/`);
    await expect(page).toHaveTitle(/My Achievements/);
  });

  test('displays heading with medal icon', async ({ page }) => {
    await page.goto(`${BASE}/achievements/`);
    const heading = page.locator('main h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('My Achievements');
  });

  test('back to solver link is present and correct', async ({ page }) => {
    await page.goto(`${BASE}/achievements/`);
    const backLink = page.locator('main a.text-blue-400[href="/"]');
    await expect(backLink).toBeVisible();
    await expect(backLink).toContainText('Back to Solver');
  });

  test('empty state shows when no UID in localStorage', async ({ page }) => {
    await page.goto(`${BASE}/achievements/`);
    // Clear localStorage to ensure no UID
    await page.evaluate(() => localStorage.removeItem('swf-uid'));
    await page.reload();
    await page.waitForTimeout(1000);
    const emptyState = page.locator('#achievements-empty');
    await expect(emptyState).toBeVisible();
  });

  test('empty state displays all 5 achievement levels', async ({ page }) => {
    await page.goto(`${BASE}/achievements/`);
    await page.evaluate(() => localStorage.removeItem('swf-uid'));
    await page.reload();
    await page.waitForTimeout(1000);
    const emptyState = page.locator('#achievements-empty');
    await expect(emptyState).toBeVisible();
    const content = await emptyState.textContent();
    expect(content).toContain('Rising Star');
    expect(content).toContain('Word Builder');
    expect(content).toContain('Hot Streak');
    expect(content).toContain('Triple Threat');
    expect(content).toContain('Legend');
  });

  test('empty state has 3 instruction steps', async ({ page }) => {
    await page.goto(`${BASE}/achievements/`);
    await page.evaluate(() => localStorage.removeItem('swf-uid'));
    await page.reload();
    await page.waitForTimeout(1000);
    const emptyState = page.locator('#achievements-empty');
    const content = await emptyState.textContent();
    expect(content).toContain('Enter your tiles');
    expect(content).toContain('Click a word in the results');
    expect(content).toContain('Click "Save" to file your achievement');
  });

  test('empty state has CTA link to solver', async ({ page }) => {
    await page.goto(`${BASE}/achievements/`);
    await page.evaluate(() => localStorage.removeItem('swf-uid'));
    await page.reload();
    await page.waitForTimeout(1000);
    const cta = page.locator('#achievements-empty a[href="/"]');
    await expect(cta).toBeVisible();
    await expect(cta).toContainText('Start Solving');
  });

  test('table structure has correct columns', async ({ page }) => {
    await page.goto(`${BASE}/achievements/`);
    const headers = page.locator('#achievements-table thead th');
    const count = await headers.count();
    expect(count).toBe(6);
    const texts = [];
    for (let i = 0; i < count; i++) {
      texts.push(await headers.nth(i).textContent());
    }
    expect(texts).toEqual(['Icon', 'Word', 'Score', 'Level', 'Note', 'Date']);
  });

  test('pagination buttons exist', async ({ page }) => {
    await page.goto(`${BASE}/achievements/`);
    const prevBtn = page.locator('#page-prev');
    const nextBtn = page.locator('#page-next');
    expect(await prevBtn.count()).toBe(1);
    expect(await nextBtn.count()).toBe(1);
  });
});

test.describe('Achievements Page — Negative', () => {
  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/achievements/`);
    await page.waitForTimeout(1500);
    expect(errors.filter(e => !e.includes('net::'))).toHaveLength(0);
  });

  test('loading state disappears after API response', async ({ page }) => {
    await page.goto(`${BASE}/achievements/`);
    await page.waitForTimeout(2000);
    const loading = page.locator('#achievements-loading');
    await expect(loading).toHaveClass(/hidden/);
  });

  test('page does not expose sensitive information', async ({ page }) => {
    await page.goto(`${BASE}/achievements/`);
    const content = await page.content();
    expect(content).not.toContain('sk-');
    expect(content).not.toContain('AKIA');
    expect(content).not.toContain('@gmail.com');
    // "rajeev" may appear in Vite dev paths — check visible text only
    const visibleText = await page.locator('body').innerText();
    expect(visibleText.toLowerCase()).not.toContain('rajeev');
  });

  test('no duplicate #achievements-empty elements', async ({ page }) => {
    await page.goto(`${BASE}/achievements/`);
    const empties = page.locator('#achievements-empty');
    expect(await empties.count()).toBe(1);
  });

  test('no duplicate #achievements-table elements', async ({ page }) => {
    await page.goto(`${BASE}/achievements/`);
    const tables = page.locator('#achievements-table');
    expect(await tables.count()).toBe(1);
  });

  test('page has noindex meta tag', async ({ page }) => {
    await page.goto(`${BASE}/achievements/`);
    const meta = page.locator('meta[name="robots"][content*="noindex"]');
    expect(await meta.count()).toBeGreaterThanOrEqual(1);
  });
});
