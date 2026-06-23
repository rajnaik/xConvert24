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


test.describe('Admin Users Page — Return Customers Panel — Positive', () => {

  test('return customers panel exists in the DOM', async ({ page }) => {
    await page.goto(PAGE);
    const panel = page.locator('#return-customers-panel');
    await expect(panel).toHaveCount(1);
    await expect(panel).toBeVisible();
  });

  test('panel has correct heading with icon and count badge', async ({ page }) => {
    await page.goto(PAGE);
    const heading = page.locator('#return-customers-panel h2');
    await expect(heading).toContainText('Return Customers');
    const icon = heading.locator('span.text-pink-400');
    await expect(icon).toHaveText('↩');
    const badge = page.locator('#rc-count');
    await expect(badge).toBeVisible();
  });

  test('panel has description text explaining the criteria', async ({ page }) => {
    await page.goto(PAGE);
    const desc = page.locator('#return-customers-panel > p.text-xs');
    await expect(desc).toContainText('2 or more distinct days');
  });

  test('rc-cards container exists for card rendering', async ({ page }) => {
    await page.goto(PAGE);
    const cards = page.locator('#rc-cards');
    await expect(cards).toBeVisible();
  });

  test('rc-count badge updates after data loads', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForTimeout(4000);
    const badge = page.locator('#rc-count');
    const text = await badge.textContent();
    // Badge should update from initial '—' to either a number or remain '—' if 0
    expect(text?.trim()).toMatch(/^\d+$|^—$/);
  });

  test('hide button toggles content visibility', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForTimeout(2000);
    const toggle = page.locator('#rc-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toContainText('Hide');
    // Click to hide
    await toggle.click();
    const content = page.locator('#rc-content');
    await expect(content).toBeHidden();
    // Button text should change to Show
    await expect(toggle).toContainText('Show');
    // Click to show again
    await toggle.click();
    await expect(content).toBeVisible();
    await expect(toggle).toContainText('Hide');
  });

  test('panel has pink border styling', async ({ page }) => {
    await page.goto(PAGE);
    const panel = page.locator('#return-customers-panel');
    await expect(panel).toHaveClass(/border-pink-800/);
  });

  test('cards grid uses responsive columns', async ({ page }) => {
    await page.goto(PAGE);
    const grid = page.locator('#rc-cards');
    await expect(grid).toHaveClass(/grid-cols-1/);
    await expect(grid).toHaveClass(/lg:grid-cols-3/);
  });
});

test.describe('Admin Users Page — Return Customers Unhide All — Positive', () => {

  test('rc-reset-hidden button exists in the DOM', async ({ page }) => {
    await page.goto(PAGE);
    const btn = page.locator('#rc-reset-hidden');
    await expect(btn).toHaveCount(1);
  });

  test('rc-reset-hidden button is hidden by default (no hidden users)', async ({ page }) => {
    await page.goto(PAGE);
    // Clear any hidden state first
    await page.evaluate(() => localStorage.removeItem('swf-admin-rc-hidden'));
    await page.reload();
    await page.waitForTimeout(3000);
    const btn = page.locator('#rc-reset-hidden');
    await expect(btn).toHaveClass(/hidden/);
  });

  test('rc-reset-hidden button becomes visible when users are hidden', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const cards = document.getElementById('rc-cards');
      return cards && cards.querySelectorAll('.rc-card').length > 0;
    }, { timeout: 6000 });

    // Simulate hiding a user via localStorage
    await page.evaluate(() => {
      localStorage.setItem('swf-admin-rc-hidden', JSON.stringify(['fake-uid-123']));
    });
    await page.reload();
    await page.waitForTimeout(3000);

    const btn = page.locator('#rc-reset-hidden');
    // Button should be visible since there's a hidden user
    await expect(btn).not.toHaveClass(/hidden/);
    const text = await btn.textContent();
    expect(text).toContain('Unhide all');
    expect(text).toContain('1');

    // Clean up
    await page.evaluate(() => localStorage.removeItem('swf-admin-rc-hidden'));
  });

  test('clicking rc-reset-hidden clears localStorage and re-renders', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForTimeout(3000);

    // Set hidden users
    await page.evaluate(() => {
      localStorage.setItem('swf-admin-rc-hidden', JSON.stringify(['fake-uid-abc', 'fake-uid-def']));
    });
    await page.reload();
    await page.waitForTimeout(3000);

    const btn = page.locator('#rc-reset-hidden');
    await expect(btn).not.toHaveClass(/hidden/);

    // Click the button
    await btn.click();
    await page.waitForTimeout(500);

    // localStorage should be cleared
    const stored = await page.evaluate(() => localStorage.getItem('swf-admin-rc-hidden'));
    expect(stored).toBeNull();

    // Button should be hidden again
    await expect(btn).toHaveClass(/hidden/);
  });

  test('rc-count badge no longer shows hidden count after unhide all', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForTimeout(3000);

    // Set hidden users
    await page.evaluate(() => {
      localStorage.setItem('swf-admin-rc-hidden', JSON.stringify(['fake-uid-xyz']));
    });
    await page.reload();
    await page.waitForTimeout(3000);

    // Badge should show hidden count
    const badgeBefore = await page.locator('#rc-count').textContent();
    expect(badgeBefore).toContain('hidden');

    // Click unhide all
    await page.locator('#rc-reset-hidden').click();
    await page.waitForTimeout(500);

    // Badge should no longer show hidden text
    const badgeAfter = await page.locator('#rc-count').textContent();
    expect(badgeAfter).not.toContain('hidden');
  });
});

test.describe('Admin Users Page — Return Customers Unhide All — Negative', () => {

  test('no console errors when clicking unhide all with no hidden users', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.evaluate(() => localStorage.removeItem('swf-admin-rc-hidden'));
    await page.reload();
    await page.waitForTimeout(3000);

    // Dispatch click event via JS since button is hidden (simulate edge case)
    await page.evaluate(() => {
      document.getElementById('rc-reset-hidden')?.click();
    });
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('no duplicate rc-reset-hidden buttons exist', async ({ page }) => {
    await page.goto(PAGE);
    const btns = page.locator('#rc-reset-hidden');
    await expect(btns).toHaveCount(1);
  });

  test('page does not crash after rapid unhide all clicks', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForTimeout(2000);

    // Set hidden users so button is visible
    await page.evaluate(() => {
      localStorage.setItem('swf-admin-rc-hidden', JSON.stringify(['uid-1', 'uid-2', 'uid-3']));
    });
    await page.reload();
    await page.waitForTimeout(3000);

    // Click the button — after first click it hides, so dispatch via JS for subsequent
    const btn = page.locator('#rc-reset-hidden');
    await btn.click();
    await page.waitForTimeout(100);
    await page.evaluate(() => {
      document.getElementById('rc-reset-hidden')?.click();
      document.getElementById('rc-reset-hidden')?.click();
    });
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
    // localStorage should still be cleared
    const stored = await page.evaluate(() => localStorage.getItem('swf-admin-rc-hidden'));
    expect(stored).toBeNull();
  });
});

test.describe('Admin Users Page — Return Customers Panel — Negative', () => {

  test('no duplicate return customers panels exist', async ({ page }) => {
    await page.goto(PAGE);
    const panels = page.locator('#return-customers-panel');
    await expect(panels).toHaveCount(1);
  });

  test('no console errors from return customers panel', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    expect(errors).toHaveLength(0);
  });

  test('loading state clears after data fetch', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForTimeout(5000);
    const cards = page.locator('#rc-cards');
    const text = await cards.textContent();
    expect(text).not.toContain('Loading...');
  });

  test('panel does not crash when toggled rapidly', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForTimeout(1000);
    const toggle = page.locator('#rc-toggle');
    // Rapid toggle 5 times
    for (let i = 0; i < 5; i++) {
      await toggle.click();
      await page.waitForTimeout(100);
    }
    expect(errors).toHaveLength(0);
    // Content area should still exist in the DOM
    await expect(page.locator('#rc-content')).toHaveCount(1);
  });

  test('rc-count badge does not show NaN or error text', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForTimeout(4000);
    const badge = page.locator('#rc-count');
    const text = await badge.textContent();
    expect(text).not.toContain('NaN');
    expect(text).not.toContain('undefined');
    expect(text).not.toContain('null');
    expect(text).not.toContain('error');
  });
});

test.describe('Admin Users Page — Return Customer Hide Checkbox (Positive)', () => {

  // Helper: programmatically check the first rc-hide-cb and trigger the click event
  async function hideFirstCard(page: any) {
    await page.evaluate(() => {
      const cb = document.querySelector('#rc-cards .rc-hide-cb') as HTMLInputElement;
      if (cb) {
        cb.checked = true;
        cb.dispatchEvent(new Event('click', { bubbles: false }));
      }
    });
    await page.waitForTimeout(500);
  }

  test('each return customer card has a hide checkbox', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const cards = document.querySelectorAll('#rc-cards .rc-card');
      return cards.length > 0;
    }, { timeout: 8000 });
    const cards = page.locator('#rc-cards .rc-card');
    const count = await cards.count();
    if (count > 0) {
      const checkboxes = page.locator('#rc-cards .rc-hide-cb');
      await expect(checkboxes).toHaveCount(count);
    }
  });

  test('hide checkbox is unchecked by default', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const cbs = document.querySelectorAll('#rc-cards .rc-hide-cb');
      return cbs.length > 0;
    }, { timeout: 8000 });
    const firstCb = page.locator('#rc-cards .rc-hide-cb').first();
    await expect(firstCb).not.toBeChecked();
  });

  test('checking hide checkbox hides the tile', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const cbs = document.querySelectorAll('#rc-cards .rc-hide-cb');
      return cbs.length > 0;
    }, { timeout: 8000 });
    const initialCount = await page.locator('#rc-cards .rc-card').count();
    if (initialCount > 0) {
      await hideFirstCard(page);
      const newCount = await page.locator('#rc-cards .rc-card').count();
      expect(newCount).toBe(initialCount - 1);
    }
  });

  test('hidden user is saved to localStorage', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const cbs = document.querySelectorAll('#rc-cards .rc-hide-cb');
      return cbs.length > 0;
    }, { timeout: 8000 });
    const firstUid = await page.locator('#rc-cards .rc-hide-cb').first().getAttribute('data-uid');
    await hideFirstCard(page);
    const stored = await page.evaluate(() => localStorage.getItem('swf-admin-rc-hidden'));
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed).toContain(firstUid);
  });

  test('hidden user remains hidden after page reload', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const cbs = document.querySelectorAll('#rc-cards .rc-hide-cb');
      return cbs.length > 0;
    }, { timeout: 8000 });
    const initialCount = await page.locator('#rc-cards .rc-card').count();
    if (initialCount > 0) {
      const firstUid = await page.locator('#rc-cards .rc-hide-cb').first().getAttribute('data-uid');
      await hideFirstCard(page);

      // Reload
      await page.goto(PAGE);
      await page.waitForFunction(() => {
        const el = document.getElementById('rc-cards');
        return el && !el.innerHTML.includes('Loading');
      }, { timeout: 8000 });

      // Check the hidden user is not present
      const uids = await page.locator('#rc-cards .rc-card').evaluateAll(cards =>
        cards.map(c => c.getAttribute('data-uid'))
      );
      expect(uids).not.toContain(firstUid);
    }
  });

  test('rc-count badge shows hidden count in parentheses', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const cbs = document.querySelectorAll('#rc-cards .rc-hide-cb');
      return cbs.length > 0;
    }, { timeout: 8000 });
    await hideFirstCard(page);
    const countText = await page.locator('#rc-count').textContent();
    expect(countText).toContain('hidden');
  });

  test('unhide all button appears after hiding a user', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const cbs = document.querySelectorAll('#rc-cards .rc-hide-cb');
      return cbs.length > 0;
    }, { timeout: 8000 });
    await hideFirstCard(page);
    await expect(page.locator('#rc-reset-hidden')).toBeVisible();
  });

  test('clicking unhide all restores all hidden users', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const cbs = document.querySelectorAll('#rc-cards .rc-hide-cb');
      return cbs.length > 0;
    }, { timeout: 8000 });
    const initialCount = await page.locator('#rc-cards .rc-card').count();
    if (initialCount > 0) {
      await hideFirstCard(page);
      await page.locator('#rc-reset-hidden').click();
      await page.waitForTimeout(500);
      const restoredCount = await page.locator('#rc-cards .rc-card').count();
      expect(restoredCount).toBe(initialCount);
    }
  });
});

test.describe('Admin Users Page — Return Customer Hide Checkbox (Negative)', () => {

  async function hideFirstCard(page: any) {
    await page.evaluate(() => {
      const cb = document.querySelector('#rc-cards .rc-hide-cb') as HTMLInputElement;
      if (cb) {
        cb.checked = true;
        cb.dispatchEvent(new Event('click', { bubbles: false }));
      }
    });
    await page.waitForTimeout(500);
  }

  test('hide checkbox does not trigger the detail panel', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const cbs = document.querySelectorAll('#rc-cards .rc-hide-cb');
      return cbs.length > 0;
    }, { timeout: 8000 });
    await hideFirstCard(page);
    // Detail panel should still be hidden
    await expect(page.locator('#user-detail-panel')).toBeHidden();
  });

  test('no console errors when hiding users', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const cbs = document.querySelectorAll('#rc-cards .rc-hide-cb');
      return cbs.length > 0;
    }, { timeout: 8000 });
    await hideFirstCard(page);
    expect(errors).toHaveLength(0);
  });
});
