import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

// Use a known past month that has WOTD data
const now = new Date();
const testMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

test.describe('WOTD Month Page — Top Scoring Words — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(`${BASE}/blog/wotd/${testMonth}/`);
    expect(response?.status()).toBe(200);
  });

  test('Top Scoring Words heading is visible', async ({ page }) => {
    await page.goto(`${BASE}/blog/wotd/${testMonth}/`);
    const heading = page.locator('h2:has-text("Top Scoring Words")');
    await expect(heading).toBeVisible();
  });

  test('Top Scoring Words section contains word cards with score', async ({ page }) => {
    await page.goto(`${BASE}/blog/wotd/${testMonth}/`);
    // Each scored word card has "pts" text for the score
    const scoreLabels = page.locator('.border-purple-500\\/30 .text-amber-400:has-text("pts")');
    const count = await scoreLabels.count();
    expect(count).toBeGreaterThan(0);
  });

  test('each word card shows a date label (abbreviated month + day)', async ({ page }) => {
    await page.goto(`${BASE}/blog/wotd/${testMonth}/`);
    // Date labels are in text-xs font-mono text-gray-500 spans within the purple cards
    const dateLabels = page.locator('.border-purple-500\\/30 .text-xs.font-mono.text-gray-500');
    const count = await dateLabels.count();
    expect(count).toBeGreaterThan(0);
    // First date label should contain a short month name (3 chars) and a number
    const firstText = await dateLabels.first().textContent();
    expect(firstText).toMatch(/[A-Z][a-z]{2}\s+\d+/);
  });

  test('each word card shows the word in bold white text', async ({ page }) => {
    await page.goto(`${BASE}/blog/wotd/${testMonth}/`);
    const wordLabels = page.locator('.border-purple-500\\/30 .text-lg.font-black.text-white');
    const count = await wordLabels.count();
    expect(count).toBeGreaterThan(0);
    const firstWord = await wordLabels.first().textContent();
    // Words are uppercase letters
    expect(firstWord?.trim()).toMatch(/^[A-Z]+$/);
  });

  test('word cards with meanings show italic text below', async ({ page }) => {
    await page.goto(`${BASE}/blog/wotd/${testMonth}/`);
    // Meanings are italic gray-400 paragraphs inside purple cards
    const meanings = page.locator('.border-purple-500\\/30 p.italic.text-gray-400');
    const count = await meanings.count();
    // At least some words should have meanings (per data integrity rules)
    expect(count).toBeGreaterThan(0);
  });

  test('scored words are listed in descending score order', async ({ page }) => {
    await page.goto(`${BASE}/blog/wotd/${testMonth}/`);
    const scoreElements = page.locator('.border-purple-500\\/30 .text-amber-400.font-bold');
    const count = await scoreElements.count();
    if (count >= 2) {
      const scores: number[] = [];
      for (let i = 0; i < Math.min(count, 10); i++) {
        const text = await scoreElements.nth(i).textContent();
        const num = parseInt(text?.replace(' pts', '') || '0');
        scores.push(num);
      }
      // Scores must be in descending order (highest first)
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
      }
    }
  });

  test('date and word are grouped together (flex layout)', async ({ page }) => {
    await page.goto(`${BASE}/blog/wotd/${testMonth}/`);
    // The date + word wrapper uses flex items-center gap-3
    const dateWordGroups = page.locator('.border-purple-500\\/30 .flex.items-center.gap-3');
    const count = await dateWordGroups.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('WOTD Month Page — Top Scoring Words — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/blog/wotd/${testMonth}/`);
    await page.waitForTimeout(1000);
    expect(errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'))).toHaveLength(0);
  });

  test('no duplicate Top Scoring Words headings', async ({ page }) => {
    await page.goto(`${BASE}/blog/wotd/${testMonth}/`);
    const headings = page.locator('h2:has-text("Top Scoring Words")');
    const count = await headings.count();
    expect(count).toBeLessThanOrEqual(1);
  });

  test('invalid month format redirects (does not crash)', async ({ page }) => {
    const response = await page.goto(`${BASE}/blog/wotd/invalid-month/`);
    // Should redirect to /blog/wotd/ or return non-500
    const status = response?.status();
    expect(status).not.toBe(500);
  });

  test('non-existent future month redirects (no crash)', async ({ page }) => {
    const response = await page.goto(`${BASE}/blog/wotd/2099-12/`);
    // Distant future month — no data, should redirect
    const status = response?.status();
    expect(status).not.toBe(500);
  });

  test('word cards do not have empty word text', async ({ page }) => {
    await page.goto(`${BASE}/blog/wotd/${testMonth}/`);
    const wordLabels = page.locator('.border-purple-500\\/30 .text-lg.font-black.text-white');
    const count = await wordLabels.count();
    for (let i = 0; i < count; i++) {
      const text = await wordLabels.nth(i).textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('score values are valid numbers (no NaN or empty)', async ({ page }) => {
    await page.goto(`${BASE}/blog/wotd/${testMonth}/`);
    const scoreElements = page.locator('.border-purple-500\\/30 .text-amber-400.font-bold');
    const count = await scoreElements.count();
    for (let i = 0; i < count; i++) {
      const text = await scoreElements.nth(i).textContent();
      const num = parseInt(text?.replace(' pts', '') || '');
      expect(Number.isNaN(num)).toBe(false);
      expect(num).toBeGreaterThan(0);
    }
  });
});
