import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'https://www.scrabblewordsfinder.com';

test.describe('Roadmap Page — Positive', () => {
  test('roadmap page loads with correct title', async ({ page }) => {
    await page.goto(`${BASE}/roadmap/`);
    await expect(page).toHaveTitle(/Roadmap/);
  });

  test('roadmap shows progress summary counts', async ({ page }) => {
    await page.goto(`${BASE}/roadmap/`);
    await page.waitForSelector('#count-live');
    const live = await page.locator('#count-live').textContent();
    expect(parseInt(live || '0')).toBeGreaterThan(0);
  });

  test('roadmap shows feature cards', async ({ page }) => {
    await page.goto(`${BASE}/roadmap/`);
    await page.waitForSelector('#roadmap-list div');
    const cards = await page.locator('#roadmap-list > div').count();
    expect(cards).toBeGreaterThan(5);
  });

  test('category filter buttons are present', async ({ page }) => {
    await page.goto(`${BASE}/roadmap/`);
    await page.waitForSelector('.cat-btn');
    const buttons = await page.locator('.cat-btn').count();
    expect(buttons).toBeGreaterThan(2);
  });

  test('clicking category filter updates list', async ({ page }) => {
    await page.goto(`${BASE}/roadmap/`);
    await page.waitForSelector('.cat-btn');
    const allCount = await page.locator('#roadmap-list > div').count();
    const catBtn = page.locator('.cat-btn').nth(1);
    await catBtn.click();
    const filteredCount = await page.locator('#roadmap-list > div').count();
    expect(filteredCount).toBeLessThanOrEqual(allCount);
  });

  test('suggest feature CTA is visible', async ({ page }) => {
    await page.goto(`${BASE}/roadmap/`);
    await expect(page.locator('a[href="/suggest/"]')).toBeVisible();
  });
});

test.describe('Roadmap Page — Negative', () => {
  test('no duplicate roadmap links in header', async ({ page }) => {
    await page.goto(`${BASE}/roadmap/`);
    const links = await page.locator('a[href="/roadmap/"]').count();
    expect(links).toBeLessThanOrEqual(3);
  });

  test('page has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/roadmap/`);
    await page.waitForTimeout(2000);
    expect(errors.filter(e => !e.includes('net::'))).toHaveLength(0);
  });
});

test.describe('Roadmap API — Positive', () => {
  test('GET /api/roadmap-features returns features array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/roadmap-features/`);
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(Array.isArray(json.features)).toBe(true);
    expect(json.features.length).toBeGreaterThan(0);
  });

  test('features have required fields', async ({ request }) => {
    const res = await request.get(`${BASE}/api/roadmap-features/`);
    const json = await res.json();
    const first = json.features[0];
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('description');
    expect(first).toHaveProperty('category');
    expect(first).toHaveProperty('progress');
    expect(first).toHaveProperty('icon');
  });
});

test.describe('Roadmap API — Negative', () => {
  test('POST without name returns 400', async ({ request }) => {
    const res = await request.post(`${BASE}/api/roadmap-features/`, {
      data: { description: 'no name provided' },
    });
    expect(res.status()).toBe(400);
  });

  test('DELETE without id returns 400', async ({ request }) => {
    const res = await request.delete(`${BASE}/api/roadmap-features/`);
    expect(res.status()).toBe(400);
  });
});
