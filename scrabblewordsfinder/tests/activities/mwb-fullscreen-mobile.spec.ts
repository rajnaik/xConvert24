import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── MWB Mobile Fullscreen Fallback — Positive ────────────────────────────

test.describe('MWB Mobile Fullscreen — Positive', () => {
  test('fullscreen button exists on activities page', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const btn = page.locator('#fc-fullscreen-btn');
    await expect(btn).toBeAttached();
  });

  test('CSS fullscreen activates when native fullscreen rejects (mobile)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-user-mobile');
      localStorage.setItem('scbAchievements', JSON.stringify([
        { word: 'QUIXOTIC', score: 26, meaning: 'Exceedingly idealistic', date: '2026-06-22', category: 'manual' },
        { word: 'ZEPHYR', score: 20, meaning: 'A light wind from the west', date: '2026-06-22', category: 'manual' },
      ]));
    });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForLoadState('networkidle');

    // Start flashcard mode
    const startBtn = page.locator('#fc-start-btn');
    await startBtn.scrollIntoViewIfNeeded();
    await startBtn.click();

    // Wait for fc-fullscreen-btn to become visible
    await page.waitForFunction(() => {
      const btn = document.getElementById('fc-fullscreen-btn');
      return btn && btn.offsetParent !== null;
    }, { timeout: 5000 });

    // Now override requestFullscreen AFTER page load to simulate iOS rejection
    await page.evaluate(() => {
      HTMLElement.prototype.requestFullscreen = function() {
        return Promise.reject(new TypeError('Fullscreen API is not supported'));
      };
      delete (HTMLElement.prototype as any).webkitRequestFullscreen;
    });

    // Click fullscreen button
    const fcBtn = page.locator('#fc-fullscreen-btn');
    await fcBtn.click();
    await page.waitForTimeout(800);

    // Verify CSS fullscreen was applied
    const panel = page.locator('[data-css-fullscreen="1"]');
    await expect(panel).toBeAttached();

    const position = await panel.evaluate(el => window.getComputedStyle(el).position);
    expect(position).toBe('fixed');
  });

  test('CSS fullscreen covers full viewport on mobile', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-user-mobile');
      localStorage.setItem('scbAchievements', JSON.stringify([
        { word: 'QUIXOTIC', score: 26, meaning: 'Exceedingly idealistic', date: '2026-06-22', category: 'manual' },
        { word: 'ZEPHYR', score: 20, meaning: 'A light wind from the west', date: '2026-06-22', category: 'manual' },
      ]));
    });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForLoadState('networkidle');

    const startBtn = page.locator('#fc-start-btn');
    await startBtn.scrollIntoViewIfNeeded();
    await startBtn.click();
    await page.waitForFunction(() => {
      const btn = document.getElementById('fc-fullscreen-btn');
      return btn && btn.offsetParent !== null;
    }, { timeout: 5000 });

    // Override fullscreen to reject
    await page.evaluate(() => {
      HTMLElement.prototype.requestFullscreen = function() {
        return Promise.reject(new TypeError('Not supported'));
      };
      delete (HTMLElement.prototype as any).webkitRequestFullscreen;
    });

    const fcBtn = page.locator('#fc-fullscreen-btn');
    await fcBtn.click();
    await page.waitForTimeout(800);

    const panel = page.locator('[data-css-fullscreen="1"]');
    await expect(panel).toBeAttached();
    const box = await panel.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeLessThanOrEqual(0);
    expect(box!.y).toBeLessThanOrEqual(0);
    expect(box!.width).toBeGreaterThanOrEqual(375);
    expect(box!.height).toBeGreaterThanOrEqual(812);
  });

  test('exit CSS fullscreen restores normal layout', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-user-mobile');
      localStorage.setItem('scbAchievements', JSON.stringify([
        { word: 'QUIXOTIC', score: 26, meaning: 'Exceedingly idealistic', date: '2026-06-22', category: 'manual' },
        { word: 'ZEPHYR', score: 20, meaning: 'A light wind from the west', date: '2026-06-22', category: 'manual' },
      ]));
    });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForLoadState('networkidle');

    const startBtn = page.locator('#fc-start-btn');
    await startBtn.scrollIntoViewIfNeeded();
    await startBtn.click();
    await page.waitForFunction(() => {
      const btn = document.getElementById('fc-fullscreen-btn');
      return btn && btn.offsetParent !== null;
    }, { timeout: 5000 });

    await page.evaluate(() => {
      HTMLElement.prototype.requestFullscreen = function() {
        return Promise.reject(new TypeError('Not supported'));
      };
      delete (HTMLElement.prototype as any).webkitRequestFullscreen;
    });

    const fcBtn = page.locator('#fc-fullscreen-btn');

    // Enter CSS fullscreen
    await fcBtn.click();
    await page.waitForTimeout(800);
    await expect(page.locator('[data-css-fullscreen="1"]')).toBeAttached();

    // Exit CSS fullscreen
    await fcBtn.click();
    await page.waitForTimeout(500);

    // Verify CSS fullscreen is gone
    const cssFs = await page.locator('[data-css-fullscreen]').count();
    expect(cssFs).toBe(0);

    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflow).toBe('');
  });
});

// ── MWB Mobile Fullscreen Fallback — Negative ────────────────────────────

test.describe('MWB Mobile Fullscreen — Negative', () => {
  test('no JavaScript errors when CSS fullscreen activates', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-user-mobile');
      localStorage.setItem('scbAchievements', JSON.stringify([
        { word: 'QUIXOTIC', score: 26, meaning: 'Exceedingly idealistic', date: '2026-06-22', category: 'manual' },
      ]));
    });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForLoadState('networkidle');

    const startBtn = page.locator('#fc-start-btn');
    await startBtn.scrollIntoViewIfNeeded();
    await startBtn.click();
    await page.waitForFunction(() => {
      const btn = document.getElementById('fc-fullscreen-btn');
      return btn && btn.offsetParent !== null;
    }, { timeout: 5000 });

    await page.evaluate(() => {
      HTMLElement.prototype.requestFullscreen = function() {
        return Promise.reject(new TypeError('Not supported'));
      };
      delete (HTMLElement.prototype as any).webkitRequestFullscreen;
    });

    const fcBtn = page.locator('#fc-fullscreen-btn');
    await fcBtn.click();
    await page.waitForTimeout(1000);

    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('fullscreen button title changes to exit in CSS fullscreen', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-user-mobile');
      localStorage.setItem('scbAchievements', JSON.stringify([
        { word: 'QUIXOTIC', score: 26, meaning: 'Exceedingly idealistic', date: '2026-06-22', category: 'manual' },
      ]));
    });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForLoadState('networkidle');

    const startBtn = page.locator('#fc-start-btn');
    await startBtn.scrollIntoViewIfNeeded();
    await startBtn.click();
    await page.waitForFunction(() => {
      const btn = document.getElementById('fc-fullscreen-btn');
      return btn && btn.offsetParent !== null;
    }, { timeout: 5000 });

    await page.evaluate(() => {
      HTMLElement.prototype.requestFullscreen = function() {
        return Promise.reject(new TypeError('Not supported'));
      };
      delete (HTMLElement.prototype as any).webkitRequestFullscreen;
    });

    const fcBtn = page.locator('#fc-fullscreen-btn');
    await fcBtn.click();
    await page.waitForTimeout(800);

    const title = await fcBtn.getAttribute('title');
    expect(title).toBe('Exit full screen');
  });

  test('body scroll is locked during CSS fullscreen', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-user-mobile');
      localStorage.setItem('scbAchievements', JSON.stringify([
        { word: 'QUIXOTIC', score: 26, meaning: 'Exceedingly idealistic', date: '2026-06-22', category: 'manual' },
      ]));
    });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(ACTIVITIES_URL);
    await page.waitForLoadState('networkidle');

    const startBtn = page.locator('#fc-start-btn');
    await startBtn.scrollIntoViewIfNeeded();
    await startBtn.click();
    await page.waitForFunction(() => {
      const btn = document.getElementById('fc-fullscreen-btn');
      return btn && btn.offsetParent !== null;
    }, { timeout: 5000 });

    await page.evaluate(() => {
      HTMLElement.prototype.requestFullscreen = function() {
        return Promise.reject(new TypeError('Not supported'));
      };
      delete (HTMLElement.prototype as any).webkitRequestFullscreen;
    });

    const fcBtn = page.locator('#fc-fullscreen-btn');
    await fcBtn.click();
    await page.waitForTimeout(800);

    const overflow = await page.evaluate(() => document.body.style.overflow);
    expect(overflow).toBe('hidden');
  });
});
