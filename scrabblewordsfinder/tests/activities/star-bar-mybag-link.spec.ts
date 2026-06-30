import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// ── StarBar MyBag Link — Positive ──────────────────────────────────

test.describe('StarBar MyBag Link — Positive', () => {
  test('MyBag link is visible in the star bar', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const mybagLink = page.locator('#sb-mybag-link');
    await expect(mybagLink).toBeVisible();
  });

  test('MyBag link points to /mybag/', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const mybagLink = page.locator('#sb-mybag-link');
    await expect(mybagLink).toHaveAttribute('href', '/mybag/');
  });

  test('MyBag link has correct title attribute', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const mybagLink = page.locator('#sb-mybag-link');
    await expect(mybagLink).toHaveAttribute('title', 'MyBag — View your star & diamond earnings');
  });

  test('MyBag link contains backpack emoji', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const mybagLink = page.locator('#sb-mybag-link');
    await expect(mybagLink).toContainText('🎒');
  });

  test('MyBag label text is present (hidden on small screens)', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const labelSpan = page.locator('#sb-mybag-link span.hidden.sm\\:inline');
    await expect(labelSpan).toHaveText('MyBag');
  });
});

// ── StarBar MyBag Link — Negative ──────────────────────────────────

test.describe('StarBar MyBag Link — Negative', () => {
  test('no duplicate MyBag links exist in star bar', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const count = await page.locator('#sb-mybag-link').count();
    expect(count).toBe(1);
  });

  test('MyBag link does not have an empty href', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const href = await page.locator('#sb-mybag-link').getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).not.toBe('#');
    expect(href).not.toBe('');
  });

  test('no JavaScript errors when star bar renders with MyBag link', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#sb-mybag-link');

    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('MyBag link is an internal path (not external URL)', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const href = await page.locator('#sb-mybag-link').getAttribute('href');
    expect(href).toMatch(/^\//);
  });
});
