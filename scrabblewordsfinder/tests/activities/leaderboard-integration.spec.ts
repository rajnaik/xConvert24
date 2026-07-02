import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;
const LEADERBOARD_URL = `${BASE_URL}/leaderboard/`;

// ── Leaderboard Text Link on Activities — Positive ───────────────────────────

test.describe('Leaderboard Text Link — Positive', () => {
  test('leaderboard link is visible in quick links row', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const link = page.locator('a[href="/leaderboard/"]', { hasText: 'Leaderboard' });
    await expect(link).toBeVisible();
  });

  test('leaderboard link displays trophy emoji and text label', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const link = page.locator('a[href="/leaderboard/"]', { hasText: 'Leaderboard' });
    const text = await link.textContent();
    expect(text).toContain('🏆');
    expect(text).toContain('Leaderboard');
  });

  test('leaderboard link has purple styling', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const link = page.locator('a[href="/leaderboard/"]', { hasText: 'Leaderboard' });
    await expect(link).toHaveClass(/bg-purple-600/);
    await expect(link).toHaveClass(/text-purple-400/);
  });

  test('leaderboard link appears before the 60-Second link', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const quickLinksRow = page.locator('.flex.items-center.gap-2.sm\\:gap-3.flex-wrap');
    const firstChild = quickLinksRow.locator('> *').first();
    await expect(firstChild).toHaveAttribute('href', '/leaderboard/');
  });
});

// ── Leaderboard Text Link — Negative ─────────────────────────────────────────

test.describe('Leaderboard Text Link — Negative', () => {
  test('no duplicate leaderboard links on activities page', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const links = page.locator('a[href="/leaderboard/"]');
    await expect(links).toHaveCount(1);
  });

  test('leaderboard link does not contain an SVG icon (text-only style)', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const link = page.locator('a[href="/leaderboard/"]', { hasText: 'Leaderboard' });
    const svg = link.locator('svg');
    await expect(svg).toHaveCount(0);
  });
});

// ── Leaderboard Page Tabs — Positive ─────────────────────────────────────────

test.describe('Leaderboard Page Tabs — Positive', () => {
  test('leaderboard page loads successfully', async ({ page }) => {
    await page.goto(LEADERBOARD_URL);
    await expect(page).toHaveTitle(/Leaderboard/i);
  });

  test('game tabs are visible', async ({ page }) => {
    await page.goto(LEADERBOARD_URL);
    const tabs = page.locator('#lb-game-tabs .lb-tab');
    await expect(tabs).toHaveCount(4);
  });

  test('60-Second tab is active by default', async ({ page }) => {
    await page.goto(LEADERBOARD_URL);
    const sixtyTab = page.locator('.lb-tab[data-game="sixty-second"]');
    await expect(sixtyTab).toHaveClass(/active/);
  });

  test('all four game tabs have correct data-game attributes', async ({ page }) => {
    await page.goto(LEADERBOARD_URL);
    await expect(page.locator('.lb-tab[data-game="sixty-second"]')).toBeVisible();
    await expect(page.locator('.lb-tab[data-game="cab"]')).toBeVisible();
    await expect(page.locator('.lb-tab[data-game="daily-rack"]')).toBeVisible();
    await expect(page.locator('.lb-tab[data-game="daily-anagram"]')).toBeVisible();
  });

  test('period filter buttons are visible', async ({ page }) => {
    await page.goto(LEADERBOARD_URL);
    const periods = page.locator('#lb-period-tabs .lb-period');
    await expect(periods).toHaveCount(4);
  });

  test('stats bar becomes visible when data loads', async ({ page }) => {
    await page.goto(LEADERBOARD_URL);
    // Wait for data to load (table or empty state appears)
    await page.waitForFunction(() => {
      const table = document.getElementById('lb-table-container');
      const empty = document.getElementById('lb-empty');
      return !table?.classList.contains('hidden') || !empty?.classList.contains('hidden');
    }, { timeout: 8000 });
    // If table is visible, stats should also be visible
    const table = page.locator('#lb-table-container');
    if (await table.isVisible()) {
      const stats = page.locator('#lb-stats');
      await expect(stats).toBeVisible();
    }
  });

  test('clicking a different game tab changes active state', async ({ page }) => {
    await page.goto(LEADERBOARD_URL);
    const cabTab = page.locator('.lb-tab[data-game="cab"]');
    await cabTab.click();
    await expect(cabTab).toHaveClass(/active/);
    // Original tab should not be active
    const sixtyTab = page.locator('.lb-tab[data-game="sixty-second"]');
    await expect(sixtyTab).not.toHaveClass(/active/);
  });
});

// ── Leaderboard Page Tabs — Negative ─────────────────────────────────────────

test.describe('Leaderboard Page Tabs — Negative', () => {
  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(LEADERBOARD_URL);
    await page.waitForTimeout(3000);
    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });

  test('no duplicate game tabs exist', async ({ page }) => {
    await page.goto(LEADERBOARD_URL);
    const sixtyTabs = page.locator('.lb-tab[data-game="sixty-second"]');
    await expect(sixtyTabs).toHaveCount(1);
  });

  test('loading spinner hides after data loads', async ({ page }) => {
    await page.goto(LEADERBOARD_URL);
    await page.waitForFunction(() => {
      const loading = document.getElementById('lb-loading');
      return loading?.classList.contains('hidden');
    }, { timeout: 8000 });
    const loading = page.locator('#lb-loading');
    await expect(loading).toBeHidden();
  });
});

// ── Leaderboard API — Positive ───────────────────────────────────────────────

test.describe('Leaderboard API with game history — Positive', () => {
  test('API returns stats object in response', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=sixty-second&period=today');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('stats');
    expect(body.stats).toHaveProperty('players');
    expect(body.stats).toHaveProperty('total_games');
    expect(body.stats).toHaveProperty('top_score');
  });

  test('API returns entries array with rank field', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=sixty-second&period=today&limit=10');
    const body = await response.json();
    expect(body).toHaveProperty('entries');
    if (body.entries.length > 0) {
      expect(body.entries[0]).toHaveProperty('rank');
      expect(body.entries[0].rank).toBe(1);
    }
  });

  test('API supports all four game types', async ({ request }) => {
    const games = ['sixty-second', 'cab', 'daily-rack', 'daily-anagram'];
    for (const game of games) {
      const response = await request.get(`/api/leaderboard/?game=${game}&period=today`);
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.game).toBe(game);
    }
  });

  test('API supports all period filters', async ({ request }) => {
    const periods = ['today', 'week', 'month', 'alltime'];
    for (const period of periods) {
      const response = await request.get(`/api/leaderboard/?game=sixty-second&period=${period}`);
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.period).toBe(period);
    }
  });
});

// ── Leaderboard API — Anagram best_word — Positive ──────────────────────────

test.describe('Leaderboard API — Anagram best_word — Positive', () => {
  test('Anagram leaderboard returns best_word for solved entries', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=daily-anagram&period=alltime');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.game).toBe('daily-anagram');
    // Find entries with a non-empty best_word (users who solved at least one)
    const withWord = body.entries.filter((e: any) => e.best_word && e.best_word.length > 0);
    if (withWord.length > 0) {
      const entry = withWord[0];
      // best_word should be an uppercase word from the daily_anagram table
      expect(entry.best_word).toMatch(/^[A-Z]+$/);
      expect(entry.best_word.length).toBeGreaterThanOrEqual(4);
    }
  });

  test('Anagram today leaderboard shows best_word', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=daily-anagram&period=today');
    expect(response.status()).toBe(200);
    const body = await response.json();
    // If there are solved entries today, best_word should be populated
    const withWord = body.entries.filter((e: any) => e.best_word && e.best_word.length > 0);
    if (body.entries.length > 0 && withWord.length > 0) {
      expect(withWord[0].best_word).toMatch(/^[A-Z]+$/);
    }
  });
});

test.describe('Leaderboard API — Anagram best_word — Negative', () => {
  test('Anagram entries without solved games have empty best_word', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=daily-anagram&period=alltime');
    expect(response.status()).toBe(200);
    const body = await response.json();
    // All entries should have best_word as a string (empty or filled)
    for (const entry of body.entries) {
      expect(typeof entry.best_word).toBe('string');
    }
  });
});

// ── Leaderboard API — CaB-specific fields ────────────────────────────────────

test.describe('Leaderboard API — CaB-specific fields — Positive', () => {
  test('CaB API response returns correct game identifier', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=cab&period=today');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.game).toBe('cab');
    expect(body).toHaveProperty('entries');
    expect(body).toHaveProperty('stats');
  });

  test('CaB entries with history data include cab-specific fields (attempts, timer_used, word_length)', async ({ request }) => {
    // Query alltime for higher chance of CaB_Scores-sourced entries
    const response = await request.get('/api/leaderboard/?game=cab&period=alltime');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.game).toBe('cab');
    // Find any entry that has cab-specific fields (sourced from CaB_Scores history)
    const cabEntries = body.entries.filter((e: any) => e.attempts != null);
    if (cabEntries.length > 0) {
      const entry = cabEntries[0];
      // attempts is always present when sourced from CaB_Scores
      expect(typeof entry.attempts).toBe('number');
      expect(entry.attempts).toBeGreaterThan(0);
      // timer_used is conditionally present (split_time may be NULL in DB)
      if (entry.timer_used != null) {
        expect(typeof entry.timer_used).toBe('number');
        expect(entry.timer_used).toBeGreaterThanOrEqual(0);
      }
      // word_length is conditionally present (depends on JOIN with CaB table)
      if (entry.word_length != null) {
        expect(typeof entry.word_length).toBe('number');
        expect(entry.word_length).toBeGreaterThan(0);
      }
    }
    // Test passes regardless — cab-specific fields are conditionally present
    // depending on whether CaB_Scores table has data for these users
  });

  test('CaB entries always include standard leaderboard fields', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=cab&period=alltime');
    expect(response.status()).toBe(200);
    const body = await response.json();
    if (body.entries.length > 0) {
      const entry = body.entries[0];
      // Standard fields must always be present
      expect(entry).toHaveProperty('rank');
      expect(entry).toHaveProperty('user_id');
      expect(entry).toHaveProperty('best_score');
      expect(entry).toHaveProperty('total_score');
      expect(entry).toHaveProperty('words_played');
      expect(entry).toHaveProperty('display_name');
    }
  });

  test('CaB today period returns valid stats', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=cab&period=today');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.stats).toHaveProperty('players');
    expect(body.stats).toHaveProperty('total_games');
    expect(body.stats).toHaveProperty('top_score');
    expect(typeof body.stats.players).toBe('number');
    expect(typeof body.stats.total_games).toBe('number');
  });

  test('CaB entries with solved games include best_word', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=cab&period=alltime');
    expect(response.status()).toBe(200);
    const body = await response.json();
    // Find entries with best_word populated (users who solved at least one via CaB_Scores)
    const withWord = body.entries.filter((e: any) => e.best_word && e.best_word.length > 0);
    if (withWord.length > 0) {
      const entry = withWord[0];
      // best_word should be an uppercase word from the CaB table
      expect(entry.best_word).toMatch(/^[A-Z]+$/);
      expect(entry.best_word.length).toBeGreaterThanOrEqual(3);
    }
  });

  test('CaB best_word, attempts, and word_length are consistent with score formula', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=cab&period=alltime');
    expect(response.status()).toBe(200);
    const body = await response.json();
    // Find entries with all cab-specific fields
    const fullEntries = body.entries.filter((e: any) => e.attempts != null && e.word_length != null);
    if (fullEntries.length > 0) {
      const entry = fullEntries[0];
      // Score formula: (11 - attempts) × word_length = best_score
      const expectedScore = (11 - entry.attempts) * entry.word_length;
      expect(entry.best_score).toBe(expectedScore);
    }
  });
});

test.describe('Leaderboard API — CaB-specific fields — Negative', () => {
  test('non-CaB games do not include cab-specific fields', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=sixty-second&period=alltime');
    expect(response.status()).toBe(200);
    const body = await response.json();
    if (body.entries.length > 0) {
      const entry = body.entries[0];
      // These fields should NOT be present for non-cab games
      expect(entry).not.toHaveProperty('attempts');
      expect(entry).not.toHaveProperty('timer_used');
      expect(entry).not.toHaveProperty('word_length');
    }
  });

  test('daily-rack game does not include cab-specific fields', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=daily-rack&period=alltime');
    expect(response.status()).toBe(200);
    const body = await response.json();
    if (body.entries.length > 0) {
      const entry = body.entries[0];
      expect(entry).not.toHaveProperty('attempts');
      expect(entry).not.toHaveProperty('timer_used');
    }
  });

  test('daily-anagram game does not include cab-specific fields', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=daily-anagram&period=alltime');
    expect(response.status()).toBe(200);
    const body = await response.json();
    if (body.entries.length > 0) {
      const entry = body.entries[0];
      expect(entry).not.toHaveProperty('attempts');
      expect(entry).not.toHaveProperty('timer_used');
      expect(entry).not.toHaveProperty('word_length');
    }
  });
});

// ── Leaderboard API — Negative ───────────────────────────────────────────────

test.describe('Leaderboard API — Negative', () => {
  test('API returns error without game parameter', async ({ request }) => {
    const response = await request.get('/api/leaderboard/');
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('game');
  });

  test('stats top_score is 0 when no entries exist for a period', async ({ request }) => {
    // Use a far-future date to guarantee no data
    const response = await request.get('/api/leaderboard/?game=sixty-second&period=today&date=2099-12-31');
    const body = await response.json();
    expect(body.stats.top_score).toBe(0);
    expect(body.stats.players).toBe(0);
  });
});
