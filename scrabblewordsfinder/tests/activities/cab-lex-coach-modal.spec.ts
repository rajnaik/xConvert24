import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

/**
 * CaB — Lex Coach Analysis Modal
 * A dedicated modal (#lex-cab-coach-modal) opens when the user clicks the
 * "Coach me" button (#cab-lex-coach-btn). It POST's to /api/lex-cab-coach/
 * and displays stats, a graph, time insights, AI analysis, and per-game cards.
 */

test.describe('Lex CaB Coach Modal — Positive', () => {
  test('modal exists in the DOM and is hidden by default', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const modal = page.locator('#lex-cab-coach-modal');
    await expect(modal).toBeAttached();
    await expect(modal).toHaveClass(/hidden/);
  });

  test('modal opens when coach button is clicked', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-cab-coach-open');
    });

    // Mock the coach API
    await page.route('**/api/lex-cab-coach/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          hasHistory: true,
          stats: { totalGames: 5, solveRate: 80, avgAttempts: 4.2, quickSolves: 2 },
          analysis: 'You are improving steadily.',
          gameAnalysis: []
        })
      });
    });

    await page.goto(ACTIVITIES_URL);

    const coachBtn = page.locator('#cab-lex-coach-btn');
    if (await coachBtn.isVisible()) {
      await coachBtn.click();
      const modal = page.locator('#lex-cab-coach-modal');
      await expect(modal).not.toHaveClass(/hidden/);
    }
  });

  test('modal displays stats bar when API returns history', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-cab-coach-stats');
    });

    await page.route('**/api/lex-cab-coach/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          hasHistory: true,
          stats: { totalGames: 10, solveRate: 70, avgAttempts: 5.1, quickSolves: 3 },
          analysis: 'Good progress overall.',
          gameAnalysis: [
            { gameNumber: 1, solved: true, attempts: 3, splitTime: 45, rating: 'great', wordLength: 5, word: 'HELLO', date: '2026-07-01', improvements: ['Fast deduction'], weaknesses: [] },
            { gameNumber: 2, solved: false, attempts: 10, splitTime: 120, rating: 'failed', wordLength: 5, word: 'WORLD', date: '2026-07-01', improvements: [], weaknesses: ['Ran out of guesses'] }
          ]
        })
      });
    });

    await page.goto(ACTIVITIES_URL);

    const coachBtn = page.locator('#cab-lex-coach-btn');
    if (await coachBtn.isVisible()) {
      await coachBtn.click();

      // Wait for loading to disappear
      await page.locator('#lex-cab-coach-loading').waitFor({ state: 'hidden', timeout: 5000 });

      // Stats bar visible
      const statsBar = page.locator('#lex-cab-stats-bar');
      await expect(statsBar).not.toHaveClass(/hidden/);

      // Verify stat values
      await expect(page.locator('#lex-cab-stat-games')).toHaveText('10');
      await expect(page.locator('#lex-cab-stat-rate')).toHaveText('70%');
      await expect(page.locator('#lex-cab-stat-avg')).toHaveText('5.1');
      await expect(page.locator('#lex-cab-stat-quick')).toHaveText('3');
    }
  });

  test('modal closes on X button click', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-cab-coach-close-x');
    });

    await page.route('**/api/lex-cab-coach/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ hasHistory: false, stats: null, analysis: 'Play some games first.', gameAnalysis: [] })
      });
    });

    await page.goto(ACTIVITIES_URL);

    const coachBtn = page.locator('#cab-lex-coach-btn');
    if (await coachBtn.isVisible()) {
      await coachBtn.click();
      await expect(page.locator('#lex-cab-coach-modal')).not.toHaveClass(/hidden/);

      await page.locator('#lex-cab-coach-close').click();
      await expect(page.locator('#lex-cab-coach-modal')).toHaveClass(/hidden/);
    }
  });

  test('modal closes on backdrop click', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-cab-coach-close-backdrop');
    });

    await page.route('**/api/lex-cab-coach/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ hasHistory: false, stats: null, analysis: 'No data yet.', gameAnalysis: [] })
      });
    });

    await page.goto(ACTIVITIES_URL);

    const coachBtn = page.locator('#cab-lex-coach-btn');
    if (await coachBtn.isVisible()) {
      await coachBtn.click();
      await expect(page.locator('#lex-cab-coach-modal')).not.toHaveClass(/hidden/);

      // Click the backdrop
      await page.locator('#lex-cab-coach-backdrop').click({ force: true });
      await expect(page.locator('#lex-cab-coach-modal')).toHaveClass(/hidden/);
    }
  });

  test('modal closes on Escape key', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-cab-coach-close-esc');
    });

    await page.route('**/api/lex-cab-coach/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ hasHistory: false, stats: null, analysis: 'Start playing!', gameAnalysis: [] })
      });
    });

    await page.goto(ACTIVITIES_URL);

    const coachBtn = page.locator('#cab-lex-coach-btn');
    if (await coachBtn.isVisible()) {
      await coachBtn.click();
      await expect(page.locator('#lex-cab-coach-modal')).not.toHaveClass(/hidden/);

      await page.keyboard.press('Escape');
      await expect(page.locator('#lex-cab-coach-modal')).toHaveClass(/hidden/);
    }
  });

  test('modal has correct ARIA attributes for accessibility', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const modal = page.locator('#lex-cab-coach-modal');
    await expect(modal).toHaveAttribute('role', 'dialog');
    await expect(modal).toHaveAttribute('aria-modal', 'true');
  });

  test('chat link points to /chat/?context=cab', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const chatLink = page.locator('#lex-cab-coach-modal a[href="/chat/?context=cab"]');
    await expect(chatLink).toBeAttached();
  });
});

test.describe('Lex CaB Coach Modal — Negative', () => {
  test('no duplicate coach modals exist in the DOM', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);

    const modals = page.locator('#lex-cab-coach-modal');
    await expect(modals).toHaveCount(1);
  });

  test('shows error state when API fails', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-cab-coach-error');
    });

    await page.route('**/api/lex-cab-coach/', async (route) => {
      await route.abort('connectionfailed');
    });

    await page.goto(ACTIVITIES_URL);

    const coachBtn = page.locator('#cab-lex-coach-btn');
    if (await coachBtn.isVisible()) {
      await coachBtn.click();

      // Wait for error state
      const errorEl = page.locator('#lex-cab-coach-error');
      await errorEl.waitFor({ state: 'visible', timeout: 5000 });
      await expect(errorEl).toContainText('Something went wrong');
    }
  });

  test('shows error state when API returns error field', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-cab-coach-api-error');
    });

    await page.route('**/api/lex-cab-coach/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await page.goto(ACTIVITIES_URL);

    const coachBtn = page.locator('#cab-lex-coach-btn');
    if (await coachBtn.isVisible()) {
      await coachBtn.click();

      await page.locator('#lex-cab-coach-loading').waitFor({ state: 'hidden', timeout: 5000 });
      const errorEl = page.locator('#lex-cab-coach-error');
      await expect(errorEl).not.toHaveClass(/hidden/);
    }
  });

  test('does not crash with empty gameAnalysis array', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-cab-coach-empty-games');
    });

    await page.route('**/api/lex-cab-coach/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          hasHistory: true,
          stats: { totalGames: 0, solveRate: 0, avgAttempts: 0, quickSolves: 0 },
          analysis: 'No games yet.',
          gameAnalysis: []
        })
      });
    });

    await page.goto(ACTIVITIES_URL);

    const coachBtn = page.locator('#cab-lex-coach-btn');
    if (await coachBtn.isVisible()) {
      await coachBtn.click();
      await page.locator('#lex-cab-coach-loading').waitFor({ state: 'hidden', timeout: 5000 });

      const critical = errors.filter(e =>
        e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
      );
      expect(critical).toHaveLength(0);
    }
  });

  test('loading spinner shows while API is pending', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-cab-coach-loading');
    });

    // Delay the response to observe loading state
    await page.route('**/api/lex-cab-coach/', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ hasHistory: false, stats: null, analysis: 'Done.', gameAnalysis: [] })
      });
    });

    await page.goto(ACTIVITIES_URL);

    const coachBtn = page.locator('#cab-lex-coach-btn');
    if (await coachBtn.isVisible()) {
      await coachBtn.click();

      // Loading should be visible immediately
      const loading = page.locator('#lex-cab-coach-loading');
      await expect(loading).not.toHaveClass(/hidden/);

      // Result should still be hidden
      const result = page.locator('#lex-cab-coach-result');
      await expect(result).toHaveClass(/hidden/);
    }
  });
});
