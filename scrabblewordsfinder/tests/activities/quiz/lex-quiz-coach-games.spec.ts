import { test, expect } from '@playwright/test';

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const ACTIVITIES_URL = `${BASE_URL}/activities/`;

// Mock data for a user with game history including per-game analysis
const MOCK_COACH_RESPONSE = {
  hasHistory: true,
  stats: { totalGames: 3, accuracy: 67, avgScore: 4.7, avgTotal: 7, totalPerfect: 1, totalTimedOut: 1, avgTime: 52 },
  analysis: 'Good progress! You are improving steadily.',
  gameAnalysis: [
    {
      gameNumber: 3, score: 7, total: 7, accuracy: 100, timeUsed: 38, timerLimit: 90, timedOut: false,
      rating: 'perfect', missedWords: [], weaknesses: [], improvements: ['Perfect score! Flawless round', 'Fast and accurate — great speed'],
      date: '2026-07-01T10:30:00'
    },
    {
      gameNumber: 2, score: 5, total: 7, accuracy: 71, timeUsed: 65, timerLimit: 90, timedOut: false,
      rating: 'good', missedWords: ['QUIXOTIC', 'EPHEMERAL'], weaknesses: ['2 slow answer(s) — hesitation on uncertain words'],
      improvements: ['5 correct out of 7'], date: '2026-06-30T14:00:00'
    },
    {
      gameNumber: 1, score: 2, total: 7, accuracy: 29, timeUsed: 90, timerLimit: 90, timedOut: true,
      rating: 'weak', missedWords: ['LACONIC', 'SANGUINE', 'OBSEQUIOUS', 'PERNICIOUS', 'FASTIDIOUS'],
      weaknesses: ['Ran out of time — consider a longer timer or fewer questions', 'Missed 5/7 words — vocabulary gaps'],
      improvements: ['2 correct out of 7'], date: '2026-06-29T09:00:00'
    }
  ]
};

// Mock response with no history
const MOCK_NO_HISTORY = {
  hasHistory: false,
  analysis: 'Welcome to the Word Quiz! Try your first game to get coaching feedback.'
};

// ── Lex Quiz Coach Game Analysis — Positive ──────────────────────────────

test.describe('Lex Quiz Coach Game Analysis — Positive', () => {
  test('game-by-game section appears when coach returns game data', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'test-games-user'); });

    await page.route('**/api/lex-quiz-coach/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_COACH_RESPONSE) });
    });
    await page.route('**/api/quiz-scores/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ scores: [{ id: 1 }] }) });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#LexQuiz', { timeout: 8000 });
    await page.locator('#LexQuiz').click();
    await page.waitForSelector('#lex-quiz-games', { timeout: 8000 });

    await expect(page.locator('#lex-quiz-games')).toBeVisible();
  });

  test('game count label shows correct number of games', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'test-games-user'); });

    await page.route('**/api/lex-quiz-coach/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_COACH_RESPONSE) });
    });
    await page.route('**/api/quiz-scores/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ scores: [{ id: 1 }] }) });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#LexQuiz', { timeout: 8000 });
    await page.locator('#LexQuiz').click();
    await page.waitForSelector('#lex-quiz-games-count', { timeout: 8000 });

    await expect(page.locator('#lex-quiz-games-count')).toContainText('3 games');
  });

  test('each game card shows game number, score, and rating badge', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'test-games-user'); });

    await page.route('**/api/lex-quiz-coach/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_COACH_RESPONSE) });
    });
    await page.route('**/api/quiz-scores/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ scores: [{ id: 1 }] }) });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#LexQuiz', { timeout: 8000 });
    await page.locator('#LexQuiz').click();
    await page.waitForSelector('#lex-quiz-games-list', { timeout: 8000 });

    const gamesList = page.locator('#lex-quiz-games-list');
    // Should have 3 game cards
    const cards = gamesList.locator('> div');
    await expect(cards).toHaveCount(3);

    // First card is Game #3 (most recent) with PERFECT rating
    const firstCard = cards.nth(0);
    await expect(firstCard).toContainText('Game #3');
    await expect(firstCard).toContainText('PERFECT');
    await expect(firstCard).toContainText('7/7');
  });

  test('weaknesses are displayed for weak-rated games', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'test-games-user'); });

    await page.route('**/api/lex-quiz-coach/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_COACH_RESPONSE) });
    });
    await page.route('**/api/quiz-scores/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ scores: [{ id: 1 }] }) });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#LexQuiz', { timeout: 8000 });
    await page.locator('#LexQuiz').click();
    await page.waitForSelector('#lex-quiz-games-list', { timeout: 8000 });

    // Third card (Game #1) should show weaknesses
    const thirdCard = page.locator('#lex-quiz-games-list > div').nth(2);
    await expect(thirdCard).toContainText('Weaknesses');
    await expect(thirdCard).toContainText('Ran out of time');
    await expect(thirdCard).toContainText('vocabulary gaps');
  });

  test('missed words are shown as badges for games with errors', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'test-games-user'); });

    await page.route('**/api/lex-quiz-coach/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_COACH_RESPONSE) });
    });
    await page.route('**/api/quiz-scores/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ scores: [{ id: 1 }] }) });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#LexQuiz', { timeout: 8000 });
    await page.locator('#LexQuiz').click();
    await page.waitForSelector('#lex-quiz-games-list', { timeout: 8000 });

    // Second card (Game #2) should show missed words QUIXOTIC and EPHEMERAL
    const secondCard = page.locator('#lex-quiz-games-list > div').nth(1);
    await expect(secondCard).toContainText('QUIXOTIC');
    await expect(secondCard).toContainText('EPHEMERAL');
  });

  test('strengths/improvements are displayed for games', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'test-games-user'); });

    await page.route('**/api/lex-quiz-coach/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_COACH_RESPONSE) });
    });
    await page.route('**/api/quiz-scores/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ scores: [{ id: 1 }] }) });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#LexQuiz', { timeout: 8000 });
    await page.locator('#LexQuiz').click();
    await page.waitForSelector('#lex-quiz-games-list', { timeout: 8000 });

    // First card (Game #3 - perfect) should show strengths
    const firstCard = page.locator('#lex-quiz-games-list > div').nth(0);
    await expect(firstCard).toContainText('Strengths');
    await expect(firstCard).toContainText('Perfect score');
  });

  test('timed-out indicator shows on timed-out games', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'test-games-user'); });

    await page.route('**/api/lex-quiz-coach/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_COACH_RESPONSE) });
    });
    await page.route('**/api/quiz-scores/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ scores: [{ id: 1 }] }) });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#LexQuiz', { timeout: 8000 });
    await page.locator('#LexQuiz').click();
    await page.waitForSelector('#lex-quiz-games-list', { timeout: 8000 });

    // Third card (Game #1) was timed out
    const thirdCard = page.locator('#lex-quiz-games-list > div').nth(2);
    await expect(thirdCard).toContainText('Timed Out');
  });
});

// ── Lex Quiz Coach Game Analysis — Negative ──────────────────────────────

test.describe('Lex Quiz Coach Game Analysis — Negative', () => {
  test('game-by-game section is hidden when no history exists', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'test-no-history'); });

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

    // Games section should remain hidden
    await expect(page.locator('#lex-quiz-games')).toBeHidden();
  });

  test('no duplicate game analysis sections exist', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#lex-quiz-games')).toHaveCount(1);
    await expect(page.locator('#lex-quiz-games-list')).toHaveCount(1);
  });

  test('no JS errors when opening Lex Coach modal with game data', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'test-err-check'); });

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('**/api/lex-quiz-coach/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_COACH_RESPONSE) });
    });
    await page.route('**/api/quiz-scores/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ scores: [{ id: 1 }] }) });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#LexQuiz', { timeout: 8000 });
    await page.locator('#LexQuiz').click();
    await page.waitForSelector('#lex-quiz-games-list', { timeout: 8000 });
    await page.waitForTimeout(500);

    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });

  test('game analysis handles empty gameAnalysis array gracefully', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'test-empty-games'); });

    const emptyGamesResponse = {
      ...MOCK_COACH_RESPONSE,
      gameAnalysis: []
    };

    await page.route('**/api/lex-quiz-coach/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(emptyGamesResponse) });
    });
    await page.route('**/api/quiz-scores/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ scores: [{ id: 1 }] }) });
    });

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#LexQuiz', { timeout: 8000 });
    await page.locator('#LexQuiz').click();
    await page.waitForSelector('#lex-quiz-result', { timeout: 8000 });
    await page.waitForTimeout(500);

    // Should not crash — games section stays hidden
    await expect(page.locator('#lex-quiz-games')).toBeHidden();
    expect(errors.filter(e => e.includes('TypeError'))).toHaveLength(0);
  });
});

// ── Lex Quiz Coach Performance Graph — Positive ──────────────────────────

test.describe('Lex Quiz Coach Performance Graph — Positive', () => {
  test('performance graph section is visible when 2+ games exist', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'test-graph-user'); });

    await page.route('**/api/lex-quiz-coach/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_COACH_RESPONSE) });
    });
    await page.route('**/api/quiz-scores/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ scores: [{ id: 1 }] }) });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#LexQuiz', { timeout: 8000 });
    await page.locator('#LexQuiz').click();
    await page.waitForSelector('#lex-quiz-graph-section', { state: 'visible', timeout: 8000 });

    await expect(page.locator('#lex-quiz-graph-section')).toBeVisible();
  });

  test('canvas element exists inside graph section', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'test-graph-user'); });

    await page.route('**/api/lex-quiz-coach/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_COACH_RESPONSE) });
    });
    await page.route('**/api/quiz-scores/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ scores: [{ id: 1 }] }) });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#LexQuiz', { timeout: 8000 });
    await page.locator('#LexQuiz').click();
    await page.waitForSelector('#lex-quiz-graph-section', { state: 'visible', timeout: 8000 });

    const canvas = page.locator('#lex-quiz-graph');
    await expect(canvas).toBeVisible();
    // Canvas width/height are dynamically set by the graph renderer based on clientWidth
    const width = await canvas.getAttribute('width');
    const height = await canvas.getAttribute('height');
    expect(Number(width)).toBeGreaterThan(0);
    expect(Number(height)).toBeGreaterThan(0);
  });

  test('graph legend shows Accuracy and Time Used labels', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'test-graph-user'); });

    await page.route('**/api/lex-quiz-coach/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_COACH_RESPONSE) });
    });
    await page.route('**/api/quiz-scores/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ scores: [{ id: 1 }] }) });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#LexQuiz', { timeout: 8000 });
    await page.locator('#LexQuiz').click();
    await page.waitForSelector('#lex-quiz-graph-section', { state: 'visible', timeout: 8000 });

    const section = page.locator('#lex-quiz-graph-section');
    await expect(section).toContainText('Accuracy %');
    await expect(section).toContainText('Time Used (s)');
  });

  test('graph title shows Performance Over Time', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'test-graph-user'); });

    await page.route('**/api/lex-quiz-coach/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_COACH_RESPONSE) });
    });
    await page.route('**/api/quiz-scores/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ scores: [{ id: 1 }] }) });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#LexQuiz', { timeout: 8000 });
    await page.locator('#LexQuiz').click();
    await page.waitForSelector('#lex-quiz-graph-section', { state: 'visible', timeout: 8000 });

    await expect(page.locator('#lex-quiz-graph-section')).toContainText('Performance Over Time');
  });
});

// ── Lex Quiz Coach Performance Graph — Negative ──────────────────────────

test.describe('Lex Quiz Coach Performance Graph — Negative', () => {
  test('graph is hidden when user has no history', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'test-no-graph-user'); });

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

  test('graph is hidden when only 1 game exists (needs 2+ for line)', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'test-single-game'); });

    const singleGameResponse = {
      hasHistory: true,
      stats: { totalGames: 1, accuracy: 80, avgScore: 8, avgTotal: 10, totalPerfect: 0, totalTimedOut: 0, avgTime: 45 },
      analysis: 'Keep it up!',
      gameAnalysis: [
        { gameNumber: 1, score: 8, total: 10, accuracy: 80, timeUsed: 45, timerLimit: 90, timedOut: false, rating: 'great', missedWords: [], weaknesses: [], improvements: ['Strong accuracy at 80%'], date: '2026-07-01T10:00:00' }
      ]
    };

    await page.route('**/api/lex-quiz-coach/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(singleGameResponse) });
    });
    await page.route('**/api/quiz-scores/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ scores: [{ id: 1 }] }) });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#LexQuiz', { timeout: 8000 });
    await page.locator('#LexQuiz').click();
    await page.waitForSelector('#lex-quiz-result', { timeout: 8000 });
    await page.waitForTimeout(500);

    await expect(page.locator('#lex-quiz-graph-section')).toBeHidden();
  });

  test('no JS errors when rendering graph with game data', async ({ page }) => {
    await page.addInitScript(() => { localStorage.setItem('swf-uid', 'test-graph-errors'); });

    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.route('**/api/lex-quiz-coach/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_COACH_RESPONSE) });
    });
    await page.route('**/api/quiz-scores/**', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ scores: [{ id: 1 }] }) });
    });

    await page.goto(ACTIVITIES_URL);
    await page.waitForSelector('#LexQuiz', { timeout: 8000 });
    await page.locator('#LexQuiz').click();
    await page.waitForSelector('#lex-quiz-graph-section', { state: 'visible', timeout: 8000 });
    await page.waitForTimeout(300);

    const critical = errors.filter(e =>
      e.includes('TypeError') || e.includes('ReferenceError') || e.includes('Cannot read')
    );
    expect(critical).toHaveLength(0);
  });

  test('no duplicate graph sections exist in the DOM', async ({ page }) => {
    await page.goto(ACTIVITIES_URL);
    await expect(page.locator('#lex-quiz-graph-section')).toHaveCount(1);
    await expect(page.locator('#lex-quiz-graph')).toHaveCount(1);
  });
});
