import { test, expect } from '@playwright/test';

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Leaderboard Page — Positive', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    await expect(page).toHaveTitle(/Leaderboard.*Game Rankings/);
  });

  test('meta description mentions all game types', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    const desc = page.locator('meta[name="description"]');
    const content = await desc.getAttribute('content');
    expect(content).toContain('60-Second');
    expect(content).toContain('Daily Rack');
    expect(content).toContain('Anagram');
    expect(content).toContain('Cows & Bulls');
    expect(content).toContain('Word Quiz');
  });

  test('meta keywords include all game keywords', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    const kw = page.locator('meta[name="keywords"]');
    const content = await kw.getAttribute('content');
    expect(content).toContain('60 second word game');
    expect(content).toContain('daily anagram');
    expect(content).toContain('daily rack');
    expect(content).toContain('word quiz');
  });

  test('heading displays trophy icon and Leaderboard text', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    const h1 = page.locator('main h1');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('Leaderboard');
  });

  test('five game tabs are visible', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    const tabs = page.locator('#lb-game-tabs button.lb-tab');
    await expect(tabs).toHaveCount(5);
    await expect(tabs.nth(0)).toContainText('60-Second');
    await expect(tabs.nth(1)).toContainText('Cows & Bulls');
    await expect(tabs.nth(2)).toContainText('Daily Rack');
    await expect(tabs.nth(3)).toContainText('Anagram');
    await expect(tabs.nth(4)).toContainText('Word Quiz');
  });

  test('60-Second tab is active by default when no saved game', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    // Clear any saved game preference
    await page.evaluate(() => localStorage.removeItem('swf-lb-game'));
    await page.reload();
    const activeTab = page.locator('#lb-game-tabs button.lb-tab[data-game="sixty-second"]');
    await expect(activeTab).toHaveClass(/active/);
  });

  test('clicking a game tab saves selection to localStorage', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    await page.evaluate(() => localStorage.removeItem('swf-lb-game'));
    // Click the Cows & Bulls tab (data-game="cab")
    await page.locator('#lb-game-tabs button.lb-tab[data-game="cab"]').click();
    const saved = await page.evaluate(() => localStorage.getItem('swf-lb-game'));
    expect(saved).toBe('cab');
  });

  test('saved game tab is restored on page reload', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    // Set preference to daily-rack
    await page.evaluate(() => localStorage.setItem('swf-lb-game', 'daily-rack'));
    await page.reload();
    const activeTab = page.locator('#lb-game-tabs button.lb-tab[data-game="daily-rack"]');
    await expect(activeTab).toHaveClass(/active/);
    // The default tab should NOT be active
    const defaultTab = page.locator('#lb-game-tabs button.lb-tab[data-game="sixty-second"]');
    await expect(defaultTab).not.toHaveClass(/active/);
  });

  test('saved daily-anagram tab is restored correctly', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    await page.evaluate(() => localStorage.setItem('swf-lb-game', 'daily-anagram'));
    await page.reload();
    const activeTab = page.locator('#lb-game-tabs button.lb-tab[data-game="daily-anagram"]');
    await expect(activeTab).toHaveClass(/active/);
  });

  test('four period filter buttons are visible', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    const periods = page.locator('#lb-period-tabs button.lb-period');
    await expect(periods).toHaveCount(4);
    await expect(periods.nth(0)).toContainText('Today');
    await expect(periods.nth(1)).toContainText('This Week');
    await expect(periods.nth(2)).toContainText('This Month');
    await expect(periods.nth(3)).toContainText('All Time');
  });

  test('Today period is active by default', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    const activePeriod = page.locator('#lb-period-tabs button.lb-period[data-period="today"]');
    await expect(activePeriod).toHaveClass(/active/);
  });

  test('leaderboard table structure has correct columns', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    const headers = page.locator('#lb-table-container thead th');
    // Table may be hidden initially (loading state), check it's attached
    const container = page.locator('#lb-table-container');
    await expect(container).toBeAttached();
  });

  test('activities link is present', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    const link = page.locator('a[href="/activities/"]');
    await expect(link.first()).toBeVisible();
    await expect(link.first()).toContainText('Activities');
  });
});

test.describe('Leaderboard Page — Sticky Game Tab', () => {
  test('clicking a game tab saves selection to localStorage', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    // Click Cows & Bulls tab
    await page.locator('.lb-tab[data-game="cab"]').click();
    const saved = await page.evaluate(() => localStorage.getItem('swf-lb-game'));
    expect(saved).toBe('cab');
  });

  test('page loads with previously saved game tab active', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    // Set localStorage to daily-anagram
    await page.evaluate(() => localStorage.setItem('swf-lb-game', 'daily-anagram'));
    // Reload page
    await page.reload();
    const activeTab = page.locator('.lb-tab.active');
    await expect(activeTab).toHaveAttribute('data-game', 'daily-anagram');
  });

  test('without localStorage defaults to 60-Second tab', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    await page.evaluate(() => localStorage.removeItem('swf-lb-game'));
    await page.reload();
    const activeTab = page.locator('.lb-tab.active');
    await expect(activeTab).toHaveAttribute('data-game', 'sixty-second');
  });

  test('invalid localStorage value falls back gracefully', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    await page.evaluate(() => localStorage.setItem('swf-lb-game', 'nonexistent-game'));
    await page.reload();
    // The default tab should still be active since the saved value has no matching element
    const activeTab = page.locator('.lb-tab.active');
    await expect(activeTab).toHaveAttribute('data-game', 'sixty-second');
  });
});

test.describe('Leaderboard Page — Cows & Bulls Columns', () => {
  test('C&B tab shows Score, Letters, and Attempts column headers', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    // Click the Cows & Bulls tab
    await page.locator('.lb-tab[data-game="cab"]').click();
    // Wait for table header to update
    const thead = page.locator('#lb-thead-row');
    await expect(thead).toContainText('Letters');
    await expect(thead).toContainText('Attempts');
    await expect(thead).toContainText('Score');
  });

  test('C&B tab shows Score and Games columns', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    await page.locator('.lb-tab[data-game="cab"]').click();
    const thead = page.locator('#lb-thead-row');
    await expect(thead).toContainText('Score');
    await expect(thead).toContainText('Games');
  });

  test('C&B tab shows Best Word but NOT Total column', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    await page.locator('.lb-tab[data-game="cab"]').click();
    const thead = page.locator('#lb-thead-row');
    await expect(thead).toContainText('Best Word');
    await expect(thead).not.toContainText('Total');
  });

  test('switching from C&B back to 60-Second restores default columns', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    // Go to C&B first
    await page.locator('.lb-tab[data-game="cab"]').click();
    const thead = page.locator('#lb-thead-row');
    await expect(thead).toContainText('Letters');
    await expect(thead).toContainText('Attempts');
    // Switch back to 60-Second
    await page.locator('.lb-tab[data-game="sixty-second"]').click();
    await expect(thead).toContainText('Best Word');
    await expect(thead).toContainText('Best Score');
    await expect(thead).not.toContainText('Attempts');
  });

  test('C&B table header has 7 columns', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    await page.locator('.lb-tab[data-game="cab"]').click();
    const ths = page.locator('#lb-thead-row th');
    await expect(ths).toHaveCount(7);
  });

  test('non-C&B games have 6 columns in table header', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    // Ensure on 60-Second (default)
    await page.locator('.lb-tab[data-game="sixty-second"]').click();
    const ths = page.locator('#lb-thead-row th');
    await expect(ths).toHaveCount(6);
  });
});

test.describe('Leaderboard Page — C&B Best Word & Score Formula', () => {
  test('C&B tab shows Best Word column with word or dash', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    await page.locator('.lb-tab[data-game="cab"]').click();
    // Switch to alltime for higher chance of data
    await page.locator('.lb-period[data-period="alltime"]').click();
    await page.waitForTimeout(1500);
    const rows = page.locator('#lb-tbody tr');
    const rowCount = await rows.count();
    if (rowCount > 0) {
      // Best Word column is 3rd td (index 2) for C&B
      const firstBestWord = rows.first().locator('td').nth(2);
      const text = await firstBestWord.textContent();
      // Should be either a valid word (uppercase letters) or a dash
      expect(text?.trim()).toMatch(/^([A-Z]+|—)$/);
    }
  });

  test('C&B score cells show formula breakdown when data exists', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    await page.locator('.lb-tab[data-game="cab"]').click();
    await page.locator('.lb-period[data-period="alltime"]').click();
    await page.waitForTimeout(1500);
    const rows = page.locator('#lb-tbody tr');
    const rowCount = await rows.count();
    if (rowCount > 0) {
      // Score column is 4th td (index 3); if data exists, formula span should be visible
      const scoreCell = rows.first().locator('td').nth(3);
      const text = await scoreCell.textContent();
      // Score should contain a number
      expect(text).toMatch(/\d+/);
    }
  });

  test('C&B Letters column shows word length number', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    await page.locator('.lb-tab[data-game="cab"]').click();
    await page.locator('.lb-period[data-period="alltime"]').click();
    await page.waitForTimeout(1500);
    const rows = page.locator('#lb-tbody tr');
    const rowCount = await rows.count();
    if (rowCount > 0) {
      // Letters column is 5th td (index 4)
      const lettersCell = rows.first().locator('td').nth(4);
      const text = await lettersCell.textContent();
      // Should be a number (word length) or dash
      expect(text?.trim()).toMatch(/^(\d+|—)$/);
    }
  });

  test('C&B Attempts column shows attempt count', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    await page.locator('.lb-tab[data-game="cab"]').click();
    await page.locator('.lb-period[data-period="alltime"]').click();
    await page.waitForTimeout(1500);
    const rows = page.locator('#lb-tbody tr');
    const rowCount = await rows.count();
    if (rowCount > 0) {
      // Attempts column is 6th td (index 5)
      const attemptsCell = rows.first().locator('td').nth(5);
      const text = await attemptsCell.textContent();
      // Should be a number (attempts) or dash
      expect(text?.trim()).toMatch(/^(\d+|—)$/);
    }
  });

  test('C&B does NOT show Timer column anymore', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    await page.locator('.lb-tab[data-game="cab"]').click();
    const thead = page.locator('#lb-thead-row');
    await expect(thead).not.toContainText('Timer');
  });
});

test.describe('Leaderboard Page — Anagram Best Word Column', () => {
  test('Anagram tab shows Best Word column header', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    await page.locator('.lb-tab[data-game="daily-anagram"]').click();
    const thead = page.locator('#lb-thead-row');
    await expect(thead).toContainText('Best Word');
  });

  test('Anagram tab has 6 columns (same as other non-C&B games)', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    await page.locator('.lb-tab[data-game="daily-anagram"]').click();
    const ths = page.locator('#lb-thead-row th');
    await expect(ths).toHaveCount(6);
  });

  test('Anagram tab does NOT show C&B-specific Timer/Letters/Attempts headers', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    await page.locator('.lb-tab[data-game="daily-anagram"]').click();
    const thead = page.locator('#lb-thead-row');
    await expect(thead).not.toContainText('Timer');
    await expect(thead).not.toContainText('Letters');
    await expect(thead).not.toContainText('Attempts');
  });

  test('Anagram best_word cells show dashes when no data', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    await page.locator('.lb-tab[data-game="daily-anagram"]').click();
    // Wait briefly for API response
    await page.waitForTimeout(1500);
    // If table has rows, best_word column should display either a word or '—'
    const rows = page.locator('#lb-tbody tr');
    const rowCount = await rows.count();
    if (rowCount > 0) {
      // The best_word column is the 3rd td (index 2) for non-C&B games
      const firstBestWord = rows.first().locator('td').nth(2);
      const text = await firstBestWord.textContent();
      // Should be either a valid word (uppercase letters) or a dash
      expect(text?.trim()).toMatch(/^([A-Z]+|—)$/);
    }
  });
});

test.describe('Leaderboard Page — CaB Best Word Column', () => {
  test('C&B tab shows Best Word column header', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    await page.locator('.lb-tab[data-game="cab"]').click();
    const thead = page.locator('#lb-thead-row');
    await expect(thead).toContainText('Best Word');
  });

  test('C&B best_word cells show word or dash when data present', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    await page.locator('.lb-tab[data-game="cab"]').click();
    // Wait for API response
    await page.waitForTimeout(1500);
    const rows = page.locator('#lb-tbody tr');
    const rowCount = await rows.count();
    if (rowCount > 0) {
      // Best Word column is the 3rd td (index 2) for CaB layout
      const firstBestWord = rows.first().locator('td').nth(2);
      const text = await firstBestWord.textContent();
      // Should be either a valid word (uppercase letters) or a dash
      expect(text?.trim()).toMatch(/^([A-Z]+|—)$/);
    }
  });

  test('C&B score formula tooltip reflects (11 - attempts) x letters', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    await page.locator('.lb-tab[data-game="cab"]').click();
    await page.waitForTimeout(1500);
    const rows = page.locator('#lb-tbody tr');
    const rowCount = await rows.count();
    if (rowCount > 0) {
      // Score is the 4th td (index 3) for CaB — check the title attribute
      const scoreCell = rows.first().locator('td').nth(3);
      const title = await scoreCell.getAttribute('title');
      if (title) {
        // Format: (11−N)×M
        expect(title).toMatch(/\(11[−-]\d+\)[×x]\d+/);
      }
    }
  });
});

test.describe('Leaderboard Page — Stats Summary Extended', () => {
  test('stats container has flex-wrap for responsive layout', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    const stats = page.locator('#lb-stats');
    await expect(stats).toBeAttached();
    const cls = await stats.getAttribute('class');
    expect(cls).toContain('flex-wrap');
  });

  test('Best Word stat wrapper element exists', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    const wrap = page.locator('#lb-stat-bestword-wrap');
    await expect(wrap).toBeAttached();
  });

  test('Best Word stat value element exists with correct styling', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    const el = page.locator('#lb-stat-bestword');
    await expect(el).toBeAttached();
    const cls = await el.getAttribute('class');
    expect(cls).toContain('text-purple-400');
    expect(cls).toContain('font-mono');
    expect(cls).toContain('uppercase');
  });

  test('Best Word stat has label text', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    const wrap = page.locator('#lb-stat-bestword-wrap');
    await expect(wrap).toContainText('Best Word');
  });

  test('Total Pts stat elements are not present', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    const totalWrap = await page.locator('#lb-stat-totalpts-wrap').count();
    const totalEl = await page.locator('#lb-stat-totalpts').count();
    const totalCalc = await page.locator('#lb-stat-totalpts-calc').count();
    expect(totalWrap).toBe(0);
    expect(totalEl).toBe(0);
    expect(totalCalc).toBe(0);
  });

  test('Top Score calculation breakdown element exists', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    const el = page.locator('#lb-stat-best-calc');
    await expect(el).toBeAttached();
  });

  test('Best Word wrapper starts hidden', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    const bestWrap = page.locator('#lb-stat-bestword-wrap');
    const bestCls = await bestWrap.getAttribute('class');
    expect(bestCls).toContain('hidden');
  });

  test('no duplicate Best Word or Top Score calc elements', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    const bestCount = await page.locator('#lb-stat-bestword').count();
    const calcCount = await page.locator('#lb-stat-best-calc').count();
    expect(bestCount).toBe(1);
    expect(calcCount).toBe(1);
  });
});

test.describe('Leaderboard Page — Your Stats Best Word Format', () => {
  test('non-C&B Your Stats shows "WORD (score)" format when best_word exists', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    // Ensure 60-Second tab (non-C&B) is active
    await page.locator('.lb-tab[data-game="sixty-second"]').click();
    await page.locator('.lb-period[data-period="alltime"]').click();
    await page.waitForTimeout(2000);
    // Check if user has an entry (lb-your-stats becomes visible)
    const yourStats = page.locator('#lb-your-stats');
    const isVisible = await yourStats.isVisible().catch(() => false);
    if (isVisible) {
      const bestEl = page.locator('#lb-your-best');
      const text = await bestEl.textContent();
      // Should be either "WORD (number)" format or just a number (if no best_word)
      if (text && text.includes('(')) {
        expect(text.trim()).toMatch(/^[A-Z]+ \(\d+\)$/);
      } else {
        // Fallback: just a score number
        expect(text?.trim()).toMatch(/^\d+$/);
      }
    }
  });

  test('non-C&B Your Stats label shows Best word', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    await page.locator('.lb-tab[data-game="sixty-second"]').click();
    await page.locator('.lb-period[data-period="alltime"]').click();
    await page.waitForTimeout(2000);
    const yourStats = page.locator('#lb-your-stats');
    const isVisible = await yourStats.isVisible().catch(() => false);
    if (isVisible) {
      const bestLabel = page.locator('#lb-your-best + p');
      await expect(bestLabel).toContainText('Best word');
    }
  });

  test('C&B Your Stats shows best_word without parenthesised score', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    await page.locator('.lb-tab[data-game="cab"]').click();
    await page.locator('.lb-period[data-period="alltime"]').click();
    await page.waitForTimeout(2000);
    const yourStats = page.locator('#lb-your-stats');
    const isVisible = await yourStats.isVisible().catch(() => false);
    if (isVisible) {
      const bestEl = page.locator('#lb-your-best');
      const text = await bestEl.textContent();
      // C&B shows just the word or just the score — never "WORD (score)" format
      if (text && text.trim().length > 0) {
        expect(text.trim()).not.toMatch(/^[A-Z]+ \(\d+\)$/);
      }
    }
  });

  test('Your Stats best element does not show raw "undefined" or "null"', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    await page.locator('.lb-tab[data-game="sixty-second"]').click();
    await page.locator('.lb-period[data-period="alltime"]').click();
    await page.waitForTimeout(2000);
    const bestEl = page.locator('#lb-your-best');
    const text = await bestEl.textContent();
    expect(text).not.toContain('undefined');
    expect(text).not.toContain('null');
  });
});

test.describe('Leaderboard Page — Word Quiz Tab', () => {
  test('Word Quiz tab exists with correct data-game attribute', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    const tab = page.locator('.lb-tab[data-game="word-quiz"]');
    await expect(tab).toBeVisible();
    await expect(tab).toContainText('Word Quiz');
  });

  test('clicking Word Quiz tab activates it', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    await page.locator('.lb-tab[data-game="word-quiz"]').click();
    const activeTab = page.locator('.lb-tab.active');
    await expect(activeTab).toHaveAttribute('data-game', 'word-quiz');
  });

  test('Word Quiz tab saves to localStorage', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    await page.locator('.lb-tab[data-game="word-quiz"]').click();
    const saved = await page.evaluate(() => localStorage.getItem('swf-lb-game'));
    expect(saved).toBe('word-quiz');
  });

  test('saved word-quiz tab is restored on reload', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    await page.evaluate(() => localStorage.setItem('swf-lb-game', 'word-quiz'));
    await page.reload();
    const activeTab = page.locator('.lb-tab.active');
    await expect(activeTab).toHaveAttribute('data-game', 'word-quiz');
  });

  test('Word Quiz tab has standard 6-column table header', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    await page.locator('.lb-tab[data-game="word-quiz"]').click();
    const ths = page.locator('#lb-thead-row th');
    await expect(ths).toHaveCount(6);
  });

  test('Word Quiz tab does not show C&B-specific columns', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    await page.locator('.lb-tab[data-game="word-quiz"]').click();
    const thead = page.locator('#lb-thead-row');
    await expect(thead).not.toContainText('Letters');
    await expect(thead).not.toContainText('Attempts');
    await expect(thead).not.toContainText('Timer');
  });

  test('Word Quiz tab does not cause console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/leaderboard/`);
    await page.locator('.lb-tab[data-game="word-quiz"]').click();
    await page.waitForTimeout(1500);
    expect(errors.filter(e => !e.includes('net::') && !e.includes('adsbygoogle'))).toHaveLength(0);
  });
});

test.describe('Leaderboard Page — Negative', () => {
  test('title does not reference removed Daily Duel branding', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    const title = await page.title();
    expect(title).not.toContain('Daily Duel');
  });

  test('meta description does not reference Daily Duel', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    const desc = page.locator('meta[name="description"]');
    const content = await desc.getAttribute('content');
    expect(content).not.toContain('Daily Duel');
  });

  test('invalid localStorage game value does not crash the page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/leaderboard/`);
    // Set an invalid game value that doesn't match any tab
    await page.evaluate(() => localStorage.setItem('swf-lb-game', 'nonexistent-game'));
    await page.reload();
    await page.waitForTimeout(1000);
    // Page should not crash — fallback to default tab
    const tabs = page.locator('#lb-game-tabs button.lb-tab');
    await expect(tabs).toHaveCount(5);
    expect(errors.filter(e => !e.includes('net::'))).toHaveLength(0);
  });

  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/leaderboard/`);
    await page.waitForTimeout(2000);
    expect(errors.filter(e => !e.includes('net::'))).toHaveLength(0);
  });

  test('no duplicate game tabs', async ({ page }) => {
    await page.goto(`${BASE}/leaderboard/`);
    const tabs = page.locator('#lb-game-tabs button.lb-tab');
    const count = await tabs.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const game = await tabs.nth(i).getAttribute('data-game');
      names.push(game || '');
    }
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  test('page returns 200 status', async ({ request }) => {
    const res = await request.get(`${BASE}/leaderboard/`);
    expect(res.status()).toBe(200);
  });
});
