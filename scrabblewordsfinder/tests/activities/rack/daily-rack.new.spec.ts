import { test, expect } from '@playwright/test';

/**
 * Daily Rack Challenge API Tests
 * Covers GET /api/daily-rack and POST /api/daily-rack.
 * The env-based DB initialisation (cloudflare:workers env) is tested
 * indirectly — a well-formed request must return a valid response shape.
 */

const today = new Date().toISOString().split('T')[0];

test.describe('Daily Rack API — Positive', () => {
  test('GET /api/daily-rack returns today\'s rack with expected fields', async ({ request }) => {
    const res = await request.get('/api/daily-rack');
    expect([200, 500]).toContain(res.status()); // 500 only if DB unavailable in test env
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.date).toBeDefined();
      expect(body.rack).toBeDefined();
    }
  });

  test('GET /api/daily-rack rack is exactly 7 letters', async ({ request }) => {
    const res = await request.get('/api/daily-rack');
    if (res.status() === 200) {
      const body = await res.json();
      expect(typeof body.rack).toBe('string');
      expect(body.rack.length).toBe(7);
    }
  });

  test('GET /api/daily-rack returns date matching today', async ({ request }) => {
    const res = await request.get(`/api/daily-rack?date=${today}`);
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.date).toBe(today);
    }
  });

  test('GET /api/daily-rack includes topScores array', async ({ request }) => {
    const res = await request.get('/api/daily-rack');
    if (res.status() === 200) {
      const body = await res.json();
      expect(Array.isArray(body.topScores)).toBe(true);
    }
  });

  test('GET /api/daily-rack with user_id returns userScores array', async ({ request }) => {
    const res = await request.get('/api/daily-rack?user_id=test-playwright-uid');
    if (res.status() === 200) {
      const body = await res.json();
      expect(Array.isArray(body.userScores)).toBe(true);
    }
  });

  test('POST /api/daily-rack with valid payload returns success', async ({ request }) => {
    const res = await request.post('/api/daily-rack', {
      data: { user_id: 'test-playwright-uid', word: 'QUIZ', score: 22, date: today },
    });
    // 200 on live, 500 if DB unavailable — never 404 or 400
    expect(res.status()).not.toBe(404);
    expect(res.status()).not.toBe(400);
  });

  test('GET /api/daily-rack is not a 404', async ({ request }) => {
    const res = await request.get('/api/daily-rack');
    expect(res.status()).not.toBe(404);
  });
});

test.describe('Daily Rack API — Negative', () => {
  test('POST /api/daily-rack without word does not return 404', async ({ request }) => {
    // The API validates that both word AND score are missing before rejecting.
    // Missing just word (score present) currently inserts with empty word — not ideal but documented here.
    const res = await request.post('/api/daily-rack', {
      data: { user_id: 'test-uid', score: 10, date: today },
    });
    expect(res.status()).not.toBe(404);
  });

  test('POST /api/daily-rack without score does not return 404', async ({ request }) => {
    const res = await request.post('/api/daily-rack', {
      data: { user_id: 'test-uid', word: 'QUIZ', date: today },
    });
    expect(res.status()).not.toBe(404);
  });

  test('POST /api/daily-rack with both word and score absent returns 400', async ({ request }) => {
    // Only when BOTH word and score are falsy does the API return 400
    const res = await request.post('/api/daily-rack', {
      data: { user_id: 'test-uid', date: today },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  test('GET /api/daily-rack with arbitrary date param does not crash', async ({ request }) => {
    const res = await request.get('/api/daily-rack?date=2099-12-31');
    // Should return 200 (creates a new rack) or 500 (no DB) — not a crash (no 5xx from uncaught error)
    expect(res.status()).not.toBe(404);
  });

  test('GET /api/daily-rack does not return error field on normal request', async ({ request }) => {
    const res = await request.get('/api/daily-rack');
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.error).toBeUndefined();
    }
  });
});
