import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

const MOCK_COACH_WITH_GAMES = {
  hasHistory: true,
  stats: { totalGames: 4, accuracy: 72, avgScore: 5.0, avgTotal: 7, totalPerfect: 1, totalTimedOut: 0, avgTime: 48 },
  analysis: 'Steady improvement over your last 4 quizzes.',
  gameAnalysis: [
    { gameNumber: 4, score: 7, total: 7, accuracy: 100, timeUsed: 35, timerLimit: 90, timedOut: false, rating: 'perfect', missedWords: [], weaknesses: [], improvements: ['Flawless round'], date: '2026-07-02T10:00:00' },
    { gameNumber: 3, score: 5, total: 7, accuracy: 71, timeUsed: 52, timerLimit: 90, timedOut: false, rating: 'good', missedWords: ['EPHEMERAL', 'SANGUINE'], weaknesses: [], improvements: ['5/7 correct'], date: '2026-07-01T14:00:00' },
    { gameNumber: 2, score: 4, total: 7, accuracy: 57, timeUsed: 68, timerLimit: 90, timedOut: false, rating: 'okay', missedWords: ['LACONIC', 'OBSEQUIOUS', 'PERNICIOUS'], weaknesses: ['Missed 3 words'], improvements: ['4/7 correct'], date: '2026-06-30T09:00:00' },
    { gameNumber: 1, score: 4, total: 7, accuracy: 57, timeUsed: 72, timerLimit: 90, timedOut: false, rating: 'okay', missedWords: ['FASTIDIOUS', 'SYCOPHANT', 'QUIXOTIC'], weaknesses: ['Vocabulary gaps'], improvements: ['4/7 correct'], date: '2026-06-29T09:00:00' }
  ]
};

const MOCK_NO_HISTORY = {
  hasHistory: false,
  analysis: 'Welcome to the Word Quiz! Try your first game to get coaching feedback.'
};

// ── Quiz Stats Timing Row — Positive ──────────────────────────────

test.describe('Quiz Stats Timing Row — Positive', () => {
  test('fastest stat element exists in DOM', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#lex-quiz-stat-fastest')).toHaveCount(1);
  });

  test('slowest stat element exists in DOM', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#lex-quiz-stat-slowest')).toHaveCount(1);
  });

  test('avg time stat element exists in DOM', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#lex-quiz-stat-avgtime')).toHaveCount(1);
  });

  test('stats bar has two rows of 3 columns each', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const statsBar = page.locator('#lex-quiz-stats-bar');
    const grids = statsBar.locator('.grid.grid-cols-3');
    await expect(grids).toHaveCount(2);
  });

  test('timing stats show default dash values before quiz', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#lex-quiz-stat-fastest')).toHaveText('—');
    await expect(page.locator('#lex-quiz-stat-slowest')).toHaveText('—');
    await expect(page.locator('#lex-quiz-stat-avgtime')).toHaveText('—');
  });

  test('timing stats labels are correct', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const statsBar = page.locator('#lex-quiz-stats-bar');
    await expect(statsBar.locator('text=Fastest')).toHaveCount(1);
    await expect(statsBar.locator('text=Slowest')).toHaveCount(1);
    await expect(statsBar.locator('text=Avg Time')).toHaveCount(1);
  });
});

// ── Quiz Stats Timing Row — Negative ──────────────────────────────

test.describe('Quiz Stats Timing Row — Negative', () => {
  test('no duplicate timing stat elements exist', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#lex-quiz-stat-fastest')).toHaveCount(1);
    await expect(page.locator('#lex-quiz-stat-slowest')).toHaveCount(1);
    await expect(page.locator('#lex-quiz-stat-avgtime')).toHaveCount(1);
  });

  test('stats bar remains hidden when no quiz history exists', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'test-timing-no-hist'); });

    await page.route('**/api/lex-quiz-coach/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_NO_HISTORY) });
    });
    await page.route('**/api/quiz-scores/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ scores: [] }) });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#LexQuiz', { timeout: 8000 });
    await page.locator('#LexQuiz').click();
    await page.waitForSelector('#lex-quiz-result', { timeout: 8000 });
    await page.waitForTimeout(500);

    await expect(page.locator('#lex-quiz-stats-bar')).toBeHidden();
  });

  test('no JS errors when rendering timing stats with coach data', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'test-timing-errors'); });

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('**/api/lex-quiz-coach/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_COACH_WITH_GAMES) });
    });
    await page.route('**/api/quiz-scores/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ scores: [{ id: 1 }] }) });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#LexQuiz', { timeout: 8000 });
    await page.locator('#LexQuiz').click();
    await page.waitForSelector('#lex-quiz-result', { timeout: 8000 });
    await page.waitForTimeout(1000);

    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });

  test('original stats (Quizzes, Accuracy, Perfect) still exist after restructure', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#lex-quiz-stat-games')).toHaveCount(1);
    await expect(page.locator('#lex-quiz-stat-accuracy')).toHaveCount(1);
    await expect(page.locator('#lex-quiz-stat-perfect')).toHaveCount(1);
  });
});
