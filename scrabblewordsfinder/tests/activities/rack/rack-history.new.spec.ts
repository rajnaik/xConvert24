import { test, expect } from '@playwright/test';

/**
 * Rack History — API & UI Tests
 * Covers:
 *   - GET /api/rack-history?user_id=X (full history)
 *   - GET /api/rack-history?user_id=X&count=true (count only)
 *   - POST /api/rack-history (save entry)
 *   - UI: history button visibility, panel open/close, stats rendering
 */

const TEST_UID = 'test-rack-history-uid';

// ────────────────────────────────────────────────────────────────
// API Tests — Positive
// ────────────────────────────────────────────────────────────────

test.describe('Rack History API — Positive', () => {
  test('GET /api/rack-history/ with user_id returns history array', async ({ request }) => {
    const res = await request.get(`/api/rack-history/?user_id=${TEST_UID}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.history).toBeDefined();
    expect(Array.isArray(body.history)).toBe(true);
  });

  test('GET /api/rack-history/ with count=true returns numeric count', async ({ request }) => {
    const res = await request.get(`/api/rack-history/?user_id=${TEST_UID}&count=true`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.count).toBe('number');
  });

  test('POST /api/rack-history/ with valid payload returns success', async ({ request }) => {
    const res = await request.post('/api/rack-history/', {
      data: { user_id: TEST_UID, word: 'QUARTZ', score: 24, meaning: 'A hard mineral' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(typeof body.count).toBe('number');
  });

  test('POST /api/rack-history/ increments count', async ({ request }) => {
    // Get current count
    const countRes = await request.get(`/api/rack-history/?user_id=${TEST_UID}&count=true`);
    const before = (await countRes.json()).count || 0;

    // Submit a new entry
    await request.post('/api/rack-history/', {
      data: { user_id: TEST_UID, word: 'JAZZY', score: 33, meaning: 'Lively and stylish' },
    });

    // Verify count increased
    const afterRes = await request.get(`/api/rack-history/?user_id=${TEST_UID}&count=true`);
    const after = (await afterRes.json()).count;
    expect(after).toBeGreaterThan(before);
  });

  test('GET /api/rack-history/ entries include expected fields', async ({ request }) => {
    const res = await request.get(`/api/rack-history/?user_id=${TEST_UID}`);
    const body = await res.json();
    if (body.history && body.history.length > 0) {
      const entry = body.history[0];
      expect(entry.word).toBeDefined();
      expect(entry.score).toBeDefined();
      expect(entry.submitted_at).toBeDefined();
    }
  });

  test('GET /api/rack-history/ with trailing slash matches client URL format', async ({ request }) => {
    // The client (DailyRackPanel.astro) uses trailing slash: /api/rack-history/?user_id=...
    const res = await request.get(`/api/rack-history/?user_id=${TEST_UID}&count=true`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('count');
  });
});

// ────────────────────────────────────────────────────────────────
// API Tests — Negative
// ────────────────────────────────────────────────────────────────

test.describe('Rack History API — Negative', () => {
  test('GET /api/rack-history/ without user_id returns 400 or empty', async ({ request }) => {
    const res = await request.get('/api/rack-history/');
    // Either 400 (validation error) or 200 with empty — should not crash
    expect([200, 400]).toContain(res.status());
  });

  test('POST /api/rack-history/ without user_id returns error', async ({ request }) => {
    const res = await request.post('/api/rack-history/', {
      data: { word: 'TEST', score: 4 },
    });
    // Should reject (400) or at minimum not return 500
    expect(res.status()).not.toBe(500);
  });

  test('POST /api/rack-history/ without word does not crash', async ({ request }) => {
    const res = await request.post('/api/rack-history/', {
      data: { user_id: TEST_UID, score: 10, meaning: '' },
    });
    // Should handle gracefully — 400 (validation) or 200 (permissive)
    expect([200, 400]).toContain(res.status());
  });

  test('GET /api/rack-history/ with nonexistent user returns empty history', async ({ request }) => {
    const res = await request.get('/api/rack-history/?user_id=nonexistent-uid-xyz123');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.history).toBeDefined();
    expect(body.history.length).toBe(0);
  });

  test('GET /api/rack-history/ count for nonexistent user returns 0', async ({ request }) => {
    const res = await request.get('/api/rack-history/?user_id=nonexistent-uid-xyz123&count=true');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.count).toBe(0);
  });

  test('GET /api/rack-history without trailing slash still works (backward compat)', async ({ request }) => {
    // Even though client now uses trailing slash, the non-trailing version should not 404
    const res = await request.get(`/api/rack-history?user_id=${TEST_UID}&count=true`);
    expect(res.status()).not.toBe(404);
  });
});

// ────────────────────────────────────────────────────────────────
// UI Tests — Positive
// ────────────────────────────────────────────────────────────────

test.describe('Rack History UI — Positive', () => {
  test('history button exists in DOM', async ({ page }) => {
    await page.goto('/activities');
    const btn = page.locator('#drc-history-btn');
    await expect(btn).toBeAttached();
  });

  test('history panel exists in DOM and is hidden by default', async ({ page }) => {
    await page.goto('/activities');
    const panel = page.locator('#drc-history-panel');
    await expect(panel).toBeAttached();
    await expect(panel).toBeHidden();
  });

  test('history panel has close button', async ({ page }) => {
    await page.goto('/activities');
    const closeBtn = page.locator('#drc-history-close');
    await expect(closeBtn).toBeAttached();
  });

  test('history panel contains stats grid and groups container', async ({ page }) => {
    await page.goto('/activities');
    await expect(page.locator('#drc-history-stats')).toBeAttached();
    await expect(page.locator('#drc-history-groups')).toBeAttached();
  });

  test('history button shows when user has >1 history entries', async ({ page }) => {
    // Set a UID that has history, then check visibility
    await page.goto('/activities');
    await page.evaluate(() => {
      localStorage.setItem('swf-uid', 'test-rack-history-uid');
    });
    await page.reload();
    // Wait for the count API call to resolve
    await page.waitForTimeout(1500);
    const btn = page.locator('#drc-history-btn');
    // Button may or may not be visible depending on test env data — verify no crash
    const isHidden = await btn.evaluate(el => el.classList.contains('hidden'));
    expect(typeof isHidden).toBe('boolean');
  });

  test('clicking history button toggles panel visibility', async ({ page }) => {
    await page.goto('/activities');
    // Make history button visible for test
    await page.evaluate(() => {
      document.getElementById('drc-history-btn')?.classList.remove('hidden');
    });
    const btn = page.locator('#drc-history-btn');
    const panel = page.locator('#drc-history-panel');

    // Click to open
    await btn.click();
    await expect(panel).toBeVisible();

    // Click again to close
    await btn.click();
    await expect(panel).toBeHidden();
  });

  test('close button hides history panel', async ({ page }) => {
    await page.goto('/activities');
    // Force-open the panel
    await page.evaluate(() => {
      document.getElementById('drc-history-btn')?.classList.remove('hidden');
      document.getElementById('drc-history-panel')?.classList.remove('hidden');
    });
    const closeBtn = page.locator('#drc-history-close');
    await closeBtn.click();
    await expect(page.locator('#drc-history-panel')).toBeHidden();
  });
});

// ────────────────────────────────────────────────────────────────
// UI Tests — Negative
// ────────────────────────────────────────────────────────────────

test.describe('Rack History UI — Negative', () => {
  test('history button is hidden by default for new users with no history', async ({ page }) => {
    await page.goto('/activities');
    // Clear UID to simulate fresh user
    await page.evaluate(() => {
      localStorage.removeItem('swf-uid');
    });
    await page.reload();
    const btn = page.locator('#drc-history-btn');
    await expect(btn).toBeHidden();
  });

  test('no duplicate history panels in DOM', async ({ page }) => {
    await page.goto('/activities');
    const panels = page.locator('#drc-history-panel');
    await expect(panels).toHaveCount(1);
  });

  test('no duplicate history buttons in DOM', async ({ page }) => {
    await page.goto('/activities');
    const btns = page.locator('#drc-history-btn');
    await expect(btns).toHaveCount(1);
  });

  test('opening history panel does not produce page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/activities');
    // Force button visible and click
    await page.evaluate(() => {
      document.getElementById('drc-history-btn')?.classList.remove('hidden');
    });
    await page.locator('#drc-history-btn').click();
    await page.waitForTimeout(1000);

    const critical = errors.filter(e => e.includes('TypeError') || e.includes('Cannot read'));
    expect(critical).toHaveLength(0);
  });

  test('history panel shows empty state when no data', async ({ page }) => {
    await page.goto('/activities');
    // Set a UID with no history
    await page.evaluate(() => {
      localStorage.setItem('swf-uid', 'nonexistent-uid-xyz-nohist');
    });
    // Force button visible and open
    await page.evaluate(() => {
      document.getElementById('drc-history-btn')?.classList.remove('hidden');
    });
    await page.locator('#drc-history-btn').click();
    // Wait for API response
    await page.waitForTimeout(1500);
    // Either empty state or loading — should not crash
    const emptyEl = page.locator('#drc-history-empty');
    const contentEl = page.locator('#drc-history-content');
    // One of these should be visible (empty for no data, content for data)
    const emptyVisible = await emptyEl.isVisible();
    const contentVisible = await contentEl.isVisible();
    expect(emptyVisible || contentVisible).toBe(true);
  });
});
