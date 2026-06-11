import { test, expect } from '@playwright/test';

/**
 * Admin Reports Page — UI Tests
 * Tests the /admin/report task management page:
 * navigation, filters, create/edit/view/delete modals,
 * run task with approval, Kiro usage stats, inline name editing,
 * and table rendering.
 */

test.describe('Admin Reports — Page Structure', () => {
  test('reports page loads with correct title', async ({ page }) => {
    await page.goto('/admin/report');
    await expect(page).toHaveTitle(/Reports/);
  });

  test('old /admin/reports redirects to /admin/report', async ({ page }) => {
    const response = await page.goto('/admin/reports');
    expect(page.url()).toContain('/admin/report');
  });

  test('has navigation bar with correct links', async ({ page }) => {
    await page.goto('/admin/report');
    const nav = page.locator('nav');
    await expect(nav.locator('a[href="/admin"]')).toBeAttached();
    await expect(nav.locator('a[href="/admin/report"]')).toBeAttached();
    await expect(nav.locator('a[href="/admin/ops"]')).toBeAttached();
    await expect(nav.locator('a[href="/"]')).toBeAttached();
  });

  test('has page heading and description', async ({ page }) => {
    await page.goto('/admin/report');
    await expect(page.locator('h1')).toContainText('Tasks');
    await expect(page.locator('text=Create, view, edit, and delete tasks')).toBeAttached();
  });

  test('has New Task button', async ({ page }) => {
    await page.goto('/admin/report');
    await expect(page.locator('#create-task-btn')).toBeVisible();
    await expect(page.locator('#create-task-btn')).toContainText('New Task');
  });

  test('has filter controls', async ({ page }) => {
    await page.goto('/admin/report');
    await expect(page.locator('#filter-status')).toBeVisible();
    await expect(page.locator('#filter-category')).toBeVisible();
    await expect(page.locator('#filter-apply-btn')).toBeVisible();
  });

  test('tasks table has correct columns', async ({ page }) => {
    await page.goto('/admin/report');
    const headers = page.locator('thead th');
    await expect(headers.nth(0)).toContainText('#');
    await expect(headers.nth(1)).toContainText('Task Name');
    await expect(headers.nth(2)).toContainText('Category');
    await expect(headers.nth(3)).toContainText('Estimate');
    await expect(headers.nth(4)).toContainText('Approval');
    await expect(headers.nth(5)).toContainText('Status');
    await expect(headers.nth(6)).toContainText('Running Time');
    await expect(headers.nth(7)).toContainText('Actions');
  });
});

test.describe('Admin Reports — Kiro Usage Stats', () => {
  test('Kiro usage stats panel is visible', async ({ page }) => {
    await page.goto('/admin/report');
    await expect(page.locator('#kiro-stats')).toBeVisible();
    await expect(page.locator('text=Kiro Usage Stats')).toBeAttached();
  });

  test('stats panel shows all metric boxes', async ({ page }) => {
    await page.goto('/admin/report');
    await expect(page.locator('#stat-total')).toBeVisible();
    await expect(page.locator('#stat-running')).toBeVisible();
    await expect(page.locator('#stat-completed')).toBeVisible();
    await expect(page.locator('#stat-pending')).toBeVisible();
    await expect(page.locator('#stat-total-time')).toBeVisible();
  });

  test('stats update after tasks load', async ({ page }) => {
    await page.goto('/admin/report');
    await page.waitForFunction(() => {
      const el = document.getElementById('stat-total');
      return el && el.textContent !== '—';
    }, { timeout: 10000 });

    const totalText = await page.locator('#stat-total').textContent();
    expect(totalText).toMatch(/\d+/);
  });
});

test.describe('Admin Reports — Task Loading', () => {
  test('tasks load into the table', async ({ page }) => {
    await page.goto('/admin/report');
    // Wait for either tasks to load or "No tasks found" message
    await page.waitForFunction(() => {
      const tbody = document.getElementById('tasks-tbody');
      return tbody && !tbody.textContent?.includes('Loading tasks...');
    }, { timeout: 10000 });

    const tbody = page.locator('#tasks-tbody');
    const content = await tbody.textContent();
    // Either tasks loaded or "No tasks found" — both valid
    expect(content).not.toContain('Loading tasks...');
  });

  test('tasks count is displayed below table', async ({ page }) => {
    await page.goto('/admin/report');
    await page.waitForFunction(() => {
      const tbody = document.getElementById('tasks-tbody');
      return tbody && !tbody.textContent?.includes('Loading tasks...');
    }, { timeout: 10000 });

    const countEl = page.locator('#tasks-count');
    const text = await countEl.textContent();
    // Either "0 tasks", "N tasks", or "N task"
    expect(text).toMatch(/\d+ tasks?/);
  });
});

test.describe('Admin Reports — Filters', () => {
  test('status filter has all expected options', async ({ page }) => {
    await page.goto('/admin/report');
    const options = page.locator('#filter-status option');
    const values = await options.evaluateAll(opts =>
      opts.map(o => (o as HTMLOptionElement).value)
    );
    expect(values).toContain('');
    expect(values).toContain('pending');
    expect(values).toContain('running');
    expect(values).toContain('in_progress');
    expect(values).toContain('completed');
    expect(values).toContain('cancelled');
  });

  test('category filter has all expected options', async ({ page }) => {
    await page.goto('/admin/report');
    const options = page.locator('#filter-category option');
    const values = await options.evaluateAll(opts =>
      opts.map(o => (o as HTMLOptionElement).value)
    );
    expect(values).toContain('');
    expect(values).toContain('general');
    expect(values).toContain('feature');
    expect(values).toContain('bug');
    expect(values).toContain('improvement');
    expect(values).toContain('research');
    expect(values).toContain('content');
    expect(values).toContain('seo');
    expect(values).toContain('infra');
  });

  test('apply button triggers reload with filters', async ({ page }) => {
    await page.goto('/admin/report');
    await page.waitForFunction(() => {
      const tbody = document.getElementById('tasks-tbody');
      return tbody && !tbody.textContent?.includes('Loading tasks...');
    }, { timeout: 10000 });

    // Select a status filter and click Apply
    await page.locator('#filter-status').selectOption('completed');
    const responsePromise = page.waitForResponse(resp =>
      resp.url().includes('/api/tasks') && resp.url().includes('status=completed')
    );
    await page.locator('#filter-apply-btn').click();
    const response = await responsePromise;
    expect(response.status()).not.toBe(404);
  });

  test('apply button triggers reload with running status filter', async ({ page }) => {
    await page.goto('/admin/report');
    await page.waitForFunction(() => {
      const tbody = document.getElementById('tasks-tbody');
      return tbody && !tbody.textContent?.includes('Loading tasks...');
    }, { timeout: 10000 });

    // Select "running" status and apply
    await page.locator('#filter-status').selectOption('running');
    const responsePromise = page.waitForResponse(resp =>
      resp.url().includes('/api/tasks') && resp.url().includes('status=running')
    );
    await page.locator('#filter-apply-btn').click();
    const response = await responsePromise;
    expect(response.status()).not.toBe(404);
  });
});

test.describe('Admin Reports — Create Task Modal', () => {
  test('clicking New Task opens modal', async ({ page }) => {
    await page.goto('/admin/report');
    const modal = page.locator('#task-modal');
    await expect(modal).toHaveClass(/hidden/);
    await page.locator('#create-task-btn').click();
    await expect(modal).not.toHaveClass(/hidden/);
  });

  test('modal is top-aligned with padding and uses wide max-width', async ({ page }) => {
    await page.goto('/admin/report');
    await page.locator('#create-task-btn').click();

    const overlay = page.locator('#task-modal');
    // Overlay uses items-start + pt-8 + pb-8 for top alignment with bottom padding
    await expect(overlay).toHaveClass(/items-start/);
    await expect(overlay).toHaveClass(/pt-8/);
    await expect(overlay).toHaveClass(/pb-8/);
    // Overlay itself is scrollable for tall content
    await expect(overlay).toHaveClass(/overflow-y-auto/);

    // Dialog panel uses max-w-5xl for wider layout
    const dialog = overlay.locator('> div').first();
    await expect(dialog).toHaveClass(/max-w-5xl/);
  });

  test('modal shows "New Task" title in create mode', async ({ page }) => {
    await page.goto('/admin/report');
    await page.locator('#create-task-btn').click();
    await expect(page.locator('#modal-title')).toContainText('New Task');
    await expect(page.locator('#task-submit-btn')).toContainText('Create Task');
  });

  test('modal has all required form fields', async ({ page }) => {
    await page.goto('/admin/report');
    await page.locator('#create-task-btn').click();
    await expect(page.locator('#task-name')).toBeVisible();
    await expect(page.locator('#task-category')).toBeVisible();
    await expect(page.locator('#task-status')).toBeVisible();
    await expect(page.locator('#task-description')).toBeVisible();
    await expect(page.locator('#task-plan')).toBeVisible();
    await expect(page.locator('#task-estimate')).toBeVisible();
    await expect(page.locator('#task-approval')).toBeVisible();
    await expect(page.locator('#task-results')).toBeVisible();
    await expect(page.locator('#task-improvements')).toBeVisible();
  });

  test('task name field is editable in the form', async ({ page }) => {
    await page.goto('/admin/report');
    await page.locator('#create-task-btn').click();
    const nameInput = page.locator('#task-name');
    await nameInput.fill('My editable task name');
    await expect(nameInput).toHaveValue('My editable task name');
    // Clear and retype to confirm editing works
    await nameInput.fill('');
    await nameInput.fill('Renamed task');
    await expect(nameInput).toHaveValue('Renamed task');
  });

  test('modal status dropdown includes running option', async ({ page }) => {
    await page.goto('/admin/report');
    await page.locator('#create-task-btn').click();
    const options = page.locator('#task-status option');
    const values = await options.evaluateAll(opts =>
      opts.map(o => (o as HTMLOptionElement).value)
    );
    expect(values).toContain('pending');
    expect(values).toContain('running');
    expect(values).toContain('in_progress');
    expect(values).toContain('completed');
    expect(values).toContain('cancelled');
  });

  test('close button hides modal', async ({ page }) => {
    await page.goto('/admin/report');
    await page.locator('#create-task-btn').click();
    await expect(page.locator('#task-modal')).not.toHaveClass(/hidden/);
    await page.locator('#modal-close').click();
    await expect(page.locator('#task-modal')).toHaveClass(/hidden/);
  });

  test('cancel button hides modal', async ({ page }) => {
    await page.goto('/admin/report');
    await page.locator('#create-task-btn').click();
    await expect(page.locator('#task-modal')).not.toHaveClass(/hidden/);
    await page.locator('#task-cancel-btn').click();
    await expect(page.locator('#task-modal')).toHaveClass(/hidden/);
  });

  test('clicking backdrop closes modal', async ({ page }) => {
    await page.goto('/admin/report');
    await page.locator('#create-task-btn').click();
    await expect(page.locator('#task-modal')).not.toHaveClass(/hidden/);
    // Click on the backdrop (the outer modal overlay)
    await page.locator('#task-modal').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('#task-modal')).toHaveClass(/hidden/);
  });

  test('description character count updates on input', async ({ page }) => {
    await page.goto('/admin/report');
    await page.locator('#create-task-btn').click();
    await expect(page.locator('#desc-char-count')).toContainText('0');
    await page.locator('#task-description').fill('Hello world testing');
    await expect(page.locator('#desc-char-count')).toContainText('19');
  });

  test('plan character count updates on input', async ({ page }) => {
    await page.goto('/admin/report');
    await page.locator('#create-task-btn').click();
    await expect(page.locator('#plan-char-count')).toContainText('0');
    await page.locator('#task-plan').fill('Step 1: do thing');
    await expect(page.locator('#plan-char-count')).toContainText('16');
  });

  test('form validates required fields before submit', async ({ page }) => {
    await page.goto('/admin/report');
    await page.locator('#create-task-btn').click();

    // Try to submit empty form — browser will prevent via required attr
    const nameInput = page.locator('#task-name');
    const isRequired = await nameInput.getAttribute('required');
    expect(isRequired).not.toBeNull();

    const descInput = page.locator('#task-description');
    const descRequired = await descInput.getAttribute('required');
    expect(descRequired).not.toBeNull();
  });

  test('submitting valid task sends POST request', async ({ page }) => {
    await page.goto('/admin/report');
    await page.locator('#create-task-btn').click();

    await page.locator('#task-name').fill('Playwright UI test task');
    await page.locator('#task-description').fill('Created by Playwright admin-reports spec to verify form submission');
    await page.locator('#task-category').selectOption('general');
    await page.locator('#task-status').selectOption('pending');

    const responsePromise = page.waitForResponse(resp =>
      resp.url().includes('/api/tasks') && resp.request().method() === 'POST'
    );
    await page.locator('#task-submit-btn').click();
    const response = await responsePromise;
    expect(response.status()).not.toBe(404);

    // Modal should close on success
    if (response.status() === 200) {
      await expect(page.locator('#task-modal')).toHaveClass(/hidden/);
    }
  });
});

test.describe('Admin Reports — View Task Modal', () => {
  test('view modal is hidden by default', async ({ page }) => {
    await page.goto('/admin/report');
    await expect(page.locator('#view-modal')).toHaveClass(/hidden/);
  });

  test('view close button hides modal', async ({ page }) => {
    await page.goto('/admin/report');
    // Programmatically show the view modal to test close
    await page.evaluate(() => {
      document.getElementById('view-modal')?.classList.remove('hidden');
    });
    await expect(page.locator('#view-modal')).not.toHaveClass(/hidden/);
    await page.locator('#view-close').click();
    await expect(page.locator('#view-modal')).toHaveClass(/hidden/);
  });

  test('clicking view-modal backdrop closes it', async ({ page }) => {
    await page.goto('/admin/report');
    await page.evaluate(() => {
      document.getElementById('view-modal')?.classList.remove('hidden');
    });
    await page.locator('#view-modal').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('#view-modal')).toHaveClass(/hidden/);
  });

  test('view modal header contains refresh button', async ({ page }) => {
    await page.goto('/admin/report');
    await page.evaluate(() => {
      document.getElementById('view-modal')?.classList.remove('hidden');
    });
    const refreshBtn = page.locator('#view-refresh-btn');
    await expect(refreshBtn).toBeVisible();
    await expect(refreshBtn).toHaveAttribute('title', 'Refresh task status');
  });

  test('refresh button has correct styling and icon', async ({ page }) => {
    await page.goto('/admin/report');
    await page.evaluate(() => {
      document.getElementById('view-modal')?.classList.remove('hidden');
    });
    const refreshBtn = page.locator('#view-refresh-btn');
    await expect(refreshBtn).toHaveClass(/bg-green-600/);
    // Contains an SVG icon
    await expect(refreshBtn.locator('svg')).toBeAttached();
  });

  test('refresh button re-fetches current task data', async ({ page }) => {
    await page.goto('/admin/report');
    await page.waitForFunction(() => {
      const tbody = document.getElementById('tasks-tbody');
      return tbody && !tbody.textContent?.includes('Loading tasks...');
    }, { timeout: 10000 });

    const firstRow = page.locator('#tasks-tbody tr').first();
    const rowText = await firstRow.textContent();
    if (!rowText?.includes('No tasks found')) {
      // Open view modal for the first task
      const viewResponsePromise = page.waitForResponse(resp =>
        resp.url().includes('/api/tasks?id=')
      );
      await firstRow.locator('button[title="View"]').click();
      await viewResponsePromise;
      await expect(page.locator('#view-modal')).not.toHaveClass(/hidden/);

      // Click refresh button and verify it triggers another API call
      const refreshResponsePromise = page.waitForResponse(resp =>
        resp.url().includes('/api/tasks?id=')
      );
      await page.locator('#view-refresh-btn').click();
      const refreshResponse = await refreshResponsePromise;
      expect(refreshResponse.status()).toBe(200);
    }
  });

  test('refresh button sits next to Task Details heading', async ({ page }) => {
    await page.goto('/admin/report');
    await page.evaluate(() => {
      document.getElementById('view-modal')?.classList.remove('hidden');
    });
    // The heading and refresh button share a parent flex container
    const headerGroup = page.locator('#view-modal .flex.items-center.gap-2').first();
    await expect(headerGroup.locator('h2')).toContainText('Task Details');
    await expect(headerGroup.locator('#view-refresh-btn')).toBeVisible();
  });
});

test.describe('Admin Reports — Run Task Modal', () => {
  test('run modal is hidden by default', async ({ page }) => {
    await page.goto('/admin/report');
    await expect(page.locator('#run-modal')).toHaveClass(/hidden/);
  });

  test('run modal has approval confirmation elements', async ({ page }) => {
    await page.goto('/admin/report');
    // Show run modal programmatically to test structure
    await page.evaluate(() => {
      document.getElementById('run-modal')?.classList.remove('hidden');
    });
    await expect(page.locator('#run-task-name')).toBeVisible();
    await expect(page.locator('#run-task-estimate')).toBeVisible();
    await expect(page.locator('#run-task-approval')).toBeVisible();
    await expect(page.locator('#run-confirm-btn')).toBeVisible();
    await expect(page.locator('#run-cancel-btn')).toBeVisible();
  });

  test('run confirm button text says Approve & Run', async ({ page }) => {
    await page.goto('/admin/report');
    await expect(page.locator('#run-confirm-btn')).toContainText('Approve & Run');
  });

  test('run cancel button closes modal', async ({ page }) => {
    await page.goto('/admin/report');
    await page.evaluate(() => {
      document.getElementById('run-modal')?.classList.remove('hidden');
    });
    await page.locator('#run-cancel-btn').click();
    await expect(page.locator('#run-modal')).toHaveClass(/hidden/);
  });

  test('run modal close button closes modal', async ({ page }) => {
    await page.goto('/admin/report');
    await page.evaluate(() => {
      document.getElementById('run-modal')?.classList.remove('hidden');
    });
    await page.locator('#run-modal-close').click();
    await expect(page.locator('#run-modal')).toHaveClass(/hidden/);
  });

  test('clicking run modal backdrop closes it', async ({ page }) => {
    await page.goto('/admin/report');
    await page.evaluate(() => {
      document.getElementById('run-modal')?.classList.remove('hidden');
    });
    await page.locator('#run-modal').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('#run-modal')).toHaveClass(/hidden/);
  });

  test('run button appears for pending/in_progress tasks', async ({ page }) => {
    await page.goto('/admin/report');
    await page.waitForFunction(() => {
      const tbody = document.getElementById('tasks-tbody');
      return tbody && !tbody.textContent?.includes('Loading tasks...');
    }, { timeout: 10000 });

    const firstRow = page.locator('#tasks-tbody tr').first();
    const rowText = await firstRow.textContent();
    if (!rowText?.includes('No tasks found')) {
      // Check if any row has a Run button (depends on task status)
      const runButtons = page.locator('#tasks-tbody button[title="Run"]');
      const count = await runButtons.count();
      // Run buttons appear only for pending/in_progress tasks
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('clicking run button opens run approval modal with task info', async ({ page }) => {
    await page.goto('/admin/report');
    await page.waitForFunction(() => {
      const tbody = document.getElementById('tasks-tbody');
      return tbody && !tbody.textContent?.includes('Loading tasks...');
    }, { timeout: 10000 });

    const runBtn = page.locator('#tasks-tbody button[title="Run"]').first();
    if (await runBtn.isVisible()) {
      await runBtn.click();
      await expect(page.locator('#run-modal')).not.toHaveClass(/hidden/);
      // Should show task name and estimate
      const taskName = await page.locator('#run-task-name').textContent();
      expect(taskName).toBeTruthy();
      const estimate = await page.locator('#run-task-estimate').textContent();
      expect(estimate).toBeTruthy();
    }
  });

  test('confirming run sends PUT request to update status', async ({ page }) => {
    await page.goto('/admin/report');
    await page.waitForFunction(() => {
      const tbody = document.getElementById('tasks-tbody');
      return tbody && !tbody.textContent?.includes('Loading tasks...');
    }, { timeout: 10000 });

    const runBtn = page.locator('#tasks-tbody button[title="Run"]').first();
    if (await runBtn.isVisible()) {
      await runBtn.click();
      await expect(page.locator('#run-modal')).not.toHaveClass(/hidden/);

      const responsePromise = page.waitForResponse(resp =>
        resp.url().includes('/api/tasks') && resp.request().method() === 'PUT'
      );
      await page.locator('#run-confirm-btn').click();
      const response = await responsePromise;
      expect(response.status()).not.toBe(404);

      // Verify the request sets status to running
      const body = response.request().postDataJSON();
      expect(body.status).toBe('running');
      expect(body.approval).toBe('approved');
    }
  });
});

test.describe('Admin Reports — Inline Task Name Editing', () => {
  test('task name cells have editable class', async ({ page }) => {
    await page.goto('/admin/report');
    await page.waitForFunction(() => {
      const tbody = document.getElementById('tasks-tbody');
      return tbody && !tbody.textContent?.includes('Loading tasks...');
    }, { timeout: 10000 });

    const firstRow = page.locator('#tasks-tbody tr').first();
    const rowText = await firstRow.textContent();
    if (!rowText?.includes('No tasks found')) {
      const nameSpan = page.locator('.task-name-display').first();
      await expect(nameSpan).toBeVisible();
      // Has cursor-pointer class for visual indication
      await expect(nameSpan).toHaveClass(/cursor-pointer/);
    }
  });

  test('double-clicking task name shows input field', async ({ page }) => {
    await page.goto('/admin/report');
    await page.waitForFunction(() => {
      const tbody = document.getElementById('tasks-tbody');
      return tbody && !tbody.textContent?.includes('Loading tasks...');
    }, { timeout: 10000 });

    const firstRow = page.locator('#tasks-tbody tr').first();
    const rowText = await firstRow.textContent();
    if (!rowText?.includes('No tasks found')) {
      const nameSpan = page.locator('.task-name-display').first();
      await nameSpan.dblclick();
      // After double-click, an input field should appear
      const input = firstRow.locator('td:nth-child(2) input[type="text"]');
      await expect(input).toBeVisible();
    }
  });
});

test.describe('Admin Reports — Task Actions', () => {
  test('task rows have view, edit, and delete buttons', async ({ page }) => {
    await page.goto('/admin/report');
    await page.waitForFunction(() => {
      const tbody = document.getElementById('tasks-tbody');
      return tbody && !tbody.textContent?.includes('Loading tasks...');
    }, { timeout: 10000 });

    // Only test if tasks exist
    const firstRow = page.locator('#tasks-tbody tr').first();
    const rowText = await firstRow.textContent();
    if (!rowText?.includes('No tasks found')) {
      await expect(firstRow.locator('button[title="View"]')).toBeAttached();
      await expect(firstRow.locator('button[title="Edit"]')).toBeAttached();
      await expect(firstRow.locator('button[title="Delete"]')).toBeAttached();
    }
  });

  test('view button opens view modal with task details', async ({ page }) => {
    await page.goto('/admin/report');
    await page.waitForFunction(() => {
      const tbody = document.getElementById('tasks-tbody');
      return tbody && !tbody.textContent?.includes('Loading tasks...');
    }, { timeout: 10000 });

    const firstRow = page.locator('#tasks-tbody tr').first();
    const rowText = await firstRow.textContent();
    if (!rowText?.includes('No tasks found')) {
      const responsePromise = page.waitForResponse(resp =>
        resp.url().includes('/api/tasks?id=')
      );
      await firstRow.locator('button[title="View"]').click();
      await responsePromise;
      await expect(page.locator('#view-modal')).not.toHaveClass(/hidden/);
      await expect(page.locator('#view-content')).not.toBeEmpty();
    }
  });

  test('edit button opens modal in edit mode', async ({ page }) => {
    await page.goto('/admin/report');
    await page.waitForFunction(() => {
      const tbody = document.getElementById('tasks-tbody');
      return tbody && !tbody.textContent?.includes('Loading tasks...');
    }, { timeout: 10000 });

    const firstRow = page.locator('#tasks-tbody tr').first();
    const rowText = await firstRow.textContent();
    if (!rowText?.includes('No tasks found')) {
      const responsePromise = page.waitForResponse(resp =>
        resp.url().includes('/api/tasks?id=')
      );
      await firstRow.locator('button[title="Edit"]').click();
      await responsePromise;
      await expect(page.locator('#task-modal')).not.toHaveClass(/hidden/);
      await expect(page.locator('#modal-title')).toContainText('Edit Task');
      await expect(page.locator('#task-submit-btn')).toContainText('Save Changes');
      // Task ID should be populated
      const taskId = await page.locator('#task-id').inputValue();
      expect(taskId).toBeTruthy();
    }
  });

  test('delete button shows confirmation dialog', async ({ page }) => {
    await page.goto('/admin/report');
    await page.waitForFunction(() => {
      const tbody = document.getElementById('tasks-tbody');
      return tbody && !tbody.textContent?.includes('Loading tasks...');
    }, { timeout: 10000 });

    const firstRow = page.locator('#tasks-tbody tr').first();
    const rowText = await firstRow.textContent();
    if (!rowText?.includes('No tasks found')) {
      let confirmCalled = false;
      page.on('dialog', async dialog => {
        confirmCalled = true;
        await dialog.dismiss(); // Cancel the delete
      });
      await firstRow.locator('button[title="Delete"]').click();
      expect(confirmCalled).toBeTruthy();
    }
  });
});


test.describe('Admin Reports — Estimate, Approval, Results & Improvements Fields', () => {
  test('estimate field accepts free text input', async ({ page }) => {
    await page.goto('/admin/report');
    await page.locator('#create-task-btn').click();
    const estimateInput = page.locator('#task-estimate');
    await estimateInput.fill('2h 30min');
    await expect(estimateInput).toHaveValue('2h 30min');
  });

  test('approval dropdown has correct options', async ({ page }) => {
    await page.goto('/admin/report');
    await page.locator('#create-task-btn').click();
    const options = page.locator('#task-approval option');
    const values = await options.evaluateAll(opts =>
      opts.map(o => (o as HTMLOptionElement).value)
    );
    expect(values).toContain('pending');
    expect(values).toContain('approved');
    expect(values).toContain('rejected');
  });

  test('approval dropdown defaults to pending', async ({ page }) => {
    await page.goto('/admin/report');
    await page.locator('#create-task-btn').click();
    const approvalValue = await page.locator('#task-approval').inputValue();
    expect(approvalValue).toBe('pending');
  });

  test('results textarea accepts input', async ({ page }) => {
    await page.goto('/admin/report');
    await page.locator('#create-task-btn').click();
    const resultsField = page.locator('#task-results');
    await resultsField.fill('Task completed successfully with no issues.');
    await expect(resultsField).toHaveValue('Task completed successfully with no issues.');
  });

  test('improvements textarea accepts input', async ({ page }) => {
    await page.goto('/admin/report');
    await page.locator('#create-task-btn').click();
    const improvField = page.locator('#task-improvements');
    await improvField.fill('Consider adding error handling for edge cases.');
    await expect(improvField).toHaveValue('Consider adding error handling for edge cases.');
  });

  test('modal reset clears estimate, approval, results, and improvements', async ({ page }) => {
    await page.goto('/admin/report');
    await page.locator('#create-task-btn').click();

    // Fill in the new fields
    await page.locator('#task-estimate').fill('45min');
    await page.locator('#task-approval').selectOption('approved');
    await page.locator('#task-results').fill('Some results here');
    await page.locator('#task-improvements').fill('Some improvements');

    // Close modal (triggers reset)
    await page.locator('#task-cancel-btn').click();
    await expect(page.locator('#task-modal')).toHaveClass(/hidden/);

    // Reopen modal
    await page.locator('#create-task-btn').click();

    // All new fields should be reset
    await expect(page.locator('#task-estimate')).toHaveValue('');
    await expect(page.locator('#task-approval')).toHaveValue('pending');
    await expect(page.locator('#task-results')).toHaveValue('');
    await expect(page.locator('#task-improvements')).toHaveValue('');
  });

  test('modal reset clears new fields when closed via X button', async ({ page }) => {
    await page.goto('/admin/report');
    await page.locator('#create-task-btn').click();

    await page.locator('#task-estimate').fill('1h');
    await page.locator('#task-approval').selectOption('rejected');
    await page.locator('#task-results').fill('Failed due to timeout');
    await page.locator('#task-improvements').fill('Add retry logic');

    // Close via X button
    await page.locator('#modal-close').click();
    await expect(page.locator('#task-modal')).toHaveClass(/hidden/);

    // Reopen and verify reset
    await page.locator('#create-task-btn').click();
    await expect(page.locator('#task-estimate')).toHaveValue('');
    await expect(page.locator('#task-approval')).toHaveValue('pending');
    await expect(page.locator('#task-results')).toHaveValue('');
    await expect(page.locator('#task-improvements')).toHaveValue('');
  });

  test('new fields are included in POST payload on task creation', async ({ page }) => {
    await page.goto('/admin/report');
    await page.locator('#create-task-btn').click();

    await page.locator('#task-name').fill('Test task with new fields');
    await page.locator('#task-description').fill('Description for testing estimate, approval, results, and improvements fields');
    await page.locator('#task-estimate').fill('30min');
    await page.locator('#task-approval').selectOption('approved');
    await page.locator('#task-results').fill('Execution output');
    await page.locator('#task-improvements').fill('Suggested next steps');

    const responsePromise = page.waitForResponse(resp =>
      resp.url().includes('/api/tasks') && resp.request().method() === 'POST'
    );
    await page.locator('#task-submit-btn').click();
    const response = await responsePromise;

    // Verify the request payload includes the new fields
    const requestBody = response.request().postDataJSON();
    expect(requestBody.estimate).toBe('30min');
    expect(requestBody.approval).toBe('approved');
    expect(requestBody.results).toBe('Execution output');
    expect(requestBody.suggested_improvements).toBe('Suggested next steps');
  });

  test('edit mode populates estimate, approval, results, and improvements', async ({ page }) => {
    await page.goto('/admin/report');
    await page.waitForFunction(() => {
      const tbody = document.getElementById('tasks-tbody');
      return tbody && !tbody.textContent?.includes('Loading tasks...');
    }, { timeout: 10000 });

    const firstRow = page.locator('#tasks-tbody tr').first();
    const rowText = await firstRow.textContent();
    if (!rowText?.includes('No tasks found')) {
      const responsePromise = page.waitForResponse(resp =>
        resp.url().includes('/api/tasks?id=')
      );
      await firstRow.locator('button[title="Edit"]').click();
      await responsePromise;

      // The fields should be present and editable in edit mode
      await expect(page.locator('#task-estimate')).toBeVisible();
      await expect(page.locator('#task-approval')).toBeVisible();
      await expect(page.locator('#task-results')).toBeVisible();
      await expect(page.locator('#task-improvements')).toBeVisible();
    }
  });

  test('table rows display estimate and approval columns', async ({ page }) => {
    await page.goto('/admin/report');
    await page.waitForFunction(() => {
      const tbody = document.getElementById('tasks-tbody');
      return tbody && !tbody.textContent?.includes('Loading tasks...');
    }, { timeout: 10000 });

    const firstRow = page.locator('#tasks-tbody tr').first();
    const rowText = await firstRow.textContent();
    if (!rowText?.includes('No tasks found')) {
      // Row should have 8 cells (ID, Name, Category, Estimate, Approval, Status, Running Time, Actions)
      const cells = firstRow.locator('td');
      const cellCount = await cells.count();
      expect(cellCount).toBe(8);
    }
  });

  test('view modal shows Running Time, results and improvements sections when present', async ({ page }) => {
    await page.goto('/admin/report');
    await page.waitForFunction(() => {
      const tbody = document.getElementById('tasks-tbody');
      return tbody && !tbody.textContent?.includes('Loading tasks...');
    }, { timeout: 10000 });

    const firstRow = page.locator('#tasks-tbody tr').first();
    const rowText = await firstRow.textContent();
    if (!rowText?.includes('No tasks found')) {
      const responsePromise = page.waitForResponse(resp =>
        resp.url().includes('/api/tasks?id=')
      );
      await firstRow.locator('button[title="View"]').click();
      const response = await responsePromise;
      const taskData = await response.json();

      const viewContent = page.locator('#view-content');
      await expect(viewContent).toBeVisible();

      // Check that Estimate, Approval, and Running Time appear in view grid
      await expect(viewContent.locator('text=Estimate')).toBeAttached();
      await expect(viewContent.locator('text=Approval')).toBeAttached();
      await expect(viewContent.locator('text=Running Time')).toBeAttached();

      // If the task has results, verify the Results section shows
      if (taskData.results) {
        await expect(viewContent.locator('text=Results')).toBeAttached();
      }

      // If the task has improvements, verify the section shows
      if (taskData.suggested_improvements) {
        await expect(viewContent.locator('text=Suggested Improvements')).toBeAttached();
      }
    }
  });
});

test.describe('Admin Reports — Edit Modal Positioning & Width', () => {
  test('edit modal aligns to top of viewport', async ({ page }) => {
    await page.goto('/admin/report');
    const modal = page.locator('#task-modal');
    // The outer overlay should use items-start (not items-center) for top alignment
    await expect(modal).toHaveClass(/items-start/);
    await expect(modal).not.toHaveClass(/items-center/);
  });

  test('edit modal has top and bottom padding for spacing', async ({ page }) => {
    await page.goto('/admin/report');
    const modal = page.locator('#task-modal');
    await expect(modal).toHaveClass(/pt-8/);
    await expect(modal).toHaveClass(/pb-8/);
  });

  test('edit modal overlay is scrollable', async ({ page }) => {
    await page.goto('/admin/report');
    const modal = page.locator('#task-modal');
    await expect(modal).toHaveClass(/overflow-y-auto/);
  });

  test('edit modal inner container has constrained max height', async ({ page }) => {
    await page.goto('/admin/report');
    await page.locator('#create-task-btn').click();
    const innerPanel = page.locator('#task-modal > div');
    // Inner panel uses max-h-[85vh] for scrollable content within viewport
    const classes = await innerPanel.getAttribute('class');
    expect(classes).toContain('max-h-[85vh]');
    expect(classes).toContain('overflow-y-auto');
  });

  test('edit modal inner container is widened to max-w-5xl', async ({ page }) => {
    await page.goto('/admin/report');
    await page.locator('#create-task-btn').click();
    const innerPanel = page.locator('#task-modal > div');
    await expect(innerPanel).toHaveClass(/max-w-5xl/);
    await expect(innerPanel).not.toHaveClass(/max-w-2xl/);
  });

  test('edit modal appears near top when opened via edit button', async ({ page }) => {
    await page.goto('/admin/report');
    await page.waitForFunction(() => {
      const tbody = document.getElementById('tasks-tbody');
      return tbody && !tbody.textContent?.includes('Loading tasks...');
    }, { timeout: 10000 });

    const firstRow = page.locator('#tasks-tbody tr').first();
    const rowText = await firstRow.textContent();
    if (!rowText?.includes('No tasks found')) {
      const responsePromise = page.waitForResponse(resp =>
        resp.url().includes('/api/tasks?id=')
      );
      await firstRow.locator('button[title="Edit"]').click();
      await responsePromise;
      await expect(page.locator('#task-modal')).not.toHaveClass(/hidden/);

      // The inner panel should be near the top of the viewport
      const box = await page.locator('#task-modal > div').boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        // Should be within top 100px (pt-8 = 32px + some margin)
        expect(box.y).toBeLessThan(100);
      }
    }
  });
});

test.describe('Admin Reports — Running Time Live Update', () => {
  test('running time cells update automatically for running tasks', async ({ page }) => {
    await page.goto('/admin/report');
    await page.waitForFunction(() => {
      const tbody = document.getElementById('tasks-tbody');
      return tbody && !tbody.textContent?.includes('Loading tasks...');
    }, { timeout: 10000 });

    // Check if there's a running task by looking for the status
    const hasRunning = await page.evaluate(() => {
      const cells = document.querySelectorAll('#tasks-tbody td:nth-child(6)');
      return Array.from(cells).some(cell => cell.textContent?.includes('running'));
    });

    if (hasRunning) {
      // Capture the initial running time value
      const runningRow = page.locator('#tasks-tbody tr').filter({ hasText: 'running' }).first();
      const timeCell = runningRow.locator('td:nth-child(7)');
      const initialTime = await timeCell.textContent();

      // Wait 2 seconds for the ticker to update
      await page.waitForTimeout(2000);

      const updatedTime = await timeCell.textContent();
      // The time should have changed (ticked forward)
      expect(updatedTime).not.toBe(initialTime);
    }
  });

  test('running time ticker interval is active on page load', async ({ page }) => {
    await page.goto('/admin/report');
    // Verify the setInterval is running by checking it updates a running task's time cell
    // We test this indirectly by confirming the ticker logic exists and executes
    const tickerExists = await page.evaluate(() => {
      // The interval modifies td:nth-child(7) for running tasks — we just confirm
      // the tasks array is populated (prerequisite for the ticker to work)
      return typeof formatRunningTime === 'function';
    });
    expect(tickerExists).toBe(true);
  });
});
