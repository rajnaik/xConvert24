import { test, expect } from '@playwright/test';

/**
 * Admin Live Sessions Page — UI Tests
 * Tests the /admin/live-sessions/ page:
 * - Page structure (title, nav, stats, controls, table)
 * - API integration (fetches /api/heartbeat/)
 * - Auto-refresh and time window controls
 * - Page breakdown rendering
 * - Error and empty states
 */

test.describe('Admin Live Sessions — Positive (Page Structure)', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto('/admin/live-sessions/');
    await expect(page).toHaveTitle(/Live Sessions.*Admin/);
  });

  test('has page heading and description', async ({ page }) => {
    await page.goto('/admin/live-sessions/');
    await expect(page.locator('h1').first()).toContainText('Live Sessions');
    await expect(page.locator('text=Users currently active on the site')).toBeAttached();
  });

  test('has navigation bar with Live link highlighted', async ({ page }) => {
    await page.goto('/admin/live-sessions/');
    const nav = page.locator('nav');
    const liveLink = nav.locator('a[href="/admin/live-sessions/"]');
    await expect(liveLink).toBeVisible();
    await expect(liveLink).toHaveClass(/text-blue-400/);
    await expect(liveLink).toHaveClass(/font-medium/);
  });

  test('stats row has three stat cards', async ({ page }) => {
    await page.goto('/admin/live-sessions/');
    await expect(page.locator('#stat-active')).toBeVisible();
    await expect(page.locator('#stat-pages')).toBeVisible();
    await expect(page.locator('#stat-updated')).toBeVisible();
  });

  test('controls are visible (refresh, auto-refresh checkbox, time window)', async ({ page }) => {
    await page.goto('/admin/live-sessions/');
    await expect(page.locator('#refresh-btn')).toBeVisible();
    await expect(page.locator('#auto-refresh')).toBeVisible();
    await expect(page.locator('#time-window')).toBeVisible();
  });

  test('time window select has correct options', async ({ page }) => {
    await page.goto('/admin/live-sessions/');
    const select = page.locator('#time-window');
    await expect(select.locator('option[value="2"]')).toBeAttached();
    await expect(select.locator('option[value="5"]')).toBeAttached();
    await expect(select.locator('option[value="10"]')).toBeAttached();
    await expect(select.locator('option[value="30"]')).toBeAttached();
  });

  test('table has correct column headers', async ({ page }) => {
    await page.goto('/admin/live-sessions/');
    const headers = page.locator('thead th');
    await expect(headers.nth(0)).toContainText('User ID');
    await expect(headers.nth(1)).toContainText('Page');
    await expect(headers.nth(2)).toContainText('IP Address');
    await expect(headers.nth(3)).toContainText('Last Seen');
  });

  test('auto-refresh checkbox is checked by default', async ({ page }) => {
    await page.goto('/admin/live-sessions/');
    await expect(page.locator('#auto-refresh')).toBeChecked();
  });
});

test.describe('Admin Live Sessions — Positive (API Integration)', () => {
  test('fetches /api/heartbeat/ on page load', async ({ page }) => {
    const apiPromise = page.waitForRequest(req =>
      req.url().includes('/api/heartbeat/')
    );
    await page.goto('/admin/live-sessions/');
    const request = await apiPromise;
    expect(request.url()).toContain('/api/heartbeat/');
  });

  test('renders session data when API returns results', async ({ page }) => {
    await page.route('**/api/heartbeat/*', route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessions: [
            { uid: 'u_abc123', page: '/', ip_address: '1.2.3.4', user_agent: 'Chrome', last_seen: new Date().toISOString().replace('T', ' ').slice(0, 19) },
            { uid: 'u_def456', page: '/about/', ip_address: '5.6.7.8', user_agent: 'Firefox', last_seen: new Date().toISOString().replace('T', ' ').slice(0, 19) },
            { uid: 'u_ghi789', page: '/', ip_address: '9.10.11.12', user_agent: 'Safari', last_seen: new Date().toISOString().replace('T', ' ').slice(0, 19) },
          ],
          count: 3,
        }),
      });
    });

    await page.goto('/admin/live-sessions/');
    await page.waitForSelector('#stat-active:not(:has-text("—"))');

    await expect(page.locator('#stat-active')).toHaveText('3');
    await expect(page.locator('#stat-pages')).toHaveText('2');
    await expect(page.locator('#sessions-tbody tr')).toHaveCount(3);
  });

  test('page breakdown section shows when sessions exist', async ({ page }) => {
    await page.route('**/api/heartbeat/*', route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessions: [
            { uid: 'u_1', page: '/', ip_address: '', user_agent: '', last_seen: new Date().toISOString().replace('T', ' ').slice(0, 19) },
            { uid: 'u_2', page: '/', ip_address: '', user_agent: '', last_seen: new Date().toISOString().replace('T', ' ').slice(0, 19) },
            { uid: 'u_3', page: '/blog/', ip_address: '', user_agent: '', last_seen: new Date().toISOString().replace('T', ' ').slice(0, 19) },
          ],
          count: 3,
        }),
      });
    });

    await page.goto('/admin/live-sessions/');
    await page.waitForSelector('#stat-active:not(:has-text("—"))');

    const breakdown = page.locator('#page-breakdown');
    await expect(breakdown).toBeVisible();
    await expect(breakdown).toContainText('/');
    await expect(breakdown).toContainText('/blog/');
  });

  test('time window change triggers new API call with minutes param', async ({ page }) => {
    await page.route('**/api/heartbeat/*', route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sessions: [], count: 0 }),
      });
    });

    await page.goto('/admin/live-sessions/');
    await page.waitForTimeout(500);

    const [req] = await Promise.all([
      page.waitForRequest(req => req.url().includes('minutes=5')),
      page.selectOption('#time-window', '5'),
    ]);

    expect(req.url()).toContain('minutes=5');
  });

  test('refresh button triggers API call', async ({ page }) => {
    let callCount = 0;
    await page.route('**/api/heartbeat/*', route => {
      callCount++;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sessions: [], count: 0 }),
      });
    });

    await page.goto('/admin/live-sessions/');
    await page.waitForTimeout(500);
    const initial = callCount;

    await page.click('#refresh-btn');
    await page.waitForTimeout(500);

    expect(callCount).toBeGreaterThan(initial);
  });
});

test.describe('Admin Live Sessions — Negative (Error & Edge Cases)', () => {
  test('shows empty state when no active sessions', async ({ page }) => {
    await page.route('**/api/heartbeat/*', route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sessions: [], count: 0 }),
      });
    });

    await page.goto('/admin/live-sessions/');
    await page.waitForSelector('#sessions-tbody:has-text("No active sessions")');

    await expect(page.locator('#sessions-tbody')).toContainText('No active sessions right now');
    await expect(page.locator('#stat-active')).toHaveText('0');
  });

  test('shows error message when API returns 500', async ({ page }) => {
    await page.route('**/api/heartbeat/*', route => {
      return route.fulfill({ status: 500, body: 'Server Error' });
    });

    await page.goto('/admin/live-sessions/');
    await page.waitForSelector('#sessions-tbody:has-text("Failed")');

    await expect(page.locator('#sessions-tbody')).toContainText('Failed to load sessions');
  });

  test('page breakdown is hidden when no sessions exist', async ({ page }) => {
    await page.route('**/api/heartbeat/*', route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sessions: [], count: 0 }),
      });
    });

    await page.goto('/admin/live-sessions/');
    await page.waitForSelector('#stat-active:not(:has-text("—"))');

    await expect(page.locator('#page-breakdown')).toBeHidden();
  });

  test('no page crash (no uncaught exceptions) on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('**/api/heartbeat/*', route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sessions: [], count: 0 }),
      });
    });

    await page.goto('/admin/live-sessions/');
    await page.waitForTimeout(2000);

    expect(errors).toHaveLength(0);
  });

  test('unchecking auto-refresh stops polling', async ({ page }) => {
    let callCount = 0;
    await page.route('**/api/heartbeat/*', route => {
      callCount++;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sessions: [], count: 0 }),
      });
    });

    await page.goto('/admin/live-sessions/');
    await page.waitForTimeout(1000);
    const afterLoad = callCount;

    // Uncheck auto-refresh
    await page.uncheck('#auto-refresh');
    await page.waitForTimeout(12000); // Wait longer than the 10s interval

    // Should not have made significantly more calls
    expect(callCount).toBeLessThanOrEqual(afterLoad + 1);
  });
});
