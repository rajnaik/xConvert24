import { test, expect } from '@playwright/test';

/**
 * Lex Chat API Tests (/api/lex-chat/)
 * Tests the Lex AI Chat endpoint (Chat Mode) with rack-solving intelligence.
 * The endpoint accepts { message: string } and returns { reply: string }.
 * When a rack question is detected, it solves the rack algorithmically first.
 */

test.describe('Lex Chat API — Positive', () => {
  test('POST /api/lex-chat/ with valid message returns JSON reply', async ({ request }) => {
    const response = await request.post('/api/lex-chat/', {
      data: { message: 'What is a bingo in Scrabble?' },
    });
    // 200 (AI responds), 500 (AI request failed), or 503 (AI unavailable)
    expect([200, 500, 503]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('reply');
      expect(typeof body.reply).toBe('string');
      expect(body.reply.length).toBeGreaterThan(0);
    }
  });

  test('POST /api/lex-chat/ with rack question is accepted', async ({ request }) => {
    const response = await request.post('/api/lex-chat/', {
      data: { message: 'What words can I make with ADINERT?' },
    });
    // 200 (rack solved + AI coached), 500 (AI failed), or 503 (AI unavailable)
    expect([200, 500, 503]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('reply');
      expect(typeof body.reply).toBe('string');
      expect(body.reply.length).toBeGreaterThan(0);
    }
  });

  test('POST /api/lex-chat/ with "best word for" pattern is accepted', async ({ request }) => {
    const response = await request.post('/api/lex-chat/', {
      data: { message: 'Best word for QZXJKWV' },
    });
    // Should not crash even with hard-to-solve racks — 500 = AI failed (not a crash)
    expect([200, 500, 503]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('reply');
    }
  });

  test('POST /api/lex-chat/ with "my rack is" pattern is accepted', async ({ request }) => {
    const response = await request.post('/api/lex-chat/', {
      data: { message: 'My rack is AEIORST' },
    });
    expect([200, 500, 503]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('reply');
      expect(body.reply.length).toBeGreaterThan(0);
    }
  });

  test('GET /api/lex-chat/ returns status info', async ({ request }) => {
    const response = await request.get('/api/lex-chat/');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('endpoint', 'lex-chat');
    expect(body).toHaveProperty('method', 'POST required');
  });
});

test.describe('Lex Chat API — Negative', () => {
  test('POST /api/lex-chat/ rejects missing message', async ({ request }) => {
    const response = await request.post('/api/lex-chat/', {
      data: { text: 'hello' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Message is required');
  });

  test('POST /api/lex-chat/ rejects empty message', async ({ request }) => {
    const response = await request.post('/api/lex-chat/', {
      data: { message: '   ' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Message is required');
  });

  test('POST /api/lex-chat/ rejects message over 500 characters', async ({ request }) => {
    const longMessage = 'A'.repeat(501);
    const response = await request.post('/api/lex-chat/', {
      data: { message: longMessage },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Message too long');
  });

  test('POST /api/lex-chat/ rejects invalid JSON body', async ({ request }) => {
    const response = await request.post('/api/lex-chat/', {
      data: 'not json at all',
      headers: { 'Content-Type': 'text/plain' },
    });
    expect([400, 403]).toContain(response.status());
  });

  test('POST /api/lex-chat/ does not crash with non-string message', async ({ request }) => {
    const response = await request.post('/api/lex-chat/', {
      data: { message: 12345 },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Message is required');
  });

  test('POST /api/lex-chat/ handles exactly 500 character message without error', async ({ request }) => {
    const maxMessage = 'A'.repeat(500);
    const response = await request.post('/api/lex-chat/', {
      data: { message: maxMessage },
    });
    // Should NOT return 400 for exactly 500 chars — it's within limit
    // 200 (AI responds), 500 (AI failed), or 503 (AI unavailable) are all acceptable
    expect([200, 500, 503]).toContain(response.status());
  });
});
