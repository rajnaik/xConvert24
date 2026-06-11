import { test, expect } from '@playwright/test';

/**
 * Global Click Tracking & API Tests
 * Tests the click tracking system that logs every interactive element click,
 * and the live click counter display.
 */

test.describe('Click Tracking — POST /api/clicks', () => {
  test('clicking a button sends click event to API', async ({ page }) => {
    let clickRequest: any = null;
    await page.route('/api/clicks', async route => {
      if (route.request().method() === 'POST') {
        clickRequest = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    // Wait for page to be fully loaded
    await page.waitForTimeout(500);

    // Click the solve button (an interactive element)
    await page.locator('#text-solve-btn').click();
    await page.waitForTimeout(300);

    expect(clickRequest).toBeTruthy();
    expect(clickRequest.user_id).toBeTruthy();
    expect(clickRequest.ui_element).toBeTruthy();
    expect(clickRequest.url).toBe('/');
  });

  test('click payload includes user_id from localStorage', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'tracking-test-uid'));
    await page.reload();

    let clickPayload: any = null;
    await page.route('/api/clicks', async route => {
      if (route.request().method() === 'POST') {
        clickPayload = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.locator('#text-solve-btn').click();
    await page.waitForTimeout(300);

    expect(clickPayload?.user_id).toBe('tracking-test-uid');
  });

  test('click tracking captures page URL', async ({ page }) => {
    let clickPayload: any = null;
    await page.route('/api/clicks', async route => {
      if (route.request().method() === 'POST') {
        clickPayload = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/settings');
    await page.waitForTimeout(500);
    await page.locator('#download-uid-btn').click();
    await page.waitForTimeout(300);

    expect(clickPayload?.url).toBe('/settings');
  });
});

test.describe('Click Tracking — UID Generation', () => {
  test('creates UID on first visit if none exists', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('swf-uid'));
    await page.reload();
    await page.waitForTimeout(500);

    // Click something to trigger UID creation
    await page.locator('#text-solve-btn').click();
    await page.waitForTimeout(300);

    const uid = await page.evaluate(() => localStorage.getItem('swf-uid'));
    expect(uid).toBeTruthy();
  });

  test('reuses existing UID across clicks', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('swf-uid', 'persistent-uid'));
    await page.reload();

    const payloads: any[] = [];
    await page.route('/api/clicks', async route => {
      if (route.request().method() === 'POST') {
        payloads.push(JSON.parse(route.request().postData() || '{}'));
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.locator('#text-solve-btn').click();
    await page.waitForTimeout(200);
    await page.locator('#dict-info-btn').click();
    await page.waitForTimeout(200);

    expect(payloads.length).toBeGreaterThanOrEqual(2);
    expect(payloads[0].user_id).toBe('persistent-uid');
    expect(payloads[1].user_id).toBe('persistent-uid');
  });
});

test.describe('Live Click Counter', () => {
  test('fetches total count on page load', async ({ page }) => {
    await page.route('/api/clicks?count=true', route => {
      route.fulfill({ json: { total: 12345 } });
    });

    await page.goto('/');
    const counter = page.locator('#total-clicks-value');
    // Counter may or may not exist on all pages
    if (await counter.isVisible()) {
      await expect(counter).toContainText('12,345');
    }
  });

  test('counter increments optimistically on click', async ({ page }) => {
    await page.route('/api/clicks?count=true', route => {
      route.fulfill({ json: { total: 100 } });
    });
    await page.route('/api/clicks', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    const counter = page.locator('#total-clicks-value');
    if (await counter.isVisible()) {
      await page.waitForTimeout(500);
      const before = await counter.textContent();
      await page.locator('#text-solve-btn').click();
      await page.waitForTimeout(200);
      const after = await counter.textContent();
      // Should have incremented
      const beforeNum = parseInt((before || '0').replace(/,/g, ''));
      const afterNum = parseInt((after || '0').replace(/,/g, ''));
      expect(afterNum).toBeGreaterThan(beforeNum);
    }
  });
});
