import { test, expect } from '@playwright/test';

const PAGE = '/admin/stars-and-diamonds/';
const ADMIN = '/admin/';

test.describe('Stars & Diamonds Admin — Positive', () => {

  test('page loads successfully with 200 status', async ({ page }) => {
    const response = await page.goto(PAGE);
    expect(response?.status()).toBe(200);
  });

  test('h1 title is visible and correct', async ({ page }) => {
    await page.goto(PAGE);
    const h1 = page.getByRole('heading', { name: '⭐ Stars & Diamonds' });
    await expect(h1).toBeVisible();
  });

  test('summary stats section has 4 stat boxes', async ({ page }) => {
    await page.goto(PAGE);
    const stats = page.locator('#summary-stats > div');
    await expect(stats).toHaveCount(4);
  });

  test('table is present with correct headers', async ({ page }) => {
    await page.goto(PAGE);
    const table = page.locator('table');
    await expect(table).toBeVisible();
    await expect(table.locator('th')).toHaveCount(10);
    await expect(table.locator('th').nth(1)).toContainText('User ID');
    await expect(table.locator('th').nth(2)).toContainText('Stars');
    await expect(table.locator('th').nth(3)).toContainText('Diamonds');
  });

  test('table loads data from API (rows appear or shows no data)', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const tbody = document.getElementById('rewards-tbody');
      return tbody && !tbody.textContent.includes('Loading...');
    }, { timeout: 5000 });
    const tbody = page.locator('#rewards-tbody');
    const text = await tbody.textContent();
    // Should either have user rows or "No data yet." — not "Loading..."
    expect(text).not.toContain('Loading...');
  });

  test('admin dashboard has Stars & Diamonds tile', async ({ page }) => {
    await page.goto(ADMIN);
    const tile = page.locator('a[href="/admin/stars-and-diamonds/"]');
    await expect(tile).toBeVisible();
    await expect(tile).toContainText('Stars & Diamonds');
  });

  test('tile click navigates to stars-and-diamonds page', async ({ page }) => {
    await page.goto(ADMIN);
    await page.locator('a[href="/admin/stars-and-diamonds/"]').click();
    await page.waitForURL('**/admin/stars-and-diamonds/**');
    await expect(page.getByRole('heading', { name: '⭐ Stars & Diamonds' })).toBeVisible();
  });

  test('noindex meta tag present', async ({ page }) => {
    await page.goto(PAGE);
    const meta = page.locator('meta[name="robots"]');
    await expect(meta).toHaveAttribute('content', /noindex/);
  });
});

test.describe('Stars & Diamonds Admin — Sortable Column Headers', () => {

  const sortableColumns = [
    { sort: 'user_id', label: 'User ID' },
    { sort: 'total_stars', label: 'Stars' },
    { sort: 'total_diamonds', label: 'Diamonds' },
    { sort: 'bonus_diamonds', label: 'Bonus' },
    { sort: 'current_streak', label: 'Streak' },
    { sort: 'best_streak', label: 'Best' },
    { sort: 'diamond_streak', label: 'D-Streak' },
    { sort: 'last_active_date', label: 'Last Active' },
    { sort: 'created_at', label: 'Joined' },
  ];

  test('all 9 sortable column headers have data-sort attribute', async ({ page }) => {
    await page.goto(PAGE);
    const sortableHeaders = page.locator('th[data-sort]');
    await expect(sortableHeaders).toHaveCount(9);
  });

  test('each sortable header has a sort-arrow span', async ({ page }) => {
    await page.goto(PAGE);
    for (const col of sortableColumns) {
      const th = page.locator(`th[data-sort="${col.sort}"]`);
      await expect(th.locator('.sort-arrow')).toBeVisible();
    }
  });

  test('sortable headers have cursor-pointer class', async ({ page }) => {
    await page.goto(PAGE);
    for (const col of sortableColumns) {
      const th = page.locator(`th[data-sort="${col.sort}"]`);
      await expect(th).toHaveClass(/cursor-pointer/);
    }
  });

  test('sortable headers have hover:text-amber-400 class', async ({ page }) => {
    await page.goto(PAGE);
    for (const col of sortableColumns) {
      const th = page.locator(`th[data-sort="${col.sort}"]`);
      await expect(th).toHaveClass(/hover:text-amber-400/);
    }
  });

  test('sortable headers have select-none class to prevent text selection', async ({ page }) => {
    await page.goto(PAGE);
    for (const col of sortableColumns) {
      const th = page.locator(`th[data-sort="${col.sort}"]`);
      await expect(th).toHaveClass(/select-none/);
    }
  });

  test('# column header is NOT sortable (no data-sort)', async ({ page }) => {
    await page.goto(PAGE);
    const firstTh = page.locator('thead th').first();
    await expect(firstTh).not.toHaveAttribute('data-sort');
    await expect(firstTh).toContainText('#');
  });

  test('clicking a sortable header does not crash the page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForTimeout(1000);
    // Click the Stars header
    await page.locator('th[data-sort="total_stars"]').click();
    await page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('data-align attributes match expected alignment', async ({ page }) => {
    await page.goto(PAGE);
    // Left-aligned columns
    await expect(page.locator('th[data-sort="user_id"]')).toHaveAttribute('data-align', 'left');
    await expect(page.locator('th[data-sort="last_active_date"]')).toHaveAttribute('data-align', 'left');
    await expect(page.locator('th[data-sort="created_at"]')).toHaveAttribute('data-align', 'left');
    // Center-aligned columns
    await expect(page.locator('th[data-sort="total_stars"]')).toHaveAttribute('data-align', 'center');
    await expect(page.locator('th[data-sort="total_diamonds"]')).toHaveAttribute('data-align', 'center');
    await expect(page.locator('th[data-sort="bonus_diamonds"]')).toHaveAttribute('data-align', 'center');
  });

  test('clicking a header shows sort arrow indicator', async ({ page }) => {
    await page.goto(PAGE);
    // Wait for data to load
    await page.waitForFunction(() => {
      const tbody = document.getElementById('rewards-tbody');
      return tbody && !tbody.textContent?.includes('Loading...');
    }, { timeout: 5000 });
    // Click Stars header
    const starsHeader = page.locator('th[data-sort="total_stars"]');
    await starsHeader.click();
    const arrow = starsHeader.locator('.sort-arrow');
    const arrowText = await arrow.textContent();
    // Should show either ▲ or ▼
    expect(arrowText?.trim()).toMatch(/[▲▼]/);
  });

  test('clicking same header twice toggles sort direction', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const tbody = document.getElementById('rewards-tbody');
      return tbody && !tbody.textContent?.includes('Loading...');
    }, { timeout: 5000 });
    const starsHeader = page.locator('th[data-sort="total_stars"]');
    // First click — descending for numeric columns
    await starsHeader.click();
    const firstArrow = await starsHeader.locator('.sort-arrow').textContent();
    // Second click — toggles direction
    await starsHeader.click();
    const secondArrow = await starsHeader.locator('.sort-arrow').textContent();
    expect(firstArrow?.trim()).not.toBe(secondArrow?.trim());
  });

  test('clicking a different header moves the active sort indicator', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const tbody = document.getElementById('rewards-tbody');
      return tbody && !tbody.textContent?.includes('Loading...');
    }, { timeout: 5000 });
    // Click Stars
    await page.locator('th[data-sort="total_stars"]').click();
    // Click Diamonds
    await page.locator('th[data-sort="total_diamonds"]').click();
    // Stars arrow should be empty now
    const starsArrow = await page.locator('th[data-sort="total_stars"] .sort-arrow').textContent();
    expect(starsArrow?.trim()).toBe('');
    // Diamonds arrow should have an indicator
    const diamondsArrow = await page.locator('th[data-sort="total_diamonds"] .sort-arrow').textContent();
    expect(diamondsArrow?.trim()).toMatch(/[▲▼]/);
  });

  test('active sorted header gets text-amber-400 class', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForFunction(() => {
      const tbody = document.getElementById('rewards-tbody');
      return tbody && !tbody.textContent?.includes('Loading...');
    }, { timeout: 5000 });
    await page.locator('th[data-sort="total_stars"]').click();
    await expect(page.locator('th[data-sort="total_stars"]')).toHaveClass(/text-amber-400/);
  });
});

test.describe('Stars & Diamonds Admin — Negative', () => {

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(PAGE);
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('no duplicate Stars & Diamonds tiles on admin dashboard', async ({ page }) => {
    await page.goto(ADMIN);
    const tiles = page.locator('a[href="/admin/stars-and-diamonds/"]');
    await expect(tiles).toHaveCount(1);
  });

  test('summary stat values update after API response', async ({ page }) => {
    await page.goto(PAGE);
    // Wait for the fetch to complete (stats update from "—" to a value)
    await page.waitForTimeout(3000);
    const users = await page.locator('#stat-users').textContent();
    // Should be a number (even "0" is valid — means the API responded)
    expect(users?.trim()).toMatch(/^\d+$/);
  });

  test('table does not show error state on valid load', async ({ page }) => {
    await page.goto(PAGE);
    await page.waitForTimeout(3000);
    const text = await page.locator('#rewards-tbody').textContent();
    expect(text).not.toContain('Failed to load');
  });
});
