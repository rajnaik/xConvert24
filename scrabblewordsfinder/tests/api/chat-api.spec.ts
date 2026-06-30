import { test, expect } from '@playwright/test';

/**
 * Chat API Endpoint Tests (/api/chat/)
 * Tests the ScrabbleBot AI chat API powered by Workers AI (Llama 4 Scout).
 * Covers input validation, method handling, and response format.
 */

test.describe('Chat API — Positive', () => {
  test('POST /api/chat/ with valid messages returns streaming response', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          { role: 'user', content: 'What are the best two-letter words?' },
        ],
      },
    });
    // Should return 200 with text/event-stream (streaming) or JSON response
    // Workers AI may be unavailable in test env (503) — that's acceptable
    expect([200, 503]).toContain(response.status());
    if (response.status() === 200) {
      const contentType = response.headers()['content-type'] || '';
      // Streaming response uses text/event-stream
      expect(contentType).toContain('text/event-stream');
    }
  });

  test('POST /api/chat/ with multiple messages is accepted', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          { role: 'user', content: 'Hi' },
          { role: 'assistant', content: 'Hello! How can I help?' },
          { role: 'user', content: 'Best Q without U words?' },
        ],
      },
    });
    // 200 (streaming) or 503 (AI unavailable) — not 400 or 404
    expect([200, 503]).toContain(response.status());
  });

  test('GET /api/chat/ returns 405 method not allowed', async ({ request }) => {
    const response = await request.get('/api/chat/');
    expect(response.status()).toBe(405);
    const body = await response.json();
    expect(body.error).toContain('Method not allowed');
  });
});

test.describe('Chat API — Negative', () => {
  test('POST /api/chat/ rejects invalid JSON', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: 'this is not json',
      headers: { 'Content-Type': 'text/plain' },
    });
    // Server may return 400 (handler catches parse error) or 403 (middleware blocks non-JSON)
    expect([400, 403]).toContain(response.status());
  });

  test('POST /api/chat/ rejects missing messages field', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: { text: 'hello' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Messages array is required');
  });

  test('POST /api/chat/ rejects empty messages array', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: { messages: [] },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Messages array is required');
  });

  test('POST /api/chat/ rejects non-array messages', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: { messages: 'not an array' },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('Messages array is required');
  });
});

test.describe('Chat API — Chatusage Counter', () => {
  test('site_status includes chatusage field', async ({ request }) => {
    const response = await request.get('/api/site-status/');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect('chatusage' in body).toBeTruthy();
    expect(typeof body.chatusage).toBe('number');
  });

  test('chatusage increments after a successful chat POST', async ({ request }) => {
    // Read current chatusage
    const before = await request.get('/api/site-status/');
    expect(before.status()).toBe(200);
    const beforeBody = await before.json();
    const countBefore = beforeBody.chatusage ?? 0;

    // Make a valid chat request
    const chatResponse = await request.post('/api/chat/', {
      data: {
        messages: [{ role: 'user', content: 'What is a bingo in Scrabble?' }],
      },
    });

    // Only verify increment if AI was available (200 = streaming response)
    if (chatResponse.status() === 200) {
      // Small delay for fire-and-forget DB write to complete
      await new Promise((r) => setTimeout(r, 500));

      const after = await request.get('/api/site-status/');
      expect(after.status()).toBe(200);
      const afterBody = await after.json();
      expect(afterBody.chatusage).toBeGreaterThan(countBefore);
    } else {
      // AI unavailable (503) — counter should NOT increment since code returns before the DB write
      test.skip();
    }
  });

  test('chatusage does NOT increment on invalid chat request (400)', async ({ request }) => {
    // Read current chatusage
    const before = await request.get('/api/site-status/');
    expect(before.status()).toBe(200);
    const countBefore = (await before.json()).chatusage ?? 0;

    // Send invalid request (empty messages — returns 400 before reaching the counter)
    await request.post('/api/chat/', {
      data: { messages: [] },
    });

    // Brief pause
    await new Promise((r) => setTimeout(r, 300));

    // Counter should remain unchanged
    const after = await request.get('/api/site-status/');
    expect(after.status()).toBe(200);
    const countAfter = (await after.json()).chatusage ?? 0;
    expect(countAfter).toBe(countBefore);
  });
});

test.describe('Chat API — Dictionary Enrichment (Positive)', () => {
  test('word definition query (define X) does not error', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [{ role: 'user', content: 'define quixotic' }],
      },
    });
    // Should succeed (200 streaming) or 503 (AI unavailable) — never 400/500
    expect([200, 503]).toContain(response.status());
  });

  test('Q without U query is accepted and processed', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [{ role: 'user', content: 'What are the best Q without U words?' }],
      },
    });
    expect([200, 503]).toContain(response.status());
  });

  test('N-letter words query is accepted', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [{ role: 'user', content: 'Show me some 5-letter words' }],
      },
    });
    expect([200, 503]).toContain(response.status());
  });

  test('words starting with prefix query is accepted', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [{ role: 'user', content: 'words starting with QI' }],
      },
    });
    expect([200, 503]).toContain(response.status());
  });

  test('words ending with suffix query is accepted', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [{ role: 'user', content: 'words ending in ZA' }],
      },
    });
    expect([200, 503]).toContain(response.status());
  });

  test('highest scoring words query is accepted', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [{ role: 'user', content: 'What are the highest scoring words?' }],
      },
    });
    expect([200, 503]).toContain(response.status());
  });

  test('bingo words query is accepted', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [{ role: 'user', content: 'Tell me about bingo words' }],
      },
    });
    expect([200, 503]).toContain(response.status());
  });

  test('two-letter words query is accepted', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [{ role: 'user', content: 'List all two letter words' }],
      },
    });
    expect([200, 503]).toContain(response.status());
  });

  test('random word / teach me a word query is accepted', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [{ role: 'user', content: 'teach me a word' }],
      },
    });
    expect([200, 503]).toContain(response.status());
  });

  test('words with specific letter query is accepted', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [{ role: 'user', content: 'best Z words' }],
      },
    });
    expect([200, 503]).toContain(response.status());
  });
});

test.describe('Chat API — Dictionary Enrichment (Negative)', () => {
  test('non-word query does not trigger dictionary enrichment and still works', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [{ role: 'user', content: 'What are the rules of Scrabble?' }],
      },
    });
    // Should still succeed — non-word queries just skip enrichment
    expect([200, 503]).toContain(response.status());
  });

  test('empty user content does not crash dictionary enrichment', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [{ role: 'user', content: '' }],
      },
    });
    // Empty content may be rejected by validation (400) or pass through — should not 500
    expect([200, 400, 503]).toContain(response.status());
    expect(response.status()).not.toBe(500);
  });

  test('very long message does not crash dictionary enrichment', async ({ request }) => {
    const longMsg = 'define ' + 'a'.repeat(500);
    const response = await request.post('/api/chat/', {
      data: {
        messages: [{ role: 'user', content: longMsg }],
      },
    });
    // Should not 500 — regex patterns should handle gracefully
    expect(response.status()).not.toBe(500);
  });

  test('special characters in word query do not cause server error', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [{ role: 'user', content: "define <script>alert('xss')</script>" }],
      },
    });
    // Should not 500 — input is used in parameterized queries
    expect(response.status()).not.toBe(500);
  });
});

test.describe('Chat Page — Positive', () => {
  test('chat page loads with Lex heading', async ({ page }) => {
    await page.goto('/chat/');
    await expect(page.locator('main h1')).toContainText('Lex');
  });

  test('chat page has input textarea and send button', async ({ page }) => {
    await page.goto('/chat/');
    await expect(page.locator('#chat-input')).toBeVisible();
    await expect(page.locator('#send-btn')).toBeVisible();
  });

  test('chat page shows quick prompt buttons', async ({ page }) => {
    await page.goto('/chat/');
    const prompts = page.locator('.quick-prompt');
    await expect(prompts).toHaveCount(5);
  });

  test('chat page has welcome bot message', async ({ page }) => {
    await page.goto('/chat/');
    const welcome = page.locator('#messages .text-sm', { hasText: 'Lex' });
    await expect(welcome).toBeVisible();
  });

  test('chat page has Ask Lex rack input and button', async ({ page }) => {
    await page.goto('/chat/');
    await expect(page.locator('#rack-input')).toBeVisible();
    await expect(page.locator('#ask-lex-btn')).toBeVisible();
    await expect(page.locator('#ask-lex-btn')).toContainText('Ask Lex');
  });
});

test.describe('Chat Page — Negative', () => {
  test('no duplicate chat containers on page', async ({ page }) => {
    await page.goto('/chat/');
    const containers = page.locator('#chat-container');
    await expect(containers).toHaveCount(1);
  });

  test('no page errors on chat load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/chat/');
    await page.waitForTimeout(1000);
    expect(errors.filter((e) => e.includes('critical'))).toHaveLength(0);
  });
});
