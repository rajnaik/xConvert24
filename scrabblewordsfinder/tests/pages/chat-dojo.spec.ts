import { test, expect } from '@playwright/test';

/**
 * Chat Page — Dojo Drill Buttons
 *
 * Tests the Word Dojo training drill buttons and the
 * random-next-drill instruction appended to each prompt.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Chat Page — Dojo Buttons (Positive)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE}/chat/`);
    // Enable Dojo Mode toggle to reveal the drill buttons
    const toggle = page.locator('#dojo-toggle');
    await toggle.check({ force: true });
    // Wait for buttons to become visible
    await page.locator('#dojo-buttons').waitFor({ state: 'visible', timeout: 3000 });
  });

  test('dojo buttons are present for all 4 drill types', async ({ page }) => {
    const dojoButtons = page.locator('.dojo-btn');
    const count = await dojoButtons.count();
    expect(count).toBe(4);
  });

  test('dojo buttons have correct data-dojo attributes', async ({ page }) => {
    const modes = ['bingo', 'hook', 'countdown', 'leave'];
    for (const mode of modes) {
      const btn = page.locator(`.dojo-btn[data-dojo="${mode}"]`);
      await expect(btn).toBeVisible();
    }
  });

  test('clicking a dojo button submits a message to chat', async ({ page }) => {
    // Intercept AI requests to prevent hanging
    await page.route('**/api/chat/**', async route => {
      await route.fulfill({ status: 200, contentType: 'text/event-stream', body: 'data: {"response":"Starting Bingo Trainer..."}\ndata: [DONE]\n' });
    });
    const bingoBtn = page.locator('.dojo-btn[data-dojo="bingo"]');
    await bingoBtn.click();
    // A user message bubble should appear
    const userMsg = page.locator('#messages .bg-blue-600\\/20, #messages [class*="bg-blue"]');
    await userMsg.first().waitFor({ state: 'attached', timeout: 5000 });
    const msgText = await userMsg.first().textContent();
    expect(msgText).toBeTruthy();
    expect(msgText!.trim().length).toBeGreaterThan(0);
  });

  test('dojo prompt includes random next-drill instruction', async ({ page }) => {
    let capturedBody = '';
    await page.route('**/api/chat/**', async route => {
      capturedBody = route.request().postData() || '';
      await route.fulfill({ status: 200, contentType: 'text/event-stream', body: 'data: {"response":"Starting drill..."}\ndata: [DONE]\n' });
    });
    const hookBtn = page.locator('.dojo-btn[data-dojo="hook"]');
    await hookBtn.click();
    await page.waitForTimeout(2000);
    // The captured request body should contain the random next-drill instruction
    expect(capturedBody).toContain('randomly pick a different drill type');
    expect(capturedBody).toContain('Bingo Trainer');
    expect(capturedBody).toContain('Hook Quiz');
    expect(capturedBody).toContain('Tile Countdown');
    expect(capturedBody).toContain('Rack Leave Drill');
  });

  test('each dojo mode sends its unique drill-specific prompt', async ({ page }) => {
    let capturedBody = '';
    await page.route('**/api/chat/**', async route => {
      capturedBody = route.request().postData() || '';
      await route.fulfill({ status: 200, contentType: 'text/event-stream', body: 'data: {"response":"OK"}\ndata: [DONE]\n' });
    });
    const countdownBtn = page.locator('.dojo-btn[data-dojo="countdown"]');
    await countdownBtn.click();
    await page.waitForTimeout(2000);
    expect(capturedBody).toContain('Tile Countdown');
    expect(capturedBody).toContain('remain in the bag');
    expect(capturedBody).toContain('randomly pick a different drill type');
  });
});

test.describe('Chat Page — Dojo Buttons (Negative)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${BASE}/chat/`);
  });

  test('dojo buttons are visible by default (dojo mode defaults to on)', async ({ page }) => {
    const dojoContainer = page.locator('#dojo-buttons');
    await expect(dojoContainer).toBeVisible();
  });

  test('no duplicate dojo buttons exist', async ({ page }) => {
    await page.locator('#dojo-toggle').check({ force: true });
    await page.locator('#dojo-buttons').waitFor({ state: 'visible', timeout: 3000 });
    const modes = ['bingo', 'hook', 'countdown', 'leave'];
    for (const mode of modes) {
      const btns = page.locator(`.dojo-btn[data-dojo="${mode}"]`);
      const count = await btns.count();
      expect(count).toBe(1);
    }
  });

  test('dojo button click does not crash the page', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.locator('#dojo-toggle').check({ force: true });
    await page.locator('#dojo-buttons').waitFor({ state: 'visible', timeout: 3000 });
    await page.route('**/api/chat/**', async route => {
      await route.fulfill({ status: 200, contentType: 'text/event-stream', body: 'data: {"response":"Drill started."}\ndata: [DONE]\n' });
    });
    const leaveBtn = page.locator('.dojo-btn[data-dojo="leave"]');
    await leaveBtn.click();
    await page.waitForTimeout(2000);
    expect(errors.filter(e => !e.includes('net::') && !e.includes('Failed to fetch') && !e.includes('adsbygoogle'))).toHaveLength(0);
  });

  test('dojo buttons all have visible non-empty text labels', async ({ page }) => {
    await page.locator('#dojo-toggle').check({ force: true });
    await page.locator('#dojo-buttons').waitFor({ state: 'visible', timeout: 3000 });
    const buttons = page.locator('.dojo-btn');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const text = await buttons.nth(i).textContent();
      expect(text!.trim().length).toBeGreaterThan(0);
    }
  });

  test('next-drill instruction explicitly says NOT to follow a preset order', async ({ page }) => {
    await page.locator('#dojo-toggle').check({ force: true });
    await page.locator('#dojo-buttons').waitFor({ state: 'visible', timeout: 3000 });
    let capturedBody = '';
    await page.route('**/api/chat/**', async route => {
      capturedBody = route.request().postData() || '';
      await route.fulfill({ status: 200, contentType: 'text/event-stream', body: 'data: {"response":"OK"}\ndata: [DONE]\n' });
    });
    const bingoBtn = page.locator('.dojo-btn[data-dojo="bingo"]');
    await bingoBtn.click();
    await page.waitForTimeout(2000);
    expect(capturedBody).toContain('Do NOT follow a preset order');
    expect(capturedBody).toContain('always pick the next exercise at random');
  });
});
