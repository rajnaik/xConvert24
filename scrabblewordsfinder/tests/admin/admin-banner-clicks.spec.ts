import { test, expect } from '@playwright/test';

/**
 * Admin Banner Clicks — Playwright Tests
 *
 * Covers:
 * - Page structure (title, heading, nav, stats, table)
 * - noindex meta tag (SEO compliance for admin pages)
 * - Randomize button behaviour
 * - Error handling when API fails
 */

test.describe('Admin Banner Clicks — Positive', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto('/admin/banner-clicks/');
    await expect(page).toHaveTitle(/Banner Clicks/);
  });

  test('has noindex meta tag', async ({ page }) => {
    await page.goto('/admin/banner-clicks/');
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute('content', 'noindex, nofollow');
  });

  test('has page heading', async ({ page }) => {
    await page.goto('/admin/banner-clicks/');
    await expect(page.locator('h1')).toContainText('Banner Clicks');
  });

  test('displays stats row with 3 stat cards', async ({ page }) => {
    await page.goto('/admin/banner-clicks/');
    const statTotal = page.locator('#stat-total');
    const statBanners = page.locator('#stat-banners');
    const statLatest = page.locator('#stat-latest');
    await expect(statTotal).toBeVisible();
    await expect(statBanners).toBeVisible();
    await expect(statLatest).toBeVisible();
  });

  test('has a clicks table with correct headers', async ({ page }) => {
    await page.goto('/admin/banner-clicks/');
    const headers = page.locator('thead th');
    await expect(headers).toHaveCount(6);
    await expect(headers.nth(0)).toContainText('ID');
    await expect(headers.nth(1)).toContainText('Banner ID');
    await expect(headers.nth(2)).toContainText('IP Address');
    await expect(headers.nth(3)).toContainText('Page URL');
    await expect(headers.nth(4)).toContainText('Referrer');
    await expect(headers.nth(5)).toContainText('Date');
  });

  test('has nav with banner-clicks link highlighted as active', async ({ page }) => {
    await page.goto('/admin/banner-clicks/');
    const clicksLink = page.locator('nav a[href="/admin/banner-clicks/"]');
    await expect(clicksLink).toHaveClass(/font-medium/);
    await expect(clicksLink).toHaveClass(/text-blue-400/);
  });

  test('has Randomize Banner ID button', async ({ page }) => {
    await page.goto('/admin/banner-clicks/');
    const btn = page.locator('#randomize-btn');
    await expect(btn).toBeVisible();
    await expect(btn).toContainText('Randomize Banner ID');
  });

  test('displays current banner_id indicator', async ({ page }) => {
    await page.goto('/admin/banner-clicks/');
    const bar = page.locator('#current-banner-bar');
    await expect(bar).toBeVisible();
    const idCode = page.locator('#active-banner-id');
    await expect(idCode).toBeVisible();
  });

  test('populates stats after API loads', async ({ page }) => {
    await page.route('**/api/banner-clicks?limit=100', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          clicks: [
            { id: 1, banner_id: 'test-1', ip_address: '1.2.3.4', page_url: '/', referrer: '', created_at: '2026-06-30T10:00:00Z' },
            { id: 2, banner_id: 'test-2', ip_address: '5.6.7.8', page_url: '/blog/', referrer: 'https://google.com', created_at: '2026-06-30T11:00:00Z' },
          ],
          total: 2,
        }),
      })
    );
    await page.goto('/admin/banner-clicks/');
    await page.waitForFunction(() =>
      document.getElementById('stat-total')?.textContent !== '—'
    );
    await expect(page.locator('#stat-total')).toHaveText('2');
    await expect(page.locator('#stat-banners')).toHaveText('2');
  });
});

test.describe('Admin Banner Clicks — Negative', () => {
  test('no duplicate noindex meta tags', async ({ page }) => {
    await page.goto('/admin/banner-clicks/');
    const robotsTags = page.locator('meta[name="robots"]');
    const count = await robotsTags.count();
    expect(count).toBeLessThanOrEqual(1);
  });

  test('shows error message when API fails', async ({ page }) => {
    await page.route('**/api/banner-clicks?limit=100', route =>
      route.fulfill({ status: 500, body: 'Server Error' })
    );
    await page.goto('/admin/banner-clicks/');
    await page.waitForFunction(() => {
      const tbody = document.getElementById('clicks-tbody');
      return tbody && tbody.textContent?.includes('Failed');
    });
    await expect(page.locator('#clicks-tbody')).toContainText('Failed to load banner clicks');
  });

  test('shows empty state when no clicks exist', async ({ page }) => {
    await page.route('**/api/banner-clicks?limit=100', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ clicks: [], total: 0 }),
      })
    );
    await page.goto('/admin/banner-clicks/');
    await page.waitForFunction(() => {
      const tbody = document.getElementById('clicks-tbody');
      return tbody && !tbody.textContent?.includes('Loading');
    });
    await expect(page.locator('#clicks-tbody')).toContainText('No banner clicks recorded yet');
  });

  test('randomize button disables during request', async ({ page }) => {
    await page.route('**/api/site-status', route => {
      if (route.request().method() === 'PUT') {
        return new Promise(resolve => setTimeout(() => {
          resolve(route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
        }, 500));
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ banner_id: 'old-id', updated_at: '2026-06-30T10:00:00Z' }),
      });
    });
    await page.route('**/api/banner-clicks?limit=100', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ clicks: [], total: 0 }) })
    );
    await page.goto('/admin/banner-clicks/');

    const btn = page.locator('#randomize-btn');
    await btn.click();
    // Button should be disabled while request is in-flight
    await expect(btn).toBeDisabled();
  });
});
