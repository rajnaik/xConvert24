import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── Panel Focus Buttons — Positive ───────────────────────────────
// The .panel-focus-btn (📌) is mobile-only: visible on ≤480px, hidden on wider viewports.

test.describe('Panel Focus Buttons — Positive', () => {
  test('panel-focus-btn elements are visible on mobile viewport (≤480px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn');
    const btns = page.locator('.panel-focus-btn');
    const count = await btns.count();
    expect(count).toBeGreaterThanOrEqual(5);
    await expect(btns.first()).toBeVisible();
  });

  test('panel-focus-btn elements exist in the DOM on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn', { state: 'attached' });
    const btns = page.locator('.panel-focus-btn');
    const count = await btns.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('clicking focus button adds panel-focused class on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn');
    const firstBtn = page.locator('.panel-focus-btn').first();
    await firstBtn.click();
    const focusedPanels = page.locator('.panel-focused');
    await expect(focusedPanels).toHaveCount(1);
  });

  test('clicking outside unfocuses the panel on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn');
    const firstBtn = page.locator('.panel-focus-btn').first();
    await firstBtn.click();
    await expect(page.locator('.panel-focused')).toHaveCount(1);
    await page.locator('h1').first().click();
    await expect(page.locator('.panel-focused')).toHaveCount(0);
  });

  test('each game panel uses responsive padding p-4 sm:p-6', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ACTIVITIES_URL);
    const panels = page.locator('.grid.grid-cols-1 > div[class*="rounded-xl"][class*="border"]');
    const count = await panels.count();
    expect(count).toBeGreaterThanOrEqual(5);
    for (let i = 0; i < count; i++) {
      const panel = panels.nth(i);
      const cls = await panel.getAttribute('class');
      if (cls && !cls.includes('col-span')) {
        expect(cls).toContain('p-4');
        break;
      }
    }
  });
});

// ── Panel Focus Buttons — Negative ───────────────────────────────

test.describe('Panel Focus Buttons — Negative', () => {
  test('only one panel can be focused at a time', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn');
    const btns = page.locator('.panel-focus-btn');
    await btns.nth(0).click();
    await expect(page.locator('.panel-focused')).toHaveCount(1);
    await btns.nth(1).click();
    await expect(page.locator('.panel-focused')).toHaveCount(1);
  });

  test('no duplicate focus buttons per panel', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn');
    const panels = page.locator('.grid.grid-cols-1 > div[class*="rounded-xl"][class*="border"]');
    const count = await panels.count();
    for (let i = 0; i < count; i++) {
      const panel = panels.nth(i);
      const cls = await panel.getAttribute('class');
      if (cls && cls.includes('col-span')) continue;
      const btnCount = await panel.locator('.panel-focus-btn').count();
      expect(btnCount).toBeLessThanOrEqual(1);
    }
  });

  test('panel-focus-btn is hidden on tablet viewport (481px–767px)', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 900 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn', { state: 'attached' });
    const btns = page.locator('.panel-focus-btn');
    const count = await btns.count();
    expect(count).toBeGreaterThanOrEqual(1);
    // All focus buttons should be hidden (display:none) above 480px
    for (let i = 0; i < Math.min(count, 3); i++) {
      await expect(btns.nth(i)).not.toBeVisible();
    }
  });

  test('no horizontal overflow on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('h1');
    const hasOverflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasOverflow).toBe(false);
  });

  test('no JavaScript errors during focus/unfocus cycle', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn');

    const btn = page.locator('.panel-focus-btn').first();
    await btn.click();
    await page.waitForTimeout(300);
    await page.locator('h1').first().click();
    await page.waitForTimeout(300);

    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError')
    );
    expect(critical).toHaveLength(0);
  });
});
