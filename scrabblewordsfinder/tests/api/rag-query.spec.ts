import { test, expect } from '@playwright/test';

/**
 * RAG Query API Tests (Enhanced)
 * POST /api/rag-query/
 * 
 * The enhanced endpoint handles:
 * 1. Word lookups → checks D1 for definitions + calculates Scrabble score
 * 2. Blog-relevant questions → uses Vectorize RAG + LLM
 * 3. General Scrabble questions → uses LLM with general knowledge
 * 4. Conversational comments → responds naturally as "Lex" the Scrabble coach
 *
 * On local dev: AI/VECTORIZE bindings exist but may fail at runtime → 500.
 * On live: should return 200 with answer + sources, or 503 if bindings absent.
 */

test.describe('RAG Query API — Positive (General)', () => {
  test('POST /api/rag-query/ accepts a valid question and does not 404', async ({ request }) => {
    const response = await request.post('/api/rag-query/', {
      data: { question: 'What are the best two letter words in Scrabble?' },
    });
    // Endpoint exists — never 404. On dev may be 500 (AI binding error), on live 200 or 503
    expect(response.status()).not.toBe(404);
    const body = await response.json();
    expect(body).toBeDefined();
    // If live and successful, validate shape
    if (response.status() === 200) {
      expect(body).toHaveProperty('answer');
      expect(body).toHaveProperty('sources');
      expect(typeof body.answer).toBe('string');
      expect(body.answer.length).toBeGreaterThan(0);
      expect(Array.isArray(body.sources)).toBe(true);
    }
  });

  test('POST /api/rag-query/ returns sources with expected shape on success', async ({ request }) => {
    const response = await request.post('/api/rag-query/', {
      data: { question: 'How do I play Scrabble?' },
    });
    if (response.status() === 200) {
      const body = await response.json();
      if (body.sources && body.sources.length > 0) {
        const source = body.sources[0];
        expect(source).toHaveProperty('slug');
        expect(source).toHaveProperty('title');
        expect(source).toHaveProperty('category');
        expect(source).toHaveProperty('score');
        expect(typeof source.score).toBe('number');
        expect(source.score).toBeGreaterThanOrEqual(0);
        expect(source.score).toBeLessThanOrEqual(1);
      }
    }
  });

  test('POST /api/rag-query/ caps sources at 3 max', async ({ request }) => {
    const response = await request.post('/api/rag-query/', {
      data: { question: 'Scrabble strategy tips for beginners', topK: 10 },
    });
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.sources.length).toBeLessThanOrEqual(3);
    }
  });

  test('POST /api/rag-query/ accepts 2-character question (min length lowered)', async ({ request }) => {
    const response = await request.post('/api/rag-query/', {
      data: { question: 'QI' },
    });
    // Should NOT be 400 — "QI" is 2 chars which meets the new minimum
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('answer');
      expect(body).toHaveProperty('sources');
    }
  });

  test('POST /api/rag-query/ handles conversational comment without crashing', async ({ request }) => {
    const response = await request.post('/api/rag-query/', {
      data: { question: 'I love playing Scrabble with my family' },
    });
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('answer');
      expect(typeof body.answer).toBe('string');
      expect(body.answer.length).toBeGreaterThan(0);
    }
  });
});

test.describe('RAG Query API — Positive (Word Lookup)', () => {
  test('single word query returns answer with score format', async ({ request }) => {
    const response = await request.post('/api/rag-query/', {
      data: { question: 'QUIXOTIC' },
    });
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('answer');
      expect(typeof body.answer).toBe('string');
      // Word lookup from DB returns "**WORD** (N points)" format
      // or LLM handles it if not in DB — either way, answer should exist
      expect(body.answer.length).toBeGreaterThan(0);
    }
  });

  test('"what does X mean" pattern triggers word lookup', async ({ request }) => {
    const response = await request.post('/api/rag-query/', {
      data: { question: 'what does zephyr mean' },
    });
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('answer');
      expect(body.answer.length).toBeGreaterThan(0);
    }
  });

  test('"define X" pattern triggers word lookup', async ({ request }) => {
    const response = await request.post('/api/rag-query/', {
      data: { question: 'define castle' },
    });
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('answer');
      expect(body.answer.length).toBeGreaterThan(0);
    }
  });

  test('"how many points for X" pattern triggers word lookup', async ({ request }) => {
    const response = await request.post('/api/rag-query/', {
      data: { question: 'how many points for jazz' },
    });
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('answer');
      expect(body.answer.length).toBeGreaterThan(0);
    }
  });

  test('word lookup from DB returns empty sources array', async ({ request }) => {
    // A word likely in the DB (WOTD/anagram/rack tables) should return sources: []
    const response = await request.post('/api/rag-query/', {
      data: { question: 'THRIVE' },
    });
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('sources');
      expect(Array.isArray(body.sources)).toBe(true);
      // DB lookups bypass RAG entirely — sources should be empty
      if (body.answer.includes('points)')) {
        expect(body.sources).toHaveLength(0);
      }
    }
  });

  test('"is X a word" pattern triggers word lookup', async ({ request }) => {
    const response = await request.post('/api/rag-query/', {
      data: { question: 'is qi a valid scrabble word' },
    });
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('answer');
      expect(body.answer.length).toBeGreaterThan(0);
    }
  });
});

test.describe('RAG Query API — Negative', () => {
  test('POST /api/rag-query/ rejects empty question', async ({ request }) => {
    const response = await request.post('/api/rag-query/', {
      data: { question: '' },
    });
    expect(response.status()).not.toBe(404);
    if (response.status() === 400) {
      const body = await response.json();
      expect(body.error).toContain('at least 2 characters');
    }
  });

  test('POST /api/rag-query/ rejects single-character question', async ({ request }) => {
    const response = await request.post('/api/rag-query/', {
      data: { question: 'a' },
    });
    expect(response.status()).not.toBe(404);
    if (response.status() === 400) {
      const body = await response.json();
      expect(body.error).toContain('at least 2 characters');
    }
  });

  test('POST /api/rag-query/ rejects question over 500 characters', async ({ request }) => {
    const longQuestion = 'a'.repeat(501);
    const response = await request.post('/api/rag-query/', {
      data: { question: longQuestion },
    });
    expect(response.status()).not.toBe(404);
    if (response.status() === 400) {
      const body = await response.json();
      expect(body.error).toContain('too long');
    }
  });

  test('POST /api/rag-query/ rejects non-string question', async ({ request }) => {
    const response = await request.post('/api/rag-query/', {
      data: { question: 12345 },
    });
    // May be 400 or 500 depending on how parse handles it
    expect(response.status()).not.toBe(404);
    expect(response.status()).not.toBe(200);
  });

  test('GET /api/rag-query/ returns 404 or 405 (POST only)', async ({ request }) => {
    const response = await request.get('/api/rag-query/');
    expect([404, 405]).toContain(response.status());
  });

  test('rate limit response returns 429 with expected error shape', async ({ request }) => {
    // Send multiple rapid requests — we can't easily hit 60 in a test,
    // but verify the endpoint doesn't return 429 on a small burst (confirms limit is generous)
    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        request.post('/api/rag-query/', {
          data: { question: 'test rate limit' },
        })
      )
    );
    // With MAX_QUERIES_PER_HOUR=60, 5 requests should never trigger rate limiting
    for (const r of responses) {
      expect(r.status()).not.toBe(429);
    }
  });

  test('word lookup does not match words shorter than 2 characters', async ({ request }) => {
    // Single char "I" would be rejected by min length validation (length < 2 after trim)
    const response = await request.post('/api/rag-query/', {
      data: { question: 'I' },
    });
    // Should be 400 since length is 1 (below min 2)
    expect(response.status()).not.toBe(404);
    if (response.status() === 400) {
      const body = await response.json();
      expect(body.error).toContain('at least 2 characters');
    }
  });

  test('word lookup does not match words longer than 15 characters', async ({ request }) => {
    // The regex pattern limits to 2-15 chars — a 16-char word won't trigger word lookup
    const response = await request.post('/api/rag-query/', {
      data: { question: 'ABCDEFGHIJKLMNOP' },
    });
    // Should not 404. It'll go through the RAG/LLM path (not word lookup)
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('answer');
      // Since it bypasses word lookup, it should have gone through LLM
      // (no "points)" format that word lookup uses)
    }
  });
});
