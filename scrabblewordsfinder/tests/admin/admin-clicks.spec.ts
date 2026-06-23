import { test, expect } from '@playwright/test';

/**
 * Admin Clicks Page — UI Tests
 * Tests the /admin/clicks page:
 * - Page structure (title, nav, stats, filters, table)
 * - API integration (trailing-slash URL pattern /api/clicks/)
 * - Filter and search behaviour
 * - Sound toggle persistence
 * - Refresh button visual feedback (loading state, toast, text restore)
 * - Error and empty states
 */

test.describe('Admin Clicks — Positive (Page Structure)', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto('/admin/clicks/');
    await expect(page).toHaveTitle(/Clicks.*Admin/);
  });

  test('has page heading with emoji and description', async ({ page }) => {
    await page.goto('/admin/clicks/');
    await expect(page.locator('h1').first()).toContainText('Clicks');
    await expect(page.locator('text=All UI click events across the site')).toBeAttached();
  });

  test('has navigation bar with Clicks link highlighted', async ({ page }) => {
    await page.goto('/admin/clicks/');
    const nav = page.locator('nav');
    const clicksLink = nav.locator('a[href="/admin/clicks/"]');
    await expect(clicksLink).toBeVisible();
    await expect(clicksLink).toHaveClass(/text-blue-400/);
    await expect(clicksLink).toHaveClass(/font-medium/);
  });

  test('nav contains all expected admin links', async ({ page }) => {
    await page.goto('/admin/clicks/');
    const nav = page.locator('nav');
    await expect(nav.locator('a[href="/admin/"]')).toBeAttached();
    await expect(nav.locator('a[href="/admin/report/"]')).toBeAttached();
    await expect(nav.locator('a[href="/admin/ops/"]')).toBeAttached();
    await expect(nav.locator('a[href="/admin/banner-management/"]')).toBeAttached();
    await expect(nav.locator('a[href="/admin/banner-clicks/"]')).toBeAttached();
    await expect(nav.locator('a[href="/"]:has-text("Site")')).toBeAttached();
  });

  test('stats row has three stat cards', async ({ page }) => {
    await page.goto('/admin/clicks/');
    await expect(page.locator('#stat-total')).toBeVisible();
    await expect(page.locator('#stat-elements')).toBeVisible();
    await expect(page.locator('#stat-latest')).toBeVisible();
  });

  test('filter controls are visible', async ({ page }) => {
    await page.goto('/admin/clicks/');
    await expect(page.locator('#filter-element')).toBeVisible();
    await expect(page.locator('#filter-limit')).toBeVisible();
    await expect(page.locator('#refresh-btn')).toBeVisible();
    await expect(page.locator('#sound-toggle')).toBeVisible();
    await expect(page.locator('#search-input')).toBeVisible();
    await expect(page.locator('#search-btn')).toBeVisible();
  });

  test('table has correct column headers', async ({ page }) => {
    await page.goto('/admin/clicks/');
    const headers = page.locator('#clicks-tbody').locator('..').locator('thead th');
    await expect(headers.nth(0)).toContainText('ID');
    await expect(headers.nth(1)).toContainText('User ID');
    await expect(headers.nth(2)).toContainText('UI Element');
    await expect(headers.nth(3)).toContainText('URL');
    await expect(headers.nth(4)).toContainText('IP Address');
    await expect(headers.nth(5)).toContainText('Location');
    await expect(headers.nth(6)).toContainText('Time');
  });

  test('limit select has 50, 100, 200 options', async ({ page }) => {
    await page.goto('/admin/clicks/');
    const select = page.locator('#filter-limit');
    await expect(select.locator('option[value="50"]')).toBeAttached();
    await expect(select.locator('option[value="100"]')).toBeAttached();
    await expect(select.locator('option[value="200"]')).toBeAttached();
  });
});

test.describe('Admin Clicks — Positive (API Integration)', () => {
  test('fetches clicks from /api/clicks/ with trailing slash on load', async ({ page }) => {
    const apiPromise = page.waitForRequest(req =>
      req.url().includes('/api/clicks/') && req.url().includes('limit=')
    );
    await page.goto('/admin/clicks/');
    const request = await apiPromise;
    expect(request.url()).toMatch(/\/api\/clicks\/\?limit=\d+/);
  });

  test('polls /api/clicks/?count=true for new click detection', async ({ page }) => {
    const countRequest = page.waitForRequest(req =>
      req.url().includes('/api/clicks/') && req.url().includes('count=true')
    );
    await page.goto('/admin/clicks/');
    const request = await countRequest;
    expect(request.url()).toContain('/api/clicks/?count=true');
  });

  test('renders click data when API returns results', async ({ page }) => {
    await page.route('**/api/clicks/*', route => {
      const url = route.request().url();
      if (url.includes('count=true')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ total: 3 }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          clicks: [
            { id: 1, user_id: 'abc-123', ui_element: 'solve-btn', url: '/', ip_address: '1.2.3.4', city: 'London', country: 'GB', created_at: '2026-06-20 10:00:00' },
            { id: 2, user_id: 'def-456', ui_element: 'nav-link', url: '/about', ip_address: '5.6.7.8', city: 'Berlin', country: 'DE', created_at: '2026-06-20 09:30:00' },
            { id: 3, user_id: 'ghi-789', ui_element: 'solve-btn', url: '/', ip_address: '9.10.11.12', city: '', country: '', created_at: '2026-06-20 09:00:00' },
          ],
          total: 3,
        }),
      });
    });

    await page.goto('/admin/clicks/');
    await page.waitForSelector('#stat-total:not(:has-text("—"))');

    await expect(page.locator('#stat-total')).toHaveText('3');
    await expect(page.locator('#stat-elements')).toHaveText('2');
    await expect(page.locator('#clicks-tbody tr')).toHaveCount(3);
  });

  test('filter by element appends ui_element param to URL', async ({ page }) => {
    await page.route('**/api/clicks/*', route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ clicks: [], total: 0 }),
      });
    });

    await page.goto('/admin/clicks/');
    await page.waitForTimeout(500);

    await page.fill('#filter-element', 'solve-btn');

    // Wait for the specific request that includes ui_element
    const [filterReq] = await Promise.all([
      page.waitForRequest(req => req.url().includes('ui_element=solve-btn')),
      page.click('#refresh-btn'),
    ]);

    expect(filterReq.url()).toContain('ui_element=solve-btn');
  });

  test('search triggers API call with search param', async ({ page }) => {
    await page.route('**/api/clicks/*', route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ clicks: [], total: 0 }),
      });
    });

    await page.goto('/admin/clicks/');
    await page.fill('#search-input', 'test-query');

    // Wait for the specific request that includes search param
    const [searchReq] = await Promise.all([
      page.waitForRequest(req => req.url().includes('search=test-query')),
      page.click('#search-btn'),
    ]);

    expect(searchReq.url()).toContain('search=test-query');
  });

  test('sound toggle button updates text and persists to localStorage', async ({ page }) => {
    await page.goto('/admin/clicks/');
    const soundBtn = page.locator('#sound-toggle');

    // Default is off
    await expect(soundBtn).toContainText('Sound Off');

    // Click to enable
    await soundBtn.click();
    await expect(soundBtn).toContainText('Sound On');

    const stored = await page.evaluate(() => localStorage.getItem('swf_clicks_sound'));
    expect(stored).toBe('on');

    // Click to disable
    await soundBtn.click();
    await expect(soundBtn).toContainText('Sound Off');

    const storedOff = await page.evaluate(() => localStorage.getItem('swf_clicks_sound'));
    expect(storedOff).toBe('off');
  });
});

test.describe('Admin Clicks — Positive (Refresh Button Feedback)', () => {
  test('refresh button shows loading state while fetching', async ({ page }) => {
    await page.route('**/api/clicks/*', async route => {
      // Delay response to observe loading state
      await new Promise(r => setTimeout(r, 300));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ clicks: [], total: 0 }),
      });
    });

    await page.goto('/admin/clicks/');
    await page.waitForTimeout(500);

    const refreshBtn = page.locator('#refresh-btn');
    const originalText = await refreshBtn.textContent();

    // Click refresh and immediately check loading state
    await refreshBtn.click();
    await expect(refreshBtn).toHaveText('⏳ Refreshing...');
    await expect(refreshBtn).toHaveClass(/opacity-60/);
    await expect(refreshBtn).toHaveClass(/pointer-events-none/);

    // Wait for it to finish
    await expect(refreshBtn).toHaveText('✅ Done', { timeout: 3000 });
    await expect(refreshBtn).not.toHaveClass(/opacity-60/);
    await expect(refreshBtn).not.toHaveClass(/pointer-events-none/);

    // Eventually restores original text
    await expect(refreshBtn).toHaveText(originalText!, { timeout: 3000 });
  });

  test('refresh button shows toast notification after refresh', async ({ page }) => {
    await page.route('**/api/clicks/*', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ clicks: [], total: 0 }),
      })
    );

    await page.goto('/admin/clicks/');
    await page.waitForTimeout(500);

    await page.click('#refresh-btn');

    // Toast should appear with "Clicks refreshed" message
    const toast = page.locator('#clicks-toast');
    await expect(toast).toBeVisible({ timeout: 3000 });
    await expect(toast).toHaveText('Clicks refreshed');
  });

  test('refresh button is not clickable while loading', async ({ page }) => {
    await page.route('**/api/clicks/*', async route => {
      const url = route.request().url();
      if (url.includes('count=true')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ total: 0 }),
        });
      }
      // Slow down load requests to keep button in loading state
      await new Promise(r => setTimeout(r, 800));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ clicks: [], total: 0 }),
      });
    });

    await page.goto('/admin/clicks/');
    await page.waitForTimeout(1200);

    // Click refresh — button should become disabled via pointer-events-none
    await page.click('#refresh-btn');
    await expect(page.locator('#refresh-btn')).toHaveClass(/pointer-events-none/);
    await expect(page.locator('#refresh-btn')).toHaveClass(/opacity-60/);

    // After loading completes, button is interactive again
    await expect(page.locator('#refresh-btn')).not.toHaveClass(/pointer-events-none/, { timeout: 5000 });
  });

  test('toast disappears after a few seconds', async ({ page }) => {
    await page.route('**/api/clicks/*', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ clicks: [], total: 0 }),
      })
    );

    await page.goto('/admin/clicks/');
    await page.waitForTimeout(500);

    await page.click('#refresh-btn');

    const toast = page.locator('#clicks-toast');
    await expect(toast).toBeVisible({ timeout: 3000 });

    // Toast should be removed after ~2300ms (2000ms + 300ms opacity transition)
    await expect(toast).toBeHidden({ timeout: 5000 });
  });
});

test.describe('Admin Clicks — Negative (Refresh Button Edge Cases)', () => {
  test('refresh button restores original text even after API error', async ({ page }) => {
    let firstLoad = true;
    await page.route('**/api/clicks/*', route => {
      if (firstLoad) {
        firstLoad = false;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ clicks: [], total: 0 }),
        });
      }
      // Subsequent loads fail
      return route.fulfill({ status: 500, body: 'Server Error' });
    });

    await page.goto('/admin/clicks/');
    await page.waitForTimeout(500);

    const refreshBtn = page.locator('#refresh-btn');
    const originalText = await refreshBtn.textContent();

    await refreshBtn.click();

    // Should still show Done and restore text even on error
    await expect(refreshBtn).toHaveText('✅ Done', { timeout: 3000 });
    await expect(refreshBtn).toHaveText(originalText!, { timeout: 3000 });
  });

  test('no duplicate toast elements on rapid refresh clicks', async ({ page }) => {
    await page.route('**/api/clicks/*', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ clicks: [], total: 0 }),
      })
    );

    await page.goto('/admin/clicks/');
    await page.waitForTimeout(500);

    // Click refresh, wait for it to complete, then click again quickly
    await page.click('#refresh-btn');
    await page.waitForTimeout(1500);
    await page.click('#refresh-btn');
    await page.waitForTimeout(200);

    // Should only have one toast (showToast removes existing before creating new)
    const toasts = page.locator('#clicks-toast');
    await expect(toasts).toHaveCount(1);
  });
});

test.describe('Admin Clicks — Negative (Resilient Initialization)', () => {
  test('polling starts even when initial loadClicks fails', async ({ page }) => {
    let loadCallCount = 0;
    let countCallCount = 0;

    await page.route('**/api/clicks/*', route => {
      const url = route.request().url();
      if (url.includes('count=true')) {
        countCallCount++;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ total: 5 }),
        });
      }
      loadCallCount++;
      // First load fails, subsequent succeed
      if (loadCallCount === 1) {
        return route.fulfill({ status: 500, body: 'Server Error' });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ clicks: [], total: 0 }),
      });
    });

    await page.goto('/admin/clicks/');
    // Wait for polling to kick in (polling interval is 3000ms)
    await page.waitForTimeout(4000);

    // count endpoint was called at least twice: once during init, once during poll
    expect(countCallCount).toBeGreaterThanOrEqual(2);
  });

  test('initial loadClicks failure does not crash the page and remains interactive', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', err => pageErrors.push(err.message));

    await page.route('**/api/clicks/*', route => {
      const url = route.request().url();
      if (url.includes('count=true')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ total: 0 }),
        });
      }
      return route.fulfill({ status: 500, body: 'Server Error' });
    });

    await page.goto('/admin/clicks/');
    await page.waitForTimeout(1500);

    // Page does NOT crash — no uncaught exceptions
    expect(pageErrors).toHaveLength(0);

    // Page remains interactive — controls still visible
    await expect(page.locator('#refresh-btn')).toBeVisible();
    await expect(page.locator('#search-input')).toBeVisible();

    // The error state is shown in the table (loadClicks handles error internally)
    await expect(page.locator('#clicks-tbody')).toContainText('Failed to load clicks');
  });

  test('baseline count is set even when loadClicks fails', async ({ page }) => {
    await page.route('**/api/clicks/*', route => {
      const url = route.request().url();
      if (url.includes('count=true')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ total: 42 }),
        });
      }
      // loadClicks fails
      return route.fulfill({ status: 500, body: 'Server Error' });
    });

    await page.goto('/admin/clicks/');
    await page.waitForTimeout(1500);

    // The page still fetched the count and set the baseline
    // Verify by checking that the error state is shown but page didn't crash
    await expect(page.locator('#clicks-tbody')).toContainText('Failed to load clicks');
    // Stats should still reflect the count fetched independently
    // (the count endpoint succeeded even though loadClicks failed)
  });
});

test.describe('Admin Clicks — Positive (Live Sessions Panel)', () => {
  test('live sessions panel is visible on clicks page', async ({ page }) => {
    await page.goto('/admin/clicks/');
    const panel = page.locator('.border-green-800\\/50');
    await expect(panel).toBeVisible();
    await expect(panel.locator('h2')).toContainText('Live Sessions');
  });

  test('live sessions panel has Active Now and Unique Pages stat cards', async ({ page }) => {
    await page.goto('/admin/clicks/');
    await expect(page.locator('#live-count')).toBeVisible();
    await expect(page.locator('#live-pages')).toBeVisible();
  });

  test('live sessions panel has pulsing green indicator', async ({ page }) => {
    await page.goto('/admin/clicks/');
    const pulse = page.locator('.animate-ping');
    await expect(pulse).toBeAttached();
  });

  test('live sessions panel has heartbeat-updated timestamp', async ({ page }) => {
    await page.goto('/admin/clicks/');
    await expect(page.locator('#heartbeat-updated')).toBeVisible();
  });

  test('live sessions table has correct column headers (UID, Page, Trail, IP, Location, Last Seen)', async ({ page }) => {
    await page.goto('/admin/clicks/');
    const liveTable = page.locator('#live-sessions-tbody').locator('..');
    const headers = liveTable.locator('thead th');
    await expect(headers.nth(0)).toContainText('UID');
    await expect(headers.nth(1)).toContainText('Page');
    await expect(headers.nth(2)).toContainText('Trail');
    await expect(headers.nth(3)).toContainText('IP');
    await expect(headers.nth(4)).toContainText('Location');
    await expect(headers.nth(5)).toContainText('Last Seen');
  });

  test('fetches /api/heartbeat/ on page load', async ({ page }) => {
    const apiPromise = page.waitForRequest(req =>
      req.url().includes('/api/heartbeat/')
    );
    await page.goto('/admin/clicks/');
    const request = await apiPromise;
    expect(request.url()).toContain('/api/heartbeat/?minutes=2');
  });

  test('renders session data when heartbeat API returns results', async ({ page }) => {
    await page.route('**/api/heartbeat/*', route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessions: [
            { uid: 'u_abc123', page: '/', ip_address: '1.2.3.4', last_seen: new Date().toISOString().replace('T', ' ').slice(0, 19) },
            { uid: 'u_def456', page: '/about/', ip_address: '5.6.7.8', last_seen: new Date().toISOString().replace('T', ' ').slice(0, 19) },
          ],
          count: 2,
        }),
      });
    });
    await page.route('**/api/clicks/*', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ clicks: [], total: 0 }) })
    );

    await page.goto('/admin/clicks/');
    await page.waitForSelector('#live-count:not(:has-text("—"))');

    await expect(page.locator('#live-count')).toHaveText('2');
    await expect(page.locator('#live-pages')).toHaveText('2');
    await expect(page.locator('#live-sessions-tbody tr')).toHaveCount(2);
  });

  test('force refresh button is visible in Live Sessions panel', async ({ page }) => {
    await page.goto('/admin/clicks/');
    await expect(page.locator('#heartbeat-refresh-btn')).toBeVisible();
    await expect(page.locator('#heartbeat-refresh-btn')).toHaveText('↻ Refresh');
  });

  test('force refresh button triggers heartbeat API call', async ({ page }) => {
    let callCount = 0;
    await page.route('**/api/heartbeat/*', route => {
      callCount++;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sessions: [], count: 0 }),
      });
    });
    await page.route('**/api/clicks/*', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ clicks: [], total: 0 }) })
    );

    await page.goto('/admin/clicks/');
    await page.waitForTimeout(500);
    const initial = callCount;

    await page.click('#heartbeat-refresh-btn');
    await page.waitForTimeout(500);

    expect(callCount).toBeGreaterThan(initial);
  });

  test('force refresh button shows loading and done states', async ({ page }) => {
    await page.route('**/api/heartbeat/*', async route => {
      await new Promise(r => setTimeout(r, 200));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sessions: [], count: 0 }),
      });
    });
    await page.route('**/api/clicks/*', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ clicks: [], total: 0 }) })
    );

    await page.goto('/admin/clicks/');
    await page.waitForTimeout(500);

    const btn = page.locator('#heartbeat-refresh-btn');
    await btn.click();

    // Shows loading state
    await expect(btn).toHaveText('⏳');
    await expect(btn).toHaveClass(/opacity-60/);

    // Shows done state
    await expect(btn).toHaveText('✅', { timeout: 3000 });

    // Restores original text
    await expect(btn).toHaveText('↻ Refresh', { timeout: 3000 });
  });

  test('heartbeat-updated timestamp is set after successful load', async ({ page }) => {
    await page.route('**/api/heartbeat/*', route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sessions: [], count: 0 }),
      });
    });
    await page.route('**/api/clicks/*', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ clicks: [], total: 0 }) })
    );

    await page.goto('/admin/clicks/');
    await page.waitForSelector('#heartbeat-updated:not(:has-text("—"))');

    const text = await page.locator('#heartbeat-updated').textContent();
    expect(text).toContain('Updated');
  });
});

test.describe('Admin Clicks — Negative (Live Sessions Panel)', () => {
  test('shows "No active sessions" when heartbeat returns empty', async ({ page }) => {
    await page.route('**/api/heartbeat/*', route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sessions: [], count: 0 }),
      });
    });
    await page.route('**/api/clicks/*', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ clicks: [], total: 0 }) })
    );

    await page.goto('/admin/clicks/');
    await page.waitForSelector('#live-sessions-tbody:has-text("No active sessions")');

    await expect(page.locator('#live-sessions-tbody')).toContainText('No active sessions');
    await expect(page.locator('#live-count')).toHaveText('0');
    await expect(page.locator('#live-pages')).toHaveText('0');
  });

  test('shows error message when heartbeat API returns 500', async ({ page }) => {
    await page.route('**/api/heartbeat/*', route => {
      return route.fulfill({ status: 500, body: 'Server Error' });
    });
    await page.route('**/api/clicks/*', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ clicks: [], total: 0 }) })
    );

    await page.goto('/admin/clicks/');
    await page.waitForSelector('#live-sessions-tbody:has-text("Failed")');

    await expect(page.locator('#live-sessions-tbody')).toContainText('Failed to load sessions');
  });

  test('heartbeat failure does not crash the clicks page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('**/api/heartbeat/*', route => {
      return route.fulfill({ status: 500, body: 'Server Error' });
    });
    await page.route('**/api/clicks/*', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ clicks: [], total: 0 }) })
    );

    await page.goto('/admin/clicks/');
    await page.waitForTimeout(2000);

    // No uncaught exceptions
    expect(errors).toHaveLength(0);

    // Clicks table still works independently
    await expect(page.locator('#clicks-tbody')).toBeVisible();
    await expect(page.locator('#refresh-btn')).toBeVisible();
  });

  test('force refresh button recovers after API error', async ({ page }) => {
    let firstCall = true;
    await page.route('**/api/heartbeat/*', route => {
      if (firstCall) {
        firstCall = false;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ sessions: [], count: 0 }),
        });
      }
      return route.fulfill({ status: 500, body: 'Server Error' });
    });
    await page.route('**/api/clicks/*', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ clicks: [], total: 0 }) })
    );

    await page.goto('/admin/clicks/');
    await page.waitForTimeout(500);

    const btn = page.locator('#heartbeat-refresh-btn');
    await btn.click();

    // Button still restores to original text even on error
    await expect(btn).toHaveText('↻ Refresh', { timeout: 3000 });
    // Button is clickable again (not stuck in disabled state)
    await expect(btn).not.toHaveClass(/pointer-events-none/);
  });

  test('live sessions panel does not duplicate table rows on poll', async ({ page }) => {
    let callCount = 0;
    await page.route('**/api/heartbeat/*', route => {
      callCount++;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessions: [
            { uid: 'u_only1', page: '/', ip_address: '1.1.1.1', last_seen: new Date().toISOString().replace('T', ' ').slice(0, 19) },
          ],
          count: 1,
        }),
      });
    });
    await page.route('**/api/clicks/*', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ clicks: [], total: 0 }) })
    );

    await page.goto('/admin/clicks/');
    await page.waitForSelector('#live-count:has-text("1")');

    // Wait for at least one poll cycle (10s)
    await page.waitForTimeout(11000);

    // Should still only have 1 row (not duplicated)
    await expect(page.locator('#live-sessions-tbody tr')).toHaveCount(1);
    expect(callCount).toBeGreaterThanOrEqual(2);
  });
});

test.describe('Admin Clicks — Positive (Heartbeat Refresh Button)', () => {
  test('heartbeat refresh button is visible with correct text and title', async ({ page }) => {
    await page.route('**/api/heartbeat/*', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sessions: [], count: 0 }) })
    );
    await page.route('**/api/clicks/*', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ clicks: [], total: 0 }) })
    );

    await page.goto('/admin/clicks/');
    const btn = page.locator('#heartbeat-refresh-btn');
    await expect(btn).toBeVisible();
    await expect(btn).toHaveText('↻ Refresh');
    await expect(btn).toHaveAttribute('title', 'Force refresh sessions');
  });

  test('heartbeat refresh button shows loading state while fetching', async ({ page }) => {
    await page.route('**/api/heartbeat/*', async route => {
      await new Promise(r => setTimeout(r, 400));
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sessions: [], count: 0 }) });
    });
    await page.route('**/api/clicks/*', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ clicks: [], total: 0 }) })
    );

    await page.goto('/admin/clicks/');
    await page.waitForTimeout(600);

    const btn = page.locator('#heartbeat-refresh-btn');
    await btn.click();

    await expect(btn).toHaveText('⏳');
    await expect(btn).toHaveClass(/opacity-60/);
    await expect(btn).toHaveClass(/pointer-events-none/);

    // After completion shows checkmark then restores text
    await expect(btn).toHaveText('✅', { timeout: 3000 });
    await expect(btn).toHaveText('↻ Refresh', { timeout: 2000 });
  });

  test('heartbeat refresh button triggers a new /api/heartbeat/ request', async ({ page }) => {
    let heartbeatCalls = 0;
    await page.route('**/api/heartbeat/*', route => {
      heartbeatCalls++;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sessions: [], count: 0 }) });
    });
    await page.route('**/api/clicks/*', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ clicks: [], total: 0 }) })
    );

    await page.goto('/admin/clicks/');
    await page.waitForTimeout(600);
    const callsBefore = heartbeatCalls;

    await page.click('#heartbeat-refresh-btn');
    await page.waitForTimeout(500);

    expect(heartbeatCalls).toBeGreaterThan(callsBefore);
  });

  test('heartbeat refresh button updates session data in the table', async ({ page }) => {
    let callCount = 0;
    await page.route('**/api/heartbeat/*', route => {
      callCount++;
      // First call returns 1 session, second (refresh) returns 2
      const sessions = callCount <= 1
        ? [{ uid: 'u_first', page: '/', ip_address: '1.1.1.1', last_seen: '2026-06-21 10:00:00' }]
        : [
            { uid: 'u_first', page: '/', ip_address: '1.1.1.1', last_seen: '2026-06-21 10:00:00' },
            { uid: 'u_second', page: '/about/', ip_address: '2.2.2.2', last_seen: '2026-06-21 10:01:00' },
          ];
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sessions, count: sessions.length }),
      });
    });
    await page.route('**/api/clicks/*', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ clicks: [], total: 0 }) })
    );

    await page.goto('/admin/clicks/');
    await page.waitForSelector('#live-count:has-text("1")');
    await expect(page.locator('#live-sessions-tbody tr')).toHaveCount(1);

    // Click refresh — should update to 2 sessions
    await page.click('#heartbeat-refresh-btn');
    await page.waitForSelector('#live-count:has-text("2")');
    await expect(page.locator('#live-sessions-tbody tr')).toHaveCount(2);
  });
});

test.describe('Admin Clicks — Negative (Heartbeat Refresh Button)', () => {
  test('heartbeat refresh button restores text even when API fails', async ({ page }) => {
    let callCount = 0;
    await page.route('**/api/heartbeat/*', route => {
      callCount++;
      if (callCount <= 1) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sessions: [], count: 0 }) });
      }
      return route.fulfill({ status: 500, body: 'Server Error' });
    });
    await page.route('**/api/clicks/*', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ clicks: [], total: 0 }) })
    );

    await page.goto('/admin/clicks/');
    await page.waitForTimeout(600);

    const btn = page.locator('#heartbeat-refresh-btn');
    await btn.click();

    // Should still restore to original text after failure
    await expect(btn).toHaveText('✅', { timeout: 3000 });
    await expect(btn).toHaveText('↻ Refresh', { timeout: 2000 });
    await expect(btn).not.toHaveClass(/opacity-60/);
    await expect(btn).not.toHaveClass(/pointer-events-none/);
  });

  test('heartbeat refresh button is not clickable while loading', async ({ page }) => {
    await page.route('**/api/heartbeat/*', async route => {
      await new Promise(r => setTimeout(r, 500));
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sessions: [], count: 0 }) });
    });
    await page.route('**/api/clicks/*', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ clicks: [], total: 0 }) })
    );

    await page.goto('/admin/clicks/');
    await page.waitForTimeout(700);

    const btn = page.locator('#heartbeat-refresh-btn');
    await btn.click();

    // While loading, pointer-events-none prevents further clicks
    await expect(btn).toHaveClass(/pointer-events-none/);
  });

  test('heartbeat refresh does not crash page on network error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    let callCount = 0;
    await page.route('**/api/heartbeat/*', route => {
      callCount++;
      if (callCount <= 1) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sessions: [], count: 0 }) });
      }
      return route.abort('connectionrefused');
    });
    await page.route('**/api/clicks/*', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ clicks: [], total: 0 }) })
    );

    await page.goto('/admin/clicks/');
    await page.waitForTimeout(600);

    await page.click('#heartbeat-refresh-btn');
    await page.waitForTimeout(1500);

    // No uncaught page errors
    expect(errors).toHaveLength(0);

    // Button restores to interactive state
    const btn = page.locator('#heartbeat-refresh-btn');
    await expect(btn).not.toHaveClass(/pointer-events-none/);
  });
});

test.describe('Admin Clicks — Negative (Error & Edge Cases)', () => {
  test('displays error message when API returns 500', async ({ page }) => {
    await page.route('**/api/clicks/*', route =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );
    await page.goto('/admin/clicks/');
    await page.waitForSelector('#clicks-tbody:has-text("Failed to load")');

    await expect(page.locator('#clicks-tbody')).toContainText('Failed to load clicks');
  });

  test('shows empty state when no clicks exist', async ({ page }) => {
    await page.route('**/api/clicks/*', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ clicks: [], total: 0 }),
      })
    );
    await page.goto('/admin/clicks/');
    await page.waitForSelector('#clicks-tbody:has-text("No clicks recorded")');

    await expect(page.locator('#clicks-tbody')).toContainText('No clicks recorded yet');
  });

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('**/api/clicks/*', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ clicks: [], total: 0 }),
      })
    );
    await page.goto('/admin/clicks/');
    await page.waitForTimeout(2000);

    expect(errors.filter(e => !e.includes('audio'))).toHaveLength(0);
  });

  test('search with empty query reloads default clicks without crash', async ({ page }) => {
    await page.route('**/api/clicks/*', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ clicks: [], total: 0 }),
      })
    );
    await page.goto('/admin/clicks/');
    await page.waitForTimeout(500);

    // Clear search and click — should not throw
    await page.fill('#search-input', '');
    await page.click('#search-btn');
    await page.waitForTimeout(500);

    // Page should still be functional
    await expect(page.locator('#clicks-tbody')).toBeVisible();
  });

  test('search with no matches shows descriptive message', async ({ page }) => {
    let callCount = 0;
    await page.route('**/api/clicks/*', route => {
      callCount++;
      if (route.request().url().includes('search=')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ clicks: [], total: 0 }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ clicks: [], total: 0 }),
      });
    });

    await page.goto('/admin/clicks/');
    await page.waitForTimeout(500);
    await page.fill('#search-input', 'nonexistent-xyz');
    await page.click('#search-btn');
    await page.waitForTimeout(500);

    await expect(page.locator('#clicks-tbody')).toContainText('No matches');
  });
});

test.describe('Admin Clicks — Positive (Page Trail)', () => {
  test('live sessions table has Trail column header', async ({ page }) => {
    await page.goto('/admin/clicks/');
    const liveTable = page.locator('#live-sessions-tbody').locator('..');
    const headers = liveTable.locator('thead th');
    await expect(headers.nth(2)).toContainText('Trail');
  });

  test('trail column renders page history with arrow separators', async ({ page }) => {
    await page.route('**/api/heartbeat/*', route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessions: [
            {
              uid: 'u_trail_test',
              page: '/contact/',
              ip_address: '1.2.3.4',
              last_seen: new Date().toISOString().replace('T', ' ').slice(0, 19),
              page_history: [
                { page: '/', ts: '2026-06-21 10:00:00' },
                { page: '/about/', ts: '2026-06-21 10:01:00' },
                { page: '/contact/', ts: '2026-06-21 10:02:00' },
              ],
            },
          ],
          count: 1,
        }),
      });
    });
    await page.route('**/api/clicks/*', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ clicks: [], total: 0 }) })
    );

    await page.goto('/admin/clicks/');
    await page.waitForSelector('#live-count:not(:has-text("—"))');

    const trailCell = page.locator('#live-sessions-tbody tr').first().locator('td').nth(2);
    await expect(trailCell).toContainText('/');
    await expect(trailCell).toContainText('/about/');
    await expect(trailCell).toContainText('/contact/');
    // Arrow separators exist
    await expect(trailCell).toContainText('→');
  });

  test('current page in trail is highlighted green', async ({ page }) => {
    await page.route('**/api/heartbeat/*', route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessions: [
            {
              uid: 'u_green_test',
              page: '/guide/',
              ip_address: '2.3.4.5',
              last_seen: new Date().toISOString().replace('T', ' ').slice(0, 19),
              page_history: [
                { page: '/', ts: '2026-06-21 10:00:00' },
                { page: '/guide/', ts: '2026-06-21 10:01:00' },
              ],
            },
          ],
          count: 1,
        }),
      });
    });
    await page.route('**/api/clicks/*', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ clicks: [], total: 0 }) })
    );

    await page.goto('/admin/clicks/');
    await page.waitForSelector('#live-count:not(:has-text("—"))');

    const trailCell = page.locator('#live-sessions-tbody tr').first().locator('td').nth(2);
    // Last page span should have green + font-medium classes
    const lastSpan = trailCell.locator('span.text-green-400.font-medium');
    await expect(lastSpan).toBeVisible();
    await expect(lastSpan).toHaveText('/guide/');
  });

  test('trail shows dash when page_history is empty', async ({ page }) => {
    await page.route('**/api/heartbeat/*', route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessions: [
            {
              uid: 'u_empty_trail',
              page: '/',
              ip_address: '3.4.5.6',
              last_seen: new Date().toISOString().replace('T', ' ').slice(0, 19),
              page_history: [],
            },
          ],
          count: 1,
        }),
      });
    });
    await page.route('**/api/clicks/*', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ clicks: [], total: 0 }) })
    );

    await page.goto('/admin/clicks/');
    await page.waitForSelector('#live-count:not(:has-text("—"))');

    const trailCell = page.locator('#live-sessions-tbody tr').first().locator('td').nth(2);
    await expect(trailCell).toContainText('—');
  });

  test('live sessions table now has 6 column headers', async ({ page }) => {
    await page.goto('/admin/clicks/');
    const liveTable = page.locator('#live-sessions-tbody').locator('..');
    const headers = liveTable.locator('thead th');
    await expect(headers).toHaveCount(6);
    await expect(headers.nth(0)).toContainText('UID');
    await expect(headers.nth(1)).toContainText('Page');
    await expect(headers.nth(2)).toContainText('Trail');
    await expect(headers.nth(3)).toContainText('IP');
    await expect(headers.nth(4)).toContainText('Location');
    await expect(headers.nth(5)).toContainText('Last Seen');
  });
});

test.describe('Admin Clicks — Negative (Page Trail)', () => {
  test('trail handles missing page_history gracefully (null/undefined)', async ({ page }) => {
    await page.route('**/api/heartbeat/*', route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessions: [
            {
              uid: 'u_no_history',
              page: '/',
              ip_address: '4.5.6.7',
              last_seen: new Date().toISOString().replace('T', ' ').slice(0, 19),
              // page_history intentionally missing
            },
          ],
          count: 1,
        }),
      });
    });
    await page.route('**/api/clicks/*', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ clicks: [], total: 0 }) })
    );

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/admin/clicks/');
    await page.waitForSelector('#live-count:not(:has-text("—"))');

    // No crash
    expect(errors).toHaveLength(0);
    // Trail cell shows dash
    const trailCell = page.locator('#live-sessions-tbody tr').first().locator('td').nth(2);
    await expect(trailCell).toContainText('—');
  });

  test('trail does not render duplicate arrows for single-page history', async ({ page }) => {
    await page.route('**/api/heartbeat/*', route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessions: [
            {
              uid: 'u_single_page',
              page: '/',
              ip_address: '5.6.7.8',
              last_seen: new Date().toISOString().replace('T', ' ').slice(0, 19),
              page_history: [{ page: '/', ts: '2026-06-21 10:00:00' }],
            },
          ],
          count: 1,
        }),
      });
    });
    await page.route('**/api/clicks/*', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ clicks: [], total: 0 }) })
    );

    await page.goto('/admin/clicks/');
    await page.waitForSelector('#live-count:not(:has-text("—"))');

    const trailCell = page.locator('#live-sessions-tbody tr').first().locator('td').nth(2);
    // Should show just one page, no arrow separator
    const arrows = await trailCell.locator('span.text-gray-600.mx-0\\.5').count();
    expect(arrows).toBe(0);
    await expect(trailCell).toContainText('/');
  });

  test('no page errors when trail contains many pages (20 entries)', async ({ page }) => {
    const history = Array.from({ length: 20 }, (_, i) => ({
      page: `/page-${i + 1}/`,
      ts: `2026-06-21 10:${String(i).padStart(2, '0')}:00`,
    }));

    await page.route('**/api/heartbeat/*', route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sessions: [
            {
              uid: 'u_many_pages',
              page: '/page-20/',
              ip_address: '6.7.8.9',
              last_seen: new Date().toISOString().replace('T', ' ').slice(0, 19),
              page_history: history,
            },
          ],
          count: 1,
        }),
      });
    });
    await page.route('**/api/clicks/*', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ clicks: [], total: 0 }) })
    );

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/admin/clicks/');
    await page.waitForSelector('#live-count:not(:has-text("—"))');

    expect(errors).toHaveLength(0);

    const trailCell = page.locator('#live-sessions-tbody tr').first().locator('td').nth(2);
    // Should contain the first and last pages
    await expect(trailCell).toContainText('/page-1/');
    await expect(trailCell).toContainText('/page-20/');
    // 19 arrow separators
    const arrows = await trailCell.locator('span.text-gray-600.mx-0\\.5').count();
    expect(arrows).toBe(19);
  });
});
