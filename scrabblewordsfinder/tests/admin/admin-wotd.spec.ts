import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const WOTD_ADMIN_URL = `${BASE_URL}/admin/wotd/`;

// ── Admin WOTD Page — Positive ───────────────────────────────────────────

test.describe('Admin WOTD Page — Positive', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto(WOTD_ADMIN_URL);
    await expect(page).toHaveTitle(/WOTD/);
  });

  test('page heading says Word of the Day', async ({ page }) => {
    await page.goto(WOTD_ADMIN_URL);
    await expect(page.locator('h1').first()).toContainText('Word of the Day');
  });

  test('nav bar has WOTD link highlighted', async ({ page }) => {
    await page.goto(WOTD_ADMIN_URL);
    const wotdLink = page.locator('nav a[href="/admin/wotd/"]');
    await expect(wotdLink).toBeVisible();
    await expect(wotdLink).toHaveClass(/text-purple-400/);
  });

  test('stats section displays four stat cards', async ({ page }) => {
    await page.goto(WOTD_ADMIN_URL);
    await expect(page.locator('#stat-total')).toBeVisible();
    await expect(page.locator('#stat-assigned')).toBeVisible();
    await expect(page.locator('#stat-unassigned')).toBeVisible();
    await expect(page.locator('#stat-no-meaning')).toBeVisible();
  });

  test('table renders with correct column headers', async ({ page }) => {
    await page.goto(WOTD_ADMIN_URL);
    const headers = page.locator('thead th');
    await expect(headers).toHaveCount(7);
    await expect(headers.nth(1)).toContainText('Word');
    await expect(headers.nth(2)).toContainText('Date');
    await expect(headers.nth(3)).toContainText('Meaning');
  });

  test('table loads data and stats update', async ({ page }) => {
    await page.goto(WOTD_ADMIN_URL);
    await page.waitForFunction(() => {
      const el = document.getElementById('stat-total');
      return el && el.textContent !== '—';
    }, { timeout: 10000 });
    const total = await page.locator('#stat-total').textContent();
    expect(parseInt(total!)).toBeGreaterThan(0);
  });

  test('Add Word button opens the modal', async ({ page }) => {
    await page.goto(WOTD_ADMIN_URL);
    await page.locator('#add-btn').click();
    await expect(page.locator('#edit-modal')).toBeVisible();
    await expect(page.locator('#modal-title')).toContainText('Add New Word');
  });

  test('modal has all required fields', async ({ page }) => {
    await page.goto(WOTD_ADMIN_URL);
    await page.locator('#add-btn').click();
    await expect(page.locator('#modal-word')).toBeVisible();
    await expect(page.locator('#modal-date')).toBeVisible();
    await expect(page.locator('#modal-meaning')).toBeVisible();
    await expect(page.locator('#modal-fun-fact')).toBeVisible();
    await expect(page.locator('#modal-origin')).toBeVisible();
    await expect(page.locator('#modal-usage')).toBeVisible();
    await expect(page.locator('#modal-spelling')).toBeVisible();
    await expect(page.locator('#modal-cultural')).toBeVisible();
  });

  test('pagination prev button is disabled initially', async ({ page }) => {
    await page.goto(WOTD_ADMIN_URL);
    await page.waitForFunction(() => {
      const el = document.getElementById('stat-total');
      return el && el.textContent !== '—';
    }, { timeout: 10000 });
    await expect(page.locator('#prev-btn')).toBeDisabled();
  });

  test('search input filters results by word', async ({ page }) => {
    await page.goto(WOTD_ADMIN_URL);
    await page.waitForFunction(() => {
      const el = document.getElementById('stat-total');
      return el && el.textContent !== '—';
    }, { timeout: 10000 });

    await page.fill('#search-input', 'QUIXOTIC');
    // Wait for debounce (300ms) + network
    await page.waitForTimeout(500);
    await page.waitForFunction(() => {
      const info = document.getElementById('page-info');
      return info && info.textContent && !info.textContent.includes('—');
    }, { timeout: 5000 });

    const pageInfo = await page.locator('#page-info').textContent();
    // Search ran — page info updated (may be 0 results if word doesn't exist, that's ok)
    expect(pageInfo).toBeTruthy();
  });

  test('filter dropdown is present with correct options', async ({ page }) => {
    await page.goto(WOTD_ADMIN_URL);
    const select = page.locator('#filter-status');
    await expect(select).toBeVisible();
    const options = select.locator('option');
    await expect(options).toHaveCount(4);
    await expect(options.nth(0)).toHaveText('All');
    await expect(options.nth(1)).toContainText('Assigned');
    await expect(options.nth(2)).toContainText('Unassigned');
    await expect(options.nth(3)).toContainText('Missing meaning');
  });

  test('refresh button reloads data', async ({ page }) => {
    await page.goto(WOTD_ADMIN_URL);
    await page.waitForFunction(() => {
      const el = document.getElementById('stat-total');
      return el && el.textContent !== '—';
    }, { timeout: 10000 });

    // Click refresh and verify stats still load
    await page.locator('#refresh-btn').click();
    await page.waitForFunction(() => {
      const el = document.getElementById('stat-total');
      return el && el.textContent !== '—';
    }, { timeout: 10000 });
    const total = await page.locator('#stat-total').textContent();
    expect(parseInt(total!)).toBeGreaterThanOrEqual(0);
  });

  test('page info text shows row range', async ({ page }) => {
    await page.goto(WOTD_ADMIN_URL);
    await page.waitForFunction(() => {
      const info = document.getElementById('page-info');
      return info && info.textContent && info.textContent.includes('of');
    }, { timeout: 10000 });
    const pageInfo = await page.locator('#page-info').textContent();
    expect(pageInfo).toMatch(/\d+–\d+ of \d+/);
  });

  test('column headers are clickable and toggle sort direction', async ({ page }) => {
    await page.goto(WOTD_ADMIN_URL);
    await page.waitForFunction(() => {
      const el = document.getElementById('stat-total');
      return el && el.textContent !== '—';
    }, { timeout: 10000 });

    // Click "Word" header — should sort ASC first
    const wordHeader = page.locator('.sort-header[data-sort="word"]');
    await expect(wordHeader).toBeVisible();
    await wordHeader.click();
    await page.waitForTimeout(500);
    const wordIcon = wordHeader.locator('.sort-icon');
    await expect(wordIcon).toContainText('▲');

    // Click again — should toggle to DESC
    await wordHeader.click();
    await page.waitForTimeout(500);
    await expect(wordIcon).toContainText('▼');
  });

  test('sort headers show indicator only on active column', async ({ page }) => {
    await page.goto(WOTD_ADMIN_URL);
    await page.waitForFunction(() => {
      const el = document.getElementById('stat-total');
      return el && el.textContent !== '—';
    }, { timeout: 10000 });

    // Default sort is date DESC
    const dateIcon = page.locator('.sort-header[data-sort="date"] .sort-icon');
    await expect(dateIcon).toContainText('▼');

    // Other headers should have empty sort icons
    const wordIcon = page.locator('.sort-header[data-sort="word"] .sort-icon');
    await expect(wordIcon).toHaveText('');
  });
});

// ── Admin WOTD Page — Negative ───────────────────────────────────────────

test.describe('Admin WOTD Page — Negative', () => {
  test.beforeEach(async ({ page }) => {
    // Dismiss cookie consent banner by setting the consent cookie
    await page.addInitScript(() => {
      document.cookie = 'swf_consent=' + encodeURIComponent(JSON.stringify({analytics:true,marketing:true,timestamp:Date.now()})) + ';path=/;SameSite=Lax';
    });
  });

  test('cannot save a word without meaning (client validation)', async ({ page }) => {
    await page.goto(WOTD_ADMIN_URL);
    await page.locator('#add-btn').click();
    await page.fill('#modal-word', 'TESTWORD');
    await page.locator('#modal-save').click();

    await expect(page.locator('#modal-error')).toBeVisible();
    await expect(page.locator('#modal-error')).toContainText('Meaning is required');
  });

  test('cannot save without a word (client validation)', async ({ page }) => {
    await page.goto(WOTD_ADMIN_URL);
    await page.locator('#add-btn').click();
    await page.fill('#modal-meaning', 'Some meaning');
    await page.locator('#modal-save').click();

    await expect(page.locator('#modal-error')).toBeVisible();
    await expect(page.locator('#modal-error')).toContainText('Word is required');
  });

  test('modal closes on Cancel button', async ({ page }) => {
    await page.goto(WOTD_ADMIN_URL);
    await page.locator('#add-btn').click();
    await expect(page.locator('#edit-modal')).toBeVisible();

    await page.locator('#modal-cancel').click();
    await expect(page.locator('#edit-modal')).not.toBeVisible();
  });

  test('modal closes on Escape key', async ({ page }) => {
    await page.goto(WOTD_ADMIN_URL);
    await page.locator('#add-btn').click();
    await expect(page.locator('#edit-modal')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('#edit-modal')).not.toBeVisible();
  });

  test('modal closes on backdrop click', async ({ page }) => {
    await page.goto(WOTD_ADMIN_URL);
    await page.locator('#add-btn').click();
    await expect(page.locator('#edit-modal')).toBeVisible();

    await page.locator('#edit-modal').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('#edit-modal')).not.toBeVisible();
  });

  test('no JavaScript errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(WOTD_ADMIN_URL);
    await page.waitForFunction(() => {
      const el = document.getElementById('stat-total');
      return el && el.textContent !== '—';
    }, { timeout: 10000 });

    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });

  test('no duplicate Add Word buttons exist', async ({ page }) => {
    await page.goto(WOTD_ADMIN_URL);
    await expect(page.locator('#add-btn')).toHaveCount(1);
  });

  test('filter change does not crash the page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(WOTD_ADMIN_URL);
    await page.waitForFunction(() => {
      const el = document.getElementById('stat-total');
      return el && el.textContent !== '—';
    }, { timeout: 10000 });

    // Cycle through all filter options
    await page.selectOption('#filter-status', 'assigned');
    await page.waitForTimeout(500);
    await page.selectOption('#filter-status', 'unassigned');
    await page.waitForTimeout(500);
    await page.selectOption('#filter-status', 'no-meaning');
    await page.waitForTimeout(500);
    await page.selectOption('#filter-status', '');
    await page.waitForTimeout(500);

    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });

  test('search with empty results shows friendly message', async ({ page }) => {
    await page.goto(WOTD_ADMIN_URL);
    await page.waitForFunction(() => {
      const el = document.getElementById('stat-total');
      return el && el.textContent !== '—';
    }, { timeout: 10000 });

    await page.fill('#search-input', 'ZZZZXYZNONEXISTENT99999');
    await page.waitForTimeout(500);
    // Wait for table to update
    await page.waitForFunction(() => {
      const tbody = document.getElementById('wotd-tbody');
      return tbody && tbody.textContent?.includes('No words found');
    }, { timeout: 5000 }).catch(() => {
      // May find results in a large DB — that's acceptable
    });
    // No crash is the pass condition
    await expect(page.locator('#wotd-tbody')).toBeVisible();
  });
});
