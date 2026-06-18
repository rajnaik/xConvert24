import { test, expect } from '@playwright/test';

/**
 * Admin Dashboard — Site Status Widget Tests
 * Tests the /admin page's site status widget:
 * - Widget structure and initial placeholder state
 * - API fetch to /api/site-status
 * - Dynamic rendering of status, logo, and last-updated fields
 * - Error/fallback state when API fails
 * - Dashboard page structure (cards, nav, auth reminder)
 */

test.describe('Admin Dashboard — Page Structure', () => {
  test('admin page loads with correct title', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveTitle(/Admin/);
  });

  test('has page heading and description', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
    await expect(page.locator('text=Manage tasks, view reports, and run operations')).toBeAttached();
  });

  test('has navigation bar with correct links', async ({ page }) => {
    await page.goto('/admin');
    const nav = page.locator('nav');
    await expect(nav.locator('a[href="/admin"]')).toBeAttached();
    await expect(nav.locator('a[href="/admin/report"]')).toBeAttached();
    await expect(nav.locator('a[href="/admin/ops"]')).toBeAttached();
    await expect(nav.locator('a[href="/"]')).toBeAttached();
  });

  test('has Reports card linking to /admin/report', async ({ page }) => {
    await page.goto('/admin');
    const card = page.locator('a[href="/admin/report"]');
    await expect(card).toBeVisible();
    await expect(card.locator('h2')).toContainText('Reports');
  });

  test('has Ops card linking to /admin/ops', async ({ page }) => {
    await page.goto('/admin');
    const card = page.locator('a[href="/admin/ops"]');
    await expect(card).toBeVisible();
    await expect(card.locator('h2')).toContainText('Ops');
  });

  test('has Logo Management card linking to /admin/logo-management', async ({ page }) => {
    await page.goto('/admin');
    const card = page.locator('a[href="/admin/logo-management"]');
    await expect(card).toBeVisible();
    await expect(card.locator('h2')).toContainText('Logo Management');
  });

  test('Logo Management card mentions database-backed selection', async ({ page }) => {
    await page.goto('/admin');
    const card = page.locator('a[href="/admin/logo-management"]');
    await expect(card).toContainText('Database-backed selection');
  });

  test('has Google Auth reminder banner', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('text=Add Google Authentication')).toBeAttached();
  });
});

test.describe('Admin Dashboard — Site Status Widget Structure', () => {
  test('site status widget is present', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('#site-status-widget')).toBeVisible();
  });

  test('widget has Site Status heading', async ({ page }) => {
    await page.goto('/admin');
    const widget = page.locator('#site-status-widget');
    await expect(widget.locator('h2')).toContainText('Site Status');
  });

  test('widget has status indicator dot', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('#status-indicator')).toBeVisible();
  });

  test('status indicator starts with gray pulsing style', async ({ page }) => {
    await page.route('**/api/site-status', route => {
      return new Promise(resolve => setTimeout(() => {
        resolve(route.fulfill({ status: 200, body: JSON.stringify({ status: 'green', logo_option: 1 }) }));
      }, 2000));
    });
    await page.goto('/admin');
    const indicator = page.locator('#status-indicator');
    await expect(indicator).toHaveClass(/bg-gray-600/);
    await expect(indicator).toHaveClass(/animate-pulse/);
  });

  test('widget shows Status section with placeholder', async ({ page }) => {
    await page.goto('/admin');
    const statusEl = page.locator('#widget-status');
    await expect(statusEl).toBeAttached();
  });

  test('widget shows Active Logo section with image', async ({ page }) => {
    await page.goto('/admin');
    const logoImg = page.locator('#widget-logo-img');
    await expect(logoImg).toBeAttached();
    await expect(logoImg).toHaveAttribute('alt', 'Active logo');
  });

  test('widget shows Active Logo label', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('#widget-logo-label')).toBeAttached();
  });

  test('widget shows Last Updated section', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('#widget-updated')).toBeAttached();
    await expect(page.locator('#widget-updated-by')).toBeAttached();
  });

  test('widget uses 3-column grid layout on desktop', async ({ page }) => {
    await page.goto('/admin');
    const grid = page.locator('#site-status-widget .grid');
    await expect(grid).toHaveClass(/grid-cols-1/);
    await expect(grid).toHaveClass(/sm:grid-cols-3/);
  });
});

test.describe('Admin Dashboard — Site Status API Integration', () => {
  test('widget fetches /api/site-status on load', async ({ page }) => {
    const apiPromise = page.waitForResponse(resp =>
      resp.url().includes('/api/site-status')
    );
    await page.goto('/admin');
    const response = await apiPromise;
    expect(response.status()).toBe(200);
  });

  test('widget displays golden status correctly', async ({ page }) => {
    await page.route('**/api/site-status', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'golden', logo_option: 3, updated_at: '2025-06-10 14:30:00', updated_by: 'admin' }),
      })
    );
    await page.goto('/admin');
    await page.waitForFunction(() =>
      document.getElementById('widget-status')?.textContent !== '—'
    );

    await expect(page.locator('#widget-status')).toContainText('Golden');
    await expect(page.locator('#status-indicator')).toHaveClass(/bg-yellow-400/);
    await expect(page.locator('#status-indicator')).not.toHaveClass(/animate-pulse/);
  });

  test('widget displays green status correctly', async ({ page }) => {
    await page.route('**/api/site-status', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'green', logo_option: 2, updated_at: '2025-06-09 10:00:00', updated_by: 'kiro' }),
      })
    );
    await page.goto('/admin');
    await page.waitForFunction(() =>
      document.getElementById('widget-status')?.textContent !== '—'
    );

    await expect(page.locator('#widget-status')).toContainText('Green');
    await expect(page.locator('#status-indicator')).toHaveClass(/bg-green-400/);
  });

  test('widget displays red status correctly', async ({ page }) => {
    await page.route('**/api/site-status', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'red', logo_option: 1, updated_at: '2025-06-08 08:15:00', updated_by: 'ci' }),
      })
    );
    await page.goto('/admin');
    await page.waitForFunction(() =>
      document.getElementById('widget-status')?.textContent !== '—'
    );

    await expect(page.locator('#widget-status')).toContainText('Red');
    await expect(page.locator('#status-indicator')).toHaveClass(/bg-red-500/);
  });

  test('widget updates logo image src based on logo_option', async ({ page }) => {
    await page.route('**/api/site-status', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'green', logo_option: 4, updated_at: '2025-06-10 12:00:00', updated_by: 'admin' }),
      })
    );
    await page.goto('/admin');
    await page.waitForFunction(() =>
      document.getElementById('widget-logo-label')?.textContent !== '—'
    );

    const logoImg = page.locator('#widget-logo-img');
    await expect(logoImg).toHaveAttribute('src', '/logo-options/option-4.svg');
    await expect(page.locator('#widget-logo-label')).toHaveText('Option 4');
  });

  test('widget defaults logo to option 1 when logo_option is missing', async ({ page }) => {
    await page.route('**/api/site-status', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'green' }),
      })
    );
    await page.goto('/admin');
    await page.waitForFunction(() =>
      document.getElementById('widget-status')?.textContent !== '—'
    );

    const logoImg = page.locator('#widget-logo-img');
    await expect(logoImg).toHaveAttribute('src', '/logo-options/option-1.svg');
    await expect(page.locator('#widget-logo-label')).toHaveText('Option 1');
  });

  test('widget displays updated_at as formatted date', async ({ page }) => {
    await page.route('**/api/site-status', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'golden', logo_option: 1, updated_at: '2025-06-10 14:30:00', updated_by: 'admin' }),
      })
    );
    await page.goto('/admin');
    await page.waitForFunction(() =>
      document.getElementById('widget-updated')?.textContent !== '—'
    );

    const updatedText = await page.locator('#widget-updated').textContent();
    expect(updatedText).toMatch(/\d{2}\s\w+\s\d{4}/);
  });

  test('widget displays updated_by attribution', async ({ page }) => {
    await page.route('**/api/site-status', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'green', logo_option: 2, updated_at: '2025-06-10 09:00:00', updated_by: 'kiro' }),
      })
    );
    await page.goto('/admin');
    await page.waitForFunction(() =>
      document.getElementById('widget-updated-by')?.textContent !== ''
    );

    await expect(page.locator('#widget-updated-by')).toHaveText('by kiro');
  });

  test('widget hides updated_by when not provided', async ({ page }) => {
    await page.route('**/api/site-status', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'green', logo_option: 1, updated_at: '2025-06-10 09:00:00' }),
      })
    );
    await page.goto('/admin');
    await page.waitForFunction(() =>
      document.getElementById('widget-status')?.textContent !== '—'
    );

    await expect(page.locator('#widget-updated-by')).toHaveText('');
  });
});

test.describe('Admin Dashboard — Site Status Error Handling', () => {
  test('widget shows error message when API returns 500', async ({ page }) => {
    await page.route('**/api/site-status', route =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );
    await page.goto('/admin');
    await page.waitForFunction(() =>
      document.getElementById('widget-status')?.textContent !== '—'
    );

    await expect(page.locator('#widget-status')).toContainText('Could not load');
  });

  test('widget shows error message when API returns 404', async ({ page }) => {
    await page.route('**/api/site-status', route =>
      route.fulfill({ status: 404, body: 'Not Found' })
    );
    await page.goto('/admin');
    await page.waitForFunction(() =>
      document.getElementById('widget-status')?.textContent !== '—'
    );

    await expect(page.locator('#widget-status')).toContainText('Could not load');
  });

  test('widget shows error when network request fails', async ({ page }) => {
    await page.route('**/api/site-status', route => route.abort());
    await page.goto('/admin');
    await page.waitForFunction(() =>
      document.getElementById('widget-status')?.textContent !== '—'
    , { timeout: 10000 });

    await expect(page.locator('#widget-status')).toContainText('Could not load');
  });

  test('error state applies correct gray styling', async ({ page }) => {
    await page.route('**/api/site-status', route =>
      route.fulfill({ status: 500, body: 'Error' })
    );
    await page.goto('/admin');
    await page.waitForFunction(() =>
      document.getElementById('widget-status')?.textContent !== '—'
    );

    await expect(page.locator('#widget-status')).toHaveClass(/text-gray-500/);
  });
});
