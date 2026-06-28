import { test, expect } from '@playwright/test';

/**
 * Admin Chat Usage — Tests for /admin/content/chatusage/ page
 * and the Chat Usage tile on /admin/content/
 *
 * Positive: page loads, structure correct, API integration, tile present
 * Negative: handles API failure, no duplicates, no crash on empty data
 */

test.describe('Admin Content — Chat Usage Tile — Positive', () => {
  test('chat usage tile is present on content page', async ({ page }) => {
    await page.goto('/admin/content/');
    const tile = page.locator('a[href="/admin/content/chatusage/"]');
    await expect(tile).toBeVisible();
  });

  test('chat usage tile has correct heading', async ({ page }) => {
    await page.goto('/admin/content/');
    const tile = page.locator('a[href="/admin/content/chatusage/"]');
    await expect(tile.locator('h2')).toContainText('Chat Usage');
  });

  test('chat usage tile shows stats placeholders', async ({ page }) => {
    await page.goto('/admin/content/');
    await expect(page.locator('#chatusage-total')).toBeAttached();
    await expect(page.locator('#chatusage-failed')).toBeAttached();
    await expect(page.locator('#chatusage-avg-ms')).toBeAttached();
  });

  test('chat usage tile fetches stats from API', async ({ page }) => {
    await page.route('**/api/chatusage/?stats=true', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ stats: { total: 150, successful: 140, failed: 10, avg_response_ms: 320, last_chat: '2026-06-28 10:30:00' } }),
      })
    );
    await page.goto('/admin/content/');
    await page.waitForFunction(() =>
      document.getElementById('chatusage-total')?.textContent !== '—'
    );
    await expect(page.locator('#chatusage-total')).toHaveText('150');
    await expect(page.locator('#chatusage-failed')).toHaveText('10');
    await expect(page.locator('#chatusage-avg-ms')).toHaveText('320');
  });
});

test.describe('Admin Content — Chat Usage Tile — Negative', () => {
  test('no duplicate chat usage tiles', async ({ page }) => {
    await page.goto('/admin/content/');
    const tiles = page.locator('a[href="/admin/content/chatusage/"]');
    await expect(tiles).toHaveCount(1);
  });

  test('tile shows placeholders when API fails', async ({ page }) => {
    await page.route('**/api/chatusage/?stats=true', route => route.abort());
    await page.goto('/admin/content/');
    // Should still show dash placeholders, not crash
    await expect(page.locator('#chatusage-total')).toHaveText('—');
  });
});

test.describe('Admin Chat Usage Page — Positive', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto('/admin/content/chatusage/');
    await expect(page).toHaveTitle(/Chat Usage/);
  });

  test('page has heading and description', async ({ page }) => {
    await page.goto('/admin/content/chatusage/');
    await expect(page.locator('h1')).toContainText('Chat Usage');
    await expect(page.locator('text=ScrabbleBot AI chat interactions')).toBeAttached();
  });

  test('page has navigation with correct links', async ({ page }) => {
    await page.goto('/admin/content/chatusage/');
    const nav = page.locator('nav');
    await expect(nav.locator('a[href="/admin/"]')).toBeAttached();
    await expect(nav.locator('a[href="/admin/content/"]')).toBeAttached();
    await expect(nav.locator('a[href="/admin/content/chatusage/"]')).toBeAttached();
  });

  test('page has stats summary bar with 4 cards', async ({ page }) => {
    await page.goto('/admin/content/chatusage/');
    const statsBar = page.locator('#stats-bar');
    await expect(statsBar).toBeVisible();
    await expect(page.locator('#stat-total')).toBeAttached();
    await expect(page.locator('#stat-success')).toBeAttached();
    await expect(page.locator('#stat-failed')).toBeAttached();
    await expect(page.locator('#stat-avg-ms')).toBeAttached();
  });

  test('page has chatusage table with correct headers', async ({ page }) => {
    await page.goto('/admin/content/chatusage/');
    const table = page.locator('#chatusage-table');
    await expect(table).toBeVisible();
    const headers = table.locator('thead th');
    await expect(headers.nth(0)).toContainText('ID');
    await expect(headers.nth(1)).toContainText('User Message');
    await expect(headers.nth(2)).toContainText('Bot Response');
    await expect(headers.nth(3)).toContainText('Response (ms)');
    await expect(headers.nth(4)).toContainText('Status');
    await expect(headers.nth(5)).toContainText('IP');
    await expect(headers.nth(6)).toContainText('Date');
  });

  test('page has pagination controls', async ({ page }) => {
    await page.goto('/admin/content/chatusage/');
    await expect(page.locator('#prev-btn')).toBeVisible();
    await expect(page.locator('#next-btn')).toBeVisible();
    await expect(page.locator('#pagination-info')).toBeVisible();
  });

  test('page renders rows from API data', async ({ page }) => {
    await page.route('**/api/chatusage/?limit=50&offset=0', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          chats: [
            { id: 1, user_id: 'u1', user_message: 'What are the best 2 letter words?', bot_response: 'QI, ZA, and XI are great!', model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', tokens_used: 50, response_ms: 280, ip_address: '1.2.3.4', session_id: 's1', success: 1, error_message: '', created_at: '2026-06-28 10:00:00' },
            { id: 2, user_id: 'u2', user_message: 'Triple word strategy', bot_response: '', model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', tokens_used: 0, response_ms: 50, ip_address: '5.6.7.8', session_id: 's2', success: 0, error_message: 'AI timeout', created_at: '2026-06-28 09:30:00' },
          ],
          total: 2,
        }),
      })
    );
    await page.route('**/api/chatusage/?stats=true', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ stats: { total: 2, successful: 1, failed: 1, avg_response_ms: 165, last_chat: '2026-06-28 10:00:00' } }),
      })
    );
    await page.goto('/admin/content/chatusage/');
    await page.waitForFunction(() =>
      document.getElementById('chatusage-tbody')?.children.length === 2
    );

    const rows = page.locator('#chatusage-tbody tr');
    await expect(rows).toHaveCount(2);
    // First row shows success
    await expect(rows.nth(0)).toContainText('OK');
    await expect(rows.nth(0)).toContainText('280ms');
    // Second row shows failure
    await expect(rows.nth(1)).toContainText('Fail');
  });

  test('stats summary populates from API', async ({ page }) => {
    await page.route('**/api/chatusage/?stats=true', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ stats: { total: 99, successful: 90, failed: 9, avg_response_ms: 450, last_chat: '2026-06-28 12:00:00' } }),
      })
    );
    await page.goto('/admin/content/chatusage/');
    await page.waitForFunction(() =>
      document.getElementById('stat-total')?.textContent !== '—'
    );
    await expect(page.locator('#stat-total')).toHaveText('99');
    await expect(page.locator('#stat-success')).toHaveText('90');
    await expect(page.locator('#stat-failed')).toHaveText('9');
    await expect(page.locator('#stat-avg-ms')).toHaveText('450ms');
  });
});

test.describe('Admin Chat Usage Page — Negative', () => {
  test('shows empty state when no data', async ({ page }) => {
    await page.route('**/api/chatusage/?limit=50&offset=0', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ chats: [], total: 0 }),
      })
    );
    await page.goto('/admin/content/chatusage/');
    await page.waitForFunction(() =>
      document.getElementById('chatusage-tbody')?.textContent?.includes('No chat interactions')
    );
    await expect(page.locator('#chatusage-tbody')).toContainText('No chat interactions yet');
  });

  test('shows error state when API fails', async ({ page }) => {
    await page.route('**/api/chatusage/?limit=50&offset=0', route =>
      route.fulfill({ status: 500, body: 'Internal error' })
    );
    await page.goto('/admin/content/chatusage/');
    await page.waitForFunction(() =>
      document.getElementById('chatusage-tbody')?.textContent?.includes('Failed')
    );
    await expect(page.locator('#chatusage-tbody')).toContainText('Failed to load data');
  });

  test('pagination prev button is disabled on first page', async ({ page }) => {
    await page.goto('/admin/content/chatusage/');
    await expect(page.locator('#prev-btn')).toBeDisabled();
  });

  test('page does not crash when API returns network error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.route('**/api/chatusage/**', route => route.abort());
    await page.goto('/admin/content/chatusage/');
    await page.waitForTimeout(1000);
    // No unhandled page errors
    expect(errors.filter(e => e.includes('chatusage'))).toHaveLength(0);
  });

  test('has noindex meta tag', async ({ page }) => {
    await page.goto('/admin/content/chatusage/');
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute('content', /noindex/);
  });
});
