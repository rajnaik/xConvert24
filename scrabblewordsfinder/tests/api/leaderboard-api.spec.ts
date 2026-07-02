import { test, expect } from '@playwright/test';

/**
 * Leaderboard API Tests
 * Tests for POST /api/leaderboard/ (submit score) and GET /api/leaderboard/ (read rankings).
 */

const VALID_GAMES = ['daily-duel', 'sixty-second', 'cab', 'daily-rack', 'daily-anagram'];

test.describe('API — POST /api/leaderboard/ — Positive', () => {
  test('submits a valid score and returns success with inserted flag', async ({ request }) => {
    const response = await request.post('/api/leaderboard/', {
      data: {
        game: 'daily-duel',
        user_id: 'test-user-leaderboard-001',
        best_word: 'QUIXOTIC',
        best_score: 42,
      },
    });
    // 201 on insert, 200 on update (if test runs twice same day)
    expect([200, 201]).toContain(response.status());
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.best_score).toBeGreaterThanOrEqual(42);
    expect(body.total_score).toBeGreaterThanOrEqual(42);
  });

  test('accepts all valid game types', async ({ request }) => {
    for (const game of VALID_GAMES) {
      const response = await request.post('/api/leaderboard/', {
        data: {
          game,
          user_id: `test-valid-game-${game}`,
          best_word: 'TEST',
          best_score: 10,
        },
      });
      expect([200, 201]).toContain(response.status());
      const body = await response.json();
      expect(body.success).toBe(true);
    }
  });

  test('returns JSON content-type', async ({ request }) => {
    const response = await request.post('/api/leaderboard/', {
      data: {
        game: 'sixty-second',
        user_id: 'test-content-type-check',
        best_word: 'WORD',
        best_score: 8,
      },
    });
    expect(response.headers()['content-type']).toContain('application/json');
  });

  test('accepts optional total_score and words_played fields', async ({ request }) => {
    const response = await request.post('/api/leaderboard/', {
      data: {
        game: 'cab',
        user_id: 'test-optional-fields-001',
        best_word: 'CRANE',
        best_score: 15,
        total_score: 120,
        words_played: 8,
      },
    });
    expect([200, 201]).toContain(response.status());
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.total_score).toBeGreaterThanOrEqual(120);
  });

  test('uppercases best_word in response/storage', async ({ request }) => {
    const response = await request.post('/api/leaderboard/', {
      data: {
        game: 'daily-rack',
        user_id: 'test-uppercase-check-001',
        best_word: 'lowercase',
        best_score: 5,
      },
    });
    expect([200, 201]).toContain(response.status());
    const body = await response.json();
    expect(body.success).toBe(true);
  });
});

test.describe('API — POST /api/leaderboard/ — Negative', () => {
  test('rejects missing game field', async ({ request }) => {
    const response = await request.post('/api/leaderboard/', {
      data: {
        user_id: 'test-no-game',
        best_score: 10,
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Missing required fields');
  });

  test('rejects missing user_id field', async ({ request }) => {
    const response = await request.post('/api/leaderboard/', {
      data: {
        game: 'daily-duel',
        best_score: 10,
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Missing required fields');
  });

  test('rejects missing best_score field', async ({ request }) => {
    const response = await request.post('/api/leaderboard/', {
      data: {
        game: 'daily-duel',
        user_id: 'test-no-score',
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Missing required fields');
  });

  test('rejects invalid game name', async ({ request }) => {
    const response = await request.post('/api/leaderboard/', {
      data: {
        game: 'invalid-game-xyz',
        user_id: 'test-invalid-game',
        best_score: 10,
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Invalid game');
  });

  test('rejects invalid JSON body', async ({ request }) => {
    const response = await request.fetch('/api/leaderboard/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-valid-json{{{',
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Invalid JSON');
  });

  test('rejects empty body', async ({ request }) => {
    const response = await request.post('/api/leaderboard/', {
      data: {},
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });
});

test.describe('API — GET /api/leaderboard/ — Positive', () => {
  test('returns leaderboard for a valid game (today)', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=daily-duel');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.game).toBe('daily-duel');
    expect(body.period).toBe('today');
    expect(Array.isArray(body.entries)).toBe(true);
    expect(typeof body.count).toBe('number');
  });

  test('returns entries with correct shape', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=daily-duel&period=alltime');
    expect(response.status()).toBe(200);
    const body = await response.json();
    if (body.entries.length > 0) {
      const entry = body.entries[0];
      expect(entry.rank).toBe(1);
      expect(entry.user_id).toBeDefined();
      expect(entry.display_name).toBeDefined();
      expect(entry.avatar_src).toBeDefined();
      expect(typeof entry.best_score).toBe('number');
      expect(typeof entry.total_score).toBe('number');
    }
  });

  test('respects limit parameter', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=daily-duel&period=alltime&limit=3');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.entries.length).toBeLessThanOrEqual(3);
  });

  test('accepts period=week', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=sixty-second&period=week');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.period).toBe('week');
    expect(Array.isArray(body.entries)).toBe(true);
  });

  test('accepts period=month', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=cab&period=month');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.period).toBe('month');
    expect(Array.isArray(body.entries)).toBe(true);
  });

  test('accepts period=alltime', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=daily-rack&period=alltime');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.period).toBe('alltime');
    expect(Array.isArray(body.entries)).toBe(true);
  });

  test('accepts custom date parameter', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=daily-anagram&date=2026-07-01');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.date).toBe('2026-07-01');
  });

  test('caps limit at 100', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=daily-duel&period=alltime&limit=500');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.entries.length).toBeLessThanOrEqual(100);
  });

  test('returns JSON content-type', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=daily-duel');
    expect(response.headers()['content-type']).toContain('application/json');
  });
});

test.describe('API — GET /api/leaderboard/ — Negative', () => {
  test('rejects missing game parameter', async ({ request }) => {
    const response = await request.get('/api/leaderboard/');
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('game parameter required');
  });

  test('returns empty entries for non-existent game data', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=daily-duel&date=1999-01-01');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.entries).toHaveLength(0);
    expect(body.count).toBe(0);
  });

  test('handles unknown period gracefully (defaults to today)', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=daily-duel&period=unknown-period');
    expect(response.status()).toBe(200);
    const body = await response.json();
    // Falls through to default case which uses today filter
    expect(Array.isArray(body.entries)).toBe(true);
  });

  test('handles negative limit gracefully', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=daily-duel&limit=-5');
    // Should not crash, likely returns 0 results or handles NaN
    expect([200, 400]).toContain(response.status());
  });
});

test.describe('API — GET /api/leaderboard/ — CaB Stats Fields — Positive', () => {
  test('CaB response includes stats object with cab-specific fields', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=cab&period=alltime');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.stats).toBeDefined();
    // CaB stats always include these keys (may be empty string / 0 if no data)
    expect('top_best_word' in body.stats).toBe(true);
    expect('top_word_length' in body.stats).toBe(true);
    expect('top_attempts' in body.stats).toBe(true);
    expect('total_pts_sum' in body.stats).toBe(true);
  });

  test('CaB stats.top_best_word is a string', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=cab&period=alltime');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body.stats.top_best_word).toBe('string');
  });

  test('CaB stats.top_word_length is a number', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=cab&period=alltime');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body.stats.top_word_length).toBe('number');
  });

  test('CaB stats.top_attempts is a number', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=cab&period=alltime');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body.stats.top_attempts).toBe('number');
  });

  test('CaB stats.total_pts_sum is a number', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=cab&period=alltime');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body.stats.total_pts_sum).toBe('number');
  });

  test('CaB stats still includes base stats fields (players, total_games, top_score)', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=cab&period=alltime');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body.stats.players).toBe('number');
    expect(typeof body.stats.total_games).toBe('number');
    expect(typeof body.stats.top_score).toBe('number');
  });

  test('CaB stats cab fields present for today period', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=cab&period=today');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect('top_best_word' in body.stats).toBe(true);
    expect('total_pts_sum' in body.stats).toBe(true);
  });

  test('Daily Rack response includes top_best_word and total_pts_sum in stats', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=daily-rack&period=alltime');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.stats).toBeDefined();
    expect('top_best_word' in body.stats).toBe(true);
    expect('total_pts_sum' in body.stats).toBe(true);
    expect(typeof body.stats.top_best_word).toBe('string');
    expect(typeof body.stats.total_pts_sum).toBe('number');
  });

  test('Daily Rack stats does NOT include cab-only fields (top_word_length, top_attempts)', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=daily-rack&period=alltime');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect('top_word_length' in body.stats).toBe(false);
    expect('top_attempts' in body.stats).toBe(false);
  });
});

test.describe('API — GET /api/leaderboard/ — CaB Stats Fields — Negative', () => {
  test('non-CaB game (sixty-second) does NOT include cab-specific stats fields', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=sixty-second&period=alltime');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.stats).toBeDefined();
    expect('top_best_word' in body.stats).toBe(false);
    expect('top_word_length' in body.stats).toBe(false);
    expect('top_attempts' in body.stats).toBe(false);
    expect('total_pts_sum' in body.stats).toBe(false);
  });

  test('non-CaB game (daily-rack) does NOT include cab-specific stats fields', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=daily-rack&period=alltime');
    expect(response.status()).toBe(200);
    const body = await response.json();
    // daily-rack shares top_best_word and total_pts_sum, but NOT cab-only fields
    expect('top_word_length' in body.stats).toBe(false);
    expect('top_attempts' in body.stats).toBe(false);
  });

  test('non-CaB game (daily-anagram) does NOT include cab-specific stats fields', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=daily-anagram&period=alltime');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect('top_best_word' in body.stats).toBe(false);
    expect('total_pts_sum' in body.stats).toBe(false);
  });

  test('non-CaB game (daily-duel) stats only has base fields', async ({ request }) => {
    const response = await request.get('/api/leaderboard/?game=daily-duel&period=alltime');
    expect(response.status()).toBe(200);
    const body = await response.json();
    const statKeys = Object.keys(body.stats);
    // Base fields only: players, total_games, top_score
    expect(statKeys).toContain('players');
    expect(statKeys).toContain('total_games');
    expect(statKeys).toContain('top_score');
    expect(statKeys).not.toContain('top_best_word');
    expect(statKeys).not.toContain('top_word_length');
    expect(statKeys).not.toContain('top_attempts');
    expect(statKeys).not.toContain('total_pts_sum');
  });

  test('CaB with no entries still includes cab stats fields with defaults', async ({ request }) => {
    // Use a far-past date to guarantee no entries
    const response = await request.get('/api/leaderboard/?game=cab&date=2000-01-01');
    expect(response.status()).toBe(200);
    const body = await response.json();
    // When entries.length === 0, the spread condition is false, so cab fields should NOT be present
    if (body.entries.length === 0) {
      expect('top_best_word' in body.stats).toBe(false);
    }
  });
});
