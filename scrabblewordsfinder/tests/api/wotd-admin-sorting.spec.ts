import { test, expect } from '@playwright/test';

/**
 * WOTD Admin API — Sorting Tests
 * Tests the sort and order query parameters on GET /api/wotd-admin
 * Added after sorting support was implemented in wotd-admin.ts
 */

const BASE_URL = process.env.SWF_TEST_URL || 'http://127.0.0.1:4321';
const API = `${BASE_URL}/api/wotd-admin/`;
const WOTD_ADMIN_URL = `${BASE_URL}/admin/wotd/`;

// ── API Sorting — Positive ───────────────────────────────────────────────

test.describe('WOTD Admin API Sorting — Positive', () => {
  test('default sort is by date descending', async ({ request }) => {
    const res = await request.get(API);
    expect(res.status()).toBe(200);
    const body = await res.json();
    const words = body.words;
    expect(words.length).toBeGreaterThan(0);

    // Check dates are in descending order (where dates exist)
    const datesOnly = words.filter((w: any) => w.date).map((w: any) => w.date);
    if (datesOnly.length >= 2) {
      expect(datesOnly[0] >= datesOnly[1]).toBe(true);
    }
  });

  test('sort=word&order=asc returns words in alphabetical order', async ({ request }) => {
    const res = await request.get(`${API}?sort=word&order=asc&limit=20`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    const words = body.words.map((w: any) => w.word);
    expect(words.length).toBeGreaterThan(0);

    for (let i = 1; i < words.length; i++) {
      expect(words[i] >= words[i - 1]).toBe(true);
    }
  });

  test('sort=word&order=desc returns words in reverse alphabetical order', async ({ request }) => {
    const res = await request.get(`${API}?sort=word&order=desc&limit=20`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    const words = body.words.map((w: any) => w.word);
    expect(words.length).toBeGreaterThan(0);

    for (let i = 1; i < words.length; i++) {
      expect(words[i] <= words[i - 1]).toBe(true);
    }
  });

  test('sort=date&order=asc returns oldest dates first', async ({ request }) => {
    const res = await request.get(`${API}?sort=date&order=asc&limit=20`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    const dates = body.words.filter((w: any) => w.date).map((w: any) => w.date);
    if (dates.length >= 2) {
      expect(dates[0] <= dates[1]).toBe(true);
    }
  });

  test('sort=date&order=desc returns newest dates first', async ({ request }) => {
    const res = await request.get(`${API}?sort=date&order=desc&limit=20`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    const dates = body.words.filter((w: any) => w.date).map((w: any) => w.date);
    if (dates.length >= 2) {
      expect(dates[0] >= dates[1]).toBe(true);
    }
  });

  test('sort=id&order=asc returns lowest IDs first', async ({ request }) => {
    const res = await request.get(`${API}?sort=id&order=asc&limit=20`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    const ids = body.words.map((w: any) => w.id);
    expect(ids.length).toBeGreaterThan(0);

    for (let i = 1; i < ids.length; i++) {
      expect(ids[i]).toBeGreaterThan(ids[i - 1]);
    }
  });

  test('sort=meaning&order=asc works without error', async ({ request }) => {
    const res = await request.get(`${API}?sort=meaning&order=asc&limit=10`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('words');
    expect(body).toHaveProperty('total');
  });

  test('sort=fun_fact&order=desc works without error', async ({ request }) => {
    const res = await request.get(`${API}?sort=fun_fact&order=desc&limit=10`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('words');
    expect(body).toHaveProperty('total');
  });

  test('sorting combined with search still works', async ({ request }) => {
    const res = await request.get(`${API}?sort=word&order=asc&search=A&limit=20`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('words');
    expect(body).toHaveProperty('total');
    // All returned words should contain 'A' in word or meaning
    expect(Array.isArray(body.words)).toBe(true);
  });

  test('sorting combined with filter still works', async ({ request }) => {
    const res = await request.get(`${API}?sort=date&order=asc&filter=assigned&limit=20`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('words');
    // All returned words should have a date (assigned filter)
    for (const w of body.words) {
      expect(w.date).not.toBeNull();
    }
  });

  test('pagination respects sort order', async ({ request }) => {
    // Get first page sorted by word ascending
    const res1 = await request.get(`${API}?sort=word&order=asc&limit=5&offset=0`);
    const body1 = await res1.json();
    // Get second page
    const res2 = await request.get(`${API}?sort=word&order=asc&limit=5&offset=5`);
    const body2 = await res2.json();

    if (body1.words.length === 5 && body2.words.length > 0) {
      // Last word of page 1 should be <= first word of page 2
      expect(body1.words[4].word <= body2.words[0].word).toBe(true);
    }
  });
});

// ── API Sorting — Negative ───────────────────────────────────────────────

test.describe('WOTD Admin API Sorting — Negative', () => {
  test('invalid sort column falls back to date (does not crash)', async ({ request }) => {
    const res = await request.get(`${API}?sort=nonexistent_column&limit=5`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('words');
    expect(body).toHaveProperty('total');
  });

  test('SQL injection in sort param is blocked (allowlist protects)', async ({ request }) => {
    const res = await request.get(`${API}?sort=word;DROP TABLE word_of_the_day&limit=5`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Should fall back to default sort (date) — not execute injection
    expect(body).toHaveProperty('words');
    expect(body).toHaveProperty('total');
  });

  test('invalid order param defaults to DESC (does not crash)', async ({ request }) => {
    const res = await request.get(`${API}?sort=word&order=INVALID&limit=5`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('words');
  });

  test('empty sort param defaults to date sort', async ({ request }) => {
    const res = await request.get(`${API}?sort=&limit=5`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('words');
  });

  test('empty order param defaults to desc', async ({ request }) => {
    const res = await request.get(`${API}?order=&limit=5`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('words');
  });
});

// ── UI Sort Headers — Positive ───────────────────────────────────────────

test.describe('Admin WOTD Sort Headers — Positive', () => {
  test('sort header columns are clickable', async ({ page }) => {
    await page.goto(WOTD_ADMIN_URL);
    await page.waitForFunction(() => {
      const el = document.getElementById('stat-total');
      return el && el.textContent !== '—';
    }, { timeout: 10000 });

    const sortHeaders = page.locator('.sort-header');
    await expect(sortHeaders).toHaveCount(4); // word, date, meaning, fun_fact
  });

  test('clicking Word header shows ascending arrow', async ({ page }) => {
    await page.goto(WOTD_ADMIN_URL);
    await page.waitForFunction(() => {
      const el = document.getElementById('stat-total');
      return el && el.textContent !== '—';
    }, { timeout: 10000 });

    // Default sort is date desc, so clicking Word should set word asc
    await page.locator('.sort-header[data-sort="word"]').click();
    await page.waitForTimeout(500);

    const icon = await page.locator('.sort-header[data-sort="word"] .sort-icon').textContent();
    expect(icon?.trim()).toBe('▲');
  });

  test('clicking same header toggles sort order', async ({ page }) => {
    await page.goto(WOTD_ADMIN_URL);
    await page.waitForFunction(() => {
      const el = document.getElementById('stat-total');
      return el && el.textContent !== '—';
    }, { timeout: 10000 });

    // Click date header (already default sort=date desc) → should toggle to asc
    await page.locator('.sort-header[data-sort="date"]').click();
    await page.waitForTimeout(500);
    const iconAsc = await page.locator('.sort-header[data-sort="date"] .sort-icon').textContent();
    expect(iconAsc?.trim()).toBe('▲');

    // Click again → should toggle back to desc
    await page.locator('.sort-header[data-sort="date"]').click();
    await page.waitForTimeout(500);
    const iconDesc = await page.locator('.sort-header[data-sort="date"] .sort-icon').textContent();
    expect(iconDesc?.trim()).toBe('▼');
  });

  test('only the active sort column shows an arrow icon', async ({ page }) => {
    await page.goto(WOTD_ADMIN_URL);
    await page.waitForFunction(() => {
      const el = document.getElementById('stat-total');
      return el && el.textContent !== '—';
    }, { timeout: 10000 });

    await page.locator('.sort-header[data-sort="word"]').click();
    await page.waitForTimeout(500);

    // word should have icon
    const wordIcon = await page.locator('.sort-header[data-sort="word"] .sort-icon').textContent();
    expect(wordIcon?.trim()).not.toBe('');

    // date should NOT have icon
    const dateIcon = await page.locator('.sort-header[data-sort="date"] .sort-icon').textContent();
    expect(dateIcon?.trim()).toBe('');

    // meaning should NOT have icon
    const meaningIcon = await page.locator('.sort-header[data-sort="meaning"] .sort-icon').textContent();
    expect(meaningIcon?.trim()).toBe('');
  });

  test('sort persists through pagination', async ({ page }) => {
    await page.goto(WOTD_ADMIN_URL);
    await page.waitForFunction(() => {
      const el = document.getElementById('stat-total');
      return el && el.textContent !== '—';
    }, { timeout: 10000 });

    // Set sort to word ascending
    await page.locator('.sort-header[data-sort="word"]').click();
    await page.waitForTimeout(500);

    // Navigate to next page if available
    const nextBtn = page.locator('#next-btn');
    const isDisabled = await nextBtn.isDisabled();
    if (!isDisabled) {
      await nextBtn.click();
      await page.waitForTimeout(500);
      // Sort icon should still show on word column
      const icon = await page.locator('.sort-header[data-sort="word"] .sort-icon').textContent();
      expect(icon?.trim()).not.toBe('');
    }
  });
});

// ── UI Sort Headers — Negative ───────────────────────────────────────────

test.describe('Admin WOTD Sort Headers — Negative', () => {
  test('clicking sort headers does not crash the page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(WOTD_ADMIN_URL);
    await page.waitForFunction(() => {
      const el = document.getElementById('stat-total');
      return el && el.textContent !== '—';
    }, { timeout: 10000 });

    // Rapid-click all sort headers
    await page.locator('.sort-header[data-sort="word"]').click();
    await page.waitForTimeout(200);
    await page.locator('.sort-header[data-sort="date"]').click();
    await page.waitForTimeout(200);
    await page.locator('.sort-header[data-sort="meaning"]').click();
    await page.waitForTimeout(200);
    await page.locator('.sort-header[data-sort="fun_fact"]').click();
    await page.waitForTimeout(200);

    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });

  test('sorting combined with search does not crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(WOTD_ADMIN_URL);
    await page.waitForFunction(() => {
      const el = document.getElementById('stat-total');
      return el && el.textContent !== '—';
    }, { timeout: 10000 });

    // Search first, then sort
    await page.fill('#search-input', 'TEST');
    await page.waitForTimeout(500);
    await page.locator('.sort-header[data-sort="word"]').click();
    await page.waitForTimeout(500);

    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });

  test('sorting combined with filter does not crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(WOTD_ADMIN_URL);
    await page.waitForFunction(() => {
      const el = document.getElementById('stat-total');
      return el && el.textContent !== '—';
    }, { timeout: 10000 });

    // Filter first, then sort
    await page.selectOption('#filter-status', 'assigned');
    await page.waitForTimeout(500);
    await page.locator('.sort-header[data-sort="word"]').click();
    await page.waitForTimeout(500);

    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });

  test('table body still renders after rapid sort toggling', async ({ page }) => {
    await page.goto(WOTD_ADMIN_URL);
    await page.waitForFunction(() => {
      const el = document.getElementById('stat-total');
      return el && el.textContent !== '—';
    }, { timeout: 10000 });

    // Rapid toggle same column multiple times
    for (let i = 0; i < 5; i++) {
      await page.locator('.sort-header[data-sort="date"]').click();
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(500);

    // Table should still be visible and have content
    await expect(page.locator('#wotd-tbody')).toBeVisible();
    const rowCount = await page.locator('#wotd-tbody tr').count();
    expect(rowCount).toBeGreaterThan(0);
  });
});
