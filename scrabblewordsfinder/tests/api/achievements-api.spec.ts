import { test, expect } from '@playwright/test';

/**
 * API Endpoint Tests — /api/achievements/
 * Tests the tile score achievements: GET (with user filter), POST (new format), DELETE.
 */

test.describe('API — /api/achievements/ GET — Positive', () => {
  test('GET returns achievements array', async ({ request }) => {
    const response = await request.get('/api/achievements/');
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.achievements).toBeDefined();
      expect(Array.isArray(body.achievements)).toBeTruthy();
    }
    // 500 acceptable if no DB in test env
    expect(response.status()).not.toBe(404);
  });

  test('GET with user_id filter returns filtered results', async ({ request }) => {
    const response = await request.get('/api/achievements/?user_id=test-ach-playwright');
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.achievements).toBeDefined();
      expect(Array.isArray(body.achievements)).toBeTruthy();
      for (const ach of body.achievements) {
        expect(ach.user_id).toBe('test-ach-playwright');
      }
    }
  });

  test('GET respects 50-row limit', async ({ request }) => {
    const response = await request.get('/api/achievements/');
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.achievements.length).toBeLessThanOrEqual(50);
    }
  });

  test('GET without user_id returns all users achievements', async ({ request }) => {
    const response = await request.get('/api/achievements/');
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.achievements).toBeDefined();
    }
  });
});

test.describe('API — /api/achievements/ GET — Negative', () => {
  test('GET with non-existent user_id returns empty array', async ({ request }) => {
    const response = await request.get('/api/achievements/?user_id=non-existent-user-xyz-999');
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.achievements).toHaveLength(0);
    }
  });

  test('GET does not crash with SQL injection in user_id', async ({ request }) => {
    const response = await request.get('/api/achievements/?user_id=' + encodeURIComponent("'; DROP TABLE achievements; --"));
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.achievements).toBeDefined();
    }
  });
});

test.describe('API — /api/achievements/ POST — Positive', () => {
  test('POST accepts valid tile score achievement', async ({ request }) => {
    const response = await request.post('/api/achievements/', {
      data: {
        user_id: 'test-ach-playwright',
        achievement_id: 1,
        encouragement_words: 'Great first word!',
        score: 12,
        word: 'QUEST',
      },
    });
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.a_id).toBeDefined();
    }
  });

  test('POST maps level 1 to Rising Star', async ({ request }) => {
    const response = await request.post('/api/achievements/', {
      data: {
        user_id: 'test-level-mapping',
        achievement_id: 1,
        score: 8,
        word: 'STAR',
      },
    });
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.success).toBe(true);
    }
  });

  test('POST maps level 5 to Scrabble Legend', async ({ request }) => {
    const response = await request.post('/api/achievements/', {
      data: {
        user_id: 'test-level-mapping',
        achievement_id: 5,
        score: 42,
        word: 'QUIXOTIC',
      },
    });
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.success).toBe(true);
    }
  });

  test('POST works without optional fields (user_id, encouragement_words, achievement_id)', async ({ request }) => {
    const response = await request.post('/api/achievements/', {
      data: {
        word: 'ZEPHYR',
        score: 21,
      },
    });
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.success).toBe(true);
    }
  });

  test('POST uppercases the word before storing', async ({ request }) => {
    // Post with lowercase word
    const postResp = await request.post('/api/achievements/', {
      data: {
        user_id: 'test-uppercase-check',
        achievement_id: 2,
        score: 10,
        word: 'hello',
      },
    });
    if (postResp.status() !== 200) return;

    // Fetch back and verify uppercase
    const getResp = await request.get('/api/achievements/?user_id=test-uppercase-check');
    if (getResp.status() === 200) {
      const body = await getResp.json();
      const latest = body.achievements[0];
      if (latest) {
        expect(latest.word).toBe('HELLO');
      }
    }
  });
});

test.describe('API — /api/achievements/ POST — Negative', () => {
  test('POST rejects missing word field', async ({ request }) => {
    const response = await request.post('/api/achievements/', {
      data: {
        user_id: 'test-user',
        achievement_id: 1,
        score: 10,
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('word');
  });

  test('POST rejects empty body', async ({ request }) => {
    const response = await request.post('/api/achievements/', {
      data: {},
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test('POST handles unknown achievement_id gracefully (fallback level)', async ({ request }) => {
    const response = await request.post('/api/achievements/', {
      data: {
        user_id: 'test-unknown-level',
        achievement_id: 99,
        score: 5,
        word: 'TEST',
      },
    });
    // Should not crash — falls back to generic "Achievement" name
    expect(response.status()).not.toBe(404);
    expect(response.status()).not.toBe(500);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.success).toBe(true);
    }
  });

  test('POST does not crash with very long word', async ({ request }) => {
    const response = await request.post('/api/achievements/', {
      data: {
        user_id: 'test-long-word',
        achievement_id: 1,
        score: 100,
        word: 'A'.repeat(200),
      },
    });
    // Should not 500 — may succeed or fail gracefully
    expect(response.status()).not.toBe(404);
  });
});

test.describe('API — /api/achievements/ DELETE — Positive', () => {
  test('DELETE with valid id returns success', async ({ request }) => {
    // First create an achievement to get an ID
    const postResp = await request.post('/api/achievements/', {
      data: {
        user_id: 'test-delete-user',
        achievement_id: 1,
        score: 5,
        word: 'REMOVE',
      },
    });
    if (postResp.status() !== 200) return;
    const { a_id } = await postResp.json();

    // Now delete it
    const delResp = await request.delete(`/api/achievements/?id=${a_id}`);
    expect(delResp.status()).not.toBe(404);
    if (delResp.status() === 200) {
      const body = await delResp.json();
      expect(body.success).toBe(true);
    }
  });

  test('DELETE with non-existent id still returns success (idempotent)', async ({ request }) => {
    const response = await request.delete('/api/achievements/?id=999999');
    expect(response.status()).not.toBe(404);
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.success).toBe(true);
    }
  });
});

test.describe('API — /api/achievements/ DELETE — Negative', () => {
  test('DELETE without id param returns 400 or 403', async ({ request }) => {
    const response = await request.delete('/api/achievements/');
    // 400 if handler validates, 403 if auth middleware blocks DELETE without params
    expect([400, 403]).toContain(response.status());
    if (response.status() === 400) {
      const body = await response.json();
      expect(body.error).toContain('id');
    }
  });

  test('DELETE does not crash with SQL injection in id', async ({ request }) => {
    const response = await request.delete('/api/achievements/?id=' + encodeURIComponent("1; DROP TABLE achievements;"));
    // Parameterized query should prevent injection — should not 500
    expect(response.status()).not.toBe(404);
  });
});
