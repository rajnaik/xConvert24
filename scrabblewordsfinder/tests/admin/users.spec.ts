import { test, expect } from '@playwright/test';

const PAGE = '/admin/users/';
const ADMIN = '/admin/';

test.describe('Admin Users Page — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('h1 title is visible and correct', async ({ page }) => {
    await page.goto(PAGE);
    const h1 = page.getByRole('heading', { name: '👥 Users' });
    await expect(h1).toBeVisible();
  });

  test('summary stats section has 5 stat boxes', async ({ page }) => {
    await page.goto(PAGE);
    const stats = page.locator('#summary-stats > div');
    await expect(stats).toHaveCount(5);
  });

  test('summary stats update after API response', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForTimeout(3000);
    const users = await page.locator('#stat-users').textContent();
    expect(users?.trim()).not.toBe('—');
  });

  test('Return Customers stat box is visible and updates', async ({ page }) => {
    await page.goto(PAGE);
    const statEl = page.locator('#stat-returning');
    await expect(statEl).toBeVisible();
    await page.waitForTimeout(3000);
    const value = await statEl.textContent();
    expect(value?.trim()).not.toBe('—');
  });

  test('search input is visible', async ({ page }) => {
    await page.goto(PAGE);
    const search = page.locator('#user-search');
    await expect(search).toBeVisible();
    await expect(search).toHaveAttribute('placeholder', /Search by User ID/);
  });

  test('table has correct column headers', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table');
    await expect(table).toBeVisible();
    await expect(table.locator('th')).toHaveCount(10);
    await expect(table.locator('th').nth(1)).toContainText('User ID');
    await expect(table.locator('th').nth(2)).toContainText('Clicks');
    await expect(table.locator('th').nth(3)).toContainText('Stars');
    await expect(table.locator('th').nth(4)).toContainText('Diamonds');
    await expect(table.locator('th').nth(5)).toContainText('Streak');
    await expect(table.locator('th').nth(6)).toContainText('Games');
    await expect(table.locator('th').nth(7)).toContainText('Solver');
    await expect(table.locator('th').nth(8)).toContainText('Practice');
    await expect(table.locator('th').nth(9)).toContainText('Last Active');
  });

  test('table loads data from API (rows appear or shows no users)', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const tbody = document.getElementById('users-tbody');
      return tbody && !tbody.textContent?.includes('Loading...');
    }, { timeout: 5000 });
    const tbody = page.locator('#users-tbody');
    const text = await tbody.textContent();
    expect(text).not.toContain('Loading...');
  });

  test('noindex meta tag present', async ({ page }) => {
    await page.goto(PAGE);
    const meta = page.locator('meta[name="robots"]');
    await expect(meta).toHaveAttribute('content', /noindex/);
  });

  test('nav has active link highlighted for Users', async ({ page }) => {
    await page.goto(PAGE);
    const activeLink = page.locator('nav a[href="/admin/users/"]');
    await expect(activeLink).toHaveClass(/text-emerald-400/);
  });
});

test.describe('Admin Users Page — Sortable Headers', () => {

  const sortableColumns = [
    'user_id', 'clicks', 'stars', 'diamonds',
    'current_streak', 'games_played', 'solver_uses',
    'practice_words', 'last_active',
  ];

  test('all 9 sortable column headers have data-sort attribute', async ({ page }) => {
    await page.goto(PAGE);
    const sortableHeaders = page.locator('th[data-sort]');
    await expect(sortableHeaders).toHaveCount(9);
  });

  test('each sortable header has a sort-arrow span', async ({ page }) => {
    await page.goto(PAGE);
    for (const col of sortableColumns) {
      const th = page.locator(`th[data-sort="${col}"]`);
      await expect(th.locator('.sort-arrow')).toHaveCount(1);
    }
  });

  test('clicking a column header shows sort arrow indicator', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForTimeout(2000);
    const th = page.locator('th[data-sort="clicks"]');
    await th.click();
    const arrow = th.locator('.sort-arrow');
    await expect(arrow).toHaveText('▼');
  });

  test('clicking same header twice toggles sort direction', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForTimeout(2000);
    const th = page.locator('th[data-sort="clicks"]');
    await th.click();
    await expect(th.locator('.sort-arrow')).toHaveText('▼');
    await th.click();
    await expect(th.locator('.sort-arrow')).toHaveText('▲');
  });

  test('clicking a header does not crash the page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForTimeout(1500);
    await page.locator('th[data-sort="stars"]').click();
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });
});

test.describe('Admin Users Page — Search', () => {

  test('typing in search filters the table', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const tbody = document.getElementById('users-tbody');
      return tbody && !tbody.textContent?.includes('Loading...');
    }, { timeout: 5000 });
    const search = page.locator('#user-search');
    // Type a random string that likely won't match any user
    await search.fill('zzzznonexistent999');
    await page.waitForTimeout(300);
    const tbody = page.locator('#users-tbody');
    const text = await tbody.textContent();
    expect(text).toContain('No users found');
  });

  test('clearing search restores full table', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const tbody = document.getElementById('users-tbody');
      return tbody && !tbody.textContent?.includes('Loading...');
    }, { timeout: 5000 });
    const search = page.locator('#user-search');
    await search.fill('zzz');
    await page.waitForTimeout(300);
    await search.fill('');
    await page.waitForTimeout(300);
    const tbody = page.locator('#users-tbody');
    const text = await tbody.textContent();
    expect(text).not.toContain('No users found');
  });
});

test.describe('Admin Users Page — Dashboard Tile', () => {

  test('Users tile exists on admin dashboard', async ({ page }) => {
    await page.goto(ADMIN);
    const tile = page.locator('a[href="/admin/users/"]');
    await expect(tile).toBeVisible();
    await expect(tile).toContainText('Users');
  });

  test('Users tile has stats placeholders', async ({ page }) => {
    await page.goto(ADMIN);
    await expect(page.locator('#users-a-total')).toBeVisible();
    await expect(page.locator('#users-a-clicks')).toBeVisible();
    await expect(page.locator('#users-a-games')).toBeVisible();
    await expect(page.locator('#users-a-solver')).toBeVisible();
  });

  test('Users tile click navigates to users page', async ({ page }) => {
    await page.goto(ADMIN);
    await page.locator('a[href="/admin/users/"]').click();
    await page.waitForURL('**/admin/users/**');
    await expect(page.getByRole('heading', { name: '👥 Users' })).toBeVisible();
  });

  test('no duplicate Users tiles on admin dashboard', async ({ page }) => {
    await page.goto(ADMIN);
    const tiles = page.locator('a[href="/admin/users/"]');
    await expect(tiles).toHaveCount(1);
  });
});

test.describe('Admin Users Page — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('table does not show error state on valid load', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForTimeout(3000);
    const text = await page.locator('#users-tbody').textContent();
    expect(text).not.toContain('Failed to load');
  });

  test('API endpoint returns valid JSON', async ({ page }) => {
    await page.goto(PAGE);
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/users/');
      return { ok: res.ok, status: res.status };
    });
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
  });

  test('API response has expected shape', async ({ page }) => {
    await page.goto(PAGE);
    const data = await page.evaluate(async () => {
      const res = await fetch('/api/users/');
      return res.json();
    });
    expect(data).toHaveProperty('summary');
    expect(data).toHaveProperty('users');
    expect(data.summary).toHaveProperty('totalUsers');
    expect(data.summary).toHaveProperty('totalClicks');
    expect(data.summary).toHaveProperty('totalGamesPlayed');
    expect(data.summary).toHaveProperty('totalSolverUses');
    expect(data.summary).toHaveProperty('totalReturning');
    expect(Array.isArray(data.users)).toBe(true);
  });

  test('totalReturning is a non-negative number', async ({ page }) => {
    await page.goto(PAGE);
    const data = await page.evaluate(async () => {
      const res = await fetch('/api/users/');
      return res.json();
    });
    expect(typeof data.summary.totalReturning).toBe('number');
    expect(data.summary.totalReturning).toBeGreaterThanOrEqual(0);
    expect(data.summary.totalReturning).toBeLessThanOrEqual(data.summary.totalUsers);
  });

  test('each user object has a boolean returning field', async ({ page }) => {
    await page.goto(PAGE);
    const data = await page.evaluate(async () => {
      const res = await fetch('/api/users/');
      return res.json();
    });
    if (data.users.length > 0) {
      for (const user of data.users.slice(0, 5)) {
        expect(typeof user.returning).toBe('boolean');
      }
    }
  });
});


test.describe('Admin Users Page — Detail Panel — Positive', () => {

  test('detail panel exists in the DOM', async ({ page }) => {
    await page.goto(PAGE);
    const panel = page.locator('#user-detail-panel');
    await expect(panel).toHaveCount(1);
  });

  test('detail panel is hidden by default', async ({ page }) => {
    await page.goto(PAGE);
    const panel = page.locator('#user-detail-panel');
    await expect(panel).toHaveClass(/hidden/);
  });

  test('detail panel has close button', async ({ page }) => {
    await page.goto(PAGE);
    const closeBtn = page.locator('#close-detail');
    await expect(closeBtn).toHaveCount(1);
    await expect(closeBtn).toHaveText('×');
  });

  test('detail panel has user ID display element', async ({ page }) => {
    await page.goto(PAGE);
    const userId = page.locator('#detail-user-id');
    await expect(userId).toHaveCount(1);
  });

  test('detail panel has rewards summary container', async ({ page }) => {
    await page.goto(PAGE);
    const rewards = page.locator('#detail-rewards');
    await expect(rewards).toHaveCount(1);
  });

  test('detail panel has all 8 activity tab buttons', async ({ page }) => {
    await page.goto(PAGE);
    const tabs = page.locator('#detail-tabs .tab-btn');
    await expect(tabs).toHaveCount(8);
  });

  test('tab buttons have correct data-tab attributes', async ({ page }) => {
    await page.goto(PAGE);
    const expectedTabs = ['clicks', 'quizzes', 'anagrams', 'racks', 'cab', 'solver', 'practice', 'bonus'];
    for (const tabName of expectedTabs) {
      const tab = page.locator(`#detail-tabs button[data-tab="${tabName}"]`);
      await expect(tab).toHaveCount(1);
    }
  });

  test('Clicks tab is active by default', async ({ page }) => {
    await page.goto(PAGE);
    const clicksTab = page.locator('#detail-tabs button[data-tab="clicks"]');
    await expect(clicksTab).toHaveClass(/active/);
  });

  test('tab content area exists with default text', async ({ page }) => {
    await page.goto(PAGE);
    const content = page.locator('#detail-tab-content');
    await expect(content).toHaveCount(1);
    await expect(content).toContainText('Select a tab to view activity');
  });

  test('detail panel has emerald border styling', async ({ page }) => {
    await page.goto(PAGE);
    const panel = page.locator('#user-detail-panel');
    await expect(panel).toHaveClass(/border-emerald-800/);
  });
});

test.describe('Admin Users Page — Detail Panel API', () => {

  test('clicking a user row calls /api/users/{id} without trailing slash', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const tbody = document.getElementById('users-tbody');
      return tbody && tbody.querySelectorAll('tr[data-uid]').length > 0;
    }, { timeout: 6000 });

    const firstRow = page.locator('#users-tbody tr[data-uid]').first();
    const uid = await firstRow.getAttribute('data-uid');

    const [apiResponse] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/users/') && res.url() !== page.url() && res.url().includes(encodeURIComponent(uid!))),
      firstRow.click(),
    ]);

    // Verify the URL does NOT end with a trailing slash (userId is last segment)
    expect(apiResponse.url()).toMatch(/\/api\/users\/[^/]+$/);
    expect(apiResponse.status()).toBe(200);
  });

  test('user detail API returns expected shape', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const tbody = document.getElementById('users-tbody');
      return tbody && tbody.querySelectorAll('tr[data-uid]').length > 0;
    }, { timeout: 6000 });

    const firstRow = page.locator('#users-tbody tr[data-uid]').first();
    const uid = await firstRow.getAttribute('data-uid');

    const data = await page.evaluate(async (userId) => {
      const res = await fetch('/api/users/' + encodeURIComponent(userId!));
      return { ok: res.ok, status: res.status, body: await res.json() };
    }, uid);

    expect(data.ok).toBe(true);
    expect(data.status).toBe(200);
    expect(data.body).toHaveProperty('rewards');
    expect(data.body).toHaveProperty('clicks');
    expect(data.body).toHaveProperty('quizzes');
    expect(data.body).toHaveProperty('anagrams');
    expect(data.body).toHaveProperty('racks');
    expect(data.body).toHaveProperty('solver_history');
    expect(data.body).toHaveProperty('practice');
  });

  test('detail panel shows after clicking a user row', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const tbody = document.getElementById('users-tbody');
      return tbody && tbody.querySelectorAll('tr[data-uid]').length > 0;
    }, { timeout: 6000 });

    const firstRow = page.locator('#users-tbody tr[data-uid]').first();
    await firstRow.click();
    await page.waitForTimeout(2000);

    const panel = page.locator('#user-detail-panel');
    await expect(panel).not.toHaveClass(/hidden/);
    await expect(page.locator('#detail-user-id')).not.toBeEmpty();
  });

  test('close button hides detail panel', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const tbody = document.getElementById('users-tbody');
      return tbody && tbody.querySelectorAll('tr[data-uid]').length > 0;
    }, { timeout: 6000 });

    const firstRow = page.locator('#users-tbody tr[data-uid]').first();
    await firstRow.click();
    await page.waitForTimeout(2000);

    await page.locator('#close-detail').click();
    const panel = page.locator('#user-detail-panel');
    await expect(panel).toHaveClass(/hidden/);
  });
});

test.describe('Admin Users Page — Detail Panel — Negative', () => {

  test('no duplicate detail panels exist', async ({ page }) => {
    await page.goto(PAGE);
    const panels = page.locator('#user-detail-panel');
    await expect(panels).toHaveCount(1);
  });

  test('no duplicate close buttons in detail panel', async ({ page }) => {
    await page.goto(PAGE);
    const closeBtns = page.locator('#user-detail-panel #close-detail');
    await expect(closeBtns).toHaveCount(1);
  });

  test('no duplicate tab containers', async ({ page }) => {
    await page.goto(PAGE);
    const tabContainers = page.locator('#detail-tabs');
    await expect(tabContainers).toHaveCount(1);
  });

  test('no console errors from detail panel markup', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    expect(errors).toHaveLength(0);
  });

  test('only one tab is marked active at initial state', async ({ page }) => {
    await page.goto(PAGE);
    const activeTabs = page.locator('#detail-tabs .tab-btn.active');
    await expect(activeTabs).toHaveCount(1);
  });
});


test.describe('Admin Users Page — Activity Tab Column Headers', () => {

  // Helper: open user detail, click a tab, return content element
  async function openDetailAndClickTab(page, tabName: string) {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const tbody = document.getElementById('users-tbody');
      return tbody && tbody.querySelectorAll('tr[data-uid]').length > 0;
    }, { timeout: 6000 });

    const firstRow = page.locator('#users-tbody tr[data-uid]').first();
    await firstRow.click();
    await page.waitForTimeout(2000);

    // Click the tab
    await page.locator(`#detail-tabs button[data-tab="${tabName}"]`).click();
    await page.waitForTimeout(1000);
  }

  // Helper: get headers if a table is rendered, otherwise return null (no data case)
  async function getTabHeaders(page): Promise<string[] | null> {
    const content = page.locator('#detail-tab-content');
    const tableCount = await content.locator('table').count();
    if (tableCount === 0) return null;
    return content.locator('table thead th').allTextContents();
  }

  test('quizzes tab renders correct headers or shows no-activity message', async ({ page }) => {
    await openDetailAndClickTab(page, 'quizzes');
    const headers = await getTabHeaders(page);
    if (headers) {
      expect(headers).toEqual(['Score', 'Total', 'Time(s)', 'Limit', 'Timed Out', 'Date']);
    } else {
      const text = await page.locator('#detail-tab-content').textContent();
      expect(text).toContain('No activity found');
    }
  });

  test('cab tab renders correct headers or shows no-activity message', async ({ page }) => {
    await openDetailAndClickTab(page, 'cab');
    const headers = await getTabHeaders(page);
    if (headers) {
      expect(headers).toEqual(['Word ID', 'Solved', 'Attempts', 'Split(ms)', 'Timer', 'Played']);
    } else {
      const text = await page.locator('#detail-tab-content').textContent();
      expect(text).toContain('No activity found');
    }
  });

  test('solver tab renders correct headers or shows no-activity message', async ({ page }) => {
    await openDetailAndClickTab(page, 'solver');
    const headers = await getTabHeaders(page);
    if (headers) {
      expect(headers).toEqual(['Word', 'Score', 'Meaning', 'Submitted']);
    } else {
      const text = await page.locator('#detail-tab-content').textContent();
      expect(text).toContain('No activity found');
    }
  });

  test('practice tab renders correct headers or shows no-activity message', async ({ page }) => {
    await openDetailAndClickTab(page, 'practice');
    const headers = await getTabHeaders(page);
    if (headers) {
      expect(headers).toEqual(['Word', 'Meaning', 'Practiced']);
    } else {
      const text = await page.locator('#detail-tab-content').textContent();
      expect(text).toContain('No activity found');
    }
  });

  test('bonus tab renders correct headers or shows no-activity message', async ({ page }) => {
    await openDetailAndClickTab(page, 'bonus');
    const headers = await getTabHeaders(page);
    if (headers) {
      expect(headers).toEqual(['Type', 'Awarded']);
    } else {
      const text = await page.locator('#detail-tab-content').textContent();
      expect(text).toContain('No activity found');
    }
  });

  test('clicks tab renders correct headers or shows no-activity message', async ({ page }) => {
    await openDetailAndClickTab(page, 'clicks');
    const headers = await getTabHeaders(page);
    if (headers) {
      expect(headers).toEqual(['Element', 'URL', 'Time']);
    } else {
      const text = await page.locator('#detail-tab-content').textContent();
      expect(text).toContain('No activity found');
    }
  });

  test('anagrams tab renders correct headers or shows no-activity message', async ({ page }) => {
    await openDetailAndClickTab(page, 'anagrams');
    const headers = await getTabHeaders(page);
    if (headers) {
      expect(headers).toEqual(['Date', 'Attempts', 'Solved', 'Time(s)', 'Played']);
    } else {
      const text = await page.locator('#detail-tab-content').textContent();
      expect(text).toContain('No activity found');
    }
  });

  test('racks tab renders correct headers or shows no-activity message', async ({ page }) => {
    await openDetailAndClickTab(page, 'racks');
    const headers = await getTabHeaders(page);
    if (headers) {
      expect(headers).toEqual(['Date', 'Word', 'Score', 'Played']);
    } else {
      const text = await page.locator('#detail-tab-content').textContent();
      expect(text).toContain('No activity found');
    }
  });
});

test.describe('Admin Users Page — Activity Tab Rendering — Negative', () => {

  test('tab with no data shows "No activity found" message', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const tbody = document.getElementById('users-tbody');
      return tbody && tbody.querySelectorAll('tr[data-uid]').length > 0;
    }, { timeout: 6000 });

    const firstRow = page.locator('#users-tbody tr[data-uid]').first();
    await firstRow.click();
    await page.waitForTimeout(2000);

    // Try each tab - at least one should either show data or "No activity found" (both valid)
    const tabs = ['quizzes', 'cab', 'solver', 'practice', 'bonus'];
    for (const tab of tabs) {
      await page.locator(`#detail-tabs button[data-tab="${tab}"]`).click();
      await page.waitForTimeout(500);
      const content = await page.locator('#detail-tab-content').textContent();
      // Either a table is rendered OR the "no activity" message is shown — both are valid
      const hasTable = (await page.locator('#detail-tab-content table').count()) > 0;
      const hasNoActivity = content?.includes('No activity found');
      expect(hasTable || hasNoActivity).toBe(true);
    }
  });

  test('no console errors when switching between all tabs', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const tbody = document.getElementById('users-tbody');
      return tbody && tbody.querySelectorAll('tr[data-uid]').length > 0;
    }, { timeout: 6000 });

    const firstRow = page.locator('#users-tbody tr[data-uid]').first();
    await firstRow.click();
    await page.waitForTimeout(2000);

    const allTabs = ['clicks', 'quizzes', 'anagrams', 'racks', 'cab', 'solver', 'practice', 'bonus'];
    for (const tab of allTabs) {
      await page.locator(`#detail-tabs button[data-tab="${tab}"]`).click();
      await page.waitForTimeout(300);
    }

    expect(errors).toHaveLength(0);
  });
});
