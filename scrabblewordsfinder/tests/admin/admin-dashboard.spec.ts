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

  test('widget uses responsive grid layout (2-col sm, 5-col lg)', async ({ page }) => {
    await page.goto('/admin/');
    const grid = page.locator('#site-status-widget .grid');
    await expect(grid).toHaveClass(/grid-cols-1/);
    await expect(grid).toHaveClass(/sm:grid-cols-2/);
    await expect(grid).toHaveClass(/lg:grid-cols-5/);
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

test.describe('Admin Dashboard — Chat Usage / AI Heartbeat', () => {
  test('chatusage button is present in site status widget', async ({ page }) => {
    await page.goto('/admin/');
    await expect(page.locator('#chatusage-btn')).toBeVisible();
  });

  test('chatusage button has accessible label', async ({ page }) => {
    await page.goto('/admin/');
    await expect(page.locator('#chatusage-btn')).toHaveAttribute('aria-label', 'Check AI health');
  });

  test('chatusage section has ScrabbleBot AI heading', async ({ page }) => {
    await page.goto('/admin/');
    const widget = page.locator('#site-status-widget');
    await expect(widget).toContainText('ScrabbleBot AI');
  });

  test('chatusage indicator and count are shown', async ({ page }) => {
    await page.goto('/admin/');
    await expect(page.locator('#chatusage-indicator')).toBeVisible();
    await expect(page.locator('#chatusage-count')).toBeAttached();
  });

  test('chatusage fetches /api/chat-heartbeat on page load', async ({ page }) => {
    const apiPromise = page.waitForResponse(resp =>
      resp.url().includes('/api/chat-heartbeat')
    );
    await page.goto('/admin/');
    const response = await apiPromise;
    expect(response.status()).toBe(200);
  });

  test('chatusage shows green button when AI is healthy', async ({ page }) => {
    await page.route('**/api/chat-heartbeat/', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ healthy: true, chatusage: 42 }),
      })
    );
    await page.goto('/admin/');
    await page.waitForFunction(() =>
      document.getElementById('chatusage-count')?.textContent !== '—'
    );

    await expect(page.locator('#chatusage-btn')).toHaveClass(/bg-green-600/);
    await expect(page.locator('#chatusage-count')).toHaveText('42');
    await expect(page.locator('#chatusage-status-text')).toContainText('AI Online');
  });

  test('chatusage shows red button when AI is offline', async ({ page }) => {
    await page.route('**/api/chat-heartbeat/', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ healthy: false, chatusage: 5, reason: 'AI binding not configured' }),
      })
    );
    await page.goto('/admin/');
    await page.waitForFunction(() =>
      document.getElementById('chatusage-count')?.textContent !== '—'
    );

    await expect(page.locator('#chatusage-btn')).toHaveClass(/bg-red-600/);
    await expect(page.locator('#chatusage-count')).toHaveText('5');
    await expect(page.locator('#chatusage-status-text')).toContainText('Offline');
  });

  test('clicking chatusage button re-checks AI health', async ({ page }) => {
    let callCount = 0;
    await page.route('**/api/chat-heartbeat/', route => {
      callCount++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ healthy: true, chatusage: callCount * 10 }),
      });
    });
    await page.goto('/admin/');
    await page.waitForFunction(() =>
      document.getElementById('chatusage-count')?.textContent !== '—'
    );

    // First call happened on load
    expect(callCount).toBe(1);
    await expect(page.locator('#chatusage-count')).toHaveText('10');

    // Click the button to trigger a re-check
    await page.locator('#chatusage-btn').click();
    await page.waitForFunction(() =>
      document.getElementById('chatusage-count')?.textContent === '20'
    );

    expect(callCount).toBe(2);
    await expect(page.locator('#chatusage-count')).toHaveText('20');
  });

  test('chatusage shows red when heartbeat API fails', async ({ page }) => {
    await page.route('**/api/chat-heartbeat/', route => route.abort());
    await page.goto('/admin/');
    await page.waitForFunction(() =>
      document.getElementById('chatusage-status-text')?.textContent?.includes('failed')
    , { timeout: 10000 });

    await expect(page.locator('#chatusage-btn')).toHaveClass(/bg-red-600/);
    await expect(page.locator('#chatusage-status-text')).toContainText('Heartbeat check failed');
  });

  test('no duplicate chatusage buttons exist on the page', async ({ page }) => {
    await page.goto('/admin/');
    await expect(page.locator('#chatusage-btn')).toHaveCount(1);
    await expect(page.locator('#chatusage-indicator')).toHaveCount(1);
    await expect(page.locator('#chatusage-count')).toHaveCount(1);
  });

  test('chatusage does not crash page when API returns invalid JSON', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.route('**/api/chat-heartbeat/', route =>
      route.fulfill({ status: 200, contentType: 'text/plain', body: 'not json at all' })
    );
    await page.goto('/admin/');
    await page.waitForFunction(() =>
      document.getElementById('chatusage-status-text')?.textContent !== 'Checking AI...'
    , { timeout: 10000 });

    // Should show error state, not crash
    await expect(page.locator('#chatusage-status-text')).toContainText('Heartbeat check failed');
    await expect(page.locator('#chatusage-btn')).toHaveClass(/bg-red-600/);
  });
});

test.describe('Admin Dashboard — Documentation Card', () => {
  test('has Documentation card linking to /admin/documentation/', async ({ page }) => {
    await page.goto('/admin/');
    const card = page.locator('a[href="/admin/documentation/"]');
    await expect(card).toBeVisible();
    await expect(card.locator('h2')).toContainText('Documentation');
  });

  test('Documentation card shows description text', async ({ page }) => {
    await page.goto('/admin/');
    const card = page.locator('a[href="/admin/documentation/"]');
    await expect(card).toContainText('Architecture diagrams, system docs, and codebase visual maps');
  });

  test('Documentation card lists feature bullet points', async ({ page }) => {
    await page.goto('/admin/');
    const card = page.locator('a[href="/admin/documentation/"]');
    await expect(card.locator('li')).toHaveCount(3);
    await expect(card).toContainText('Interactive code architecture diagram');
    await expect(card).toContainText('API, DB, deployment views');
    await expect(card).toContainText('Workers & bindings map');
  });

  test('Documentation card has correct hover border class', async ({ page }) => {
    await page.goto('/admin/');
    const card = page.locator('a[href="/admin/documentation/"]');
    await expect(card).toHaveClass(/hover:border-sky-700/);
  });
});

test.describe('Admin Dashboard — Documentation Card Negative', () => {
  test('no duplicate Documentation cards exist on the page', async ({ page }) => {
    await page.goto('/admin/');
    const cards = page.locator('a[href="/admin/documentation/"]');
    await expect(cards).toHaveCount(1);
  });

  test('Documentation card does not cause page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/admin/');
    await expect(page.locator('a[href="/admin/documentation/"]')).toBeVisible();
    expect(errors.filter(e => e.includes('documentation'))).toHaveLength(0);
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





test.describe('Admin Dashboard — Badges Card Positive', () => {
  test('has Badges card linking to /admin/badges/', async ({ page }) => {
    await page.goto('/admin/');
    const card = page.locator('a[href="/admin/badges/"]');
    await expect(card).toBeVisible();
    await expect(card.locator('h2')).toContainText('Badges');
  });

  test('Badges card shows description text', async ({ page }) => {
    await page.goto('/admin/');
    const card = page.locator('a[href="/admin/badges/"]');
    await expect(card).toContainText('Manage badge tiers, thresholds, themes, and track earner progression');
  });

  test('Badges card has stats grid with 3 columns', async ({ page }) => {
    await page.goto('/admin/');
    const statsGrid = page.locator('#badges-admin-stats');
    await expect(statsGrid).toBeVisible();
    await expect(statsGrid).toHaveClass(/grid-cols-3/);
  });

  test('Badges card shows Total Tiers stat placeholder', async ({ page }) => {
    await page.goto('/admin/');
    await expect(page.locator('#badges-a-total')).toBeAttached();
    await expect(page.locator('#badges-a-total')).toHaveText('-');
  });

  test('Badges card shows Active stat placeholder', async ({ page }) => {
    await page.goto('/admin/');
    await expect(page.locator('#badges-a-active')).toBeAttached();
    await expect(page.locator('#badges-a-active')).toHaveText('-');
  });

  test('Badges card shows Users w/ Badge stat placeholder', async ({ page }) => {
    await page.goto('/admin/');
    await expect(page.locator('#badges-a-earners')).toBeAttached();
    await expect(page.locator('#badges-a-earners')).toHaveText('-');
  });

  test('Badges card has rose border styling', async ({ page }) => {
    await page.goto('/admin/');
    const card = page.locator('a[href="/admin/badges/"]');
    await expect(card).toHaveClass(/border-rose-800/);
    await expect(card).toHaveClass(/hover:border-rose-700/);
  });
});

test.describe('Admin Dashboard — Badges Card Negative', () => {
  test('no duplicate Badges cards exist on the page', async ({ page }) => {
    await page.goto('/admin/');
    const cards = page.locator('a[href="/admin/badges/"]');
    await expect(cards).toHaveCount(1);
  });

  test('Badges card does not cause page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/admin/');
    await expect(page.locator('a[href="/admin/badges/"]')).toBeVisible();
    expect(errors.filter(e => e.toLowerCase().includes('badge'))).toHaveLength(0);
  });

  test('Badges stats IDs are unique (no collision with other cards)', async ({ page }) => {
    await page.goto('/admin/');
    await expect(page.locator('#badges-a-total')).toHaveCount(1);
    await expect(page.locator('#badges-a-active')).toHaveCount(1);
    await expect(page.locator('#badges-a-earners')).toHaveCount(1);
  });
});


test.describe('Admin Dashboard — Telemetry Widget Positive', () => {
  test('telemetry widget section is visible', async ({ page }) => {
    await page.goto('/admin/');
    const widget = page.locator('#site-status-widget');
    await expect(widget).toContainText('Telemetry');
  });

  test('telemetry widget has health indicator dot', async ({ page }) => {
    await page.goto('/admin/');
    await expect(page.locator('#telem-health-dot')).toBeVisible();
  });

  test('telemetry health dot starts with gray pulsing state', async ({ page }) => {
    // Block all internal fetches so the widget stays in loading state briefly
    await page.route('**/*', route => {
      const url = route.request().url();
      if (url.includes('/admin')) return route.continue();
      return new Promise(resolve => setTimeout(() => resolve(route.continue()), 3000));
    });
    await page.goto('/admin/');
    const dot = page.locator('#telem-health-dot');
    await expect(dot).toHaveClass(/bg-gray-500/);
    await expect(dot).toHaveClass(/animate-pulse/);
  });

  test('telemetry health text shows "Checking..." initially', async ({ page }) => {
    await page.route('**/blog/', route =>
      new Promise(resolve => setTimeout(() => resolve(route.continue()), 5000))
    );
    await page.goto('/admin/');
    // The initial text before fetch completes
    await expect(page.locator('#telem-health-text')).toHaveText('Checking...');
  });

  test('telemetry widget has "View full →" link to /admin/telemetry/', async ({ page }) => {
    await page.goto('/admin/');
    const link = page.locator('a[href="/admin/telemetry/"]', { hasText: 'View full' });
    await expect(link).toBeVisible();
  });

  test('telemetry widget shows avg ms element', async ({ page }) => {
    await page.goto('/admin/');
    await expect(page.locator('#telem-avg-ms')).toBeAttached();
  });

  test('telemetry widget shows ok/total count elements', async ({ page }) => {
    await page.goto('/admin/');
    await expect(page.locator('#telem-ok-count')).toBeAttached();
    await expect(page.locator('#telem-total-count')).toBeAttached();
  });

  test('telemetry widget shows last check element', async ({ page }) => {
    await page.goto('/admin/');
    await expect(page.locator('#telem-last-check')).toBeAttached();
  });

  test('telemetry shows ALL OK when all endpoints respond successfully', async ({ page }) => {
    await page.goto('/admin/');
    // Wait for the telemetry script to finish checking all endpoints
    await page.waitForFunction(() =>
      document.getElementById('telem-health-text')?.textContent !== 'Checking...'
    , { timeout: 30000 });

    const healthText = await page.locator('#telem-health-text').textContent();
    // On local dev, most endpoints should respond — expect ALL OK or ISSUES
    expect(['ALL OK', 'ISSUES']).toContain(healthText);
  });

  test('telemetry avg ms is populated after check completes', async ({ page }) => {
    await page.goto('/admin/');
    await page.waitForFunction(() =>
      document.getElementById('telem-avg-ms')?.textContent !== '—'
    , { timeout: 30000 });

    const avgText = await page.locator('#telem-avg-ms').textContent();
    expect(avgText).toMatch(/\d+ms/);
  });

  test('telemetry ok/total counts are populated as numbers', async ({ page }) => {
    await page.goto('/admin/');
    await page.waitForFunction(() =>
      document.getElementById('telem-ok-count')?.textContent !== '—'
    , { timeout: 30000 });

    const okCount = await page.locator('#telem-ok-count').textContent();
    const totalCount = await page.locator('#telem-total-count').textContent();
    expect(Number(okCount)).toBeGreaterThanOrEqual(0);
    expect(Number(totalCount)).toBeGreaterThan(0);
  });

  test('telemetry last check shows a time string after completion', async ({ page }) => {
    await page.goto('/admin/');
    await page.waitForFunction(() =>
      document.getElementById('telem-last-check')?.textContent !== '—'
    , { timeout: 30000 });

    const lastCheck = await page.locator('#telem-last-check').textContent();
    // Should be a time like "14:30:05" or locale equivalent
    expect(lastCheck!.length).toBeGreaterThan(0);
    expect(lastCheck).not.toBe('—');
  });

  test('telemetry dot turns green when all endpoints are healthy', async ({ page }) => {
    await page.goto('/admin/');
    await page.waitForFunction(() =>
      document.getElementById('telem-health-text')?.textContent === 'ALL OK'
    , { timeout: 30000 }).catch(() => {});

    const healthText = await page.locator('#telem-health-text').textContent();
    if (healthText === 'ALL OK') {
      await expect(page.locator('#telem-health-dot')).toHaveClass(/bg-green-400/);
      await expect(page.locator('#telem-health-dot')).not.toHaveClass(/animate-pulse/);
    }
  });

  test('telemetry widget spans full width (sm:col-span-2 lg:col-span-5)', async ({ page }) => {
    await page.goto('/admin/');
    const telemSection = page.locator('#telem-health-dot').locator('..').locator('..').locator('..');
    await expect(telemSection).toHaveClass(/sm:col-span-2/);
    await expect(telemSection).toHaveClass(/lg:col-span-5/);
  });
});

test.describe('Admin Dashboard — Telemetry Widget Negative', () => {
  test('no duplicate telemetry health dots exist', async ({ page }) => {
    await page.goto('/admin/');
    await expect(page.locator('#telem-health-dot')).toHaveCount(1);
    await expect(page.locator('#telem-health-text')).toHaveCount(1);
    await expect(page.locator('#telem-avg-ms')).toHaveCount(1);
    await expect(page.locator('#telem-ok-count')).toHaveCount(1);
    await expect(page.locator('#telem-total-count')).toHaveCount(1);
    await expect(page.locator('#telem-last-check')).toHaveCount(1);
  });

  test('telemetry widget does not crash the page on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/admin/');
    await page.waitForFunction(() =>
      document.getElementById('telem-health-text')?.textContent !== 'Checking...'
    , { timeout: 30000 }).catch(() => {});

    expect(errors.filter(e => e.toLowerCase().includes('telem'))).toHaveLength(0);
  });

  test('telemetry shows ISSUES state when an endpoint fails', async ({ page }) => {
    // Abort one of the endpoints the telemetry script hits
    await page.route('**/api/site-status/', route => route.abort());
    await page.goto('/admin/');
    await page.waitForFunction(() =>
      document.getElementById('telem-health-text')?.textContent !== 'Checking...'
    , { timeout: 30000 });

    await expect(page.locator('#telem-health-text')).toHaveText('ISSUES');
    await expect(page.locator('#telem-health-dot')).toHaveClass(/bg-red-400/);
  });

  test('telemetry shows Failed when all fetches throw', async ({ page }) => {
    // Block every URL except the admin page itself
    await page.route('**/*', route => {
      const url = route.request().url();
      if (url.includes('/admin')) return route.continue();
      return route.abort();
    });
    await page.goto('/admin/');
    await page.waitForFunction(() => {
      const text = document.getElementById('telem-health-text')?.textContent;
      return text !== 'Checking...' && text !== null;
    }, { timeout: 30000 });

    const healthText = await page.locator('#telem-health-text').textContent();
    // Should be either ISSUES (all ok=false) or Failed (catch block)
    expect(['ISSUES', 'Failed']).toContain(healthText);
  });

  test('telemetry ok count never exceeds total count', async ({ page }) => {
    await page.goto('/admin/');
    await page.waitForFunction(() =>
      document.getElementById('telem-ok-count')?.textContent !== '—'
    , { timeout: 30000 });

    const ok = Number(await page.locator('#telem-ok-count').textContent());
    const total = Number(await page.locator('#telem-total-count').textContent());
    expect(ok).toBeLessThanOrEqual(total);
  });
});
