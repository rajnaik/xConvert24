import { test, expect } from '@playwright/test';

/**
 * Ask Lex Tile Visibility — Conditional Display on Solver Page
 *
 * The Ask Lex tile should only be visible when:
 * 1. The AI binding is healthy (chat-heartbeat returns healthy: true)
 * 2. The solver textbox has 3 or more letters
 *
 * File changed: src/pages/index.astro
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Ask Lex Tile Visibility — Positive', () => {
  test('tile appears when AI is healthy and 3+ letters typed', async ({ page }) => {
    // Mock heartbeat as healthy
    await page.route('**/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 5 } });
    });

    await page.goto(`${BASE}/`);
    const lexTile = page.locator('#ask-lex-tile');

    // Initially hidden (no letters)
    await expect(lexTile).toBeHidden();

    // Type 3 letters
    const solver = page.locator('#text-solver');
    await solver.fill('ABC');
    await solver.dispatchEvent('input');

    // Now visible
    await expect(lexTile).toBeVisible();
  });

  test('tile stays visible as more letters are added', async ({ page }) => {
    await page.route('**/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 0 } });
    });

    await page.goto(`${BASE}/`);
    const solver = page.locator('#text-solver');
    const lexTile = page.locator('#ask-lex-tile');

    await solver.fill('QUARTZ');
    await solver.dispatchEvent('input');

    await expect(lexTile).toBeVisible();
  });

  test('tile navigates to /chat/?rack= with letters on click', async ({ page }) => {
    await page.route('**/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 0 } });
    });
    // Intercept navigation to /chat/
    await page.route('**/chat/**', async (route) => {
      await route.fulfill({ body: '<html><body>Chat Page</body></html>' });
    });

    await page.goto(`${BASE}/`);
    const solver = page.locator('#text-solver');
    await solver.fill('AEILNRT');
    await solver.dispatchEvent('input');

    const lexTile = page.locator('#ask-lex-tile');
    await expect(lexTile).toBeVisible();

    await lexTile.click();
    await page.waitForURL(/\/chat\/\?rack=AEILNRT/);
  });
});

test.describe('Ask Lex Tile Visibility — Negative', () => {
  test('tile is hidden when AI is offline (healthy: false)', async ({ page }) => {
    await page.route('**/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: false, chatusage: 0, reason: 'AI binding not configured' } });
    });

    await page.goto(`${BASE}/`);
    const solver = page.locator('#text-solver');
    await solver.fill('ABCDEFG');
    await solver.dispatchEvent('input');

    const lexTile = page.locator('#ask-lex-tile');
    await expect(lexTile).toBeHidden();
  });

  test('tile is hidden when heartbeat fetch fails (network error)', async ({ page }) => {
    await page.route('**/api/chat-heartbeat/', async (route) => {
      await route.abort('connectionrefused');
    });

    await page.goto(`${BASE}/`);
    const solver = page.locator('#text-solver');
    await solver.fill('HELLO');
    await solver.dispatchEvent('input');

    const lexTile = page.locator('#ask-lex-tile');
    await expect(lexTile).toBeHidden();
  });

  test('tile is hidden when fewer than 3 letters even with healthy AI', async ({ page }) => {
    await page.route('**/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 0 } });
    });

    await page.goto(`${BASE}/`);
    const solver = page.locator('#text-solver');
    const lexTile = page.locator('#ask-lex-tile');

    // 0 letters
    await expect(lexTile).toBeHidden();

    // 1 letter
    await solver.fill('A');
    await solver.dispatchEvent('input');
    await expect(lexTile).toBeHidden();

    // 2 letters
    await solver.fill('AB');
    await solver.dispatchEvent('input');
    await expect(lexTile).toBeHidden();
  });

  test('tile hides again when letters are cleared below 3', async ({ page }) => {
    await page.route('**/api/chat-heartbeat/', async (route) => {
      await route.fulfill({ json: { healthy: true, chatusage: 0 } });
    });

    await page.goto(`${BASE}/`);
    const solver = page.locator('#text-solver');
    const lexTile = page.locator('#ask-lex-tile');

    // Type enough to show
    await solver.fill('HELLO');
    await solver.dispatchEvent('input');
    await expect(lexTile).toBeVisible();

    // Clear to 2 letters
    await solver.fill('HE');
    await solver.dispatchEvent('input');
    await expect(lexTile).toBeHidden();
  });
});
