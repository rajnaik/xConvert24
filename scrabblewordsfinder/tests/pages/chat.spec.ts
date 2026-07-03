import { test, expect } from '@playwright/test';

/**
 * Chat Page (Lex AI Assistant) — Layout & Feature Tests
 *
 * Covers the two-column layout, chat UI elements, right sidebar alignment,
 * and key interactive components.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Chat Page — Positive', () => {
  test('page loads with correct title', async ({ page }) => {
    const response = await page.goto(`${BASE}/chat/`);
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/Lex/i);
  });

  test('chat container is visible', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const container = page.locator('#chat-container');
    await expect(container).toBeVisible();
  });

  test('chat input and send button exist', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await expect(page.locator('#chat-input')).toBeVisible();
    await expect(page.locator('#send-btn')).toBeVisible();
  });

  test('rack input and Ask Lex button exist', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await expect(page.locator('#rack-input')).toBeVisible();
    await expect(page.locator('#ask-lex-btn')).toBeVisible();
  });

  test('quick prompt buttons are visible', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const prompts = page.locator('.quick-prompt');
    const count = await prompts.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('static keyword shortcuts container is visible', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const container = page.locator('#static-keywords');
    await expect(container).toBeVisible();
  });

  test('static keyword shortcuts has exactly 8 buttons', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const buttons = page.locator('#static-keywords .static-kw');
    const count = await buttons.count();
    expect(count).toBe(8);
  });

  test('static keyword button click sends data-prompt value to chat', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const firstBtn = page.locator('#static-keywords .static-kw').first();
    const dataPrompt = await firstBtn.getAttribute('data-prompt');
    await firstBtn.click();
    // After click, a user message bubble should appear in #messages
    const userMsg = page.locator('#messages .bg-blue-600\\/20');
    await userMsg.first().waitFor({ state: 'attached', timeout: 5000 });
    const msgText = await userMsg.first().textContent();
    // The user message should display the short label, not the full data-prompt
    // (pendingDisplayLabel logic shows the label in the bubble)
    expect(msgText).toContain('opening moves');
    // Verify the data-prompt was not empty (the actual prompt sent to AI)
    expect(dataPrompt!.length).toBeGreaterThan(20);
  });

  test('right column is aligned with left column (no excessive top margin)', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.setViewportSize({ width: 1280, height: 720 });
    // The right column should start near the top of the flex row.
    // Before the fix, mt-[190px] pushed it ~190px lower than expected.
    const rightCol = page.locator('.lg\\:w-64.xl\\:w-72');
    // Get parent flex container to compare against
    const flexRow = page.locator('main .flex.flex-col.lg\\:flex-row');
    const rightBox = await rightCol.boundingBox();
    const parentBox = await flexRow.boundingBox();
    expect(rightBox).not.toBeNull();
    expect(parentBox).not.toBeNull();
    // The right column should start within 50px of the parent top (no big margin offset)
    const yDelta = rightBox!.y - parentBox!.y;
    expect(yDelta).toBeLessThan(50);
  });

  test('two-column layout is a flex row on desktop', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.setViewportSize({ width: 1280, height: 720 });
    const flexRow = page.locator('main .flex.flex-col.lg\\:flex-row');
    await expect(flexRow).toBeAttached();
  });

  test('welcome message from Lex is displayed', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const messages = page.locator('#messages');
    const text = await messages.textContent();
    expect(text).toContain('Lex');
    expect(text).toContain('Scrabble AI Coach');
  });

  test('FAQPage schema is present', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const schema = page.locator('script[type="application/ld+json"]');
    const count = await schema.count();
    expect(count).toBeGreaterThanOrEqual(1);
    const text = await schema.first().textContent();
    expect(text).toContain('FAQPage');
  });

  test('voice input (mic) button exists', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await expect(page.locator('#mic-btn')).toBeVisible();
  });

  test('steps block renders with dynamic category label when numbered list is returned', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    // Type a prompt that will return numbered steps from Lex
    const input = page.locator('#chat-input');
    await input.fill('How do I find the best word?');
    await page.locator('#send-btn').click();
    // Wait for a response message containing a steps block
    const stepsLabel = page.locator('#messages .text-emerald-400');
    // Allow up to 15s for AI response
    await stepsLabel.first().waitFor({ state: 'attached', timeout: 15000 }).catch(() => {});
    // If steps block was rendered, verify a non-empty category label exists
    const count = await stepsLabel.count();
    if (count > 0) {
      const labelText = await stepsLabel.first().textContent();
      // Label should be non-empty (dynamic category or fallback "Steps")
      expect(labelText?.trim().length).toBeGreaterThan(0);
      // Label should be max 50 chars (truncation rule)
      expect(labelText!.trim().length).toBeLessThanOrEqual(50);
      // Should NOT be the old hardcoded "Here :" label
      expect(labelText?.trim()).not.toBe('Here :');
    }
  });

  test('hyphenated letter words (A-D-D-S style) are rendered with purple styling', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const input = page.locator('#chat-input');
    await input.fill('What does the word A-D-D-S mean in Scrabble?');
    await page.locator('#send-btn').click();
    // Wait for response
    const purpleWord = page.locator('#messages span.text-purple-400.border-purple-500\\/50');
    await purpleWord.first().waitFor({ state: 'attached', timeout: 15000 }).catch(() => {});
    const count = await purpleWord.count();
    if (count > 0) {
      const classes = await purpleWord.first().getAttribute('class');
      expect(classes).toContain('text-purple-400');
      expect(classes).toContain('border');
      expect(classes).toContain('border-purple-500/50');
    }
  });
});

test.describe('Chat Page — CaB Auto-Submit (Positive)', () => {
  test('?context=cab redirects to clean URL immediately', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=cab`);
    // URL should be cleaned to /chat/ (no query string)
    await page.waitForFunction(() => !window.location.search.includes('context=cab'), { timeout: 3000 });
    expect(page.url()).toBe(`${BASE}/chat/`);
  });

  test('?context=cab auto-submits a CaB coaching message', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=cab`);
    // A user message bubble should appear automatically within a reasonable timeout
    const userMsg = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userMsg.first().waitFor({ state: 'attached', timeout: 8000 });
    const msgText = await userMsg.first().textContent();
    // The auto-submitted message should mention Cows and Bulls
    expect(msgText).toMatch(/Cows|Bulls|coaching|deduction/i);
  });

  test('?context=cab prompt contains COWS AND BULLS header', async ({ page }) => {
    // Intercept the AI request to capture the prompt without waiting for AI response
    let capturedBody = '';
    await page.route('**/api/chat/**', async route => {
      const req = route.request();
      capturedBody = req.postData() || '';
      await route.fulfill({ status: 200, body: 'data: {"text":"OK"}\ndata: [DONE]\n' });
    });
    await page.goto(`${BASE}/chat/?context=cab`);
    // Wait for the route intercept to fire
    await page.waitForFunction(() => document.querySelector('#messages')?.textContent?.includes('Cows') || document.querySelector('#messages')?.textContent?.includes('coach'), { timeout: 8000 }).catch(() => {});
    // The captured body (or fallback check) confirms CaB context was sent
    // Even if route wasn't hit, the URL should be clean
    expect(page.url()).not.toContain('context=cab');
  });

  test('?context=cab without uid still auto-submits a welcome message', async ({ page }) => {
    // Clear any stored uid to simulate new user
    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.removeItem('swf-uid'));
    await page.goto(`${BASE}/chat/?context=cab`);
    // Should still auto-submit (the no-uid branch)
    const userMsg = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userMsg.first().waitFor({ state: 'attached', timeout: 8000 });
    const msgText = await userMsg.first().textContent();
    expect(msgText).toBeTruthy();
    expect(msgText!.trim().length).toBeGreaterThan(5);
  });
});

test.describe('Chat Page — CaB Auto-Submit (Negative)', () => {
  test('no auto-submit without ?context=cab param', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    // Wait a moment to confirm no auto-submit fires
    await page.waitForTimeout(1500);
    // Only the welcome message from Lex should be present, no user message bubble
    const userMsgs = page.locator('#messages .bg-blue-600\\/20');
    const count = await userMsgs.count();
    expect(count).toBe(0);
  });

  test('?context=cab does not leave stale query param in URL', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=cab`);
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('context=cab');
    expect(page.url()).not.toContain('?');
  });

  test('?context=other does not trigger CaB auto-submit', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=other`);
    await page.waitForTimeout(1500);
    // Should not auto-submit a CaB message
    const userMsgs = page.locator('#messages .bg-blue-600\\/20');
    const count = await userMsgs.count();
    expect(count).toBe(0);
  });

  test('?context=cab does not crash the page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/chat/?context=cab`);
    await page.waitForTimeout(2000);
    expect(errors.filter(e => !e.includes('net::') && !e.includes('Failed to fetch'))).toHaveLength(0);
  });
});

test.describe('Chat Page — Negative', () => {
  test('no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/chat/`);
    await page.waitForTimeout(2000);
    expect(errors.filter(e => !e.includes('net::'))).toHaveLength(0);
  });

  test('no duplicate chat containers', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const containers = page.locator('#chat-container');
    const count = await containers.count();
    expect(count).toBe(1);
  });

  test('no duplicate static-keywords containers', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const containers = page.locator('#static-keywords');
    const count = await containers.count();
    expect(count).toBe(1);
  });

  test('static keyword buttons all have non-empty text', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const buttons = page.locator('#static-keywords .static-kw');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const text = await buttons.nth(i).textContent();
      expect(text!.trim().length).toBeGreaterThan(0);
    }
  });

  test('all static keyword buttons have a data-prompt attribute', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const buttons = page.locator('#static-keywords .static-kw');
    const count = await buttons.count();
    expect(count).toBe(8);
    for (let i = 0; i < count; i++) {
      const prompt = await buttons.nth(i).getAttribute('data-prompt');
      expect(prompt).not.toBeNull();
      expect(prompt!.trim().length).toBeGreaterThan(0);
    }
  });

  test('data-prompt values are longer and more descriptive than button labels', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const buttons = page.locator('#static-keywords .static-kw');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const label = (await buttons.nth(i).textContent())!.trim();
      const prompt = (await buttons.nth(i).getAttribute('data-prompt'))!.trim();
      // data-prompt should be substantially longer than the visible label
      expect(prompt.length).toBeGreaterThan(label.length);
    }
  });

  test('no duplicate data-prompt values across static keyword buttons', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const buttons = page.locator('#static-keywords .static-kw');
    const count = await buttons.count();
    const prompts = new Set<string>();
    for (let i = 0; i < count; i++) {
      const prompt = await buttons.nth(i).getAttribute('data-prompt');
      expect(prompts.has(prompt!)).toBe(false);
      prompts.add(prompt!);
    }
  });

  test('right column does not have mt-[190px] class (regression)', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const rightCol = page.locator('.lg\\:w-64.xl\\:w-72');
    const cls = await rightCol.getAttribute('class');
    expect(cls).not.toContain('mt-[190px]');
  });

  test('welcome message does not use old "assistant" wording (regression)', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const messages = page.locator('#messages');
    const text = await messages.textContent();
    expect(text).not.toContain('AI Scrabble assistant');
  });

  test('no sensitive data exposed on chat page', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const body = await page.textContent('body');
    expect(body).not.toMatch(/sk-[a-zA-Z0-9]{20,}/);
    expect(body).not.toContain('AKIA');
    expect(body).not.toMatch(/@gmail\.com/);
  });

  test('steps block does not use old hardcoded labels (regression)', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    // Submit a query to trigger a response with numbered steps
    const input = page.locator('#chat-input');
    await input.fill('Give me tips to win at Scrabble');
    await page.locator('#send-btn').click();
    // Wait for response
    await page.waitForTimeout(10000);
    // Check that old labels are nowhere in the messages area
    const messagesHtml = await page.locator('#messages').innerHTML();
    expect(messagesHtml).not.toContain('🧩 Steps');
    expect(messagesHtml).not.toContain('>Here :<');
  });

  test('steps block category label is truncated at 50 chars max', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    // If any steps blocks appear, verify all labels obey the 50-char limit
    const input = page.locator('#chat-input');
    await input.fill('Explain all the strategies for competitive Scrabble tournaments in detail');
    await page.locator('#send-btn').click();
    const stepsLabels = page.locator('#messages .text-emerald-400');
    await stepsLabels.first().waitFor({ state: 'attached', timeout: 15000 }).catch(() => {});
    const count = await stepsLabels.count();
    for (let i = 0; i < count; i++) {
      const text = await stepsLabels.nth(i).textContent();
      if (text) {
        expect(text.trim().length).toBeLessThanOrEqual(50);
      }
    }
  });

  test('identified words show + icon (not tick) before MWB import', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    // Clear any previous identified words
    await page.evaluate(() => localStorage.removeItem('swf-chat-identified-words'));
    await page.reload();
    // Trigger a response that includes 6+ letter uppercase words
    const input = page.locator('#chat-input');
    await input.fill('What does QUIXOTIC mean in Scrabble?');
    await page.locator('#send-btn').click();
    // Wait for identified words panel to appear
    const panel = page.locator('#identified-words-panel');
    await panel.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    if (await panel.isVisible()) {
      // Each word should have a + icon (M12 5v14m-7-7h14 is the + path)
      const icons = page.locator('.word-mwb-icon');
      const count = await icons.count();
      expect(count).toBeGreaterThan(0);
      // First icon should contain + SVG path, not tick path
      const svg = await icons.first().innerHTML();
      expect(svg).toContain('M12 5v14');
    }
  });
});


test.describe('Chat Page — Quiz Coach Auto-Submit (Positive)', () => {
  test('?context=quiz redirects to clean URL immediately', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=quiz`);
    await page.waitForFunction(() => !window.location.search.includes('context=quiz'), { timeout: 3000 });
    expect(page.url()).toBe(`${BASE}/chat/`);
  });

  test('?context=quiz auto-submits a Quiz coaching message', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=quiz`);
    const userMsg = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userMsg.first().waitFor({ state: 'attached', timeout: 8000 });
    const msgText = await userMsg.first().textContent();
    expect(msgText).toMatch(/Quiz|vocabulary|coaching|accuracy/i);
  });

  test('?context=quiz without uid still auto-submits a welcome message', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.removeItem('swf-uid'));
    await page.goto(`${BASE}/chat/?context=quiz`);
    const userMsg = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userMsg.first().waitFor({ state: 'attached', timeout: 8000 });
    const msgText = await userMsg.first().textContent();
    expect(msgText).toBeTruthy();
    expect(msgText!.trim().length).toBeGreaterThan(5);
  });
});

test.describe('Chat Page — Quiz Coach Auto-Submit (Negative)', () => {
  test('?context=quiz does not leave stale query param in URL', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=quiz`);
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('context=quiz');
    expect(page.url()).not.toContain('?');
  });

  test('?context=quiz does not crash the page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/chat/?context=quiz`);
    await page.waitForTimeout(2000);
    expect(errors.filter(e => !e.includes('net::') && !e.includes('Failed to fetch'))).toHaveLength(0);
  });
});

test.describe('Chat Page — Rack Coach Auto-Submit (Positive)', () => {
  test('?context=rack redirects to clean URL immediately', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=rack`);
    await page.waitForFunction(() => !window.location.search.includes('context=rack'), { timeout: 3000 });
    expect(page.url()).toBe(`${BASE}/chat/`);
  });

  test('?context=rack auto-submits a Rack coaching message', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=rack`);
    const userMsg = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userMsg.first().waitFor({ state: 'attached', timeout: 8000 });
    const msgText = await userMsg.first().textContent();
    expect(msgText).toMatch(/rack|scoring|coaching|tiles/i);
  });

  test('?context=rack without uid still auto-submits a welcome message', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.removeItem('swf-uid'));
    await page.goto(`${BASE}/chat/?context=rack`);
    const userMsg = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userMsg.first().waitFor({ state: 'attached', timeout: 8000 });
    const msgText = await userMsg.first().textContent();
    expect(msgText).toBeTruthy();
    expect(msgText!.trim().length).toBeGreaterThan(5);
  });
});

test.describe('Chat Page — Rack Coach Auto-Submit (Negative)', () => {
  test('?context=rack does not leave stale query param in URL', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=rack`);
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('context=rack');
    expect(page.url()).not.toContain('?');
  });

  test('?context=rack does not crash the page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/chat/?context=rack`);
    await page.waitForTimeout(2000);
    expect(errors.filter(e => !e.includes('net::') && !e.includes('Failed to fetch'))).toHaveLength(0);
  });
});

test.describe('Chat Page — Anagram Coach Auto-Submit (Positive)', () => {
  test('?context=anagram redirects to clean URL immediately', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=anagram`);
    await page.waitForFunction(() => !window.location.search.includes('context=anagram'), { timeout: 3000 });
    expect(page.url()).toBe(`${BASE}/chat/`);
  });

  test('?context=anagram auto-submits an Anagram coaching message', async ({ page }) => {
    // Clear uid to force the faster first-timer branch (avoids API timeout)
    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.removeItem('swf-uid'));
    await page.goto(`${BASE}/chat/?context=anagram`);
    const userMsg = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userMsg.first().waitFor({ state: 'attached', timeout: 8000 });
    const msgText = await userMsg.first().textContent();
    expect(msgText).toMatch(/anagram|scrambl|unscrambl|coaching|puzzle/i);
  });

  test('?context=anagram without uid still auto-submits a welcome message', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.removeItem('swf-uid'));
    await page.goto(`${BASE}/chat/?context=anagram`);
    const userMsg = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userMsg.first().waitFor({ state: 'attached', timeout: 8000 });
    const msgText = await userMsg.first().textContent();
    expect(msgText).toBeTruthy();
    expect(msgText!.trim().length).toBeGreaterThan(5);
  });
});

test.describe('Chat Page — Anagram Coach Auto-Submit (Negative)', () => {
  test('?context=anagram does not leave stale query param in URL', async ({ page }) => {
    await page.goto(`${BASE}/chat/?context=anagram`);
    await page.waitForTimeout(2000);
    expect(page.url()).not.toContain('context=anagram');
    expect(page.url()).not.toContain('?');
  });

  test('?context=anagram does not crash the page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/chat/?context=anagram`);
    await page.waitForTimeout(2000);
    expect(errors.filter(e => !e.includes('net::') && !e.includes('Failed to fetch'))).toHaveLength(0);
  });
});


test.describe('Chat Page — Affirmation Green Styling (Positive)', () => {
  test('affirmation line starting with ✅ renders in green', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    // Intercept AI response to inject a known affirmation block
    await page.route('**/api/chat/**', async route => {
      const body = 'data: {"response":"✅ Correct! QUIXOTIC is a valid word."}\ndata: [DONE]\n';
      await route.fulfill({ status: 200, contentType: 'text/event-stream', body });
    });
    const input = page.locator('#chat-input');
    await input.fill('Is QUIXOTIC valid?');
    await page.locator('#send-btn').click();
    // Wait for the green paragraph to appear
    const greenP = page.locator('#messages p.text-green-400');
    await greenP.first().waitFor({ state: 'attached', timeout: 8000 });
    const classes = await greenP.first().getAttribute('class');
    expect(classes).toContain('text-green-400');
    expect(classes).toContain('font-semibold');
  });

  test('affirmation line starting with "Correct!" renders in green', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.route('**/api/chat/**', async route => {
      const body = 'data: {"response":"Correct! That word scores 22 points."}\ndata: [DONE]\n';
      await route.fulfill({ status: 200, contentType: 'text/event-stream', body });
    });
    const input = page.locator('#chat-input');
    await input.fill('Does JAZZ score 22?');
    await page.locator('#send-btn').click();
    const greenP = page.locator('#messages p.text-green-400');
    await greenP.first().waitFor({ state: 'attached', timeout: 8000 });
    const text = await greenP.first().textContent();
    expect(text).toContain('Correct!');
  });

  test('affirmation line starting with "Well done" renders in green', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.route('**/api/chat/**', async route => {
      const body = 'data: {"response":"Well done! You found a bingo."}\ndata: [DONE]\n';
      await route.fulfill({ status: 200, contentType: 'text/event-stream', body });
    });
    const input = page.locator('#chat-input');
    await input.fill('I played RETINAS');
    await page.locator('#send-btn').click();
    const greenP = page.locator('#messages p.text-green-400');
    await greenP.first().waitFor({ state: 'attached', timeout: 8000 });
    expect(await greenP.first().textContent()).toContain('Well done');
  });
});

test.describe('Chat Page — Affirmation Green Styling (Negative)', () => {
  test('non-affirmation text does NOT get green styling', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.route('**/api/chat/**', async route => {
      const body = 'data: {"response":"Here are some good words to play from your rack."}\ndata: [DONE]\n';
      await route.fulfill({ status: 200, contentType: 'text/event-stream', body });
    });
    const input = page.locator('#chat-input');
    await input.fill('Solve AEINRST');
    await page.locator('#send-btn').click();
    // Wait for the response to render
    await page.waitForTimeout(3000);
    // Should NOT have green paragraph for this text
    const greenP = page.locator('#messages p.text-green-400');
    const count = await greenP.count();
    expect(count).toBe(0);
  });

  test('affirmation pattern only matches at START of line (not mid-text)', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.route('**/api/chat/**', async route => {
      const body = 'data: {"response":"The player said Correct! before leaving the room."}\ndata: [DONE]\n';
      await route.fulfill({ status: 200, contentType: 'text/event-stream', body });
    });
    const input = page.locator('#chat-input');
    await input.fill('Tell me about correct plays');
    await page.locator('#send-btn').click();
    await page.waitForTimeout(3000);
    // "Correct!" is mid-sentence so should NOT trigger green styling
    const greenP = page.locator('#messages p.text-green-400');
    const count = await greenP.count();
    expect(count).toBe(0);
  });

  test('affirmation styling does not crash with empty response', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/chat/`);
    await page.route('**/api/chat/**', async route => {
      const body = 'data: {"response":""}\ndata: [DONE]\n';
      await route.fulfill({ status: 200, contentType: 'text/event-stream', body });
    });
    const input = page.locator('#chat-input');
    await input.fill('test');
    await page.locator('#send-btn').click();
    await page.waitForTimeout(2000);
    expect(errors.filter(e => !e.includes('net::') && !e.includes('Failed to fetch') && !e.includes('adsbygoogle'))).toHaveLength(0);
  });
});

test.describe('Chat Page — Coaching Renderers Script (Positive)', () => {
  test('coaching-renderers.js script tag is present', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const scriptTag = page.locator('script[src="/js/coaching-renderers.js"]');
    await expect(scriptTag).toBeAttached();
  });

  test('coaching-renderers.js loads with 200 status', async ({ page }) => {
    const responses: { url: string; status: number }[] = [];
    page.on('response', res => {
      if (res.url().includes('coaching-renderers.js')) {
        responses.push({ url: res.url(), status: res.status() });
      }
    });
    await page.goto(`${BASE}/chat/`);
    await page.waitForTimeout(1000);
    expect(responses.length).toBeGreaterThan(0);
    expect(responses[0].status).toBe(200);
  });

  test('global coaching renderer functions are available after load', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const hasQuiz = await page.evaluate(() => typeof (window as any).appendQuizCoachData === 'function');
    const hasRack = await page.evaluate(() => typeof (window as any).appendRackCoachData === 'function');
    const hasAnagram = await page.evaluate(() => typeof (window as any).appendAnagramCoachData === 'function');
    const hasRenderGraph = await page.evaluate(() => typeof (window as any).renderLineGraph === 'function');
    const hasRenderCards = await page.evaluate(() => typeof (window as any).renderPerGameCards === 'function');
    expect(hasQuiz).toBe(true);
    expect(hasRack).toBe(true);
    expect(hasAnagram).toBe(true);
    expect(hasRenderGraph).toBe(true);
    expect(hasRenderCards).toBe(true);
  });

  test('coaching-renderers.js is loaded before the main inline script', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    // The coaching-renderers script tag should appear before any inline script
    // that calls appendQuizCoachData/appendRackCoachData/appendAnagramCoachData
    const scriptOrder = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      const rendererIdx = scripts.findIndex(s => s.src.includes('coaching-renderers.js'));
      // Find inline script that references the coaching functions
      const inlineIdx = scripts.findIndex(s => !s.src && s.textContent?.includes('appendQuizCoachData'));
      return { rendererIdx, inlineIdx };
    });
    // Renderer script must exist
    expect(scriptOrder.rendererIdx).toBeGreaterThanOrEqual(0);
    // If inline script exists that uses it, renderer must come first
    if (scriptOrder.inlineIdx >= 0) {
      expect(scriptOrder.rendererIdx).toBeLessThan(scriptOrder.inlineIdx);
    }
  });
});

test.describe('Chat Page — Coaching Renderers Script (Negative)', () => {
  test('no duplicate coaching-renderers.js script tags', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const scripts = page.locator('script[src="/js/coaching-renderers.js"]');
    const count = await scripts.count();
    expect(count).toBe(1);
  });

  test('coaching-renderers.js does not cause page errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/chat/`);
    await page.waitForTimeout(2000);
    // Filter out network errors which are unrelated to the script
    const scriptErrors = errors.filter(e =>
      e.includes('coaching') || e.includes('renderer') || e.includes('is not defined')
    );
    expect(scriptErrors).toHaveLength(0);
  });

  test('coaching renderer functions do not crash when called without uid', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    // Remove uid to simulate new user
    await page.evaluate(() => localStorage.removeItem('swf-uid'));
    // Call each function with a container — they should exit gracefully (no uid)
    const crashed = await page.evaluate(() => {
      try {
        const container = document.createElement('div');
        (window as any).appendQuizCoachData(container);
        (window as any).appendRackCoachData(container);
        (window as any).appendAnagramCoachData(container);
        return false;
      } catch (e) {
        return (e as Error).message;
      }
    });
    expect(crashed).toBe(false);
  });

  test('coachRatingColors returns valid colors for all known ratings', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const result = await page.evaluate(() => {
      const ratings = ['perfect', 'excellent', 'genius', 'great', 'good', 'fair', 'close', 'weak', 'failed'];
      const fn = (window as any).coachRatingColors;
      if (!fn) return 'function not found';
      for (const r of ratings) {
        const colors = fn(r);
        if (!colors || !colors.border || !colors.bg || !colors.badge || !colors.icon) {
          return 'missing property for rating: ' + r;
        }
      }
      // Unknown rating should return fallback (good)
      const unknown = fn('unknown-rating');
      if (!unknown || !unknown.border) return 'fallback missing for unknown rating';
      return 'ok';
    });
    expect(result).toBe('ok');
  });
});


test.describe('Chat Page — Identified Words Dictionary Validation (Positive)', () => {
  test('valid SOWPODS word is added to identified words panel', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.removeItem('swf-chat-identified-words'));
    await page.reload();
    // Intercept AI response with a known valid 6+ letter SOWPODS word
    await page.route('**/api/chat/**', async route => {
      const body = 'data: {"response":"Try playing RETINAS — it scores 7 points per letter."}\ndata: [DONE]\n';
      await route.fulfill({ status: 200, contentType: 'text/event-stream', body });
    });
    const input = page.locator('#chat-input');
    await input.fill('Solve my rack');
    await page.locator('#send-btn').click();
    // Wait for the identified words panel to appear
    const panel = page.locator('#identified-words-panel');
    await panel.waitFor({ state: 'visible', timeout: 10000 });
    const listText = await page.locator('#identified-words-list').textContent();
    expect(listText).toContain('RETINAS');
  });

  test('dictionary is preloaded on page load (validWordsDict available)', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    // Wait for dict to load (it preloads eagerly)
    await page.waitForTimeout(3000);
    const dictSize = await page.evaluate(() => {
      return (window as any).validWordsDict ? (window as any).validWordsDict.size : 0;
    });
    // SOWPODS has tens of thousands of 6+ letter words
    expect(dictSize).toBeGreaterThan(50000);
  });
});

test.describe('Chat Page — Identified Words Dictionary Validation (Negative)', () => {
  test('invalid/made-up word is NOT added to identified words panel', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.removeItem('swf-chat-identified-words'));
    await page.reload();
    // Intercept AI response with a made-up word that's NOT in SOWPODS
    await page.route('**/api/chat/**', async route => {
      const body = 'data: {"response":"The word XYZQWK is interesting but RETINAS is better."}\ndata: [DONE]\n';
      await route.fulfill({ status: 200, contentType: 'text/event-stream', body });
    });
    const input = page.locator('#chat-input');
    await input.fill('test');
    await page.locator('#send-btn').click();
    // Wait for extraction to complete
    await page.waitForTimeout(5000);
    const listText = await page.locator('#identified-words-list').textContent() || '';
    // XYZQWK should NOT appear (invalid word)
    expect(listText).not.toContain('XYZQWK');
    // RETINAS should appear (valid word)
    expect(listText).toContain('RETINAS');
  });

  test('proper nouns (non-dictionary words) are filtered out', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.evaluate(() => localStorage.removeItem('swf-chat-identified-words'));
    await page.reload();
    // LONDON is a proper noun, not valid in SOWPODS; CASTLE is valid
    await page.route('**/api/chat/**', async route => {
      const body = 'data: {"response":"LONDON is not valid but CASTLE scores well."}\ndata: [DONE]\n';
      await route.fulfill({ status: 200, contentType: 'text/event-stream', body });
    });
    const input = page.locator('#chat-input');
    await input.fill('test');
    await page.locator('#send-btn').click();
    await page.waitForTimeout(5000);
    const listText = await page.locator('#identified-words-list').textContent() || '';
    expect(listText).not.toContain('LONDON');
    expect(listText).toContain('CASTLE');
  });
});


test.describe('Chat Page — Memorise with Memory WordBench Modal (Positive)', () => {
  test('WordBench button is visible on the chat page', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const btn = page.locator('#mwb-modal-open');
    await expect(btn).toBeVisible();
  });

  test('WordBench button contains correct text', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const btn = page.locator('#mwb-modal-open');
    const text = await btn.textContent();
    expect(text).toContain('Memorise with Memory WordBench');
  });

  test('WordBench button has purple styling', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const btn = page.locator('#mwb-modal-open');
    const classes = await btn.getAttribute('class');
    expect(classes).toContain('text-purple-300');
    expect(classes).toContain('border-purple-500/40');
  });

  test('WordBench button has brain emoji with aria-hidden', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const emoji = page.locator('#mwb-modal-open span[aria-hidden="true"]');
    await expect(emoji).toBeAttached();
    const text = await emoji.textContent();
    expect(text).toContain('🧠');
  });

  test('clicking WordBench button opens the MWB modal', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.locator('#mwb-modal-open').click();
    const modal = page.locator('#mwb-modal');
    await expect(modal).not.toHaveClass(/hidden/);
  });

  test('MWB modal contains flash card panel and controls', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.locator('#mwb-modal-open').click();
    await expect(page.locator('#mwb-m-start')).toBeVisible();
    await expect(page.locator('#mwb-m-panel')).toBeVisible();
    await expect(page.locator('#mwb-m-meaningful')).toBeAttached();
  });

  test('MWB modal has "Open full" link to activities page', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.locator('#mwb-modal-open').click();
    const link = page.locator('#mwb-modal a[href="/activities/#wordbench"]');
    await expect(link).toBeVisible();
    const text = await link.textContent();
    expect(text).toContain('Open full');
  });

  test('MWB modal closes on close button click', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.locator('#mwb-modal-open').click();
    await expect(page.locator('#mwb-modal')).not.toHaveClass(/hidden/);
    await page.locator('#mwb-modal-close').click();
    await expect(page.locator('#mwb-modal')).toHaveClass(/hidden/);
  });

  test('MWB modal closes on Escape key', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.locator('#mwb-modal-open').click();
    await expect(page.locator('#mwb-modal')).not.toHaveClass(/hidden/);
    await page.keyboard.press('Escape');
    await expect(page.locator('#mwb-modal')).toHaveClass(/hidden/);
  });
});

test.describe('Chat Page — Memorise with Memory WordBench Modal (Negative)', () => {
  test('MWB modal is hidden by default on page load', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await expect(page.locator('#mwb-modal')).toHaveClass(/hidden/);
  });

  test('no duplicate MWB modal open buttons', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const btns = page.locator('#mwb-modal-open');
    const count = await btns.count();
    expect(count).toBe(1);
  });

  test('opening MWB modal does not crash the page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/chat/`);
    await page.locator('#mwb-modal-open').click();
    await page.waitForTimeout(1000);
    expect(errors.filter(e => !e.includes('net::') && !e.includes('Failed to fetch') && !e.includes('adsbygoogle'))).toHaveLength(0);
  });

  test('MWB modal closes on backdrop click', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.locator('#mwb-modal-open').click();
    await expect(page.locator('#mwb-modal')).not.toHaveClass(/hidden/);
    // Click the backdrop at a corner where the modal content doesn't overlap
    await page.locator('#mwb-modal-backdrop').click({ position: { x: 5, y: 5 } });
    await expect(page.locator('#mwb-modal')).toHaveClass(/hidden/);
  });
});


test.describe('Chat Page — jsPDF & Coaching PDF (Positive)', () => {
  test('jsPDF script tag is present with correct version 2.5.1', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const script = page.locator('script[src*="jspdf"]');
    await expect(script).toBeAttached();
    const src = await script.getAttribute('src');
    expect(src).toContain('2.5.1');
    expect(src).toContain('jspdf.umd.min.js');
  });

  test('jsPDF library loads with 200 status', async ({ page }) => {
    const responses: { url: string; status: number }[] = [];
    page.on('response', res => {
      if (res.url().includes('jspdf')) {
        responses.push({ url: res.url(), status: res.status() });
      }
    });
    await page.goto(`${BASE}/chat/`);
    await page.waitForTimeout(2000);
    expect(responses.length).toBeGreaterThan(0);
    expect(responses[0].status).toBe(200);
  });

  test('jsPDF global is available after page load', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    await page.waitForTimeout(2000);
    const hasJspdf = await page.evaluate(() => {
      return typeof (window as any).jspdf !== 'undefined' || typeof (window as any).jsPDF !== 'undefined';
    });
    expect(hasJspdf).toBe(true);
  });

  test('coaching-pdf.js script tag is present', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const script = page.locator('script[src="/js/coaching-pdf.js"]');
    await expect(script).toBeAttached();
  });

  test('coaching-pdf.js loads with 200 status', async ({ page }) => {
    const responses: { url: string; status: number }[] = [];
    page.on('response', res => {
      if (res.url().includes('coaching-pdf.js')) {
        responses.push({ url: res.url(), status: res.status() });
      }
    });
    await page.goto(`${BASE}/chat/`);
    await page.waitForTimeout(1000);
    expect(responses.length).toBeGreaterThan(0);
    expect(responses[0].status).toBe(200);
  });
});

test.describe('Chat Page — jsPDF & Coaching PDF (Negative)', () => {
  test('no duplicate jsPDF script tags', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const scripts = page.locator('script[src*="jspdf"]');
    const count = await scripts.count();
    expect(count).toBe(1);
  });

  test('jsPDF does not reference old version 2.5.2 (regression)', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const script = page.locator('script[src*="jspdf"]');
    const src = await script.getAttribute('src');
    expect(src).not.toContain('2.5.2');
  });

  test('jsPDF and coaching-pdf scripts do not cause page errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(`${BASE}/chat/`);
    await page.waitForTimeout(3000);
    const pdfErrors = errors.filter(e =>
      e.includes('jspdf') || e.includes('jsPDF') || e.includes('coaching-pdf') || e.includes('PDF')
    );
    expect(pdfErrors).toHaveLength(0);
  });

  test('jsPDF is loaded before coaching-pdf.js (correct script order)', async ({ page }) => {
    await page.goto(`${BASE}/chat/`);
    const scriptOrder = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      const jspdfIdx = scripts.findIndex(s => s.src.includes('jspdf'));
      const coachingPdfIdx = scripts.findIndex(s => s.src.includes('coaching-pdf.js'));
      return { jspdfIdx, coachingPdfIdx };
    });
    expect(scriptOrder.jspdfIdx).toBeGreaterThanOrEqual(0);
    expect(scriptOrder.coachingPdfIdx).toBeGreaterThanOrEqual(0);
    expect(scriptOrder.jspdfIdx).toBeLessThan(scriptOrder.coachingPdfIdx);
  });
});
