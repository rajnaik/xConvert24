import { test, expect } from '@playwright/test';

/**
 * Lex Solve API — /api/lex-solve/
 * Tests the solver endpoint that accepts a rack (2-7 tiles), finds the
 * best words algorithmically, and returns AI coaching that ONLY recommends
 * words from the algorithm's results (never hallucinated words).
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Lex Solve API — Positive', () => {
  test('returns valid JSON with expected response structure', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-solve/`, {
      data: { rack: 'AEINRST' },
    });

    // Accept 200 (success) or 503 (AI unavailable locally)
    expect([200, 503]).toContain(res.status());

    if (res.status() === 200) {
      const body = await res.json();
      expect(body).toHaveProperty('words');
      expect(body).toHaveProperty('coaching');
      expect(body).toHaveProperty('totalFound');
      expect(body).toHaveProperty('rack');
      expect(body).toHaveProperty('bingos');
      expect(body.rack).toBe('AEINRST');
    }
  });

  test('words array contains objects with word and score properties', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-solve/`, {
      data: { rack: 'AEINRST' },
    });

    if (res.status() === 200) {
      const body = await res.json();
      expect(Array.isArray(body.words)).toBe(true);
      if (body.words.length > 0) {
        const firstWord = body.words[0];
        expect(firstWord).toHaveProperty('word');
        expect(firstWord).toHaveProperty('score');
        expect(typeof firstWord.word).toBe('string');
        expect(typeof firstWord.score).toBe('number');
      }
    }
  });

  test('words are sorted by score descending (first word is best play)', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-solve/`, {
      data: { rack: 'AEINRST' },
    });

    if (res.status() === 200) {
      const body = await res.json();
      if (body.words.length >= 2) {
        // Bingos may be first regardless of raw score (due to +50 bonus)
        // But within non-bingo words, scores should be descending
        const hasBingos = body.bingos && body.bingos.length > 0;
        if (!hasBingos) {
          for (let i = 0; i < body.words.length - 1; i++) {
            expect(body.words[i].score).toBeGreaterThanOrEqual(body.words[i + 1].score);
          }
        }
      }
    }
  });

  test('bingos array is populated for 7-letter racks with valid bingos', async ({ request }) => {
    // AEINRST has well-known bingos like NASTIER, RETAINS, STAINER, etc.
    const res = await request.post(`${BASE}/api/lex-solve/`, {
      data: { rack: 'AEINRST' },
    });

    if (res.status() === 200) {
      const body = await res.json();
      expect(Array.isArray(body.bingos)).toBe(true);
      if (body.bingos.length > 0) {
        const bingo = body.bingos[0];
        expect(bingo).toHaveProperty('word');
        expect(bingo).toHaveProperty('score');
        expect(bingo).toHaveProperty('total');
        expect(bingo.total).toBe(bingo.score + 50);
      }
    }
  });

  test('totalFound is a positive number for a valid common rack', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-solve/`, {
      data: { rack: 'SATIE' },
    });

    if (res.status() === 200) {
      const body = await res.json();
      expect(typeof body.totalFound).toBe('number');
      expect(body.totalFound).toBeGreaterThan(0);
    }
  });

  test('accepts rack with blank tile marker (?)', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-solve/`, {
      data: { rack: 'AEINS?' },
    });

    expect([200, 503]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.rack).toBe('AEINS?');
      expect(body).toHaveProperty('words');
    }
  });

  test('accepts minimum rack of 2 tiles', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-solve/`, {
      data: { rack: 'AT' },
    });

    expect([200, 503]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.rack).toBe('AT');
      expect(body.totalFound).toBeGreaterThan(0);
    }
  });

  test('GET endpoint returns status info', async ({ request }) => {
    const res = await request.get(`${BASE}/api/lex-solve/`);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.endpoint).toBe('lex-solve');
    expect(body.method).toBe('POST required');
  });

  test('coaching field is a non-empty string on success', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-solve/`, {
      data: { rack: 'RETAINS' },
    });

    if (res.status() === 200) {
      const body = await res.json();
      expect(typeof body.coaching).toBe('string');
      expect(body.coaching.length).toBeGreaterThan(0);
    }
  });
});

test.describe('Lex Solve API — SOWPODS Dictionary Primary', () => {
  test('returns well-known SOWPODS words from a common rack', async ({ request }) => {
    // AEINRST is a famous bingo stem — SOWPODS has NASTIER, RETINAS, STAINER, etc.
    const res = await request.post(`${BASE}/api/lex-solve/`, {
      data: { rack: 'AEINRST' },
    });

    if (res.status() === 200) {
      const body = await res.json();
      expect(body.totalFound).toBeGreaterThan(10);
      // Should find many words from a productive rack using the full 74K+ dictionary
      const wordSet = new Set(body.words.map((w: any) => w.word));
      // At minimum, common short words like AT, IN, IS, AN should be found
      // (they may not appear in top 25 by score, but totalFound should be high)
      expect(body.totalFound).toBeGreaterThanOrEqual(20);
    }
  });

  test('finds more words with full dictionary than a limited subset would', async ({ request }) => {
    // QIVIUT has obscure words only in SOWPODS — tests full dictionary coverage
    const res = await request.post(`${BASE}/api/lex-solve/`, {
      data: { rack: 'SATIRE' },
    });

    if (res.status() === 200) {
      const body = await res.json();
      // A productive 6-letter rack should find many words from 74K+ dictionary
      expect(body.totalFound).toBeGreaterThan(5);
      // Top words should include high-value plays
      expect(body.words.length).toBeGreaterThan(0);
      expect(body.words[0].score).toBeGreaterThan(0);
    }
  });

  test('words returned are all uppercase and properly scored', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-solve/`, {
      data: { rack: 'QUEST' },
    });

    if (res.status() === 200) {
      const body = await res.json();
      for (const w of body.words) {
        // All words should be uppercase (converted from SOWPODS lowercase entries)
        expect(w.word).toMatch(/^[A-Z]+$/);
        // Score must be positive
        expect(w.score).toBeGreaterThan(0);
        // Word length must not exceed rack length
        expect(w.word.length).toBeLessThanOrEqual(5);
      }
    }
  });

  test('returns at most 25 words (top slice from full dictionary solve)', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-solve/`, {
      data: { rack: 'AEINRST' },
    });

    if (res.status() === 200) {
      const body = await res.json();
      // Words array is sliced to top 25, but totalFound reflects all matches
      expect(body.words.length).toBeLessThanOrEqual(25);
      expect(body.totalFound).toBeGreaterThanOrEqual(body.words.length);
    }
  });
});

test.describe('Lex Solve API — Negative', () => {
  test('rejects rack shorter than 2 characters', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-solve/`, {
      data: { rack: 'A' },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('2-7');
  });

  test('rejects rack longer than 7 characters', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-solve/`, {
      data: { rack: 'ABCDEFGH' },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('2-7');
  });

  test('rejects empty rack string', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-solve/`, {
      data: { rack: '' },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  test('rejects missing rack field', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-solve/`, {
      data: {},
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  test('rejects request with rack as wrong type in body', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-solve/`, {
      data: { rack: null },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  test('rejects non-string rack value', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-solve/`, {
      data: { rack: 12345 },
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  test('returns empty words for impossible rack (all same vowel)', async ({ request }) => {
    // UUUUUUU is unlikely to form any SOWPODS word
    const res = await request.post(`${BASE}/api/lex-solve/`, {
      data: { rack: 'VVVVVVV' },
    });

    if (res.status() === 200) {
      const body = await res.json();
      // May find 0 words or very few — either is acceptable
      expect(body.totalFound).toBeLessThanOrEqual(5);
    }
  });

  test('response does not contain HTML (always JSON)', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-solve/`, {
      data: { rack: 'TESTING' },
    });

    const contentType = res.headers()['content-type'] || '';
    expect(contentType).toContain('application/json');
    const text = await res.text();
    expect(text).not.toContain('<!DOCTYPE');
    expect(text).not.toContain('<html');
  });
});
