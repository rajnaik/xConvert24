import { test, expect } from '@playwright/test';

/**
 * Daily Rack API Tests
 * Tests GET /api/daily-rack/ and POST /api/daily-rack/
 * Verifies server-side Scrabble score calculation (scrabbleScore function).
 */

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const API = `${BASE_URL}/api/daily-rack/`;

// Standard Scrabble letter values (mirrors the server implementation)
const LETTER_VALUES: Record<string, number> = {A:1,B:3,C:3,D:2,E:1,F:4,G:2,H:4,I:1,J:8,K:5,L:1,M:3,N:1,O:1,P:3,Q:10,R:1,S:1,T:1,U:1,V:4,W:4,X:8,Y:4,Z:10};

function expectedScore(word: string): number {
  return word.toUpperCase().split('').reduce((sum, ch) => sum + (LETTER_VALUES[ch] || 0), 0);
}

// ── GET /api/daily-rack — Positive ───────────────────────────────────────

test.describe('Daily Rack API GET — Positive', () => {
  test('returns rack data for today', async ({ request }) => {
    const res = await request.get(API);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('date');
    expect(body).toHaveProperty('rack');
    expect(body).toHaveProperty('best_word');
    expect(body).toHaveProperty('best_score');
    expect(body).toHaveProperty('expiresAt');
  });

  test('rack is exactly 7 uppercase letters', async ({ request }) => {
    const res = await request.get(API);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.rack).toMatch(/^[A-Z]{7}$/);
  });

  test('accepts date query param', async ({ request }) => {
    const res = await request.get(`${API}?date=2026-07-02`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.date).toBe('2026-07-02');
  });

  test('returns userScores when user_id is provided', async ({ request }) => {
    const res = await request.get(`${API}?user_id=playwright-rack-test`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('userScores');
    expect(Array.isArray(body.userScores)).toBe(true);
  });

  test('returns topScores array', async ({ request }) => {
    const res = await request.get(API);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('topScores');
    expect(Array.isArray(body.topScores)).toBe(true);
  });

  test('expiresAt is a valid ISO date in the future', async ({ request }) => {
    const res = await request.get(API);
    expect(res.status()).toBe(200);
    const body = await res.json();
    const expires = new Date(body.expiresAt);
    expect(expires.getTime()).not.toBeNaN();
    expect(expires.getTime()).toBeGreaterThan(Date.now());
  });
});

// ── GET /api/daily-rack — Negative ───────────────────────────────────────

test.describe('Daily Rack API GET — Negative', () => {
  test('creates a new rack for a future date with no data', async ({ request }) => {
    // Future date unlikely to have seeded data — API auto-generates one
    const res = await request.get(`${API}?date=2099-12-31`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.rack).toMatch(/^[A-Z]{7}$/);
    expect(body.date).toBe('2099-12-31');
  });

  test('topScores is limited to 10 entries', async ({ request }) => {
    const res = await request.get(API);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.topScores.length).toBeLessThanOrEqual(10);
  });
});

// ── POST /api/daily-rack — Positive (Server-Side Scoring) ────────────────

test.describe('Daily Rack API POST — Positive', () => {
  test('submits a word and returns server-calculated score', async ({ request }) => {
    const userId = `pw-rack-submit-${Date.now()}`;
    const word = 'CAT';
    const res = await request.post(API, {
      data: { user_id: userId, word },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.score).toBe(expectedScore(word)); // C(3)+A(1)+T(1) = 5
  });

  test('score matches standard Scrabble letter values for high-value word', async ({ request }) => {
    const userId = `pw-rack-highval-${Date.now()}`;
    const word = 'QUIZ';
    const res = await request.post(API, {
      data: { user_id: userId, word },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    // Q(10)+U(1)+I(1)+Z(10) = 22
    expect(body.score).toBe(22);
  });

  test('score calculation is case-insensitive', async ({ request }) => {
    const userId = `pw-rack-case-${Date.now()}`;
    const word = 'cat';
    const res = await request.post(API, {
      data: { user_id: userId, word },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.score).toBe(expectedScore('CAT')); // 5
  });

  test('score ignores client-provided score (server is truth)', async ({ request }) => {
    const userId = `pw-rack-noscore-${Date.now()}`;
    const word = 'DOG';
    const res = await request.post(API, {
      data: { user_id: userId, word, score: 9999 },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    // D(2)+O(1)+G(2) = 5 — not 9999
    expect(body.score).toBe(5);
  });

  test('word with all high-value letters scores correctly', async ({ request }) => {
    const userId = `pw-rack-jxqz-${Date.now()}`;
    const word = 'JX';
    const res = await request.post(API, {
      data: { user_id: userId, word },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    // J(8)+X(8) = 16
    expect(body.score).toBe(16);
  });
});

// ── POST /api/daily-rack — Negative ─────────────────────────────────────

test.describe('Daily Rack API POST — Negative', () => {
  test('returns 400 when word is missing', async ({ request }) => {
    const res = await request.post(API, {
      data: { user_id: 'pw-no-word' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('word');
  });

  test('returns 409 for duplicate word submission (same user, same day)', async ({ request }) => {
    const userId = `pw-rack-dupe-${Date.now()}`;
    const word = 'TEST';
    // First submission
    const res1 = await request.post(API, {
      data: { user_id: userId, word },
    });
    expect(res1.status()).toBe(200);
    // Second identical submission
    const res2 = await request.post(API, {
      data: { user_id: userId, word },
    });
    expect(res2.status()).toBe(409);
    const body = await res2.json();
    expect(body.error).toBe('duplicate');
  });

  test('does not crash with empty string word', async ({ request }) => {
    const res = await request.post(API, {
      data: { user_id: 'pw-empty-word', word: '' },
    });
    // Empty string should be treated as missing
    expect(res.status()).toBe(400);
  });

  test('returns error for non-string word value', async ({ request }) => {
    const res = await request.post(API, {
      data: { user_id: `pw-num-word-${Date.now()}`, word: 12345 },
    });
    // Numeric word is not a valid string — server returns 400 or 500
    // Documenting current behaviour: the API does not gracefully reject non-string words
    expect([400, 500]).toContain(res.status());
  });
});
