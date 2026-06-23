import { test, expect } from '@playwright/test';

/**
 * Word of the Day API Tests
 * Tests GET /api/wotd and POST /api/wotd
 * Covers enriched fields: origin, usage_example, spelling_tip, cultural_note
 */

const BASE_URL = process.env.SWF_TEST_URL || 'http://localhost:4321';
const API = `${BASE_URL}/api/wotd/`;

// ── GET /api/wotd — Positive ─────────────────────────────────────────────

test.describe('WOTD API GET — Positive', () => {
  test('returns today word with expected structure', async ({ request }) => {
    const res = await request.get(API);
    if (res.status() === 404) { test.skip(); return; }
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('word');
    expect(body).toHaveProperty('expiresAt');
    expect(body.word).toHaveProperty('word');
    expect(body.word).toHaveProperty('meaning');
  });

  test('word object includes enriched fields', async ({ request }) => {
    const res = await request.get(API);
    if (res.status() === 404) { test.skip(); return; }
    const body = await res.json();
    const word = body.word;
    // Enriched fields should exist (may be empty strings but present)
    expect(word).toHaveProperty('origin');
    expect(word).toHaveProperty('usage_example');
    expect(word).toHaveProperty('spelling_tip');
    expect(word).toHaveProperty('cultural_note');
  });

  test('returns all words when ?all=true', async ({ request }) => {
    const res = await request.get(`${API}?all=true`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('words');
    expect(Array.isArray(body.words)).toBe(true);
  });

  test('expiresAt is a valid future ISO timestamp', async ({ request }) => {
    const res = await request.get(API);
    if (res.status() === 404) { test.skip(); return; }
    const body = await res.json();
    const expiresAt = new Date(body.expiresAt);
    expect(expiresAt.getTime()).not.toBeNaN();
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  test('response has correct Content-Type header', async ({ request }) => {
    const res = await request.get(API);
    if (res.status() === 404) { test.skip(); return; }
    const contentType = res.headers()['content-type'] || '';
    expect(contentType).toContain('application/json');
  });
});

// ── GET /api/wotd?date= — Positive ───────────────────────────────────────

test.describe('WOTD API GET ?date= — Positive', () => {
  test('returns word for a specific date that has data', async ({ request }) => {
    // First get today's word to know a valid date
    const todayRes = await request.get(API);
    if (todayRes.status() === 404) { test.skip(); return; }
    const todayBody = await todayRes.json();
    const todayDate = todayBody.word.date;

    const res = await request.get(`${API}?date=${todayDate}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('word');
    expect(body.word.date).toBe(todayDate);
  });

  test('response includes isToday field', async ({ request }) => {
    const res = await request.get(API);
    if (res.status() === 404) { test.skip(); return; }
    const body = await res.json();
    expect(body).toHaveProperty('isToday');
    expect(typeof body.isToday).toBe('boolean');
  });

  test('isToday is true when no date param is provided', async ({ request }) => {
    const res = await request.get(API);
    if (res.status() === 404) { test.skip(); return; }
    const body = await res.json();
    expect(body.isToday).toBe(true);
  });

  test('isToday is true when date param equals today', async ({ request }) => {
    const today = new Date().toISOString().split('T')[0];
    const res = await request.get(`${API}?date=${today}`);
    if (res.status() === 404) { test.skip(); return; }
    const body = await res.json();
    expect(body.isToday).toBe(true);
  });

  test('isToday is false when date param is a past date', async ({ request }) => {
    // Use a date from the known seeded range
    const pastDate = '2026-06-20';
    const res = await request.get(`${API}?date=${pastDate}`);
    if (res.status() === 404) { test.skip(); return; }
    const body = await res.json();
    expect(body.isToday).toBe(false);
  });

  test('Cache-Control is short-lived for non-today date queries', async ({ request }) => {
    const pastDate = '2026-06-20';
    const res = await request.get(`${API}?date=${pastDate}`);
    if (res.status() === 404) { test.skip(); return; }
    const cacheControl = res.headers()['cache-control'] || '';
    expect(cacheControl).toContain('max-age=60');
    expect(cacheControl).not.toContain('s-maxage=86400');
  });

  test('Cache-Control is long-lived for today query', async ({ request }) => {
    const res = await request.get(API);
    if (res.status() === 404) { test.skip(); return; }
    const cacheControl = res.headers()['cache-control'] || '';
    expect(cacheControl).toContain('max-age=3600');
    expect(cacheControl).toContain('s-maxage=86400');
  });
});

// ── GET /api/wotd?date= — Negative ──────────────────────────────────────

test.describe('WOTD API GET ?date= — Negative', () => {
  test('returns 404 for a date with no word assigned', async ({ request }) => {
    // Use a far-future date unlikely to have data
    const futureDate = '2099-12-31';
    const res = await request.get(`${API}?date=${futureDate}`);
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error).toContain('No word available for this date');
  });

  test('does not auto-assign word when querying a non-today date', async ({ request }) => {
    // Query a future date — should NOT auto-assign an unassigned word
    const futureDate = '2099-01-01';
    const res = await request.get(`${API}?date=${futureDate}`);
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  test('does not crash with invalid date format', async ({ request }) => {
    const res = await request.get(`${API}?date=not-a-date`);
    // Should either return 404 (no match) or 400 — never 500
    expect(res.status()).not.toBe(500);
  });

  test('does not crash with empty date parameter', async ({ request }) => {
    const res = await request.get(`${API}?date=`);
    // Empty date should fall through to today logic or return gracefully
    expect(res.status()).not.toBe(500);
  });
});

// ── GET /api/wotd — Negative ─────────────────────────────────────────────

test.describe('WOTD API GET — Negative', () => {
  test('returns 404 with error message when no words available', async ({ request }) => {
    // This tests the shape of the 404 response — may not trigger if DB has words
    const res = await request.get(API);
    if (res.status() === 200) { test.skip(); return; }
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  test('all=true does not crash with empty database', async ({ request }) => {
    const res = await request.get(`${API}?all=true`);
    // Should never return 500
    expect(res.status()).not.toBe(500);
    const body = await res.json();
    expect(body).toHaveProperty('words');
  });
});

// ── POST /api/wotd — Positive ────────────────────────────────────────────

test.describe('WOTD API POST — Positive', () => {
  const testWord = `PLAYWRIGHT${Date.now()}`.slice(0, 15).toUpperCase();

  test('accepts word with all enriched fields', async ({ request }) => {
    const res = await request.post(API, {
      data: {
        word: testWord,
        meaning: 'A test word used in automated testing',
        fun_fact: 'Created by Playwright test runner',
        origin: 'Latin: testare, to witness',
        usage_example: 'The developer ran a playwright test.',
        spelling_tip: 'Remember: play + wright (not write)',
        cultural_note: 'Named after the craft of playwriting',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('accepts word with only required fields (word + meaning)', async ({ request }) => {
    const minimalWord = `MINTEST${Date.now()}`.slice(0, 15).toUpperCase();
    const res = await request.post(API, {
      data: {
        word: minimalWord,
        meaning: 'A minimal test word',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('upserts enriched fields on conflict (updates existing word)', async ({ request }) => {
    const upsertWord = `UPSERT${Date.now()}`.slice(0, 15).toUpperCase();

    // First insert
    const res1 = await request.post(API, {
      data: {
        word: upsertWord,
        meaning: 'Original meaning',
        fun_fact: 'Original fact',
        origin: '',
        usage_example: '',
        spelling_tip: '',
        cultural_note: '',
      },
    });
    expect(res1.status()).toBe(200);

    // Upsert with enriched fields
    const res2 = await request.post(API, {
      data: {
        word: upsertWord,
        meaning: 'Updated meaning',
        fun_fact: 'Updated fact',
        origin: 'Updated origin',
        usage_example: 'Updated example sentence.',
        spelling_tip: 'Updated spelling tip',
        cultural_note: 'Updated cultural note',
      },
    });
    expect(res2.status()).toBe(200);
    const body = await res2.json();
    expect(body.success).toBe(true);
  });

  test('enriched fields default to empty string when omitted', async ({ request }) => {
    const omitWord = `OMIT${Date.now()}`.slice(0, 15).toUpperCase();
    const res = await request.post(API, {
      data: {
        word: omitWord,
        meaning: 'Testing field omission',
        // All enriched fields intentionally omitted
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

// ── POST /api/wotd — Negative ────────────────────────────────────────────

test.describe('WOTD API POST — Negative', () => {
  test('returns 400 when word is missing', async ({ request }) => {
    const res = await request.post(API, {
      data: {
        meaning: 'A meaning without a word',
        fun_fact: 'Should fail',
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('word');
  });

  test('returns 400 when body is empty object', async ({ request }) => {
    const res = await request.post(API, {
      data: {},
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('word');
  });

  test('does not crash with null enriched field values', async ({ request }) => {
    const nullWord = `NULL${Date.now()}`.slice(0, 15).toUpperCase();
    const res = await request.post(API, {
      data: {
        word: nullWord,
        meaning: 'Testing null fields',
        fun_fact: null,
        origin: null,
        usage_example: null,
        spelling_tip: null,
        cultural_note: null,
      },
    });
    // Should not return 500 — null should be coerced to empty string
    expect(res.status()).not.toBe(500);
    expect(res.status()).toBe(200);
  });

  test('does not crash with very long enriched field values', async ({ request }) => {
    const longWord = `LONG${Date.now()}`.slice(0, 15).toUpperCase();
    const longString = 'x'.repeat(5000);
    const res = await request.post(API, {
      data: {
        word: longWord,
        meaning: 'Testing long fields',
        origin: longString,
        usage_example: longString,
        spelling_tip: longString,
        cultural_note: longString,
      },
    });
    // Should handle gracefully — either 200 or DB constraint error, not 500 crash
    expect(res.status()).not.toBe(500);
  });

  test('does not crash with special characters in enriched fields', async ({ request }) => {
    const specialWord = `SPEC${Date.now()}`.slice(0, 15).toUpperCase();
    const res = await request.post(API, {
      data: {
        word: specialWord,
        meaning: 'Testing special chars',
        origin: "From O'Brien's <script>alert('xss')</script> & more",
        usage_example: 'He said "hello" — then left.',
        spelling_tip: "Don't forget the apostrophe!",
        cultural_note: '日本語テスト — Unicode support',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
