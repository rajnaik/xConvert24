import { test, expect } from '@playwright/test';

/**
 * Ask Lex Tile Visibility — Always Visible (no conditional hiding)
 *
 * As of v1.13, the Ask Lex tile is ALWAYS visible on the homepage
 * regardless of AI health status or solver input length.
 * The conditional hiding (heartbeat check + 3-letter minimum) was removed.
 *
 * File changed: src/pages/index.astro
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Ask Lex Tile Visibility — Positive', () => {
  test('tile is visible immediately on page load without any input', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const lexTile = page.locator('#ask-lex-tile');
    await expect(lexTile).toBeVisible();
  });

  test('tile remains visible with empty solver input', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const solver = page.locator('#text-solver');
    await solver.fill('');
    await solver.dispatchEvent('input');

    const lexTile = page.locator('#ask-lex-tile');
    await expect(lexTile).toBeVisible();
  });

  test('tile remains visible with letters typed in solver', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const solver = page.locator('#text-solver');
    await solver.fill('QUARTZ');
    await solver.dispatchEvent('input');

    const lexTile = page.locator('#ask-lex-tile');
    await expect(lexTile).toBeVisible();
  });

  test('tile is visible even if chat-heartbeat API fails', async ({ page }) => {
    // Block heartbeat endpoint to simulate AI being down
    await page.route('**/api/chat-heartbeat/', async (route) => {
      await route.abort('connectionrefused');
    });

    await page.goto(`${BASE}/`);
    const lexTile = page.locator('#ask-lex-tile');
    await expect(lexTile).toBeVisible();
  });
});

test.describe('Ask Lex Tile Visibility — Negative', () => {
  test('tile does not have display:none style on load', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const lexTile = page.locator('#ask-lex-tile');
    const display = await lexTile.evaluate((el) => window.getComputedStyle(el).display);
    expect(display).not.toBe('none');
  });

  test('no heartbeat fetch is made for visibility purposes', async ({ page }) => {
    let heartbeatCalled = false;
    await page.route('**/api/chat-heartbeat/', async (route) => {
      heartbeatCalled = true;
      await route.fulfill({ json: { healthy: false, chatusage: 0 } });
    });

    await page.goto(`${BASE}/`);
    const lexTile = page.locator('#ask-lex-tile');
    await expect(lexTile).toBeVisible();

    // Tile visibility should NOT depend on heartbeat anymore
    // (heartbeat may still be called for other purposes, but tile shouldn't hide)
    expect(heartbeatCalled).toBe(false);
  });

  test('tile does not hide when solver has fewer than 3 letters', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const solver = page.locator('#text-solver');
    const lexTile = page.locator('#ask-lex-tile');

    // 1 letter — tile should stay visible
    await solver.fill('A');
    await solver.dispatchEvent('input');
    await expect(lexTile).toBeVisible();

    // 2 letters — tile should stay visible
    await solver.fill('AB');
    await solver.dispatchEvent('input');
    await expect(lexTile).toBeVisible();
  });

  test('no page errors caused by the Ask Lex tile script', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(`${BASE}/`);
    const lexTile = page.locator('#ask-lex-tile');
    await expect(lexTile).toBeVisible();

    expect(errors.filter((e) => e.toLowerCase().includes('lex'))).toHaveLength(0);
  });
});
