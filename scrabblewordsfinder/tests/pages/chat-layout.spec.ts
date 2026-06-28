import { test, expect } from '@playwright/test';

/**
 * Chat Page — Layout Structure Tests
 * Validates the wide two-column layout (max-w-6xl + flex row on lg breakpoint).
 * Changed from max-w-3xl single-column to max-w-6xl flex layout.
 */

test.describe('Chat Layout — Positive', () => {
  test('chat page main container uses max-w-6xl width', async ({ page }) => {
    await page.goto('/chat/');
    // The chat page's own <main> has mx-auto + max-w-6xl classes
    const chatMain = page.locator('main.mx-auto.max-w-6xl');
    await expect(chatMain).toBeVisible();
  });

  test('flex container exists for two-column layout', async ({ page }) => {
    await page.goto('/chat/');
    const chatMain = page.locator('main.mx-auto.max-w-6xl');
    const flexContainer = chatMain.locator('> div').first();
    await expect(flexContainer).toBeVisible();
    await expect(flexContainer).toHaveClass(/flex/);
    await expect(flexContainer).toHaveClass(/flex-col/);
  });

  test('flex container switches to row layout at lg breakpoint', async ({ page }) => {
    await page.goto('/chat/');
    const chatMain = page.locator('main.mx-auto.max-w-6xl');
    const flexContainer = chatMain.locator('> div').first();
    await expect(flexContainer).toHaveClass(/lg:flex-row/);
  });

  test('flex container has gap-6 spacing', async ({ page }) => {
    await page.goto('/chat/');
    const chatMain = page.locator('main.mx-auto.max-w-6xl');
    const flexContainer = chatMain.locator('> div').first();
    await expect(flexContainer).toHaveClass(/gap-6/);
  });

  test('left column (chat panel) has flex-1 for flexible width', async ({ page }) => {
    await page.goto('/chat/');
    const chatMain = page.locator('main.mx-auto.max-w-6xl');
    const leftCol = chatMain.locator('> div > div.flex-1').first();
    await expect(leftCol).toBeAttached();
    await expect(leftCol).toHaveClass(/min-w-0/);
  });

  test('chat container is inside the left column', async ({ page }) => {
    await page.goto('/chat/');
    const chatMain = page.locator('main.mx-auto.max-w-6xl');
    const chatContainer = chatMain.locator('.flex-1 #chat-container');
    await expect(chatContainer).toBeVisible();
  });

  test('header with solver link and title is inside left column', async ({ page }) => {
    await page.goto('/chat/');
    const chatMain = page.locator('main.mx-auto.max-w-6xl');
    const solverLink = chatMain.locator('.flex-1 a[href="/"]', { hasText: '← Solver' });
    await expect(solverLink).toBeVisible();
  });

  test('rack input panel is inside the left column', async ({ page }) => {
    await page.goto('/chat/');
    const chatMain = page.locator('main.mx-auto.max-w-6xl');
    const rackPanel = chatMain.locator('.flex-1 #ask-lex-panel');
    await expect(rackPanel).toBeVisible();
  });
});

test.describe('Chat Layout — Negative', () => {
  test('chat page main container does NOT use old max-w-3xl class', async ({ page }) => {
    await page.goto('/chat/');
    // Ensure no main element on this page has the old max-w-3xl constraint
    const oldMain = page.locator('main.mx-auto.max-w-3xl');
    await expect(oldMain).toHaveCount(0);
  });

  test('no duplicate flex layout containers directly under chat main', async ({ page }) => {
    await page.goto('/chat/');
    const chatMain = page.locator('main.mx-auto.max-w-6xl');
    const flexDivs = chatMain.locator('> div.flex');
    const count = await flexDivs.count();
    expect(count).toBe(1);
  });

  test('page does not crash with layout change (no console errors)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 0 } });
    });
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 0 } });
    });

    await page.goto('/chat/');
    await page.waitForTimeout(1000);

    expect(errors.filter((e) => e.includes('critical'))).toHaveLength(0);
  });

  test('chat form still works inside new layout structure', async ({ page }) => {
    await page.route('/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 0 } });
    });
    await page.route('/api/site-status/', async (route) => {
      await route.fulfill({ json: { chatusage: 0 } });
    });

    await page.goto('/chat/');
    const chatInput = page.locator('#chat-input');
    await expect(chatInput).toBeVisible();
    await expect(chatInput).toBeEnabled();
    const sendBtn = page.locator('#send-btn');
    await expect(sendBtn).toBeVisible();
  });
});
