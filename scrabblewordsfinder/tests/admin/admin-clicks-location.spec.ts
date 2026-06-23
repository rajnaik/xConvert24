import { test, expect } from '@playwright/test';

/**
 * Admin Clicks — Location Column Tests
 * Tests the new Location column that shows city, country from click data.
 * Added: June 23, 2026
 */

test.describe('Admin Clicks Location Column — Positive', () => {
  test('renders city and country when both are present', async ({ page }) => {
    await page.route('**/api/clicks/*', route => {
      const url = route.request().url();
      if (url.includes('count=true')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ total: 1 }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          clicks: [
            { id: 1, user_id: 'u1', ui_element: 'btn', url: '/', ip_address: '1.2.3.4', city: 'London', country: 'GB', created_at: '2026-06-23 12:00:00' },
          ],
          total: 1,
        }),
      });
    });

    await page.goto('/admin/clicks/');
    await page.waitForSelector('#clicks-tbody tr td');

    const row = page.locator('#clicks-tbody tr').first();
    // Location is the 6th column (index 5, after IP Address)
    const locationCell = row.locator('td').nth(5);
    await expect(locationCell).toHaveText('London, GB');
  });

  test('renders only country when city is empty', async ({ page }) => {
    await page.route('**/api/clicks/*', route => {
      const url = route.request().url();
      if (url.includes('count=true')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ total: 1 }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          clicks: [
            { id: 2, user_id: 'u2', ui_element: 'link', url: '/about', ip_address: '5.6.7.8', city: '', country: 'US', created_at: '2026-06-23 11:00:00' },
          ],
          total: 1,
        }),
      });
    });

    await page.goto('/admin/clicks/');
    await page.waitForSelector('#clicks-tbody tr td');

    const row = page.locator('#clicks-tbody tr').first();
    const locationCell = row.locator('td').nth(5);
    await expect(locationCell).toHaveText('US');
  });
});

test.describe('Admin Clicks Location Column — Negative', () => {
  test('renders dash when both city and country are empty', async ({ page }) => {
    await page.route('**/api/clicks/*', route => {
      const url = route.request().url();
      if (url.includes('count=true')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ total: 1 }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          clicks: [
            { id: 3, user_id: 'u3', ui_element: 'tile', url: '/', ip_address: '9.10.11.12', city: '', country: '', created_at: '2026-06-23 10:00:00' },
          ],
          total: 1,
        }),
      });
    });

    await page.goto('/admin/clicks/');
    await page.waitForSelector('#clicks-tbody tr td');

    const row = page.locator('#clicks-tbody tr').first();
    const locationCell = row.locator('td').nth(5);
    // Should show em-dash when no location data
    await expect(locationCell).toHaveText('\u2014');
  });

  test('renders dash when city and country fields are missing from API response', async ({ page }) => {
    await page.route('**/api/clicks/*', route => {
      const url = route.request().url();
      if (url.includes('count=true')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ total: 1 }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          clicks: [
            { id: 4, user_id: 'u4', ui_element: 'logo', url: '/', ip_address: '2.3.4.5', created_at: '2026-06-23 09:00:00' },
          ],
          total: 1,
        }),
      });
    });

    await page.goto('/admin/clicks/');
    await page.waitForSelector('#clicks-tbody tr td');

    const row = page.locator('#clicks-tbody tr').first();
    const locationCell = row.locator('td').nth(5);
    // Should show em-dash when fields are undefined/missing
    await expect(locationCell).toHaveText('\u2014');
  });
});
