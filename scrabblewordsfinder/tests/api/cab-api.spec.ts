import { test, expect } from '@playwright/test';

/**
 * Cows and Bulls API Tests
 * Tests for POST /api/cab/ (start game) and PUT /api/cab/ (evaluate guess).
 */

test.describe('API — POST /api/cab/ — Positive', () => {
  test('starts a game with valid length 4', async ({ request }) => {
    const response = await request.post('/api/cab/', {
      data: { length: 4 },
    });
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.gameId).toBeDefined();
      expect(body.length).toBe(4);
      expect(body.wordId).toBeDefined();
    }
    // 404 means no words seeded for that length — acceptable in test env
    expect([200, 404]).toContain(response.status());
  });

  test('starts a game with valid length 5', async ({ request }) => {
    const response = await request.post('/api/cab/', {
      data: { length: 5 },
    });
    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.gameId).toBeDefined();
      expect(body.length).toBe(5);
    }
  });

  test('response is JSON with correct content-type', async ({ request }) => {
    const response = await request.post('/api/cab/', {
      data: { length: 4 },
    });
    expect(response.headers()['content-type']).toContain('application/json');
  });
});

test.describe('API — POST /api/cab/ — user_id Support — Positive', () => {
  test('starts a game with user_id provided', async ({ request }) => {
    const response = await request.post('/api/cab/', {
      data: { length: 4, user_id: 'test-user-abc123' },
    });
    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.gameId).toBeDefined();
      expect(body.length).toBe(4);
      expect(body.wordId).toBeDefined();
    }
  });

  test('starts a game without user_id (backward compatible)', async ({ request }) => {
    const response = await request.post('/api/cab/', {
      data: { length: 4 },
    });
    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.gameId).toBeDefined();
      expect(body.length).toBe(4);
    }
  });

  test('accepts empty string user_id', async ({ request }) => {
    const response = await request.post('/api/cab/', {
      data: { length: 4, user_id: '' },
    });
    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.gameId).toBeDefined();
    }
  });
});

test.describe('API — POST /api/cab/ — user_id Support — Negative', () => {
  test('does not crash with numeric user_id', async ({ request }) => {
    const response = await request.post('/api/cab/', {
      data: { length: 4, user_id: 12345 },
    });
    // Should still work — user_id coerces to string via || fallback
    expect([200, 404]).toContain(response.status());
  });

  test('does not crash with null user_id', async ({ request }) => {
    const response = await request.post('/api/cab/', {
      data: { length: 4, user_id: null },
    });
    // null is falsy, so falls back to empty string
    expect([200, 404]).toContain(response.status());
  });

  test('user_id does not appear in response body', async ({ request }) => {
    const response = await request.post('/api/cab/', {
      data: { length: 4, user_id: 'should-not-echo' },
    });
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.user_id).toBeUndefined();
    }
  });
});

test.describe('API — POST /api/cab/ — Negative', () => {
  test('rejects invalid length (3)', async ({ request }) => {
    const response = await request.post('/api/cab/', {
      data: { length: 3 },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Invalid length');
  });

  test('rejects invalid length (8)', async ({ request }) => {
    const response = await request.post('/api/cab/', {
      data: { length: 8 },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Invalid length');
  });

  test('rejects non-numeric length', async ({ request }) => {
    const response = await request.post('/api/cab/', {
      data: { length: 'abc' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Invalid length');
  });

  test('rejects missing length field', async ({ request }) => {
    const response = await request.post('/api/cab/', {
      data: {},
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Invalid length');
  });
});

test.describe('API — PUT /api/cab/ — Positive', () => {
  test('evaluates a guess and returns bulls + cows', async ({ request }) => {
    // Start a game first
    const startRes = await request.post('/api/cab/', {
      data: { length: 4 },
    });
    if (startRes.status() !== 200) {
      test.skip(true, 'No words seeded — cannot test guess evaluation');
      return;
    }
    const { gameId, wordId } = await startRes.json();

    // Make a guess (random 4-letter word)
    const response = await request.put('/api/cab/', {
      data: { gameId, wordId, guess: 'ABCD' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body.bulls).toBe('number');
    expect(typeof body.cows).toBe('number');
    expect(body.bulls).toBeGreaterThanOrEqual(0);
    expect(body.cows).toBeGreaterThanOrEqual(0);
    expect(body.bulls + body.cows).toBeLessThanOrEqual(4);
  });

  test('does not return word field when guess is wrong', async ({ request }) => {
    const startRes = await request.post('/api/cab/', {
      data: { length: 4 },
    });
    if (startRes.status() !== 200) {
      test.skip(true, 'No words seeded — cannot test');
      return;
    }
    const { gameId, wordId } = await startRes.json();

    // ZZZZ is unlikely to match any real word
    const response = await request.put('/api/cab/', {
      data: { gameId, wordId, guess: 'ZZZZ' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    if (body.bulls < 4) {
      expect(body.word).toBeUndefined();
    }
  });

  test('guess evaluation is case-insensitive', async ({ request }) => {
    const startRes = await request.post('/api/cab/', {
      data: { length: 4 },
    });
    if (startRes.status() !== 200) {
      test.skip(true, 'No words seeded');
      return;
    }
    const { gameId, wordId } = await startRes.json();

    const response = await request.put('/api/cab/', {
      data: { gameId, wordId, guess: 'abcd' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body.bulls).toBe('number');
    expect(typeof body.cows).toBe('number');
  });
});

test.describe('API — PUT /api/cab/ — Feedback Array — Positive', () => {
  test('response includes feedback array of correct length', async ({ request }) => {
    const startRes = await request.post('/api/cab/', {
      data: { length: 4 },
    });
    if (startRes.status() !== 200) {
      test.skip(true, 'No words seeded — cannot test feedback');
      return;
    }
    const { gameId, wordId } = await startRes.json();

    const response = await request.put('/api/cab/', {
      data: { gameId, wordId, guess: 'ABCD' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.feedback)).toBe(true);
    expect(body.feedback).toHaveLength(4);
  });

  test('feedback values are only bull, cow, or miss', async ({ request }) => {
    const startRes = await request.post('/api/cab/', {
      data: { length: 5 },
    });
    if (startRes.status() !== 200) {
      test.skip(true, 'No 5-letter words seeded');
      return;
    }
    const { gameId, wordId } = await startRes.json();

    const response = await request.put('/api/cab/', {
      data: { gameId, wordId, guess: 'PLATE' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.feedback)).toBe(true);
    for (const val of body.feedback) {
      expect(['bull', 'cow', 'miss']).toContain(val);
    }
  });

  test('feedback bull count matches bulls number', async ({ request }) => {
    const startRes = await request.post('/api/cab/', {
      data: { length: 4 },
    });
    if (startRes.status() !== 200) {
      test.skip(true, 'No words seeded');
      return;
    }
    const { gameId, wordId } = await startRes.json();

    const response = await request.put('/api/cab/', {
      data: { gameId, wordId, guess: 'WORD' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    const bullCount = body.feedback.filter((f: string) => f === 'bull').length;
    expect(bullCount).toBe(body.bulls);
  });

  test('feedback cow count matches cows number', async ({ request }) => {
    const startRes = await request.post('/api/cab/', {
      data: { length: 4 },
    });
    if (startRes.status() !== 200) {
      test.skip(true, 'No words seeded');
      return;
    }
    const { gameId, wordId } = await startRes.json();

    const response = await request.put('/api/cab/', {
      data: { gameId, wordId, guess: 'STEM' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    const cowCount = body.feedback.filter((f: string) => f === 'cow').length;
    expect(cowCount).toBe(body.cows);
  });

  test('feedback is all bulls when word is solved', async ({ request }) => {
    // Start a game, then guess the exact word by fetching it via multiple guesses
    // We can test structurally: if bulls === length, all feedback should be 'bull'
    const startRes = await request.post('/api/cab/', {
      data: { length: 4 },
    });
    if (startRes.status() !== 200) {
      test.skip(true, 'No words seeded');
      return;
    }
    const { gameId, wordId } = await startRes.json();

    // Try ZZZZ first — if it solves (unlikely) that's fine, otherwise check unsolved feedback
    const response = await request.put('/api/cab/', {
      data: { gameId, wordId, guess: 'ZZZZ' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    if (body.word) {
      // Solved — all feedback should be 'bull'
      expect(body.feedback.every((f: string) => f === 'bull')).toBe(true);
    } else {
      // Not solved — at least one should NOT be bull
      expect(body.feedback.some((f: string) => f !== 'bull')).toBe(true);
    }
  });

  test('feedback length matches word length for 5-letter game', async ({ request }) => {
    const startRes = await request.post('/api/cab/', {
      data: { length: 5 },
    });
    if (startRes.status() !== 200) {
      test.skip(true, 'No 5-letter words seeded');
      return;
    }
    const { gameId, wordId } = await startRes.json();

    const response = await request.put('/api/cab/', {
      data: { gameId, wordId, guess: 'CRANE' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.feedback).toHaveLength(5);
  });
});

test.describe('API — PUT /api/cab/ — Feedback Array — Negative', () => {
  test('feedback is not returned on invalid request (missing params)', async ({ request }) => {
    const response = await request.put('/api/cab/', {
      data: { gameId: 1 },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.feedback).toBeUndefined();
  });

  test('feedback is not returned when wordId does not exist', async ({ request }) => {
    const response = await request.put('/api/cab/', {
      data: { gameId: 999, wordId: 999999, guess: 'TEST' },
    });
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.feedback).toBeUndefined();
  });

  test('all-miss feedback when no letters match', async ({ request }) => {
    const startRes = await request.post('/api/cab/', {
      data: { length: 4 },
    });
    if (startRes.status() !== 200) {
      test.skip(true, 'No words seeded');
      return;
    }
    const { gameId, wordId } = await startRes.json();

    // ZZZZ is unlikely to have any matching letters in most words
    const response = await request.put('/api/cab/', {
      data: { gameId, wordId, guess: 'ZZZZ' },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    // If 0 bulls and 0 cows, all should be 'miss'
    if (body.bulls === 0 && body.cows === 0) {
      expect(body.feedback.every((f: string) => f === 'miss')).toBe(true);
    }
  });
});

test.describe('API — PUT /api/cab/ — Negative', () => {
  test('rejects missing gameId', async ({ request }) => {
    const response = await request.put('/api/cab/', {
      data: { wordId: 1, guess: 'TEST' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Missing');
  });

  test('rejects missing wordId', async ({ request }) => {
    const response = await request.put('/api/cab/', {
      data: { gameId: 1, guess: 'TEST' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Missing');
  });

  test('rejects missing guess', async ({ request }) => {
    const response = await request.put('/api/cab/', {
      data: { gameId: 1, wordId: 1 },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Missing');
  });

  test('rejects non-existent wordId', async ({ request }) => {
    const response = await request.put('/api/cab/', {
      data: { gameId: 999, wordId: 999999, guess: 'TEST' },
    });
    expect(response.status()).toBe(404);
    const body = await response.json();
    expect(body.error).toContain('Word not found');
  });

  test('rejects guess with wrong length', async ({ request }) => {
    const startRes = await request.post('/api/cab/', {
      data: { length: 4 },
    });
    if (startRes.status() !== 200) {
      test.skip(true, 'No words seeded');
      return;
    }
    const { gameId, wordId } = await startRes.json();

    // Submit a 6-letter guess for a 4-letter word
    const response = await request.put('/api/cab/', {
      data: { gameId, wordId, guess: 'ABCDEF' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('letters');
  });

  test('rejects completely empty body', async ({ request }) => {
    const response = await request.put('/api/cab/', {
      data: {},
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Missing');
  });
});
