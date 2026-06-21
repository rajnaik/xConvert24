import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── Panel Focus Styles Applied (is:global) — Positive ────────────────────
// The style block uses is:global so dynamically-added .panel-focused class
// correctly receives max-height, overflow, and scroll styling on mobile.

test.describe('Panel Focus Styles Applied — Positive', () => {
  test('focused panel gets max-height constraint on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn', { state: 'visible' });
    await page.locator('.panel-focus-btn').first().click();
    const focused = page.locator('.panel-focused');
    await expect(focused).toHaveCount(1);
    const maxHeight = await focused.evaluate(
      el => window.getComputedStyle(el).maxHeight
    );
    // max-height should be set (calc(100dvh - 2rem) resolves to a px value, not 'none')
    expect(maxHeight).not.toBe('none');
    expect(maxHeight).not.toBe('');
  });

  test('focused panel gets overflow-y auto on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn', { state: 'visible' });
    await page.locator('.panel-focus-btn').first().click();
    const focused = page.locator('.panel-focused');
    await expect(focused).toHaveCount(1);
    const overflowY = await focused.evaluate(
      el => window.getComputedStyle(el).overflowY
    );
    expect(overflowY).toBe('auto');
  });

  test('focused panel gets smooth scroll-behavior on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn', { state: 'visible' });
    await page.locator('.panel-focus-btn').first().click();
    const focused = page.locator('.panel-focused');
    await expect(focused).toHaveCount(1);
    const scrollBehavior = await focused.evaluate(
      el => window.getComputedStyle(el).scrollBehavior
    );
    expect(scrollBehavior).toBe('smooth');
  });

  test('focus button inside focused panel gets active styling', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn', { state: 'visible' });
    await page.locator('.panel-focus-btn').first().click();
    const focusedBtn = page.locator('.panel-focused .panel-focus-btn');
    await expect(focusedBtn).toHaveCount(1);
    const bg = await focusedBtn.evaluate(
      el => window.getComputedStyle(el).backgroundColor
    );
    // Background should contain blue/rgba tint (not fully transparent)
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('focus icon rotates 45deg when panel is focused', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn', { state: 'visible' });
    await page.locator('.panel-focus-btn').first().click();
    const icon = page.locator('.panel-focused .focus-icon');
    await expect(icon).toHaveCount(1);
    const transform = await icon.evaluate(
      el => window.getComputedStyle(el).transform
    );
    // rotate(45deg) produces a matrix transform, not 'none'
    expect(transform).not.toBe('none');
  });
});

// ── Panel Focus Styles Applied (is:global) — Negative ────────────────────

test.describe('Panel Focus Styles Applied — Negative', () => {
  test('unfocused panels do not have max-height constraint', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn', { state: 'visible' });
    // No panel clicked — none should be focused
    const panels = page.locator('.grid.grid-cols-1 > div[class*="rounded-xl"][class*="border"]');
    const count = await panels.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      const maxHeight = await panels.nth(i).evaluate(
        el => window.getComputedStyle(el).maxHeight
      );
      expect(maxHeight).toBe('none');
    }
  });

  test('focused styles do not apply on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn', { state: 'attached' });
    // Force-add the class via JS to simulate — styles should NOT apply on desktop
    const panel = page.locator('.grid.grid-cols-1 > div[class*="rounded-xl"][class*="border"]').first();
    await panel.evaluate(el => el.classList.add('panel-focused'));
    const maxHeight = await panel.evaluate(
      el => window.getComputedStyle(el).maxHeight
    );
    // On desktop (>480px), the @media query shouldn't apply
    expect(maxHeight).toBe('none');
  });

  test('focused styles do not apply on tablet viewport (481px–767px)', async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 900 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn', { state: 'attached' });
    // Force-add the class — styles should NOT apply above 480px
    const panel = page.locator('.grid.grid-cols-1 > div[class*="rounded-xl"][class*="border"]').first();
    await panel.evaluate(el => el.classList.add('panel-focused'));
    const maxHeight = await panel.evaluate(
      el => window.getComputedStyle(el).maxHeight
    );
    expect(maxHeight).toBe('none');
  });

  test('removing panel-focused class restores normal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn', { state: 'visible' });
    const btn = page.locator('.panel-focus-btn').first();
    await btn.click();
    await expect(page.locator('.panel-focused')).toHaveCount(1);
    // Click outside to unfocus
    await page.locator('h1').first().click();
    await expect(page.locator('.panel-focused')).toHaveCount(0);
    // Check overflow is no longer auto
    const panel = page.locator('.grid.grid-cols-1 > div[class*="rounded-xl"][class*="border"]').first();
    const overflowY = await panel.evaluate(
      el => window.getComputedStyle(el).overflowY
    );
    expect(overflowY).not.toBe('auto');
  });

  test('no style leakage to StarBar panel', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('.panel-focus-btn', { state: 'attached' });
    // StarBar has lg:col-span-2 and should not have a focus button
    const starBar = page.locator('.grid.grid-cols-1 > div.lg\\:col-span-2');
    if (await starBar.count() > 0) {
      const btnCount = await starBar.locator('.panel-focus-btn').count();
      expect(btnCount).toBe(0);
    }
  });
});
