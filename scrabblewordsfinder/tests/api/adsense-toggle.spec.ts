import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('AdSense Toggle — Positive', () => {
  test.beforeAll(async ({ request }) => {
    // Ensure adsense is ON before positive tests
    await request.put(`${BASE_URL}/api/site-status/`, {
      data: { adsense: 'ON' },
    });
  });

  test('ads are rendered on homepage when adsense is ON', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const adScripts = await page.locator('script[src*="pagead2.googlesyndication"]').count();
    expect(adScripts).toBeGreaterThan(0);
  });

  test('ad units (adsbygoogle) are present when adsense is ON', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    const adUnits = await page.locator('.adsbygoogle').count();
    expect(adUnits).toBeGreaterThan(0);
  });

  test('site-status API returns adsense field', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/site-status/`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.adsense).toBeDefined();
    expect(['ON', 'OFF']).toContain(data.adsense);
  });

  test('PUT can toggle adsense to OFF and back to ON', async ({ request }) => {
    const offRes = await request.put(`${BASE_URL}/api/site-status/`, {
      data: { adsense: 'OFF' },
    });
    expect(offRes.ok()).toBeTruthy();
    const offData = await offRes.json();
    expect(offData.adsense).toBe('OFF');

    const onRes = await request.put(`${BASE_URL}/api/site-status/`, {
      data: { adsense: 'ON' },
    });
    expect(onRes.ok()).toBeTruthy();
    const onData = await onRes.json();
    expect(onData.adsense).toBe('ON');
  });
});

test.describe('AdSense Toggle — Cache Consistency (KV)', () => {
  test.afterAll(async ({ request }) => {
    // Restore to ON
    await request.put(`${BASE_URL}/api/site-status/`, { data: { adsense: 'ON' } });
  });

  test('page reflects OFF immediately after PUT (no stale cache)', async ({ request, page }) => {
    // Toggle to OFF — Layout reads from KV first, API must update KV
    await request.put(`${BASE_URL}/api/site-status/`, { data: { adsense: 'OFF' } });
    // Load page immediately — should NOT serve stale ON from KV
    await page.goto(`${BASE_URL}/`);
    const adScripts = await page.locator('script[src*="pagead2.googlesyndication"]').count();
    expect(adScripts).toBe(0);
  });

  test('page reflects ON immediately after PUT (no stale cache)', async ({ request, page }) => {
    // Start from OFF
    await request.put(`${BASE_URL}/api/site-status/`, { data: { adsense: 'OFF' } });
    // Toggle to ON
    await request.put(`${BASE_URL}/api/site-status/`, { data: { adsense: 'ON' } });
    // Load page immediately — should serve fresh ON from KV
    await page.goto(`${BASE_URL}/`);
    const adScripts = await page.locator('script[src*="pagead2.googlesyndication"]').count();
    expect(adScripts).toBeGreaterThan(0);
  });

  test('rapid toggle does not leave stale state', async ({ request, page }) => {
    // Rapid: ON → OFF → ON → OFF
    await request.put(`${BASE_URL}/api/site-status/`, { data: { adsense: 'ON' } });
    await request.put(`${BASE_URL}/api/site-status/`, { data: { adsense: 'OFF' } });
    await request.put(`${BASE_URL}/api/site-status/`, { data: { adsense: 'ON' } });
    await request.put(`${BASE_URL}/api/site-status/`, { data: { adsense: 'OFF' } });
    // Final state: OFF
    await page.goto(`${BASE_URL}/`);
    const adScripts = await page.locator('script[src*="pagead2.googlesyndication"]').count();
    expect(adScripts).toBe(0);
  });

  test('GET /api/site-status returns current value after toggle', async ({ request }) => {
    await request.put(`${BASE_URL}/api/site-status/`, { data: { adsense: 'OFF' } });
    const res = await request.get(`${BASE_URL}/api/site-status/`);
    const data = await res.json();
    expect(data.adsense).toBe('OFF');

    await request.put(`${BASE_URL}/api/site-status/`, { data: { adsense: 'ON' } });
    const res2 = await request.get(`${BASE_URL}/api/site-status/`);
    const data2 = await res2.json();
    expect(data2.adsense).toBe('ON');
  });
});

test.describe('AdSense Toggle — Negative', () => {
  test.afterAll(async ({ request }) => {
    // Always restore adsense to ON after negative tests
    await request.put(`${BASE_URL}/api/site-status/`, {
      data: { adsense: 'ON' },
    });
  });

  test('ads are NOT rendered on homepage when adsense is OFF', async ({ request, page }) => {
    await request.put(`${BASE_URL}/api/site-status/`, {
      data: { adsense: 'OFF' },
    });
    await page.goto(`${BASE_URL}/`);
    const adScripts = await page.locator('script[src*="pagead2.googlesyndication"]').count();
    expect(adScripts).toBe(0);
  });

  test('no adsbygoogle elements when adsense is OFF', async ({ request, page }) => {
    await request.put(`${BASE_URL}/api/site-status/`, {
      data: { adsense: 'OFF' },
    });
    await page.goto(`${BASE_URL}/`);
    const adUnits = await page.locator('.adsbygoogle').count();
    expect(adUnits).toBe(0);
  });

  test('PUT rejects invalid adsense value', async ({ request }) => {
    const res = await request.put(`${BASE_URL}/api/site-status/`, {
      data: { adsense: 'MAYBE' },
    });
    expect(res.ok()).toBeFalsy();
    expect(res.status()).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("adsense must be 'ON' or 'OFF'");
  });

  test('ads are still hidden on admin pages even when adsense is ON', async ({ request, page }) => {
    await request.put(`${BASE_URL}/api/site-status/`, {
      data: { adsense: 'ON' },
    });
    await page.goto(`${BASE_URL}/admin/`);
    const adScripts = await page.locator('script[src*="pagead2.googlesyndication"]').count();
    expect(adScripts).toBe(0);
  });
});
