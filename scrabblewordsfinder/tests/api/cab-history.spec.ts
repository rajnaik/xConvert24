import { test, expect } from '@playwright/test';

/**
 * Cows and Bulls API — GET /api/cab/ (History & Round Inspect)
 * Tests for:
 *   ?user_id=xxx — returns all rounds for that user (history)
 *   ?round=gameId — returns all guesses for a specific round (inspect)
 *   No params — returns 400
 */

test.describe('API — GET /api/cab?round= — Round Inspect — Positive', () => {
  test('returns game info and guesses for a valid round', async ({ request }) => {
    // Start a game and make a guess so there's data to inspect
    const startRes = await request.post('/api/cab/', {
      data: { length: 4, user_id: 'test-history-user' },
    });
    if (startRes.status() !== 200) {
      test.skip(true, 'No words seeded — cannot test round inspect');
      return;
    }
    const { gameId, wordId } = await startRes.json();

    // Make a guess to populate CaB_Guesses
    await request.put('/api/cab/', {
      data: { gameId, wordId, guess: 'ABCD', guessNumber: 1 },
    });

    // Inspect the round
    const response = await request.get(`/api/cab/?round=${gameId}`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.game).not.toBeNull();
    expect(body.game.id).toBe(gameId);
    expect(Array.isArray(body.guesses)).toBe(true);
    expect(body.guesses.length).toBeGreaterThanOrEqual(1);
  });

  test('round inspect returns guess details with correct fields', async ({ request }) => {
    const startRes = await request.post('/api/cab/', {
      data: { length: 4, user_id: 'test-fields-user' },
    });
    if (startRes.status() !== 200) {
      test.skip(true, 'No words seeded');
      return;
    }
    const { gameId, wordId } = await startRes.json();

    await request.put('/api/cab/', {
      data: { gameId, wordId, guess: 'TEST', guessNumber: 1 },
    });

    const response = await request.get(`/api/cab/?round=${gameId}`);
    expect(response.status()).toBe(200);
    const body = await response.json();

    const firstGuess = body.guesses[0];
    expect(firstGuess.guess_number).toBe(1);
    expect(firstGuess.guess).toBeDefined();
    expect(typeof firstGuess.bulls).toBe('number');
    expect(typeof firstGuess.cows).toBe('number');
    expect(firstGuess.feedback).toBeDefined();
  });

  test('round inspect returns game metadata (word, length, solved)', async ({ request }) => {
    const startRes = await request.post('/api/cab/', {
      data: { length: 5, user_id: 'test-meta-user' },
    });
    if (startRes.status() !== 200) {
      test.skip(true, 'No 5-letter words seeded');
      return;
    }
    const { gameId, wordId } = await startRes.json();

    await request.put('/api/cab/', {
      data: { gameId, wordId, guess: 'CRANE', guessNumber: 1 },
    });

    const response = await request.get(`/api/cab/?round=${gameId}`);
    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.game.word).toBeDefined();
    expect(body.game.length).toBe(5);
    expect(typeof body.game.solved).toBe('number');
    expect(body.game.startDatetime).toBeDefined();
  });

  test('round inspect shows multiple guesses in order', async ({ request }) => {
    const startRes = await request.post('/api/cab/', {
      data: { length: 4, user_id: 'test-multi-guess' },
    });
    if (startRes.status() !== 200) {
      test.skip(true, 'No words seeded');
      return;
    }
    const { gameId, wordId } = await startRes.json();

    // Make 3 guesses
    await request.put('/api/cab/', { data: { gameId, wordId, guess: 'ABCD', guessNumber: 1 } });
    await request.put('/api/cab/', { data: { gameId, wordId, guess: 'EFGH', guessNumber: 2 } });
    await request.put('/api/cab/', { data: { gameId, wordId, guess: 'IJKL', guessNumber: 3 } });

    const response = await request.get(`/api/cab/?round=${gameId}`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.guesses.length).toBeGreaterThanOrEqual(3);
    // Should be in ascending order
    expect(body.guesses[0].guess_number).toBeLessThanOrEqual(body.guesses[1].guess_number);
  });

  test('response is JSON with correct content-type', async ({ request }) => {
    const response = await request.get('/api/cab/?round=1');
    expect(response.headers()['content-type']).toContain('application/json');
  });
});

test.describe('API — GET /api/cab?round= — Round Inspect — Negative', () => {
  test('returns empty guesses for non-existent round', async ({ request }) => {
    const response = await request.get('/api/cab/?round=999999');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.game).toBeNull();
    expect(body.guesses).toHaveLength(0);
  });

  test('handles non-numeric round parameter gracefully', async ({ request }) => {
    const response = await request.get('/api/cab/?round=abc');
    // NaN bind should not crash — returns empty or error
    expect([200, 400, 500]).toContain(response.status());
    const body = await response.json();
    if (response.status() === 200) {
      expect(body.guesses).toHaveLength(0);
    }
  });

  test('handles negative round id gracefully', async ({ request }) => {
    const response = await request.get('/api/cab/?round=-1');
    expect([200, 400]).toContain(response.status());
    const body = await response.json();
    if (response.status() === 200) {
      expect(body.game).toBeNull();
      expect(body.guesses).toHaveLength(0);
    }
  });
});

test.describe('API — GET /api/cab?user_id= — User History — Positive', () => {
  test('returns rounds array for a user with game history', async ({ request }) => {
    const userId = `test-hist-${Date.now()}`;

    // Start a game for this user
    const startRes = await request.post('/api/cab/', {
      data: { length: 4, user_id: userId },
    });
    if (startRes.status() !== 200) {
      test.skip(true, 'No words seeded — cannot test user history');
      return;
    }

    const response = await request.get(`/api/cab/?user_id=${userId}`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.rounds)).toBe(true);
    expect(body.rounds.length).toBeGreaterThanOrEqual(1);
    expect(body.count).toBeGreaterThanOrEqual(1);
  });

  test('history rounds contain expected fields', async ({ request }) => {
    const userId = `test-fields-${Date.now()}`;

    const startRes = await request.post('/api/cab/', {
      data: { length: 4, user_id: userId },
    });
    if (startRes.status() !== 200) {
      test.skip(true, 'No words seeded');
      return;
    }

    const response = await request.get(`/api/cab/?user_id=${userId}`);
    expect(response.status()).toBe(200);
    const body = await response.json();

    const round = body.rounds[0];
    expect(round.id).toBeDefined();
    expect(typeof round.solved).toBe('number');
    expect(round.word).toBeDefined();
    expect(round.length).toBeDefined();
    expect(round.startDatetime).toBeDefined();
  });

  test('history count matches rounds array length', async ({ request }) => {
    const userId = `test-count-${Date.now()}`;

    // Start 2 games
    const startRes1 = await request.post('/api/cab/', { data: { length: 4, user_id: userId } });
    const startRes2 = await request.post('/api/cab/', { data: { length: 4, user_id: userId } });

    if (startRes1.status() !== 200 || startRes2.status() !== 200) {
      test.skip(true, 'No words seeded');
      return;
    }

    const response = await request.get(`/api/cab/?user_id=${userId}`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.count).toBe(body.rounds.length);
    expect(body.count).toBeGreaterThanOrEqual(2);
  });

  test('history is ordered by most recent first', async ({ request }) => {
    const userId = `test-order-${Date.now()}`;

    const startRes1 = await request.post('/api/cab/', { data: { length: 4, user_id: userId } });
    // Small delay implicit between requests
    const startRes2 = await request.post('/api/cab/', { data: { length: 4, user_id: userId } });

    if (startRes1.status() !== 200 || startRes2.status() !== 200) {
      test.skip(true, 'No words seeded');
      return;
    }

    const response = await request.get(`/api/cab/?user_id=${userId}`);
    expect(response.status()).toBe(200);
    const body = await response.json();

    if (body.rounds.length >= 2) {
      // First round in array should have a later (or equal) startDatetime than second
      const first = new Date(body.rounds[0].startDatetime).getTime();
      const second = new Date(body.rounds[1].startDatetime).getTime();
      expect(first).toBeGreaterThanOrEqual(second);
    }
  });

  test('history is limited to 50 results', async ({ request }) => {
    // We just verify the endpoint doesn't return more than 50
    const response = await request.get('/api/cab/?user_id=any-user');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.rounds.length).toBeLessThanOrEqual(50);
  });
});

test.describe('API — GET /api/cab?user_id= — User History — Negative', () => {
  test('returns empty array for user with no games', async ({ request }) => {
    const response = await request.get('/api/cab/?user_id=nonexistent-user-xyz-99999');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.rounds).toHaveLength(0);
    expect(body.count).toBe(0);
  });

  test('handles empty user_id string gracefully', async ({ request }) => {
    const response = await request.get('/api/cab/?user_id=');
    // Empty string is still truthy as a query param — should return empty results
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.rounds)).toBe(true);
  });

  test('handles special characters in user_id', async ({ request }) => {
    const response = await request.get('/api/cab/?user_id=te%26st%3Cuser%3E');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.rounds)).toBe(true);
    expect(body.count).toBe(0);
  });
});

test.describe('API — GET /api/cab — No Params — Negative', () => {
  test('returns 400 when no query parameters provided', async ({ request }) => {
    const response = await request.get('/api/cab/');
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('user_id or round');
  });

  test('returns 400 with unrecognized parameters only', async ({ request }) => {
    const response = await request.get('/api/cab/?foo=bar');
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('response is JSON even on 400', async ({ request }) => {
    const response = await request.get('/api/cab/');
    expect(response.headers()['content-type']).toContain('application/json');
  });
});
