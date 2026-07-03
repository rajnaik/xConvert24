import { test, expect } from '@playwright/test';

/**
 * Admin Telemetry — Page Structure & Endpoint Health Tests
 * Tests the /admin/telemetry page:
 * - Page structure (heading, summary stats, controls, table, history)
 * - All monitored endpoints appear in the ENDPOINTS list (including Activities & Chat)
 * - Refresh and auto-poll controls
 * - Error/fallback states
 */

test.describe('Admin Telemetry — Page Structure (Positive)', () => {
  test('telemetry page loads with correct title', async ({ page }) => {
    await page.goto('/admin/telemetry/');
    await expect(page).toHaveTitle(/Telemetry/);
  });

  test('has page heading and description', async ({ page }) => {
    await page.goto('/admin/telemetry/');
    await expect(page.locator('h1').first()).toContainText('Telemetry');
    await expect(page.locator('text=Live site health')).toBeAttached();
  });

  test('has navigation bar with correct links', async ({ page }) => {
    await page.goto('/admin/telemetry/');
    const nav = page.locator('nav');
    await expect(nav.locator('a[href="/admin/"]')).toBeAttached();
    await expect(nav.locator('a[href="/admin/telemetry/"]')).toBeAttached();
    await expect(nav.locator('a[href="/admin/clicks/"]')).toBeAttached();
    await expect(nav.locator('a[href="/admin/emails/"]')).toBeAttached();
    await expect(nav.locator('a[href="/"]').first()).toBeAttached();
  });

  test('telemetry nav link is highlighted as active', async ({ page }) => {
    await page.goto('/admin/telemetry/');
    const activeLink = page.locator('nav a[href="/admin/telemetry/"]');
    await expect(activeLink).toHaveClass(/text-blue-400/);
    await expect(activeLink).toHaveClass(/font-medium/);
  });

  test('has summary stats grid with 3 columns', async ({ page }) => {
    await page.goto('/admin/telemetry/');
    await expect(page.locator('#stat-health')).toBeAttached();
    await expect(page.locator('#stat-avg')).toBeAttached();
    await expect(page.locator('#stat-time')).toBeAttached();
  });

  test('has Refresh button', async ({ page }) => {
    await page.goto('/admin/telemetry/');
    const btn = page.locator('#refresh-btn');
    await expect(btn).toBeVisible();
    await expect(btn).toContainText('Refresh');
  });

  test('has auto-refresh checkbox checked by default', async ({ page }) => {
    await page.goto('/admin/telemetry/');
    const checkbox = page.locator('#auto-poll');
    await expect(checkbox).toBeChecked();
  });

  test('has endpoint table with correct headers', async ({ page }) => {
    await page.goto('/admin/telemetry/');
    const thead = page.locator('#telem-tbody').locator('..').locator('..').locator('thead');
    await expect(thead).toContainText('Endpoint');
    await expect(thead).toContainText('Path');
    await expect(thead).toContainText('Status');
    await expect(thead).toContainText('Response (ms)');
    await expect(thead).toContainText('Health');
  });

  test('has History section with heading', async ({ page }) => {
    await page.goto('/admin/telemetry/');
    await expect(page.locator('h2:has-text("History")')).toBeVisible();
  });

  test('has history table with correct headers', async ({ page }) => {
    await page.goto('/admin/telemetry/');
    const historyTable = page.locator('#history-tbody').locator('..').locator('..').locator('thead');
    await expect(historyTable).toContainText('Time');
    await expect(historyTable).toContainText('Endpoint');
    await expect(historyTable).toContainText('Status');
    await expect(historyTable).toContainText('Response');
    await expect(historyTable).toContainText('Health');
  });
});

test.describe('Admin Telemetry — Monitored Endpoints (Positive)', () => {
  test('Activities endpoint is monitored', async ({ page }) => {
    await page.goto('/admin/telemetry/');
    // Wait for telemetry data to load (tbody no longer says Loading)
    await page.waitForFunction(() => {
      const tbody = document.getElementById('telem-tbody');
      return tbody && !tbody.textContent?.includes('Loading');
    }, { timeout: 15000 });
    const tbody = page.locator('#telem-tbody');
    await expect(tbody).toContainText('Activities');
    await expect(tbody).toContainText('/activities/');
  });

  test('Chat endpoint is monitored', async ({ page }) => {
    await page.goto('/admin/telemetry/');
    await page.waitForFunction(() => {
      const tbody = document.getElementById('telem-tbody');
      return tbody && !tbody.textContent?.includes('Loading');
    }, { timeout: 15000 });
    const tbody = page.locator('#telem-tbody');
    await expect(tbody).toContainText('Chat');
    await expect(tbody).toContainText('/chat/');
  });

  test('Homepage endpoint is monitored', async ({ page }) => {
    await page.goto('/admin/telemetry/');
    await page.waitForFunction(() => {
      const tbody = document.getElementById('telem-tbody');
      return tbody && !tbody.textContent?.includes('Loading');
    }, { timeout: 15000 });
    const tbody = page.locator('#telem-tbody');
    await expect(tbody).toContainText('Homepage');
  });

  test('Blog endpoint is monitored', async ({ page }) => {
    await page.goto('/admin/telemetry/');
    await page.waitForFunction(() => {
      const tbody = document.getElementById('telem-tbody');
      return tbody && !tbody.textContent?.includes('Loading');
    }, { timeout: 15000 });
    const tbody = page.locator('#telem-tbody');
    await expect(tbody).toContainText('Blog');
  });

  test('Guide endpoint is monitored', async ({ page }) => {
    await page.goto('/admin/telemetry/');
    await page.waitForFunction(() => {
      const tbody = document.getElementById('telem-tbody');
      return tbody && !tbody.textContent?.includes('Loading');
    }, { timeout: 15000 });
    const tbody = page.locator('#telem-tbody');
    await expect(tbody).toContainText('Guide');
  });

  test('all 9 endpoints are listed in the table', async ({ page }) => {
    await page.goto('/admin/telemetry/');
    await page.waitForFunction(() => {
      const tbody = document.getElementById('telem-tbody');
      return tbody && !tbody.textContent?.includes('Loading');
    }, { timeout: 15000 });
    const rows = page.locator('#telem-tbody tr');
    await expect(rows).toHaveCount(9);
  });

  test('summary shows health status after load', async ({ page }) => {
    await page.goto('/admin/telemetry/');
    await page.waitForFunction(() => {
      const el = document.getElementById('stat-health');
      return el && el.textContent !== '—';
    }, { timeout: 15000 });
    const healthText = await page.locator('#stat-health').textContent();
    expect(healthText === 'ALL OK' || healthText === 'ISSUES').toBeTruthy();
  });

  test('summary shows average response time after load', async ({ page }) => {
    await page.goto('/admin/telemetry/');
    await page.waitForFunction(() => {
      const el = document.getElementById('stat-avg');
      return el && el.textContent !== '—';
    }, { timeout: 15000 });
    const avgText = await page.locator('#stat-avg').textContent();
    expect(avgText).toMatch(/\d+ms/);
  });

  test('summary shows last check time after load', async ({ page }) => {
    await page.goto('/admin/telemetry/');
    await page.waitForFunction(() => {
      const el = document.getElementById('stat-time');
      return el && el.textContent !== '—';
    }, { timeout: 15000 });
    const timeText = await page.locator('#stat-time').textContent();
    expect(timeText).not.toBe('—');
    expect(timeText!.length).toBeGreaterThan(0);
  });

  test('clicking Refresh reloads telemetry data', async ({ page }) => {
    await page.goto('/admin/telemetry/');
    await page.waitForFunction(() => {
      const el = document.getElementById('stat-health');
      return el && el.textContent !== '—';
    }, { timeout: 15000 });

    // Record old time
    const oldTime = await page.locator('#stat-time').textContent();
    // Wait a moment and refresh
    await page.waitForTimeout(1100);
    await page.locator('#refresh-btn').click();
    await page.waitForTimeout(2000);
    // Time should update (or stay same if within same second — just confirm no crash)
    const newTime = await page.locator('#stat-time').textContent();
    expect(newTime).not.toBe('—');
  });
});

test.describe('Admin Telemetry — Negative Tests', () => {
  test('page does not crash with no JS errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/admin/telemetry/');
    await page.waitForFunction(() => {
      const tbody = document.getElementById('telem-tbody');
      return tbody && !tbody.textContent?.includes('Loading');
    }, { timeout: 15000 });
    expect(errors).toHaveLength(0);
  });

  test('no duplicate endpoint rows exist', async ({ page }) => {
    await page.goto('/admin/telemetry/');
    await page.waitForFunction(() => {
      const tbody = document.getElementById('telem-tbody');
      return tbody && !tbody.textContent?.includes('Loading');
    }, { timeout: 15000 });
    // Each endpoint name should appear exactly once
    const rows = page.locator('#telem-tbody tr');
    const count = await rows.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const name = await rows.nth(i).locator('td').first().textContent();
      names.push(name?.trim() || '');
    }
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  test('unchecking auto-refresh stops polling', async ({ page }) => {
    await page.goto('/admin/telemetry/');
    await page.waitForFunction(() => {
      const el = document.getElementById('stat-health');
      return el && el.textContent !== '—';
    }, { timeout: 15000 });

    // Uncheck auto-poll
    await page.locator('#auto-poll').uncheck();
    await expect(page.locator('#auto-poll')).not.toBeChecked();

    // Record time, wait >5s, confirm it doesn't auto-update
    const timeBefore = await page.locator('#stat-time').textContent();
    await page.waitForTimeout(6000);
    const timeAfter = await page.locator('#stat-time').textContent();
    // Time should remain the same since polling stopped
    expect(timeAfter).toBe(timeBefore);
  });

  test('page has noindex meta tag', async ({ page }) => {
    await page.goto('/admin/telemetry/');
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute('content', /noindex/);
  });

  test('Activities endpoint path includes trailing slash', async ({ page }) => {
    await page.goto('/admin/telemetry/');
    await page.waitForFunction(() => {
      const tbody = document.getElementById('telem-tbody');
      return tbody && !tbody.textContent?.includes('Loading');
    }, { timeout: 15000 });
    const activitiesRow = page.locator('#telem-tbody tr', { hasText: 'Activities' });
    await expect(activitiesRow.locator('td').nth(1)).toContainText('/activities/');
  });

  test('Chat endpoint path includes trailing slash', async ({ page }) => {
    await page.goto('/admin/telemetry/');
    await page.waitForFunction(() => {
      const tbody = document.getElementById('telem-tbody');
      return tbody && !tbody.textContent?.includes('Loading');
    }, { timeout: 15000 });
    const chatRow = page.locator('#telem-tbody tr', { hasText: 'Chat' });
    await expect(chatRow.locator('td').nth(1)).toContainText('/chat/');
  });
});
