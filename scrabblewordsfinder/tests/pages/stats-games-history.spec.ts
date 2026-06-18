import { test, expect } from '@playwright/test';

/**
 * Stats Page — Games Section (Condensed Tiles + Expandable History)
 *
 * Tests the 3-col game tiles (Daily Rack, Daily Anagram, 60-Second)
 * and their expandable history panels with toggle/close behaviour.
 *
 * Note: The expand/close handlers only register when localStorage has
 * 'swf-uid'. Tests that exercise expand behaviour inject a uid first.
 */

test.describe('Stats Page — Games Section — Positive', () => {
  test('games section heading is visible', async ({ page }) => {
    await page.goto('/stats/');
    await expect(page.locator('h2:has-text("Games")')).toBeVisible();
  });

  test('Daily Rack tile is visible with stat elements', async ({ page }) => {
    await page.goto('/stats/');
    await expect(page.locator('#drc-stat-best')).toBeVisible();
    await expect(page.locator('#drc-stat-played')).toBeVisible();
  });

  test('Daily Anagram tile is visible with stat elements', async ({ page }) => {
    await page.goto('/stats/');
    await expect(page.locator('#anagram-stat-streak')).toBeVisible();
    await expect(page.locator('#anagram-stat-solved')).toBeVisible();
  });

  test('60-Second tile is visible with personal best', async ({ page }) => {
    await page.goto('/stats/');
    await expect(page.locator('#sixty-stat-pb')).toBeVisible();
  });

  test('all three expand buttons are present', async ({ page }) => {
    await page.goto('/stats/');
    await expect(page.locator('#drc-expand-btn')).toBeVisible();
    await expect(page.locator('#anagram-expand-btn')).toBeVisible();
    await expect(page.locator('#sixty-expand-btn')).toBeVisible();
  });

  test('Daily Rack history section is hidden by default', async ({ page }) => {
    await page.goto('/stats/');
    await expect(page.locator('#drc-history-section')).toBeHidden();
  });

  test('Daily Anagram history section is hidden by default', async ({ page }) => {
    await page.goto('/stats/');
    await expect(page.locator('#anagram-history-section')).toBeHidden();
  });

  test('60-Second history section is hidden by default', async ({ page }) => {
    await page.goto('/stats/');
    await expect(page.locator('#sixty-history-section')).toBeHidden();
  });

  test('clicking DRC expand button shows history section', async ({ page }) => {
    // Inject uid so expand handlers register
    await page.goto('/stats/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-user-stats'));
    await page.reload();
    await page.locator('#drc-expand-btn').click();
    await expect(page.locator('#drc-history-section')).toBeVisible();
  });

  test('clicking Anagram expand button shows history section', async ({ page }) => {
    await page.goto('/stats/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-user-stats'));
    await page.reload();
    await page.locator('#anagram-expand-btn').click();
    await expect(page.locator('#anagram-history-section')).toBeVisible();
  });

  test('clicking 60-Second expand button shows history section', async ({ page }) => {
    await page.goto('/stats/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-user-stats'));
    await page.reload();
    await page.locator('#sixty-expand-btn').click();
    await expect(page.locator('#sixty-history-section')).toBeVisible();
  });

  test('DRC history section has close button that hides it', async ({ page }) => {
    await page.goto('/stats/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-user-stats'));
    await page.reload();
    await page.locator('#drc-expand-btn').click();
    await expect(page.locator('#drc-history-section')).toBeVisible();
    await page.locator('#drc-history-section-close').click();
    await expect(page.locator('#drc-history-section')).toBeHidden();
  });

  test('Anagram history section has close button that hides it', async ({ page }) => {
    await page.goto('/stats/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-user-stats'));
    await page.reload();
    await page.locator('#anagram-expand-btn').click();
    await expect(page.locator('#anagram-history-section')).toBeVisible();
    await page.locator('#anagram-history-section-close').click();
    await expect(page.locator('#anagram-history-section')).toBeHidden();
  });

  test('60-Second history section has close button that hides it', async ({ page }) => {
    await page.goto('/stats/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-user-stats'));
    await page.reload();
    await page.locator('#sixty-expand-btn').click();
    await expect(page.locator('#sixty-history-section')).toBeVisible();
    await page.locator('#sixty-history-section-close').click();
    await expect(page.locator('#sixty-history-section')).toBeHidden();
  });

  test('history sections contain loading or empty or content states', async ({ page }) => {
    await page.goto('/stats/');
    // DRC history section has the three possible states present in DOM
    await expect(page.locator('#drc-history-section-loading')).toBeAttached();
    await expect(page.locator('#drc-history-section-empty')).toBeAttached();
    await expect(page.locator('#drc-history-section-content')).toBeAttached();
  });

  test('expand button text changes to collapse indicator on click', async ({ page }) => {
    await page.goto('/stats/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-user-stats'));
    await page.reload();
    await expect(page.locator('#drc-expand-btn')).toHaveText('▶ History');
    await page.locator('#drc-expand-btn').click();
    await expect(page.locator('#drc-expand-btn')).toHaveText('▼ History');
  });
});

test.describe('Stats Page — Games Section — Negative', () => {
  test('no duplicate expand buttons exist', async ({ page }) => {
    await page.goto('/stats/');
    await expect(page.locator('#drc-expand-btn')).toHaveCount(1);
    await expect(page.locator('#anagram-expand-btn')).toHaveCount(1);
    await expect(page.locator('#sixty-expand-btn')).toHaveCount(1);
  });

  test('no duplicate history sections exist', async ({ page }) => {
    await page.goto('/stats/');
    await expect(page.locator('#drc-history-section')).toHaveCount(1);
    await expect(page.locator('#anagram-history-section')).toHaveCount(1);
    await expect(page.locator('#sixty-history-section')).toHaveCount(1);
  });

  test('page does not crash with JS errors on stats page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/stats/');
    await page.waitForTimeout(1000);
    expect(errors.filter(e => e.includes('Cannot read') || e.includes('is not a function'))).toHaveLength(0);
  });

  test('expand buttons do not crash without uid (handlers not registered)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/stats/');
    // Without uid, handlers aren't registered — clicking should be a no-op (no crash)
    await page.locator('#drc-expand-btn').click();
    await page.locator('#anagram-expand-btn').click();
    await page.locator('#sixty-expand-btn').click();
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('expand button click with uid does not produce console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/stats/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-user-stats'));
    await page.reload();
    page.on('pageerror', err => errors.push(err.message));
    await page.locator('#drc-expand-btn').click();
    await page.locator('#anagram-expand-btn').click();
    await page.locator('#sixty-expand-btn').click();
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('close button click on already-hidden section does not crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/stats/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'test-user-stats'));
    await page.reload();
    // Dispatch click directly via JS on the hidden close button (simulates programmatic trigger)
    await page.evaluate(() => {
      const btn = document.getElementById('drc-history-section-close');
      if (btn) btn.click();
    });
    await page.waitForTimeout(300);
    expect(errors).toHaveLength(0);
  });

  test('game tiles do not show NaN or undefined values', async ({ page }) => {
    await page.goto('/stats/');
    await page.waitForTimeout(1000);
    const drcBest = await page.locator('#drc-stat-best').textContent();
    const anagramStreak = await page.locator('#anagram-stat-streak').textContent();
    const sixtyPb = await page.locator('#sixty-stat-pb').textContent();
    expect(drcBest).not.toContain('NaN');
    expect(drcBest).not.toContain('undefined');
    expect(anagramStreak).not.toContain('NaN');
    expect(anagramStreak).not.toContain('undefined');
    expect(sixtyPb).not.toContain('NaN');
    expect(sixtyPb).not.toContain('undefined');
  });
});
