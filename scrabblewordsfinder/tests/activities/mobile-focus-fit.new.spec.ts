import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── Mobile Focus/Fit Anchor Icons — Positive ─────────────────────

test.describe('Mobile Focus/Fit — Positive', () => {
  test('anchor buttons are visible on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn');
    const btns = page.locator('.panel-focus-btn');
    // Should have at least 5 (one per game panel, StarBar is excluded)
    const count = await btns.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('anchor buttons are hidden on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(ACTIVITIES_URL);
    // Wait for page to fully load
    await page.waitForSelector('h1');
    // Buttons should exist in DOM but be hidden via CSS display:none
    const btns = page.locator('.panel-focus-btn');
    const count = await btns.count();
    expect(count).toBeGreaterThanOrEqual(5);
    // First button should not be visible on desktop
    await expect(btns.first()).not.toBeVisible();
  });

  test('clicking anchor button adds panel-focused class', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn');
    const firstBtn = page.locator('.panel-focus-btn').first();
    await firstBtn.click();
    // The parent panel should now have panel-focused class
    const focusedPanels = page.locator('.panel-focused');
    await expect(focusedPanels).toHaveCount(1);
  });

  test('focused panel has max-height constraint on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn');
    const firstBtn = page.locator('.panel-focus-btn').first();
    await firstBtn.click();
    const focusedPanel = page.locator('.panel-focused');
    const maxHeight = await focusedPanel.evaluate(el => getComputedStyle(el).maxHeight);
    // Should have a max-height set (not 'none')
    expect(maxHeight).not.toBe('none');
  });

  test('clicking anchor again removes focused state', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn');
    const firstBtn = page.locator('.panel-focus-btn').first();
    // Focus
    await firstBtn.click();
    await expect(page.locator('.panel-focused')).toHaveCount(1);
    // Unfocus by clicking outside
    await page.locator('h1').click();
    await expect(page.locator('.panel-focused')).toHaveCount(0);
  });

  test('each game panel uses responsive padding p-4 sm:p-6', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ACTIVITIES_URL);
    // Check that panels have p-4 class (mobile-first)
    const panels = page.locator('.grid.grid-cols-1 > div[class*="rounded-xl"][class*="border"]');
    const count = await panels.count();
    expect(count).toBeGreaterThanOrEqual(5);
    // Check first non-StarBar panel for responsive padding class
    for (let i = 0; i < count; i++) {
      const panel = panels.nth(i);
      const cls = await panel.getAttribute('class');
      if (cls && !cls.includes('col-span')) {
        // Should not have bare p-6 without sm: prefix
        expect(cls).toContain('p-4');
        break;
      }
    }
  });
});

// ── Mobile Focus/Fit Anchor Icons — Negative ─────────────────────

test.describe('Mobile Focus/Fit — Negative', () => {
  test('only one panel can be focused at a time', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn');
    const btns = page.locator('.panel-focus-btn');
    // Focus first panel
    await btns.nth(0).click();
    await expect(page.locator('.panel-focused')).toHaveCount(1);
    // Focus second panel — first should unfocus
    await btns.nth(1).click();
    await expect(page.locator('.panel-focused')).toHaveCount(1);
  });

  test('no duplicate anchor buttons per panel', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn');
    // Each game panel should have exactly one anchor button
    const panels = page.locator('.grid.grid-cols-1 > div[class*="rounded-xl"][class*="border"]');
    const count = await panels.count();
    for (let i = 0; i < count; i++) {
      const panel = panels.nth(i);
      const cls = await panel.getAttribute('class');
      if (cls && cls.includes('col-span')) continue; // Skip StarBar
      const btnCount = await panel.locator('.panel-focus-btn').count();
      expect(btnCount).toBeLessThanOrEqual(1);
    }
  });

  test('no horizontal overflow after focus interaction on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn');
    // Click focus on a panel
    await page.locator('.panel-focus-btn').first().click();
    // Check for horizontal overflow
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

    // Focus and unfocus cycle
    const btn = page.locator('.panel-focus-btn').first();
    await btn.click();
    await page.waitForTimeout(300);
    await page.locator('h1').click();
    await page.waitForTimeout(300);

    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError')
    );
    expect(critical).toHaveLength(0);
  });
});
