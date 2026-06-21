import { test, expect } from '@playwright/test';

/**
 * Admin Clicks Analysis Page — UI Tests
 * Tests the /admin/clicks-analysis page:
 * - Page structure (title, nav, stats, view switcher, bubble container)
 * - API integration (trailing-slash URL pattern /api/clicks/?limit=500)
 * - View switching behaviour (elements, pages, countries, devices, browsers, map)
 * - Error and empty states
 */

test.describe('Admin Clicks Analysis — Positive (Page Structure)', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto('/admin/clicks-analysis/');
    await expect(page).toHaveTitle(/Click Analysis.*Admin/);
  });

  test('has page heading with bubble emoji and description', async ({ page }) => {
    await page.goto('/admin/clicks-analysis/');
    await expect(page.locator('h1').first()).toContainText('Click Analysis');
    await expect(page.locator('text=Visual breakdown of user interactions')).toBeAttached();
  });

  test('has navigation bar with Analysis link highlighted', async ({ page }) => {
    await page.goto('/admin/clicks-analysis/');
    const nav = page.locator('nav');
    const analysisLink = nav.locator('a[href="/admin/clicks-analysis"]');
    await expect(analysisLink).toBeVisible();
    await expect(analysisLink).toHaveClass(/text-blue-400/);
    await expect(analysisLink).toHaveClass(/font-medium/);
  });

  test('nav contains expected admin links', async ({ page }) => {
    await page.goto('/admin/clicks-analysis/');
    const nav = page.locator('nav').first();
    await expect(nav.locator('a[href="/admin/"]')).toBeAttached();
    await expect(nav.locator('a[href="/admin/clicks"]')).toBeAttached();
    await expect(nav.locator('a[href="/admin/clicks-analysis"]')).toBeAttached();
    await expect(nav.locator('a[href="/admin/telemetry"]')).toBeAttached();
    await expect(nav.locator('a[href="/"]').first()).toBeAttached();
  });

  test('stats bar has four stat cards', async ({ page }) => {
    await page.goto('/admin/clicks-analysis/');
    await expect(page.locator('#stat-total')).toBeVisible();
    await expect(page.locator('#stat-elements')).toBeVisible();
    await expect(page.locator('#stat-countries')).toBeVisible();
    await expect(page.locator('#stat-pages')).toBeVisible();
  });

  test('view switcher has all six view buttons', async ({ page }) => {
    await page.goto('/admin/clicks-analysis/');
    await expect(page.locator('.view-btn[data-view="elements"]')).toBeVisible();
    await expect(page.locator('.view-btn[data-view="pages"]')).toBeVisible();
    await expect(page.locator('.view-btn[data-view="countries"]')).toBeVisible();
    await expect(page.locator('.view-btn[data-view="devices"]')).toBeVisible();
    await expect(page.locator('.view-btn[data-view="browsers"]')).toBeVisible();
    await expect(page.locator('.view-btn[data-view="map"]')).toBeVisible();
  });

  test('elements view is active by default', async ({ page }) => {
    await page.goto('/admin/clicks-analysis/');
    const elementsBtn = page.locator('.view-btn[data-view="elements"]');
    await expect(elementsBtn).toHaveClass(/active/);
  });

  test('bubble container is visible by default', async ({ page }) => {
    await page.goto('/admin/clicks-analysis/');
    await expect(page.locator('#bubble-container')).toBeVisible();
  });

  test('map container is hidden by default', async ({ page }) => {
    await page.goto('/admin/clicks-analysis/');
    await expect(page.locator('#mapContainer')).not.toBeVisible();
  });
});

test.describe('Admin Clicks Analysis — Positive (API Integration)', () => {
  test('fetches clicks from /api/clicks/ with trailing slash and limit=500', async ({ page }) => {
    const apiPromise = page.waitForRequest(req =>
      req.url().includes('/api/clicks/') && req.url().includes('limit=500')
    );
    await page.goto('/admin/clicks-analysis/');
    const request = await apiPromise;
    expect(request.url()).toMatch(/\/api\/clicks\/\?limit=500/);
  });

  test('renders stats when API returns click data', async ({ page }) => {
    await page.route('**/api/clicks/*', route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          clicks: [
            { ui_element: 'solve-btn', url: '/', country: 'UK', device_type: 'Desktop', browser: 'Chrome', os: 'Windows', city: 'London', created_at: '2026-06-20 10:00:00' },
            { ui_element: 'nav-link', url: '/about', country: 'US', device_type: 'Mobile', browser: 'Safari', os: 'iOS', city: 'NYC', created_at: '2026-06-20 09:30:00' },
            { ui_element: 'solve-btn', url: '/', country: 'UK', device_type: 'Desktop', browser: 'Chrome', os: 'Windows', city: 'Manchester', created_at: '2026-06-20 09:00:00' },
          ],
          total: 3,
        }),
      });
    });

    await page.goto('/admin/clicks-analysis/');
    await page.waitForSelector('#stat-total:not(:has-text("—"))');

    await expect(page.locator('#stat-total')).toHaveText('3');
    await expect(page.locator('#stat-elements')).toHaveText('2');
    await expect(page.locator('#stat-countries')).toHaveText('2');
    await expect(page.locator('#stat-pages')).toHaveText('2');
  });

  test('renders bubbles inside bubble-container', async ({ page }) => {
    await page.route('**/api/clicks/*', route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          clicks: [
            { ui_element: 'solve-btn', url: '/', country: 'UK', device_type: 'Desktop', browser: 'Chrome', os: 'Windows', city: 'London', created_at: '2026-06-20 10:00:00' },
            { ui_element: 'solve-btn', url: '/', country: 'US', device_type: 'Mobile', browser: 'Firefox', os: 'Android', city: 'LA', created_at: '2026-06-20 09:00:00' },
          ],
          total: 2,
        }),
      });
    });

    await page.goto('/admin/clicks-analysis/');
    await page.waitForSelector('#bubble-container .bubble');

    const bubbles = page.locator('#bubble-container .bubble');
    await expect(bubbles).toHaveCount(1); // "solve-btn" grouped into one bubble
  });

  test('switching view re-renders bubbles grouped by selected dimension', async ({ page }) => {
    await page.route('**/api/clicks/*', route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          clicks: [
            { ui_element: 'solve-btn', url: '/', country: 'UK', device_type: 'Desktop', browser: 'Chrome', os: 'Windows', city: 'London', created_at: '2026-06-20 10:00:00' },
            { ui_element: 'nav-link', url: '/about', country: 'US', device_type: 'Mobile', browser: 'Safari', os: 'iOS', city: 'NYC', created_at: '2026-06-20 09:00:00' },
          ],
          total: 2,
        }),
      });
    });

    await page.goto('/admin/clicks-analysis/');
    await page.waitForSelector('#bubble-container .bubble');

    // Switch to "By Page" view
    await page.click('.view-btn[data-view="pages"]');
    await page.waitForTimeout(300);

    const pagesBtn = page.locator('.view-btn[data-view="pages"]');
    await expect(pagesBtn).toHaveClass(/active/);

    // Should have 2 page bubbles (/ and /about)
    const bubbles = page.locator('#bubble-container .bubble');
    await expect(bubbles).toHaveCount(2);
  });

  test('map view fetches from /api/clicks-analysis/ with trailing slash', async ({ page }) => {
    await page.route('**/api/clicks/*', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ clicks: [], total: 0 }),
      })
    );

    const mapApiPromise = page.waitForRequest(req =>
      req.url().includes('/api/clicks-analysis/')
    );

    await page.route('**/api/clicks-analysis/*', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ locations: [] }),
      })
    );

    await page.goto('/admin/clicks-analysis/');
    await page.click('.view-btn[data-view="map"]');

    const request = await mapApiPromise;
    expect(request.url()).toMatch(/\/api\/clicks-analysis\/$/);
  });

  test('clicking map view shows map container and hides bubble container', async ({ page }) => {
    await page.route('**/api/clicks/*', route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ clicks: [], total: 0 }),
      });
    });
    await page.route('**/api/clicks-analysis*', route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ locations: [] }),
      });
    });

    await page.goto('/admin/clicks-analysis/');
    await page.click('.view-btn[data-view="map"]');
    await page.waitForTimeout(500);

    await expect(page.locator('#mapContainer')).toBeVisible();
    await expect(page.locator('#bubble-container')).not.toBeVisible();
  });
});

test.describe('Admin Clicks Analysis — Negative (Error & Edge Cases)', () => {
  test('shows empty bubble container when API returns no clicks', async ({ page }) => {
    await page.route('**/api/clicks/*', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ clicks: [], total: 0 }),
      })
    );

    await page.goto('/admin/clicks-analysis/');
    await page.waitForSelector('#stat-total:not(:has-text("—"))');

    await expect(page.locator('#stat-total')).toHaveText('0');
    const bubbles = page.locator('#bubble-container .bubble');
    await expect(bubbles).toHaveCount(0);
  });

  test('no console errors on page load with empty data', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('**/api/clicks/*', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ clicks: [], total: 0 }),
      })
    );

    await page.goto('/admin/clicks-analysis/');
    await page.waitForTimeout(2000);

    // Filter out Leaflet/map errors that are expected in headless
    const critical = errors.filter(e => !e.includes('leaflet') && !e.includes('L is not defined'));
    expect(critical).toHaveLength(0);
  });

  test('map view shows no-data overlay when no location data exists', async ({ page }) => {
    await page.route('**/api/clicks/*', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ clicks: [], total: 0 }),
      })
    );
    await page.route('**/api/clicks-analysis/', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ locations: [] }),
      })
    );

    await page.goto('/admin/clicks-analysis/');
    await page.click('.view-btn[data-view="map"]');
    await page.waitForTimeout(1000);

    await expect(page.locator('#mapNoData')).toBeVisible();
    await expect(page.locator('#mapNoData')).toContainText('No location data available');
  });

  test('switching away from map view hides map and shows bubbles again', async ({ page }) => {
    await page.route('**/api/clicks/*', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ clicks: [], total: 0 }),
      })
    );
    await page.route('**/api/clicks-analysis*', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ locations: [] }),
      })
    );

    await page.goto('/admin/clicks-analysis/');

    // Switch to map
    await page.click('.view-btn[data-view="map"]');
    await page.waitForTimeout(500);
    await expect(page.locator('#mapContainer')).toBeVisible();

    // Switch back to elements
    await page.click('.view-btn[data-view="elements"]');
    await page.waitForTimeout(300);

    await expect(page.locator('#bubble-container')).toBeVisible();
    await expect(page.locator('#mapContainer')).not.toBeVisible();
  });

  test('no duplicate view buttons exist', async ({ page }) => {
    await page.goto('/admin/clicks-analysis/');
    const viewButtons = page.locator('.view-btn');
    await expect(viewButtons).toHaveCount(6);
  });

  test('stats show zero values gracefully without NaN or undefined', async ({ page }) => {
    await page.route('**/api/clicks/*', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ clicks: [], total: 0 }),
      })
    );

    await page.goto('/admin/clicks-analysis/');
    await page.waitForSelector('#stat-total:not(:has-text("—"))');

    const total = await page.locator('#stat-total').textContent();
    const elements = await page.locator('#stat-elements').textContent();
    const countries = await page.locator('#stat-countries').textContent();
    const pages = await page.locator('#stat-pages').textContent();

    expect(total).not.toContain('NaN');
    expect(total).not.toContain('undefined');
    expect(elements).not.toContain('NaN');
    expect(elements).not.toContain('undefined');
    expect(countries).not.toContain('NaN');
    expect(countries).not.toContain('undefined');
    expect(pages).not.toContain('NaN');
    expect(pages).not.toContain('undefined');
  });
});
