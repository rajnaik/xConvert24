import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

/**
 * Word Quiz — Leaderboard Rank Link in Result Panel
 * After a quiz ends, a leaderboard rank link (🏆 #N today) appears linking to /leaderboard/?game=word-quiz
 */

test.describe('Word Quiz Leaderboard Rank Link — Positive', () => {
  test('leaderboard rank container exists in quiz-complete panel and is initially hidden', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const rankDiv = page.locator('#quiz-lb-rank');
    await expect(rankDiv).toBeAttached();
    await expect(rankDiv).toHaveClass(/hidden/);
  });

  test('leaderboard rank link has correct href to /leaderboard/?game=word-quiz', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const link = page.locator('#quiz-lb-rank-link');
    await expect(link).toHaveAttribute('href', '/leaderboard/?game=word-quiz');
  });

  test('leaderboard rank link contains trophy emoji and rank text span', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const link = page.locator('#quiz-lb-rank-link');
    const linkText = await link.textContent();
    expect(linkText).toContain('🏆');
    const rankText = page.locator('#quiz-lb-rank-text');
    await expect(rankText).toBeAttached();
  });

  test('leaderboard rank link has purple pill styling', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const link = page.locator('#quiz-lb-rank-link');
    await expect(link).toHaveClass(/rounded-full/);
    await expect(link).toHaveClass(/bg-purple-900/);
    await expect(link).toHaveClass(/border-purple-500/);
    await expect(link).toHaveClass(/text-purple-300/);
  });

  test('leaderboard rank link has explicit inline-flex style for Firefox compatibility', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const link = page.locator('#quiz-lb-rank-link');
    const style = await link.getAttribute('style');
    expect(style).toContain('inline-flex');
  });

  test('leaderboard rank becomes visible after completing a quiz', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-user-quiz-lb');
    });

    // Mock Word Quiz API
    await page.route('**/api/word-quiz/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          questions: [
            { word: 'QUIXOTIC', meaning: 'Exceedingly idealistic' },
            { word: 'EPHEMERAL', meaning: 'Lasting a very short time' },
            { word: 'ZEPHYR', meaning: 'A light wind from the west' },
          ],
          fakeMeanings: [
            'A type of mineral',
            'To move quickly',
            'A large structure',
            'Very cold weather',
            'An ancient instrument',
            'To speak loudly',
          ],
        }),
      });
    });

    // Mock leaderboard POST + GET
    await page.route('**/api/leaderboard/**', async (route, request) => {
      if (request.method() === 'POST') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            game: 'word-quiz',
            period: 'today',
            entries: [{ rank: 3, user_id: 'test-user-quiz-lb', best_score: 3, total_score: 3, words_played: 1, display_name: 'Test User' }],
            stats: { players: 8, total_games: 15, top_score: 7 },
          }),
        });
      }
    });

    // Mock achievements + daily-progress
    await page.route('**/api/achievements/**', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await page.route('**/api/daily-progress/**', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await page.route('**/api/quiz-scores/**', route => {
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });

    await page.goto(ACTIVITIES_URL);

    // Select 3-question quiz for speed
    await page.locator('.quiz-count-btn[data-count="3"]').click();

    // Start quiz
    await page.locator('#quiz-start-btn').click();

    // Answer all 3 questions (always pick the first option — correct or not doesn't matter for this test)
    for (let i = 0; i < 3; i++) {
      await page.waitForSelector('.quiz-opt', { timeout: 5000 });
      // Click the correct answer (data-correct="true")
      const correctOpt = page.locator('.quiz-opt[data-correct="true"]');
      await correctOpt.click();
      // Click OK on the encouragement modal
      await page.waitForSelector('#quiz-modal:not(.hidden)', { timeout: 3000 });
      await page.locator('#quiz-modal-ok').click();
    }

    // Wait for quiz-complete section to show
    await page.waitForSelector('#quiz-complete:not(.hidden)', { timeout: 5000 });

    // Wait for leaderboard fetch
    await page.waitForTimeout(1500);

    // Rank div should become visible with rank text
    const rankDiv = page.locator('#quiz-lb-rank');
    await expect(rankDiv).not.toHaveClass(/hidden/);
    const rankText = await page.locator('#quiz-lb-rank-text').textContent();
    expect(rankText).toContain('#3');
    expect(rankText).toContain('today');
  });
});

test.describe('Word Quiz Leaderboard Rank Link — Negative', () => {
  test('no duplicate quiz leaderboard rank elements on page', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const rankDivs = page.locator('#quiz-lb-rank');
    await expect(rankDivs).toHaveCount(1);
  });

  test('leaderboard rank link is inside the quiz-complete section', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const inComplete = page.locator('#quiz-complete #quiz-lb-rank');
    const total = page.locator('#quiz-lb-rank');
    const inCompleteCount = await inComplete.count();
    const totalCount = await total.count();
    expect(totalCount).toBe(inCompleteCount);
  });

  test('no console errors related to quiz rank link on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(ACTIVITIES_URL);
    await page.waitForTimeout(2000);
    const critical = errors.filter(e =>
      e.includes('quiz-lb-rank') || e.includes('TypeError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });

  test('leaderboard rank default text is Loading... before data arrives', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const rankText = page.locator('#quiz-lb-rank-text');
    const text = await rankText.textContent();
    expect(text).toBe('Loading...');
  });

  test('rank link is hidden again after clicking Play Again', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('swf-uid', 'test-user-quiz-replay');
    });

    await page.route('**/api/word-quiz/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          questions: [{ word: 'TEST', meaning: 'A trial' }, { word: 'WORD', meaning: 'A unit of language' }, { word: 'PLAY', meaning: 'To engage in activity' }],
          fakeMeanings: ['A colour', 'A number', 'To sleep', 'A place', 'Very tall', 'To run fast'],
        }),
      });
    });

    await page.route('**/api/leaderboard/**', async (route, request) => {
      if (request.method() === 'POST') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            game: 'word-quiz', period: 'today',
            entries: [{ rank: 1, user_id: 'test-user-quiz-replay', best_score: 3, total_score: 3, words_played: 1, display_name: 'Test' }],
            stats: { players: 1, total_games: 1, top_score: 3 },
          }),
        });
      }
    });

    await page.route('**/api/achievements/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
    await page.route('**/api/daily-progress/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
    await page.route('**/api/quiz-scores/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));

    await page.goto(ACTIVITIES_URL);

    // Play a 3-question quiz
    await page.locator('.quiz-count-btn[data-count="3"]').click();
    await page.locator('#quiz-start-btn').click();

    for (let i = 0; i < 3; i++) {
      await page.waitForSelector('.quiz-opt', { timeout: 5000 });
      await page.locator('.quiz-opt[data-correct="true"]').click();
      await page.waitForSelector('#quiz-modal:not(.hidden)', { timeout: 3000 });
      await page.locator('#quiz-modal-ok').click();
    }

    await page.waitForSelector('#quiz-complete:not(.hidden)', { timeout: 5000 });
    await page.waitForTimeout(1500);

    // Rank should be visible
    await expect(page.locator('#quiz-lb-rank')).not.toHaveClass(/hidden/);

    // Click Play Again
    await page.locator('#quiz-retry-btn').click();

    // Rank should be hidden again
    await expect(page.locator('#quiz-lb-rank')).toHaveClass(/hidden/);
  });
});
