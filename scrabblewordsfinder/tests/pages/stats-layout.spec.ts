import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'https://www.scrabblewordsfinder.com';
const PAGE = `${BASE_URL}/stats/`;

// ── Stats Page Layout — Positive ────────────────────────────────────────────

test.describe('Stats Page Layout — Positive', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page).toHaveTitle(/Your Stats/);
  });

  test('summary cards section exists with 4 stat cards', async ({ page }) => {
    await page.goto(PAGE);
    const cards = page.locator('#summary-cards > div');
    await expect(cards).toHaveCount(4);
  });

  test('games section has 3 game tiles', async ({ page }) => {
    await page.goto(PAGE);
    const drc = page.locator('#drc-stat-best');
    const anagram = page.locator('#anagram-stat-streak');
    const sixty = page.locator('#sixty-stat-pb');
    await expect(drc).toBeAttached();
    await expect(anagram).toBeAttached();
    await expect(sixty).toBeAttached();
  });

  test('each game tile has an expand history button', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('#drc-expand-btn')).toBeVisible();
    await expect(page.locator('#anagram-expand-btn')).toBeVisible();
    await expect(page.locator('#sixty-expand-btn')).toBeVisible();
  });

  test('Daily Rack history panel is hidden by default', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('#drc-history-section')).toHaveClass(/hidden/);
  });

  test('Anagram history panel is hidden by default', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('#anagram-history-section')).toHaveClass(/hidden/);
  });

  test('60-Second history panel is hidden by default', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('#sixty-history-section')).toHaveClass(/hidden/);
  });

  test('clicking 60-Second expand button shows history panel', async ({ page }) => {
    await page.goto(PAGE);
    await page.locator('#sixty-expand-btn').click();
    await expect(page.locator('#sixty-history-section')).not.toHaveClass(/hidden/);
  });

  test('clicking Daily Rack expand button shows history panel', async ({ page }) => {
    await page.goto(PAGE);
    await page.locator('#drc-expand-btn').click();
    await expect(page.locator('#drc-history-section')).not.toHaveClass(/hidden/);
  });

  test('clicking Anagram expand button shows history panel', async ({ page }) => {
    await page.goto(PAGE);
    await page.locator('#anagram-expand-btn').click();
    await expect(page.locator('#anagram-history-section')).not.toHaveClass(/hidden/);
  });

  test('quiz section exists with stat elements', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('#quiz-total')).toBeAttached();
    await expect(page.locator('#quiz-avg')).toBeAttached();
  });

  test('wordbench section exists with stat elements', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('#wb-total')).toBeAttached();
    await expect(page.locator('#wb-sessions')).toBeAttached();
  });

  test('WOTD section exists', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('#wotd-saved')).toBeAttached();
    await expect(page.locator('#wotd-looked-up')).toBeAttached();
  });

  test('Stars & Diamonds section exists', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('#sd-total-stars')).toBeAttached();
    await expect(page.locator('#sd-diamonds-redeemed')).toBeAttached();
  });

  test('footer links exist', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('main a[href="/profile-data/"]')).toBeAttached();
    await expect(page.locator('main a[href="/settings/"]')).toBeAttached();
    await expect(page.locator('main a[href="/activities/"]')).toBeAttached();
  });
});

// ── Stats Page Layout — Negative ────────────────────────────────────────────

test.describe('Stats Page Layout — Negative', () => {
  test('no duplicate expand buttons exist', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('#drc-expand-btn')).toHaveCount(1);
    await expect(page.locator('#anagram-expand-btn')).toHaveCount(1);
    await expect(page.locator('#sixty-expand-btn')).toHaveCount(1);
  });

  test('no duplicate history sections exist', async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator('#drc-history-section')).toHaveCount(1);
    await expect(page.locator('#anagram-history-section')).toHaveCount(1);
    await expect(page.locator('#sixty-history-section')).toHaveCount(1);
  });

  test('closing 60-Second history panel hides it again', async ({ page }) => {
    await page.goto(PAGE);
    await page.locator('#sixty-expand-btn').click();
    await expect(page.locator('#sixty-history-section')).not.toHaveClass(/hidden/);
    await page.locator('#sixty-history-section-close').click();
    await expect(page.locator('#sixty-history-section')).toHaveClass(/hidden/);
  });

  test('closing Daily Rack history panel hides it again', async ({ page }) => {
    await page.goto(PAGE);
    await page.locator('#drc-expand-btn').click();
    await expect(page.locator('#drc-history-section')).not.toHaveClass(/hidden/);
    await page.locator('#drc-history-section-close').click();
    await expect(page.locator('#drc-history-section')).toHaveClass(/hidden/);
  });

  test('no JavaScript errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });

  test('expand button toggles text between ▶ and ▼', async ({ page }) => {
    await page.goto(PAGE);
    const btn = page.locator('#sixty-expand-btn');
    await expect(btn).toContainText('▶ History');
    await btn.click();
    await expect(btn).toContainText('▼ History');
    await btn.click();
    await expect(btn).toContainText('▶ History');
  });
});
