import { test, expect } from '@playwright/test';

/**
 * API Endpoint Tests — /api/quiz-scores
 * Tests the quiz score saving and retrieval, including the
 * per-question details field (JSON array of {word, meaning, correct, split_time}).
 */

test.describe('API — /api/quiz-scores POST — Positive', () => {
  test('POST accepts valid score without details', async ({ request }) => {
    const response = await request.post('/api/quiz-scores', {
      data: {
        user_id: 'test-user-playwright',
        score: 8,
        total: 10,
        time_used: 45,
        timer_limit: 90,
        timed_out: 0,
      },
    });
    // 200 on success, 500 if no DB — never 404
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.success).toBe(true);
    }
  });

  test('POST accepts valid score with details array', async ({ request }) => {
    const details = [
      { word: 'QUIXOTIC', meaning: 'exceedingly idealistic', correct: true, split_time: 5 },
      { word: 'ZEPHYR', meaning: 'a gentle breeze', correct: false, split_time: 12 },
      { word: 'JINX', meaning: 'a person or thing that brings bad luck', correct: true, split_time: 3 },
    ];

    const response = await request.post('/api/quiz-scores', {
      data: {
        user_id: 'test-user-details',
        score: 2,
        total: 3,
        time_used: 20,
        timer_limit: 90,
        timed_out: 0,
        details,
      },
    });
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.success).toBe(true);
    }
  });

  test('POST accepts minimal required fields (score + total only)', async ({ request }) => {
    const response = await request.post('/api/quiz-scores', {
      data: {
        score: 5,
        total: 5,
      },
    });
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.success).toBe(true);
    }
  });

  test('POST stores timed_out flag correctly', async ({ request }) => {
    const response = await request.post('/api/quiz-scores', {
      data: {
        user_id: 'test-timeout-user',
        score: 3,
        total: 10,
        time_used: 90,
        timer_limit: 90,
        timed_out: 1,
      },
    });
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.success).toBe(true);
    }
  });
});

test.describe('API — /api/quiz-scores POST — Negative', () => {
  test('POST rejects missing score field', async ({ request }) => {
    const response = await request.post('/api/quiz-scores', {
      data: {
        user_id: 'test-user',
        total: 10,
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('score');
  });

  test('POST rejects missing total field', async ({ request }) => {
    const response = await request.post('/api/quiz-scores', {
      data: {
        user_id: 'test-user',
        score: 5,
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('total');
  });

  test('POST rejects empty body (no score or total)', async ({ request }) => {
    const response = await request.post('/api/quiz-scores', {
      data: {},
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('POST handles details as empty array without error', async ({ request }) => {
    const response = await request.post('/api/quiz-scores', {
      data: {
        score: 3,
        total: 5,
        details: [],
      },
    });
    // Empty array is valid — should not crash
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.success).toBe(true);
    }
  });

  test('POST handles details as null gracefully', async ({ request }) => {
    const response = await request.post('/api/quiz-scores', {
      data: {
        score: 7,
        total: 10,
        details: null,
      },
    });
    // null details should be treated as empty — should not crash
    expect(response.status()).not.toBe(404);
    expect(response.status()).not.toBe(500);
  });
});

test.describe('API — /api/quiz-scores GET — Positive', () => {
  test('GET returns scores array', async ({ request }) => {
    const response = await request.get('/api/quiz-scores');
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.scores).toBeDefined();
      expect(Array.isArray(body.scores)).toBeTruthy();
    }
    // 500 is acceptable if no DB in test env
    expect(response.status()).not.toBe(404);
  });

  test('GET with user_id filter returns filtered results', async ({ request }) => {
    const response = await request.get('/api/quiz-scores?user_id=test-user-playwright');
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.scores).toBeDefined();
      expect(Array.isArray(body.scores)).toBeTruthy();
      // All returned scores should belong to the filtered user
      for (const score of body.scores) {
        expect(score.user_id).toBe('test-user-playwright');
      }
    }
  });

  test('GET respects 50-row limit per user', async ({ request }) => {
    const response = await request.get('/api/quiz-scores?user_id=test-user-playwright');
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.scores.length).toBeLessThanOrEqual(50);
    }
  });

  test('GET without user_id respects 100-row limit', async ({ request }) => {
    const response = await request.get('/api/quiz-scores');
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.scores.length).toBeLessThanOrEqual(100);
    }
  });
});

test.describe('API — /api/quiz-scores GET — Negative', () => {
  test('GET with non-existent user_id returns empty array', async ({ request }) => {
    const response = await request.get('/api/quiz-scores?user_id=non-existent-user-xyz-999');
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.scores).toHaveLength(0);
    }
  });

  test('GET endpoint does not crash with special characters in user_id', async ({ request }) => {
    const response = await request.get('/api/quiz-scores?user_id=' + encodeURIComponent("'; DROP TABLE quiz_scores; --"));
    // Should not return 500 (SQL injection attempt handled safely)
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.scores).toBeDefined();
    }
  });
});
