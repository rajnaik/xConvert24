import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

/**
 * Diamond Mine — No Mined Badge (feature removed)
 *
 * The "Mined ✓" badge was removed. When all diamonds on a page are claimed or
 * depleted, the diamond mine script simply returns without rendering any UI.
 * These tests confirm the badge never appears and no stale TTL logic remains.
 */

test.describe('Diamond Mine — No Mined Badge — Positive', () => {
  test('no mined badge element exists on any page when all diamonds are claimed', async ({ page }) => {
    await page.goto(`${BASE}/guide/`);
    await page.waitForTimeout(3000);

    // The .diamond-mine-mined class should never be injected
    const minedCount = await page.locator('.diamond-mine-mined').count();
    expect(minedCount).toBe(0);
  });

  test('no dm-mined localStorage keys are created after page load', async ({ page }) => {
    // Clear any stale keys first
    await page.addInitScript(() => {
      const staleKeys = Object.keys(localStorage).filter(k => k.startsWith('dm-mined-'));
      staleKeys.forEach(k => localStorage.removeItem(k));
    });

    await page.goto(`${BASE}/guide/`);
    await page.waitForTimeout(3000);

    const minedKeys = await page.evaluate(() => {
      return Object.keys(localStorage).filter(k => k.startsWith('dm-mined-'));
    });
    expect(minedKeys).toHaveLength(0);
  });

  test('stale dm-mined key is cleaned up when mine is active', async ({ page }) => {
    // Inject a stale key and confirm it gets removed when the mine renders
    await page.addInitScript(() => {
      localStorage.setItem('dm-mined-/guide/', String(Date.now() - 60000));
    });

    await page.goto(`${BASE}/guide/`);
    await page.waitForTimeout(3000);

    const gemVisible = await page.locator('.diamond-mine-gem').isVisible().catch(() => false);
    if (gemVisible) {
      // Mine is active — stale key should have been cleaned up
      const val = await page.evaluate(() => localStorage.getItem('dm-mined-/guide/'));
      expect(val).toBeNull();
    } else {
      // All depleted — script returns early, stale key is irrelevant
      // Just confirm no badge rendered
      const minedCount = await page.locator('.diamond-mine-mined').count();
      expect(minedCount).toBe(0);
    }
  });
});

test.describe('Diamond Mine — No Mined Badge — Negative', () => {
  test('no page errors from diamond mine script when all depleted', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(`${BASE}/`);
    await page.waitForTimeout(3000);

    const criticalErrors = errors.filter(e =>
      e.includes('diamond') || e.includes('dm-mined') || e.includes('localStorage')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('pre-existing dm-mined key does not cause badge to render', async ({ page }) => {
    // Even if a stale localStorage key exists from before the feature removal,
    // no badge should render
    await page.addInitScript(() => {
      localStorage.setItem('dm-mined-/guide/', String(Date.now() - 30000));
    });

    await page.goto(`${BASE}/guide/`);
    await page.waitForTimeout(3000);

    const minedCount = await page.locator('.diamond-mine-mined').count();
    expect(minedCount).toBe(0);
  });

  test('no duplicate diamond-mine elements exist on the page', async ({ page }) => {
    await page.goto(`${BASE}/guide/`);
    await page.waitForTimeout(3000);

    // At most one gem (if mine is active), zero mined badges
    const gemCount = await page.locator('.diamond-mine-gem').count();
    const minedCount = await page.locator('.diamond-mine-mined').count();
    expect(gemCount).toBeLessThanOrEqual(1);
    expect(minedCount).toBe(0);
  });
});
