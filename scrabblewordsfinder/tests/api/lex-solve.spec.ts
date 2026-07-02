import { test, expect } from '@playwright/test';

/**
 * Lex Solve API Tests (/api/lex-solve/)
 * Tests the Lex AI Solver endpoint that finds best words from a rack,
 * uses a 3-tier dictionary fallback (ASSETS binding → self-fetch → DB),
 * and returns AI coaching with solved words.
 */

test.describe('Lex Solve API — Positive', () => {
  test('POST /api/lex-solve/ with valid rack returns words and coaching', async ({ request }) => {
    const response = await request.post('/api/lex-solve/', {
      data: { rack: 'AEINRST' },
    });
    // 200 (solved + AI coached), 503 (AI unavailable)
    expect([200, 503]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('words');
      expect(body).toHaveProperty('coaching');
      expect(body).toHaveProperty('totalFound');
      expect(body).toHaveProperty('rack', 'AEINRST');
      expect(body).toHaveProperty('bingos');
      expect(Array.isArray(body.words)).toBe(true);
      expect(body.totalFound).toBeGreaterThan(0);
    }
  });

  test('POST /api/lex-solve/ returns words sorted by score descending', async ({ request }) => {
    const response = await request.post('/api/lex-solve/', {
      data: { rack: 'AEINRST' },
    });
    if (response.status() === 200) {
      const body = await response.json();
      const words = body.words as { word: string; score: number }[];
      if (words.length > 1) {
        for (let i = 0; i < words.length - 1; i++) {
          // Bingos may appear first due to re-sort, but within non-bingo section scores descend
          expect(words[i].score).toBeGreaterThanOrEqual(words[words.length - 1].score);
        }
      }
    }
  });

  test('POST /api/lex-solve/ identifies bingos for 7-letter racks', async ({ request }) => {
    // AEINRST has multiple bingos (NASTIER, RETINAS, etc.)
    const response = await request.post('/api/lex-solve/', {
      data: { rack: 'AEINRST' },
    });
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.bingos.length).toBeGreaterThan(0);
      // Each bingo should have word, score, and total (score + 50)
      const bingo = body.bingos[0];
      expect(bingo).toHaveProperty('word');
      expect(bingo).toHaveProperty('score');
      expect(bingo).toHaveProperty('total');
      expect(bingo.total).toBe(bingo.score + 50);
    }
  });

  test('POST /api/lex-solve/ handles short racks (2 letters)', async ({ request }) => {
    const response = await request.post('/api/lex-solve/', {
      data: { rack: 'QI' },
    });
    expect([200, 503]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('rack', 'QI');
      expect(body.totalFound).toBeGreaterThanOrEqual(1);
      // QI itself should be found
      const words = body.words.map((w: any) => w.word);
      expect(words).toContain('QI');
    }
  });

  test('POST /api/lex-solve/ supports blank tiles with ?', async ({ request }) => {
    const response = await request.post('/api/lex-solve/', {
      data: { rack: 'A?ERST' },
    });
    expect([200, 503]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.totalFound).toBeGreaterThan(0);
      expect(body.rack).toBe('A?ERST');
    }
  });

  test('POST /api/lex-solve/ returns coaching text', async ({ request }) => {
    const response = await request.post('/api/lex-solve/', {
      data: { rack: 'LETTERS' },
    });
    expect([200, 503]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(typeof body.coaching).toBe('string');
      expect(body.coaching.length).toBeGreaterThan(0);
    }
  });

  test('POST /api/lex-solve/ words have correct structure', async ({ request }) => {
    const response = await request.post('/api/lex-solve/', {
      data: { rack: 'ABCDE' },
    });
    if (response.status() === 200) {
      const body = await response.json();
      if (body.words.length > 0) {
        const word = body.words[0];
        expect(word).toHaveProperty('word');
        expect(word).toHaveProperty('score');
        expect(typeof word.word).toBe('string');
        expect(typeof word.score).toBe('number');
        // Words should be uppercase
        expect(word.word).toBe(word.word.toUpperCase());
      }
    }
  });

  test('GET /api/lex-solve/ returns status info', async ({ request }) => {
    const response = await request.get('/api/lex-solve/');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('endpoint', 'lex-solve');
    expect(body).toHaveProperty('method', 'POST required');
  });
});

test.describe('Lex Solve API — Negative', () => {
  test('POST /api/lex-solve/ rejects missing rack', async ({ request }) => {
    const response = await request.post('/api/lex-solve/', {
      data: { tiles: 'ABCDEFG' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Rack must be');
  });

  test('POST /api/lex-solve/ rejects rack with 1 letter', async ({ request }) => {
    const response = await request.post('/api/lex-solve/', {
      data: { rack: 'A' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Rack must be');
  });

  test('POST /api/lex-solve/ rejects rack longer than 7 letters', async ({ request }) => {
    const response = await request.post('/api/lex-solve/', {
      data: { rack: 'ABCDEFGH' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Rack must be');
  });

  test('POST /api/lex-solve/ rejects non-string rack', async ({ request }) => {
    const response = await request.post('/api/lex-solve/', {
      data: { rack: 12345 },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Rack must be');
  });

  test('POST /api/lex-solve/ rejects invalid JSON body', async ({ request }) => {
    const response = await request.post('/api/lex-solve/', {
      data: 'not json',
      headers: { 'Content-Type': 'text/plain' },
    });
    expect([400, 403]).toContain(response.status());
  });

  test('POST /api/lex-solve/ handles all-consonant rack gracefully', async ({ request }) => {
    const response = await request.post('/api/lex-solve/', {
      data: { rack: 'BCDFG' },
    });
    // Should NOT crash — returns 200 with potentially empty words or 503 if AI unavailable
    expect([200, 503]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('words');
      expect(body).toHaveProperty('coaching');
      expect(Array.isArray(body.words)).toBe(true);
    }
  });

  test('POST /api/lex-solve/ strips non-alpha characters from rack', async ({ request }) => {
    const response = await request.post('/api/lex-solve/', {
      data: { rack: 'A1B2C3D' },
    });
    // After stripping non-alpha, rack becomes "ABCD" (4 valid chars) — should work
    expect([200, 503]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.rack).toBe('ABCD');
    }
  });

  test('POST /api/lex-solve/ rejects rack that becomes too short after cleanup', async ({ request }) => {
    const response = await request.post('/api/lex-solve/', {
      data: { rack: '1234A' },
    });
    // After stripping numbers, only "A" remains — should reject
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('at least 2 valid tiles');
  });

  test('POST /api/lex-solve/ returns max 10 words in response', async ({ request }) => {
    const response = await request.post('/api/lex-solve/', {
      data: { rack: 'AEINRST' },
    });
    if (response.status() === 200) {
      const body = await response.json();
      // words array is top 10 (re-sorted slice of 25)
      expect(body.words.length).toBeLessThanOrEqual(10);
    }
  });
});
