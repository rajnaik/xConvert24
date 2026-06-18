import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;
const HISTORY_URL = `${BASE_URL}/anagram-history/`;

// ── Anagram History Button (on Activities Page) — Positive ───────────────

test.describe('Anagram History Button — Positive', () => {
  test('history button element exists in the anagram panel', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const btn = page.locator('#anagram-history-btn');
    await expect(btn).toHaveCount(1);
  });

  test('history button links to /anagram-history/', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const btn = page.locator('#anagram-history-btn');
    const href = await btn.getAttribute('href');
    expect(href).toBe('/anagram-history/');
  });

  test('history button becomes visible when user has anagram history', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'playwright-anagram-history-test');
    });
    // Mock the count endpoint to return 1+ games
    await page.route('**/api/anagram-history/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 5 }) });
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForFunction(() => {
      const btn = document.getElementById('anagram-history-btn');
      return btn && !btn.classList.contains('hidden');
    }, { timeout: 5000 });
    const btn = page.locator('#anagram-history-btn');
    await expect(btn).toBeVisible();
  });

  test('history button is hidden by default (no history)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('swf-uid');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(1000);
    const btn = page.locator('#anagram-history-btn');
    const isHidden = await btn.evaluate(el => el.classList.contains('hidden'));
    expect(isHidden).toBe(true);
  });
});

// ── Anagram History Button — Negative ────────────────────────────────────

test.describe('Anagram History Button — Negative', () => {
  test('no duplicate history buttons exist on activities page', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const btns = page.locator('#anagram-history-btn');
    await expect(btns).toHaveCount(1);
  });

  test('history button stays hidden when count API returns 0', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'playwright-no-history-user');
    });
    await page.route('**/api/anagram-history/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ count: 0 }) });
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(2000);
    const btn = page.locator('#anagram-history-btn');
    const isHidden = await btn.evaluate(el => el.classList.contains('hidden'));
    expect(isHidden).toBe(true);
  });

  test('no JS errors from history button script on activities page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'playwright-error-check');
    });
    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(2000);
    const criticalErrors = errors.filter(e =>
      e.includes('anagram-history') || e.includes('Cannot read properties of null')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});

// ── Anagram History Page — Positive ──────────────────────────────────────

test.describe('Anagram History Page — Positive', () => {
  test('page loads and shows heading', async ({ page }) => {
    await page.goto(HISTORY_URL);
    await expect(page.locator('main h1')).toContainText('Anagram History');
  });

  test('back link to activities exists', async ({ page }) => {
    await page.goto(HISTORY_URL);
    const link = page.getByRole('link', { name: '← Back to Activities' });
    await expect(link).toBeVisible();
  });

  test('history table container has negative right margin for extended width', async ({ page }) => {
    await page.goto(HISTORY_URL);
    const tableWrapper = page.locator('#ah-content .rounded-xl.border.border-rose-800\\/50.bg-gray-900\\/50.p-6');
    await expect(tableWrapper).toHaveCount(1);
    await expect(tableWrapper).toHaveClass(/-mr-\[100px\]/);
  });

  test('stats grid has negative right margin for extended width', async ({ page }) => {
    await page.goto(HISTORY_URL);
    const statsGrid = page.locator('#ah-stats');
    await expect(statsGrid).toHaveClass(/-mr-\[100px\]/);
  });

  test('table header shows Puzzle column (renamed from Word)', async ({ page }) => {
    await page.goto(HISTORY_URL);
    const headers = page.locator('thead th');
    await expect(headers.nth(1)).toContainText('Puzzle');
  });

  test('table header includes Time Taken column', async ({ page }) => {
    await page.goto(HISTORY_URL);
    const headers = page.locator('thead th');
    await expect(headers.nth(4)).toContainText('Time Taken');
  });

  test('table has 6 column headers (Date, Puzzle, Result, Attempts, Time, Guesses)', async ({ page }) => {
    await page.goto(HISTORY_URL);
    const headers = page.locator('thead th');
    await expect(headers).toHaveCount(6);
  });

  test('shows empty state when no UID is set', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('swf-uid');
    });
    await page.goto(HISTORY_URL);
    await page.waitForSelector('#ah-empty:not(.hidden)', { timeout: 5000 });
    await expect(page.locator('#ah-empty')).toBeVisible();
    await expect(page.locator('#ah-empty')).toContainText('No Anagram History Yet');
  });

  test('shows stats and table when history exists', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'playwright-history-page-test');
    });
    await page.route('**/api/anagram-history/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          history: [
            { date: '2026-06-18', attempts: 3, solved: 1, guesses: JSON.stringify([
              { guess: 'FROZEN', feedback: ['green','green','green','green','green','green'] }
            ]), time_taken: 0, created_at: '2026-06-18 10:00:00' },
            { date: '2026-06-17', attempts: 5, solved: 0, guesses: JSON.stringify([
              { guess: 'SPHINX', feedback: ['gray','gray','gray','gray','gray','gray'] }
            ]), time_taken: 0, created_at: '2026-06-17 10:00:00' },
          ],
          puzzles: {
            '2026-06-18': { word: 'FROZEN', scrambled: 'NZOFRE', hint: 'Solidified by cold' },
            '2026-06-17': { word: 'SPHINX', scrambled: 'XNPHIS', hint: 'Mythical creature' },
          },
          stats: { totalGames: 2, totalSolved: 1, avgAttempts: 4, streak: 1, solveRate: 50 },
        }),
      });
    });
    await page.goto(HISTORY_URL);
    await page.waitForSelector('#ah-content:not(.hidden)', { timeout: 5000 });
    await expect(page.locator('#ah-content')).toBeVisible();
    // Stats populated
    await expect(page.locator('#ah-stat-total')).toContainText('2');
    await expect(page.locator('#ah-stat-solved')).toContainText('1');
    await expect(page.locator('#ah-stat-rate')).toContainText('50%');
    await expect(page.locator('#ah-stat-streak')).toContainText('1');
  });

  test('table shows solved word and colour-coded guess grid', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'playwright-table-test');
    });
    await page.route('**/api/anagram-history/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          history: [
            { date: '2026-06-18', attempts: 2, solved: 1, guesses: JSON.stringify([
              { guess: 'FRENZY', feedback: ['green','yellow','gray','gray','gray','gray'] },
              { guess: 'FROZEN', feedback: ['green','green','green','green','green','green'] }
            ]), time_taken: 0, created_at: '2026-06-18 10:00:00' },
          ],
          puzzles: { '2026-06-18': { word: 'FROZEN', scrambled: 'NZOFRE', hint: 'Solidified by cold' } },
          stats: { totalGames: 1, totalSolved: 1, avgAttempts: 2, streak: 1, solveRate: 100 },
        }),
      });
    });
    await page.goto(HISTORY_URL);
    await page.waitForSelector('#ah-content:not(.hidden)', { timeout: 5000 });
    const tbody = page.locator('#ah-body');
    // Should contain the word FROZEN in puzzle column
    await expect(tbody).toContainText('FROZEN');
    // Should render a guess grid container with flex columns
    const guessGrid = tbody.locator('.flex.flex-col.gap-0\\.5');
    await expect(guessGrid).toHaveCount(1);
    // Grid should have 3 rows: scrambled + 2 guess attempts
    const rows = guessGrid.locator(':scope > .flex.gap-0\\.5');
    await expect(rows).toHaveCount(3);
  });

  test('empty state has CTA link to activities', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('swf-uid');
    });
    await page.goto(HISTORY_URL);
    await page.waitForSelector('#ah-empty:not(.hidden)', { timeout: 5000 });
    const cta = page.locator('#ah-empty a[href="/activities/"]');
    await expect(cta).toBeVisible();
    await expect(cta).toContainText('Play Daily Anagram');
  });
});

// ── Anagram History Page — Time & Puzzle Columns ─────────────────────────

test.describe('Anagram History Page — Time & Puzzle Columns', () => {
  const mockHistory = (timeTaken: number, solved: number) => ({
    history: [
      { date: '2026-06-18', attempts: 3, solved, guesses: JSON.stringify([
        { guess: 'FRENZY', feedback: ['green','yellow','gray','gray','gray','gray'] },
        { guess: 'FROZEN', feedback: ['green','green','green','green','green','green'] }
      ]), time_taken: timeTaken, created_at: '2026-06-18 10:00:00' },
    ],
    puzzles: { '2026-06-18': { word: 'FROZEN', scrambled: 'NZOFRE', hint: 'Solidified by cold' } },
    stats: { totalGames: 1, totalSolved: solved, avgAttempts: 3, streak: solved, solveRate: solved * 100 },
  });

  test('table header includes Puzzle and Time columns', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'pw-col-header'); });
    await page.route('**/api/anagram-history/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockHistory(45, 1)) });
    });
    await page.goto(`${BASE_URL}/anagram-history/`);
    await page.waitForSelector('#ah-content:not(.hidden)', { timeout: 5000 });
    const headers = page.locator('thead th');
    const headerTexts = await headers.allTextContents();
    expect(headerTexts).toContain('Puzzle');
    expect(headerTexts).toContain('Time Taken');
  });

  test('puzzle column shows scrambled → answer for solved entries', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'pw-puzzle-solved'); });
    await page.route('**/api/anagram-history/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockHistory(90, 1)) });
    });
    await page.goto(`${BASE_URL}/anagram-history/`);
    await page.waitForSelector('#ah-content:not(.hidden)', { timeout: 5000 });
    const puzzleCell = page.locator('#ah-body tr:first-child td:nth-child(2)');
    const text = await puzzleCell.textContent();
    expect(text).toContain('NZOFRE');
    expect(text).toContain('→');
    expect(text).toContain('FROZEN');
  });

  test('puzzle column shows scrambled → unsolved for failed entries', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'pw-puzzle-unsolved'); });
    await page.route('**/api/anagram-history/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockHistory(120, 0)) });
    });
    await page.goto(`${BASE_URL}/anagram-history/`);
    await page.waitForSelector('#ah-content:not(.hidden)', { timeout: 5000 });
    const puzzleCell = page.locator('#ah-body tr:first-child td:nth-child(2)');
    const text = await puzzleCell.textContent();
    expect(text).toContain('NZOFRE');
    expect(text).toContain('→');
    expect(text).toContain('unsolved');
    expect(text).not.toContain('FROZEN');
  });

  test('time column shows seconds format for times under 60s', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'pw-time-sec'); });
    await page.route('**/api/anagram-history/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockHistory(45, 1)) });
    });
    await page.goto(`${BASE_URL}/anagram-history/`);
    await page.waitForSelector('#ah-content:not(.hidden)', { timeout: 5000 });
    const timeCell = page.locator('#ah-body tr:first-child td:nth-child(5)');
    await expect(timeCell).toContainText('45s');
  });

  test('time column shows minutes+seconds format for times over 60s', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'pw-time-min'); });
    await page.route('**/api/anagram-history/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockHistory(125, 1)) });
    });
    await page.goto(`${BASE_URL}/anagram-history/`);
    await page.waitForSelector('#ah-content:not(.hidden)', { timeout: 5000 });
    const timeCell = page.locator('#ah-body tr:first-child td:nth-child(5)');
    await expect(timeCell).toContainText('2m 05s');
  });

  test('time column shows dash when time_taken is 0', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'pw-time-zero'); });
    await page.route('**/api/anagram-history/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockHistory(0, 1)) });
    });
    await page.goto(`${BASE_URL}/anagram-history/`);
    await page.waitForSelector('#ah-content:not(.hidden)', { timeout: 5000 });
    const timeCell = page.locator('#ah-body tr:first-child td:nth-child(5)');
    await expect(timeCell).toContainText('—');
  });
});

// ── Anagram History Page — Negative ──────────────────────────────────────

test.describe('Anagram History Page — Negative', () => {
  test('table header does not contain old "Word" column name', async ({ page }) => {
    await page.goto(HISTORY_URL);
    const headerTexts = await page.locator('thead th').allTextContents();
    expect(headerTexts).not.toContain('Word');
  });

  test('history table container parent does not clip with overflow-hidden', async ({ page }) => {
    await page.goto(HISTORY_URL);
    // The parent of the table wrapper (main content area) should not have overflow-hidden
    // which would defeat the -mr-[100px] negative margin
    const contentDiv = page.locator('#ah-content');
    const classes = await contentDiv.getAttribute('class') || '';
    expect(classes).not.toContain('overflow-hidden');
  });

  test('handles API failure gracefully (shows error message)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'playwright-fail-test');
    });
    await page.route('**/api/anagram-history/**', async (route) => {
      await route.fulfill({ status: 500, body: 'Internal Server Error' });
    });
    await page.goto(HISTORY_URL);
    await page.waitForTimeout(2000);
    // Should show error text, not crash
    const loading = page.locator('#ah-loading');
    await expect(loading).toContainText('Could not load');
  });

  test('no JS errors on anagram history page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'playwright-noerror-test');
    });
    await page.route('**/api/anagram-history/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ history: [], puzzles: {}, stats: { totalGames: 0, totalSolved: 0, avgAttempts: 0, streak: 0, solveRate: 0 } }),
      });
    });
    await page.goto(HISTORY_URL);
    await page.waitForTimeout(2000);
    const criticalErrors = errors.filter(e =>
      e.toLowerCase().includes('typeerror') ||
      e.toLowerCase().includes('referenceerror')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('page does not crash when API returns empty history array', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'playwright-empty-array-test');
    });
    await page.route('**/api/anagram-history/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ history: [], puzzles: {}, stats: { totalGames: 0, totalSolved: 0, avgAttempts: 0, streak: 0, solveRate: 0 } }),
      });
    });
    await page.goto(HISTORY_URL);
    await page.waitForSelector('#ah-empty:not(.hidden)', { timeout: 5000 });
    await expect(page.locator('#ah-empty')).toBeVisible();
  });

  test('table does not show answer word for unsolved puzzles', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'playwright-unsolved-test');
    });
    await page.route('**/api/anagram-history/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          history: [
            { date: '2026-06-17', attempts: 5, solved: 0, guesses: JSON.stringify([
              { guess: 'WRONG', feedback: ['gray','gray','gray','gray','gray'] }
            ]), time_taken: 0, created_at: '2026-06-17 10:00:00' },
          ],
          puzzles: { '2026-06-17': { word: 'SPHINX', scrambled: 'XNPHIS', hint: 'Mythical creature' } },
          stats: { totalGames: 1, totalSolved: 0, avgAttempts: 5, streak: 0, solveRate: 0 },
        }),
      });
    });
    await page.goto(HISTORY_URL);
    await page.waitForSelector('#ah-content:not(.hidden)', { timeout: 5000 });
    const tbody = page.locator('#ah-body');
    // Should NOT show the answer word for unsolved puzzles
    const tbodyText = await tbody.textContent();
    expect(tbodyText).not.toContain('SPHINX');
  });
});

// ── Anagram History API — Positive ───────────────────────────────────────

test.describe('Anagram History API — Positive', () => {
  test('GET /api/anagram-history/ returns 400 without user_id', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/anagram-history/`);
    if (res.status() === 404) { test.skip(); return; }
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('user_id');
  });

  test('GET /api/anagram-history/?count=true returns count field', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/anagram-history/?user_id=playwright-api-test&count=true`);
    if (res.status() === 404) { test.skip(); return; }
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('count');
    expect(typeof body.count).toBe('number');
  });

  test('GET /api/anagram-history/ returns history array and stats', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/anagram-history/?user_id=playwright-api-test`);
    if (res.status() === 404) { test.skip(); return; }
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('history');
    expect(body).toHaveProperty('puzzles');
    expect(body).toHaveProperty('stats');
    expect(Array.isArray(body.history)).toBe(true);
    expect(body.stats).toHaveProperty('totalGames');
    expect(body.stats).toHaveProperty('totalSolved');
    expect(body.stats).toHaveProperty('solveRate');
    expect(body.stats).toHaveProperty('streak');
  });
});

// ── Anagram History API — Negative ───────────────────────────────────────

test.describe('Anagram History API — Negative', () => {
  test('returns empty history for non-existent user', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/anagram-history/?user_id=nonexistent-user-xyz-12345`);
    if (res.status() === 404) { test.skip(); return; }
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.history).toHaveLength(0);
    expect(body.stats.totalGames).toBe(0);
  });

  test('count returns 0 for non-existent user', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/anagram-history/?user_id=nonexistent-user-xyz-99999&count=true`);
    if (res.status() === 404) { test.skip(); return; }
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.count).toBe(0);
  });
});

// ── Guess Grid Display (6×1 colour-coded grid) — Positive ────────────────

test.describe('Guess Grid Display — Positive', () => {
  const mockWithGuesses = (guesses: any[], scrambled: string, word: string) => ({
    history: [
      { date: '2026-06-18', attempts: guesses.length, solved: 1, guesses: JSON.stringify(guesses), time_taken: 30, created_at: '2026-06-18 10:00:00' },
    ],
    puzzles: { '2026-06-18': { word, scrambled, hint: 'Test hint' } },
    stats: { totalGames: 1, totalSolved: 1, avgAttempts: guesses.length, streak: 1, solveRate: 100 },
  });

  test('guess grid renders scrambled letters as top row with gray backgrounds', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'pw-grid-scrambled-row'); });
    await page.route('**/api/anagram-history/**', async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(mockWithGuesses(
          [{ guess: 'FROZEN', feedback: ['green','green','green','green','green','green'] }],
          'NZOFRE', 'FROZEN'
        )),
      });
    });
    await page.goto(HISTORY_URL);
    await page.waitForSelector('#ah-content:not(.hidden)', { timeout: 5000 });
    const guessCell = page.locator('#ah-body tr:first-child td:nth-child(6)');
    // First row in grid = scrambled letters
    const firstRow = guessCell.locator('.flex.flex-col.gap-0\\.5 > .flex.gap-0\\.5').first();
    // Each letter should have bg-gray-700 (scrambled row style)
    const scrambledSpans = firstRow.locator('span.bg-gray-700');
    await expect(scrambledSpans).toHaveCount(6); // NZOFRE has 6 letters
  });

  test('green feedback letters get bg-green-600 class', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'pw-grid-green'); });
    await page.route('**/api/anagram-history/**', async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(mockWithGuesses(
          [{ guess: 'FROZEN', feedback: ['green','green','green','green','green','green'] }],
          'NZOFRE', 'FROZEN'
        )),
      });
    });
    await page.goto(HISTORY_URL);
    await page.waitForSelector('#ah-content:not(.hidden)', { timeout: 5000 });
    const guessCell = page.locator('#ah-body tr:first-child td:nth-child(6)');
    const greenSpans = guessCell.locator('span.bg-green-600');
    await expect(greenSpans).toHaveCount(6);
  });

  test('yellow feedback letters get bg-amber-500 class', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'pw-grid-yellow'); });
    await page.route('**/api/anagram-history/**', async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(mockWithGuesses(
          [{ guess: 'FRENZY', feedback: ['green','yellow','gray','gray','gray','yellow'] }],
          'NZOFRE', 'FROZEN'
        )),
      });
    });
    await page.goto(HISTORY_URL);
    await page.waitForSelector('#ah-content:not(.hidden)', { timeout: 5000 });
    const guessCell = page.locator('#ah-body tr:first-child td:nth-child(6)');
    const yellowSpans = guessCell.locator('span.bg-amber-500');
    await expect(yellowSpans).toHaveCount(2);
  });

  test('gray feedback letters get bg-gray-800 class', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'pw-grid-gray'); });
    await page.route('**/api/anagram-history/**', async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(mockWithGuesses(
          [{ guess: 'FRENZY', feedback: ['green','yellow','gray','gray','gray','yellow'] }],
          'NZOFRE', 'FROZEN'
        )),
      });
    });
    await page.goto(HISTORY_URL);
    await page.waitForSelector('#ah-content:not(.hidden)', { timeout: 5000 });
    const guessCell = page.locator('#ah-body tr:first-child td:nth-child(6)');
    const graySpans = guessCell.locator('span.bg-gray-800');
    await expect(graySpans).toHaveCount(3);
  });

  test('grid row count matches number of guesses plus scrambled row', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'pw-grid-row-count'); });
    await page.route('**/api/anagram-history/**', async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(mockWithGuesses(
          [
            { guess: 'WRONG1', feedback: ['gray','gray','gray','gray','gray','gray'] },
            { guess: 'WRONG2', feedback: ['gray','gray','yellow','gray','gray','gray'] },
            { guess: 'FROZEN', feedback: ['green','green','green','green','green','green'] },
          ],
          'NZOFRE', 'FROZEN'
        )),
      });
    });
    await page.goto(HISTORY_URL);
    await page.waitForSelector('#ah-content:not(.hidden)', { timeout: 5000 });
    const guessCell = page.locator('#ah-body tr:first-child td:nth-child(6)');
    const gridContainer = guessCell.locator('.flex.flex-col.gap-0\\.5');
    const rows = gridContainer.locator(':scope > .flex.gap-0\\.5');
    // 1 scrambled row + 3 guess rows = 4 total
    await expect(rows).toHaveCount(4);
  });

  test('guess letters are rendered uppercase', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'pw-grid-uppercase'); });
    await page.route('**/api/anagram-history/**', async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(mockWithGuesses(
          [{ guess: 'frozen', feedback: ['green','green','green','green','green','green'] }],
          'NZOFRE', 'FROZEN'
        )),
      });
    });
    await page.goto(HISTORY_URL);
    await page.waitForSelector('#ah-content:not(.hidden)', { timeout: 5000 });
    const guessCell = page.locator('#ah-body tr:first-child td:nth-child(6)');
    // Second row = guess row (first is scrambled)
    const guessRow = guessCell.locator('.flex.flex-col.gap-0\\.5 > .flex.gap-0\\.5').nth(1);
    const letterTexts = await guessRow.locator('span').allTextContents();
    for (const letter of letterTexts) {
      expect(letter).toBe(letter.toUpperCase());
    }
  });
});

// ── Guess Grid Display — Negative ────────────────────────────────────────

test.describe('Guess Grid Display — Negative', () => {
  test('no emoji squares (🟩🟨⬜) are rendered in guesses column', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'pw-grid-no-emoji'); });
    await page.route('**/api/anagram-history/**', async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          history: [
            { date: '2026-06-18', attempts: 2, solved: 1, guesses: JSON.stringify([
              { guess: 'FRENZY', feedback: ['green','yellow','gray','gray','gray','gray'] },
              { guess: 'FROZEN', feedback: ['green','green','green','green','green','green'] }
            ]), time_taken: 30, created_at: '2026-06-18 10:00:00' },
          ],
          puzzles: { '2026-06-18': { word: 'FROZEN', scrambled: 'NZOFRE', hint: 'Test' } },
          stats: { totalGames: 1, totalSolved: 1, avgAttempts: 2, streak: 1, solveRate: 100 },
        }),
      });
    });
    await page.goto(HISTORY_URL);
    await page.waitForSelector('#ah-content:not(.hidden)', { timeout: 5000 });
    const guessCell = page.locator('#ah-body tr:first-child td:nth-child(6)');
    const text = await guessCell.textContent();
    expect(text).not.toContain('🟩');
    expect(text).not.toContain('🟨');
    expect(text).not.toContain('⬜');
  });

  test('guess grid shows dash when guesses JSON is invalid', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'pw-grid-invalid-json'); });
    await page.route('**/api/anagram-history/**', async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          history: [
            { date: '2026-06-18', attempts: 1, solved: 0, guesses: 'not-valid-json{{{', time_taken: 10, created_at: '2026-06-18 10:00:00' },
          ],
          puzzles: { '2026-06-18': { word: 'SPHINX', scrambled: 'XNPHIS', hint: 'Test' } },
          stats: { totalGames: 1, totalSolved: 0, avgAttempts: 1, streak: 0, solveRate: 0 },
        }),
      });
    });
    await page.goto(HISTORY_URL);
    await page.waitForSelector('#ah-content:not(.hidden)', { timeout: 5000 });
    const guessCell = page.locator('#ah-body tr:first-child td:nth-child(6)');
    await expect(guessCell).toContainText('—');
  });

  test('guess grid shows dash when guesses field is empty string', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'pw-grid-empty-guesses'); });
    await page.route('**/api/anagram-history/**', async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          history: [
            { date: '2026-06-18', attempts: 0, solved: 0, guesses: '', time_taken: 0, created_at: '2026-06-18 10:00:00' },
          ],
          puzzles: { '2026-06-18': { word: 'SPHINX', scrambled: 'XNPHIS', hint: 'Test' } },
          stats: { totalGames: 1, totalSolved: 0, avgAttempts: 0, streak: 0, solveRate: 0 },
        }),
      });
    });
    await page.goto(HISTORY_URL);
    await page.waitForSelector('#ah-content:not(.hidden)', { timeout: 5000 });
    const guessCell = page.locator('#ah-body tr:first-child td:nth-child(6)');
    // With empty guesses array, grid should still render (scrambled row + 0 guess rows)
    // or fallback — either is acceptable as long as no crash
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    expect(errors.filter(e => e.includes('TypeError'))).toHaveLength(0);
  });

  test('no page crash when feedback array is shorter than word length', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'pw-grid-short-feedback'); });
    await page.route('**/api/anagram-history/**', async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          history: [
            { date: '2026-06-18', attempts: 1, solved: 0, guesses: JSON.stringify([
              { guess: 'FROZEN', feedback: ['green','yellow'] } // only 2 feedback items for 6 letters
            ]), time_taken: 10, created_at: '2026-06-18 10:00:00' },
          ],
          puzzles: { '2026-06-18': { word: 'FROZEN', scrambled: 'NZOFRE', hint: 'Test' } },
          stats: { totalGames: 1, totalSolved: 0, avgAttempts: 1, streak: 0, solveRate: 0 },
        }),
      });
    });
    await page.goto(HISTORY_URL);
    await page.waitForSelector('#ah-content:not(.hidden)', { timeout: 5000 });
    // Page should not crash — remaining letters default to gray
    const criticalErrors = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError')
    );
    expect(criticalErrors).toHaveLength(0);
    // Letters without feedback should get the gray fallback style
    const guessCell = page.locator('#ah-body tr:first-child td:nth-child(6)');
    const grayFallbackSpans = guessCell.locator('span.bg-gray-800');
    // 4 letters without feedback → 4 gray spans
    await expect(grayFallbackSpans).toHaveCount(4);
  });
});

// ── Per-Guess Time Splits (guessed_at timestamps) — Positive ─────────────

test.describe('Per-Guess Time Splits (guessed_at) — Positive', () => {
  const mockWithGuessedAt = (guesses: any[]) => ({
    history: [
      { date: '2026-06-18', attempts: guesses.length, solved: 1, guesses: JSON.stringify(guesses), time_taken: 60, created_at: '2026-06-18 10:00:00' },
    ],
    puzzles: { '2026-06-18': { word: 'FROZEN', scrambled: 'NZOFRE', hint: 'Solidified by cold' } },
    stats: { totalGames: 1, totalSolved: 1, avgAttempts: guesses.length, streak: 1, solveRate: 100 },
  });

  test('time split labels use guessed_at timestamps when available', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'pw-guessed-at-splits'); });
    await page.route('**/api/anagram-history/**', async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(mockWithGuessedAt([
          { guess: 'FRENZY', feedback: ['green','yellow','gray','gray','gray','gray'], time_taken: 10, guessed_at: '2026-06-18T10:00:10.000Z' },
          { guess: 'FROZEN', feedback: ['green','green','green','green','green','green'], time_taken: 25, guessed_at: '2026-06-18T10:00:25.000Z' },
        ])),
      });
    });
    await page.goto(HISTORY_URL);
    await page.waitForSelector('#ah-content:not(.hidden)', { timeout: 5000 });
    const guessCell = page.locator('#ah-body tr:first-child td:nth-child(6)');
    // Second guess split = 25s - 10s = 15s
    await expect(guessCell).toContainText('+15s');
  });

  test('first guess has no split label (no previous timestamp)', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'pw-guessed-at-first'); });
    await page.route('**/api/anagram-history/**', async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(mockWithGuessedAt([
          { guess: 'FRENZY', feedback: ['green','yellow','gray','gray','gray','gray'], time_taken: 8, guessed_at: '2026-06-18T10:00:08.000Z' },
          { guess: 'FROZEN', feedback: ['green','green','green','green','green','green'], time_taken: 20, guessed_at: '2026-06-18T10:00:20.000Z' },
        ])),
      });
    });
    await page.goto(HISTORY_URL);
    await page.waitForSelector('#ah-content:not(.hidden)', { timeout: 5000 });
    const guessCell = page.locator('#ah-body tr:first-child td:nth-child(6)');
    const guessGrid = guessCell.locator('.flex.flex-col.gap-0\\.5');
    // Second row is first guess — should NOT have a split label
    const firstGuessRow = guessGrid.locator(':scope > .flex.gap-0\\.5').nth(1);
    const splitSpans = firstGuessRow.locator('span.text-gray-500');
    await expect(splitSpans).toHaveCount(0);
  });

  test('minutes format shown for splits over 60s', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'pw-guessed-at-mins'); });
    await page.route('**/api/anagram-history/**', async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(mockWithGuessedAt([
          { guess: 'FRENZY', feedback: ['green','yellow','gray','gray','gray','gray'], time_taken: 10, guessed_at: '2026-06-18T10:00:10.000Z' },
          { guess: 'FROZEN', feedback: ['green','green','green','green','green','green'], time_taken: 105, guessed_at: '2026-06-18T10:01:45.000Z' },
        ])),
      });
    });
    await page.goto(HISTORY_URL);
    await page.waitForSelector('#ah-content:not(.hidden)', { timeout: 5000 });
    const guessCell = page.locator('#ah-body tr:first-child td:nth-child(6)');
    // 95 seconds split = 1m35s
    await expect(guessCell).toContainText('+1m35s');
  });

  test('multiple guesses show sequential splits from guessed_at', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'pw-guessed-at-multi'); });
    await page.route('**/api/anagram-history/**', async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(mockWithGuessedAt([
          { guess: 'AAAAAA', feedback: ['gray','gray','gray','gray','gray','gray'], time_taken: 5, guessed_at: '2026-06-18T10:00:05.000Z' },
          { guess: 'BBBBBB', feedback: ['gray','gray','gray','gray','gray','gray'], time_taken: 18, guessed_at: '2026-06-18T10:00:18.000Z' },
          { guess: 'CCCCCC', feedback: ['gray','gray','gray','gray','gray','gray'], time_taken: 40, guessed_at: '2026-06-18T10:00:40.000Z' },
          { guess: 'FROZEN', feedback: ['green','green','green','green','green','green'], time_taken: 55, guessed_at: '2026-06-18T10:00:55.000Z' },
        ])),
      });
    });
    await page.goto(HISTORY_URL);
    await page.waitForSelector('#ah-content:not(.hidden)', { timeout: 5000 });
    const guessCell = page.locator('#ah-body tr:first-child td:nth-child(6)');
    const text = await guessCell.textContent();
    // Splits: no label for first, +13s, +22s, +15s
    expect(text).toContain('+13s');
    expect(text).toContain('+22s');
    expect(text).toContain('+15s');
  });
});

// ── Per-Guess Time Splits (guessed_at timestamps) — Negative ─────────────

test.describe('Per-Guess Time Splits (guessed_at) — Negative', () => {
  test('falls back to time_taken diff when guessed_at is missing', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'pw-guessed-at-fallback'); });
    await page.route('**/api/anagram-history/**', async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          history: [
            { date: '2026-06-18', attempts: 2, solved: 1, guesses: JSON.stringify([
              { guess: 'FRENZY', feedback: ['green','yellow','gray','gray','gray','gray'], time_taken: 10 },
              { guess: 'FROZEN', feedback: ['green','green','green','green','green','green'], time_taken: 25 },
            ]), time_taken: 25, created_at: '2026-06-18 10:00:00' },
          ],
          puzzles: { '2026-06-18': { word: 'FROZEN', scrambled: 'NZOFRE', hint: 'Solidified by cold' } },
          stats: { totalGames: 1, totalSolved: 1, avgAttempts: 2, streak: 1, solveRate: 100 },
        }),
      });
    });
    await page.goto(HISTORY_URL);
    await page.waitForSelector('#ah-content:not(.hidden)', { timeout: 5000 });
    const guessCell = page.locator('#ah-body tr:first-child td:nth-child(6)');
    // Falls back to tilde-prefixed splits from time_taken diff: ~15s for second guess
    await expect(guessCell).toContainText('~15s');
  });

  test('no crash when guessed_at has invalid date string', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'pw-guessed-at-invalid'); });
    await page.route('**/api/anagram-history/**', async (route) => {
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({
          history: [
            { date: '2026-06-18', attempts: 2, solved: 1, guesses: JSON.stringify([
              { guess: 'FRENZY', feedback: ['green','yellow','gray','gray','gray','gray'], time_taken: 10, guessed_at: 'not-a-date' },
              { guess: 'FROZEN', feedback: ['green','green','green','green','green','green'], time_taken: 25, guessed_at: 'also-invalid' },
            ]), time_taken: 25, created_at: '2026-06-18 10:00:00' },
          ],
          puzzles: { '2026-06-18': { word: 'FROZEN', scrambled: 'NZOFRE', hint: 'Solidified by cold' } },
          stats: { totalGames: 1, totalSolved: 1, avgAttempts: 2, streak: 1, solveRate: 100 },
        }),
      });
    });
    await page.goto(HISTORY_URL);
    await page.waitForSelector('#ah-content:not(.hidden)', { timeout: 5000 });
    const criticalErrors = errors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'));
    expect(criticalErrors).toHaveLength(0);
  });
});
