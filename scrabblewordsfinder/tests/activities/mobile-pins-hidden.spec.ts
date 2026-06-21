import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── Panel Focus Buttons Mobile Visibility — Positive ─────────────────────
// The CSS change adds @media (max-width: 480px) { .panel-focus-btn { display: flex } }
// ensuring the buttons are explicitly flex-displayed on mobile viewports only (phones).

test.describe('Panel Focus Buttons Mobile Visibility — Positive', () => {
  test('panel-focus-btn is visible on mobile viewport 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn', { state: 'attached' });
    const pins = page.locator('.panel-focus-btn');
    const count = await pins.count();
    expect(count).toBeGreaterThanOrEqual(1);
    await expect(pins.first()).toBeVisible();
  });

  test('panel-focus-btn is not display:none on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn', { state: 'visible' });
    const display = await page.locator('.panel-focus-btn').first().evaluate(
      el => window.getComputedStyle(el).display
    );
    expect(display).not.toBe('none');
  });

  test('all game panels have a focus button on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn', { state: 'attached' });
    const panels = page.locator('.grid.grid-cols-1 > div[class*="rounded-xl"][class*="border"]');
    const count = await panels.count();
    let gamePanelCount = 0;
    for (let i = 0; i < count; i++) {
      const cls = await panels.nth(i).getAttribute('class');
      if (cls && cls.includes('col-span')) continue;
      gamePanelCount++;
      const btnCount = await panels.nth(i).locator('.panel-focus-btn').count();
      expect(btnCount).toBe(1);
    }
    expect(gamePanelCount).toBeGreaterThanOrEqual(5);
  });

  test('focus button has correct aria-label', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn', { state: 'attached' });
    const ariaLabel = await page.locator('.panel-focus-btn').first().getAttribute('aria-label');
    expect(ariaLabel).toBe('Fit this game to screen');
  });
});

// ── Panel Focus Buttons Mobile Visibility — Negative ─────────────────────

test.describe('Panel Focus Buttons Mobile Visibility — Negative', () => {
  test('panel-focus-btn is hidden (display:none) on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn', { state: 'attached' });
    const display = await page.locator('.panel-focus-btn').first().evaluate(
      el => window.getComputedStyle(el).display
    );
    expect(display).toBe('none');
  });

  test('panel-focus-btn transitions from hidden to flex at 480px breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 481, height: 1024 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn', { state: 'attached' });
    const displayAt481 = await page.locator('.panel-focus-btn').first().evaluate(
      el => window.getComputedStyle(el).display
    );
    expect(displayAt481).toBe('none');

    await page.setViewportSize({ width: 480, height: 1024 });
    await page.waitForTimeout(100);
    const displayAt480 = await page.locator('.panel-focus-btn').first().evaluate(
      el => window.getComputedStyle(el).display
    );
    expect(displayAt480).toBe('flex');
  });

  test('no duplicate focus buttons per panel on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn', { state: 'attached' });
    const panels = page.locator('.grid.grid-cols-1 > div[class*="rounded-xl"][class*="border"]');
    const count = await panels.count();
    for (let i = 0; i < count; i++) {
      const cls = await panels.nth(i).getAttribute('class');
      if (cls && cls.includes('col-span')) continue;
      const btnCount = await panels.nth(i).locator('.panel-focus-btn').count();
      expect(btnCount).toBeLessThanOrEqual(1);
    }
  });

  test('no JavaScript errors on mobile page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn', { state: 'attached' });
    await page.waitForTimeout(500);
    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError')
    );
    expect(critical).toHaveLength(0);
  });

  test('no horizontal overflow on mobile after focus buttons render', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn', { state: 'attached' });
    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);
  });

  test('clicking focus button does not produce errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn', { state: 'visible' });
    await page.locator('.panel-focus-btn').first().click();
    await page.waitForTimeout(500);
    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError')
    );
    expect(critical).toHaveLength(0);
  });
});
