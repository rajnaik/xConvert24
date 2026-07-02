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

// ── Quiz Performance Graph — Positive ──────────────────────────────

test.describe('Quiz Performance Graph — Positive', () => {
  test('performance graph section exists in DOM', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#lex-quiz-graph-section')).toHaveCount(1);
  });

  test('performance graph canvas element exists with correct dimensions', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const canvas = page.locator('#lex-quiz-graph');
    await expect(canvas).toHaveCount(1);
    await expect(canvas).toHaveAttribute('width', '400');
    await expect(canvas).toHaveAttribute('height', '180');
  });

  test('performance graph section becomes visible when coach returns game data', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'test-graph-user'); });

    await page.route('**/api/lex-quiz-coach/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_COACH_WITH_GAMES) });
    });
    await page.route('**/api/quiz-scores/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ scores: [{ id: 1 }] }) });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#LexQuiz', { timeout: 8000 });
    await page.locator('#LexQuiz').click();
    await page.waitForSelector('#lex-quiz-graph-section:not(.hidden)', { timeout: 8000 });

    await expect(page.locator('#lex-quiz-graph-section')).toBeVisible();
  });

  test('performance graph legend shows Accuracy and Time Used labels', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    const section = page.locator('#lex-quiz-graph-section');
    await expect(section.locator('text=Accuracy %')).toHaveCount(1);
    await expect(section.locator('text=Time Used (s)')).toHaveCount(1);
  });

  test('time commentary section exists in DOM', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#lex-quiz-time-commentary')).toHaveCount(1);
    await expect(page.locator('#lex-quiz-time-commentary-text')).toHaveCount(1);
  });

  test('time commentary becomes visible when coach returns 2+ games', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'test-time-commentary'); });

    await page.route('**/api/lex-quiz-coach/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_COACH_WITH_GAMES) });
    });
    await page.route('**/api/quiz-scores/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ scores: [{ id: 1 }] }) });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#LexQuiz', { timeout: 8000 });
    await page.locator('#LexQuiz').click();
    await page.waitForSelector('#lex-quiz-time-commentary:not(.hidden)', { timeout: 8000 });

    await expect(page.locator('#lex-quiz-time-commentary')).toBeVisible();
    const text = await page.locator('#lex-quiz-time-commentary-text').textContent();
    expect(text).toContain('Fastest');
    expect(text).toContain('Slowest');
  });
});

// ── Quiz Performance Graph — Negative ──────────────────────────────

test.describe('Quiz Performance Graph — Negative', () => {
  test('performance graph section is hidden when no history exists', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'test-graph-no-hist'); });

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

    await expect(page.locator('#lex-quiz-graph-section')).toBeHidden();
  });

  test('no duplicate performance graph sections exist', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#lex-quiz-graph-section')).toHaveCount(1);
    await expect(page.locator('#lex-quiz-graph')).toHaveCount(1);
  });

  test('no JS errors when rendering the performance graph', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'test-graph-errors'); });

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
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read') || e.includes('canvas')
    );
    expect(critical).toHaveLength(0);
  });

  test('performance graph section is hidden by default before interaction', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#lex-quiz-graph-section')).toBeHidden();
  });

  test('time commentary is hidden when no history exists', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'test-time-no-hist'); });

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

    await expect(page.locator('#lex-quiz-time-commentary')).toBeHidden();
  });

  test('no duplicate time commentary elements exist', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#lex-quiz-time-commentary')).toHaveCount(1);
    await expect(page.locator('#lex-quiz-time-commentary-text')).toHaveCount(1);
  });
});
