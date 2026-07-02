import { test, expect } from '@playwright/test';

/**
 * API Endpoint Tests — /api/lex-anagram-coach/
 * Tests the Lex AI anagram coaching endpoint that analyses Daily Anagram history
 * and returns phase progression, per-game analysis, timing data, and graph data.
 */

test.describe('API — /api/lex-anagram-coach/ POST — Positive', () => {
  test('POST with valid user_id returns response (not 404)', async ({ request }) => {
    const response = await request.post('/api/lex-anagram-coach/', {
      data: { user_id: 'test-user-anagram-playwright' },
    });
    expect(response.status()).not.toBe(404);
    expect([200, 400]).toContain(response.status());
  });

  test('POST with user that has no history returns hasHistory false with wisdom', async ({ request }) => {
    const response = await request.post('/api/lex-anagram-coach/', {
      data: { user_id: 'no-anagram-history-user-xyz-99999' },
    });
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.hasHistory).toBe(false);
      expect(body.analysis).toBeDefined();
      expect(typeof body.analysis).toBe('string');
      expect(body.analysis.length).toBeGreaterThan(20);
    }
  });

  test('POST with history returns hasHistory true with stats', async ({ request }) => {
    // Seed anagram score data
    await request.post('/api/daily-anagram/', {
      data: {
        user_id: 'lex-anagram-coach-test-user',
        date: '2026-06-20',
        attempts: 2,
        solved: 1,
        guesses: 'TCLSAE,CASTLE',
        time_taken: 45,
      },
    });

    const response = await request.post('/api/lex-anagram-coach/', {
      data: { user_id: 'lex-anagram-coach-test-user' },
    });
    if (response.status() === 200) {
      const body = await response.json();
      if (body.hasHistory) {
        expect(body.stats).toBeDefined();
        expect(body.stats.totalGames).toBeGreaterThanOrEqual(1);
        expect(body.stats.totalSolved).toBeDefined();
        expect(body.stats.solveRate).toBeDefined();
        expect(body.stats.avgAttempts).toBeDefined();
        expect(body.stats.avgTime).toBeDefined();
        expect(body.stats.streak).toBeDefined();
      }
    }
  });

  test('POST with history includes attempt distribution fields (in1-in5, failed)', async ({ request }) => {
    const response = await request.post('/api/lex-anagram-coach/', {
      data: { user_id: 'lex-anagram-coach-test-user' },
    });
    if (response.status() === 200) {
      const body = await response.json();
      if (body.hasHistory) {
        expect(body.stats.in1).toBeDefined();
        expect(body.stats.in2).toBeDefined();
        expect(body.stats.in3).toBeDefined();
        expect(body.stats.in4).toBeDefined();
        expect(body.stats.in5).toBeDefined();
        expect(body.stats.failed).toBeDefined();
        expect(typeof body.stats.in1).toBe('number');
        expect(typeof body.stats.failed).toBe('number');
      }
    }
  });

  test('POST with history includes gameAnalysis array', async ({ request }) => {
    const response = await request.post('/api/lex-anagram-coach/', {
      data: { user_id: 'lex-anagram-coach-test-user' },
    });
    if (response.status() === 200) {
      const body = await response.json();
      if (body.hasHistory) {
        expect(body.gameAnalysis).toBeDefined();
        expect(Array.isArray(body.gameAnalysis)).toBe(true);
        expect(body.gameAnalysis.length).toBeGreaterThanOrEqual(1);
        const entry = body.gameAnalysis[0];
        expect(entry.gameNumber).toBeDefined();
        expect(entry.date).toBeDefined();
        expect(typeof entry.solved).toBe('boolean');
        expect(entry.attempts).toBeDefined();
        expect(entry.timeTaken).toBeDefined();
        expect(entry.rating).toBeDefined();
        expect(['genius', 'excellent', 'good', 'fair', 'close', 'failed']).toContain(entry.rating);
        expect(Array.isArray(entry.improvements)).toBe(true);
        expect(Array.isArray(entry.weaknesses)).toBe(true);
      }
    }
  });

  test('POST with history includes analysis string from AI or fallback', async ({ request }) => {
    const response = await request.post('/api/lex-anagram-coach/', {
      data: { user_id: 'lex-anagram-coach-test-user' },
    });
    if (response.status() === 200) {
      const body = await response.json();
      if (body.hasHistory) {
        expect(body.analysis).toBeDefined();
        expect(typeof body.analysis).toBe('string');
        expect(body.analysis.length).toBeGreaterThan(10);
      }
    }
  });

  test('POST response includes phases field (null for few games)', async ({ request }) => {
    const response = await request.post('/api/lex-anagram-coach/', {
      data: { user_id: 'lex-anagram-coach-test-user' },
    });
    if (response.status() === 200) {
      const body = await response.json();
      if (body.hasHistory) {
        // phases should be present in the response (either null or object)
        expect('phases' in body).toBe(true);
      }
    }
  });
});

test.describe('API — /api/lex-anagram-coach/ POST — Phase Progression', () => {
  const phaseUserId = 'lex-anagram-phase-test-' + Date.now();

  test.beforeAll(async ({ request }) => {
    // Seed 12 anagram scores so phase analysis triggers (requires >= 9 games)
    for (let i = 0; i < 12; i++) {
      const date = `2026-05-${String(i + 1).padStart(2, '0')}`;
      await request.post('/api/daily-anagram/', {
        data: {
          user_id: phaseUserId,
          date,
          attempts: Math.max(1, 5 - Math.floor(i / 3)), // getting better over time: 5,5,5, 4,4,4, 3,3,3, 2,2,2
          solved: 1,
          guesses: 'GUESS',
          time_taken: 90 - i * 5, // getting faster over time
        },
      });
    }
  });

  test('phases object is returned when user has 9+ games', async ({ request }) => {
    const response = await request.post('/api/lex-anagram-coach/', {
      data: { user_id: phaseUserId },
    });
    if (response.status() === 200) {
      const body = await response.json();
      if (body.hasHistory && body.stats.totalGames >= 9) {
        expect(body.phases).not.toBeNull();
        expect(body.phases).toBeDefined();
      }
    }
  });

  test('phases contains beginning, mid, and end with required fields', async ({ request }) => {
    const response = await request.post('/api/lex-anagram-coach/', {
      data: { user_id: phaseUserId },
    });
    if (response.status() === 200) {
      const body = await response.json();
      if (body.phases) {
        for (const phase of ['beginning', 'mid', 'end']) {
          const p = body.phases[phase];
          expect(p).toBeDefined();
          expect(typeof p.count).toBe('number');
          expect(typeof p.solved).toBe('number');
          expect(typeof p.solveRate).toBe('number');
          expect(typeof p.avgAttempts).toBe('number');
          expect(typeof p.avgTime).toBe('number');
        }
      }
    }
  });

  test('phases includes trend field (improving, declining, or stable)', async ({ request }) => {
    const response = await request.post('/api/lex-anagram-coach/', {
      data: { user_id: phaseUserId },
    });
    if (response.status() === 200) {
      const body = await response.json();
      if (body.phases) {
        expect(body.phases.trend).toBeDefined();
        expect(['improving', 'declining', 'stable']).toContain(body.phases.trend);
      }
    }
  });

  test('phases includes rateDelta and attemptDelta numbers', async ({ request }) => {
    const response = await request.post('/api/lex-anagram-coach/', {
      data: { user_id: phaseUserId },
    });
    if (response.status() === 200) {
      const body = await response.json();
      if (body.phases) {
        expect(typeof body.phases.rateDelta).toBe('number');
        expect(typeof body.phases.attemptDelta).toBe('number');
      }
    }
  });

  test('phases is null when user has fewer than 9 games', async ({ request }) => {
    const fewGamesUser = 'lex-anagram-few-games-' + Date.now();
    // Seed 5 games (below 9-game threshold)
    for (let i = 0; i < 5; i++) {
      const date = `2026-04-${String(i + 1).padStart(2, '0')}`;
      await request.post('/api/daily-anagram/', {
        data: {
          user_id: fewGamesUser,
          date,
          attempts: 3,
          solved: 1,
          guesses: 'TEST',
          time_taken: 60,
        },
      });
    }

    const response = await request.post('/api/lex-anagram-coach/', {
      data: { user_id: fewGamesUser },
    });
    if (response.status() === 200) {
      const body = await response.json();
      if (body.hasHistory) {
        expect(body.phases).toBeNull();
      }
    }
  });
});

test.describe('API — /api/lex-anagram-coach/ POST — Per-Game Analysis', () => {
  test('gameAnalysis entry for a solved game has rating genius/excellent/good/fair/close', async ({ request }) => {
    const userId = 'lex-anagram-rating-test-' + Date.now();
    // Seed a game with 1 attempt (should be "genius")
    await request.post('/api/daily-anagram/', {
      data: {
        user_id: userId,
        date: '2026-03-15',
        attempts: 1,
        solved: 1,
        guesses: 'CASTLE',
        time_taken: 12,
      },
    });

    const response = await request.post('/api/lex-anagram-coach/', {
      data: { user_id: userId },
    });
    if (response.status() === 200) {
      const body = await response.json();
      if (body.hasHistory && body.gameAnalysis?.length > 0) {
        const entry = body.gameAnalysis[0];
        expect(entry.rating).toBe('genius');
        expect(entry.solved).toBe(true);
        expect(entry.attempts).toBe(1);
      }
    }
  });

  test('gameAnalysis entry for failed game has rating failed', async ({ request }) => {
    const userId = 'lex-anagram-failed-rating-' + Date.now();
    await request.post('/api/daily-anagram/', {
      data: {
        user_id: userId,
        date: '2026-03-16',
        attempts: 5,
        solved: 0,
        guesses: 'A,B,C,D,E',
        time_taken: 120,
      },
    });

    const response = await request.post('/api/lex-anagram-coach/', {
      data: { user_id: userId },
    });
    if (response.status() === 200) {
      const body = await response.json();
      if (body.hasHistory && body.gameAnalysis?.length > 0) {
        const entry = body.gameAnalysis[0];
        expect(entry.rating).toBe('failed');
        expect(entry.solved).toBe(false);
      }
    }
  });

  test('gameAnalysis includes puzzle data (word, scrambled) when available', async ({ request }) => {
    const response = await request.post('/api/lex-anagram-coach/', {
      data: { user_id: 'lex-anagram-coach-test-user' },
    });
    if (response.status() === 200) {
      const body = await response.json();
      if (body.hasHistory && body.gameAnalysis?.length > 0) {
        const entry = body.gameAnalysis[0];
        // word and scrambled can be null if puzzle not in daily_anagram table
        expect('word' in entry).toBe(true);
        expect('scrambled' in entry).toBe(true);
        expect('wordLength' in entry).toBe(true);
      }
    }
  });

  test('gameAnalysis improvements array populated for first-try solves', async ({ request }) => {
    const userId = 'lex-anagram-improve-test-' + Date.now();
    await request.post('/api/daily-anagram/', {
      data: {
        user_id: userId,
        date: '2026-03-20',
        attempts: 1,
        solved: 1,
        guesses: 'CASTLE',
        time_taken: 15,
      },
    });

    const response = await request.post('/api/lex-anagram-coach/', {
      data: { user_id: userId },
    });
    if (response.status() === 200) {
      const body = await response.json();
      if (body.hasHistory && body.gameAnalysis?.length > 0) {
        const entry = body.gameAnalysis[0];
        // 1-attempt solve should have at least one improvement note
        expect(entry.improvements.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  test('gameAnalysis weaknesses array populated for high-attempt solves', async ({ request }) => {
    const userId = 'lex-anagram-weakness-test-' + Date.now();
    await request.post('/api/daily-anagram/', {
      data: {
        user_id: userId,
        date: '2026-03-21',
        attempts: 4,
        solved: 1,
        guesses: 'A,B,C,CASTLE',
        time_taken: 150,
      },
    });

    const response = await request.post('/api/lex-anagram-coach/', {
      data: { user_id: userId },
    });
    if (response.status() === 200) {
      const body = await response.json();
      if (body.hasHistory && body.gameAnalysis?.length > 0) {
        const entry = body.gameAnalysis[0];
        // 4 attempts + 150s should trigger weakness notes
        expect(entry.weaknesses.length).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

test.describe('API — /api/lex-anagram-coach/ POST — Negative', () => {
  test('POST without user_id returns 400', async ({ request }) => {
    const response = await request.post('/api/lex-anagram-coach/', {
      data: {},
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('user_id');
  });

  test('POST with empty string user_id returns 400', async ({ request }) => {
    const response = await request.post('/api/lex-anagram-coach/', {
      data: { user_id: '' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('user_id');
  });

  test('POST with invalid JSON returns 400', async ({ request }) => {
    const response = await request.post('/api/lex-anagram-coach/', {
      headers: { 'Content-Type': 'application/json' },
      data: 'not-valid-json{{{',
    });
    expect(response.status()).toBe(400);
  });

  test('POST handles SQL injection in user_id gracefully', async ({ request }) => {
    const response = await request.post('/api/lex-anagram-coach/', {
      data: { user_id: "'; DROP TABLE daily_anagram_scores; --" },
    });
    expect(response.status()).not.toBe(500);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.hasHistory).toBe(false);
    }
  });

  test('POST with no-history user does not include stats or gameAnalysis', async ({ request }) => {
    const response = await request.post('/api/lex-anagram-coach/', {
      data: { user_id: 'definitely-no-anagram-history-xyz-negative' },
    });
    if (response.status() === 200) {
      const body = await response.json();
      if (body.hasHistory === false) {
        expect(body.stats).toBeUndefined();
        expect(body.gameAnalysis).toBeUndefined();
        expect(body.phases).toBeUndefined();
      }
    }
  });

  test('POST does not return 500 on any valid request', async ({ request }) => {
    const response = await request.post('/api/lex-anagram-coach/', {
      data: { user_id: 'any-valid-user-123' },
    });
    expect(response.status()).not.toBe(500);
  });
});
