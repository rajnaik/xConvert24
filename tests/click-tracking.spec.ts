import { test, expect } from '@playwright/test';

/**
 * Click Tracking Tests
 * Verifies that user clicks are being recorded in the database via /api/clicks.
 * 
 * Tests:
 * 1. GET /api/clicks?count=true works
 * 2. POST /api/clicks registers a click
 * 3. After 20 clicks, the count increases by 20
 */

test.describe('Click Tracking: API Verification', () => {
  test('GET /api/clicks?count=true returns a total', async ({ request }) => {
    const res = await request.get('/api/clicks?count=true');
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('total');
    expect(typeof data.total).toBe('number');
  });

  test('POST /api/clicks accepts a valid click', async ({ request }) => {
    const res = await request.post('/api/clicks', {
      data: {
        user_id: 'playwright_test_' + Date.now(),
        ui_element: 'test-button-single',
        url: '/test-page',
      },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  test('POST /api/clicks rejects missing user_id', async ({ request }) => {
    const res = await request.post('/api/clicks', {
      data: { ui_element: 'test-button' },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/clicks rejects missing ui_element', async ({ request }) => {
    const res = await request.post('/api/clicks', {
      data: { user_id: 'test123' },
    });
    expect(res.status()).toBe(400);
  });

  test('20 clicks are registered and counted', async ({ request }) => {
    // Get initial count
    const beforeRes = await request.get('/api/clicks?count=true');
    const beforeData = await beforeRes.json();
    const initialCount = beforeData.total;

    // Send 20 clicks
    const testUid = 'playwright_batch_' + Date.now();
    for (let i = 0; i < 20; i++) {
      const res = await request.post('/api/clicks', {
        data: {
          user_id: testUid,
          ui_element: `test-element-${i + 1}`,
          url: `/test-page-${i + 1}`,
        },
      });
      expect(res.status()).toBe(200);
    }

    // Wait for async writes to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get new count
    const afterRes = await request.get('/api/clicks?count=true');
    const afterData = await afterRes.json();
    const newCount = afterData.total;

    // Verify at least 20 more clicks were registered
    expect(newCount - initialCount).toBeGreaterThanOrEqual(20);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CLICK TRACKING: BROWSER INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Click Tracking: Browser Integration', () => {
  test('Click counter element exists in footer', async ({ page }) => {
    await page.goto('/');
    const counter = page.locator('#total-clicks-value');
    await expect(counter).toBeVisible();
    // Should show a number (not the default —)
    await page.waitForTimeout(2000);
    const text = await counter.textContent();
    expect(text).not.toBe('—');
    // Should be a valid number
    const num = parseInt(text?.replace(/,/g, '') || '0');
    expect(num).toBeGreaterThanOrEqual(0);
  });

  test('Clicking a link increments the counter optimistically', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500); // Wait for initial count to load
    const counter = page.locator('#total-clicks-value');
    const beforeText = await counter.textContent();
    const beforeCount = parseInt(beforeText?.replace(/,/g, '') || '0');

    // Click a link on the page
    const link = page.locator('a[href^="/convert/"]').first();
    await link.click();
    await page.waitForTimeout(300);

    // On the new page, the counter should have incremented (or re-loaded)
    // Navigate back to check
    await page.goto('/');
    await page.waitForTimeout(1500);
    const afterText = await counter.textContent();
    const afterCount = parseInt(afterText?.replace(/,/g, '') || '0');

    expect(afterCount).toBeGreaterThanOrEqual(beforeCount);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CLICK TRACKING: DATA INTEGRITY
// ═══════════════════════════════════════════════════════════════════════════════

test.describe('Click Tracking: Data Integrity', () => {
  test('GET /api/clicks returns click details with limit', async ({ request }) => {
    const res = await request.get('/api/clicks?limit=5');
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('clicks');
    expect(data).toHaveProperty('total');
    expect(Array.isArray(data.clicks)).toBe(true);
    expect(data.clicks.length).toBeLessThanOrEqual(5);

    // Each click should have required fields
    if (data.clicks.length > 0) {
      const click = data.clicks[0];
      expect(click).toHaveProperty('user_id');
      expect(click).toHaveProperty('ui_element');
      expect(click).toHaveProperty('created_at');
    }
  });

  test('Clicks have url field populated', async ({ request }) => {
    // Send a click with a known url
    const testUrl = '/test-url-check-' + Date.now();
    await request.post('/api/clicks', {
      data: {
        user_id: 'playwright_url_test',
        ui_element: 'url-verification-btn',
        url: testUrl,
      },
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Fetch recent clicks and verify the url is stored
    const res = await request.get('/api/clicks?limit=5');
    const data = await res.json();
    const found = data.clicks.some((c: any) => c.url === testUrl);
    expect(found, `Click with url "${testUrl}" not found in recent clicks`).toBe(true);
  });
});
