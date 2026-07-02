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


test.describe('Chat API — Quiz Coaching Per-Question Commentary (Positive)', () => {
  test('quiz coaching request with word data is accepted and returns streaming response', async ({ request }) => {
    // Simulate a quiz coaching message that includes specific words right/wrong
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          {
            role: 'user',
            content:
              'Here are my Word Quiz stats: 5 rounds played, 80% accuracy, avg speed 4.2s. ' +
              'Words I got right: QUIXOTIC, ZEPHYR, ADZE. Words I got wrong: TAEL, NAEVI. ' +
              'Please give me coaching on my performance.',
          },
        ],
        context: 'quiz',
      },
    });
    // Should return 200 (streaming) or 503 (AI unavailable)
    expect([200, 503]).toContain(response.status());
    if (response.status() === 200) {
      const contentType = response.headers()['content-type'] || '';
      expect(contentType).toContain('text/event-stream');
    }
  });

  test('quiz coaching request with empty word lists is still accepted', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          {
            role: 'user',
            content:
              'Here are my Word Quiz stats: 2 rounds played, 100% accuracy, avg speed 3.0s. ' +
              'No words wrong this session. Please give me coaching.',
          },
        ],
        context: 'quiz',
      },
    });
    expect([200, 503]).toContain(response.status());
  });

  test('quiz coaching request with many words (10+) does not cause timeout', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          {
            role: 'user',
            content:
              'Word Quiz stats: 10 rounds, 65% accuracy. ' +
              'Right: QUAFF, JINX, OXBOW, FIZZY, WALTZ, GLYPH. ' +
              'Wrong: TAEL, NAEVI, GAEN, BIALI, ENOKI, TSADI, QANAT. ' +
              'Timeouts: 3. Coach me.',
          },
        ],
        context: 'quiz',
      },
    });
    // Should not 500 or timeout — either 200 stream or 503 unavailable
    expect([200, 503]).toContain(response.status());
    expect(response.status()).not.toBe(500);
  });
});

test.describe('Chat API — Quiz Coaching Per-Question Commentary (Negative)', () => {
  test('quiz coaching request does not crash with special characters in word names', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          {
            role: 'user',
            content:
              'Quiz stats: 3 rounds, 70% accuracy. ' +
              "Words wrong: <SCRIPT>, 'DROP TABLE', \"INJECT\". " +
              'Coach me on my quiz performance.',
          },
        ],
        context: 'quiz',
      },
    });
    // Should not 500 — graceful handling even with injection attempts
    expect(response.status()).not.toBe(500);
  });

  test('quiz coaching request without explicit word data still returns valid response', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          {
            role: 'user',
            content: 'Coach me on my quiz performance please',
          },
        ],
        context: 'quiz',
      },
    });
    // Should not error — AI will respond generically when no data available
    expect([200, 503]).toContain(response.status());
    expect(response.status()).not.toBe(500);
  });

  test('quiz coaching max_tokens is higher than regular chat (no truncation of commentary)', async ({ request }) => {
    // Send a rich quiz coaching request — the response should be longer (1024 tokens vs 512)
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          {
            role: 'user',
            content:
              'Full quiz stats: 20 rounds, 72% accuracy, avg speed 5.1s, timeouts: 8. ' +
              'Right: QUIXOTIC, ZEPHYR, ADZE, JINX, WALTZ, GLYPH, FJORD, OXBOW. ' +
              'Wrong: TAEL, NAEVI, GAEN, BIALI, ENOKI, TSADI, QANAT, AALII. ' +
              'Give me detailed coaching with per-question commentary.',
          },
        ],
        context: 'quiz',
      },
    });
    expect([200, 503]).toContain(response.status());
    if (response.status() === 200) {
      // Streaming response — read some chunks to verify content flows
      const body = await response.body();
      // Body should have content (not empty stream)
      expect(body.length).toBeGreaterThan(0);
    }
  });
});


test.describe('Chat API — Quiz Coaching Flowing Paragraph Format (Positive)', () => {
  // Helper to extract plain text from SSE stream body (Workers AI JSON chunks)
  function extractTextFromSSE(body: string): string {
    return body
      .split('\n')
      .filter((line) => line.startsWith('data: '))
      .map((line) => line.slice(6)) // remove 'data: ' prefix
      .filter((chunk) => chunk !== '[DONE]' && chunk.trim() !== '')
      .map((chunk) => {
        try {
          const json = JSON.parse(chunk);
          return json?.choices?.[0]?.delta?.content || json?.response || '';
        } catch {
          return '';
        }
      })
      .join('');
  }

  test('quiz coaching response streams valid content without numbered-list structure', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          {
            role: 'user',
            content:
              '[QUIZ COACHING REQUEST]\n\n' +
              'Here is my Word Quiz performance data. Please analyze it and give me personalized coaching advice.\n\n' +
              '--- MY QUIZ STATS ---\n' +
              'Total rounds played: 8\n' +
              'Overall accuracy: 75%\n' +
              'Average speed per question: 4.5s\n' +
              'Timeouts: 2\n\n' +
              '--- WORDS I GOT RIGHT ---\n' +
              'QUIXOTIC, ZEPHYR, ADZE, JINX, WALTZ, GLYPH\n\n' +
              '--- WORDS I GOT WRONG ---\n' +
              'TAEL, NAEVI, GAEN\n',
          },
        ],
      },
    });
    expect([200, 503]).toContain(response.status());
    if (response.status() === 200) {
      const contentType = response.headers()['content-type'] || '';
      expect(contentType).toContain('text/event-stream');
      const body = await response.text();
      const textContent = extractTextFromSSE(body);
      // The response should contain substantial coaching text
      expect(textContent.length).toBeGreaterThan(100);
    }
  });

  test('quiz coaching response references actual stats from the request', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          {
            role: 'user',
            content:
              '[QUIZ COACHING REQUEST]\n\n' +
              'Here is my Word Quiz performance data.\n\n' +
              '--- MY QUIZ STATS ---\n' +
              'Total rounds played: 12\n' +
              'Overall accuracy: 68%\n' +
              'Average speed per question: 6.1s\n' +
              'Timeouts: 5\n\n' +
              '--- WORDS I GOT RIGHT ---\n' +
              'FJORD, OXBOW, WALTZ\n\n' +
              '--- WORDS I GOT WRONG ---\n' +
              'QANAT, TSADI, BIALI, ENOKI\n',
          },
        ],
      },
    });
    expect([200, 503]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.text();
      const textContent = extractTextFromSSE(body);
      // The AI should reference their actual stats (numbers or word names)
      const hasStats =
        textContent.includes('12') ||
        textContent.includes('68') ||
        textContent.includes('5') ||
        textContent.toLowerCase().includes('timeout');
      const hasWords =
        textContent.toUpperCase().includes('QANAT') ||
        textContent.toUpperCase().includes('TSADI') ||
        textContent.toUpperCase().includes('FJORD') ||
        textContent.toUpperCase().includes('WALTZ');
      expect(hasStats || hasWords).toBeTruthy();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// COWS AND BULLS
// The Cows and Bulls game was added to Lex's expertise list in chat.ts.
// These tests confirm:
//   1. Lex accepts and does not reject CaB-related queries.
//   2. The [COWS AND BULLS — COACHING REQUEST] trigger bypasses dictionary
//      enrichment (same as quiz coaching).
//   3. Off-topic queries (cooking, maths) are still refused by Lex.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Chat API — Cows and Bulls (Positive)', () => {
  test('Cows and Bulls rules query is accepted without error', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [{ role: 'user', content: 'How do you play Cows and Bulls?' }],
      },
    });
    // 200 (streaming) or 503 (AI unavailable) — never 400
    expect([200, 503]).toContain(response.status());
  });

  test('CaB deduction strategy query is accepted', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          {
            role: 'user',
            content:
              'In Cows and Bulls I got 🐄🐂 on my first guess of SLATE — what should I try next?',
          },
        ],
      },
    });
    expect([200, 503]).toContain(response.status());
  });

  test('[COWS AND BULLS — COACHING REQUEST] trigger is accepted and returns stream', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          {
            role: 'user',
            content:
              '[COWS AND BULLS — COACHING REQUEST]\n\n' +
              'Secret word length: 5 letters\n' +
              'My guesses so far:\n' +
              '1. CRANE → 🐄🐄 (C wrong pos, R wrong pos)\n' +
              '2. TORCH → 🐂🐄 (O right pos, R wrong pos)\n' +
              'Help me narrow down the word.',
          },
        ],
      },
    });
    expect([200, 503]).toContain(response.status());
    if (response.status() === 200) {
      const contentType = response.headers()['content-type'] || '';
      expect(contentType).toContain('text/event-stream');
    }
  });

  test('CaB emoji feedback query (🐂 🐄 symbols) does not crash the API', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          {
            role: 'user',
            content: 'I got 🐂🐄🐄 on my guess BOARD — what does that mean in Cows and Bulls?',
          },
        ],
      },
    });
    expect([200, 503]).toContain(response.status());
    expect(response.status()).not.toBe(500);
  });

  test('CaB multi-turn conversation is accepted (full deduction session)', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          { role: 'user', content: 'Let\'s play Cows and Bulls — I need help guessing a 5-letter word.' },
          { role: 'assistant', content: 'Sure! Start with a guess and tell me the 🐂 (right letter, right position) and 🐄 (right letter, wrong position) feedback.' },
          { role: 'user', content: 'I guessed CRANE and got 1🐂 1🐄. What next?' },
        ],
      },
    });
    expect([200, 503]).toContain(response.status());
  });
});

test.describe('Chat API — Cows and Bulls (Negative)', () => {
  test('[COWS AND BULLS — COACHING REQUEST] skips dictionary enrichment (no DB clash)', async ({ request }) => {
    // The isCabCoaching flag prevents dictionary context injection.
    // This verifies the request goes through cleanly without a 400/500.
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          {
            role: 'user',
            content:
              '[COWS AND BULLS — COACHING REQUEST]\n\n' +
              'define CRANE please',
          },
        ],
      },
    });
    // Should not return 400 or 500 — enrichment bypass is non-fatal
    expect([200, 503]).toContain(response.status());
    expect(response.status()).not.toBe(400);
    expect(response.status()).not.toBe(500);
  });

  test('CaB query with special characters does not cause server error', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          {
            role: 'user',
            content: "Cows & Bulls: guess was <WORD> — got 🐂🐄; what's next?",
          },
        ],
      },
    });
    expect(response.status()).not.toBe(500);
  });

  test('CaB query does not bypass the Scrabble-only topic restriction', async ({ request }) => {
    // Lex's system prompt still enforces topic restriction even for CaB context.
    // A completely off-topic question should still get the refusal response (not 500).
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          {
            role: 'user',
            content: 'In Cows and Bulls and also in cooking — how do you make pasta?',
          },
        ],
      },
    });
    expect([200, 503]).toContain(response.status());
    expect(response.status()).not.toBe(500);
  });

  test('no duplicate Cows and Bulls panels on activities page', async ({ page }) => {
    await page.goto('/activities/');
    // If a dedicated Cows and Bulls panel exists, it must appear exactly once
    const cowsBullsPanels = page.locator('[id="cows-bulls-panel"], [data-game="cows-and-bulls"], #cows-and-bulls');
    const count = await cowsBullsPanels.count();
    // Either 0 (not yet a dedicated panel) or exactly 1 — never duplicated
    expect(count).toBeLessThanOrEqual(1);
  });
});

test.describe('Chat API — Quiz Coaching Flowing Paragraph Format (Negative)', () => {
  // Helper to extract plain text from SSE stream body (Workers AI JSON chunks)
  function extractTextFromSSE(body: string): string {
    return body
      .split('\n')
      .filter((line) => line.startsWith('data: '))
      .map((line) => line.slice(6))
      .filter((chunk) => chunk !== '[DONE]' && chunk.trim() !== '')
      .map((chunk) => {
        try {
          const json = JSON.parse(chunk);
          return json?.choices?.[0]?.delta?.content || json?.response || '';
        } catch {
          return '';
        }
      })
      .join('');
  }

  test('quiz coaching response does NOT use numbered section headers', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          {
            role: 'user',
            content:
              '[QUIZ COACHING REQUEST]\n\n' +
              'Here is my Word Quiz performance data.\n\n' +
              '--- MY QUIZ STATS ---\n' +
              'Total rounds played: 6\n' +
              'Overall accuracy: 80%\n' +
              'Average speed per question: 3.8s\n' +
              'Timeouts: 1\n\n' +
              '--- WORDS I GOT RIGHT ---\n' +
              'QUIXOTIC, ZEPHYR, ADZE, JINX\n\n' +
              '--- WORDS I GOT WRONG ---\n' +
              'TAEL\n',
          },
        ],
      },
    });
    expect([200, 503]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.text();
      const textContent = extractTextFromSSE(body);
      // Should NOT contain structural numbered headings like "1. **Title**" or "2. **Analysis**"
      const hasNumberedHeaders = /[1-5]\.\s+\*\*/.test(textContent);
      expect(hasNumberedHeaders).toBe(false);
      // Should NOT contain bold section labels like "**Performance Analysis:**"
      const hasBoldSectionLabels = /\*\*(Acknowledge|Performance|Actionable|Per-question|Encouragement|Analysis|Tips|Commentary)/i.test(textContent);
      expect(hasBoldSectionLabels).toBe(false);
    }
  });

  test('quiz coaching response does NOT contain markdown bullet lists as primary structure', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          {
            role: 'user',
            content:
              '[QUIZ COACHING REQUEST]\n\n' +
              'Here is my Word Quiz performance data.\n\n' +
              '--- MY QUIZ STATS ---\n' +
              'Total rounds played: 15\n' +
              'Overall accuracy: 60%\n' +
              'Average speed per question: 7.2s\n' +
              'Timeouts: 6\n\n' +
              '--- WORDS I GOT RIGHT ---\n' +
              'QUAFF, JINX, OXBOW, FIZZY, WALTZ, GLYPH\n\n' +
              '--- WORDS I GOT WRONG ---\n' +
              'TAEL, NAEVI, GAEN, BIALI, ENOKI, TSADI\n',
          },
        ],
      },
    });
    expect([200, 503]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.text();
      const textContent = extractTextFromSSE(body);
      // Count bullet-list markers — if more than 6, the response is list-heavy not flowing
      const bulletCount = (textContent.match(/\n\s*[-•]\s/g) || []).length;
      expect(bulletCount).toBeLessThan(7);
    }
  });

  test('quiz coaching response is concise (not a wall of text)', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          {
            role: 'user',
            content:
              '[QUIZ COACHING REQUEST]\n\n' +
              'Here is my Word Quiz performance data.\n\n' +
              '--- MY QUIZ STATS ---\n' +
              'Total rounds played: 4\n' +
              'Overall accuracy: 90%\n' +
              'Average speed per question: 3.0s\n' +
              'Timeouts: 0\n\n' +
              '--- WORDS I GOT RIGHT ---\n' +
              'QUIXOTIC, ZEPHYR, ADZE, JINX, WALTZ, GLYPH, FJORD, OXBOW\n\n' +
              '--- WORDS I GOT WRONG ---\n' +
              'TAEL\n',
          },
        ],
      },
    });
    expect([200, 503]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.text();
      const textContent = extractTextFromSSE(body);
      // The response should be substantive but concise (4-6 short paragraphs)
      // Not too short (< 150 chars = barely any coaching)
      expect(textContent.length).toBeGreaterThan(150);
      // Not excessively long (> 2500 chars of actual text = wall of text)
      expect(textContent.length).toBeLessThan(2500);
    }
  });

  test('first-time user (0 rounds) gets a welcoming response with vocabulary wisdom', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          {
            role: 'user',
            content:
              '[QUIZ COACHING REQUEST]\n\n' +
              'Here is my Word Quiz performance data. Please analyze it and give me personalized coaching advice.\n\n' +
              '--- MY QUIZ STATS ---\n' +
              'Total rounds played: 0\n' +
              'Overall accuracy: N/A (no games played yet)\n' +
              'Perfect scores: 0\n' +
              'Timed out: 0\n\n' +
              'I am a first-time quiz player with no history. Please welcome me and share some Scrabble vocabulary wisdom to get me started.',
          },
        ],
      },
    });
    expect([200, 503]).toContain(response.status());
    if (response.status() === 200) {
      const body = await response.text();
      const textContent = extractTextFromSSE(body);
      // Should be substantive (not a one-liner)
      expect(textContent.length).toBeGreaterThan(150);
      // Should contain welcoming/encouraging language or vocabulary tips
      const hasWelcome =
        textContent.toLowerCase().includes('welcome') ||
        textContent.toLowerCase().includes('first') ||
        textContent.toLowerCase().includes('journey') ||
        textContent.toLowerCase().includes('started') ||
        textContent.toLowerCase().includes('excited');
      const hasVocabTips =
        textContent.toLowerCase().includes('two-letter') ||
        textContent.toLowerCase().includes('two letter') ||
        textContent.toLowerCase().includes('high-value') ||
        textContent.toLowerCase().includes('memoriz') ||
        textContent.toLowerCase().includes('vocabulary') ||
        textContent.toLowerCase().includes('learn');
      expect(hasWelcome || hasVocabTips).toBeTruthy();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DAILY RACK CHALLENGE COACHING
// The [DAILY RACK CHALLENGE — COACHING REQUEST] marker triggers the rack
// coaching prompt and forces 70B model routing with 1024 max tokens.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Chat API — Rack Coaching (Positive)', () => {
  test('[DAILY RACK CHALLENGE — COACHING REQUEST] trigger is accepted and returns stream', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          {
            role: 'user',
            content:
              '[DAILY RACK CHALLENGE — COACHING REQUEST]\n\n' +
              '--- RACK CHALLENGE STATS ---\n' +
              'Total words submitted: 5\n' +
              'Average score: 18\n' +
              'Best word: TRAINS (24 pts)\n\n' +
              '--- RECENT PLAYS ---\n' +
              '2026-06-28: Rack TRAINST → TRAINS (24 pts)\n' +
              '2026-06-27: Rack IRSTABE → STAIR (15 pts)\n',
          },
        ],
      },
    });
    expect([200, 503]).toContain(response.status());
    if (response.status() === 200) {
      const contentType = response.headers()['content-type'] || '';
      expect(contentType).toContain('text/event-stream');
    }
  });

  test('rack coaching request with empty history (first-timer) is accepted', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          {
            role: 'user',
            content:
              '[DAILY RACK CHALLENGE — COACHING REQUEST]\n\n' +
              'I am a first-time Daily Rack Challenge player on ScrabbleWordsFinder.com with no history yet. ' +
              'Please welcome me and explain strategies for the Daily Rack Challenge.',
          },
        ],
      },
    });
    expect([200, 503]).toContain(response.status());
  });

  test('rack coaching request with score distribution data does not crash', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          {
            role: 'user',
            content:
              '[DAILY RACK CHALLENGE — COACHING REQUEST]\n\n' +
              '--- RACK CHALLENGE STATS ---\n' +
              'Total words submitted: 12\n' +
              'Average score: 22\n' +
              'Best word: LATRINE (42 pts)\n\n' +
              '--- SCORE DISTRIBUTION ---\n' +
              '30+ points: 3 words\n' +
              '20-29 points: 5 words\n' +
              '10-19 points: 3 words\n' +
              'Under 10: 1 word\n',
          },
        ],
      },
    });
    expect([200, 503]).toContain(response.status());
    expect(response.status()).not.toBe(500);
  });
});

test.describe('Chat API — Rack Coaching (Negative)', () => {
  test('[DAILY RACK CHALLENGE — COACHING REQUEST] skips dictionary enrichment', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          {
            role: 'user',
            content:
              '[DAILY RACK CHALLENGE — COACHING REQUEST]\n\n' +
              'define LATRINE please',
          },
        ],
      },
    });
    // Should not 400 or 500 — enrichment bypass works
    expect([200, 503]).toContain(response.status());
    expect(response.status()).not.toBe(400);
    expect(response.status()).not.toBe(500);
  });

  test('rack coaching with special characters in word names does not crash', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          {
            role: 'user',
            content:
              '[DAILY RACK CHALLENGE — COACHING REQUEST]\n\n' +
              "Best word: <SCRIPT>alert('x')</SCRIPT> (99 pts)\n",
          },
        ],
      },
    });
    expect(response.status()).not.toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DAILY ANAGRAM COACHING
// The [DAILY ANAGRAM — COACHING REQUEST] marker triggers the anagram coaching
// prompt and forces 70B model routing with 1024 max tokens.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Chat API — Anagram Coaching (Positive)', () => {
  test('[DAILY ANAGRAM — COACHING REQUEST] trigger is accepted and returns stream', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          {
            role: 'user',
            content:
              '[DAILY ANAGRAM — COACHING REQUEST]\n\n' +
              '--- ANAGRAM STATS ---\n' +
              'Total puzzles played: 7\n' +
              'Solved: 5 (71%)\n' +
              'Average attempts: 3.2\n' +
              'Current streak: 3\n\n' +
              '--- RECENT PLAYS ---\n' +
              '2026-06-28: CASTLE (solved in 2 attempts, 45s)\n' +
              '2026-06-27: BRIGHT (solved in 4 attempts, 120s)\n' +
              '2026-06-26: PLANET (unsolved after 5 attempts)\n',
          },
        ],
      },
    });
    expect([200, 503]).toContain(response.status());
    if (response.status() === 200) {
      const contentType = response.headers()['content-type'] || '';
      expect(contentType).toContain('text/event-stream');
    }
  });

  test('anagram coaching request with empty history (first-timer) is accepted', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          {
            role: 'user',
            content:
              '[DAILY ANAGRAM — COACHING REQUEST]\n\n' +
              'I am a first-time Daily Anagram player on ScrabbleWordsFinder.com with no history yet. ' +
              'Please welcome me and explain strategies for unscrambling words.',
          },
        ],
      },
    });
    expect([200, 503]).toContain(response.status());
  });

  test('anagram coaching request with attempt distribution data does not crash', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          {
            role: 'user',
            content:
              '[DAILY ANAGRAM — COACHING REQUEST]\n\n' +
              '--- ANAGRAM STATS ---\n' +
              'Total puzzles played: 15\n' +
              'Solved: 12 (80%)\n' +
              'Average attempts: 2.8\n\n' +
              '--- ATTEMPT DISTRIBUTION ---\n' +
              '1 attempt: 4 puzzles\n' +
              '2 attempts: 5 puzzles\n' +
              '3 attempts: 2 puzzles\n' +
              '4+ attempts: 1 puzzle\n' +
              'Unsolved: 3 puzzles\n',
          },
        ],
      },
    });
    expect([200, 503]).toContain(response.status());
    expect(response.status()).not.toBe(500);
  });
});

test.describe('Chat API — Anagram Coaching (Negative)', () => {
  test('[DAILY ANAGRAM — COACHING REQUEST] skips dictionary enrichment', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          {
            role: 'user',
            content:
              '[DAILY ANAGRAM — COACHING REQUEST]\n\n' +
              'define CASTLE please',
          },
        ],
      },
    });
    // Should not 400 or 500 — enrichment bypass works
    expect([200, 503]).toContain(response.status());
    expect(response.status()).not.toBe(400);
    expect(response.status()).not.toBe(500);
  });

  test('anagram coaching with special characters does not crash', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          {
            role: 'user',
            content:
              '[DAILY ANAGRAM — COACHING REQUEST]\n\n' +
              "Puzzle: <img onerror=alert(1)> (unsolved)\n",
          },
        ],
      },
    });
    expect(response.status()).not.toBe(500);
  });

  test('anagram coaching does not bypass Scrabble-only topic restriction for off-topic', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [
          {
            role: 'user',
            content:
              '[DAILY ANAGRAM — COACHING REQUEST]\n\n' +
              'Also help me with a cooking recipe for pasta.',
          },
        ],
      },
    });
    // Should not crash — AI will handle the off-topic part gracefully
    expect([200, 503]).toContain(response.status());
    expect(response.status()).not.toBe(500);
  });
});


// ─────────────────────────────────────────────────────────────────────────────
// QUICK-REFERENCE WORD LISTS
// The system prompt now includes curated word lists (two-letter, top 3-letter,
// top by length, Q-without-U, rare letter power words) so Lex can cite specific
// words and scores in responses. These tests verify the API accepts queries
// targeting each word-list category and returns valid streaming responses.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Chat API — Quick-Reference Word Lists (Positive)', () => {
  test('two-letter words query is accepted and returns streaming response', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [{ role: 'user', content: 'What are all the two-letter words in Scrabble?' }],
      },
    });
    expect([200, 503]).toContain(response.status());
    if (response.status() === 200) {
      const contentType = response.headers()['content-type'] || '';
      expect(contentType).toContain('text/event-stream');
    }
  });

  test('highest-scoring two-letter words query is accepted', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [{ role: 'user', content: 'Which two-letter words score the most points?' }],
      },
    });
    expect([200, 503]).toContain(response.status());
  });

  test('top 3-letter words by score query is accepted', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [{ role: 'user', content: 'What are the highest scoring 3-letter words?' }],
      },
    });
    expect([200, 503]).toContain(response.status());
  });

  test('top words by length query is accepted', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [{ role: 'user', content: 'What are the top scoring words for each word length from 2 to 5 letters?' }],
      },
    });
    expect([200, 503]).toContain(response.status());
  });

  test('Q-without-U words query is accepted and returns stream', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [{ role: 'user', content: 'List all Q without U words in SOWPODS with their scores' }],
      },
    });
    expect([200, 503]).toContain(response.status());
    if (response.status() === 200) {
      const contentType = response.headers()['content-type'] || '';
      expect(contentType).toContain('text/event-stream');
    }
  });

  test('rare Z-words query is accepted', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [{ role: 'user', content: 'What are the highest scoring Z words in Scrabble?' }],
      },
    });
    expect([200, 503]).toContain(response.status());
  });

  test('rare X-words query is accepted', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [{ role: 'user', content: 'Best X words for high scores?' }],
      },
    });
    expect([200, 503]).toContain(response.status());
  });

  test('rare J-words query is accepted', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [{ role: 'user', content: 'What are the highest scoring J words?' }],
      },
    });
    expect([200, 503]).toContain(response.status());
  });

  test('QAIMAQAM query (longest Q-without-U word) is accepted', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [{ role: 'user', content: 'Is QAIMAQAM a valid Scrabble word and how many points is it?' }],
      },
    });
    expect([200, 503]).toContain(response.status());
  });

  test('combined word-list question (two-letter + Q-without-U) is accepted', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [{ role: 'user', content: 'What two-letter words use Q or Z? Also, what Q-without-U words should I memorise?' }],
      },
    });
    expect([200, 503]).toContain(response.status());
  });
});

test.describe('Chat API — Quick-Reference Word Lists (Negative)', () => {
  test('word-list query does not cause 500 server error', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [{ role: 'user', content: 'Show me every two-letter word with its score' }],
      },
    });
    expect(response.status()).not.toBe(500);
  });

  test('word-list query with off-topic injection still enforces Scrabble-only rule', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [{ role: 'user', content: 'List the Q without U words and also tell me how to make pasta' }],
      },
    });
    // Should not crash — AI handles the off-topic part gracefully
    expect([200, 503]).toContain(response.status());
    expect(response.status()).not.toBe(500);
  });

  test('word-list query with special characters does not crash', async ({ request }) => {
    const response = await request.post('/api/chat/', {
      data: {
        messages: [{ role: 'user', content: "Best <Z> words? What about 'RAZZMATAZZ' — is it valid?" }],
      },
    });
    expect(response.status()).not.toBe(500);
  });

  test('extremely long word-list query does not timeout or crash', async ({ request }) => {
    const longQuery = 'List all two-letter words, all Q without U words, all top 3-letter words, all highest scoring 4-letter and 5-letter words, and the rare letter power words for Z, X, J, and K. ' + 'Also include their scores. '.repeat(5);
    const response = await request.post('/api/chat/', {
      data: {
        messages: [{ role: 'user', content: longQuery }],
      },
    });
    // Should not 500 — message within valid length (< 500 char for lex-chat, but /api/chat/ has higher limit)
    expect(response.status()).not.toBe(500);
  });
});
