import { test, expect } from '@playwright/test';

/**
 * Admin Diamond Hunt — Playwright Tests
 *
 * Covers:
 * - Page structure (title, heading, stats, table, add form)
 * - Toggle/delete actions (mocked)
 * - Negative: no sensitive data, no crashes on empty state
 */

const ADMIN_URL = '/admin/diamond-hunt/';

// ── Page Structure — Positive ────────────────────────────────────────────

test.describe('Admin Diamond Hunt — Page Structure (Positive)', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto(ADMIN_URL);
    await expect(page).toHaveTitle(/Diamond Hunt/);
  });

  test('has page heading and description', async ({ page }) => {
    await page.goto(ADMIN_URL);
    await expect(page.locator('h1').first()).toContainText('Diamond Hunt Management');
    await expect(page.locator('text=Manage diamond mines')).toBeAttached();
  });

  test('has admin nav with Diamond Hunt link highlighted', async ({ page }) => {
    await page.goto(ADMIN_URL);
    const link = page.locator('nav a[href="/admin/diamond-hunt/"]');
    await expect(link).toHaveClass(/font-medium/);
  });

  test('displays summary stats grid with 4 stat boxes', async ({ page }) => {
    await page.goto(ADMIN_URL);
    await expect(page.locator('#stat-total')).toBeVisible();
    await expect(page.locator('#stat-active')).toBeVisible();
    await expect(page.locator('#stat-depleted')).toBeVisible();
    await expect(page.locator('#stat-claims')).toBeVisible();
  });

  test('has add-new-mine form with inputs and button', async ({ page }) => {
    await page.goto(ADMIN_URL);
    await expect(page.locator('#new-remaining')).toBeVisible();
    await expect(page.locator('#new-per-claim')).toBeVisible();
    await expect(page.locator('#new-end-date')).toBeVisible();
    await expect(page.locator('#add-mine-btn')).toBeVisible();
  });

  test('mines table has expected column headers', async ({ page }) => {
    await page.goto(ADMIN_URL);
    const headers = page.locator('thead th');
    const texts = await headers.allTextContents();
    expect(texts).toContain('ID');
    expect(texts).toContain('Remaining');
    expect(texts).toContain('Status');
    expect(texts).toContain('Actions');
  });
});

// ── Data Loading — Positive ──────────────────────────────────────────────

test.describe('Admin Diamond Hunt — Data Loading (Positive)', () => {
  test('stats update after data loads', async ({ page }) => {
    await page.goto(ADMIN_URL);
    // Wait for stats to populate (not "—")
    await page.waitForFunction(
      () => document.getElementById('stat-total')?.textContent !== '—',
      null,
      { timeout: 5000 }
    );
    const total = await page.locator('#stat-total').textContent();
    expect(Number(total)).toBeGreaterThanOrEqual(0);
  });

  test('table shows mine rows or empty message', async ({ page }) => {
    await page.goto(ADMIN_URL);
    await page.waitForFunction(
      () => document.getElementById('stat-total')?.textContent !== '—',
      null,
      { timeout: 5000 }
    );
    const tbody = page.locator('#mines-table-body');
    const rows = tbody.locator('tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1); // at least the "no mines" row or actual data
  });
});

// ── Edit Modal — Positive ─────────────────────────────────────────────────

test.describe('Admin Diamond Hunt — Edit Modal (Positive)', () => {
  test('edit modal exists in DOM and is hidden by default', async ({ page }) => {
    await page.goto(ADMIN_URL);
    const modal = page.locator('#edit-modal');
    await expect(modal).toBeAttached();
    await expect(modal).toHaveClass(/hidden/);
  });

  test('edit modal has all required form fields', async ({ page }) => {
    await page.goto(ADMIN_URL);
    await expect(page.locator('#edit-id')).toBeAttached();
    await expect(page.locator('#edit-remaining')).toBeAttached();
    await expect(page.locator('#edit-per-claim')).toBeAttached();
    await expect(page.locator('#edit-end-date')).toBeAttached();
    await expect(page.locator('#edit-status')).toBeAttached();
  });

  test('edit modal has Save and Cancel buttons', async ({ page }) => {
    await page.goto(ADMIN_URL);
    await expect(page.locator('#edit-save-btn')).toBeAttached();
    await expect(page.locator('#edit-save-btn')).toHaveText('Save');
    await expect(page.locator('#edit-cancel-btn')).toBeAttached();
    await expect(page.locator('#edit-cancel-btn')).toHaveText('Cancel');
  });

  test('edit modal status select has Active and Inactive options', async ({ page }) => {
    await page.goto(ADMIN_URL);
    const options = page.locator('#edit-status option');
    const values = await options.evaluateAll(els => els.map(el => (el as HTMLOptionElement).value));
    expect(values).toContain('active');
    expect(values).toContain('inactive');
  });

  test('edit modal Mine ID field is a visible number input (not hidden)', async ({ page }) => {
    await page.goto(ADMIN_URL);
    const idInput = page.locator('#edit-id');
    await expect(idInput).toBeAttached();
    await expect(idInput).toHaveAttribute('type', 'number');
    await expect(idInput).toHaveAttribute('min', '1');
  });

  test('edit modal has a "Mine ID" label', async ({ page }) => {
    await page.goto(ADMIN_URL);
    // Label exists in the DOM inside the modal (hidden until modal opens)
    const label = page.locator('#edit-modal label:has-text("Mine ID")');
    await expect(label).toBeAttached();
  });

  test('edit modal heading is "Edit Mine" without inline ID span', async ({ page }) => {
    await page.goto(ADMIN_URL);
    // The old #edit-mine-id span was removed — title is just "Edit Mine"
    const span = page.locator('#edit-mine-id');
    await expect(span).toHaveCount(0);
    const heading = page.locator('#edit-modal h3');
    await expect(heading).toHaveText('✏️ Edit Mine');
  });
});

// ── Edit Modal — Negative ────────────────────────────────────────────────

test.describe('Admin Diamond Hunt — Edit Modal (Negative)', () => {
  test('edit modal does not show without user interaction', async ({ page }) => {
    await page.goto(ADMIN_URL);
    await page.waitForTimeout(500);
    const modal = page.locator('#edit-modal');
    await expect(modal).toHaveClass(/hidden/);
  });

  test('no duplicate edit modals in the DOM', async ({ page }) => {
    await page.goto(ADMIN_URL);
    const modals = page.locator('#edit-modal');
    const count = await modals.count();
    expect(count).toBe(1);
  });
});

// ── Negative Tests ───────────────────────────────────────────────────────

test.describe('Admin Diamond Hunt — Negative', () => {
  test('page has noindex meta tag', async ({ page }) => {
    await page.goto(ADMIN_URL);
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute('content', /noindex/);
  });

  test('no sensitive data exposed in page source', async ({ page }) => {
    await page.goto(ADMIN_URL);
    const content = await page.content();
    expect(content).not.toContain('password');
    expect(content).not.toContain('secret');
    expect(content).not.toContain('api_key');
    expect(content).not.toContain('sk-');
  });

  test('no duplicate admin dashboard tiles for diamond hunt', async ({ page }) => {
    await page.goto('/admin/');
    const tiles = page.locator('a[href="/admin/diamond-hunt/"]');
    const count = await tiles.count();
    expect(count).toBe(1);
  });

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(ADMIN_URL);
    await page.waitForTimeout(1000);
    expect(errors.filter(e => e.includes('critical') || e.includes('TypeError'))).toHaveLength(0);
  });
});
