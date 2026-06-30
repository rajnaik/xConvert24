import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Admin Badges Page — Positive', () => {
  test('page loads with correct title and heading', async ({ page }) => {
    await page.goto(`${BASE}/admin/badges/`);
    await expect(page).toHaveTitle(/Badges Management/);
    const heading = page.locator('h1');
    await expect(heading).toContainText('Badges Management');
  });

  test('nav contains Badges link highlighted as active', async ({ page }) => {
    await page.goto(`${BASE}/admin/badges/`);
    const navLink = page.locator('nav a[href="/admin/badges/"]');
    await expect(navLink).toBeVisible();
    await expect(navLink).toHaveClass(/text-rose-400/);
  });

  test('summary stats section shows 4 stat cards', async ({ page }) => {
    await page.goto(`${BASE}/admin/badges/`);
    const stats = page.locator('#summary-stats > div');
    await expect(stats).toHaveCount(4);
  });

  test('stats populate with numeric values from API', async ({ page }) => {
    await page.goto(`${BASE}/admin/badges/`);
    // Wait for stats to load (replace the dash placeholder)
    await expect(page.locator('#stat-total')).not.toHaveText('—', { timeout: 5000 });
    const total = await page.locator('#stat-total').textContent();
    expect(Number(total)).toBeGreaterThanOrEqual(1);
  });

  test('badges table loads with 15 badge rows', async ({ page }) => {
    await page.goto(`${BASE}/admin/badges/`);
    await page.waitForSelector('#badges-tbody tr td img', { timeout: 5000 });
    const rows = page.locator('#badges-tbody tr');
    await expect(rows).toHaveCount(15);
  });

  test('each table row shows badge image, name, threshold, theme, status, earners', async ({ page }) => {
    await page.goto(`${BASE}/admin/badges/`);
    await page.waitForSelector('#badges-tbody tr td img', { timeout: 5000 });
    const firstRow = page.locator('#badges-tbody tr').first();
    // Image
    await expect(firstRow.locator('img')).toBeVisible();
    // Name (Word Maker)
    await expect(firstRow).toContainText('Word Maker');
    // Threshold (25)
    await expect(firstRow).toContainText('25');
    // Theme (Beginner)
    await expect(firstRow).toContainText('Beginner');
    // Status badge
    await expect(firstRow.locator('span', { hasText: 'active' })).toBeVisible();
    // Edit + Delete buttons
    await expect(firstRow.locator('button', { hasText: 'Edit' })).toBeVisible();
    await expect(firstRow.locator('button', { hasText: 'Delete' })).toBeVisible();
  });

  test('Add Badge button opens the modal', async ({ page }) => {
    await page.goto(`${BASE}/admin/badges/`);
    await page.locator('#add-badge-btn').click();
    const modal = page.locator('#badge-modal');
    await expect(modal).not.toHaveClass(/hidden/);
    await expect(page.locator('#modal-title')).toHaveText('Add Badge');
  });

  test('Edit button opens modal with pre-filled data', async ({ page }) => {
    await page.goto(`${BASE}/admin/badges/`);
    await page.waitForSelector('#badges-tbody tr td img', { timeout: 5000 });
    await page.locator('#badges-tbody tr').first().locator('button', { hasText: 'Edit' }).click();
    const modal = page.locator('#badge-modal');
    await expect(modal).not.toHaveClass(/hidden/);
    await expect(page.locator('#modal-title')).toHaveText('Edit Badge');
    await expect(page.locator('#form-name')).toHaveValue('Word Maker');
    await expect(page.locator('#form-diamonds')).toHaveValue('25');
  });

  test('Cancel button closes the modal', async ({ page }) => {
    await page.goto(`${BASE}/admin/badges/`);
    await page.locator('#add-badge-btn').click();
    await expect(page.locator('#badge-modal')).not.toHaveClass(/hidden/);
    await page.locator('#modal-cancel').click();
    await expect(page.locator('#badge-modal')).toHaveClass(/hidden/);
  });

  test('Delete button opens delete confirmation modal', async ({ page }) => {
    await page.goto(`${BASE}/admin/badges/`);
    await page.waitForSelector('#badges-tbody tr td img', { timeout: 5000 });
    await page.locator('#badges-tbody tr').first().locator('button', { hasText: 'Delete' }).click();
    const modal = page.locator('#delete-modal');
    await expect(modal).not.toHaveClass(/hidden/);
    await expect(page.locator('#delete-badge-name')).toHaveText('Word Maker');
  });

  test('load time indicator appears after data loads', async ({ page }) => {
    await page.goto(`${BASE}/admin/badges/`);
    await page.waitForSelector('#badges-tbody tr td img', { timeout: 5000 });
    const loadTime = page.locator('#load-time');
    await expect(loadTime).toContainText('Loaded');
    await expect(loadTime).toContainText('badges in');
  });
});

test.describe('Admin Badges Page — Negative', () => {
  test('page has noindex meta tag', async ({ page }) => {
    await page.goto(`${BASE}/admin/badges/`);
    const meta = page.locator('meta[name="robots"]');
    await expect(meta).toHaveAttribute('content', 'noindex, nofollow');
  });

  test('modal is hidden by default on page load', async ({ page }) => {
    await page.goto(`${BASE}/admin/badges/`);
    await expect(page.locator('#badge-modal')).toHaveClass(/hidden/);
    await expect(page.locator('#delete-modal')).toHaveClass(/hidden/);
  });

  test('Escape key closes an open modal', async ({ page }) => {
    await page.goto(`${BASE}/admin/badges/`);
    await page.locator('#add-badge-btn').click();
    await expect(page.locator('#badge-modal')).not.toHaveClass(/hidden/);
    await page.keyboard.press('Escape');
    await expect(page.locator('#badge-modal')).toHaveClass(/hidden/);
  });

  test('backdrop click closes the modal', async ({ page }) => {
    await page.goto(`${BASE}/admin/badges/`);
    await page.locator('#add-badge-btn').click();
    const modal = page.locator('#badge-modal');
    await expect(modal).not.toHaveClass(/hidden/);
    // Click the backdrop (outer div)
    await modal.click({ position: { x: 5, y: 5 } });
    await expect(modal).toHaveClass(/hidden/);
  });

  test('no duplicate modal elements exist', async ({ page }) => {
    await page.goto(`${BASE}/admin/badges/`);
    expect(await page.locator('#badge-modal').count()).toBe(1);
    expect(await page.locator('#delete-modal').count()).toBe(1);
    expect(await page.locator('#toast').count()).toBe(1);
  });

  test('API returns 400 for POST without required fields', async ({ page }) => {
    const response = await page.request.post(`${BASE}/api/badges/`, {
      data: { theme: 'Test' },
    });
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('required');
  });

  test('API returns 400 for PUT without id', async ({ page }) => {
    const response = await page.request.put(`${BASE}/api/badges/`, {
      data: { name: 'Updated' },
    });
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('id is required');
  });

  test('API returns 400 for DELETE without id', async ({ page }) => {
    const response = await page.request.delete(`${BASE}/api/badges/`, {
      data: {},
    });
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('id is required');
  });

  test('no JS errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/admin/badges/`);
    await page.waitForSelector('#badges-tbody tr td img', { timeout: 5000 });
    expect(errors).toHaveLength(0);
  });
});

test.describe('Admin Dashboard — Badges Card', () => {
  test('badges card exists on admin index Activities section', async ({ page }) => {
    await page.goto(`${BASE}/admin/`);
    const card = page.locator('a[href="/admin/badges/"]');
    await expect(card).toBeVisible();
    await expect(card).toContainText('Badges');
  });

  test('badges card shows stats that populate from API', async ({ page }) => {
    await page.goto(`${BASE}/admin/`);
    await expect(page.locator('#badges-a-total')).not.toHaveText('-', { timeout: 5000 });
    const total = await page.locator('#badges-a-total').textContent();
    expect(Number(total)).toBeGreaterThanOrEqual(1);
  });

  test('badges card links to /admin/badges/', async ({ page }) => {
    await page.goto(`${BASE}/admin/`);
    const card = page.locator('a[href="/admin/badges/"]');
    await expect(card).toHaveAttribute('href', '/admin/badges/');
  });
});
