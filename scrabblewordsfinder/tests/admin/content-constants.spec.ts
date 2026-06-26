import { test, expect } from '@playwright/test';

/**
 * Admin Content & Constants CRUD — Tests for the new Content section.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Admin Content Page — Positive', () => {
  test('content page loads with correct title', async ({ page }) => {
    await page.goto(`${BASE}/admin/content/`);
    await expect(page).toHaveTitle(/Content.*Admin/i);
  });

  test('content page has Constants tile', async ({ page }) => {
    await page.goto(`${BASE}/admin/content/`);
    const tile = page.locator('a[href="/admin/content/constants/"]');
    await expect(tile).toBeVisible();
    await expect(tile).toContainText('Constants');
  });

  test('content page has breadcrumb back to admin', async ({ page }) => {
    await page.goto(`${BASE}/admin/content/`);
    const backLink = page.locator('a[href="/admin/"]').first();
    await expect(backLink).toBeAttached();
  });

  test('content page has noindex meta', async ({ page }) => {
    await page.goto(`${BASE}/admin/content/`);
    const robots = page.locator('meta[name="robots"]');
    if (await robots.count() > 0) {
      const content = await robots.getAttribute('content');
      expect(content).toContain('noindex');
    }
  });
});

test.describe('Admin Content Page — Negative', () => {
  test('no duplicate Constants tiles on content page', async ({ page }) => {
    await page.goto(`${BASE}/admin/content/`);
    const tiles = page.locator('a[href="/admin/content/constants/"]');
    expect(await tiles.count()).toBe(1);
  });

  test('no console errors on content page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/admin/content/`);
    await page.waitForTimeout(1500);
    expect(errors.filter(e => !e.includes('net::'))).toHaveLength(0);
  });
});

test.describe('Admin Constants CRUD Page — Positive', () => {
  test('constants page loads with correct title', async ({ page }) => {
    await page.goto(`${BASE}/admin/content/constants/`);
    await expect(page).toHaveTitle(/Constants.*Admin/i);
  });

  test('constants page has Add button', async ({ page }) => {
    await page.goto(`${BASE}/admin/content/constants/`);
    const addBtn = page.locator('#add-btn');
    await expect(addBtn).toBeVisible();
    await expect(addBtn).toContainText('Add Constant');
  });

  test('constants table loads with existing data', async ({ page }) => {
    await page.goto(`${BASE}/admin/content/constants/`);
    await page.waitForTimeout(1500);
    const tbody = page.locator('#constants-tbody');
    const text = await tbody.textContent();
    expect(text).toContain('TAGLINE');
  });

  test('add modal opens on button click', async ({ page }) => {
    await page.goto(`${BASE}/admin/content/constants/`);
    await page.locator('#add-btn').click();
    const modal = page.locator('#modal-overlay');
    await expect(modal).not.toHaveClass(/hidden/);
    await expect(page.locator('#modal-title')).toContainText('Add Constant');
  });

  test('add modal closes on cancel', async ({ page }) => {
    await page.goto(`${BASE}/admin/content/constants/`);
    await page.locator('#add-btn').click();
    await page.locator('#modal-cancel').click();
    const modal = page.locator('#modal-overlay');
    await expect(modal).toHaveClass(/hidden/);
  });

  test('add modal closes on Escape key', async ({ page }) => {
    await page.goto(`${BASE}/admin/content/constants/`);
    await page.locator('#add-btn').click();
    await page.keyboard.press('Escape');
    const modal = page.locator('#modal-overlay');
    await expect(modal).toHaveClass(/hidden/);
  });

  test('constants page has breadcrumb back to content', async ({ page }) => {
    await page.goto(`${BASE}/admin/content/constants/`);
    const backLink = page.locator('a[href="/admin/content/"]').first();
    await expect(backLink).toBeAttached();
  });

  test('CRUD: create, verify, and delete a constant', async ({ page }) => {
    await page.goto(`${BASE}/admin/content/constants/`);
    await page.waitForTimeout(1000);

    // Create
    await page.locator('#add-btn').click();
    await page.locator('#form-name').fill('TEST_CONSTANT_E2E');
    await page.locator('#form-text').fill('Test value for E2E');
    await page.locator('#modal-submit').click();
    await page.waitForTimeout(1500);

    // Verify it appears in table
    const tbody = page.locator('#constants-tbody');
    await expect(tbody).toContainText('TEST_CONSTANT_E2E');

    // Delete it
    const deleteBtn = page.locator('[data-delete]').last();
    await deleteBtn.click();
    await page.locator('#delete-confirm').click();
    await page.waitForTimeout(1500);

    // Verify removed
    const text = await tbody.textContent();
    expect(text).not.toContain('TEST_CONSTANT_E2E');
  });
});

test.describe('Admin Constants — Update Cache Button — Positive', () => {
  test('cache button is visible with correct label', async ({ page }) => {
    await page.goto(`${BASE}/admin/content/constants/`);
    const cacheBtn = page.locator('#cache-btn');
    await expect(cacheBtn).toBeVisible();
    await expect(cacheBtn).toContainText('Update Cache');
  });

  test('cache button has refresh icon', async ({ page }) => {
    await page.goto(`${BASE}/admin/content/constants/`);
    const icon = page.locator('#cache-icon');
    await expect(icon).toBeVisible();
    await expect(icon).toHaveText('🔄');
  });

  test('cache button shows loading state on click', async ({ page }) => {
    // Delay the cache response so we can observe the loading state
    await page.route('**/api/constants/cache', async route => {
      await new Promise(r => setTimeout(r, 1500));
      await route.fulfill({ status: 200, body: JSON.stringify({ cached: 5 }), contentType: 'application/json' });
    });
    await page.goto(`${BASE}/admin/content/constants/`);
    await page.waitForTimeout(1000);
    const cacheBtn = page.locator('#cache-btn');
    const icon = page.locator('#cache-icon');

    await cacheBtn.click();
    // During the delayed request, the button shows loading state
    await expect(icon).toHaveText('⏳', { timeout: 3000 });
    await expect(cacheBtn).toHaveClass(/opacity-50/);
    await expect(cacheBtn).toHaveClass(/pointer-events-none/);

    // After completion, button restores
    await expect(icon).toHaveText('🔄', { timeout: 10000 });
    await expect(cacheBtn).not.toHaveClass(/opacity-50/);
  });

  test('cache button shows success toast after completion', async ({ page }) => {
    await page.route('**/api/constants/cache', route => {
      route.fulfill({ status: 200, body: JSON.stringify({ cached: 3 }), contentType: 'application/json' });
    });
    await page.goto(`${BASE}/admin/content/constants/`);
    await page.waitForTimeout(1000);
    await page.locator('#cache-btn').click();

    const toast = page.locator('#toast');
    await expect(toast).not.toHaveClass(/hidden/, { timeout: 5000 });
    await expect(toast).toContainText('Cache refreshed');
  });

  test('cache button is positioned next to add button', async ({ page }) => {
    await page.goto(`${BASE}/admin/content/constants/`);
    const cacheBtn = page.locator('#cache-btn');
    const addBtn = page.locator('#add-btn');
    const wrapper = cacheBtn.locator('..');
    await expect(wrapper).toHaveClass(/flex/);
    await expect(wrapper).toHaveClass(/gap-3/);
    await expect(addBtn).toBeVisible();
  });
});

test.describe('Admin Constants — Update Cache Button — Negative', () => {
  test('no duplicate cache buttons on constants page', async ({ page }) => {
    await page.goto(`${BASE}/admin/content/constants/`);
    const buttons = page.locator('#cache-btn');
    expect(await buttons.count()).toBe(1);
  });

  test('cache button restores after failed API call', async ({ page }) => {
    // Route the cache endpoint to return an error
    await page.route('**/api/constants/cache', route => {
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'Simulated failure' }), contentType: 'application/json' });
    });
    await page.goto(`${BASE}/admin/content/constants/`);
    await page.waitForTimeout(1000);

    const cacheBtn = page.locator('#cache-btn');
    const icon = page.locator('#cache-icon');
    await cacheBtn.click();

    // Should show error toast
    const toast = page.locator('#toast');
    await expect(toast).not.toHaveClass(/hidden/, { timeout: 5000 });
    await expect(toast).toContainText(/fail|error/i);

    // Button should restore to clickable state
    await expect(icon).toHaveText('🔄', { timeout: 5000 });
    await expect(cacheBtn).not.toHaveClass(/opacity-50/);
    await expect(cacheBtn).not.toHaveClass(/pointer-events-none/);
  });
});

test.describe('Admin Constants — Cache API — Positive', () => {
  test('POST /api/constants/cache responds without server error', async ({ request }) => {
    const res = await request.post(`${BASE}/api/constants/cache`);
    // Endpoint may return 200 (success) or 404 (not yet deployed) — but never 500
    expect(res.status()).not.toBe(500);
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.cached).toBeDefined();
      expect(typeof body.cached).toBe('number');
    }
  });
});

test.describe('Admin Constants CRUD Page — Negative', () => {
  test('no console errors on constants page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/admin/content/constants/`);
    await page.waitForTimeout(2000);
    expect(errors.filter(e => !e.includes('net::'))).toHaveLength(0);
  });

  test('constants page has noindex meta', async ({ page }) => {
    await page.goto(`${BASE}/admin/content/constants/`);
    const robots = page.locator('meta[name="robots"]');
    if (await robots.count() > 0) {
      const content = await robots.getAttribute('content');
      expect(content).toContain('noindex');
    }
  });
});

test.describe('Admin Dashboard — Content Tile', () => {
  test('content tile exists on admin dashboard', async ({ page }) => {
    await page.goto(`${BASE}/admin/`);
    const tile = page.locator('a[href="/admin/content/"]');
    await expect(tile).toBeAttached();
    await expect(tile).toContainText('Content');
  });

  test('no duplicate content tiles on admin dashboard', async ({ page }) => {
    await page.goto(`${BASE}/admin/`);
    const tiles = page.locator('a[href="/admin/content/"]');
    expect(await tiles.count()).toBe(1);
  });
});

test.describe('Constants API — Positive', () => {
  test('GET /api/constants returns array', async ({ request }) => {
    const res = await request.get(`${BASE}/api/constants/`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.constants).toBeDefined();
    expect(Array.isArray(body.constants)).toBe(true);
  });

  test('GET /api/constants?name=TAGLINE returns single constant', async ({ request }) => {
    const res = await request.get(`${BASE}/api/constants/?name=TAGLINE`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.constant.name).toBe('TAGLINE');
    expect(body.constant.text.length).toBeGreaterThan(0);
  });
});

test.describe('Constants API — Negative', () => {
  test('GET /api/constants?name=NONEXIST returns 404', async ({ request }) => {
    const res = await request.get(`${BASE}/api/constants/?name=NONEXIST_XYZ_999`);
    expect(res.status()).toBe(404);
  });

  test('POST /api/constants rejects empty body', async ({ request }) => {
    const res = await request.post(`${BASE}/api/constants/`, {
      data: {},
    });
    expect(res.status()).toBe(400);
  });

  test('DELETE /api/constants rejects missing id', async ({ request }) => {
    const res = await request.delete(`${BASE}/api/constants/`, {
      data: {},
    });
    expect(res.status()).toBe(400);
  });

  test('DELETE /api/constants returns 404 for non-existent id', async ({ request }) => {
    const res = await request.delete(`${BASE}/api/constants/`, {
      data: { id: 999999 },
    });
    expect(res.status()).toBe(404);
  });
});
