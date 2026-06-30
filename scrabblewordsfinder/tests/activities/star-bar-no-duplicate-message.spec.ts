import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── StarBar Message — Positive ───────────────────────────────────────────

test.describe('StarBar Message Element — Positive', () => {
  test('sb-message element exists in the star bar', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#sb-message')).toBeAttached();
  });

  test('sb-message shows progress text for anonymous user', async ({ page }) => {
    // Clear any existing UID so the fallback message appears
    await page.addInitScript(() => {
      localStorage.removeItem('swf-uid');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForFunction(() => {
      const el = document.getElementById('sb-message');
      return el && el.textContent && el.textContent.length > 0;
    }, { timeout: 8000 });
    const text = await page.locator('#sb-message').textContent();
    expect(text).toContain('Start playing');
  });
});

// ── StarBar Message — Negative ───────────────────────────────────────────

test.describe('StarBar Message Element — Negative', () => {
  test('no duplicate sb-message elements exist', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const count = await page.locator('#sb-message').count();
    expect(count).toBe(1);
  });

  test('sb-message does not cause page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(ACTIVITIES_URL);
    // Wait for starbar JS to execute
    await page.waitForTimeout(2000);
    const sbErrors = errors.filter(e => e.includes('sb-message'));
    expect(sbErrors).toHaveLength(0);
  });
});
