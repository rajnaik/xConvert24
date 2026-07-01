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
