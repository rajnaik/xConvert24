import { test, expect } from '@playwright/test';

/**
 * Solver Input — data-track="SolverUsed" Attribute & Focus Tracking Tests
 * Verifies the solver focus tracker fires "Solver" as ui_element to /api/clicks
 * when the #text-solver input (data-track="SolverUsed") gains focus.
 *
 * The global click tracker was removed — only focus on the solver input is tracked.
 */

test.describe('Solver data-track Attribute — Positive', () => {
  test('text solver input has data-track="SolverUsed" attribute', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('#text-solver');
    await expect(input).toHaveAttribute('data-track', 'SolverUsed');
  });

  test('only one element has data-track="SolverUsed"', async ({ page }) => {
    await page.goto('/');
    const count = await page.locator('[data-track="SolverUsed"]').count();
    expect(count).toBe(1);
  });
});

test.describe('Ask Lex AI data-track Attribute — Positive', () => {
  test('ask lex tile has data-track="Ask Lex AI" attribute', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('#ask-lex-tile');
    await expect(btn).toHaveAttribute('data-track', 'Ask Lex AI');
  });

  test('ask lex tile is visible and clickable on homepage', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('#ask-lex-tile');
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });
});

test.describe('Ask Lex AI data-track Attribute — Negative', () => {
  test('data-track attribute does not prevent modal from opening', async ({ page }) => {
    await page.goto('/');
    const btn = page.locator('#ask-lex-tile');
    await btn.click();
    const modal = page.locator('#lex-solver-modal');
    await expect(modal).toBeVisible();
  });

  test('no duplicate ask-lex-tile elements on homepage', async ({ page }) => {
    await page.goto('/');
    const count = await page.locator('#ask-lex-tile').count();
    expect(count).toBe(1);
  });
});

test.describe('Solver data-track Attribute — Negative', () => {
  test('data-track attribute does not break text input functionality', async ({ page }) => {
    await page.goto('/');
    const input = page.locator('#text-solver');
    await input.fill('QUARTZ');
    await expect(input).toHaveValue('QUARTZ');
  });

  test('clicking solver does NOT send a click tracking event (global click tracker removed)', async ({ page }) => {
    const payloads: any[] = [];
    await page.route('/api/clicks', async route => {
      if (route.request().method() === 'POST') {
        payloads.push(JSON.parse(route.request().postData() || '{}'));
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(500);

    // Click but do not focus the solver (use dispatchEvent to avoid triggering focus)
    await page.locator('#text-solve-btn').click();
    await page.waitForTimeout(400);

    // No click event should be sent (global tracker removed)
    const clickEvents = payloads.filter(p => p.ui_element !== 'Solver');
    expect(clickEvents).toHaveLength(0);
  });
});

test.describe('Solver Focus Tracking — Positive', () => {
  test('focusing text solver sends "Solver" as ui_element to /api/clicks', async ({ page }) => {
    const focusPayloads: any[] = [];
    await page.route('/api/clicks', async route => {
      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        focusPayloads.push(body);
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(500);

    // Use keyboard tab or direct focus to trigger focus event
    await page.locator('#text-solver').focus();
    await page.waitForTimeout(400);

    const solverFocus = focusPayloads.find(p => p.ui_element === 'Solver');
    expect(solverFocus).toBeTruthy();
    expect(solverFocus.ui_element).toBe('Solver');
  });

  test('focus tracking payload includes user_id and url fields', async ({ page }) => {
    let focusPayload: any = null;
    await page.route('/api/clicks', async route => {
      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        if (body.ui_element === 'Solver') {
          focusPayload = body;
        }
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(500);

    await page.locator('#text-solver').focus();
    await page.waitForTimeout(400);

    expect(focusPayload).toBeTruthy();
    expect(focusPayload).toHaveProperty('user_id');
    expect(focusPayload).toHaveProperty('url');
    expect(focusPayload.url).toBe('/');
  });

  test('focus tracking uses swf_user_id from localStorage', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).__swfStore = (window as any).__swfStore || {
        getRaw: (k: string) => localStorage.getItem(k),
        setRaw: (k: string, v: string) => localStorage.setItem(k, v),
      };
      localStorage.setItem('swf_user_id', 'test-focus-uid-123');
    });

    let focusPayload: any = null;
    await page.route('/api/clicks', async route => {
      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        if (body.ui_element === 'Solver') {
          focusPayload = body;
        }
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(500);

    await page.locator('#text-solver').focus();
    await page.waitForTimeout(400);

    expect(focusPayload).toBeTruthy();
    expect(focusPayload.user_id).toBe('test-focus-uid-123');
  });
});

test.describe('Solver Focus Tracking — Negative', () => {
  test('focus on non-data-track elements does not fire Solver tracking', async ({ page }) => {
    const payloads: any[] = [];
    await page.route('/api/clicks', async route => {
      if (route.request().method() === 'POST') {
        payloads.push(JSON.parse(route.request().postData() || '{}'));
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');
    await page.waitForTimeout(500);

    // Focus a different element (e.g. a link or non-tracked input)
    const otherFocusable = page.locator('a[href]').first();
    if (await otherFocusable.count() > 0) {
      await otherFocusable.focus();
      await page.waitForTimeout(400);
    }

    const solverFocusEvents = payloads.filter(p => p.ui_element === 'Solver');
    expect(solverFocusEvents).toHaveLength(0);
  });

  test('focus tracking does not crash when solver input is absent', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    // Navigate to a page that doesn't have #text-solver
    await page.goto('/about');
    await page.waitForTimeout(500);

    // Focus any element — should not throw
    const anyFocusable = page.locator('a[href]').first();
    if (await anyFocusable.count() > 0) {
      await anyFocusable.focus();
      await page.waitForTimeout(300);
    }

    const criticalErrors = errors.filter(e => e.includes('getAttribute') || e.includes('data-track'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('focus tracker skips admin pages entirely', async ({ page }) => {
    const payloads: any[] = [];
    await page.route('/api/clicks', async route => {
      if (route.request().method() === 'POST') {
        payloads.push(JSON.parse(route.request().postData() || '{}'));
        await route.fulfill({ json: { success: true } });
      } else {
        await route.continue();
      }
    });

    await page.goto('/admin');
    await page.waitForTimeout(500);

    // Focus any element on admin — should not send tracking
    const anyFocusable = page.locator('input, a[href]').first();
    if (await anyFocusable.count() > 0) {
      await anyFocusable.focus();
      await page.waitForTimeout(400);
    }

    expect(payloads).toHaveLength(0);
  });
});
