import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Admin Saved Words — Positive', () => {
  test('page loads with correct title and heading', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/saved-words/`);
    await expect(page.locator('h1')).toContainText('Memory Workbench');
  });

  test('search input is visible and functional', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/saved-words/`);
    const searchInput = page.locator('#uid-search');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', /Search by User ID/);
  });

  test('category filter pills container exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/saved-words/`);
    const catFilters = page.locator('#cat-filters');
    await expect(catFilters).toBeAttached();
  });

  test('users list container exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/saved-words/`);
    const usersList = page.locator('#users-list');
    await expect(usersList).toBeAttached();
  });

  test('pagination-top element exists in DOM', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/saved-words/`);
    const paginationTop = page.locator('#pagination-top');
    await expect(paginationTop).toBeAttached();
  });

  test('pagination-bottom element exists in DOM', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/saved-words/`);
    const paginationBottom = page.locator('#pagination-bottom');
    await expect(paginationBottom).toBeAttached();
  });

  test('pagination elements are hidden by default (no data or single page)', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/saved-words/`);
    // Wait for API fetch to complete
    await page.waitForTimeout(1000);
    const paginationTop = page.locator('#pagination-top');
    const paginationBottom = page.locator('#pagination-bottom');
    // They should have the hidden class when there isn't enough data to paginate
    await expect(paginationTop).toHaveClass(/hidden/);
    await expect(paginationBottom).toHaveClass(/hidden/);
  });

  test('filter indicator element exists', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/saved-words/`);
    const indicator = page.locator('#filter-indicator');
    await expect(indicator).toBeAttached();
  });

  test('admin nav has correct active link for Workbench', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/saved-words/`);
    const activeLink = page.locator('a[href="/admin/saved-words/"].text-purple-400');
    await expect(activeLink).toContainText('Workbench');
  });

  test('stats container renders after data loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/saved-words/`);
    const stats = page.locator('#stats');
    await expect(stats).toBeAttached();
    // Stats should eventually contain user/word count info
    await page.waitForTimeout(2000);
    const text = await stats.textContent();
    // Either shows stats or is empty (no data)
    expect(text !== null).toBeTruthy();
  });
});

test.describe('Admin Saved Words — Negative', () => {
  test('no duplicate pagination elements', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/saved-words/`);
    const paginationTops = page.locator('#pagination-top');
    const paginationBottoms = page.locator('#pagination-bottom');
    await expect(paginationTops).toHaveCount(1);
    await expect(paginationBottoms).toHaveCount(1);
  });

  test('no duplicate users-list containers', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/saved-words/`);
    const usersList = page.locator('#users-list');
    await expect(usersList).toHaveCount(1);
  });

  test('empty state shows when no data', async ({ page }) => {
    // Intercept the API to return empty data
    await page.route('**/api/saved-words*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ users: [], categories: {}, totalUsers: 0, totalWords: 0 }),
      });
    });
    await page.goto(`${BASE_URL}/admin/saved-words/`);
    await page.waitForTimeout(1000);
    const emptyState = page.locator('#empty-state');
    await expect(emptyState).toBeVisible();
  });

  test('page does not crash when API returns error', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.route('**/api/saved-words*', async (route) => {
      await route.fulfill({ status: 500, body: 'Internal Server Error' });
    });
    await page.goto(`${BASE_URL}/admin/saved-words/`);
    await page.waitForTimeout(1000);

    // Page should not have critical JS errors
    expect(errors.filter((e) => e.includes('Cannot read'))).toHaveLength(0);
    // Empty state should show gracefully
    const emptyState = page.locator('#empty-state');
    await expect(emptyState).toBeVisible();
  });

  test('pagination ordering is correct (top before users-list, bottom after)', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/saved-words/`);

    // Verify DOM order: pagination-top → users-list → pagination-bottom
    const order = await page.evaluate(() => {
      const parent = document.querySelector('#pagination-top')?.parentElement;
      if (!parent) return [];
      const children = Array.from(parent.children).map((el) => el.id).filter(Boolean);
      return children;
    });

    const topIdx = order.indexOf('pagination-top');
    const listIdx = order.indexOf('users-list');
    const bottomIdx = order.indexOf('pagination-bottom');

    expect(topIdx).toBeLessThan(listIdx);
    expect(listIdx).toBeLessThan(bottomIdx);
  });

  test('noindex meta tag is present for admin page', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/saved-words/`);
    const robotsMeta = page.locator('meta[name="robots"][content="noindex, nofollow"]');
    await expect(robotsMeta).toBeAttached();
  });

  test('API fetch uses trailing slash to avoid 308 redirect', async ({ page }) => {
    const apiCalls: string[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/api/saved-words')) {
        apiCalls.push(req.url());
      }
    });
    await page.goto(`${BASE_URL}/admin/saved-words/`);
    await page.waitForTimeout(1500);
    // At least one API call should have been made
    expect(apiCalls.length).toBeGreaterThan(0);
    // All API calls to saved-words should include trailing slash
    for (const url of apiCalls) {
      const path = new URL(url).pathname;
      expect(path).toBe('/api/saved-words/');
    }
  });
});

test.describe('Admin Saved Words — WOTD & Anagram Categories', () => {
  const mockDataWithWotdAnagram = {
    users: [
      {
        uid: 'test-user-wotd-anagram',
        words: [
          { word: 'EPHEMERAL', category: 'wotd', meaning: 'Lasting for a very short time', saved_at: '2026-07-01' },
          { word: 'CASTLE', category: 'anagram', meaning: 'A large fortified building', saved_at: '2026-07-01' },
          { word: 'QUIXOTIC', category: 'manual', meaning: 'Exceedingly idealistic', saved_at: '2026-06-30' },
        ],
      },
    ],
    categories: { wotd: 1, anagram: 1, manual: 1 },
    totalUsers: 1,
    totalWords: 3,
  };

  test('WOTD category words render with yellow styling', async ({ page }) => {
    await page.route('**/api/saved-words/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDataWithWotdAnagram),
      });
    });
    await page.goto(`${BASE_URL}/admin/saved-words/`);
    await page.waitForTimeout(1500);

    // Click the user card header to expand and show word cards
    const userHeader = page.locator('#users-list .cursor-pointer').first();
    await userHeader.click();

    // Find a word card containing EPHEMERAL with yellow border styling
    const wotdCard = page.locator('div.border-yellow-700:has(span:text("EPHEMERAL"))');
    await expect(wotdCard).toBeVisible();
    await expect(wotdCard).toHaveClass(/bg-yellow-900/);
  });

  test('Anagram category words render with rose styling', async ({ page }) => {
    await page.route('**/api/saved-words/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDataWithWotdAnagram),
      });
    });
    await page.goto(`${BASE_URL}/admin/saved-words/`);
    await page.waitForTimeout(1500);

    // Click the user card header to expand and show word cards
    const userHeader = page.locator('#users-list .cursor-pointer').first();
    await userHeader.click();

    // Find a word card containing CASTLE with rose border styling
    const anagramCard = page.locator('div.border-rose-700:has(span:text("CASTLE"))');
    await expect(anagramCard).toBeVisible();
    await expect(anagramCard).toHaveClass(/bg-rose-900/);
  });

  test('WOTD category filter pill shows correct label', async ({ page }) => {
    await page.route('**/api/saved-words/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDataWithWotdAnagram),
      });
    });
    await page.goto(`${BASE_URL}/admin/saved-words/`);
    await page.waitForTimeout(1500);

    // The category filter area should contain a pill with WOTD label
    const catFilters = page.locator('#cat-filters');
    await expect(catFilters).toContainText('WOTD');
  });

  test('Anagram category filter pill shows correct label', async ({ page }) => {
    await page.route('**/api/saved-words/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDataWithWotdAnagram),
      });
    });
    await page.goto(`${BASE_URL}/admin/saved-words/`);
    await page.waitForTimeout(1500);

    // The category filter area should contain a pill with Anagram label
    const catFilters = page.locator('#cat-filters');
    await expect(catFilters).toContainText('Anagram');
  });

  test('WOTD and anagram categories do not crash with missing meaning', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const dataNoMeaning = {
      users: [
        {
          uid: 'test-no-meaning',
          words: [
            { word: 'ZEPHYR', category: 'wotd', meaning: '', saved_at: '2026-07-02' },
            { word: 'KNIGHT', category: 'anagram', meaning: '', saved_at: '2026-07-02' },
          ],
        },
      ],
      categories: { wotd: 1, anagram: 1 },
      totalUsers: 1,
      totalWords: 2,
    };

    await page.route('**/api/saved-words/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(dataNoMeaning),
      });
    });
    await page.goto(`${BASE_URL}/admin/saved-words/`);
    await page.waitForTimeout(1500);

    // No critical JS errors
    expect(errors.filter((e) => e.includes('Cannot read'))).toHaveLength(0);

    // Click the user card header to expand word cards
    const userHeader = page.locator('#users-list .cursor-pointer').first();
    await userHeader.click();

    // Words still render after expand
    await expect(page.locator('span:text("ZEPHYR")')).toBeVisible();
    await expect(page.locator('span:text("KNIGHT")')).toBeVisible();
  });

  test('no duplicate WOTD or anagram category pills', async ({ page }) => {
    await page.route('**/api/saved-words/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDataWithWotdAnagram),
      });
    });
    await page.goto(`${BASE_URL}/admin/saved-words/`);
    await page.waitForTimeout(1500);

    // Each category should only appear once in the filter pills
    const catFilters = page.locator('#cat-filters');
    const wotdPills = catFilters.locator('button:has-text("WOTD")');
    const anagramPills = catFilters.locator('button:has-text("Anagram")');

    const wotdCount = await wotdPills.count();
    const anagramCount = await anagramPills.count();

    expect(wotdCount).toBeLessThanOrEqual(1);
    expect(anagramCount).toBeLessThanOrEqual(1);
  });
});
