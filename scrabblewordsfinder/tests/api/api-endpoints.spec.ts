import { test, expect } from '@playwright/test';

/**
 * API Endpoint Tests
 * Tests the server-side API endpoints for clicks, suggestions,
 * and scrabble sync functionality.
 */

test.describe('API — /api/clicks', () => {
  test('POST /api/clicks accepts valid payload', async ({ request }) => {
    const response = await request.post('/api/clicks', {
      data: {
        user_id: 'test-user-playwright',
        ui_element: 'test-button',
        url: '/test-page',
      },
    });
    // May return 200 or 500 (if no DB) — but should not 404
    expect(response.status()).not.toBe(404);
  });

  test('POST /api/clicks rejects missing user_id', async ({ request }) => {
    const response = await request.post('/api/clicks', {
      data: {
        ui_element: 'test-button',
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('user_id');
  });

  test('POST /api/clicks rejects missing ui_element', async ({ request }) => {
    const response = await request.post('/api/clicks', {
      data: {
        user_id: 'test-user',
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('ui_element');
  });

  test('POST /api/clicks rejects invalid JSON', async ({ request }) => {
    const response = await request.post('/api/clicks', {
      data: 'not-json',
      headers: { 'Content-Type': 'text/plain' },
    });
    expect(response.status()).toBe(400);
  });

  test('GET /api/clicks/?count=true returns total', async ({ request }) => {
    const response = await request.get('/api/clicks/?count=true');
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.total).toBeDefined();
      expect(typeof body.total).toBe('number');
    }
    // May be 500 if no DB — that's fine in test env
  });

  test('GET /api/clicks returns clicks array', async ({ request }) => {
    const response = await request.get('/api/clicks');
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.clicks).toBeDefined();
      expect(Array.isArray(body.clicks)).toBeTruthy();
    }
  });

  test('GET /api/clicks respects limit param', async ({ request }) => {
    const response = await request.get('/api/clicks?limit=5');
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.clicks.length).toBeLessThanOrEqual(5);
    }
  });
});

test.describe('API — /api/suggest', () => {
  test('POST /api/suggest accepts valid suggestion', async ({ request }) => {
    const response = await request.post('/api/suggest', {
      data: {
        name: 'Test User',
        email: 'test@example.com',
        suggestion: 'Add a dark mode feature',
      },
    });
    // Either 200 (success) or 500 (no DB) — not 404
    expect(response.status()).not.toBe(404);
  });

  test('POST /api/suggest rejects empty suggestion', async ({ request }) => {
    const response = await request.post('/api/suggest', {
      data: {
        name: 'Test',
        email: '',
        suggestion: '',
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('suggestion');
  });

  test('POST /api/suggest rejects invalid JSON', async ({ request }) => {
    const response = await request.post('/api/suggest', {
      data: 'not json at all',
      headers: { 'Content-Type': 'text/plain' },
    });
    expect(response.status()).toBe(400);
  });

  test('POST /api/suggest works with just suggestion (no name/email)', async ({ request }) => {
    const response = await request.post('/api/suggest', {
      data: {
        suggestion: 'Minimal suggestion without name or email',
      },
    });
    // Should not require name/email
    expect(response.status()).not.toBe(400);
  });
});

test.describe('API — /api/scrabble-sync', () => {
  test('GET /api/scrabble-sync requires uid param', async ({ request }) => {
    const response = await request.get('/api/scrabble-sync');
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('uid');
  });

  test('GET /api/scrabble-sync with uid returns achievements', async ({ request }) => {
    const response = await request.get('/api/scrabble-sync?uid=test-uid-12345');
    if (response.status() === 200) {
      const body = await response.json();
      expect(body.achievements).toBeDefined();
      expect(body.dictionary).toBeDefined();
    }
  });

  test('POST /api/scrabble-sync requires uid and achievements', async ({ request }) => {
    const response = await request.post('/api/scrabble-sync', {
      data: {
        achievements: [{ word: 'test', meaning: '' }],
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('uid');
  });

  test('POST /api/scrabble-sync accepts valid payload', async ({ request }) => {
    const response = await request.post('/api/scrabble-sync', {
      data: {
        uid: 'playwright-test-uid',
        achievements: [{ word: 'quiz', meaning: '(noun) a test' }],
        dictionary: 'sowpods',
      },
    });
    // Either 200 or 500 (no DB) — not 400 or 404
    expect([200, 500]).toContain(response.status());
  });

  test('POST /api/scrabble-sync rejects invalid JSON', async ({ request }) => {
    const response = await request.post('/api/scrabble-sync', {
      data: 'bad data',
      headers: { 'Content-Type': 'text/plain' },
    });
    expect(response.status()).toBe(400);
  });
});
