import { test, expect } from '@playwright/test';

/**
 * Best Opening Moves Tests
 * Tests the automatic calculation of best opening plays
 * with Double Word Score (DWS) through the centre star.
 */

test.describe('Best Opening Moves', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#two-letter-words')).not.toContainText('Loading', { timeout: 15000 });
  });

  test('shows placeholder when no tiles entered', async ({ page }) => {
    const panel = page.locator('#best-opening-panel');
    await expect(panel).toContainText('Enter your tiles above');
  });

  test('shows best openers when tiles are entered', async ({ page }) => {
    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#text-solve-btn').click();

    const panel = page.locator('#best-opening-panel');
    await expect(panel).toContainText('pts', { timeout: 5000 });
  });

  test('opener scores are doubled (DWS)', async ({ page }) => {
    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#text-solve-btn').click();

    const panel = page.locator('#best-opening-panel');
    await expect(panel).toContainText('DWS', { timeout: 5000 });
    await expect(panel).toContainText('× 2');
  });

  test('shows up to 10 opening moves', async ({ page }) => {
    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#text-solve-btn').click();

    const panel = page.locator('#best-opening-panel');
    await expect(panel).toContainText('pts', { timeout: 5000 });
    const entries = panel.locator('.rounded-lg.bg-gray-800');
    const count = await entries.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(10);
  });

  test('shows medal icons for top 3', async ({ page }) => {
    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#text-solve-btn').click();

    const panel = page.locator('#best-opening-panel');
    await expect(panel).toContainText('pts', { timeout: 5000 });
    const panelText = await panel.textContent();
    expect(panelText).toContain('🥇');
    expect(panelText).toContain('🥈');
    expect(panelText).toContain('🥉');
  });

  test('shows word length for each opener', async ({ page }) => {
    await page.locator('#text-solver').fill('AERTBLS');
    await page.locator('#text-solve-btn').click();

    const panel = page.locator('#best-opening-panel');
    await expect(panel).toContainText('letters', { timeout: 5000 });
  });

  test('updates when tiles change', async ({ page }) => {
    await page.locator('#text-solver').fill('QUIZX');
    await page.locator('#text-solve-btn').click();
    const panel = page.locator('#best-opening-panel');
    await page.waitForTimeout(500);
    const firstContent = await panel.textContent();

    await page.locator('#text-solver').fill('AEIOU');
    await page.locator('#text-solve-btn').click();
    await page.waitForTimeout(500);
    const secondContent = await panel.textContent();

    // Content should differ (different tiles = different openers)
    expect(firstContent).not.toBe(secondContent);
  });
});
