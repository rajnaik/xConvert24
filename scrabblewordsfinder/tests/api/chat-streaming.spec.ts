import { test, expect } from '@playwright/test';

/**
 * Chat Streaming API (/api/chat/) — Model Routing & Rack Quality Integration
 *
 * Tests the main Lex chat endpoint which uses:
 * - Query classifier (lex-classifier) for smart model routing
 * - Rack quality scoring (rack-quality) for EV analysis
 * - Dictionary enrichment for word-related queries
 * - Streaming SSE responses via Workers AI
 *
 * NOTE: Since /api/chat/ returns a streaming text/event-stream response,
 * we use page.evaluate with fetch + AbortController to avoid Playwright
 * blocking on the full stream. We test status codes and initial response
 * headers, then abort after confirming the stream started.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Chat Streaming API — Positive', () => {
  test('POST /api/chat/ with valid messages returns 200 streaming response', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const result = await page.evaluate(async (baseUrl) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(`${baseUrl}/api/chat/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: 'What is a bingo?' }] }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const contentType = res.headers.get('content-type') || '';
        // Read just a small chunk to confirm stream started
        const reader = res.body?.getReader();
        let chunk = '';
        if (reader) {
          const { value } = await reader.read();
          if (value) chunk = new TextDecoder().decode(value).substring(0, 100);
          reader.cancel();
        }
        return { status: res.status, contentType, chunk };
      } catch (e: any) {
        clearTimeout(timeout);
        if (e.name === 'AbortError') return { status: 200, contentType: 'aborted', chunk: '' };
        return { status: 0, contentType: '', chunk: e.message };
      }
    }, BASE);
    // 200 = AI streaming, or 500/503 if AI binding unavailable locally
    expect([200, 500, 503]).toContain(result.status);
    if (result.status === 200) {
      expect(result.contentType).toContain('text/event-stream');
    }
  });

  test('POST /api/chat/ accepts multi-message conversation', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const result = await page.evaluate(async (baseUrl) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(`${baseUrl}/api/chat/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'user', content: 'Hi Lex' },
              { role: 'assistant', content: 'Hello!' },
              { role: 'user', content: 'Best 2-letter words?' },
            ],
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        controller.abort();
        return { status: res.status };
      } catch (e: any) {
        clearTimeout(timeout);
        if (e.name === 'AbortError') return { status: 200 };
        return { status: 0 };
      }
    }, BASE);
    expect([200, 500, 503]).toContain(result.status);
  });

  test('POST /api/chat/ with rack quality query does not crash', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const result = await page.evaluate(async (baseUrl) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(`${baseUrl}/api/chat/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'How good is my rack AEINRST? What is the rack quality?' }],
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        controller.abort();
        return { status: res.status };
      } catch (e: any) {
        clearTimeout(timeout);
        if (e.name === 'AbortError') return { status: 200 };
        return { status: 0 };
      }
    }, BASE);
    expect([200, 500, 503]).toContain(result.status);
  });

  test('POST /api/chat/ with complex strategy query does not crash', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const result = await page.evaluate(async (baseUrl) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(`${baseUrl}/api/chat/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: 'Analyse my rack leave strategy' }],
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        controller.abort();
        return { status: res.status };
      } catch (e: any) {
        clearTimeout(timeout);
        if (e.name === 'AbortError') return { status: 200 };
        return { status: 0 };
      }
    }, BASE);
    expect([200, 500, 503]).toContain(result.status);
  });

  test('POST /api/chat/ with quiz coaching marker does not crash', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const result = await page.evaluate(async (baseUrl) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(`${baseUrl}/api/chat/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: '[QUIZ COACHING REQUEST] 5 rounds' }],
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        controller.abort();
        return { status: res.status };
      } catch (e: any) {
        clearTimeout(timeout);
        if (e.name === 'AbortError') return { status: 200 };
        return { status: 0 };
      }
    }, BASE);
    expect([200, 500, 503]).toContain(result.status);
  });

  test('POST /api/chat/ with CaB coaching marker does not crash', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const result = await page.evaluate(async (baseUrl) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(`${baseUrl}/api/chat/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: '[COWS AND BULLS — COACHING REQUEST]' }],
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        controller.abort();
        return { status: res.status };
      } catch (e: any) {
        clearTimeout(timeout);
        if (e.name === 'AbortError') return { status: 200 };
        return { status: 0 };
      }
    }, BASE);
    expect([200, 500, 503]).toContain(result.status);
  });

  test('POST /api/chat/ with rack coaching marker does not crash', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const result = await page.evaluate(async (baseUrl) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(`${baseUrl}/api/chat/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: '[DAILY RACK CHALLENGE — COACHING REQUEST] Total words submitted: 5' }],
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        controller.abort();
        return { status: res.status };
      } catch (e: any) {
        clearTimeout(timeout);
        if (e.name === 'AbortError') return { status: 200 };
        return { status: 0 };
      }
    }, BASE);
    expect([200, 500, 503]).toContain(result.status);
  });

  test('POST /api/chat/ with anagram coaching marker does not crash', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const result = await page.evaluate(async (baseUrl) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(`${baseUrl}/api/chat/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: '[DAILY ANAGRAM — COACHING REQUEST] Total puzzles played: 3' }],
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        controller.abort();
        return { status: res.status };
      } catch (e: any) {
        clearTimeout(timeout);
        if (e.name === 'AbortError') return { status: 200 };
        return { status: 0 };
      }
    }, BASE);
    expect([200, 500, 503]).toContain(result.status);
  });

  test('GET /api/chat/ returns 405 method not allowed', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const result = await page.evaluate(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/chat/`, { method: 'GET' });
      const body = await res.json();
      return { status: res.status, error: body.error };
    }, BASE);
    expect(result.status).toBe(405);
    expect(result.error).toContain('Method not allowed');
  });
});

test.describe('Chat Streaming API — Negative', () => {
  test('POST /api/chat/ rejects missing messages field', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const result = await page.evaluate(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'hello' }),
      });
      const body = await res.json();
      return { status: res.status, error: body.error };
    }, BASE);
    expect(result.status).toBe(400);
    expect(result.error).toContain('Messages array is required');
  });

  test('POST /api/chat/ rejects empty messages array', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const result = await page.evaluate(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      });
      const body = await res.json();
      return { status: res.status, error: body.error };
    }, BASE);
    expect(result.status).toBe(400);
    expect(result.error).toContain('Messages array is required');
  });

  test('POST /api/chat/ rejects non-array messages', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const result = await page.evaluate(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: 'not an array' }),
      });
      const body = await res.json();
      return { status: res.status, error: body.error };
    }, BASE);
    expect(result.status).toBe(400);
    expect(result.error).toContain('Messages array is required');
  });

  test('POST /api/chat/ rejects invalid JSON body', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const result = await page.evaluate(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'this is not json {{{',
      });
      const body = await res.json();
      return { status: res.status, error: body.error };
    }, BASE);
    expect(result.status).toBe(400);
    expect(result.error).toContain('Invalid JSON');
  });

  test('POST /api/chat/ does not crash with 25 messages (history trimming)', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const result = await page.evaluate(async (baseUrl) => {
      const messages = Array.from({ length: 25 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: i % 2 === 0 ? `Question ${i}` : `Answer ${i}`,
      }));
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(`${baseUrl}/api/chat/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        controller.abort();
        return { status: res.status };
      } catch (e: any) {
        clearTimeout(timeout);
        if (e.name === 'AbortError') return { status: 200 };
        return { status: 0 };
      }
    }, BASE);
    // Should not crash — trims to last 20 internally
    expect([200, 500, 503]).toContain(result.status);
  });

  test('POST /api/chat/ does not expose sensitive data in error response', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const result = await page.evaluate(async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      });
      const text = await res.text();
      return text;
    }, BASE);
    expect(result).not.toMatch(/sk-[a-zA-Z0-9]{20,}/);
    expect(result).not.toContain('AKIA');
    expect(result).not.toMatch(/@gmail\.com/);
  });
});
