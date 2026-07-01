import { test, expect } from '@playwright/test';

/**
 * Ask Lex AI Tile — Homepage feature tests
 *
 * Tests the "Ask Lex AI" button/tile in the solver toolbar,
 * including the enlarged avatar that appears on hover.
 */

const BASE = process.env.SWF_TEST_URL || 'http://localhost:4321';

test.describe('Ask Lex AI Tile — Positive', () => {
  test('Ask Lex AI tile exists on homepage', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const tile = page.locator('#ask-lex-tile');
    await expect(tile).toHaveCount(1);
  });

  test('Ask Lex AI tile links to /chat/', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const tile = page.locator('#ask-lex-tile');
    await expect(tile).toHaveAttribute('href', '/chat/');
  });

  test('Ask Lex AI tile has correct label text', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const label = page.locator('#ask-lex-tile span.text-sm');
    await expect(label).toHaveText('Ask Lex AI');
  });

  test('small Lex avatar (20px) is present in the tile', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const smallAvatar = page.locator('#ask-lex-tile img[width="20"]');
    await expect(smallAvatar).toHaveCount(1);
    await expect(smallAvatar).toHaveAttribute('alt', 'Lex');
  });

  test('hover avatar image exists with 160x160 dimensions', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const hoverAvatar = page.locator('#ask-lex-tile img[width="160"]');
    await expect(hoverAvatar).toHaveCount(1);
    await expect(hoverAvatar).toHaveAttribute('height', '160');
    await expect(hoverAvatar).toHaveAttribute('alt', 'Lex AI');
  });

  test('hover avatar uses lex-avatar-lg.webp source', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const hoverAvatar = page.locator('#ask-lex-tile img[width="160"]');
    await expect(hoverAvatar).toHaveAttribute('src', '/lex-avatar-lg.webp');
  });

  test('hover avatar has pointer-events-none class', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const hoverAvatar = page.locator('#ask-lex-tile img[width="160"]');
    const classes = await hoverAvatar.getAttribute('class');
    expect(classes).toContain('pointer-events-none');
  });

  test('hover avatar has opacity-0 by default (hidden until hover)', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const hoverAvatar = page.locator('#ask-lex-tile img[width="160"]');
    const classes = await hoverAvatar.getAttribute('class');
    expect(classes).toContain('opacity-0');
    expect(classes).toContain('group-hover:opacity-100');
  });

  test('hover avatar is positioned just above the button (bottom-full)', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const hoverAvatar = page.locator('#ask-lex-tile img[width="160"]');
    const classes = await hoverAvatar.getAttribute('class');
    expect(classes).toContain('bottom-full');
  });
});

test.describe('Ask Lex AI Tile — Negative', () => {
  test('no duplicate Ask Lex tiles on homepage', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const tiles = page.locator('#ask-lex-tile');
    await expect(tiles).toHaveCount(1);
  });

  test('hover avatar does not have old 80px width (regression)', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const oldSizeAvatar = page.locator('#ask-lex-tile img[width="80"]');
    await expect(oldSizeAvatar).toHaveCount(0);
  });

  test('tile does not cause page errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(`${BASE}/`);
    await page.locator('#ask-lex-tile').waitFor({ state: 'attached' });
    expect(errors.filter((e) => e.toLowerCase().includes('lex'))).toHaveLength(0);
  });

  test('tile has accessible title attribute', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const tile = page.locator('#ask-lex-tile');
    await expect(tile).toHaveAttribute('title', 'Ask Lex AI for strategy help');
  });
});
