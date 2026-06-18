import { test, expect } from '@playwright/test';

/**
 * Daily Anagram API Tests
 * Tests GET /api/daily-anagram/ and POST /api/daily-anagram/
 * including the time_taken field submitted on game completion.
 */

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const API = `${BASE_URL}/api/daily-anagram/`;

// ── GET /api/daily-anagram — Positive ────────────────────────────────────

test.describe('Daily Anagram API GET — Positive', () => {
  test('returns puzzle data for today', async ({ request }) => {
    const res = await request.get(API);
    if (res.status() === 404) { test.skip(); return; }
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('date');
    expect(body).toHaveProperty('scrambled');
    expect(body).toHaveProperty('word_length');
    expect(body).toHaveProperty('expiresAt');
    expect(body).toHaveProperty('stats');
  });

  test('returns stats with players, solvers, avg_attempts', async ({ request }) => {
    const res = await request.get(API);
    if (res.status() === 404) { test.skip(); return; }
    const body = await res.json();
    expect(body.stats).toHaveProperty('players');
    expect(body.stats).toHaveProperty('solvers');
    expect(body.stats).toHaveProperty('avg_attempts');
    expect(typeof body.stats.players).toBe('number');
  });

  test('accepts date query param', async ({ request }) => {
    const res = await request.get(`${API}?date=2026-06-18`);
    // Either 200 (puzzle exists) or 404 (no puzzle for that date)
    expect([200, 404]).toContain(res.status());
  });

  test('returns userResult when user_id is provided', async ({ request }) => {
    const res = await request.get(`${API}?user_id=playwright-get-test`);
    if (res.status() === 404) { test.skip(); return; }
    const body = await res.json();
    // userResult may be null (not played yet) or an object
    expect(body).toHaveProperty('userResult');
  });
});

// ── GET /api/daily-anagram — Negative ────────────────────────────────────

test.describe('Daily Anagram API GET — Negative', () => {
  test('returns 404 for a date with no puzzle', async ({ request }) => {
    const res = await request.get(`${API}?date=1999-01-01`);
    expect(res.status()).toBe(404);
    const contentType = res.headers()['content-type'] || '';
    if (contentType.includes('application/json')) {
      const body = await res.json();
      expect(body.error).toContain('No puzzle');
    }
  });

  test('does not expose answer for unsolved users', async ({ request }) => {
    const res = await request.get(`${API}?user_id=never-played-user-xyz`);
    if (res.status() === 404) { test.skip(); return; }
    const body = await res.json();
    expect(body.answer).toBeNull();
  });
});

// ── POST /api/daily-anagram — Positive ───────────────────────────────────

test.describe('Daily Anagram API POST — Positive', () => {
  test('accepts a guess and returns feedback array', async ({ request }) => {
    const res = await request.post(API, {
      data: {
        user_id: `pw-post-test-${Date.now()}`,
        guess: 'ABCDEF',
      },
    });
    if (res.status() === 404) { test.skip(); return; }
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('feedback');
    expect(Array.isArray(body.feedback)).toBe(true);
    expect(body).toHaveProperty('attempts');
    expect(body.attempts).toBe(1);
  });

  test('accepts time_taken in the POST body', async ({ request }) => {
    const res = await request.post(API, {
      data: {
        user_id: `pw-time-test-${Date.now()}`,
        guess: 'XXXXXX',
        time_taken: 42,
      },
    });
    if (res.status() === 404) { test.skip(); return; }
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('feedback');
    expect(body).toHaveProperty('attempts');
  });

  test('time_taken is stored in user result after game completion', async ({ request }) => {
    const userId = `pw-time-store-${Date.now()}`;
    let lastRes: any;
    for (let i = 0; i < 5; i++) {
      lastRes = await request.post(API, {
        data: {
          user_id: userId,
          guess: 'ZZZZZZ',
          time_taken: (i + 1) * 10, // cumulative: 10, 20, 30, 40, 50
        },
      });
      if (lastRes.status() === 404) { test.skip(); return; }
    }
    const body = await lastRes.json();
    expect(body.game_over).toBe(true);

    // Verify via GET that time_taken is reflected in userResult
    const getRes = await request.get(`${API}?user_id=${userId}`);
    if (getRes.status() === 200) {
      const getBody = await getRes.json();
      if (getBody.userResult) {
        expect(getBody.userResult.time_taken).toBe(50);
      }
    }
  });

  test('time_taken is stored per guess in the guesses array', async ({ request }) => {
    const userId = `pw-time-per-guess-${Date.now()}`;
    // Submit 2 guesses with cumulative times
    const res1 = await request.post(API, {
      data: { user_id: userId, guess: 'ABCDEF', time_taken: 8 },
    });
    if (res1.status() === 404) { test.skip(); return; }
    const res2 = await request.post(API, {
      data: { user_id: userId, guess: 'GHIJKL', time_taken: 22 },
    });
    const body = await res2.json();
    expect(body.guesses).toHaveLength(2);
    expect(body.guesses[0].time_taken).toBe(8);
    expect(body.guesses[1].time_taken).toBe(22);
  });

  test('time_taken is capped at 3600 seconds', async ({ request }) => {
    const userId = `pw-time-cap-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      const res = await request.post(API, {
        data: {
          user_id: userId,
          guess: 'YYYYYY',
          time_taken: i === 4 ? 99999 : undefined,
        },
      });
      if (res.status() === 404) { test.skip(); return; }
    }

    const getRes = await request.get(`${API}?user_id=${userId}`);
    if (getRes.status() === 200) {
      const body = await getRes.json();
      if (body.userResult) {
        expect(body.userResult.time_taken).toBeLessThanOrEqual(3600);
      }
    }
  });

  test('each guess in the guesses array includes time_taken', async ({ request }) => {
    const userId = `pw-per-guess-time-${Date.now()}`;
    const res = await request.post(API, {
      data: { user_id: userId, guess: 'ABCDEF', time_taken: 12 },
    });
    if (res.status() === 404) { test.skip(); return; }
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.guesses).toBeDefined();
    expect(body.guesses[0]).toHaveProperty('time_taken', 12);
  });

  test('per-guess time_taken is clamped to 0-3600 range', async ({ request }) => {
    const userId = `pw-per-guess-clamp-${Date.now()}`;
    // Send negative time
    const res1 = await request.post(API, {
      data: { user_id: userId, guess: 'AAAAAA', time_taken: -50 },
    });
    if (res1.status() === 404) { test.skip(); return; }
    const body1 = await res1.json();
    expect(body1.guesses[0].time_taken).toBe(0);

    // Send excessively large time
    const res2 = await request.post(API, {
      data: { user_id: userId, guess: 'BBBBBB', time_taken: 99999 },
    });
    const body2 = await res2.json();
    expect(body2.guesses[1].time_taken).toBe(3600);
  });

  test('per-guess time_taken defaults to 0 when not provided', async ({ request }) => {
    const userId = `pw-per-guess-default-${Date.now()}`;
    const res = await request.post(API, {
      data: { user_id: userId, guess: 'CCCCCC' },
    });
    if (res.status() === 404) { test.skip(); return; }
    const body = await res.json();
    expect(body.guesses[0].time_taken).toBe(0);
  });

  test('each guess includes a guessed_at ISO timestamp', async ({ request }) => {
    const userId = `pw-guessed-at-${Date.now()}`;
    const beforePost = new Date().toISOString();
    const res = await request.post(API, {
      data: { user_id: userId, guess: 'ABCDEF', time_taken: 5 },
    });
    if (res.status() === 404) { test.skip(); return; }
    const body = await res.json();
    expect(body.guesses[0]).toHaveProperty('guessed_at');
    // Must be a valid ISO date string
    const ts = new Date(body.guesses[0].guessed_at);
    expect(ts.getTime()).not.toBeNaN();
    // Timestamp should be at or after the moment we sent the request
    expect(ts.toISOString() >= beforePost).toBe(true);
  });

  test('guessed_at timestamps are sequential across multiple guesses', async ({ request }) => {
    const userId = `pw-guessed-at-seq-${Date.now()}`;
    const res1 = await request.post(API, {
      data: { user_id: userId, guess: 'AAAAAA', time_taken: 3 },
    });
    if (res1.status() === 404) { test.skip(); return; }
    const res2 = await request.post(API, {
      data: { user_id: userId, guess: 'BBBBBB', time_taken: 7 },
    });
    const body = await res2.json();
    expect(body.guesses).toHaveLength(2);
    const t1 = new Date(body.guesses[0].guessed_at).getTime();
    const t2 = new Date(body.guesses[1].guessed_at).getTime();
    expect(t2).toBeGreaterThanOrEqual(t1);
  });

  test('feedback contains only green, yellow, or gray values', async ({ request }) => {
    const res = await request.post(API, {
      data: {
        user_id: `pw-feedback-vals-${Date.now()}`,
        guess: 'ABCDEF',
      },
    });
    if (res.status() === 404) { test.skip(); return; }
    const body = await res.json();
    for (const fb of body.feedback) {
      expect(['green', 'yellow', 'gray']).toContain(fb);
    }
  });

  test('returns answer when game is over (5 wrong guesses)', async ({ request }) => {
    const userId = `pw-answer-reveal-${Date.now()}`;
    let lastRes: any;
    for (let i = 0; i < 5; i++) {
      lastRes = await request.post(API, {
        data: { user_id: userId, guess: 'QQQQQQ', time_taken: 60 },
      });
      if (lastRes.status() === 404) { test.skip(); return; }
    }
    const body = await lastRes.json();
    expect(body.game_over).toBe(true);
    expect(body).toHaveProperty('answer');
    expect(typeof body.answer).toBe('string');
  });
});

// ── POST /api/daily-anagram — Negative ───────────────────────────────────

test.describe('Daily Anagram API POST — Negative', () => {
  test('returns 400 when guess is missing', async ({ request }) => {
    const res = await request.post(API, {
      data: { user_id: 'pw-no-guess' },
    });
    if (res.status() === 404) { test.skip(); return; }
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('guess');
  });

  test('returns 400 when body is empty object', async ({ request }) => {
    const res = await request.post(API, {
      data: {},
    });
    if (res.status() === 404) { test.skip(); return; }
    expect(res.status()).toBe(400);
  });

  test('returns 404 for a non-existent puzzle date', async ({ request }) => {
    const res = await request.post(API, {
      data: { user_id: 'pw-bad-date', guess: 'TESTXX', date: '1900-01-01' },
    });
    expect(res.status()).toBe(404);
    const contentType = res.headers()['content-type'] || '';
    if (contentType.includes('application/json')) {
      const body = await res.json();
      expect(body.error).toContain('No puzzle');
    }
  });

  test('does not crash with non-numeric time_taken', async ({ request }) => {
    const res = await request.post(API, {
      data: {
        user_id: `pw-bad-time-${Date.now()}`,
        guess: 'ABCDEF',
        time_taken: 'not-a-number',
      },
    });
    if (res.status() === 404) { test.skip(); return; }
    // Should not return 500 — handles gracefully
    expect(res.status()).not.toBe(500);
  });

  test('does not accept more than 5 guesses after game over', async ({ request }) => {
    const userId = `pw-max-guesses-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      const res = await request.post(API, {
        data: { user_id: userId, guess: 'WWWWWW' },
      });
      if (res.status() === 404) { test.skip(); return; }
    }
    // 6th guess
    const sixthRes = await request.post(API, {
      data: { user_id: userId, guess: 'VVVVVV' },
    });
    if (sixthRes.status() === 404) { test.skip(); return; }
    const body = await sixthRes.json();
    expect(body.game_over).toBe(true);
    expect(body.attempts).toBeLessThanOrEqual(5);
  });

  test('does not allow guesses after already solved', async ({ request }) => {
    const checkRes = await request.get(API);
    if (checkRes.status() === 404) { test.skip(); return; }

    const userId = `pw-already-solved-${Date.now()}`;
    const res = await request.post(API, {
      data: { user_id: userId, guess: 'AAAAAA' },
    });
    const body = await res.json();
    if (body.correct) {
      const secondRes = await request.post(API, {
        data: { user_id: userId, guess: 'BBBBBB' },
      });
      const secondBody = await secondRes.json();
      expect(secondBody.already_solved).toBe(true);
    }
  });

  test('per-guess time_taken handles non-numeric gracefully (defaults to 0)', async ({ request }) => {
    const userId = `pw-per-guess-nan-${Date.now()}`;
    const res = await request.post(API, {
      data: { user_id: userId, guess: 'RRRRRR', time_taken: 'banana' },
    });
    if (res.status() === 404) { test.skip(); return; }
    expect(res.status()).not.toBe(500);
    const body = await res.json();
    expect(body.guesses[0].time_taken).toBe(0);
  });

  test('guessed_at is always present even without time_taken', async ({ request }) => {
    const userId = `pw-guessed-at-no-time-${Date.now()}`;
    const res = await request.post(API, {
      data: { user_id: userId, guess: 'FFFFFF' },
    });
    if (res.status() === 404) { test.skip(); return; }
    expect(res.status()).not.toBe(500);
    const body = await res.json();
    expect(body.guesses[0]).toHaveProperty('guessed_at');
    expect(new Date(body.guesses[0].guessed_at).getTime()).not.toBeNaN();
  });

  test('time_taken of 0 is not stored as negative', async ({ request }) => {
    const userId = `pw-time-zero-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      const res = await request.post(API, {
        data: { user_id: userId, guess: 'NNNNNN', time_taken: 0 },
      });
      if (res.status() === 404) { test.skip(); return; }
    }
    const getRes = await request.get(`${API}?user_id=${userId}`);
    if (getRes.status() === 200) {
      const body = await getRes.json();
      if (body.userResult) {
        expect(body.userResult.time_taken).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
