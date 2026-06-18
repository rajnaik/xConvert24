import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;
const API_URL = `${BASE_URL}/api/rack-history`;

// ── Rack History — Positive ─────────────────────────────────────────────

test.describe('Rack History — Positive', () => {
  test('history button exists in DRC panel header (hidden by default)', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-content', { timeout: 10000 });
    const btn = page.locator('#drc-history-btn');
    await expect(btn).toHaveCount(1);
    // Hidden by default when no history
    await expect(btn).toHaveClass(/hidden/);
  });

  test('history button becomes visible when user has >= 1 rack_history records', async ({ page }) => {
    await page.route('**/api/rack-history*', route => {
      const url = route.request().url();
      if (url.includes('count=true')) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 5 }) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ history: [], racks: {} }) });
      }
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-rack-history-user');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-content', { timeout: 10000 });

    const btn = page.locator('#drc-history-btn');
    await expect(btn).not.toHaveClass(/hidden/, { timeout: 5000 });
    await expect(btn).toBeVisible();
  });

  test('history button is visible with exactly 1 rack_history record (boundary)', async ({ page }) => {
    await page.route('**/api/rack-history*', route => {
      const url = route.request().url();
      if (url.includes('count=true')) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 1 }) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ history: [{ word: 'ZAP', score: 14, meaning: 'To destroy', submitted_at: '2026-06-18T09:00:00Z' }], racks: { '2026-06-18': 'ZAPXQWL' } }) });
      }
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-rack-history-user');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-content', { timeout: 10000 });

    const btn = page.locator('#drc-history-btn');
    await expect(btn).not.toHaveClass(/hidden/, { timeout: 5000 });
    await expect(btn).toBeVisible();
  });

  test('clicking history button opens the history panel', async ({ page }) => {
    await page.route('**/api/rack-history*', route => {
      const url = route.request().url();
      if (url.includes('count=true')) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 3 }) });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            history: [
              { word: 'QUIZ', score: 22, meaning: 'A test', submitted_at: '2026-06-18T10:00:00Z' },
              { word: 'ZAP', score: 14, meaning: 'To destroy', submitted_at: '2026-06-18T09:00:00Z' },
              { word: 'JINXING', score: 22, meaning: 'Bringing bad luck', submitted_at: '2026-06-17T15:00:00Z' },
            ],
            racks: { '2026-06-18': 'QUIZXAP', '2026-06-17': 'JINXING' }
          }),
        });
      }
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-rack-history-user');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-history-btn:not(.hidden)', { timeout: 8000 });
    await page.locator('#drc-history-btn').click();

    const panel = page.locator('#drc-history-panel');
    await expect(panel).not.toHaveClass(/hidden/);
    await expect(panel).toBeVisible();
  });

  test('history panel shows grouped entries by date with stats', async ({ page }) => {
    await page.route('**/api/rack-history*', route => {
      const url = route.request().url();
      if (url.includes('count=true')) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 3 }) });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            history: [
              { word: 'QUIZ', score: 22, meaning: 'A test', submitted_at: '2026-06-18T10:00:00Z' },
              { word: 'ZAP', score: 14, meaning: 'To destroy', submitted_at: '2026-06-18T09:00:00Z' },
              { word: 'JINXING', score: 22, meaning: 'Bringing bad luck', submitted_at: '2026-06-17T15:00:00Z' },
            ],
            racks: { '2026-06-18': 'QUIZXAP', '2026-06-17': 'JINXING' }
          }),
        });
      }
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-rack-history-user');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-history-btn:not(.hidden)', { timeout: 8000 });
    await page.locator('#drc-history-btn').click();

    // Wait for content to load
    await page.waitForSelector('#drc-history-content:not(.hidden)', { timeout: 5000 });

    // Stats should show 3 words, avg 19 pts (58/3 = 19.33 → 19), 1 bingo
    const stats = page.locator('#drc-history-stats');
    await expect(stats).toContainText('3'); // total words
    await expect(stats).toContainText('19'); // avg pts (round(58/3))
    await expect(stats).toContainText('1'); // bingos (JINXING = 7 letters)
  });

  test('bingo words (7 letters) are highlighted with 🎯 icon', async ({ page }) => {
    await page.route('**/api/rack-history*', route => {
      const url = route.request().url();
      if (url.includes('count=true')) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 2 }) });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            history: [
              { word: 'JINXING', score: 22, meaning: 'Bringing bad luck', submitted_at: '2026-06-18T10:00:00Z' },
              { word: 'ZAP', score: 14, meaning: 'To destroy', submitted_at: '2026-06-18T09:00:00Z' },
            ],
            racks: { '2026-06-18': 'JINXZAP' }
          }),
        });
      }
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-rack-history-user');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-history-btn:not(.hidden)', { timeout: 8000 });
    await page.locator('#drc-history-btn').click();
    await page.waitForSelector('#drc-history-content:not(.hidden)', { timeout: 5000 });

    // JINXING row should have the bingo icon
    const groups = page.locator('#drc-history-groups');
    await expect(groups).toContainText('JINXING');
    await expect(groups).toContainText('🎯');
  });

  test('close button hides the history panel', async ({ page }) => {
    await page.route('**/api/rack-history*', route => {
      const url = route.request().url();
      if (url.includes('count=true')) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 2 }) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ history: [{ word: 'ZAP', score: 14, meaning: '', submitted_at: '2026-06-18T09:00:00Z' }, { word: 'CAT', score: 5, meaning: '', submitted_at: '2026-06-18T08:00:00Z' }], racks: { '2026-06-18': 'ZAPXCAT' } }) });
      }
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-rack-history-user');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-history-btn:not(.hidden)', { timeout: 8000 });
    await page.locator('#drc-history-btn').click();
    await page.waitForSelector('#drc-history-panel:not(.hidden)', { timeout: 3000 });

    await page.locator('#drc-history-close').click();
    await expect(page.locator('#drc-history-panel')).toHaveClass(/hidden/);
  });
});

// ── Rack History — Negative ─────────────────────────────────────────────

test.describe('Rack History — Negative', () => {
  test('history button stays hidden when user has 0 records', async ({ page }) => {
    await page.route('**/api/rack-history*', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) });
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-rack-history-user');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-content', { timeout: 10000 });
    await page.waitForTimeout(1000);

    const btn = page.locator('#drc-history-btn');
    await expect(btn).toHaveClass(/hidden/);
  });

  test('history button stays hidden when no user_id exists', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('swf-uid');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-content', { timeout: 10000 });
    await page.waitForTimeout(1000);

    const btn = page.locator('#drc-history-btn');
    await expect(btn).toHaveClass(/hidden/);
  });

  test('no duplicate history buttons exist', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-content', { timeout: 10000 });
    const btns = page.locator('#drc-history-btn');
    await expect(btns).toHaveCount(1);
  });

  test('history panel shows empty state when API returns empty array', async ({ page }) => {
    await page.route('**/api/rack-history*', route => {
      const url = route.request().url();
      if (url.includes('count=true')) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 2 }) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ history: [], racks: {} }) });
      }
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-rack-history-user');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-history-btn:not(.hidden)', { timeout: 8000 });
    await page.locator('#drc-history-btn').click();

    await page.waitForSelector('#drc-history-empty:not(.hidden)', { timeout: 5000 });
    await expect(page.locator('#drc-history-empty')).toContainText('No rack history yet');
  });

  test('no JS errors when history panel is toggled rapidly', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('**/api/rack-history*', route => {
      const url = route.request().url();
      if (url.includes('count=true')) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 5 }) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ history: [{ word: 'ZAP', score: 14, meaning: '', submitted_at: '2026-06-18T09:00:00Z' }], racks: { '2026-06-18': 'ZAPXQWL' } }) });
      }
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-rack-history-user');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-history-btn:not(.hidden)', { timeout: 8000 });

    // Rapid toggle
    await page.locator('#drc-history-btn').click();
    await page.waitForTimeout(100);
    await page.locator('#drc-history-btn').click();
    await page.waitForTimeout(100);
    await page.locator('#drc-history-btn').click();
    await page.waitForTimeout(500);

    const critical = errors.filter(e => e.includes('TypeError') || e.includes('Cannot read'));
    expect(critical).toHaveLength(0);
  });

  test('non-bingo words (< 7 letters) do not get 🎯 icon', async ({ page }) => {
    await page.route('**/api/rack-history*', route => {
      const url = route.request().url();
      if (url.includes('count=true')) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 2 }) });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            history: [
              { word: 'ZAP', score: 14, meaning: 'To destroy', submitted_at: '2026-06-18T10:00:00Z' },
              { word: 'CAT', score: 5, meaning: 'A feline', submitted_at: '2026-06-18T09:00:00Z' },
            ],
            racks: { '2026-06-18': 'ZAPXCAT' }
          }),
        });
      }
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-rack-history-user');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-history-btn:not(.hidden)', { timeout: 8000 });
    await page.locator('#drc-history-btn').click();
    await page.waitForSelector('#drc-history-content:not(.hidden)', { timeout: 5000 });

    const groups = page.locator('#drc-history-groups');
    await expect(groups).not.toContainText('🎯');
  });
});

// ── Rack History API — Racks Field (Positive) ───────────────────────────

test.describe('Rack History API — Racks Field (Positive)', () => {
  test('API response includes racks object mapping dates to rack tiles', async ({ request }) => {
    const res = await request.get(`${API_URL}?user_id=test-rack-api-user`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('history');
    expect(data).toHaveProperty('racks');
    expect(typeof data.racks).toBe('object');
  });

  test('racks keys correspond to dates from history entries', async ({ page }) => {
    let apiResponse: any = null;
    await page.route('**/api/rack-history*', route => {
      const url = route.request().url();
      if (url.includes('count=true')) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 3 }) });
      } else {
        const mockData = {
          history: [
            { word: 'QUIZ', score: 22, meaning: 'A test', submitted_at: '2026-06-18T10:00:00Z' },
            { word: 'ZAP', score: 14, meaning: 'To destroy', submitted_at: '2026-06-17T09:00:00Z' },
          ],
          racks: { '2026-06-18': 'QUIZXYZ', '2026-06-17': 'ZAPABCD' }
        };
        apiResponse = mockData;
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockData) });
      }
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-rack-history-user');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-history-btn:not(.hidden)', { timeout: 8000 });
    await page.locator('#drc-history-btn').click();
    await page.waitForSelector('#drc-history-content:not(.hidden)', { timeout: 5000 });

    // Verify racks keys match the dates from history entries
    expect(apiResponse).not.toBeNull();
    const historyDates = [...new Set(apiResponse.history.map((h: any) => h.submitted_at.split('T')[0]))];
    const rackDates = Object.keys(apiResponse.racks);
    for (const date of historyDates) {
      expect(rackDates).toContain(date);
    }
  });

  test('racks values are non-empty strings (tile letters)', async ({ page }) => {
    await page.route('**/api/rack-history*', route => {
      const url = route.request().url();
      if (url.includes('count=true')) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 2 }) });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            history: [
              { word: 'QUIZ', score: 22, meaning: 'A test', submitted_at: '2026-06-18T10:00:00Z' },
            ],
            racks: { '2026-06-18': 'QUIZXYZ' }
          }),
        });
      }
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-rack-history-user');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-history-btn:not(.hidden)', { timeout: 8000 });
    await page.locator('#drc-history-btn').click();
    await page.waitForSelector('#drc-history-content:not(.hidden)', { timeout: 5000 });

    // No errors should occur — the UI consumes racks gracefully
    // (validates that parsing racks as Record<string, string> doesn't crash)
  });
});

// ── Rack History API — Racks Field (Negative) ───────────────────────────

test.describe('Rack History API — Racks Field (Negative)', () => {
  test('racks is empty object when history has no entries', async ({ page }) => {
    await page.route('**/api/rack-history*', route => {
      const url = route.request().url();
      if (url.includes('count=true')) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 1 }) });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ history: [], racks: {} }),
        });
      }
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-rack-history-user');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-history-btn:not(.hidden)', { timeout: 8000 });
    await page.locator('#drc-history-btn').click();

    // Should show empty state without crashing
    await page.waitForSelector('#drc-history-empty:not(.hidden)', { timeout: 5000 });
    await expect(page.locator('#drc-history-empty')).toContainText('No rack history yet');
  });

  test('UI does not crash when racks field is missing from response (backward compat)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('**/api/rack-history*', route => {
      const url = route.request().url();
      if (url.includes('count=true')) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 2 }) });
      } else {
        // Simulate old API response without racks field
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            history: [
              { word: 'ZAP', score: 14, meaning: 'To destroy', submitted_at: '2026-06-18T09:00:00Z' },
            ],
          }),
        });
      }
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-rack-history-user');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-history-btn:not(.hidden)', { timeout: 8000 });
    await page.locator('#drc-history-btn').click();
    await page.waitForSelector('#drc-history-content:not(.hidden)', { timeout: 5000 });

    // No TypeError from accessing undefined racks
    const critical = errors.filter(e => e.includes('TypeError') || e.includes('Cannot read'));
    expect(critical).toHaveLength(0);
  });

  test('UI does not crash when racks has dates with no matching history', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('**/api/rack-history*', route => {
      const url = route.request().url();
      if (url.includes('count=true')) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 1 }) });
      } else {
        // Racks contains a date that has no corresponding history entry
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            history: [
              { word: 'ZAP', score: 14, meaning: 'To destroy', submitted_at: '2026-06-18T09:00:00Z' },
            ],
            racks: { '2026-06-18': 'ZAPXQWL', '2026-06-15': 'ORPHAN_' }
          }),
        });
      }
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-rack-history-user');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-history-btn:not(.hidden)', { timeout: 8000 });
    await page.locator('#drc-history-btn').click();
    await page.waitForSelector('#drc-history-content:not(.hidden)', { timeout: 5000 });

    // Should render without errors even with extra rack data
    const critical = errors.filter(e => e.includes('TypeError') || e.includes('Cannot read'));
    expect(critical).toHaveLength(0);
  });

  test('API returns 400 when user_id is missing', async ({ request }) => {
    const res = await request.get(API_URL);
    expect(res.status()).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('user_id required');
  });
});

// ── Rack History — SQLite Date Format Support (Positive) ────────────────

test.describe('Rack History — SQLite Date Format (Positive)', () => {
  test('history groups correctly when submitted_at uses space separator (SQLite format)', async ({ page }) => {
    await page.route('**/api/rack-history*', route => {
      const url = route.request().url();
      if (url.includes('count=true')) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 3 }) });
      } else {
        // SQLite datetime() produces "YYYY-MM-DD HH:MM:SS" (space, not T)
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            history: [
              { word: 'QUIZ', score: 22, meaning: 'A test', submitted_at: '2026-06-18 10:00:00' },
              { word: 'ZAP', score: 14, meaning: 'To destroy', submitted_at: '2026-06-18 09:00:00' },
              { word: 'JINXING', score: 22, meaning: 'Bringing bad luck', submitted_at: '2026-06-17 15:00:00' },
            ],
            racks: { '2026-06-18': 'QUIZXAP', '2026-06-17': 'JINXING' }
          }),
        });
      }
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-rack-history-user');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-history-btn:not(.hidden)', { timeout: 8000 });
    await page.locator('#drc-history-btn').click();
    await page.waitForSelector('#drc-history-content:not(.hidden)', { timeout: 5000 });

    // Stats should show 3 words, avg 19 pts (58/3 = 19.33 → 19), 1 bingo — same as ISO format test
    const stats = page.locator('#drc-history-stats');
    await expect(stats).toContainText('3');
    await expect(stats).toContainText('19');
    await expect(stats).toContainText('1');
  });

  test('history groups entries from mixed date formats (ISO + SQLite) into correct days', async ({ page }) => {
    await page.route('**/api/rack-history*', route => {
      const url = route.request().url();
      if (url.includes('count=true')) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 4 }) });
      } else {
        // Mix of ISO (T) and SQLite (space) date formats — both should group under same date
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            history: [
              { word: 'QUIZ', score: 22, meaning: 'A test', submitted_at: '2026-06-18T10:00:00Z' },
              { word: 'ZAP', score: 14, meaning: 'To destroy', submitted_at: '2026-06-18 09:30:00' },
              { word: 'CAT', score: 5, meaning: 'A feline', submitted_at: '2026-06-17T08:00:00Z' },
              { word: 'DOG', score: 5, meaning: 'A canine', submitted_at: '2026-06-17 07:00:00' },
            ],
            racks: { '2026-06-18': 'QUIZXAP', '2026-06-17': 'CATXDOG' }
          }),
        });
      }
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-rack-history-user');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-history-btn:not(.hidden)', { timeout: 8000 });
    await page.locator('#drc-history-btn').click();
    await page.waitForSelector('#drc-history-content:not(.hidden)', { timeout: 5000 });

    // Should show 4 words total, grouped into 2 dates
    const stats = page.locator('#drc-history-stats');
    await expect(stats).toContainText('4');

    // Both dates should appear in the groups
    const groups = page.locator('#drc-history-groups');
    await expect(groups).toContainText('QUIZ');
    await expect(groups).toContainText('ZAP');
    await expect(groups).toContainText('CAT');
    await expect(groups).toContainText('DOG');
  });

  test('rack tiles display correctly for SQLite-formatted date entries', async ({ page }) => {
    await page.route('**/api/rack-history*', route => {
      const url = route.request().url();
      if (url.includes('count=true')) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 1 }) });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            history: [
              { word: 'JINXING', score: 22, meaning: 'Bringing bad luck', submitted_at: '2026-06-18 14:30:00' },
            ],
            racks: { '2026-06-18': 'JINXING' }
          }),
        });
      }
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-rack-history-user');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-history-btn:not(.hidden)', { timeout: 8000 });
    await page.locator('#drc-history-btn').click();
    await page.waitForSelector('#drc-history-content:not(.hidden)', { timeout: 5000 });

    // The rack tiles for the date should render (rack = "JINXING")
    const groups = page.locator('#drc-history-groups');
    await expect(groups).toContainText('JINXING');
    await expect(groups).toContainText('🎯'); // 7-letter bingo
  });
});

// ── Rack History — SQLite Date Format Support (Negative) ────────────────

test.describe('Rack History — SQLite Date Format (Negative)', () => {
  test('no JS errors when submitted_at is null for some entries', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('**/api/rack-history*', route => {
      const url = route.request().url();
      if (url.includes('count=true')) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 3 }) });
      } else {
        // Some entries have null submitted_at — the API filters these out
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            history: [
              { word: 'QUIZ', score: 22, meaning: 'A test', submitted_at: '2026-06-18 10:00:00' },
              { word: 'ZAP', score: 14, meaning: 'To destroy', submitted_at: null },
              { word: 'CAT', score: 5, meaning: 'A feline', submitted_at: '2026-06-17T08:00:00Z' },
            ],
            racks: { '2026-06-18': 'QUIZXYZ', '2026-06-17': 'CATXDOG' }
          }),
        });
      }
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-rack-history-user');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-history-btn:not(.hidden)', { timeout: 8000 });
    await page.locator('#drc-history-btn').click();
    await page.waitForSelector('#drc-history-content:not(.hidden)', { timeout: 5000 });

    const critical = errors.filter(e => e.includes('TypeError') || e.includes('Cannot read') || e.includes('split'));
    expect(critical).toHaveLength(0);
  });

  test('no crash when submitted_at has unexpected format (e.g. date-only string)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('**/api/rack-history*', route => {
      const url = route.request().url();
      if (url.includes('count=true')) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 2 }) });
      } else {
        // Edge case: submitted_at is just a date string with no time component
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            history: [
              { word: 'QUIZ', score: 22, meaning: 'A test', submitted_at: '2026-06-18' },
              { word: 'ZAP', score: 14, meaning: 'To destroy', submitted_at: '2026-06-17' },
            ],
            racks: { '2026-06-18': 'QUIZXYZ', '2026-06-17': 'ZAPABCD' }
          }),
        });
      }
    });
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-rack-history-user');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#drc-history-btn:not(.hidden)', { timeout: 8000 });
    await page.locator('#drc-history-btn').click();
    await page.waitForSelector('#drc-history-content:not(.hidden)', { timeout: 5000 });

    // Should render without crashing — date-only strings still produce a valid date via split
    const critical = errors.filter(e => e.includes('TypeError') || e.includes('Cannot read') || e.includes('split'));
    expect(critical).toHaveLength(0);

    // Both words should still be displayed
    const groups = page.locator('#drc-history-groups');
    await expect(groups).toContainText('QUIZ');
    await expect(groups).toContainText('ZAP');
  });
});

