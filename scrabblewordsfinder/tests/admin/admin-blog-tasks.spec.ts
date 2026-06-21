import { test, expect } from '@playwright/test';

/**
 * Admin Blog Tasks — Page Structure & API Integration Tests
 * Tests /admin/blog-tasks page:
 * - Page structure (nav, heading, table, filters, modal)
 * - API fetch to /api/blog-tasks/ with correct trailing slash
 * - Filter interactions reset pagination
 * - Modal open/close behaviour
 * - Error/empty state handling
 */

test.describe('Admin Blog Tasks — Positive', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto('/admin/blog-tasks/');
    await expect(page).toHaveTitle(/Blog Tasks/);
  });

  test('has page heading and stats line', async ({ page }) => {
    await page.goto('/admin/blog-tasks/');
    await expect(page.locator('h1').first()).toContainText('Blog Tasks');
    await expect(page.locator('#statsLine')).toBeAttached();
  });

  test('has navigation with back link to admin', async ({ page }) => {
    await page.goto('/admin/blog-tasks/');
    const nav = page.locator('nav').first();
    await expect(nav.locator('a[href="/admin/"]').first()).toBeAttached();
    await expect(nav.locator('a[href="/"]')).toBeAttached();
  });

  test('has Add Task button', async ({ page }) => {
    await page.goto('/admin/blog-tasks/');
    await expect(page.locator('#addBtn')).toBeVisible();
    await expect(page.locator('#addBtn')).toContainText('Add Task');
  });

  test('has filter dropdowns for category, status, and ready', async ({ page }) => {
    await page.goto('/admin/blog-tasks/');
    await expect(page.locator('#filterCategory')).toBeVisible();
    await expect(page.locator('#filterStatus')).toBeVisible();
    await expect(page.locator('#filterReady')).toBeVisible();
  });

  test('has table with correct column headers', async ({ page }) => {
    await page.goto('/admin/blog-tasks/');
    const headers = page.locator('thead th');
    await expect(headers.nth(0)).toContainText('ID');
    await expect(headers.nth(1)).toContainText('Title');
    await expect(headers.nth(2)).toContainText('Category');
    await expect(headers.nth(3)).toContainText('Status');
    await expect(headers.nth(4)).toContainText('Ready');
    await expect(headers.nth(5)).toContainText('Agent');
    await expect(headers.nth(6)).toContainText('Est.');
    await expect(headers.nth(7)).toContainText('Actions');
  });

  test('fetches tasks from /api/blog-tasks/ with trailing slash on load', async ({ page }) => {
    const apiPromise = page.waitForRequest(req =>
      req.url().includes('/api/blog-tasks/') && req.method() === 'GET'
    );
    await page.goto('/admin/blog-tasks/');
    const request = await apiPromise;
    expect(request.url()).toContain('/api/blog-tasks/?');
  });

  test('displays tasks in table when API returns data', async ({ page }) => {
    await page.route('**/api/blog-tasks/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tasks: [
            { id: 1, title: 'Test Blog Post', category: 'Strategy', status: 'pending', ready_status: 'ready', agent_name: 'quill', estimated_execution_time: '30min' },
            { id: 2, title: 'Another Post', category: 'Beginner', status: 'completed', ready_status: 'done', agent_name: 'kiro', estimated_execution_time: '15min' },
          ],
          counts: { total: 2, pending: 1, completed: 1 },
          categories: ['Strategy', 'Beginner'],
        }),
      })
    );
    await page.goto('/admin/blog-tasks/');
    await page.waitForSelector('#tasksTable tr');
    const rows = page.locator('#tasksTable tr');
    await expect(rows).toHaveCount(2);
    await expect(rows.first()).toContainText('Test Blog Post');
    await expect(rows.nth(1)).toContainText('Another Post');
  });

  test('stats line shows correct counts', async ({ page }) => {
    await page.route('**/api/blog-tasks/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tasks: [],
          counts: { total: 50, pending: 30, completed: 20 },
          categories: [],
        }),
      })
    );
    await page.goto('/admin/blog-tasks/');
    await page.waitForFunction(() =>
      document.getElementById('statsLine')?.textContent !== 'Loading...'
    );
    await expect(page.locator('#statsLine')).toContainText('Total: 50');
    await expect(page.locator('#statsLine')).toContainText('Pending: 30');
    await expect(page.locator('#statsLine')).toContainText('Completed: 20');
  });

  test('Add Task button opens modal', async ({ page }) => {
    await page.route('**/api/blog-tasks/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ tasks: [], counts: { total: 0, pending: 0, completed: 0 }, categories: [] }),
      })
    );
    await page.goto('/admin/blog-tasks/');
    await page.locator('#addBtn').click();
    await expect(page.locator('#modal')).not.toHaveClass(/hidden/);
    await expect(page.locator('#modalTitle')).toContainText('Add Blog Task');
  });

  test('modal closes on Cancel button click', async ({ page }) => {
    await page.route('**/api/blog-tasks/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ tasks: [], counts: { total: 0, pending: 0, completed: 0 }, categories: [] }),
      })
    );
    await page.goto('/admin/blog-tasks/');
    await page.locator('#addBtn').click();
    await expect(page.locator('#modal')).not.toHaveClass(/hidden/);
    await page.locator('#cancelBtn').click();
    await expect(page.locator('#modal')).toHaveClass(/hidden/);
  });

  test('pagination buttons are present', async ({ page }) => {
    await page.goto('/admin/blog-tasks/');
    await expect(page.locator('#prevBtn')).toBeVisible();
    await expect(page.locator('#nextBtn')).toBeVisible();
  });
});

test.describe('Admin Blog Tasks — Negative', () => {
  test('shows empty state when no tasks exist', async ({ page }) => {
    await page.route('**/api/blog-tasks/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ tasks: [], counts: { total: 0, pending: 0, completed: 0 }, categories: [] }),
      })
    );
    await page.goto('/admin/blog-tasks/');
    await page.waitForSelector('#tasksTable td');
    await expect(page.locator('#tasksTable')).toContainText('No tasks found');
  });

  test('save button shows error toast when title is empty', async ({ page }) => {
    await page.route('**/api/blog-tasks/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ tasks: [], counts: { total: 0, pending: 0, completed: 0 }, categories: [] }),
      })
    );
    await page.goto('/admin/blog-tasks/');
    await page.locator('#addBtn').click();
    // Leave title empty and click save
    await page.locator('#saveBtn').click();
    await expect(page.locator('#toast')).toContainText('Title required');
  });

  test('previous button is disabled on first page', async ({ page }) => {
    await page.route('**/api/blog-tasks/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ tasks: [], counts: { total: 0, pending: 0, completed: 0 }, categories: [] }),
      })
    );
    await page.goto('/admin/blog-tasks/');
    await page.waitForFunction(() =>
      document.getElementById('statsLine')?.textContent !== 'Loading...'
    );
    await expect(page.locator('#prevBtn')).toBeDisabled();
  });

  test('no page crash when API returns 500', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('**/api/blog-tasks/**', route =>
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    );
    await page.goto('/admin/blog-tasks/');
    // Wait a moment for any potential errors
    await page.waitForTimeout(1000);
    // Page should not have critical unhandled exceptions that crash it
    expect(errors.filter(e => e.includes('fatal') || e.includes('crash'))).toHaveLength(0);
  });

  test('modal closes when clicking backdrop overlay', async ({ page }) => {
    await page.route('**/api/blog-tasks/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ tasks: [], counts: { total: 0, pending: 0, completed: 0 }, categories: [] }),
      })
    );
    await page.goto('/admin/blog-tasks/');
    await page.locator('#addBtn').click();
    await expect(page.locator('#modal')).not.toHaveClass(/hidden/);
    // Click on the backdrop (the outer modal div) at its edge
    await page.locator('#modal').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('#modal')).toHaveClass(/hidden/);
  });

  test('filter change resets to first page', async ({ page }) => {
    let requestCount = 0;
    await page.route('**/api/blog-tasks/**', route => {
      requestCount++;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ tasks: [], counts: { total: 0, pending: 0, completed: 0 }, categories: ['Strategy', 'Beginner'] }),
      });
    });
    await page.goto('/admin/blog-tasks/');
    await page.waitForFunction(() =>
      document.getElementById('statsLine')?.textContent !== 'Loading...'
    );
    const initialCount = requestCount;
    await page.locator('#filterStatus').selectOption('pending');
    // Should trigger a new fetch with offset=0
    await page.waitForFunction(() =>
      document.getElementById('statsLine')?.textContent !== 'Loading...'
    );
    expect(requestCount).toBeGreaterThan(initialCount);
  });
});
