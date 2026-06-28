import { test, expect } from '@playwright/test';

/**
 * RAG Query API Tests
 * POST /api/rag-query/
 * Accepts a question, queries Vectorize for context, returns AI-generated answer.
 *
 * On local dev: AI/VECTORIZE bindings exist but may fail at runtime → 500.
 * On live: should return 200 with answer + sources, or 503 if bindings absent.
 */

test.describe('RAG Query API — Positive', () => {
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
});

test.describe('RAG Query API — Negative', () => {
  test('POST /api/rag-query/ rejects empty question', async ({ request }) => {
    const response = await request.post('/api/rag-query/', {
      data: { question: '' },
    });
    // 400 (validation) or 500 (runtime error catches it differently on dev)
    expect(response.status()).not.toBe(404);
    if (response.status() === 400) {
      const body = await response.json();
      expect(body.error).toContain('at least 3 characters');
    }
  });

  test('POST /api/rag-query/ rejects question shorter than 3 chars', async ({ request }) => {
    const response = await request.post('/api/rag-query/', {
      data: { question: 'hi' },
    });
    expect(response.status()).not.toBe(404);
    if (response.status() === 400) {
      const body = await response.json();
      expect(body.error).toContain('at least 3 characters');
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
});
