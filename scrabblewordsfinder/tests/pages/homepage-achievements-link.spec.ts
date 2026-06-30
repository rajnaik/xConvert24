import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Homepage Achievements Link — Positive', () => {
  test('checkAchievements fetches /api/achievements/ with trailing slash', async ({ page }) => {
    // Seed a UID so the fetch fires
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-trailing-slash-check');
    });

    const apiCalls: string[] = [];
    page.on('request', req => {
      if (req.url().includes('/api/achievements')) {
        apiCalls.push(req.url());
      }
    });

    await page.goto(`${BASE}/`);
    await page.waitForTimeout(2000);

    // Should have made at least one call to the achievements API
    expect(apiCalls.length).toBeGreaterThan(0);
    // All calls must use trailing slash before query params
    for (const url of apiCalls) {
      const path = new URL(url).pathname;
      expect(path).toBe('/api/achievements/');
    }
  });

  test('view-achievements-link becomes visible when user has >1 achievements', async ({ page }) => {
    // Seed a UID
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-achievements-visible');
    });

    // Intercept API and return mock data with 3 achievements
    await page.route('**/api/achievements/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          achievements: [
            { id: 1, word: 'QUEST', score: 14 },
            { id: 2, word: 'ZENITH', score: 16 },
            { id: 3, word: 'QUARTZ', score: 24 },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/`);
    await page.waitForTimeout(2000);

    const link = page.locator('#view-achievements-link');
    await expect(link).toBeVisible();
    await expect(link).toContainText('3 Achievements');
  });

  test('view-achievements-link shows correct count text', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-count-text');
    });

    await page.route('**/api/achievements/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          achievements: [
            { id: 1, word: 'A', score: 1 },
            { id: 2, word: 'B', score: 2 },
            { id: 3, word: 'C', score: 3 },
            { id: 4, word: 'D', score: 4 },
            { id: 5, word: 'E', score: 5 },
          ],
        }),
      });
    });

    await page.goto(`${BASE}/`);
    await page.waitForTimeout(2000);

    const link = page.locator('#view-achievements-link');
    await expect(link).toContainText('View 5 Achievements');
  });
});

test.describe('Homepage Achievements Link — Negative', () => {
  test('view-achievements-link stays hidden when no UID in localStorage', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('swf-uid');
    });

    await page.goto(`${BASE}/`);
    await page.waitForTimeout(2000);

    const link = page.locator('#view-achievements-link');
    await expect(link).toHaveClass(/hidden/);
  });

  test('view-achievements-link stays hidden when user has 0 or 1 achievements', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-few-achievements');
    });

    await page.route('**/api/achievements/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          achievements: [{ id: 1, word: 'ONLY', score: 4 }],
        }),
      });
    });

    await page.goto(`${BASE}/`);
    await page.waitForTimeout(2000);

    const link = page.locator('#view-achievements-link');
    await expect(link).toHaveClass(/hidden/);
  });

  test('no crash when achievements API returns error', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-api-error');
    });

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('**/api/achievements/**', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await page.goto(`${BASE}/`);
    await page.waitForTimeout(2000);

    // No critical JS errors — the .catch() handles it
    const critical = errors.filter(
      e => e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);

    // Link stays hidden
    const link = page.locator('#view-achievements-link');
    await expect(link).toHaveClass(/hidden/);
  });

  test('no duplicate #view-achievements-link elements on homepage', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const links = page.locator('#view-achievements-link');
    expect(await links.count()).toBe(1);
  });
});
