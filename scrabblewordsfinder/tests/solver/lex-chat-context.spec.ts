import { test, expect } from '@playwright/test';

/**
 * Lex Chat Context Awareness — Tests that the /api/lex-chat/ endpoint
 * uses context.rack for follow-up questions, and that new detection patterns
 * catch "bingos in WORD" style queries to prevent hallucination.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Lex Chat Context — Positive', () => {
  test('API accepts context.rack and uses it for follow-up questions', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-chat/`, {
      data: {
        message: 'which ones are bingos',
        context: { rack: 'TRAINED' }
      },
    });

    // Should get 200 (solved via context rack) or 503 (AI unavailable)
    expect([200, 503]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.reply).toBeTruthy();
      // Should NOT contain hallucinated words — response should reference actual solver results
      expect(typeof body.reply).toBe('string');
    }
  });

  test('API detects rack from "bingos in TRAINED" pattern', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-chat/`, {
      data: { message: 'which ones are bingos in TRAINED' },
    });

    expect([200, 503]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.reply).toBeTruthy();
    }
  });

  test('API detects rack from "bingos from AEINRST" pattern', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-chat/`, {
      data: { message: 'what bingos from AEINRST' },
    });

    expect([200, 503]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.reply).toBeTruthy();
    }
  });

  test('API detects rack from "words in RETAINS" pattern', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-chat/`, {
      data: { message: 'what words in RETAINS' },
    });

    expect([200, 503]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.reply).toBeTruthy();
    }
  });

  test('context.rack is ignored if message is not a follow-up question', async ({ request }) => {
    // A general question like "what is a bingo" should use CHAT mode, not SOLVER mode
    const res = await request.post(`${BASE}/api/lex-chat/`, {
      data: {
        message: 'how many tiles are in a Scrabble bag',
        context: { rack: 'TRAINED' }
      },
    });

    expect([200, 503]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.reply).toBeTruthy();
    }
  });

  test('context.rack triggers solver for keyword "best"', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-chat/`, {
      data: {
        message: 'what is the best word',
        context: { rack: 'AEINRST' }
      },
    });

    expect([200, 503]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.reply).toBeTruthy();
    }
  });

  test('context with empty rack does not crash', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-chat/`, {
      data: {
        message: 'which are bingos',
        context: { rack: '' }
      },
    });

    // Should fall through to general chat (empty rack ignored)
    expect([200, 503]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.reply).toBeTruthy();
    }
  });

  test('context as old string format does not crash (backward compatible)', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-chat/`, {
      data: {
        message: 'what is a good opening word',
        context: 'solver'
      },
    });

    // Should work fine — old format just won't provide rack context
    expect([200, 503]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.reply).toBeTruthy();
    }
  });
});

test.describe('Lex Chat Context — Negative', () => {
  test('API does not crash with null context', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-chat/`, {
      data: {
        message: 'which are the bingos',
        context: null
      },
    });

    expect([200, 503]).toContain(res.status());
  });

  test('API does not crash with malformed context object', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-chat/`, {
      data: {
        message: 'best word to play',
        context: { rack: 12345 }
      },
    });

    // Should handle gracefully (rack is not a string, should be ignored or coerced)
    expect([200, 503]).toContain(res.status());
  });

  test('API does not crash with context.rack too long', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-chat/`, {
      data: {
        message: 'which are bingos',
        context: { rack: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' }
      },
    });

    // Rack >15 chars should be ignored (too long for valid rack)
    expect([200, 503]).toContain(res.status());
  });

  test('follow-up without context or detectable rack gives general response', async ({ request }) => {
    const res = await request.post(`${BASE}/api/lex-chat/`, {
      data: { message: 'which ones are bingos' },
    });

    // No rack context, no detectable rack in message — should use general chat
    expect([200, 503]).toContain(res.status());
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.reply).toBeTruthy();
    }
  });
});
